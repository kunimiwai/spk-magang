<?php

namespace App\Http\Controllers\Api;

use App\Enums\CriterionType;
use App\Exceptions\AlgorithmServiceException;
use App\Http\Controllers\Controller;
use App\Models\Criterion;
use App\Models\Partner;
use App\Services\AlgorithmService;
use App\Services\RecommendationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

class AdminAnalyticsController extends Controller
{
    /**
     * Dashboard analitik untuk Admin dan Prodi (proposal 6.4): kesiapan
     * K-Means, distribusi cluster bila konfigurasi tersedia, statistik skor
     * mitra per kriteria, dan status kesediaan ranking SAW. Semua angka
     * diturunkan dari data tersimpan; tidak ada nilai ambang, bobot, atau
     * pemetaan yang ditetapkan di sini.
     *
     * @throws AlgorithmServiceException
     */
    public function index(
        RecommendationService $recommendations,
        AlgorithmService $algorithm,
    ): JsonResponse {
        $criteria = Criterion::query()->orderBy('id')->get();
        $partners = Partner::query()
            ->with('criterionScores')
            ->orderBy('name')
            ->orderBy('id')
            ->get();

        $criteriaPayload = $criteria
            ->map(fn (Criterion $criterion): array => $this->criterionStats(
                $criterion,
                $partners,
            ))
            ->values()
            ->all();

        $totalPairs = $criteria->count() * $partners->count();
        $missingPairs = array_sum(array_column(
            $criteriaPayload,
            'missing_partner_count',
        ));

        // evaluate() selalu berstatus not_ready untuk konteks tanpa mahasiswa
        // (cek prasyarat dan peminatan bersifat per mahasiswa), sehingga panggilan
        // ini tidak pernah menghitung resmi peringkat SAW.
        $readiness = $recommendations->evaluate(
            null,
            'Peminatan mahasiswa berlaku per akun, bukan pada tampilan analitik.',
        );

        return response()->json([
            'success' => true,
            'message' => 'Analitik dashboard admin dan prodi.',
            'data' => [
                'partners' => [
                    'count' => $partners->count(),
                ],
                'criteria' => $criteriaPayload,
                'scores' => [
                    'filled_pairs' => $totalPairs - $missingPairs,
                    'total_pairs' => $totalPairs,
                ],
                'kmeans' => $this->kmeansAnalytics(
                    $algorithm,
                    $criteria,
                    $partners,
                    $readiness,
                ),
                'recommendation' => [
                    'status' => $readiness['status'],
                    'checks' => $readiness['checks'],
                ],
                'notes' => $this->notes(),
            ],
        ], 200);
    }

    /**
     * @param  Collection<int, Partner>  $partners
     * @return array{
     *     id: int,
     *     name: string,
     *     type: string,
     *     weight: float,
     *     stats: array{count: int, min: float, max: float, average: float}|null,
     *     missing_partner_count: int
     * }
     */
    private function criterionStats(
        Criterion $criterion,
        Collection $partners,
    ): array {
        $values = [];
        $scoredPartnerIds = [];

        foreach ($partners as $partner) {
            foreach ($partner->criterionScores as $score) {
                if ($score->criterion_id !== $criterion->id) {
                    continue;
                }

                if (is_int($score->score) || is_float($score->score)) {
                    $values[] = (float) $score->score;
                    $scoredPartnerIds[$partner->id] = true;
                }
            }
        }

        return [
            'id' => $criterion->id,
            'name' => $criterion->name,
            'type' => $criterion->type instanceof CriterionType
                ? $criterion->type->value
                : (string) $criterion->type,
            'weight' => (float) $criterion->weight,
            'stats' => $values === []
                ? null
                : [
                    'count' => count($values),
                    'min' => min($values),
                    'max' => max($values),
                    'average' => round(
                        array_sum($values) / count($values),
                        4,
                    ),
                ],
            'missing_partner_count' => $partners->count()
                - count($scoredPartnerIds),
        ];
    }

