<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_valid_credentials(): void
    {
        User::factory()->create([
            'name' => 'Mahasiswa Test',
            'email' => 'mahasiswa@example.com',
            'password' => 'Password123!',
            'role' => 'mahasiswa',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'mahasiswa@example.com',
            'password' => 'Password123!',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.role', 'mahasiswa')
            ->assertJsonStructure([
                'data' => [
                    'user' => ['id', 'name', 'email', 'role'],
                    'token',
                    'token_type',
                ],
            ]);
    }

    public function test_login_fails_with_invalid_password(): void
    {
        User::factory()->create([
            'email' => 'mahasiswa@example.com',
            'password' => 'Password123!',
            'role' => 'mahasiswa',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'mahasiswa@example.com',
            'password' => 'wrong-password',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_profile_requires_authentication(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_mahasiswa_cannot_access_admin_endpoint(): void
    {
        $user = User::factory()->create([
            'role' => 'mahasiswa',
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/admin/access-check')
            ->assertForbidden();
    }

    public function test_user_can_logout_and_revoke_current_token(): void
    {
        $user = User::factory()->create([
            'email' => 'mahasiswa@example.com',
            'password' => 'Password123!',
            'role' => 'mahasiswa',
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/auth/logout')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'name' => 'test-token',
        ]);

        // Bersihkan state guard web tanpa membuat ulang aplikasi.
        auth()->forgetGuards();

        $this->withToken($token)
            ->getJson('/api/auth/me')
            ->assertUnauthorized();
    }
}
