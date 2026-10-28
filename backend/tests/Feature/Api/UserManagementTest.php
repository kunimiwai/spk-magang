<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_user_accounts(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/users', [
                'name' => 'Budi Santoso',
                'email' => 'budi@example.com',
                'password' => 'rahasia123',
                'role' => 'dpm',
            ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Budi Santoso')
            ->assertJsonPath('data.email', 'budi@example.com')
            ->assertJsonPath('data.role', 'dpm');

        $this->assertDatabaseHas('users', [
            'email' => 'budi@example.com',
            'role' => 'dpm',
            'is_active' => true,
        ]);
        $user = User::where('email', 'budi@example.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue(password_verify('rahasia123', $user->password));
    }

    public function test_admin_can_create_all_roles(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        foreach (['admin', 'prodi', 'dpm', 'mahasiswa'] as $role) {
            $this->actingAs($admin, 'sanctum')
                ->postJson('/api/admin/users', [
                    'name' => 'User ' . ucfirst($role),
                    'email' => $role . '@example.com',
                    'password' => 'rahasia123',
                    'role' => $role,
                ])
                ->assertCreated()
                ->assertJsonPath('data.role', $role);
        }

        $this->assertDatabaseCount('users', 5); // 1 admin + 4 created
    }

    public function test_admin_can_list_users(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        User::factory()->create(['role' => 'dpm', 'name' => 'DPM User']);
        User::factory()->create(['role' => 'mahasiswa', 'name' => 'Mahasiswa User']);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/users')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(3, 'data');
    }

    public function test_admin_can_update_user(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create(['role' => 'dpm', 'name' => 'Old Name']);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/users/{$user->id}", [
                'name' => 'New Name',
                'role' => 'prodi',
                'is_active' => false,
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'New Name')
            ->assertJsonPath('data.role', 'prodi')
            ->assertJsonPath('data.is_active', false);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'New Name',
            'role' => 'prodi',
            'is_active' => false,
        ]);
    }

    public function test_admin_can_delete_user(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create(['role' => 'dpm']);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/users/{$user->id}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_non_admin_cannot_access_user_management(): void
    {
        foreach (['mahasiswa', 'prodi', 'dpm'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/admin/users')
                ->assertForbidden();

            $this->actingAs($user, 'sanctum')
                ->postJson('/api/admin/users', [
                    'name' => 'Test',
                    'email' => 'test@example.com',
                    'password' => 'password123',
                    'role' => 'mahasiswa',
                ])
                ->assertForbidden();
        }
    }

    public function test_unauthenticated_cannot_access_user_management(): void
    {
        $this->getJson('/api/admin/users')->assertUnauthorized();
        $this->postJson('/api/admin/users', [
            'name' => 'Test',
            'email' => 'test@example.com',
            'password' => 'password123',
            'role' => 'mahasiswa',
        ])->assertUnauthorized();
    }

    public function test_duplicate_email_is_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        User::factory()->create(['email' => 'existing@example.com']);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/users', [
                'name' => 'Duplicate',
                'email' => 'existing@example.com',
                'password' => 'password123',
                'role' => 'mahasiswa',
            ])
            ->assertStatus(422);
    }

    public function test_created_user_can_login(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/users', [
                'name' => 'New DPM',
                'email' => 'newdpm@example.com',
                'password' => 'rahasia123',
                'role' => 'dpm',
            ])
            ->assertCreated();

        $response = $this->postJson('/api/auth/login', [
            'email' => 'newdpm@example.com',
            'password' => 'rahasia123',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.user.role', 'dpm');
    }

    public function test_inactive_user_cannot_login(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/users', [
                'name' => 'Inactive User',
                'email' => 'inactive@example.com',
                'password' => 'rahasia123',
                'role' => 'mahasiswa',
            ])
            ->assertCreated();

        $user = User::where('email', 'inactive@example.com')->first();
        $user->update(['is_active' => false]);

        $this->postJson('/api/auth/login', [
            'email' => 'inactive@example.com',
            'password' => 'rahasia123',
        ])->assertStatus(422)
         ->assertJsonPath('message', 'Akun Anda tidak aktif. Hubungi administrator.');
    }
}
