<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InternshipApplication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DpmApplicationController extends Controller
{
    /**
     * Data bimbingan hanya memuat identitas mahasiswa, mitra, surat
     * penerimaan (metadata), dan penempatan DPM. Catatan review Admin/Prodi
     * tidak termasuk karena bukan bagian dari kewenangan DPM.
     */
    private const ASSIGNED_RELATIONS = [
        'student:id,name,email,role',
        'partner',
        'acceptanceLetter',
        'dpmPlacement.dpm:id,name,email,role',
    ];

    /**
     * Daftar mahasiswa yang ditugaskan kepada DPM yang sedang login.
     *
     * Query dibatasi pada dpm_id milik pengguna aktif sehingga DPM tidak
     * dapat melihat mahasiswa bimbingan DPM lain.
     */
    public function index(Request $request): JsonResponse
    {
        $applications = InternshipApplication::query()
            ->select([
                'id',
                'user_id',
                'partner_id',
                'status',
                'submitted_at',
                'created_at',
                'updated_at',
            ])
            ->whereHas('dpmPlacement', function ($query) use ($request): void {
                $query->where('dpm_id', $request->user()->getKey());
            })
            ->with(self::ASSIGNED_RELATIONS)
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar mahasiswa bimbingan magang.',
            'data' => $applications,
        ]);
    }
}
