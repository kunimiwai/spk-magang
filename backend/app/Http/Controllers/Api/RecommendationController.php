<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\AlgorithmServiceException;
use App\Http\Controllers\Controller;
use App\Services\RecommendationService;
use App\Services\StudentPeminatanResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class RecommendationController extends Controller
{
    public function index(
        Request $request,
        RecommendationService $recommendations,
        StudentPeminatanResolver $peminatanResolver,
    ): JsonResponse {
        if ($request->all() !== []) {
            return response()->json([
                'success' => false,
                'message' => 'Endpoint rekomendasi tidak menerima parameter perhitungan dari klien.',
            ], 422);
        }

        // Peminatan is resolved only from the authenticated student's stored
        // profile. Query/body input is rejected above and never used here.
        $peminatan = $peminatanResolver->resolve($request->user());

        try {
            $data = $recommendations->evaluate(
                count($peminatan) === 1 ? $peminatan[0] : null,
                $peminatanResolver->issue($peminatan),
                $request->user(),
            );
        } catch (AlgorithmServiceException) {
            Log::warning('Recommendation calculation failed.');

            return response()->json([
                'success' => false,
                'message' => 'Layanan rekomendasi sedang tidak tersedia. Coba lagi nanti.',
            ], 503);
        }

        return response()->json([
            'success' => true,
            'message' => $data['message'],
            'data' => $data,
        ]);
    }
}
