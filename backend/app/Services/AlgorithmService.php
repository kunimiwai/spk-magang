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
                'configured' => false,
                'message' => 'Layanan algoritma belum dikonfigurasi.',
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
            'message' => 'Layanan algoritma terkonfigurasi.',
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
}
