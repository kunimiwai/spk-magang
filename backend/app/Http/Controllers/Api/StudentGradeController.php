<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateStudentGradesRequest;
use App\Services\StudentGradeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentGradeController extends Controller
{
    public function index(
        Request $request,
        StudentGradeService $grades,
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => 'Nilai akademik mahasiswa.',
            'data' => $grades->sheet($request->user()),
        ]);
    }

    public function update(
        UpdateStudentGradesRequest $request,
        StudentGradeService $grades,
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => 'Nilai akademik berhasil disimpan.',
            'data' => $grades->replace(
                $request->user(),
                $request->validated('grades'),
            ),
        ]);
    }
}
