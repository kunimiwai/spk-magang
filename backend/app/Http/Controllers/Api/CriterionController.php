<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCriterionRequest;
use App\Http\Requests\UpdateCriterionRequest;
use App\Models\Criterion;
use Illuminate\Http\JsonResponse;

class CriterionController extends Controller
{
    public function index(): JsonResponse
    {
        $criteria = Criterion::query()
            ->withCount('scores')
            ->orderBy('name')
            ->orderBy('id')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar kriteria penilaian.',
            'data' => $criteria,
        ]);
    }

    public function store(StoreCriterionRequest $request): JsonResponse
    {
        $criterion = Criterion::create($request->validated());
        $criterion->loadCount('scores');

        return response()->json([
            'success' => true,
            'message' => 'Kriteria berhasil dibuat.',
            'data' => $criterion,
        ], 201);
    }

    public function show(Criterion $criterion): JsonResponse
    {
        $criterion->loadCount('scores');

        return response()->json([
            'success' => true,
            'data' => $criterion,
        ]);
    }

    public function update(
        UpdateCriterionRequest $request,
        Criterion $criterion,
    ): JsonResponse {
        $criterion->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Kriteria berhasil diperbarui.',
            'data' => $criterion->fresh()->loadCount('scores'),
        ]);
    }

    public function destroy(Criterion $criterion): JsonResponse
    {
        if ($criterion->scores()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Kriteria tidak dapat dihapus karena masih memiliki nilai penilaian mitra.',
            ], 409);
        }

        $criterion->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kriteria berhasil dihapus.',
        ]);
    }
}
