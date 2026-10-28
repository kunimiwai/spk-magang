<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreApplicationCommunicationRequest;
use App\Models\ApplicationCommunication;
use App\Models\InternshipApplication;
use Illuminate\Http\JsonResponse;

class AdminApplicationCommunicationController extends Controller
{
    /**
     * Relasi pencatat dibatasi pada identitas minimum. Password dan token
     * tidak pernah dimuat.
     */
    private const RECORDER_RELATION = 'recorder:id,name,email,role';

    /**
     * Riwayat komunikasi manual untuk satu pengajuan.
     */
    public function index(InternshipApplication $application): JsonResponse
    {
        $communications = $application->communications()
            ->with(self::RECORDER_RELATION)
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Riwayat komunikasi mitra.',
            'data' => $communications,
        ]);
    }

    /**
     * Catat pengiriman atau balasan yang dilakukan di luar sistem.
     *
     * Endpoint ini tidak mengirim email/surat dan tidak mengubah status
     * pengajuan. Status hasil seleksi tetap diisi melalui endpoint keputusan
     * sampai sumber kebenaran status ditetapkan (OD-021).
     */
    public function store(
        StoreApplicationCommunicationRequest $request,
        InternshipApplication $application,
    ): JsonResponse {
        $validated = $request->validated();

        $communication = ApplicationCommunication::create([
            'internship_application_id' => $application->getKey(),
            'direction' => $validated['direction'],
            'channel' => $validated['channel'],
            'occurred_at' => $validated['occurred_at'],
            'summary' => $validated['summary'],
            'recorded_by' => $request->user()->getKey(),
        ]);

        $communication->load(self::RECORDER_RELATION);

        return response()->json([
            'success' => true,
            'message' => 'Komunikasi mitra berhasil dicatat. Status pengajuan tidak diubah otomatis.',
            'data' => $communication,
        ], 201);
    }
}
