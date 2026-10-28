<?php

namespace App\Services;

use App\Exceptions\AlgorithmServiceException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AlgorithmService
{
    /**
     * @return array{configured: bool, message: string}
     */
    public function configurationStatus(): array
    {
        $url = config('services.algorithm.url');

        if (! is_string($url) || trim($url) === '') {
            return [
                'configured' => true,
                'message' => 'Komputasi algoritma lokal tersedia.',
            ];
        }

        $parts = parse_url(trim($url));
        $scheme = is_array($parts) ? strtolower((string) ($parts['scheme'] ?? '')) : '';

        if (
            ! is_array($parts)
            || ! in_array($scheme, ['http', 'https'], true)
            || empty($parts['host'])
        ) {
            return [
                'configured' => false,
                'message' => 'Konfigurasi URL layanan algoritma tidak valid.',
            ];
        }

        return [
            'configured' => true,
            'message' => 'Layanan algoritma eksternal terkonfigurasi.',
        ];
    }

    /**
     * @param  list<list<float>>  $matrix
     * @param  list<float>  $weights
     * @param  list<string>  $criteriaTypes
     * @return array{
     *     scores: list<float>,
     *     ranking: list<array{alternative_index: int, score: float, rank: int}>
     * }
     */
    public function saw(
        array $matrix,
        array $weights,
        array $criteriaTypes,
    ): array {
        $configuration = $this->configurationStatus();

        $url = config('services.algorithm.url');

        if (is_string($url) && trim($url) !== '') {
            return $this->sawRemote($matrix, $weights, $criteriaTypes);
        }

        return $this->sawLocal($matrix, $weights, $criteriaTypes);
    }

    /**
     * @param  list<list<float>>  $matrix
     * @param  list<float>  $weights
     * @param  list<string>  $criteriaTypes
     * @return array{
     *     scores: list<float>,
     *     ranking: list<array{alternative_index: int, score: float, rank: int}>
     * }
     */
    private function sawRemote(
        array $matrix,
        array $weights,
        array $criteriaTypes,
    ): array {
        $data = $this->request('/saw', [
            'matrix' => $matrix,
            'weights' => $weights,
            'criteria_types' => $criteriaTypes,
        ], 'SAW');

        $expectedCount = count($matrix);
        $scores = $data['scores'] ?? null;
        $ranking = $data['ranking'] ?? null;

        if (
            ! is_array($scores)
            || ! array_is_list($scores)
            || count($scores) !== $expectedCount
            || ! is_array($ranking)
            || ! array_is_list($ranking)
            || count($ranking) !== $expectedCount
        ) {
            throw new AlgorithmServiceException(
                'Respons layanan algoritma tidak valid.',
            );
        }

        $parsedScores = [];

        foreach ($scores as $score) {
            $number = $this->finiteNumber($score);

            if ($number === null || $number < 0) {
                throw new AlgorithmServiceException(
                    'Respons layanan algoritma tidak valid.',
                );
            }

            $parsedScores[] = $number;
        }

        $parsedRanking = [];
        $seenAlternatives = [];

        foreach ($ranking as $entry) {
            if (! is_array($entry)) {
                throw new AlgorithmServiceException(
                    'Respons layanan algoritma tidak valid.',
                );
            }

            $alternativeIndex = $entry['alternative_index'] ?? null;
            $score = $this->finiteNumber($entry['score'] ?? null);
            $rank = $entry['rank'] ?? null;

            if (
                ! is_int($alternativeIndex)
                || $alternativeIndex < 0
                || $alternativeIndex >= $expectedCount
                || isset($seenAlternatives[$alternativeIndex])
                || $score === null
                || ! is_int($rank)
                || $rank < 1
                || ! array_key_exists($alternativeIndex, $parsedScores)
                || abs($parsedScores[$alternativeIndex] - $score) > 1e-9
            ) {
                throw new AlgorithmServiceException(
                    'Respons layanan algoritma tidak valid.',
                );
            }

            $seenAlternatives[$alternativeIndex] = true;
            $parsedRanking[] = [
                'alternative_index' => $alternativeIndex,
                'score' => $score,
                'rank' => $rank,
            ];
        }

        return [
            'scores' => $parsedScores,
            'ranking' => $parsedRanking,
        ];
    }

    /**
     * Compute SAW locally without external service.
     *
     * @param  list<list<float>>  $matrix
     * @param  list<float>  $weights
     * @param  list<string>  $criteriaTypes
     * @return array{
     *     scores: list<float>,
     *     ranking: list<array{alternative_index: int, score: float, rank: int}>
     * }
     */
    private function sawLocal(
        array $matrix,
        array $weights,
        array $criteriaTypes,
    ): array {
        $rowCount = count($matrix);

        if ($rowCount === 0) {
            return [
                'scores' => [],
                'ranking' => [],
            ];
        }

        $criteriaCount = count($matrix[0]);

        // Validate weights
        if (! is_array($weights) || count($weights) !== $criteriaCount) {
            throw new AlgorithmServiceException(
                'Jumlah bobot tidak sesuai dengan jumlah kriteria.',
            );
        }

        $parsedWeights = [];
        foreach ($weights as $index => $weight) {
            $number = $this->finiteNumber($weight);

            if ($number === null || $number < 0) {
                throw new AlgorithmServiceException(
                    'Bobot kriteria ke-'.($index + 1).' tidak valid.',
                );
            }

            $parsedWeights[] = $number;
        }

        $totalWeight = array_sum($parsedWeights);

        if ($totalWeight <= 0) {
            throw new AlgorithmServiceException(
                'Total bobot harus lebih besar dari nol.',
            );
        }

        // Validate criteria types
        if (! is_array($criteriaTypes) || count($criteriaTypes) !== $criteriaCount) {
            throw new AlgorithmServiceException(
                'Jumlah tipe kriteria tidak sesuai dengan jumlah kriteria.',
            );
        }

        foreach ($criteriaTypes as $index => $type) {
            if (! is_string($type) || ! in_array($type, ['benefit', 'cost'], true)) {
                throw new AlgorithmServiceException(
                    'Tipe kriteria ke-'.($index + 1).' harus "benefit" atau "cost".',
                );
            }
        }

        // Validate matrix values
        foreach ($matrix as $rowIndex => $row) {
            if (! is_array($row) || count($row) !== $criteriaCount) {
                throw new AlgorithmServiceException(
                    'Baris matriks ke-'.($rowIndex + 1).' tidak valid.',
                );
            }

            foreach ($row as $colIndex => $value) {
                $number = $this->finiteNumber($value);

                if ($number === null || $number < 0) {
                    throw new AlgorithmServiceException(
                        'Nilai matriks baris ke-'.($rowIndex + 1).', kolom ke-'.($colIndex + 1).' tidak valid.',
                    );
                }
            }
        }

        // Normalize
        $normalized = [];

        for ($criterionIndex = 0; $criterionIndex < $criteriaCount; $criterionIndex++) {
            $column = [];

            foreach ($matrix as $row) {
                $column[] = $row[$criterionIndex];
            }

            if ($criteriaTypes[$criterionIndex] === 'benefit') {
                $maximum = max($column);

                if ($maximum === 0) {
                    throw new AlgorithmServiceException(
                        'Normalisasi benefit kriteria ke-'.($criterionIndex + 1).' tidak dapat dilakukan karena seluruh nilainya nol.',
                    );
                }

                foreach ($matrix as $rowIndex => $row) {
                    $normalized[$rowIndex][$criterionIndex] = $row[$criterionIndex] / $maximum;
                }
            } else {
                // cost
                $minimum = min($column);

                if ($minimum === 0) {
                    throw new AlgorithmServiceException(
                        'Normalisasi cost kriteria ke-'.($criterionIndex + 1).' tidak dapat dilakukan karena terdapat nilai nol.',
                    );
                }

                foreach ($matrix as $rowIndex => $row) {
                    $normalized[$rowIndex][$criterionIndex] = $minimum / $row[$criterionIndex];
                }
            }
        }

        // Compute scores
        $scores = [];

        foreach ($matrix as $rowIndex => $row) {
            $score = 0.0;

            for ($criterionIndex = 0; $criterionIndex < $criteriaCount; $criterionIndex++) {
                $score += $parsedWeights[$criterionIndex] * $normalized[$rowIndex][$criterionIndex];
            }

            $scores[] = $score;
        }

        // Rank (competition ranking: equal scores share rank, next distinct takes following position)
        $orderedIndices = array_keys($scores);
        usort($orderedIndices, function ($a, $b) use ($scores) {
            if ($scores[$a] === $scores[$b]) {
                return $a <=> $b;
            }

            return $scores[$b] <=> $scores[$a];
        });

        $ranking = [];
        $previousScore = null;
        $currentRank = 0;

        foreach ($orderedIndices as $position => $alternativeIndex) {
            $score = $scores[$alternativeIndex];

            if ($previousScore === null || $score !== $previousScore) {
                $currentRank = $position + 1;
                $previousScore = $score;
            }

            $ranking[] = [
                'alternative_index' => $alternativeIndex,
                'score' => $score,
                'rank' => $currentRank,
            ];
        }

        return [
            'scores' => $scores,
            'ranking' => $ranking,
        ];
    }

    /**
     * @param  list<list<float>>  $data
     * @return array{
     *     labels: list<int>,
     *     iterations: int,
     *     converged: bool
     * }
     */
    public function kmeans(
        array $data,
        int $clusterCount,
        int $randomSeed,
    ): array {
        $configuration = $this->configurationStatus();

        $url = config('services.algorithm.url');

        if (is_string($url) && trim($url) !== '') {
            return $this->kmeansRemote($data, $clusterCount, $randomSeed);
        }

        return $this->kmeansLocal($data, $clusterCount, $randomSeed);
    }

    /**
     * @param  list<list<float>>  $data
     * @return array{
     *     labels: list<int>,
     *     iterations: int,
     *     converged: bool
     * }
     */
    private function kmeansRemote(
        array $data,
        int $clusterCount,
        int $randomSeed,
    ): array {
        $result = $this->request('/kmeans', [
            'data' => $data,
            'n_clusters' => $clusterCount,
            'random_seed' => $randomSeed,
        ], 'K-Means');

        $labels = $result['labels'] ?? null;
        $iterations = $result['iterations'] ?? null;
        $converged = $result['converged'] ?? null;
        $centroids = $result['centroids'] ?? null;
        $expectedCount = count($data);
        $dimensions = $data === [] ? 0 : count($data[0]);

        if (
            ! is_array($labels)
            || ! array_is_list($labels)
            || count($labels) !== $expectedCount
            || ! is_int($iterations)
            || $iterations < 1
            || ! is_bool($converged)
            || ! is_array($centroids)
            || ! array_is_list($centroids)
            || count($centroids) !== $clusterCount
        ) {
            throw new AlgorithmServiceException(
                'Respons layanan algoritma tidak valid.',
            );
        }

        $parsedLabels = [];

        foreach ($labels as $label) {
            if (! is_int($label) || $label < 0 || $label >= $clusterCount) {
                throw new AlgorithmServiceException(
                    'Respons layanan algoritma tidak valid.',
                );
            }

            $parsedLabels[] = $label;
        }

        foreach ($centroids as $centroid) {
            if (
                ! is_array($centroid)
                || ! array_is_list($centroid)
                || count($centroid) !== $dimensions
            ) {
                throw new AlgorithmServiceException(
                    'Respons layanan algoritma tidak valid.',
                );
            }

            foreach ($centroid as $value) {
                if ($this->finiteNumber($value) === null) {
                    throw new AlgorithmServiceException(
                        'Respons layanan algoritma tidak valid.',
                    );
                }
            }
        }

        return [
            'labels' => $parsedLabels,
            'iterations' => $iterations,
            'converged' => $converged,
        ];
    }

    /**
     * Compute K-Means locally without external service (Lloyd's algorithm).
     *
     * @param  list<list<float>>  $data
     * @return array{
     *     labels: list<int>,
     *     iterations: int,
     *     converged: bool
     * }
     */
    private function kmeansLocal(
        array $data,
        int $clusterCount,
        int $randomSeed,
    ): array {
        $sampleCount = count($data);

        if ($sampleCount === 0) {
            throw new AlgorithmServiceException('Data kosong tidak dapat diklaster.');
        }

        $dimensions = count($data[0]);

        if ($clusterCount < 1) {
            throw new AlgorithmServiceException('Jumlah cluster minimal 1.');
        }

        if ($clusterCount > $sampleCount) {
            throw new AlgorithmServiceException(
                'Jumlah cluster tidak boleh melebihi jumlah data.',
            );
        }

        // Validate all rows have same dimensions and finite values
        foreach ($data as $rowIndex => $row) {
            if (! is_array($row) || count($row) !== $dimensions) {
                throw new AlgorithmServiceException(
                    'Baris data ke-'.($rowIndex + 1).' memiliki dimensi yang tidak konsisten.',
                );
            }

            foreach ($row as $value) {
                if ($this->finiteNumber($value) === null) {
                    throw new AlgorithmServiceException(
                        'Nilai data baris ke-'.($rowIndex + 1).' tidak valid.',
                    );
                }
            }
        }

        mt_srand($randomSeed);
        $initialIndices = [];

        while (count($initialIndices) < $clusterCount) {
            $initialIndices[] = mt_rand(0, $sampleCount - 1);
        }

        $initialIndices = array_values(array_unique($initialIndices));

        // Ensure unique initial centroids
        while (count($initialIndices) < $clusterCount) {
            $initialIndices[] = mt_rand(0, $sampleCount - 1);
            $initialIndices = array_values(array_unique($initialIndices));
        }

        sort($initialIndices);

        $centroids = [];

        foreach ($initialIndices as $index) {
            $centroids[] = $data[$index];
        }

        $labels = array_fill(0, $sampleCount, -1);
        $converged = false;
        $iterations = 0;
        $maxIterations = 100;
        $tolerance = 1e-9;

        for ($iteration = 1; $iteration <= $maxIterations; $iteration++) {
            $iterations = $iteration;

            // Assign nearest cluster
            $nextLabels = [];

            foreach ($data as $sampleIndex => $sample) {
                $bestCluster = 0;
                $bestDistance = $this->squaredDistance($sample, $centroids[0]);

                for ($clusterIndex = 1; $clusterIndex < $clusterCount; $clusterIndex++) {
                    $distance = $this->squaredDistance($sample, $centroids[$clusterIndex]);

                    if ($distance < $bestDistance) {
                        $bestDistance = $distance;
                        $bestCluster = $clusterIndex;
                    }
                }

                $nextLabels[] = $bestCluster;
            }

            // Recompute centroids
            $nextCentroids = [];

            for ($clusterIndex = 0; $clusterIndex < $clusterCount; $clusterIndex++) {
                $sum = array_fill(0, $dimensions, 0.0);
                $count = 0;

                foreach ($data as $sampleIndex => $sample) {
                    if ($nextLabels[$sampleIndex] === $clusterIndex) {
                        $count++;
                        for ($d = 0; $d < $dimensions; $d++) {
                            $sum[$d] += $sample[$d];
                        }
                    }
                }

                if ($count === 0) {
                    // Keep previous centroid for empty cluster
                    $nextCentroids[] = $centroids[$clusterIndex];
                } else {
                    $nextCentroid = [];

                    for ($d = 0; $d < $dimensions; $d++) {
                        $nextCentroid[] = $sum[$d] / $count;
                    }

                    $nextCentroids[] = $nextCentroid;
                }
            }

            // Check convergence
            $shift = 0.0;

            for ($clusterIndex = 0; $clusterIndex < $clusterCount; $clusterIndex++) {
                $shift += $this->squaredDistance($centroids[$clusterIndex], $nextCentroids[$clusterIndex]);
            }

            $shift = sqrt($shift);

            $labelsUnchanged = $nextLabels === $labels;
            $labels = $nextLabels;
            $centroids = $nextCentroids;

            if ($labelsUnchanged || $shift <= $tolerance) {
                $converged = true;
                break;
            }
        }

        return [
            'labels' => array_values($labels),
            'iterations' => $iterations,
            'converged' => $converged,
        ];
    }

    /**
     * @return array{
     *     ok: bool,
     *     service: string
     * }
     */
    public function health(): array
    {
        $url = config('services.algorithm.url');

        if (! is_string($url) || trim($url) === '') {
            return [
                'ok' => true,
                'service' => 'local',
            ];
        }

        return $this->healthRemote();
    }

    /**
     * @return array{
     *     ok: bool,
     *     service: string
     * }
     */
    private function healthRemote(): array
    {
        $timeout = $this->boundedTimeout('services.algorithm.timeout', 5);
        $connectTimeout = min(
            $timeout,
            $this->boundedTimeout('services.algorithm.connect_timeout', 3),
        );

        try {
            $response = Http::baseUrl(rtrim((string) config('services.algorithm.url'), '/'))
                ->acceptJson()
                ->asJson()
                ->timeout($timeout)
                ->connectTimeout($connectTimeout)
                ->get('/health');
        } catch (ConnectionException) {
            throw new AlgorithmServiceException(
                'Layanan algoritma tidak dapat dihubungi atau melewati batas waktu.',
            );
        }

        if (! $response->successful()) {
            throw new AlgorithmServiceException(
                'Layanan algoritma mengembalikan respons gagal.',
            );
        }

        $body = $response->json();

        if (
            ! is_array($body)
            || ($body['success'] ?? null) !== true
            || ! is_array($body['data'] ?? null)
            || ! is_string($body['data']['status'] ?? null)
        ) {
            throw new AlgorithmServiceException(
                'Respons layanan algoritma tidak valid.',
            );
        }

        return [
            'ok' => true,
            'service' => $body['data']['service'] ?? 'spk-algorithm',
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function request(string $path, array $payload, string $operation): array
    {
        $configuration = $this->configurationStatus();

        if (! $configuration['configured']) {
            throw new AlgorithmServiceException($configuration['message']);
        }

        $url = rtrim((string) config('services.algorithm.url'), '/');
        $timeout = $this->boundedTimeout('services.algorithm.timeout', 5);
        $connectTimeout = min(
            $timeout,
            $this->boundedTimeout('services.algorithm.connect_timeout', 3),
        );

        try {
            $response = Http::baseUrl($url)
                ->acceptJson()
                ->asJson()
                ->timeout($timeout)
                ->connectTimeout($connectTimeout)
                ->post($path, $payload);
        } catch (ConnectionException) {
            Log::warning('Algorithm service connection failed.', [
                'operation' => $operation,
            ]);

            throw new AlgorithmServiceException(
                'Layanan algoritma tidak dapat dihubungi atau melewati batas waktu.',
            );
        }

        if (! $response->successful()) {
            Log::warning('Algorithm service returned an unsuccessful response.', [
                'operation' => $operation,
                'status' => $response->status(),
            ]);

            throw new AlgorithmServiceException(
                'Layanan algoritma mengembalikan respons gagal.',
            );
        }

        $body = $response->json();

        if (
            ! is_array($body)
            || ($body['success'] ?? null) !== true
            || ! is_array($body['data'] ?? null)
        ) {
            throw new AlgorithmServiceException(
                'Respons layanan algoritma tidak valid.',
            );
        }

        return $body['data'];
    }

    private function boundedTimeout(string $key, int $default): int
    {
        $value = config($key, $default);

        if (is_string($value) && ctype_digit($value)) {
            $value = (int) $value;
        }

        if (! is_int($value)) {
            return $default;
        }

        return max(1, min(30, $value));
    }

    private function finiteNumber(mixed $value): ?float
    {
        if (! is_int($value) && ! is_float($value)) {
            return null;
        }

        $number = (float) $value;

        return is_finite($number) ? $number : null;
    }

    private function squaredDistance(array $first, array $second): float
    {
        $sum = 0.0;

        foreach ($first as $index => $value) {
            $diff = $value - $second[$index];
            $sum += $diff * $diff;
        }

        return $sum;
    }
}
