<?php

namespace Tests\Feature\Api;

use App\Models\Partner;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentPartnerCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_mahasiswa_can_browse_partner_details_before_applying(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $beta = Partner::factory()->create([
            'name' => 'PT Beta',
            'address' => 'Jl. Beta 2',
            'contact' => '082222222222',
            'email' => 'beta@example.test',
            'description' => 'Mitra bidang data.',
        ]);
        $alpha = Partner::factory()->create([
            'name' => 'PT Alpha',
            'address' => 'Jl. Alpha 1',
            'contact' => '081111111111',
            'email' => 'alpha@example.test',
            'description' => 'Mitra bidang perangkat lunak.',
        ]);

        $this->actingAs($student, 'sanctum')
            ->getJson('/api/mahasiswa/partners')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $alpha->id)
            ->assertJsonPath('data.0.name', 'PT Alpha')
            ->assertJsonPath('data.0.address', 'Jl. Alpha 1')
            ->assertJsonPath('data.0.contact', '081111111111')
            ->assertJsonPath('data.0.email', 'alpha@example.test')
            ->assertJsonPath('data.0.description', 'Mitra bidang perangkat lunak.')
            ->assertJsonPath('data.1.id', $beta->id)
            ->assertJsonMissingPath('data.0.created_at')
            ->assertJsonMissingPath('data.0.updated_at');
    }

    public function test_partner_catalog_requires_authentication(): void
    {
        $this->getJson('/api/mahasiswa/partners')->assertUnauthorized();
    }

    public function test_partner_catalog_is_scoped_to_mahasiswa_role(): void
    {
        foreach (['admin', 'prodi', 'dpm'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/mahasiswa/partners')
                ->assertForbidden();
        }
    }
}