    /**
     * @param  Collection<int, Criterion>  $criteria
     * @param  Collection<int, Partner>  $partners
     * @param  array{status: string, checks: list<array<string, mixed>>}  $readiness
     * @return array{
     *     configured: bool,
     *     message: string,
     *     iterations: int|null,
     *     converged: bool|null,
     *     distribution: list<array{
     *         cluster_index: int,
     *         partner_count: int,
     *         feature_averages: list<array{
     *             criterion_id: int,
     *             criterion_name: string,
     *             average: float|null
     *         }>
     *     }>|null,
     *     service_error: string|null
     * }
     */
    private function kmeansAnalytics(
        AlgorithmService $algorithm,
        Collection $criteria,
        Collection $partners,
        array $readiness,
    ): array {
        $check = collect($readiness['checks'])
            ->firstWhere('key', 'kmeans_configuration');

        $configured = $check !== null && $check['status'] === 'ok';

        $analytics = [
            'configured' => $configured,
            'message' => $check['message'] ?? 'Konfigurasi K-Means tidak tersedia.',
            'iterations' => null,
            'converged' => null,
            'distribution' => null,
            'service_error' => null,
        ];

        if (! $configured || $partners->isEmpty()) {
            return $analytics;
        }

        $featureIds = array_values(array_filter(
            (array) config('recommendation.kmeans.feature_criterion_ids'),
            'is_numeric',
        ));
        $matrix = [];
        $scoresByPartner = [];

        foreach ($partners->values() as $partnerIndex => $partner) {
            $scoresByPartner[$partnerIndex] = [];

            foreach ($partner->criterionScores as $score) {
                $scoresByPartner[$partnerIndex][$score->criterion_id] =
                    $score->score;
            }

            $row = [];

            foreach ($featureIds as $criterionId) {
                $value = $scoresByPartner[$partnerIndex][$criterionId] ?? null;

                if (! is_int($value) && ! is_float($value)) {
                    // Nilai fitur belum lengkap: jangan menghitung klaster
                    // dengan angka pengganti.
                    return $analytics;
                }

                $row[] = (float) $value;
            }

            $matrix[] = $row;
        }

        $clusterCount = (int) config('recommendation.kmeans.cluster_count');

        try {
            $result = $algorithm->kmeans(
                $matrix,
                $clusterCount,
                (int) config('recommendation.kmeans.random_seed'),
            );
        } catch (AlgorithmServiceException) {
            $analytics['service_error'] =
                'Layanan analitik klaster sedang tidak tersedia.';

            return $analytics;
        }

        $featureCriteria = $criteria->whereIn('id', $featureIds)->values();
        $distribution = [];

        for ($clusterIndex = 0; $clusterIndex < $clusterCount; $clusterIndex++) {
            $memberIndices = array_keys(
                array_filter(
                    $result['labels'],
                    fn (int $label): bool => $label === $clusterIndex,
                ),
            );

            $featureAverages = $featureCriteria->map(function (
                Criterion $criterion,
            ) use ($memberIndices, $scoresByPartner): array {
                $values = [];

                foreach ($memberIndices as $partnerIndex) {
                    $value = $scoresByPartner[$partnerIndex][$criterion->id] ?? null;

                    if (is_int($value) || is_float($value)) {
                        $values[] = (float) $value;
                    }
                }

                return [
                    'criterion_id' => $criterion->id,
                    'criterion_name' => $criterion->name,
                    'average' => $values === []
                        ? null
                        : round(array_sum($values) / count($values), 4),
                ];
            })->values()->all();

            $distribution[] = [
                'cluster_index' => $clusterIndex,
                'partner_count' => count($memberIndices),
                'feature_averages' => $featureAverages,
            ];
        }

        $analytics['iterations'] = $result['iterations'];
        $analytics['converged'] = $result['converged'];
        $analytics['distribution'] = $distribution;

        return $analytics;
    }

    /**
     * @return list<string>
     */
    private function notes(): array
    {
        return [
            'Nilai mitra bersifat data kerja yang dimasukkan admin, bukan '
                .'data verifikasi resmi; metadata sumber/status verifikasi '
                .'mitra belum tersedia pada skema data.',
            'Peringkat SAW resmi tidak dihitung di halaman ini. Peringkat '
                .'hanya dikeluarkan melalui gate rekomendasi mahasiswa '
                .'(RECOMMENDATION_ENABLED dan keputusan yang masih terbuka).',
        ];
    }
}
