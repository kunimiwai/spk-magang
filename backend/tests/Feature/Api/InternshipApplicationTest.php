<?php

namespace Tests\Feature\Api;

use App\Enums\ApplicationStatus;
use App\Models\InternshipApplication;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InternshipApplicationTest extends TestCase
{
    use RefreshDatabase;

    public function test_mahasiswa_can_submit_an_application_for_themselves(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $partner = Partner::factory()->create();

        $response = $this->actingAs($student, 'sanctum')
            ->postJson('/api/mahasiswa/applications', [
                'partner_id' => $partner->id,
            ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Pengajuan magang berhasil dikirim.')
            ->assertJsonPath('data.user_id', $student->id)
            ->assertJsonPath('data.partner_id', $partner->id)
            ->assertJsonPath('data.status', 'menunggu')
            ->assertJsonPath('data.partner.id', $partner->id);

        $this->assertNotNull($response->json('data.submitted_at'));

        $this->assertDatabaseHas('internship_applications', [
            'user_id' => $student->id,
            'partner_id' => $partner->id,
            'status' => 'menunggu',
            'review_note' => null,
            'reviewed_at' => null,
            'reviewed_by' => null,
        ]);
    }

    public function test_application_creation_validates_partner_reference(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);

        $this->actingAs($student, 'sanctum')
            ->postJson('/api/mahasiswa/applications', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['partner_id']);

        $this->actingAs($student, 'sanctum')
            ->postJson('/api/mahasiswa/applications', ['partner_id' => 999999])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['partner_id']);

        $this->actingAs($student, 'sanctum')
            ->postJson('/api/mahasiswa/applications', ['partner_id' => 'bukan-id'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['partner_id']);

        $this->assertDatabaseCount('internship_applications', 0);
    }

    public function test_client_cannot_override_identity_status_or_review_metadata_on_create(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $other = User::factory()->create(['role' => 'mahasiswa']);
        $partner = Partner::factory()->create();

        $this->actingAs($student, 'sanctum')
            ->postJson('/api/mahasiswa/applications', [
                'partner_id' => $partner->id,
                'user_id' => $other->id,
                'status' => 'diterima',
                'submitted_at' => '2020-01-01T00:00:00Z',
                'review_note' => 'Diterima.',
                'reviewed_at' => '2020-01-01T00:00:00Z',
                'reviewed_by' => $other->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'user_id',
                'status',
                'submitted_at',
                'review_note',
                'reviewed_at',
                'reviewed_by',
            ]);

        $this->assertDatabaseCount('internship_applications', 0);
    }

    public function test_mahasiswa_only_lists_and_reads_their_own_applications(): void
    {
        $first = User::factory()->create(['role' => 'mahasiswa']);
        $second = User::factory()->create(['role' => 'mahasiswa']);
        $partner = Partner::factory()->create();

        $own = InternshipApplication::factory()->create([
            'user_id' => $first->id,
            'partner_id' => $partner->id,
        ]);
        $other = InternshipApplication::factory()->create([
            'user_id' => $second->id,
            'partner_id' => $partner->id,
        ]);

        $this->actingAs($first, 'sanctum')
            ->getJson('/api/mahasiswa/applications')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $own->id);

        $this->actingAs($first, 'sanctum')
            ->getJson("/api/mahasiswa/applications/{$own->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $own->id)
            ->assertJsonPath('data.partner.id', $partner->id);

        // Pengajuan milik mahasiswa lain tidak boleh terlihat; respons 404
        // dipakai agar keberadaannya tidak bocor.
        $this->actingAs($first, 'sanctum')
            ->getJson("/api/mahasiswa/applications/{$other->id}")
            ->assertNotFound();
    }

    public function test_student_application_endpoints_require_authentication_and_mahasiswa_role(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $partner = Partner::factory()->create();
        $application = InternshipApplication::factory()->create([
            'user_id' => $student->id,
            'partner_id' => $partner->id,
        ]);

        $this->getJson('/api/mahasiswa/applications')->assertUnauthorized();
        $this->postJson('/api/mahasiswa/applications', ['partner_id' => $partner->id])
            ->assertUnauthorized();
        $this->getJson("/api/mahasiswa/applications/{$application->id}")->assertUnauthorized();
        $this->getJson('/api/mahasiswa/partner-options')->assertUnauthorized();

        foreach (['admin', 'prodi', 'dpm'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/mahasiswa/applications')
                ->assertForbidden();

            $this->actingAs($user, 'sanctum')
                ->postJson('/api/mahasiswa/applications', ['partner_id' => $partner->id])
                ->assertForbidden();

            $this->actingAs($user, 'sanctum')
                ->getJson("/api/mahasiswa/applications/{$application->id}")
                ->assertForbidden();

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/mahasiswa/partner-options')
                ->assertForbidden();
        }

        $this->assertDatabaseCount('internship_applications', 1);
    }

    public function test_admin_and_prodi_can_list_and_read_all_applications(): void
    {
        $studentA = User::factory()->create(['role' => 'mahasiswa']);
        $studentB = User::factory()->create(['role' => 'mahasiswa']);
        $partnerA = Partner::factory()->create();
        $partnerB = Partner::factory()->create();

        $applicationA = InternshipApplication::factory()->create([
            'user_id' => $studentA->id,
            'partner_id' => $partnerA->id,
        ]);
        $applicationB = InternshipApplication::factory()->create([
            'user_id' => $studentB->id,
            'partner_id' => $partnerB->id,
        ]);

        foreach (['admin', 'prodi'] as $role) {
            $reviewer = User::factory()->create(['role' => $role]);

            $this->actingAs($reviewer, 'sanctum')
                ->getJson('/api/admin/applications')
                ->assertOk()
                ->assertJsonCount(2, 'data')
                ->assertJsonFragment(['id' => $applicationA->id])
                ->assertJsonFragment(['id' => $applicationB->id]);

            $this->actingAs($reviewer, 'sanctum')
                ->getJson("/api/admin/applications/{$applicationA->id}")
                ->assertOk()
                ->assertJsonPath('data.student.id', $studentA->id)
                ->assertJsonPath('data.student.email', $studentA->email)
                ->assertJsonPath('data.partner.id', $partnerA->id);
        }
    }

    public function test_admin_and_prodi_endpoints_reject_student_and_dpm_roles(): void
    {
        $application = InternshipApplication::factory()->create();

        $this->getJson('/api/admin/applications')->assertUnauthorized();
        $this->getJson("/api/admin/applications/{$application->id}")->assertUnauthorized();
        $this->patchJson(
            "/api/admin/applications/{$application->id}/status",
            ['status' => 'diterima'],
        )->assertUnauthorized();

        foreach (['mahasiswa', 'dpm'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/admin/applications')
                ->assertForbidden();

            $this->actingAs($user, 'sanctum')
                ->getJson("/api/admin/applications/{$application->id}")
                ->assertForbidden();

            $this->actingAs($user, 'sanctum')
                ->patchJson(
                    "/api/admin/applications/{$application->id}/status",
                    ['status' => 'diterima'],
                )
                ->assertForbidden();
        }

        $this->assertDatabaseHas('internship_applications', [
            'id' => $application->id,
            'status' => 'menunggu',
        ]);
    }

    public function test_admin_and_prodi_can_record_a_decision(): void
    {
        foreach (['admin', 'prodi'] as $role) {
            $reviewer = User::factory()->create(['role' => $role]);
            $application = InternshipApplication::factory()->create();

            $this->actingAs($reviewer, 'sanctum')
                ->patchJson("/api/admin/applications/{$application->id}/status", [
                    'status' => 'diterima',
                    'review_note' => 'Diterima setelah seleksi mitra.',
                ])
                ->assertOk()
                ->assertJsonPath('success', true)
                ->assertJsonPath('message', 'Keputusan pengajuan berhasil disimpan.')
                ->assertJsonPath('data.status', 'diterima')
                ->assertJsonPath('data.review_note', 'Diterima setelah seleksi mitra.')
                ->assertJsonPath('data.reviewer.id', $reviewer->id);

            $this->assertDatabaseHas('internship_applications', [
                'id' => $application->id,
                'status' => 'diterima',
                'review_note' => 'Diterima setelah seleksi mitra.',
                'reviewed_by' => $reviewer->id,
            ]);
            $this->assertNotNull($application->fresh()->reviewed_at);
        }
    }

    public function test_rejection_can_be_recorded_without_a_note(): void
    {
        $reviewer = User::factory()->create(['role' => 'admin']);
        $application = InternshipApplication::factory()->create();

        $this->actingAs($reviewer, 'sanctum')
            ->patchJson("/api/admin/applications/{$application->id}/status", [
                'status' => 'ditolak',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'ditolak')
            ->assertJsonPath('data.review_note', null);

        $this->assertDatabaseHas('internship_applications', [
            'id' => $application->id,
            'status' => 'ditolak',
            'review_note' => null,
        ]);
    }

    public function test_decision_endpoint_validates_status_and_prohibits_metadata(): void
    {
        $reviewer = User::factory()->create(['role' => 'admin']);
        $other = User::factory()->create(['role' => 'admin']);
        $application = InternshipApplication::factory()->create();
        $otherPartner = Partner::factory()->create();

        foreach (['menunggu', 'disetujui', ''] as $status) {
            $this->actingAs($reviewer, 'sanctum')
                ->patchJson("/api/admin/applications/{$application->id}/status", [
                    'status' => $status,
                ])
                ->assertUnprocessable()
                ->assertJsonValidationErrors(['status']);
        }

        $this->actingAs($reviewer, 'sanctum')
            ->patchJson("/api/admin/applications/{$application->id}/status", [
                'status' => 'ditolak',
                'review_note' => str_repeat('a', 5001),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['review_note']);

        $this->actingAs($reviewer, 'sanctum')
            ->patchJson("/api/admin/applications/{$application->id}/status", [
                'status' => 'diterima',
                'user_id' => $other->id,
                'partner_id' => $otherPartner->id,
                'submitted_at' => '2020-01-01T00:00:00Z',
                'reviewed_at' => '2020-01-01T00:00:00Z',
                'reviewed_by' => $other->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'user_id',
                'partner_id',
                'submitted_at',
                'reviewed_at',
                'reviewed_by',
            ]);

        $this->assertDatabaseHas('internship_applications', [
            'id' => $application->id,
            'status' => 'menunggu',
            'review_note' => null,
            'reviewed_by' => null,
        ]);
    }

    public function test_decided_application_cannot_be_decided_again(): void
    {
        $reviewer = User::factory()->create(['role' => 'admin']);
        $application = InternshipApplication::factory()->create([
            'status' => ApplicationStatus::Diterima,
            'review_note' => 'Diterima.',
            'reviewed_at' => now(),
            'reviewed_by' => $reviewer->id,
        ]);

        $this->actingAs($reviewer, 'sanctum')
            ->patchJson("/api/admin/applications/{$application->id}/status", [
                'status' => 'ditolak',
            ])
            ->assertStatus(409)
            ->assertJsonPath('success', false);

        $this->assertDatabaseHas('internship_applications', [
            'id' => $application->id,
            'status' => 'diterima',
            'review_note' => 'Diterima.',
        ]);
    }

    public function test_admin_and_student_application_endpoints_return_not_found_for_missing_resource(): void
    {
        $reviewer = User::factory()->create(['role' => 'admin']);
        $student = User::factory()->create(['role' => 'mahasiswa']);

        $this->actingAs($reviewer, 'sanctum')
            ->getJson('/api/admin/applications/999999')
            ->assertNotFound();

        $this->actingAs($reviewer, 'sanctum')
            ->patchJson('/api/admin/applications/999999/status', ['status' => 'diterima'])
            ->assertNotFound();

        $this->actingAs($student, 'sanctum')
            ->getJson('/api/mahasiswa/applications/999999')
            ->assertNotFound();
    }

    public function test_partner_with_application_cannot_be_deleted(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $partner = Partner::factory()->create();

        InternshipApplication::factory()->create([
            'partner_id' => $partner->id,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/partners/{$partner->id}")
            ->assertStatus(409)
            ->assertJsonPath('success', false);

        $this->assertDatabaseHas('partners', ['id' => $partner->id]);
    }

    public function test_database_rejects_application_with_missing_partner(): void
    {
        $this->expectException(QueryException::class);

        InternshipApplication::factory()->create([
            'partner_id' => 999999,
        ]);
    }

    public function test_deleting_student_cascades_applications_and_deleting_reviewer_clears_reference(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $reviewer = User::factory()->create(['role' => 'admin']);

        $application = InternshipApplication::factory()->create([
            'user_id' => $student->id,
            'status' => ApplicationStatus::Diterima,
            'reviewed_at' => now(),
            'reviewed_by' => $reviewer->id,
        ]);

        $reviewer->delete();

        $this->assertDatabaseHas('internship_applications', [
            'id' => $application->id,
            'reviewed_by' => null,
        ]);

        $student->delete();

        $this->assertDatabaseMissing('internship_applications', [
            'id' => $application->id,
        ]);
    }

    public function test_mahasiswa_can_read_partner_options_for_application_form(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $partnerA = Partner::factory()->create(['name' => 'PT A']);
        $partnerB = Partner::factory()->create(['name' => 'PT B']);

        $this->actingAs($student, 'sanctum')
            ->getJson('/api/mahasiswa/partner-options')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $partnerA->id)
            ->assertJsonPath('data.0.name', 'PT A')
            ->assertJsonPath('data.1.id', $partnerB->id)
            ->assertJsonPath('data.1.name', 'PT B');
    }
}
