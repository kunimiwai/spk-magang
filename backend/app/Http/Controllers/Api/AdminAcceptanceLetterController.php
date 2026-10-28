<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InternshipApplication;
use App\Services\AcceptanceLetterService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminAcceptanceLetterController extends Controller
{
    public function show(
        Request $request,
        InternshipApplication $application,
        AcceptanceLetterService $letters,
    ): Response {
        $application->load('acceptanceLetter');

        $letter = $application->acceptanceLetter;

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
