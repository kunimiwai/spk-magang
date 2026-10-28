<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_returns_success_for_registered_email(): void
    {
        Mail::fake();

        User::factory()->create([
            'email' => 'mahasiswa@example.com',
            'password' => 'Password123!',
            'role' => 'mahasiswa',
        ]);

        $this->postJson('/api/password/email', [
            'email' => 'mahasiswa@example.com',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Jika email terdaftar, tautan reset password telah dikirim.');
    }

    public function test_forgot_password_does_not_reveal_email_existence(): void
    {
        Mail::fake();

        // Email yang tidak terdaftar harus menerima respons yang sama.
        $this->postJson('/api/password/email', [
            'email' => 'tidak-terdaftar@example.com',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Jika email terdaftar, tautan reset password telah dikirim.');
    }

    public function test_forgot_password_requires_valid_email(): void
    {
        $this->postJson('/api/password/email', [
            'email' => 'bukan-email',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_forgot_password_is_rate_limited(): void
    {
        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->postJson('/api/password/email', [
                'email' => "attempt{$attempt}@example.com",
            ])->assertOk();
        }

        $this->postJson('/api/password/email', [
            'email' => 'lebih@example.com',
        ])->assertStatus(429);
    }

    public function test_reset_password_with_valid_token_succeeds(): void
    {
        $user = User::factory()->create([
            'email' => 'mahasiswa@example.com',
            'password' => 'PasswordLama123!',
            'role' => 'mahasiswa',
        ]);

        $token = Password::broker('users')->createToken($user);

        $this->postJson('/api/password/reset', [
            'email' => 'mahasiswa@example.com',
            'token' => $token,
            'password' => 'PasswordBaru123!',
            'password_confirmation' => 'PasswordBaru123!',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Password berhasil diubah. Silakan masuk kembali.');

        $this->assertTrue(
            Hash::check('PasswordBaru123!', $user->fresh()->password),
            'Password baru harus tersimpan dalam bentuk hash dan cocok.'
        );

        // Token tidak dapat digunakan ulang.
        $this->postJson('/api/password/reset', [
            'email' => 'mahasiswa@example.com',
            'token' => $token,
            'password' => 'PasswordLain123!',
            'password_confirmation' => 'PasswordLain123!',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('token');
    }

    public function test_reset_password_rejects_invalid_token(): void
    {
        $this->postJson('/api/password/reset', [
            'email' => 'mahasiswa@example.com',
            'token' => 'token-tidak-valid',
            'password' => 'PasswordBaru123!',
            'password_confirmation' => 'PasswordBaru123!',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('token');
    }

    public function test_reset_password_rejects_expired_token(): void
    {
        $user = User::factory()->create([
            'email' => 'mahasiswa@example.com',
            'password' => 'PasswordLama123!',
            'role' => 'mahasiswa',
        ]);

        $token = Password::broker('users')->createToken($user);

        // Setel token sebagai kedaluwarsa.
        \Illuminate\Support\Facades\DB::table('password_reset_tokens')
            ->where('email', $user->email)
            ->update(['created_at' => Carbon::now()->subMinutes(70)]);

        $this->postJson('/api/password/reset', [
            'email' => 'mahasiswa@example.com',
            'token' => $token,
            'password' => 'PasswordBaru123!',
            'password_confirmation' => 'PasswordBaru123!',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('token');
    }

    public function test_reset_password_requires_password_validation(): void
    {
        $user = User::factory()->create([
            'email' => 'mahasiswa@example.com',
            'password' => 'PasswordLama123!',
            'role' => 'mahasiswa',
        ]);

        $token = Password::broker('users')->createToken($user);

        $this->postJson('/api/password/reset', [
            'email' => 'mahasiswa@example.com',
            'token' => $token,
            'password' => 'pendek',
            'password_confirmation' => 'pendek',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('password');
    }

    public function test_reset_password_is_rate_limited(): void
    {
        $user = User::factory()->create([
            'email' => 'mahasiswa@example.com',
            'password' => 'PasswordLama123!',
            'role' => 'mahasiswa',
        ]);

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $token = Password::broker('users')->createToken($user);

            $this->postJson('/api/password/reset', [
                'email' => 'mahasiswa@example.com',
                'token' => $token,
                'password' => "PasswordBaru{$attempt}123!",
                'password_confirmation' => "PasswordBaru{$attempt}123!",
            ])->assertOk();
        }

        $token = Password::broker('users')->createToken($user);

        $this->postJson('/api/password/reset', [
            'email' => 'mahasiswa@example.com',
            'token' => $token,
            'password' => 'PasswordLebih123!',
            'password_confirmation' => 'PasswordLebih123!',
        ])->assertStatus(429);
    }

    public function test_old_login_still_works_after_password_reset(): void
    {
        $user = User::factory()->create([
            'email' => 'mahasiswa@example.com',
            'password' => 'PasswordLama123!',
            'role' => 'mahasiswa',
        ]);

        $token = Password::broker('users')->createToken($user);

        $this->postJson('/api/password/reset', [
            'email' => 'mahasiswa@example.com',
            'token' => $token,
            'password' => 'PasswordBaru123!',
            'password_confirmation' => 'PasswordBaru123!',
        ])->assertOk();

        // Password lama tidak boleh bekerja lagi.
        $this->postJson('/api/auth/login', [
            'email' => 'mahasiswa@example.com',
            'password' => 'PasswordLama123!',
        ])->assertUnprocessable();

        // Password baru harus bekerja.
        $this->postJson('/api/auth/login', [
            'email' => 'mahasiswa@example.com',
            'password' => 'PasswordBaru123!',
        ])->assertOk();
    }
}
