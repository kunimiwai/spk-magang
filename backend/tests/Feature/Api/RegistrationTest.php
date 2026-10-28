<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_as_mahasiswa(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Mahasiswa Baru',
            'email' => 'mahasiswa@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Akun mahasiswa berhasil dibuat. Silakan masuk.');

        $this->assertDatabaseHas('users', [
            'email' => 'mahasiswa@example.com',
            'role' => 'mahasiswa',
            'is_active' => true,
        ]);

        $user = User::where('email', 'mahasiswa@example.com')->first();

        $this->assertNotNull($user);
        $this->assertTrue(Hash::check('Password123!', $user->password));
        $this->assertSame('mahasiswa', $user->role);
    }

    public function test_duplicate_email_is_rejected(): void
    {
        User::factory()->create([
            'email' => 'mahasiswa@example.com',
            'password' => 'Password123!',
            'role' => 'mahasiswa',
        ]);

        $this->postJson('/api/auth/register', [
            'name' => 'Mahasiswa Duplikat',
            'email' => 'mahasiswa@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_invalid_input_is_rejected(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => '',
            'email' => 'bukan-email',
            'password' => 'pendek',
            'password_confirmation' => 'lainnya',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password']);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_password_is_never_stored_in_plaintext(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Mahasiswa Aman',
            'email' => 'aman@example.com',
            'password' => 'Rahasia123!',
            'password_confirmation' => 'Rahasia123!',
        ])
            ->assertCreated();

        $user = User::where('email', 'aman@example.com')->first();

        $this->assertNotSame('Rahasia123!', $user->password);
        $this->assertTrue(Hash::check('Rahasia123!', $user->password));
    }

    public function test_role_is_always_mahasiswa(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Mahasiswa',
            'email' => 'm@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'admin',
        ])
            ->assertCreated();

        $user = User::where('email', 'm@example.com')->first();

        $this->assertSame('mahasiswa', $user->role);
    }

    public function test_dangerous_role_field_cannot_escalate_privileges(): void
    {
        foreach (['admin', 'prodi', 'dpm'] as $forbiddenRole) {
            $this->postJson('/api/auth/register', [
                'name' => 'Pengguna',
                'email' => "{$forbiddenRole}@example.com",
                'password' => 'Password123!',
                'password_confirmation' => 'Password123!',
                'role' => $forbiddenRole,
            ])
                ->assertCreated();

            $user = User::where('email', "{$forbiddenRole}@example.com")->first();

            $this->assertSame('mahasiswa', $user->role);
        }
    }

    public function test_registration_is_rate_limited(): void
    {
        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->postJson('/api/auth/register', [
                'name' => "Percobaan {$attempt}",
                'email' => "attempt{$attempt}@example.com",
                'password' => 'Password123!',
                'password_confirmation' => 'Password123!',
            ])->assertCreated();
        }

        $this->postJson('/api/auth/register', [
            'name' => 'Terlalu Banyak',
            'email' => 'lebih@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertStatus(429);
    }

    public function test_login_still_works_after_registration(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Mahasiswa Login',
            'email' => 'login@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertCreated();

        $this->postJson('/api/auth/login', [
            'email' => 'login@example.com',
            'password' => 'Password123!',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.role', 'mahasiswa');
    }
}
