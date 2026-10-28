<?php

namespace Tests\Feature\Api;

use App\Models\ApplicationCommunication;
use App\Models\InternshipApplication;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Alur BPMN utama dari sisi pengguna: mahasiswa mengajukan magang,
 * Admin/Prodi mencatat keputusan, mahasiswa mengunggah surat penerimaan,
 * Admin/Prodi menetapkan DPM, lalu DPM melihat mahasiswa bimbingannya.
 *
 * Test ini memakai token login sungguhan (bukan actingAs) agar jalur
 * autentikasi yang dipakai frontend ikut terverifikasi.
 */
class InternshipWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_accepted_student_is_visible_to_the_assigned_dpm_only(): void
    {
        Storage::fake('local');

        $student = User::factory()->create([
            'name' => 'Siti Rahma',
            'email' => 'siti@example.test',
            'role' => 'mahasiswa',
        ]);
        $admin = User::factory()->create([
            'name' => 'Admin SPK',
            'email' => 'admin@example.test',
            'role' => 'admin',
        ]);
        $dpm = User::factory()->create([
            'name' => 'Dosen Pembimbing',
            'email' => 'dpm@example.test',
            'role' => 'dpm',
        ]);
        $otherDpm = User::factory()->create([
            'name' => 'Dosen Lain',
            'email' => 'dpm-lain@example.test',
            'role' => 'dpm',
        ]);
        $partner = Partner::factory()->create(['name' => 'PT Maju']);

        $studentToken = $this->loginToken($student->email, 'mahasiswa');
        $adminToken = $this->loginToken($admin->email, 'admin');
        $dpmToken = $this->loginToken($dpm->email, 'dpm');
        $otherDpmToken = $this->loginToken($otherDpm->email, 'dpm');

        // 1. Mahasiswa melihat mitra dan mengajukan magang.
        $this->api($studentToken)
            ->getJson('/api/mahasiswa/partner-options')
            ->assertOk()
            ->assertJsonFragment(['id' => $partner->id, 'name' => 'PT Maju']);

        $applicationResponse = $this->api($studentToken)
            ->postJson('/api/mahasiswa/applications', [
                'partner_id' => $partner->id,
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'menunggu');

        $applicationId = $applicationResponse->json('data.id');

        // 2. Mahasiswa belum dapat mengunggah surat sebelum diterima.
        $this->api($studentToken)
            ->postJson(
                "/api/mahasiswa/applications/{$applicationId}/acceptance-letter",
                ['file' => UploadedFile::fake()->create(
                    'surat.pdf',
                    100,
                    'application/pdf',
                )],
            )
            ->assertStatus(409);

        // 3. Admin mencatat keputusan Diterima.
        $this->api($adminToken)
            ->getJson('/api/admin/applications')
            ->assertOk()
            ->assertJsonPath('data.0.id', $applicationId);

        $this->api($adminToken)
            ->patchJson(
                "/api/admin/applications/{$applicationId}/status",
                [
                    'status' => 'diterima',
                    'review_note' => 'Lolos seleksi mitra.',
                ],
            )
            ->assertOk()
            ->assertJsonPath('data.status', 'diterima');

        // 4. Mahasiswa mengunggah surat penerimaan.
        $this->api($studentToken)
            ->post(
                "/api/mahasiswa/applications/{$applicationId}/acceptance-letter",
                ['file' => UploadedFile::fake()->create(
                    'surat-penerimaan.pdf',
                    100,
                    'application/pdf',
                )],
            )
            ->assertCreated()
            ->assertJsonPath(
                'data.acceptance_letter.original_name',
                'surat-penerimaan.pdf',
            );

        // 5. Admin melihat kandidat DPM lalu menetapkan DPM.
        $this->api($adminToken)
            ->getJson('/api/admin/dpm-options')
            ->assertOk()
            ->assertJsonFragment(['id' => $dpm->id, 'name' => $dpm->name]);

        $this->api($adminToken)
            ->putJson(
                "/api/admin/applications/{$applicationId}/dpm",
                ['dpm_id' => $dpm->id],
            )
            ->assertCreated()
            ->assertJsonPath('data.dpm_placement.dpm.id', $dpm->id);

        // 6. DPM melihat mahasiswa bimbingannya sendiri.
        $this->api($dpmToken)
            ->getJson('/api/dpm/applications')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $applicationId)
            ->assertJsonPath('data.0.student.name', 'Siti Rahma')
            ->assertJsonPath('data.0.partner.name', 'PT Maju')
            ->assertJsonPath('data.0.dpm_placement.dpm.id', $dpm->id)
            ->assertJsonPath(
                'data.0.acceptance_letter.original_name',
                'surat-penerimaan.pdf',
            );

        // 7. DPM lain tidak melihat mahasiswa tersebut.
        $this->api($otherDpmToken)
            ->getJson('/api/dpm/applications')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        // 8. Mahasiswa tidak dapat membuka endpoint DPM.
        $this->api($studentToken)
            ->getJson('/api/dpm/applications')
            ->assertForbidden();

        // 9. Mahasiswa melihat DPM yang ditetapkan pada pengajuannya.
        $this->api($studentToken)
            ->getJson("/api/mahasiswa/applications/{$applicationId}")
            ->assertOk()
            ->assertJsonPath('data.dpm_placement.dpm.id', $dpm->id);
    }

    public function test_role_boundaries_and_status_stay_consistent_across_the_full_workflow(): void
    {
        Storage::fake('local');

        $owner = User::factory()->create([
            'name' => 'Pemilik Pengajuan',
            'email' => 'pemilik@example.test',
            'role' => 'mahasiswa',
        ]);
        $otherStudent = User::factory()->create([
            'name' => 'Mahasiswa Lain',
            'email' => 'mahasiswa-lain@example.test',
            'role' => 'mahasiswa',
        ]);
        $admin = User::factory()->create([
            'name' => 'Admin Pengajuan',
            'email' => 'admin-pengajuan@example.test',
            'role' => 'admin',
        ]);
        $prodi = User::factory()->create([
            'name' => 'Prodi Pengajuan',
            'email' => 'prodi-pengajuan@example.test',
            'role' => 'prodi',
        ]);
        $dpm = User::factory()->create([
            'name' => 'DPM Utama',
            'email' => 'dpm-utama@example.test',
            'role' => 'dpm',
        ]);
        $otherDpm = User::factory()->create([
            'name' => 'DPM Lain',
            'email' => 'dpm-lain@example.test',
            'role' => 'dpm',
        ]);
        $partner = Partner::factory()->create([
            'name' => 'CV Batas Akses',
            'email' => 'mitra@example.test',
        ]);

        // The login endpoint is rate limited to five attempts per minute.
        // Tests exercise six real login tokens, so clear the array cache
        // between logins instead of disabling the production middleware.
        $login = function (User $user): string {
            Cache::flush();

            return $this->loginToken($user->email, $user->role);
        };

        $ownerToken = $login($owner);
        $otherStudentToken = $login($otherStudent);
        $adminToken = $login($admin);
        $prodiToken = $login($prodi);
        $dpmToken = $login($dpm);
        $otherDpmToken = $login($otherDpm);

        $ownerApplicationId = $this->api($ownerToken)
            ->postJson('/api/mahasiswa/applications', [
                'partner_id' => $partner->id,
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'menunggu')
            ->json('data.id');

        $otherApplicationId = $this->api($otherStudentToken)
            ->postJson('/api/mahasiswa/applications', [
                'partner_id' => $partner->id,
            ])
            ->assertCreated()
            ->json('data.id');

        // Ownership is enforced against the authenticated token, including
        // reads and document writes, not only the visible list.
        $this->api($ownerToken)
            ->getJson('/api/mahasiswa/applications')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ownerApplicationId);

        $this->api($otherStudentToken)
            ->getJson('/api/mahasiswa/applications')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $otherApplicationId);

        $this->api($otherStudentToken)
            ->getJson("/api/mahasiswa/applications/{$ownerApplicationId}")
            ->assertNotFound();

        $this->api($otherStudentToken)
            ->postJson(
                "/api/mahasiswa/applications/{$ownerApplicationId}/acceptance-letter",
                ['file' => UploadedFile::fake()->create(
                    'surat.pdf',
                    80,
                    'application/pdf',
                )],
            )
            ->assertNotFound();

        // Admin records an outbound communication while the application is
        // still pending. The application status and reviewer metadata must not
        // change as a side effect.
        $this->api($adminToken)
            ->postJson(
                "/api/admin/applications/{$ownerApplicationId}/communications",
                [
                    'direction' => 'outbound',
                    'channel' => 'email',
                    'occurred_at' => '2026-10-22T09:30:00+07:00',
                    'summary' => 'Berkas dikirim ke email resmi mitra.',
                ],
            )
            ->assertCreated()
            ->assertJsonPath('data.recorded_by', $admin->id);

        $this->api($adminToken)
            ->getJson("/api/admin/applications/{$ownerApplicationId}")
            ->assertOk()
            ->assertJsonPath('data.status', 'menunggu')
            ->assertJsonPath('data.reviewed_by', null)
            ->assertJsonPath('data.reviewed_at', null);

        foreach ([$ownerToken, $otherStudentToken, $dpmToken] as $token) {
            $this->api($token)
                ->getJson(
                    "/api/admin/applications/{$ownerApplicationId}/communications",
                )
                ->assertForbidden();

            $this->api($token)
                ->postJson(
                    "/api/admin/applications/{$ownerApplicationId}/communications",
                    [
                        'direction' => 'inbound',
                        'channel' => 'email',
                        'occurred_at' => now()->toIso8601String(),
                        'summary' => 'Tidak boleh dicatat.',
                    ],
                )
                ->assertForbidden();
        }

        $decision = $this->api($adminToken)
            ->patchJson(
                "/api/admin/applications/{$ownerApplicationId}/status",
                [
                    'status' => 'diterima',
                    'review_note' => 'Lolos seleksi mitra.',
                ],
            )
            ->assertOk()
            ->assertJsonPath('data.status', 'diterima')
            ->assertJsonPath('data.reviewed_by', $admin->id);

        $reviewedAt = $decision->json('data.reviewed_at');

        // Prodi uses the same currently implemented shared review route. A
        // later communication must not overwrite the original decision.
        $this->api($prodiToken)
            ->postJson(
                "/api/admin/applications/{$ownerApplicationId}/communications",
                [
                    'direction' => 'inbound',
                    'channel' => 'surat',
                    'occurred_at' => '2026-10-23T10:00:00+07:00',
                    'summary' => 'Balasan penerimaan mitra diterima.',
                ],
            )
            ->assertCreated()
            ->assertJsonPath('data.recorded_by', $prodi->id);

        $this->api($adminToken)
            ->getJson("/api/admin/applications/{$ownerApplicationId}")
            ->assertOk()
            ->assertJsonPath('data.status', 'diterima')
            ->assertJsonPath('data.reviewed_by', $admin->id)
            ->assertJsonPath('data.reviewed_at', $reviewedAt);

        $this->api($adminToken)
            ->getJson(
                "/api/admin/applications/{$ownerApplicationId}/communications",
            )
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.direction', 'inbound')
            ->assertJsonPath('data.1.direction', 'outbound');

        // The owner uploads the letter after acceptance; another student can
        // neither upload nor read it even with a valid bearer token.
        $this->api($otherStudentToken)
            ->post(
                "/api/mahasiswa/applications/{$ownerApplicationId}/acceptance-letter",
                ['file' => UploadedFile::fake()->create(
                    'surat-penerimaan.pdf',
                    120,
                    'application/pdf',
                )],
            )
            ->assertNotFound();

        $this->api($ownerToken)
            ->post(
                "/api/mahasiswa/applications/{$ownerApplicationId}/acceptance-letter",
                ['file' => UploadedFile::fake()->create(
                    'surat-penerimaan.pdf',
                    120,
                    'application/pdf',
                )],
            )
            ->assertCreated()
            ->assertJsonPath(
                'data.acceptance_letter.original_name',
                'surat-penerimaan.pdf',
            )
            ->assertJsonMissingPath('data.acceptance_letter.path')
            ->assertJsonMissingPath('data.acceptance_letter.disk');

        $this->api($otherStudentToken)
            ->get(
                "/api/mahasiswa/applications/{$ownerApplicationId}/acceptance-letter",
            )
            ->assertNotFound();

        $this->api($ownerToken)
            ->get(
                "/api/mahasiswa/applications/{$ownerApplicationId}/acceptance-letter",
            )
            ->assertOk();

        $this->api($prodiToken)
            ->get(
                "/api/admin/applications/{$ownerApplicationId}/acceptance-letter",
            )
            ->assertOk();

        // Admin/Prodi place the accepted student with one DPM.
        $this->api($adminToken)
            ->putJson(
                "/api/admin/applications/{$ownerApplicationId}/dpm",
                ['dpm_id' => $dpm->id],
            )
            ->assertCreated()
            ->assertJsonPath('data.dpm_placement.dpm.id', $dpm->id);

        // The assigned DPM can read both list and detail, but the detail omits
        // internal review notes and communication history.
        $this->api($dpmToken)
            ->getJson('/api/dpm/applications')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ownerApplicationId);

        $this->api($dpmToken)
            ->getJson("/api/dpm/applications/{$ownerApplicationId}")
            ->assertOk()
            ->assertJsonPath('data.id', $ownerApplicationId)
            ->assertJsonPath('data.dpm_placement.dpm.id', $dpm->id)
            ->assertJsonPath(
                'data.acceptance_letter.original_name',
                'surat-penerimaan.pdf',
            )
            ->assertJsonMissingPath('data.review_note')
            ->assertJsonMissingPath('data.reviewed_by')
            ->assertJsonMissingPath('data.communications');

        // A different DPM receives no data and cannot probe the application.
        $this->api($otherDpmToken)
            ->getJson('/api/dpm/applications')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->api($otherDpmToken)
            ->getJson("/api/dpm/applications/{$ownerApplicationId}")
            ->assertNotFound();

        // DPM cannot use the acceptance-letter download route or the shared
        // Admin/Prodi review modules.
        $this->api($dpmToken)
            ->get(
                "/api/admin/applications/{$ownerApplicationId}/acceptance-letter",
            )
            ->assertForbidden();

        $this->api($dpmToken)
            ->getJson('/api/admin/applications')
            ->assertForbidden();

        $this->api($prodiToken)
            ->getJson('/api/dpm/applications')
            ->assertForbidden();

        // Final consistency check against the database: decision metadata is
        // intact and exactly the two manually recorded communications exist.
        $application = InternshipApplication::query()
            ->findOrFail($ownerApplicationId);

        $this->assertSame('diterima', $application->status->value);
        $this->assertSame($admin->id, $application->reviewed_by);
        $this->assertSame(
            $reviewedAt,
            $application->reviewed_at?->toJSON(),
        );
        $this->assertSame(
            2,
            ApplicationCommunication::query()
                ->where('internship_application_id', $ownerApplicationId)
                ->count(),
        );
    }

    /**
     * Request sebagai pemilik token. Guard di-forget agar RequestGuard
     * Sanctum tidak memakai ulang pengguna dari request sebelumnya
     * (perilaku khusus test harness, bukan perilaku HTTP nyata).
     */
    private function api(string $token): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($token);
    }

    private function loginToken(string $email, string $role): string
    {
        $this->app['auth']->forgetGuards();

        $response = $this->postJson('/api/auth/login', [
            'email' => $email,
            'password' => 'password',
        ])->assertOk();

        $token = (string) $response->json('data.token');

        $this->api($token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.role', $role);

        return $token;
    }
}
