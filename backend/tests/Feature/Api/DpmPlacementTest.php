<?php

namespace Tests\Feature\Api;

use App\Enums\ApplicationStatus;
use App\Models\DpmPlacement;
use App\Models\InternshipApplication;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DpmPlacementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_and_prodi_can_list_only_dpm_accounts_as_candidates(): void
    {
        $dpmA = User::factory()->create(['role' => 'dpm', 'name' => 'Dosen A']);
        $dpmB = User::factory()->create(['role' => 'dpm', 'name' => 'Dosen B']);
        User::factory()->create(['role' => 'mahasiswa', 'name' => 'Mahasiswa']);
        User::factory()->create(['role' => 'admin', 'name' => 'Admin']);

        foreach (['admin', 'prodi'] as $role) {
            $reviewer = User::factory()->create(['role' => $role]);

            $this->actingAs($reviewer, 'sanctum')
                ->getJson('/api/admin/dpm-options')
                ->assertOk()
                ->assertJsonPath('success', true)
                ->assertJsonCount(2, 'data')
                ->assertJsonFragment(['id' => $dpmA->id, 'name' => 'Dosen A'])
                ->assertJsonFragment(['id' => $dpmB->id, 'name' => 'Dosen B'])
                ->assertJsonMissing(['name' => 'Mahasiswa'])
                ->assertJsonMissing(['name' => 'Admin']);
        }
    }

    public function test_admin_and_prodi_can_place_a_dpm_for_an_accepted_application(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $dpm = User::factory()->create(['role' => 'dpm']);
        $application = $this->acceptedApplicationFor($student);

        foreach (['admin', 'prodi'] as $role) {
            $reviewer = User::factory()->create(['role' => $role]);
            $application->dpmPlacement()->delete();

            $this->actingAs($reviewer, 'sanctum')
                ->putJson(
                    "/api/admin/applications/{$application->id}/dpm",
                    ['dpm_id' => $dpm->id],
                )
                ->assertCreated()
                ->assertJsonPath('success', true)
                ->assertJsonPath(
                    'message',
                    'Dosen pembimbing magang berhasil ditetapkan.',
                )
                ->assertJsonPath('data.dpm_placement.dpm.id', $dpm->id)
                ->assertJsonPath('data.dpm_placement.dpm.name', $dpm->name);

            $this->assertDatabaseHas('dpm_placements', [
                'internship_application_id' => $application->id,
                'dpm_id' => $dpm->id,
                'assigned_by' => $reviewer->id,
            ]);
        }
    }

    public function test_dpm_can_only_be_placed_for_accepted_applications(): void
    {
        $reviewer = User::factory()->create(['role' => 'admin']);
        $dpm = User::factory()->create(['role' => 'dpm']);
        $student = User::factory()->create(['role' => 'mahasiswa']);

        foreach ([ApplicationStatus::Menunggu, ApplicationStatus::Ditolak] as $status) {
            $application = InternshipApplication::factory()->create([
                'user_id' => $student->id,
                'partner_id' => Partner::factory(),
                'status' => $status,
            ]);

            $this->actingAs($reviewer, 'sanctum')
                ->putJson(
                    "/api/admin/applications/{$application->id}/dpm",
                    ['dpm_id' => $dpm->id],
                )
                ->assertStatus(409)
                ->assertJsonPath('success', false);
        }

        $this->assertDatabaseCount('dpm_placements', 0);
    }

    public function test_placement_validates_that_the_selected_user_has_the_dpm_role(): void
    {
        $reviewer = User::factory()->create(['role' => 'admin']);
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $admin = User::factory()->create(['role' => 'admin']);
        $application = $this->acceptedApplicationFor($student);

        foreach ([999999, $student->id, $admin->id, 'bukan-id'] as $invalidDpmId) {
            $this->actingAs($reviewer, 'sanctum')
                ->putJson(
                    "/api/admin/applications/{$application->id}/dpm",
                    ['dpm_id' => $invalidDpmId],
                )
                ->assertUnprocessable()
                ->assertJsonValidationErrors(['dpm_id']);
        }

        $this->actingAs($reviewer, 'sanctum')
            ->putJson(
                "/api/admin/applications/{$application->id}/dpm",
                [],
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['dpm_id']);

        $this->assertDatabaseCount('dpm_placements', 0);
    }

    public function test_client_cannot_override_placement_metadata_or_application_identity(): void
    {
        $reviewer = User::factory()->create(['role' => 'admin']);
        $other = User::factory()->create(['role' => 'admin']);
        $dpm = User::factory()->create(['role' => 'dpm']);
        $application = $this->acceptedApplicationFor(
            User::factory()->create(['role' => 'mahasiswa']),
        );

        $this->actingAs($reviewer, 'sanctum')
            ->putJson(
                "/api/admin/applications/{$application->id}/dpm",
                [
                    'dpm_id' => $dpm->id,
                    'internship_application_id' => 999999,
                    'user_id' => $other->id,
                    'status' => 'ditolak',
                    'assigned_by' => $other->id,
                    'assigned_at' => '2020-01-01T00:00:00Z',
                ],
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'internship_application_id',
                'user_id',
                'status',
                'assigned_by',
                'assigned_at',
            ]);

        $this->assertDatabaseCount('dpm_placements', 0);
    }

    public function test_existing_placement_cannot_be_replaced_until_policy_is_decided(): void
    {
        $reviewer = User::factory()->create(['role' => 'admin']);
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $application = $this->acceptedApplicationFor($student);
        $firstDpm = User::factory()->create(['role' => 'dpm']);
        $secondDpm = User::factory()->create(['role' => 'dpm']);
        $placement = DpmPlacement::factory()->create([
            'internship_application_id' => $application->id,
            'dpm_id' => $firstDpm->id,
            'assigned_by' => $reviewer->id,
        ]);

        $this->actingAs($reviewer, 'sanctum')
            ->putJson(
                "/api/admin/applications/{$application->id}/dpm",
                ['dpm_id' => $secondDpm->id],
            )
            ->assertStatus(409)
            ->assertJsonPath('success', false);

        $this->assertSame($firstDpm->id, $placement->fresh()->dpm_id);
        $this->assertSame(1, DpmPlacement::query()->count());
    }

    public function test_mahasiswa_and_dpm_cannot_manage_placements(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $dpm = User::factory()->create(['role' => 'dpm']);
        $application = $this->acceptedApplicationFor($student);

        $this->getJson('/api/admin/dpm-options')->assertUnauthorized();
        $this->putJson(
            "/api/admin/applications/{$application->id}/dpm",
            ['dpm_id' => $dpm->id],
        )->assertUnauthorized();

        foreach (['mahasiswa', 'dpm'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/admin/dpm-options')
                ->assertForbidden();

            $this->actingAs($user, 'sanctum')
                ->putJson(
                    "/api/admin/applications/{$application->id}/dpm",
                    ['dpm_id' => $dpm->id],
                )
                ->assertForbidden();
        }

        $this->assertDatabaseCount('dpm_placements', 0);
    }

    public function test_mahasiswa_only_sees_their_own_placement(): void
    {
        $first = User::factory()->create(['role' => 'mahasiswa']);
        $second = User::factory()->create(['role' => 'mahasiswa']);
        $firstDpm = User::factory()->create(['role' => 'dpm', 'name' => 'Dosen Satu']);
        $secondDpm = User::factory()->create(['role' => 'dpm', 'name' => 'Dosen Dua']);
        $reviewer = User::factory()->create(['role' => 'admin']);

        $firstApplication = $this->acceptedApplicationFor($first);
        $secondApplication = $this->acceptedApplicationFor($second);

        DpmPlacement::factory()->create([
            'internship_application_id' => $firstApplication->id,
            'dpm_id' => $firstDpm->id,
            'assigned_by' => $reviewer->id,
        ]);
        DpmPlacement::factory()->create([
            'internship_application_id' => $secondApplication->id,
            'dpm_id' => $secondDpm->id,
            'assigned_by' => $reviewer->id,
        ]);

        $this->actingAs($first, 'sanctum')
            ->getJson('/api/mahasiswa/applications')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $firstApplication->id)
            ->assertJsonPath('data.0.dpm_placement.dpm.name', 'Dosen Satu');

        $this->actingAs($first, 'sanctum')
            ->getJson("/api/mahasiswa/applications/{$firstApplication->id}")
            ->assertOk()
            ->assertJsonPath('data.dpm_placement.dpm.id', $firstDpm->id);

        $this->actingAs($first, 'sanctum')
            ->getJson("/api/mahasiswa/applications/{$secondApplication->id}")
            ->assertNotFound();
    }

    public function test_missing_application_returns_not_found(): void
    {
        $reviewer = User::factory()->create(['role' => 'admin']);
        $dpm = User::factory()->create(['role' => 'dpm']);

        $this->actingAs($reviewer, 'sanctum')
            ->putJson('/api/admin/applications/999999/dpm', [
                'dpm_id' => $dpm->id,
            ])
            ->assertNotFound();
    }

    public function test_dpm_account_with_a_placement_cannot_be_deleted(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $dpm = User::factory()->create(['role' => 'dpm']);
        $application = $this->acceptedApplicationFor($student);

        DpmPlacement::factory()->create([
            'internship_application_id' => $application->id,
            'dpm_id' => $dpm->id,
        ]);

        $this->expectException(QueryException::class);

        $dpm->delete();
    }

    public function test_deleting_application_removes_its_placement(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $application = $this->acceptedApplicationFor($student);
        $placement = DpmPlacement::factory()->create([
            'internship_application_id' => $application->id,
        ]);

        $application->delete();

        $this->assertDatabaseMissing('dpm_placements', [
            'id' => $placement->id,
        ]);
    }

    public function test_database_enforces_one_placement_per_application(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $application = $this->acceptedApplicationFor($student);

        DpmPlacement::factory()->create([
            'internship_application_id' => $application->id,
        ]);

        $this->expectException(QueryException::class);

        DpmPlacement::factory()->create([
            'internship_application_id' => $application->id,
        ]);
    }

    private function acceptedApplicationFor(
        User $student,
    ): InternshipApplication {
        $reviewer = User::factory()->create(['role' => 'admin']);

        return InternshipApplication::factory()->create([
            'user_id' => $student->id,
            'partner_id' => Partner::factory(),
            'status' => ApplicationStatus::Diterima,
            'reviewed_at' => now(),
            'reviewed_by' => $reviewer->id,
        ]);
    }
}
