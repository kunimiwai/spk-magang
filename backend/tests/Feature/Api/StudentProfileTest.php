<?php

namespace Tests\Feature\Api;

use App\Models\StudentPeminatan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_mahasiswa_can_read_an_incomplete_profile(): void
    {
        config(['student.peminatan.mode' => null]);

        $user = User::factory()->create(['role' => 'mahasiswa']);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/mahasiswa/profile')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.peminatan', [])
            ->assertJsonPath('data.peminatan_options', ['DTA', 'PSI', 'SIA'])
            ->assertJsonPath('data.selection_mode', null)
            ->assertJsonPath('data.selection_available', false)
            ->assertJsonPath('data.profile_complete', false)
            ->assertJsonPath(
                'data.selection_note',
                'Penyimpanan peminatan belum diaktifkan karena keputusan satu atau lebih peminatan belum ditetapkan (OD-015).',
            );
    }

    public function test_profile_update_is_blocked_until_cardinality_is_decided(): void
    {
        config(['student.peminatan.mode' => null]);

        $user = User::factory()->create(['role' => 'mahasiswa']);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/mahasiswa/profile', [
                'peminatan' => ['DTA'],
            ])
            ->assertStatus(409)
            ->assertJsonPath('success', false)
            ->assertJsonPath(
                'message',
                'Penyimpanan peminatan belum diaktifkan karena keputusan satu atau lebih peminatan belum ditetapkan (OD-015).',
            )
            ->assertJsonPath('data.peminatan', []);

        $this->assertDatabaseCount('student_peminatan', 0);
    }

    public function test_disabled_profile_update_returns_conflict_for_invalid_body(): void
    {
        config(['student.peminatan.mode' => null]);

        $user = User::factory()->create(['role' => 'mahasiswa']);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/mahasiswa/profile', [
                'peminatan' => ['DTA', 'PSI'],
                'user_id' => 999,
            ])
            ->assertStatus(409)
            ->assertJsonPath('success', false)
            ->assertJsonPath(
                'message',
                'Penyimpanan peminatan belum diaktifkan karena keputusan satu atau lebih peminatan belum ditetapkan (OD-015).',
            );

        $this->assertDatabaseCount('student_peminatan', 0);
    }

    public function test_mahasiswa_can_update_and_replace_single_peminatan(): void
    {
        config(['student.peminatan.mode' => 'single']);

        $user = User::factory()->create(['role' => 'mahasiswa']);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/mahasiswa/profile', [
                'peminatan' => ['DTA'],
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.peminatan', ['DTA'])
            ->assertJsonPath('data.selection_mode', 'single')
            ->assertJsonPath('data.selection_available', true)
            ->assertJsonPath('data.profile_complete', true)
            ->assertJsonPath(
                'data.selection_note',
                'Pilihan peminatan disimpan sebagai satu pilihan.',
            );

        $this->assertDatabaseHas('student_peminatan', [
            'user_id' => $user->id,
            'peminatan' => 'DTA',
        ]);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/mahasiswa/profile', [
                'peminatan' => ['PSI'],
            ])
            ->assertOk()
            ->assertJsonPath('data.peminatan', ['PSI']);

        $this->assertDatabaseMissing('student_peminatan', [
            'user_id' => $user->id,
            'peminatan' => 'DTA',
        ]);
        $this->assertDatabaseHas('student_peminatan', [
            'user_id' => $user->id,
            'peminatan' => 'PSI',
        ]);
        $this->assertDatabaseCount('student_peminatan', 1);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/mahasiswa/profile')
            ->assertOk()
            ->assertJsonPath('data.peminatan', ['PSI'])
            ->assertJsonPath('data.profile_complete', true);
    }

    public function test_peminatan_validation_rejects_invalid_or_multiple_values_in_single_mode(): void
    {
        config(['student.peminatan.mode' => 'single']);

        $user = User::factory()->create(['role' => 'mahasiswa']);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/mahasiswa/profile', [
                'peminatan' => ['XYZ'],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['peminatan.0']);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/mahasiswa/profile', [
                'peminatan' => ['DTA', 'PSI'],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['peminatan']);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/mahasiswa/profile', [
                'peminatan' => [],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['peminatan']);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/mahasiswa/profile', [
                'peminatan' => 'DTA',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['peminatan']);

        $this->assertDatabaseCount('student_peminatan', 0);
    }

    public function test_multiple_mode_stores_multiple_peminatan_without_changing_single_mode_rules(): void
    {
        config(['student.peminatan.mode' => 'multiple']);

        $user = User::factory()->create(['role' => 'mahasiswa']);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/mahasiswa/profile', [
                'peminatan' => ['PSI', 'DTA'],
            ])
            ->assertOk()
            ->assertJsonPath('data.peminatan', ['DTA', 'PSI'])
            ->assertJsonPath('data.selection_mode', 'multiple')
            ->assertJsonPath('data.selection_available', true)
            ->assertJsonPath('data.profile_complete', true);

        $this->assertDatabaseHas('student_peminatan', [
            'user_id' => $user->id,
            'peminatan' => 'DTA',
        ]);
        $this->assertDatabaseHas('student_peminatan', [
            'user_id' => $user->id,
            'peminatan' => 'PSI',
        ]);
        $this->assertDatabaseCount('student_peminatan', 2);
    }

    public function test_profiles_are_isolated_between_mahasiswa(): void
    {
        config(['student.peminatan.mode' => 'single']);

        $first = User::factory()->create(['role' => 'mahasiswa']);
        $second = User::factory()->create(['role' => 'mahasiswa']);

        $this->actingAs($first, 'sanctum')
            ->putJson('/api/mahasiswa/profile', [
                'peminatan' => ['DTA'],
            ])
            ->assertOk();

        $this->actingAs($second, 'sanctum')
            ->getJson('/api/mahasiswa/profile')
            ->assertOk()
            ->assertJsonPath('data.peminatan', [])
            ->assertJsonPath('data.profile_complete', false);

        $this->actingAs($second, 'sanctum')
            ->putJson('/api/mahasiswa/profile', [
                'peminatan' => ['PSI'],
            ])
            ->assertOk();

        $this->actingAs($first, 'sanctum')
            ->getJson('/api/mahasiswa/profile')
            ->assertOk()
            ->assertJsonPath('data.peminatan', ['DTA']);

        $this->actingAs($first, 'sanctum')
            ->putJson('/api/mahasiswa/profile', [
                'peminatan' => ['DTA'],
                'user_id' => $second->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['user_id']);

        $this->assertDatabaseHas('student_peminatan', [
            'user_id' => $first->id,
            'peminatan' => 'DTA',
        ]);
        $this->assertDatabaseHas('student_peminatan', [
            'user_id' => $second->id,
            'peminatan' => 'PSI',
        ]);
    }

    public function test_profile_reads_stored_peminatan_even_when_selection_is_disabled(): void
    {
        config(['student.peminatan.mode' => null]);

        $user = User::factory()->create(['role' => 'mahasiswa']);
        StudentPeminatan::create([
            'user_id' => $user->id,
            'peminatan' => 'SIA',
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/mahasiswa/profile')
            ->assertOk()
            ->assertJsonPath('data.peminatan', ['SIA'])
            ->assertJsonPath('data.profile_complete', true)
            ->assertJsonPath('data.selection_available', false);
    }

    public function test_profile_endpoints_require_authentication(): void
    {
        $this->getJson('/api/mahasiswa/profile')->assertUnauthorized();
        $this->putJson('/api/mahasiswa/profile', [
            'peminatan' => ['DTA'],
        ])->assertUnauthorized();
    }

    public function test_profile_endpoints_reject_other_roles(): void
    {
        config(['student.peminatan.mode' => 'single']);

        foreach (['admin', 'prodi', 'dpm'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/mahasiswa/profile')
                ->assertForbidden();

            $this->actingAs($user, 'sanctum')
                ->putJson('/api/mahasiswa/profile', [
                    'peminatan' => ['DTA'],
                ])
                ->assertForbidden();
        }

        $this->assertDatabaseCount('student_peminatan', 0);
    }
}
