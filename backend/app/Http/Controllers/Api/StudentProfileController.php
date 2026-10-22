<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateStudentProfileRequest;
use App\Services\StudentProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentProfileController extends Controller
{
    public function show(
        Request $request,
        StudentProfileService $profiles,
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => 'Profil akademik mahasiswa.',
            'data' => $profiles->profile($request->user()),
        ]);
    }

    public function update(
        UpdateStudentProfileRequest $request,
        StudentProfileService $profiles,
    ): JsonResponse {
        if (! $profiles->selectionAvailable()) {
            return response()->json([
                'success' => false,
                'message' => $profiles->note(),
                'data' => $profiles->profile($request->user()),
            ], 409);
        }

        $validated = $request->validated();

        return response()->json([
            'success' => true,
            'message' => 'Profil akademik berhasil diperbarui.',
            'data' => $profiles->update($request->user(), $validated['peminatan']),
        ]);
    }
}
