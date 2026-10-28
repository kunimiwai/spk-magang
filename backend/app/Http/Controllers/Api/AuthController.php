<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Http\Requests\StoreRegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::guard('web')->attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password tidak valid.'],
            ]);
        }

        $user = Auth::guard('web')->user();

        if (! $user->is_active) {
            Auth::guard('web')->logout();

            throw ValidationException::withMessages([
                'email' => ['Akun Anda tidak aktif. Hubungi administrator.'],
            ]);
        }

        $token = $user->createToken('spk-magang-web')->plainTextToken;

        Auth::guard('web')->logout();

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data' => [
                'user' => $this->userPayload($user),
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'user' => $this->userPayload($request->user()),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
        ]);
    }

    /**
     * Registrasi akun mahasiswa baru melalui endpoint publik.
     *
     * Role selalu ditetapkan sebagai `mahasiswa` oleh backend. Field `role`
     * yang dikirim klien diabaikan dan tidak pernah dapat menaikkan hak akses.
     */
    public function register(StoreRegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated): void {
            User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'mahasiswa',
                'is_active' => true,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Akun mahasiswa berhasil dibuat. Silakan masuk.',
        ], 201);
    }

    /**
     * Mengirimkan tautan reset password ke email pengguna.
     *
     * Respons selalu sama baik email terdaftar maupun tidak untuk mencegah
     * enumerasi email.
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $email = $request->validated('email');

        $status = Password::broker('users')->sendResetLink(
            ['email' => $email],
        );

        if ($status === Password::RESET_LINK_SENT) {
            Log::info('Password reset link sent.', ['email' => $email]);

            return response()->json([
                'success' => true,
                'message' => 'Jika email terdaftar, tautan reset password telah dikirim.',
            ]);
        }

        // Jika email tidak terdaftar atau gagal mengirim, tetap kembalikan
        // respons generik agar tidak membocorkan keberadaan akun.
        Log::warning('Password reset link could not be sent.', [
            'email' => $email,
            'status' => $status,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Jika email terdaftar, tautan reset password telah dikirim.',
        ]);
    }

    /**
     * Mengatur ulang password menggunakan token yang valid.
     *
     * Token tidak dapat digunakan ulang setelah berhasil digunakan.
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $status = Password::broker('users')->reset(
            [
                'email' => $validated['email'],
                'token' => $validated['token'],
                'password' => $validated['password'],
                'password_confirmation' => $validated['password_confirmation'],
            ],
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();
            },
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'success' => true,
                'message' => 'Password berhasil diubah. Silakan masuk kembali.',
            ]);
        }

        Log::warning('Password reset failed.', [
            'email' => $validated['email'],
            'status' => $status,
        ]);

        throw ValidationException::withMessages([
            'token' => ['Token reset tidak valid atau telah kedaluwarsa.'],
        ]);
    }

    /**
     * Keep the login and profile responses on the same whitelisted contract.
     *
     * @return array{id: int, name: string, email: string, role: string}
     */
    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ];
    }
}
