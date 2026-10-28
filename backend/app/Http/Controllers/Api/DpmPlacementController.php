<?php

namespace App\Http\Controllers\Api;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateDpmPlacementRequest;
use App\Models\DpmPlacement;
use App\Models\InternshipApplication;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class DpmPlacementController extends Controller
{
    /**
     * DPM candidates come from real user accounts with the existing "dpm"
     * role. No lecturer master table or dummy users are created.
     */
    public function options(): JsonResponse
    {
        $dpmUsers = User::query()
            ->where('role', 'dpm')
            ->orderBy('name')
            ->orderBy('id')
            ->get(['id', 'name', 'email', 'role']);

        return response()->json([
            'success' => true,
            'message' => 'Daftar akun DPM yang tersedia.',
            'data' => $dpmUsers,
        ]);
    }

    public function store(
        UpdateDpmPlacementRequest $request,
        InternshipApplication $application,
    ): JsonResponse {
        $result = DB::transaction(function () use (
            $request,
            $application,
        ): array {
            $lockedApplication = InternshipApplication::query()
                ->whereKey($application->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedApplication->status !== ApplicationStatus::Diterima) {
                return ['error' => 'status'];
            }

            $existing = $lockedApplication->dpmPlacement()->first();

            if ($existing !== null
                && ! config('internship.dpm.allow_reassignment')) {
                return ['error' => 'exists', 'replaced' => false];
            }

            $attributes = [
                'dpm_id' => $request->validated('dpm_id'),
                'assigned_by' => $request->user()->getKey(),
                'assigned_at' => now(),
            ];

            if ($existing !== null) {
                $existing->update($attributes);

                return [
                    'placement' => $existing->refresh(),
                    'replaced' => true,
                ];
            }

            return [
                'placement' => DpmPlacement::create([
                    ...$attributes,
                    'internship_application_id' => $lockedApplication->getKey(),
                ]),
                'replaced' => false,
            ];
        });

        if (($result['error'] ?? null) === 'status') {
            return response()->json([
                'success' => false,
                'message' => 'DPM hanya dapat ditetapkan untuk pengajuan yang sudah diterima.',
            ], Response::HTTP_CONFLICT);
        }

        if (($result['error'] ?? null) === 'exists') {
            return response()->json([
                'success' => false,
                'message' => 'Pengajuan ini sudah memiliki DPM. Penggantian DPM belum didukung (OD-024).',
            ], Response::HTTP_CONFLICT);
        }

        $application->refresh()->load([
            'student:id,name,email,role',
            'partner',
            'reviewer:id,name,email,role',
            'acceptanceLetter',
            'dpmPlacement.dpm:id,name,email,role',
        ]);

        return response()->json([
            'success' => true,
            'message' => $result['replaced']
                ? 'Dosen pembimbing magang berhasil diganti.'
                : 'Dosen pembimbing magang berhasil ditetapkan.',
            'data' => $application,
        ], $result['replaced'] ? Response::HTTP_OK : Response::HTTP_CREATED);
    }
}
