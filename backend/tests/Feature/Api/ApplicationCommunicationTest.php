<?php

namespace Tests\Feature\Api;

use App\Models\ApplicationCommunication;
use App\Models\InternshipApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApplicationCommunicationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_and_prodi_can_record_an_outbound_communication_without_changing_status(): void
    {
        foreach (['admin', 'prodi'] as $role) {
            $reviewer = User::factory()->create(['role' => $role]);
            $application = InternshipApplication::factory()->create([
                'status' => 'menunggu',
            ]);

            $this->actingAs($reviewer, 'sanctum')
                ->postJson(
                    "/api/admin/applications/{$application->id}/communications",
                    [
                        'direction' => 'outbound',
                        'channel' => 'email',
                        'occurred_at' => '2026-10-22T09:30:00+07:00',
                        'summary' => 'Berkas pengajuan dikirim ke email resmi mitra.',
                    ],
                )
                ->assertCreated()
                ->assertJsonPath('success', true)
                ->assertJsonPath('data.direction', 'outbound')
                ->assertJsonPath('data.channel', 'email')
                ->assertJsonPath('data.recorded_by', $reviewer->id)
                ->assertJsonPath('data.recorder.id', $reviewer->id)
                ->assertJsonMissingPath('data.recorder.password');

            $this->assertDatabaseHas('application_communications', [
                'internship_application_id' => $application->id,
                'direction' => 'outbound',
                'channel' => 'email',
                'recorded_by' => $reviewer->id,
            ]);
            $this->assertSame(
                'menunggu',
                $application->fresh()->status->value,
            );
        }
    }

    public function test_occurred_at_with_an_offset_is_stored_as_utc(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $application = InternshipApplication::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->postJson(
                "/api/admin/applications/{$application->id}/communications",
                [
                    'direction' => 'outbound',
                    'channel' => 'email',
                    'occurred_at' => '2026-10-22T09:30:00+07:00',
                    'summary' => 'Berkas dikirim ke mitra.',
                ],
            )
            ->assertCreated()
            ->assertJsonPath(
                'data.occurred_at',
                '2026-10-22T02:30:00.000000Z',
            );

        $this->assertDatabaseHas('application_communications', [
            'internship_application_id' => $application->id,
            'occurred_at' => '2026-10-22 02:30:00',
        ]);
    }

    public function test_admin_can_record_and_list_an_inbound_reply(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $application = InternshipApplication::factory()->create([
            'status' => 'menunggu',
        ]);

        ApplicationCommunication::create([
            'internship_application_id' => $application->id,
            'direction' => 'outbound',
            'channel' => 'surat',
            'occurred_at' => '2026-10-21 08:00:00',
            'summary' => 'Surat pengajuan dikirim.',
            'recorded_by' => $admin->id,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->postJson(
                "/api/admin/applications/{$application->id}/communications",
                [
                    'direction' => 'inbound',
                    'channel' => 'surat',
                    'occurred_at' => '2026-10-23 10:00:00',
                    'summary' => 'Balasan mitra diterima dan discan.',
                ],
            )
            ->assertCreated()
            ->assertJsonPath('data.direction', 'inbound');

        $this->actingAs($admin, 'sanctum')
            ->getJson(
                "/api/admin/applications/{$application->id}/communications",
            )
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.direction', 'inbound')
            ->assertJsonPath('data.1.direction', 'outbound');
    }

    public function test_communication_validation_rejects_unknown_channels_and_metadata_overrides(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $application = InternshipApplication::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->postJson(
                "/api/admin/applications/{$application->id}/communications",
                [
                    'direction' => 'whatsapp',
                    'channel' => 'whatsapp',
                    'occurred_at' => 'bukan tanggal',
                    'summary' => '',
                    'internship_application_id' => 999,
                    'recorded_by' => 999,
                    'created_at' => '2026-10-22 00:00:00',
                    'updated_at' => '2026-10-22 00:00:00',
                ],
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'direction',
                'channel',
                'occurred_at',
                'summary',
                'internship_application_id',
                'recorded_by',
                'created_at',
                'updated_at',
            ]);

        $this->assertDatabaseCount('application_communications', 0);
    }

    public function test_communication_summary_has_a_server_side_length_limit(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $application = InternshipApplication::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->postJson(
                "/api/admin/applications/{$application->id}/communications",
                [
                    'direction' => 'outbound',
                    'channel' => 'email',
                    'occurred_at' => now()->toIso8601String(),
                    'summary' => str_repeat('a', 2001),
                ],
            )
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['summary']);
    }

    public function test_mahasiswa_and_dpm_cannot_access_application_communications(): void
    {
        $application = InternshipApplication::factory()->create();

        foreach (['mahasiswa', 'dpm'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user, 'sanctum')
                ->getJson(
                    "/api/admin/applications/{$application->id}/communications",
                )
                ->assertForbidden();

            $this->actingAs($user, 'sanctum')
                ->postJson(
                    "/api/admin/applications/{$application->id}/communications",
                    [
                        'direction' => 'outbound',
                        'channel' => 'email',
                        'occurred_at' => now()->toIso8601String(),
                        'summary' => 'Tidak boleh.',
                    ],
                )
                ->assertForbidden();
        }
    }

    public function test_communication_endpoints_require_authentication_and_an_existing_application(): void
    {
        $this->getJson('/api/admin/applications/1/communications')
            ->assertUnauthorized();

        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/applications/999/communications')
            ->assertNotFound();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/applications/999/communications', [
                'direction' => 'outbound',
                'channel' => 'email',
                'occurred_at' => now()->toIso8601String(),
                'summary' => 'Pengajuan tidak ada.',
            ])
            ->assertNotFound();
    }

    public function test_student_application_detail_does_not_expose_partner_communications(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $application = InternshipApplication::factory()->create([
            'user_id' => $student->id,
        ]);
        ApplicationCommunication::create([
            'internship_application_id' => $application->id,
            'direction' => 'outbound',
            'channel' => 'email',
            'occurred_at' => now(),
            'summary' => 'Catatan internal komunikasi mitra.',
        ]);

        $this->actingAs($student, 'sanctum')
            ->getJson("/api/mahasiswa/applications/{$application->id}")
            ->assertOk()
            ->assertJsonMissingPath('data.communications')
            ->assertJsonMissing(['summary' => 'Catatan internal komunikasi mitra.']);
    }

    public function test_deleting_an_application_removes_its_communication_history(): void
    {
        $application = InternshipApplication::factory()->create();
        ApplicationCommunication::create([
            'internship_application_id' => $application->id,
            'direction' => 'outbound',
            'channel' => 'email',
            'occurred_at' => now(),
            'summary' => 'Catatan uji.',
        ]);

        $application->delete();

        $this->assertDatabaseCount('application_communications', 0);
    }
}
