<?php

namespace Tests\Feature\Api;

use App\Models\Partner;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
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
