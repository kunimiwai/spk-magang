<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_access_admin_endpoint(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/admin/access-check')
            ->assertOk()
            ->assertJsonPath('role', 'admin');
    }

    public function test_mahasiswa_can_access_mahasiswa_endpoint(): void
    {
        $user = User::factory()->create(['role' => 'mahasiswa']);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/mahasiswa/access-check')
            ->assertOk()
            ->assertJsonPath('role', 'mahasiswa');
    }

    public function test_dpm_can_access_dpm_endpoint(): void
    {
        $user = User::factory()->create(['role' => 'dpm']);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/dpm/access-check')
            ->assertOk()
            ->assertJsonPath('role', 'dpm');
    }

    public function test_role_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/admin/access-check')
            ->assertUnauthorized()
            ->assertJson(['message' => 'Unauthenticated.']);
    }
}
