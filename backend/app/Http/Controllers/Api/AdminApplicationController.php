<?php

namespace App\Http\Controllers\Api;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateInternshipApplicationStatusRequest;
use App\Models\InternshipApplication;
use Illuminate\Http\JsonResponse;

class AdminApplicationController extends Controller
{
    /**
     * Relasi yang aman ditampilkan ke Admin/Prodi. Hanya kolom identitas
     * minimum yang dipilih; password dan token tidak pernah dimuat.
     */
    private const DETAIL_RELATIONS = [
        'student:id,name,email,role',
        'partner',
        'reviewer:id,name,email,role',
        'acceptanceLetter',
        'dpmPlacement.dpm:id,name,email,role',
    ];

    public function index(): JsonResponse
    {
        $applications = InternshipApplication::query()
            ->with(self::DETAIL_RELATIONS)
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar pengajuan magang.',
            'data' => $applications,
        ]);
    }

    public function show(InternshipApplication $application): JsonResponse
    {
        $application->load(self::DETAIL_RELATIONS);

        return response()->json([
            'success' => true,
            'message' => 'Detail pengajuan magang.',
            'data' => $application,
        ]);
    }

    public function updateStatus(
        UpdateInternshipApplicationStatusRequest $request,
        InternshipApplication $application,
    ): JsonResponse {
        $validated = $request->validated();

        // Conditional update membuat transisi menunggu -> diterima/ditolak
        // atomik. Pengajuan yang sudah diputuskan tidak dapat diubah lagi
        // melalui modul ini karena reversal belum ditetapkan (OD-016/OD-021).
        $updated = InternshipApplication::query()
            ->whereKey($application->getKey())
            ->where('status', ApplicationStatus::Menunggu->value)
            ->update([
                'status' => $validated['status'],
                'review_note' => $validated['review_note'] ?? null,
                'reviewed_at' => now(),
                'reviewed_by' => $request->user()->id,
            ]);

        if ($updated === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Pengajuan ini sudah memiliki keputusan. Perubahan keputusan belum didukung.',
            ], 409);
        }

        $application->refresh()->load(self::DETAIL_RELATIONS);

        return response()->json([
            'success' => true,
            'message' => 'Keputusan pengajuan berhasil disimpan.',
            'data' => $application,
        ]);
    }
}
