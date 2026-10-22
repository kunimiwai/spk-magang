<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentTest extends TestCase
{
    use RefreshDatabase;

    public function test_mahasiswa_can_view_peminatan_reference(): void
    {
        $user = User::factory()->create(['role' => 'mahasiswa']);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/mahasiswa/peminatan')
            ->assertOk()
            ->assertExactJson([
                'success' => true,
                'message' => 'Referensi peminatan mahasiswa.',
                'data' => [
                    'options' => ['DTA', 'PSI', 'SIA'],
                    'selection_available' => false,
                    'selection_mode' => null,
                    'note' => 'Penyimpanan peminatan belum diaktifkan karena keputusan satu atau lebih peminatan belum ditetapkan (OD-015).',
                ],
            ]);
    }

    public function test_peminatan_reference_reports_enabled_single_mode(): void
    {
        config(['student.peminatan.mode' => 'single']);

        $user = User::factory()->create(['role' => 'mahasiswa']);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/mahasiswa/peminatan')
            ->assertOk()
            ->assertJsonPath('data.selection_available', true)
            ->assertJsonPath('data.selection_mode', 'single')
            ->assertJsonPath(
                'data.note',
                'Pilihan peminatan disimpan sebagai satu pilihan.',
            );
    }

    public function test_peminatan_reference_requires_authentication(): void
    {
        $this->getJson('/api/mahasiswa/peminatan')
            ->assertUnauthorized();
    }

    public function test_mahasiswa_only_endpoint_rejects_other_roles(): void
    {
        foreach (['admin', 'prodi', 'dpm'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/mahasiswa/peminatan')
                ->assertForbidden();
        }
    }
}
