<?php

namespace Tests\Feature\Api;

use App\Exceptions\AlgorithmServiceException;
use App\Services\AlgorithmService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AlgorithmServiceTest extends TestCase
{
    public function test_service_is_reported_unconfigured_without_an_http_request(): void
    {
        config(['services.algorithm.url' => null]);
        Http::fake();

        $service = app(AlgorithmService::class);

        $this->assertFalse($service->configurationStatus()['configured']);

        try {
            $service->saw([[1.0]], [1.0], ['benefit']);
            $this->fail('Expected AlgorithmServiceException.');
        } catch (AlgorithmServiceException $exception) {
            $this->assertSame(
                'Layanan algoritma belum dikonfigurasi.',
                $exception->getMessage(),
            );
        }

        Http::assertNothingSent();
    }

    public function test_invalid_service_url_is_rejected(): void
    {
        config(['services.algorithm.url' => 'bukan-url']);
        Http::fake();

        $service = app(AlgorithmService::class);

        $this->assertFalse($service->configurationStatus()['configured']);
        $this->assertSame(
            'Konfigurasi URL layanan algoritma tidak valid.',
            $service->configurationStatus()['message'],
        );
    }

    public function test_saw_request_and_response_are_validated(): void
    {
        config(['services.algorithm.url' => 'http://algorithm.test']);
        Http::fake([
            'http://algorithm.test/saw' => Http::response([
                'success' => true,
                'data' => [
                    'normalized_matrix' => [[1.0, 1.0], [0.75, 0.5]],
                    'scores' => [1.0, 0.65],
                    'ranking' => [
                        ['alternative_index' => 0, 'score' => 1.0, 'rank' => 1],
                        ['alternative_index' => 1, 'score' => 0.65, 'rank' => 2],
                    ],
                ],
            ]),
        ]);

        $result = app(AlgorithmService::class)->saw(
            [[4.0, 2.0], [3.0, 1.0]],
            [0.6, 0.4],
            ['benefit', 'cost'],
        );

        $this->assertSame([1.0, 0.65], $result['scores']);
        $this->assertSame(0, $result['ranking'][0]['alternative_index']);

        Http::assertSent(function (Request $request): bool {
            return $request->url() === 'http://algorithm.test/saw'
                && $request['matrix'] === [[4.0, 2.0], [3.0, 1.0]]
                && $request['weights'] === [0.6, 0.4]
                && $request['criteria_types'] === ['benefit', 'cost'];
        });
    }

    public function test_saw_rejects_invalid_response_shape(): void
    {
        config(['services.algorithm.url' => 'http://algorithm.test']);
        Http::fake([
            'http://algorithm.test/saw' => Http::response([
                'success' => true,
                'data' => [
                    'scores' => [1.0],
                    'ranking' => [],
                ],
            ]),
        ]);

        $this->expectException(AlgorithmServiceException::class);
        $this->expectExceptionMessage('Respons layanan algoritma tidak valid.');

        app(AlgorithmService::class)->saw(
            [[1.0], [2.0]],
            [1.0],
            ['benefit'],
        );
    }

    public function test_timeout_is_converted_to_a_safe_error(): void
    {
        config(['services.algorithm.url' => 'http://algorithm.test']);
        Http::fake([
            '*' => fn () => throw new ConnectionException(
                'cURL error 28: Operation timed out after 5000 milliseconds',
            ),
        ]);

        try {
            app(AlgorithmService::class)->saw([[1.0]], [1.0], ['benefit']);
            $this->fail('Expected AlgorithmServiceException.');
        } catch (AlgorithmServiceException $exception) {
            $this->assertSame(
                'Layanan algoritma tidak dapat dihubungi atau melewati batas waktu.',
                $exception->getMessage(),
            );
            $this->assertStringNotContainsString('cURL', $exception->getMessage());
        }
    }

    public function test_unsuccessful_http_status_is_converted_to_a_safe_error(): void
    {
        config(['services.algorithm.url' => 'http://algorithm.test']);
        Http::fake([
            'http://algorithm.test/saw' => Http::response(
                ['detail' => 'internal stack trace'],
                500,
            ),
        ]);

        $this->expectException(AlgorithmServiceException::class);
        $this->expectExceptionMessage('Layanan algoritma mengembalikan respons gagal.');

        app(AlgorithmService::class)->saw([[1.0]], [1.0], ['benefit']);
    }

    public function test_kmeans_request_and_response_are_validated(): void
    {
        config(['services.algorithm.url' => 'http://algorithm.test']);
        Http::fake([
            'http://algorithm.test/kmeans' => Http::response([
                'success' => true,
                'data' => [
                    'labels' => [0, 1],
                    'centroids' => [[1.0, 2.0], [3.0, 4.0]],
                    'iterations' => 3,
                    'inertia' => 0.5,
                    'converged' => true,
                ],
            ]),
        ]);

        $result = app(AlgorithmService::class)->kmeans(
            [[1.0, 2.0], [3.0, 4.0]],
            2,
            42,
        );

        $this->assertSame([0, 1], $result['labels']);
        $this->assertSame(3, $result['iterations']);
        $this->assertTrue($result['converged']);

        Http::assertSent(function (Request $request): bool {
            return $request->url() === 'http://algorithm.test/kmeans'
                && $request['data'] === [[1.0, 2.0], [3.0, 4.0]]
                && $request['n_clusters'] === 2
                && $request['random_seed'] === 42;
        });
    }

    public function test_kmeans_rejects_out_of_range_labels(): void
    {
        config(['services.algorithm.url' => 'http://algorithm.test']);
        Http::fake([
            'http://algorithm.test/kmeans' => Http::response([
                'success' => true,
                'data' => [
                    'labels' => [0, 5],
                    'centroids' => [[1.0], [2.0]],
                    'iterations' => 2,
                    'inertia' => 0.1,
                    'converged' => true,
                ],
            ]),
        ]);

        $this->expectException(AlgorithmServiceException::class);
        $this->expectExceptionMessage('Respons layanan algoritma tidak valid.');

        app(AlgorithmService::class)->kmeans([[1.0], [2.0]], 2, 42);
    }

    public function test_non_json_response_is_rejected(): void
    {
        config(['services.algorithm.url' => 'http://algorithm.test']);
        Http::fake([
            'http://algorithm.test/saw' => Http::response('not-json', 200),
        ]);

        $this->expectException(AlgorithmServiceException::class);
        $this->expectExceptionMessage('Respons layanan algoritma tidak valid.');

        app(AlgorithmService::class)->saw([[1.0]], [1.0], ['benefit']);
    }
}
