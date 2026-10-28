<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdatePartnerScoresRequest;
use App\Models\Criterion;
use App\Models\Partner;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class CriterionScoreController extends Controller
{
    public function index(Partner $partner): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Nilai kriteria mitra.',
            'data' => $this->scoreSheet($partner),
        ]);
    }

    public function update(
        UpdatePartnerScoresRequest $request,
        Partner $partner,
    ): JsonResponse {
        $scores = $request->validated('scores');

        DB::transaction(function () use ($partner, $scores): void {
            foreach ($scores as $row) {
                $criterionId = (int) $row['criterion_id'];

                if ($row['score'] === null) {
                    $partner->criterionScores()
                        ->where('criterion_id', $criterionId)
                        ->delete();

                    continue;
                }

                $partner->criterionScores()->updateOrCreate(
                    ['criterion_id' => $criterionId],
                    ['score' => $row['score']],
                );
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Nilai kriteria mitra berhasil disimpan.',
            'data' => $this->scoreSheet($partner),
        ]);
    }

    public function destroy(Partner $partner, Criterion $criterion): JsonResponse
    {
        $deleted = $partner->criterionScores()
            ->where('criterion_id', $criterion->id)
            ->delete();

        if ($deleted === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Nilai kriteria untuk mitra tersebut tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Nilai kriteria mitra berhasil dihapus.',
        ]);
    }

    /**
     * @return array{
     *     partner: array{id: int, name: string},
     *     criteria: list<array{
     *         criterion_id: int,
     *         name: string,
     *         type: string,
     *         weight: float,
     *         score: float|null
     *     }>
     * }
     */
    private function scoreSheet(Partner $partner): array
    {
        $criteria = Criterion::query()
            ->orderBy('name')
            ->orderBy('id')
            ->get();

        $scores = $partner->criterionScores()
            ->pluck('score', 'criterion_id');

        return [
            'partner' => [
                'id' => $partner->id,
                'name' => $partner->name,
            ],
            'criteria' => $criteria->map(function (Criterion $criterion) use ($scores): array {
                $score = $scores->get($criterion->id);

                return [
                    'criterion_id' => $criterion->id,
                    'name' => $criterion->name,
                    'type' => $criterion->type->value,
                    'weight' => $criterion->weight,
                    'score' => $score === null ? null : (float) $score,
                ];
            })->values()->all(),
        ];
    }
}
