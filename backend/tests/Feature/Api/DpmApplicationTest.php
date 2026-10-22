<?php

namespace Tests\Feature\Api;

use App\Models\AcceptanceLetter;
use App\Models\DpmPlacement;
use App\Models\InternshipApplication;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DpmApplicationTest extends TestCase
{
    use RefreshDatabase;

    public function test_dpm_only_sees_applications_assigned_to_them(): void
    {
        $dpm = User::factory()->create(['role' => 'dpm']);
        $otherDpm = User::factory()->create(['role' => 'dpm']);
        $reviewer = User::factory()->create(['role' => 'admin']);

        $assignedStudent = User::factory()->create([
            'role' => 'mahasiswa',
            'name' => 'Mahasiswa Bimbingan',
        ]);
        $otherStudent = User::factory()->create([
            'role' => 'mahasiswa',
            'name' => 'Mahasiswa DPM Lain',
        ]);

        $assignedApplication = InternshipApplication::factory()->create([
            'user_id' => $assignedStudent->id,
            'partner_id' => Partner::factory(),
            'status' => 'diterima',
        ]);
        $otherApplication = InternshipApplication::factory()->create([
            'user_id' => $otherStudent->id,
            'partner_id' => Partner::factory(),
            'status' => 'diterima',
        ]);

        AcceptanceLetter::factory()->create([
            'internship_application_id' => $assignedApplication->id,
            'uploaded_by' => $assignedStudent->id,
        ]);

        DpmPlacement::factory()->create([
            'internship_application_id' => $assignedApplication->id,
            'dpm_id' => $dpm->id,
            'assigned_by' => $reviewer->id,
        ]);
        DpmPlacement::factory()->create([
            'internship_application_id' => $otherApplication->id,
            'dpm_id' => $otherDpm->id,
            'assigned_by' => $reviewer->id,
        ]);

        $this->actingAs($dpm, 'sanctum')
            ->getJson('/api/dpm/applications')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $assignedApplication->id)
            ->assertJsonPath(
                'data.0.student.name',
                'Mahasiswa Bimbingan',
            )
            ->assertJsonPath('data.0.dpm_placement.dpm.id', $dpm->id)
            ->assertJsonPath(
                'data.0.acceptance_letter.original_name',
                'surat-penerimaan.pdf',
            )
            ->assertJsonMissingPath('data.0.review_note')
            ->assertJsonMissingPath('data.0.reviewed_by')
            ->assertJsonMissing(['name' => 'Mahasiswa DPM Lain']);
    }

    public function test_dpm_without_placement_gets_an_empty_list(): void
    {
        $dpm = User::factory()->create(['role' => 'dpm']);

        DpmPlacement::factory()->create();

        $this->actingAs($dpm, 'sanctum')
            ->getJson('/api/dpm/applications')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(0, 'data');
    }

    public function test_other_roles_cannot_access_the_dpm_application_list(): void
    {
        foreach (['admin', 'prodi', 'mahasiswa'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/dpm/applications')
                ->assertForbidden();
        }
    }

    public function test_dpm_application_list_requires_authentication(): void
    {
        $this->getJson('/api/dpm/applications')->assertUnauthorized();
    }
}
