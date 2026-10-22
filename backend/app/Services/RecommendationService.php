<?php

namespace App\Services;

use App\Enums\CriterionType;
use App\Exceptions\AlgorithmServiceException;
use App\Models\Criterion;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class RecommendationService
{
    public function __construct(
        private AlgorithmService $algorithm,
        private AcademicPrerequisiteEvaluator $prerequisites,
    ) {}

    /**
     * @return array{
     *     status: string,
     *     message: string,
     *     checks: list<array{
     *         key: string,
     *         label: string,
     *         category: string,
     *         status: string,
     *         message: string
     *     }>,
     *     criteria: list<array{id: int, name: string, type: string, weight: float}>,
     *     ranking: list<array{
     *         rank: int,
     *         partner_id: int,
     *         partner_name: string,
     *         score: float,
     *         cluster_index: int|null
     *     }>,
     *     kmeans: array{
     *         cluster_count: int,
     *         random_seed: int,
     *         feature_criterion_ids: list<int>,
     *         iterations: int,
     *         converged: bool,
     *         partner_count: int
     *     }|null,
     *     explanation: string|null,
     *     disclaimer: string|null
     * }
     *
     * @throws AlgorithmServiceException
     */
    public function evaluate(
        ?string $peminatan,
        ?string $peminatanIssue = null,
        ?User $student = null,
    ): array {
        $criteria = Criterion::query()
            ->orderBy('id')
            ->get();

        $partners = Partner::query()
            ->with('criterionScores')
            ->orderBy('name')
            ->orderBy('id')
            ->get();

        $criteriaPayload = $criteria
            ->map(fn (Criterion $criterion): array => [
                'id' => $criterion->id,
                'name' => $criterion->name,
                'type' => $criterion->type->value,
                'weight' => $criterion->weight,
            ])
            ->values()
            ->all();

        $checks = [];
        $scoresByPartner = [];

        $checks[] = $this->check(
            'activation',
            'Aktivasi rekomendasi',
            $this->activationEnabled()
                ? null
                : 'Mode rekomendasi belum diaktifkan secara eksplisit oleh pemilik sistem.',
            'Mode rekomendasi diaktifkan secara eksplisit.',
            'decision',
        );

        $criteriaIssue = null;
        $criteriaOk = '';

        if ($criteria->isEmpty()) {
            $criteriaIssue = 'Belum ada kriteria penilaian yang tersimpan.';
        } else {
            $invalidWeights = [];
            $totalWeight = 0.0;

            foreach ($criteria as $criterion) {
                $weight = $this->finiteNumber($criterion->weight);

                if ($weight === null || $weight < 0) {
                    $invalidWeights[] = $criterion->name;

                    continue;
                }

                $totalWeight += $weight;
            }

            if ($invalidWeights !== []) {
                $criteriaIssue = 'Bobot kriteria tidak valid untuk: '
                    .$this->limitedList($invalidWeights)
                    .'. Bobot harus berupa angka finite dan tidak negatif.';
            } elseif ($totalWeight <= 0) {
                $criteriaIssue = 'Total bobot kriteria harus lebih besar dari nol.';
            } else {
                $criteriaOk = $criteria->count()
                    .' kriteria tersedia dengan total bobot '
                    .$totalWeight
                    .'.';
            }
        }

        $checks[] = $this->check(
            'criteria',
            'Data kriteria',
            $criteriaIssue,
            $criteriaOk,
            'decision',
        );

        $checks[] = $this->check(
            'partners',
            'Data mitra',
            $partners->isEmpty()
                ? 'Belum ada mitra magang yang dapat dinilai.'
                : null,
            $partners->count().' mitra tersedia.',
        );

        $scoresIssue = null;
        $scoresOk = '';

        if ($criteria->isEmpty() || $partners->isEmpty()) {
            $scoresIssue = 'Kelengkapan nilai belum dapat diperiksa karena data kriteria atau mitra belum tersedia.';
        } else {
            $missingPairs = [];
            $invalidScores = [];

            foreach ($partners as $partnerIndex => $partner) {
                $scoresByPartner[$partnerIndex] = [];
                $scoresByCriterion = $partner->criterionScores
                    ->keyBy('criterion_id');

                foreach ($criteria as $criterion) {
                    $scoreRecord = $scoresByCriterion->get($criterion->id);

                    if ($scoreRecord === null) {
                        $missingPairs[] = $partner->name.' / '.$criterion->name;

                        continue;
                    }

                    $score = $this->finiteNumber($scoreRecord->score);

                    if ($score === null || $score < 0) {
                        $invalidScores[] = $partner->name.' / '.$criterion->name;

                        continue;
                    }

                    $scoresByPartner[$partnerIndex][$criterion->id] = $score;
                }
            }

            if ($missingPairs !== []) {
                $scoresIssue = 'Nilai belum lengkap untuk '
                    .count($missingPairs)
                    .' pasangan mitra-kriteria: '
                    .$this->limitedList($missingPairs)
                    .'. Nilai yang hilang tidak dianggap nol.';
            } elseif ($invalidScores !== []) {
                $scoresIssue = 'Nilai tidak valid untuk: '
                    .$this->limitedList($invalidScores)
                    .'. Nilai harus berupa angka finite dan tidak negatif.';
            } else {
                $consistencyIssues = [];
                $partnerIndices = array_keys($scoresByPartner);

                foreach ($criteria as $criterion) {
                    $column = [];

                    foreach ($partnerIndices as $partnerIndex) {
                        $column[] = $scoresByPartner[$partnerIndex][$criterion->id];
                    }

                    if (
                        $criterion->type === CriterionType::Cost
                        && min($column) <= 0
                    ) {
                        $consistencyIssues[] = $criterion->name
                            .' (cost): semua nilai harus lebih besar dari nol';
                    }

                    if (
                        $criterion->type === CriterionType::Benefit
                        && max($column) <= 0
                    ) {
                        $consistencyIssues[] = $criterion->name
                            .' (benefit): minimal satu nilai harus lebih besar dari nol';
                    }
                }

                if ($consistencyIssues !== []) {
                    $scoresIssue = 'Nilai belum konsisten untuk normalisasi SAW: '
                        .$this->limitedList($consistencyIssues)
                        .'.';
                } else {
                    $scoresOk = 'Semua mitra memiliki nilai lengkap dan konsisten untuk '
                        .$criteria->count()
                        .' kriteria.';
                }
            }
        }

        $checks[] = $this->check(
            'scores',
            'Kelengkapan nilai mitra',
            $scoresIssue,
            $scoresOk,
        );

        $prerequisiteResult = $this->prerequisites->evaluate($student);

        $checks[] = $this->check(
            'prerequisites',
            'Aturan nilai prasyarat',
            $prerequisiteResult['issue'],
            $prerequisiteResult['ok'],
            'decision',
        );

        $peminatanIssue ??= $peminatan === null
            ? 'Peminatan mahasiswa belum dipilih.'
            : null;

        $checks[] = $this->check(
            'peminatan',
            'Peminatan mahasiswa',
            $peminatanIssue,
            $peminatan === null
                ? 'Peminatan mahasiswa tersedia.'
                : 'Peminatan '.$peminatan.' tersedia.',
        );

        $rawClusterCount = config('recommendation.kmeans.cluster_count');
        $clusterCount = $this->positiveInteger($rawClusterCount);
        $randomSeed = $this->integerValue(
            config('recommendation.kmeans.random_seed'),
        );
        $rawFeatures = config('recommendation.kmeans.feature_criterion_ids');
        $featureIds = $this->positiveIntegerList($rawFeatures);
        $kmeansIssues = [];

        if ($clusterCount === null) {
            $kmeansIssues[] = 'Jumlah cluster K-Means belum ditetapkan (OD-010).';
        }

        if ($randomSeed === null) {
            $kmeansIssues[] = 'Random seed K-Means belum ditetapkan.';
        }

        if ($featureIds === null) {
            $kmeansIssues[] = 'Daftar fitur K-Means tidak valid.';
        } elseif ($featureIds === []) {
            $kmeansIssues[] = 'Atribut/fitur K-Means belum ditetapkan (OD-009).';
        } else {
            $availableCriterionIds = $criteria->pluck('id')->all();

            if (array_diff($featureIds, $availableCriterionIds) !== []) {
                $kmeansIssues[] = 'Fitur K-Means merujuk kriteria yang tidak tersedia.';
            }
        }

        if (
            $clusterCount !== null
            && $partners->isNotEmpty()
            && $clusterCount > $partners->count()
        ) {
            $kmeansIssues[] = 'Jumlah cluster K-Means melebihi jumlah mitra yang tersedia.';
        }

        // Proposal menetapkan K-Means sebagai analitik profil mitra untuk
        // dashboard, bukan syarat ranking SAW. Pemeriksaan ini karena itu
        // berkategori analysis dan tidak memblokir status readiness.
        $checks[] = $this->check(
            'kmeans_configuration',
            'Konfigurasi K-Means (analitik)',
            $kmeansIssues === [] ? null : implode(' ', $kmeansIssues),
            $clusterCount.' cluster dan '.count($featureIds ?? []).' fitur K-Means dikonfigurasi.',
            'analysis',
        );

        $rawMapping = config('recommendation.peminatan_cluster_map');
        $mapping = is_array($rawMapping) ? $rawMapping : null;
        $mappingClusters = null;
        $mappingIssue = null;

        if ($mapping === null) {
            $mappingIssue = 'Konfigurasi pemetaan cluster ke peminatan tidak valid.';
        } elseif ($mapping === []) {
            $mappingIssue = 'Pemetaan cluster ke peminatan belum ditetapkan (OD-011/OD-015).';
        } elseif ($peminatan === null) {
            $mappingIssue = 'Peminatan mahasiswa belum tersedia, sehingga pemetaan cluster tidak dapat dipilih.';
        } elseif (! array_key_exists($peminatan, $mapping)) {
            $mappingIssue = 'Pemetaan untuk peminatan '.$peminatan.' belum tersedia.';
        } else {
            $mappingClusters = $this->nonNegativeIntegerList($mapping[$peminatan]);

            if ($mappingClusters === null || $mappingClusters === []) {
                $mappingIssue = 'Pemetaan cluster untuk peminatan '.$peminatan.' tidak valid.';
            } elseif (
                $clusterCount !== null
                && array_filter(
                    $mappingClusters,
                    fn (int $cluster): bool => $cluster >= $clusterCount,
                ) !== []
            ) {
                $mappingIssue = 'Pemetaan cluster untuk peminatan '
                    .$peminatan
                    .' merujuk indeks cluster di luar jumlah cluster.';
            }
        }

        // Label cluster bersifat analitik dan tidak menyaring mitra sebelum
        // SAW (proposal 4.1). Pemeriksaan ini hanya melaporkan status
        // keputusan pelabelan yang masih terbuka (OD-011/OD-015).
        $checks[] = $this->check(
            'peminatan_cluster_map',
            'Label cluster untuk analitik',
            $mappingIssue === null
                ? null
                : $mappingIssue.' Label cluster tidak dipakai untuk menyaring ranking SAW.',
            'Label cluster untuk peminatan '.$peminatan.' tersedia.',
            'analysis',
        );

        $rawRankingLimit = config('recommendation.ranking.limit');
        $rankingLimit = $this->positiveInteger($rawRankingLimit);
        $rankingIssue = match (true) {
            $rawRankingLimit === null || $rawRankingLimit === '' => 'Jumlah rekomendasi yang ditampilkan belum ditetapkan (OD-014).',
            $rankingLimit === null => 'Konfigurasi jumlah rekomendasi tidak valid.',
            default => null,
        };

        $checks[] = $this->check(
            'ranking_policy',
            'Kebijakan ranking',
            $rankingIssue,
            'Maksimal '.($rankingLimit ?? 0).' mitra akan ditampilkan.',
            'decision',
        );

        $algorithmStatus = $this->algorithm->configurationStatus();

        $checks[] = $this->check(
            'algorithm_service',
            'Layanan algoritma',
            $algorithmStatus['configured']
                ? null
                : $algorithmStatus['message'],
            'URL layanan algoritma tersedia.',
            'technical',
        );

        // Checks kategori analysis (konfigurasi K-Means dan label cluster)
        // hanya untuk dashboard; ranking SAW tidak menunggunya.
        foreach ($checks as $check) {
            if (
                $check['status'] !== 'ok'
                && $check['category'] !== 'analysis'
            ) {
                return [
                    'status' => 'not_ready',
                    'message' => 'Rekomendasi belum dapat dihitung karena pemeriksaan berikut belum terpenuhi.',
                    'checks' => $checks,
                    'criteria' => $criteriaPayload,
                    'ranking' => [],
                    'kmeans' => null,
                    'explanation' => null,
                    'disclaimer' => null,
                ];
            }
        }

        // All gating checks passed; the null coalescing of the ranking limit
        // is defensive and should be unreachable after the readiness gate.
        $rankingLimit ??= 0;

        // K-Means is analytics only (proposal 4.1 and 6.4): it runs when its
        // configuration is complete and it never filters the SAW candidates.
        $kmeansSummary = null;
        $kmeansFailure = null;
        $clusterLabels = array_fill(0, $partners->count(), null);

        if ($kmeansIssues === []) {
            $kmeansMatrix = [];

            foreach ($partners as $partnerIndex => $partner) {
                $row = [];

                foreach ($featureIds ?? [] as $criterionId) {
                    $row[] = $scoresByPartner[$partnerIndex][$criterionId];
                }

                $kmeansMatrix[] = $row;
            }

            try {
                $kmeansResult = $this->algorithm->kmeans(
                    $kmeansMatrix,
                    (int) $clusterCount,
                    (int) $randomSeed,
                );

                $clusterLabels = $kmeansResult['labels'];

                $kmeansSummary = [
                    'cluster_count' => (int) $clusterCount,
                    'random_seed' => (int) $randomSeed,
                    'feature_criterion_ids' => $featureIds ?? [],
                    'iterations' => $kmeansResult['iterations'],
                    'converged' => $kmeansResult['converged'],
                    'partner_count' => $partners->count(),
                ];
            } catch (AlgorithmServiceException) {
                $kmeansFailure = 'Analitik K-Means gagal dihitung.';
                Log::warning('K-Means analytics failed; SAW ranking continues.');
            }
        }

        if ($kmeansFailure !== null) {
            $checks[] = $this->check(
                'kmeans_execution',
                'Eksekusi analitik K-Means',
                $kmeansFailure.' Ranking SAW tetap dibuat tanpa label klaster.',
                'Analitik K-Means berhasil dihitung.',
                'analysis',
            );
        }

        // SAW ranks every mitra that has a complete score matrix. Cluster
        // labels are analytics output, never a pre-SAW filter (proposal 4.1).
        $sawMatrix = [];

        foreach ($partners as $partnerIndex => $partner) {
            $row = [];

            foreach ($criteria as $criterion) {
                $row[] = $scoresByPartner[$partnerIndex][$criterion->id];
            }

            $sawMatrix[] = $row;
        }

        $weights = $criteria
            ->map(fn (Criterion $criterion): float => $criterion->weight)
            ->values()
            ->all();
        $criteriaTypes = $criteria
            ->map(fn (Criterion $criterion): string => $criterion->type->value)
            ->values()
            ->all();

        $sawResult = $this->algorithm->saw(
            $sawMatrix,
            $weights,
            $criteriaTypes,
        );

        $ranking = [];

        foreach ($sawResult['ranking'] as $entry) {
            $partner = $partners[$entry['alternative_index']];

            $ranking[] = [
                'rank' => $entry['rank'],
                'partner_id' => $partner->id,
                'partner_name' => $partner->name,
                'score' => $entry['score'],
                'cluster_index' => $clusterLabels[$entry['alternative_index']],
            ];
        }

        $ranking = array_slice($ranking, 0, $rankingLimit);

        $explanation = 'Peringkat SAW dihitung dari seluruh mitra dengan '
            .'nilai lengkap menggunakan '
            .$criteria->count()
            .' kriteria dan bobot yang tersimpan. ';

        if ($kmeansFailure !== null) {
            $explanation .= 'Analitik K-Means gagal dihitung; label klaster '
                .'tidak tersedia dan tidak dipakai untuk menyaring. ';
        } elseif ($kmeansSummary === null) {
            $explanation .= 'Analitik K-Means belum dihitung karena '
                .'konfigurasinya belum lengkap; label klaster tidak dipakai '
                .'untuk menyaring. ';
        } else {
            $explanation .= 'K-Means berjalan sebagai analitik untuk seluruh mitra ('
                .$kmeansSummary['cluster_count']
                .' cluster, '
                .count($kmeansSummary['feature_criterion_ids'])
                .' fitur) dan label klaster tidak dipakai untuk menyaring. ';
        }

        $explanation .= 'Maksimal '
            .$rankingLimit
            .' mitra ditampilkan sesuai kebijakan ranking yang dikonfigurasi.';

        return [
            'status' => 'ready',
            'message' => 'Perhitungan rekomendasi selesai.',
            'checks' => $checks,
            'criteria' => $criteriaPayload,
            'ranking' => $ranking,
            'kmeans' => $kmeansSummary,
            'explanation' => $explanation,
            'disclaimer' => 'Hasil ini adalah keluaran perhitungan berdasarkan konfigurasi yang tersimpan, bukan jaminan penerimaan magang.',
        ];
    }

    /**
     * @return array{
     *     key: string,
     *     label: string,
     *     category: string,
     *     status: string,
     *     message: string
     * }
     */
    private function check(
        string $key,
        string $label,
        ?string $issue,
        string $okMessage,
        string $category = 'data',
    ): array {
        return [
            'key' => $key,
            'label' => $label,
            'category' => $category,
            'status' => $issue === null ? 'ok' : 'blocked',
            'message' => $issue ?? $okMessage,
        ];
    }

    private function activationEnabled(): bool
    {
        $value = config('recommendation.enabled');

        if ($value === true || $value === 1) {
            return true;
        }

        return is_string($value)
            && in_array(strtolower(trim($value)), ['1', 'true'], true);
    }

    /**
     * @param  list<string>  $items
     */
    private function limitedList(array $items, int $limit = 5): string
    {
        $shown = array_slice($items, 0, $limit);
        $message = implode(', ', $shown);

        if (count($items) > $limit) {
            $message .= ', dan '.(count($items) - $limit).' lainnya';
        }

        return $message;
    }

    private function finiteNumber(mixed $value): ?float
    {
        if (! is_int($value) && ! is_float($value)) {
            return null;
        }

        $number = (float) $value;

        return is_finite($number) ? $number : null;
    }

    private function positiveInteger(mixed $value): ?int
    {
        $number = $this->integerValue($value);

        return $number !== null && $number > 0 ? $number : null;
    }

    private function integerValue(mixed $value): ?int
    {
        if (is_int($value)) {
            return $value;
        }

        if (is_string($value) && preg_match('/^-?\d+$/', trim($value)) === 1) {
            return (int) trim($value);
        }

        return null;
    }

    /**
     * @return list<int>|null
     */
    private function positiveIntegerList(mixed $value): ?array
    {
        if (! is_array($value) || ! array_is_list($value)) {
            return null;
        }

        $result = [];

        foreach ($value as $item) {
            $number = $this->positiveInteger($item);

            if ($number === null || in_array($number, $result, true)) {
                return null;
            }

            $result[] = $number;
        }

        return $result;
    }

    /**
     * @return list<int>|null
     */
    private function nonNegativeIntegerList(mixed $value): ?array
    {
        if (! is_array($value) || ! array_is_list($value)) {
            return null;
        }

        $result = [];

        foreach ($value as $item) {
            $number = $this->integerValue($item);

            if ($number === null || $number < 0 || in_array($number, $result, true)) {
                return null;
            }

            $result[] = $number;
        }

        return $result;
    }
}
