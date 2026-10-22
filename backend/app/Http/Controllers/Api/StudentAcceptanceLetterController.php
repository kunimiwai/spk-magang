<?php

namespace App\Http\Controllers\Api;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAcceptanceLetterRequest;
use App\Models\InternshipApplication;
use App\Services\AcceptanceLetterService;
use App\Support\UploadLimit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StudentAcceptanceLetterController extends Controller
{
    /**
     * Effective upload limit for the current PHP runtime. The client mirrors
     * this value so its validation matches what the server can accept; the
     * application limit alone is not enough when PHP's ini values are lower.
     */
    public function limit(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Batas unggah surat penerimaan.',
            'data' => [
                'max_size_kb' => UploadLimit::acceptanceLetterMaxKb(),
                'configured_max_size_kb' => (int) config(
                    'internship.acceptance_letter.max_size_kb',
                ),
                'allowed_mime_types' => config(
                    'internship.acceptance_letter.allowed_mime_types',
                ),
                'replaceable' => (bool) config(
                    'internship.acceptance_letter.replaceable',
                ),
            ],
        ], 200);
    }

    /**
     * Relations safe to return after an upload. Storage paths stay hidden by
     * the AcceptanceLetter model.
     */
    private const APPLICATION_RELATIONS = [
        'partner',
        'acceptanceLetter',
        'dpmPlacement.dpm:id,name,email,role',
    ];

    public function store(
        StoreAcceptanceLetterRequest $request,
        InternshipApplication $application,
        AcceptanceLetterService $letters,
    ): JsonResponse {
        // Querying through the authenticated student's relation returns 404
        // for another student's application, without disclosing its existence.
        $ownedApplication = $request->user()
            ->internshipApplications()
            ->with('acceptanceLetter')
            ->findOrFail($application->getKey());

        if ($ownedApplication->status !== ApplicationStatus::Diterima) {
            return response()->json([
                'success' => false,
                'message' => 'Surat penerimaan hanya dapat diunggah setelah pengajuan dinyatakan diterima.',
            ], 409);
        }

        $existing = $ownedApplication->acceptanceLetter;

        if ($existing !== null
            && ! config('internship.acceptance_letter.replaceable')) {
            return response()->json([
                'success' => false,
                'message' => 'Surat penerimaan sudah diunggah. Penggantian dokumen belum didukung (OD-017).',
            ], 409);
        }

        $letter = $letters->store(
            $ownedApplication,
            $request->user(),
            $request->file('file'),
        );

        $ownedApplication->load(self::APPLICATION_RELATIONS);
        $ownedApplication->setRelation('acceptanceLetter', $letter);

        return response()->json([
            'success' => true,
            'message' => $existing === null
                ? 'Surat penerimaan berhasil diunggah.'
                : 'Surat penerimaan berhasil diganti.',
            'data' => $ownedApplication,
        ], $existing === null ? 201 : Response::HTTP_OK);
    }

    public function show(
        Request $request,
        InternshipApplication $application,
        AcceptanceLetterService $letters,
    ): Response {
        $ownedApplication = $request->user()
            ->internshipApplications()
            ->with('acceptanceLetter')
            ->findOrFail($application->getKey());

        $letter = $ownedApplication->acceptanceLetter;

        if ($letter === null) {
            return response()->json([
                'success' => false,
                'message' => 'Surat penerimaan belum diunggah.',
            ], Response::HTTP_NOT_FOUND);
        }

        if (! $letters->exists($letter)) {
            return response()->json([
                'success' => false,
                'message' => 'Berkas surat penerimaan tidak ditemukan di penyimpanan.',
            ], Response::HTTP_NOT_FOUND);
        }

        return $letters->fileResponse(
            $letter,
            $request->boolean('download'),
        );
    }
}
