<?php

namespace Tests\Feature\Api;

use App\Models\DpmActivity;
use App\Models\DpmPlacement;
use App\Models\InternshipApplication;
use App\Models\User;
use App\Enums\ApplicationStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DpmActivityTest extends TestCase
{
    use RefreshDatabase;

    private function createPlacementWithDpm(): array
    {
        $dpm = User::factory()->create(['role' => 'dpm']);
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $application = InternshipApplication::factory()->create([
            'user_id' => $student->id,
            'status' => ApplicationStatus::Diterima,
        ]);
        $placement = DpmPlacement::factory()->create([
            'internship_application_id' => $application->id,
            'dpm_id' => $dpm->id,
        ]);

        return [
            'dpm' => $dpm,
            'student' => $student,
            'application' => $application,
            'placement' => $placement,
        ];
    }

    public function test_dpm_can_record_activity_on_own_placement(): void
    {
        $data = $this->createPlacementWithDpm();

        $this->actingAs($data['dpm'], 'sanctum')
            ->postJson(
                "/api/dpm/placements/{$data['placement']->id}/activities",
                [
                    'activity_type' => 'Konsultasi proposal',
                    'description' => 'Membahas struktur proposal magang.',
                    'occurred_at' => now()->toIso8601String(),
                ],
            )
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.activity_type', 'Konsultasi proposal')
            ->assertJsonPath('data.dpm_id', $data['dpm']->id)
            ->assertJsonPath('data.dpm_placement_id', $data['placement']->id);

        $this->assertDatabaseHas('dpm_activities', [
            'dpm_placement_id' => $data['placement']->id,
            'dpm_id' => $data['dpm']->id,
            'activity_type' => 'Konsultasi proposal',
        ]);
    }

    public function test_activity_persists_after_page_reload(): void
    {
        $data = $this->createPlacementWithDpm();

        $this->actingAs($data['dpm'], 'sanctum')
            ->postJson(
                "/api/dpm/placements/{$data['placement']->id}/activities",
                [
                    'activity_type' => 'Review laporan',
                    'description' => 'Menilai laporan mingguan mahasiswa.',
                ],
            )
            ->assertCreated();

        $response = $this->actingAs($data['dpm'], 'sanctum')
            ->getJson('/api/dpm/activities')
            ->assertOk();

        $this->assertArrayHasKey('data', $response->json());
        $this->assertNotEmpty($response->json('data'));
        $this->assertSame(
            'Review laporan',
            $response->json('data.0.activity_type')
        );
    }

    public function test_dpm_cannot_record_activity_on_another_dpms_placement(): void
    {
        $data = $this->createPlacementWithDpm();
        $otherDpm = User::factory()->create(['role' => 'dpm']);

        $this->actingAs($otherDpm, 'sanctum')
            ->postJson(
                "/api/dpm/placements/{$data['placement']->id}/activities",
                [
                    'activity_type' => 'Kegiatan lain',
                    'description' => 'Bukan milik DPM ini.',
                ],
            )
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_dpm_cannot_see_activities_of_another_dpm(): void
    {
        $data = $this->createPlacementWithDpm();
        $otherDpm = User::factory()->create(['role' => 'dpm']);

        $this->actingAs($data['dpm'], 'sanctum')
            ->postJson(
                "/api/dpm/placements/{$data['placement']->id}/activities",
                [
                    'activity_type' => 'Konsultasi',
                    'description' => 'Aktivitas DPM pemilik.',
                ],
            )
            ->assertCreated();

        $response = $this->actingAs($otherDpm, 'sanctum')
            ->getJson('/api/dpm/activities')
            ->assertOk();

        $activities = $response->json('data');
        foreach ($activities as $activity) {
            $this->assertNotSame($data['dpm']->id, $activity['dpm_id']);
        }
    }

    public function test_non_dpm_cannot_record_activity(): void
    {
        $data = $this->createPlacementWithDpm();
        $mahasiswa = User::factory()->create(['role' => 'mahasiswa']);

        $this->actingAs($mahasiswa, 'sanctum')
            ->postJson(
                "/api/dpm/placements/{$data['placement']->id}/activities",
                [
                    'activity_type' => 'Kegiatan mahasiswa',
                    'description' => 'Bukan DPM.',
                ],
            )
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_missing_activity_type_is_rejected(): void
    {
        $data = $this->createPlacementWithDpm();

        $this->actingAs($data['dpm'], 'sanctum')
            ->postJson(
                "/api/dpm/placements/{$data['placement']->id}/activities",
                [
                    'description' => 'Tanpa jenis aktivitas.',
                ],
            )
            ->assertStatus(422)
            ->assertJsonPath('message', 'Jenis aktivitas wajib diisi.');
    }

    public function test_invalid_occurred_at_is_rejected(): void
    {
        $data = $this->createPlacementWithDpm();

        $this->actingAs($data['dpm'], 'sanctum')
            ->postJson(
                "/api/dpm/placements/{$data['placement']->id}/activities",
                [
                    'activity_type' => 'Konsultasi',
                    'occurred_at' => 'bukan-tanggal',
                ],
            )
            ->assertStatus(422)
            ->assertJsonPath('message', 'Waktu aktivitas tidak valid.');
    }

    public function test_dpm_can_view_own_activity_detail(): void
    {
        $data = $this->createPlacementWithDpm();

        $this->actingAs($data['dpm'], 'sanctum')
            ->postJson(
                "/api/dpm/placements/{$data['placement']->id}/activities",
                [
                    'activity_type' => 'Konsultasi',
                    'description' => 'Detail aktivitas.',
                ],
            )
            ->assertCreated();

        $activity = DpmActivity::where('dpm_id', $data['dpm']->id)->first();

        $this->actingAs($data['dpm'], 'sanctum')
            ->getJson("/api/dpm/activities/{$activity->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $activity->id)
            ->assertJsonPath('data.activity_type', 'Konsultasi');
    }

    public function test_dpm_cannot_view_another_dpms_activity(): void
    {
        $data = $this->createPlacementWithDpm();
        $otherDpm = User::factory()->create(['role' => 'dpm']);

        $this->actingAs($data['dpm'], 'sanctum')
            ->postJson(
                "/api/dpm/placements/{$data['placement']->id}/activities",
                [
                    'activity_type' => 'Konsultasi',
                    'description' => 'Aktivitas DPM pemilik.',
                ],
            )
            ->assertCreated();

        $activity = DpmActivity::where('dpm_id', $data['dpm']->id)->first();

        $this->actingAs($otherDpm, 'sanctum')
            ->getJson("/api/dpm/activities/{$activity->id}")
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_admin_can_view_all_activities(): void
    {
        $data = $this->createPlacementWithDpm();
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($data['dpm'], 'sanctum')
            ->postJson(
                "/api/dpm/placements/{$data['placement']->id}/activities",
                [
                    'activity_type' => 'Konsultasi',
                    'description' => 'Aktivitas untuk admin lihat.',
                ],
            )
            ->assertCreated();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/dpm/activities')
            ->assertOk();
    }

    public function test_unauthenticated_cannot_access_activities(): void
    {
        $this->getJson('/api/dpm/activities')->assertUnauthorized();
    }
}
