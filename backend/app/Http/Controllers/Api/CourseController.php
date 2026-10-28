<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCourseRequest;
use App\Http\Requests\UpdateCourseRequest;
use App\Models\Course;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;

class CourseController extends Controller
{
    public function index(): JsonResponse
    {
        $courses = Course::query()
            ->withCount('grades')
            ->orderBy('name')
            ->orderBy('id')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar mata kuliah.',
            'data' => $courses,
        ]);
    }

    public function store(StoreCourseRequest $request): JsonResponse
    {
        $course = Course::create($request->validated());
        $course->loadCount('grades');

        return response()->json([
            'success' => true,
            'message' => 'Mata kuliah berhasil dibuat.',
            'data' => $course,
        ], 201);
    }

    public function show(Course $course): JsonResponse
    {
        $course->loadCount('grades');

        return response()->json([
            'success' => true,
            'data' => $course,
        ]);
    }

    public function update(
        UpdateCourseRequest $request,
        Course $course,
    ): JsonResponse {
        $course->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Mata kuliah berhasil diperbarui.',
            'data' => $course->fresh()->loadCount('grades'),
        ]);
    }

    public function destroy(Course $course): JsonResponse
    {
        if ($course->grades()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Mata kuliah tidak dapat dihapus karena masih memiliki nilai mahasiswa.',
            ], 409);
        }

        try {
            $course->delete();
        } catch (QueryException) {
            return response()->json([
                'success' => false,
                'message' => 'Mata kuliah tidak dapat dihapus karena masih dipakai data lain.',
            ], 409);
        }

        return response()->json([
            'success' => true,
            'message' => 'Mata kuliah berhasil dihapus.',
        ]);
    }
}
