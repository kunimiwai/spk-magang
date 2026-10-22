<?php

namespace App\Http\Controllers\Api;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInternshipApplicationRequest;
use App\Models\InternshipApplication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentApplicationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $applications = $request->user()
            ->internshipApplications()
            ->with([
                'partner',
                'acceptanceLetter',
                'dpmPlacement.dpm:id,name,email,role',
            ])
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar pengajuan magang Anda.',
            'data' => $applications,
        ]);
    }

    public function store(
        StoreInternshipApplicationRequest $request,
    ): JsonResponse {
        // user_id berasal dari relasi akun terautentikasi, bukan dari body.
        // Status awal dan waktu pengajuan juga ditetapkan server.
        $application = $request->user()->internshipApplications()->create([
            'partner_id' => $request->validated('partner_id'),
            'status' => ApplicationStatus::Menunggu,
            'submitted_at' => now(),
        ]);

        $application->load([
            'partner',
            'acceptanceLetter',
            'dpmPlacement.dpm:id,name,email,role',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan magang berhasil dikirim.',
            'data' => $application,
        ], 201);
    }

    public function show(
        Request $request,
        InternshipApplication $application,
    ): JsonResponse {
        // Query melalui relasi milik akun membuat pengajuan mahasiswa lain
        // menghasilkan 404, bukan membocorkan keberadaannya.
        $ownedApplication = $request->user()
            ->internshipApplications()
            ->with([
                'partner',
                'acceptanceLetter',
                'dpmPlacement.dpm:id,name,email,role',
            ])
            ->findOrFail($application->getKey());

        return response()->json([
            'success' => true,
            'message' => 'Detail pengajuan magang.',
            'data' => $ownedApplication,
        ]);
    }
}
