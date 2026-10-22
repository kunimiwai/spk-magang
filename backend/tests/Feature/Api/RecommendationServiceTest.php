<?php

namespace Tests\Feature\Api;

use App\Enums\CriterionType;
use App\Exceptions\AlgorithmServiceException;
use App\Models\Course;
use App\Models\Criterion;
use App\Models\CriterionScore;
use App\Models\Partner;
use App\Models\StudentGrade;
use App\Models\User;
use App\Services\RecommendationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RecommendationServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_pipeline_reports_specific_blockers_without_calling_the_service(): void
    {
        $this->configureAlgorithm(null);
        config([
            'recommendation.enabled' => false,
            'recommendation.kmeans.cluster_count' => null,
            'recommendation.kmeans.random_seed' => null,
            'recommendation.kmeans.feature_criterion_ids' => [],
            'recommendation.peminatan_cluster_map' => [],
            'recommendation.ranking.limit' => null,
        ]);
        Http::fake();

        $criterion = Criterion::factory()->create([
            'name' => 'Kriteria A',
            'type' => CriterionType::Benefit,
            'weight' => 1,
        ]);
        $partner = Partner::factory()->create(['name' => 'PT A']);
        CriterionScore::factory()->create([
            'partner_id' => $partner->id,
            'criterion_id' => $criterion->id,
            'score' => 4,
        ]);

        $result = app(RecommendationService::class)->evaluate(null);

        $this->assertSame('not_ready', $result['status']);
        $this->assertSame([], $result['ranking']);
        $this->assertNull($result['kmeans']);
        $this->assertSame('ok', $this->checkStatus($result, 'criteria'));
        $this->assertSame('ok', $this->checkStatus($result, 'partners'));
        $this->assertSame('ok', $this->checkStatus($result, 'scores'));
        $this->assertSame('blocked', $this->checkStatus($result, 'activation'));
        $this->assertSame('blocked', $this->checkStatus($result, 'peminatan'));
        $this->assertSame('blocked', $this->checkStatus($result, 'prerequisites'));
        $this->assertSame('blocked', $this->checkStatus($result, 'kmeans_configuration'));
        $this->assertSame('blocked', $this->checkStatus($result, 'peminatan_cluster_map'));
        $this->assertSame('blocked', $this->checkStatus($result, 'ranking_policy'));
        $this->assertSame('blocked', $this->checkStatus($result, 'algorithm_service'));

        $this->assertSame('decision', $this->checkCategory($result, 'activation'));
        $this->assertSame('data', $this->checkCategory($result, 'partners'));
        $this->assertSame('technical', $this->checkCategory($result, 'algorithm_service'));
        $this->assertSame('analysis', $this->checkCategory($result, 'kmeans_configuration'));
        $this->assertSame('analysis', $this->checkCategory($result, 'peminatan_cluster_map'));

        Http::assertNothingSent();
    }

    public function test_missing_scores_block_ranking_and_are_not_treated_as_zero(): void
    {
        $criterionA = Criterion::factory()->create([
            'name' => 'Kriteria A',
            'type' => CriterionType::Benefit,
            'weight' => 1,
        ]);
        $criterionB = Criterion::factory()->create([
            'name' => 'Kriteria B',
            'type' => CriterionType::Cost,
            'weight' => 1,
        ]);
        $partner = Partner::factory()->create(['name' => 'PT Tidak Lengkap']);
        CriterionScore::factory()->create([
            'partner_id' => $partner->id,
            'criterion_id' => $criterionA->id,
            'score' => 4,
        ]);

        $this->configurePipeline([$criterionA->id]);
        Http::fake();

        $result = app(RecommendationService::class)->evaluate('DTA');

        $this->assertSame('not_ready', $result['status']);
        $this->assertSame('blocked', $this->checkStatus($result, 'scores'));
        $this->assertStringContainsString(
            'Nilai yang hilang tidak dianggap nol.',
            $this->checkMessage($result, 'scores'),
        );
        Http::assertNothingSent();
    }

    public function test_inconsistent_cost_values_block_ranking_before_algorithm_call(): void
    {
        $criterion = Criterion::factory()->create([
            'name' => 'Biaya',
            'type' => CriterionType::Cost,
            'weight' => 1,
        ]);
        $alpha = Partner::factory()->create(['name' => 'Alpha']);
        $beta = Partner::factory()->create(['name' => 'Beta']);
        $this->score($alpha, $criterion, 0);
        $this->score($beta, $criterion, 1);

        $this->configurePipeline([$criterion->id]);
        Http::fake();

        $result = app(RecommendationService::class)->evaluate('DTA');

        $this->assertSame('not_ready', $result['status']);
        $this->assertSame('blocked', $this->checkStatus($result, 'scores'));
        $this->assertStringContainsString(
            'Biaya (cost): semua nilai harus lebih besar dari nol',
            $this->checkMessage($result, 'scores'),
        );
        Http::assertNothingSent();
    }

    public function test_ranking_is_created_only_from_database_inputs_and_valid_responses(): void
    {
        $criterionA = Criterion::factory()->create([
            'name' => 'Kriteria A',
            'type' => CriterionType::Benefit,
            'weight' => 0.6,
        ]);
        $criterionB = Criterion::factory()->create([
            'name' => 'Kriteria B',
            'type' => CriterionType::Cost,
            'weight' => 0.4,
        ]);

        $alpha = Partner::factory()->create(['name' => 'Alpha']);
        $beta = Partner::factory()->create(['name' => 'Beta']);
        $gamma = Partner::factory()->create(['name' => 'Gamma']);

        $this->score($alpha, $criterionA, 4);
        $this->score($alpha, $criterionB, 2);
        $this->score($beta, $criterionA, 3);
        $this->score($beta, $criterionB, 1);
        $this->score($gamma, $criterionA, 5);
        $this->score($gamma, $criterionB, 3);

        $this->configurePipeline([$criterionA->id]);
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $this->configurePrerequisites($student);

        Http::fake([
            'http://algorithm.test/kmeans' => Http::response([
                'success' => true,
                'data' => [
                    'labels' => [0, 0, 1],
                    'centroids' => [[3.5], [5.0]],
                    'iterations' => 2,
                    'inertia' => 0.5,
                    'converged' => true,
                ],
            ]),
            'http://algorithm.test/saw' => Http::response([
                'success' => true,
                'data' => [
                    'normalized_matrix' => [
                        [1.0, 1.0],
                        [0.75, 0.5],
                        [1.25, 0.667],
                    ],
                    'scores' => [1.0, 0.65, 0.9],
                    'ranking' => [
                        ['alternative_index' => 0, 'score' => 1.0, 'rank' => 1],
                        ['alternative_index' => 2, 'score' => 0.9, 'rank' => 2],
                        ['alternative_index' => 1, 'score' => 0.65, 'rank' => 3],
                    ],
                ],
            ]),
        ]);

        $result = app(RecommendationService::class)->evaluate('DTA', null, $student);

        $this->assertSame('ready', $result['status']);
        $this->assertCount(3, $result['ranking']);
        $this->assertSame('Alpha', $result['ranking'][0]['partner_name']);
        $this->assertSame(1, $result['ranking'][0]['rank']);
        $this->assertSame(1.0, $result['ranking'][0]['score']);
        $this->assertSame('Gamma', $result['ranking'][1]['partner_name']);
        $this->assertSame(2, $result['ranking'][1]['rank']);
        $this->assertSame('Beta', $result['ranking'][2]['partner_name']);
        $this->assertSame(3, $result['ranking'][2]['rank']);
        $this->assertSame(0, $result['ranking'][2]['cluster_index']);
        $this->assertSame(3, $result['kmeans']['partner_count']);
        $this->assertTrue($result['kmeans']['converged']);
        $this->assertStringContainsString('seluruh mitra', $result['explanation']);
        $this->assertStringContainsString(
            'tidak dipakai untuk menyaring',
            $result['explanation'],
        );

        Http::assertSentCount(2);
        Http::assertSent(function (Request $request): bool {
            return $request->url() === 'http://algorithm.test/kmeans'
                && $request['data'] == [[4.0], [3.0], [5.0]]
                && $request['n_clusters'] === 2
                && $request['random_seed'] === 42;
        });
        Http::assertSent(function (Request $request): bool {
            return $request->url() === 'http://algorithm.test/saw'
                && $request['matrix'] == [[4.0, 2.0], [3.0, 1.0], [5.0, 3.0]]
                && $request['weights'] == [0.6, 0.4]
                && $request['criteria_types'] === ['benefit', 'cost'];
        });
    }

    public function test_cluster_labels_never_filter_the_saw_candidates(): void
    {
        $criterion = Criterion::factory()->create([
            'name' => 'Kriteria A',
            'type' => CriterionType::Benefit,
            'weight' => 1,
        ]);
        $alpha = Partner::factory()->create(['name' => 'Alpha']);
        $beta = Partner::factory()->create(['name' => 'Beta']);
        $gamma = Partner::factory()->create(['name' => 'Gamma']);

        foreach ([$alpha, $beta, $gamma] as $partner) {
            $this->score($partner, $criterion, 4);
        }

        $this->configurePipeline([$criterion->id]);
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $this->configurePrerequisites($student);

        // Semua mitra berada pada cluster 1 sedangkan label peminatan DTA
        // menunjuk cluster 0. Karena label klaster bukan filter (proposal
        // 4.1), ketiganya tetap masuk peringkat SAW.
        Http::fake([
            'http://algorithm.test/kmeans' => Http::response([
                'success' => true,
                'data' => [
                    'labels' => [1, 1, 1],
                    'centroids' => [[4.0], [4.0]],
                    'iterations' => 2,
                    'inertia' => 0.0,
                    'converged' => true,
                ],
            ]),
            'http://algorithm.test/saw' => Http::response([
                'success' => true,
                'data' => [
                    'normalized_matrix' => [
                        [1.0],
                        [1.0],
                        [1.0],
                    ],
                    'scores' => [1.0, 1.0, 1.0],
                    'ranking' => [
                        ['alternative_index' => 0, 'score' => 1.0, 'rank' => 1],
                        ['alternative_index' => 1, 'score' => 1.0, 'rank' => 2],
                        ['alternative_index' => 2, 'score' => 1.0, 'rank' => 3],
                    ],
                ],
            ]),
        ]);

        $result = app(RecommendationService::class)->evaluate('DTA', null, $student);

        $this->assertSame('ready', $result['status']);
        $this->assertCount(3, $result['ranking']);
        $this->assertSame(
            ['Alpha', 'Beta', 'Gamma'],
            array_column($result['ranking'], 'partner_name'),
        );
        $this->assertSame(
            [1, 1, 1],
            array_column($result['ranking'], 'cluster_index'),
        );
        Http::assertSentCount(2);
    }

    public function test_saw_ranking_does_not_wait_for_the_kmeans_configuration(): void
    {
        $criterion = Criterion::factory()->create([
            'name' => 'Kriteria A',
            'type' => CriterionType::Benefit,
            'weight' => 1,
        ]);
        $alpha = Partner::factory()->create(['name' => 'Alpha']);
        $beta = Partner::factory()->create(['name' => 'Beta']);
        $this->score($alpha, $criterion, 4);
        $this->score($beta, $criterion, 3);

        $this->configureAlgorithm();
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $this->configurePrerequisites($student);

        // Konfigurasi K-Means dan label cluster sengaja dibiarkan kosong;
        // keduanya hanya menyangkut analitik dan tidak memblokir ranking SAW.
        config([
            'recommendation.enabled' => true,
            'recommendation.kmeans.cluster_count' => null,
            'recommendation.kmeans.random_seed' => null,
            'recommendation.kmeans.feature_criterion_ids' => [],
            'recommendation.peminatan_cluster_map' => [],
            'recommendation.ranking.limit' => 10,
        ]);

        Http::fake([
            'http://algorithm.test/saw' => Http::response([
                'success' => true,
                'data' => [
                    'normalized_matrix' => [[1.0], [0.75]],
                    'scores' => [1.0, 0.75],
                    'ranking' => [
                        ['alternative_index' => 0, 'score' => 1.0, 'rank' => 1],
                        ['alternative_index' => 1, 'score' => 0.75, 'rank' => 2],
                    ],
                ],
            ]),
        ]);

        $result = app(RecommendationService::class)->evaluate('DTA', null, $student);

        $this->assertSame('ready', $result['status']);
        $this->assertCount(2, $result['ranking']);
        $this->assertNull($result['kmeans']);
        $this->assertNull($result['ranking'][0]['cluster_index']);
        $this->assertSame('ok', $this->checkStatus($result, 'activation'));
        $this->assertSame(
            'blocked',
            $this->checkStatus($result, 'kmeans_configuration'),
        );
        $this->assertSame(
            'blocked',
            $this->checkStatus($result, 'peminatan_cluster_map'),
        );
        Http::assertSentCount(1);
        Http::assertNotSent(
            fn (Request $request): bool => str_ends_with($request->url(), '/kmeans'),
        );
    }

    public function test_invalid_saw_response_prevents_ranking(): void
    {
        $criterion = Criterion::factory()->create([
            'name' => 'Kriteria A',
            'type' => CriterionType::Benefit,
            'weight' => 1,
        ]);
        $alpha = Partner::factory()->create(['name' => 'Alpha']);
        $beta = Partner::factory()->create(['name' => 'Beta']);
        $this->score($alpha, $criterion, 4);
        $this->score($beta, $criterion, 3);

        $this->configurePipeline([$criterion->id]);
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $this->configurePrerequisites($student);

        Http::fake([
            'http://algorithm.test/kmeans' => Http::response([
                'success' => true,
                'data' => [
                    'labels' => [0, 0],
                    'centroids' => [[3.5], [3.5]],
                    'iterations' => 2,
                    'inertia' => 0.0,
                    'converged' => true,
                ],
            ]),
            'http://algorithm.test/saw' => Http::response([
                'success' => true,
                'data' => [
                    'scores' => [1.0, 0.9],
                    'ranking' => [
                        ['alternative_index' => 0, 'score' => 1.0, 'rank' => 1],
                    ],
                ],
            ]),
        ]);

        $this->expectException(AlgorithmServiceException::class);
        $this->expectExceptionMessage('Respons layanan algoritma tidak valid.');

        app(RecommendationService::class)->evaluate('DTA', null, $student);
    }

    public function test_algorithm_timeout_prevents_a_partial_ranking(): void
    {
        $criterion = Criterion::factory()->create([
            'name' => 'Kriteria A',
            'type' => CriterionType::Benefit,
            'weight' => 1,
        ]);
        $alpha = Partner::factory()->create(['name' => 'Alpha']);
        $beta = Partner::factory()->create(['name' => 'Beta']);
        $this->score($alpha, $criterion, 4);
        $this->score($beta, $criterion, 3);

        $this->configurePipeline([$criterion->id]);
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $this->configurePrerequisites($student);

        Http::fake([
            '*' => fn () => throw new ConnectionException('timed out'),
        ]);

        $this->expectException(AlgorithmServiceException::class);
        $this->expectExceptionMessage(
            'Layanan algoritma tidak dapat dihubungi atau melewati batas waktu.',
        );

        app(RecommendationService::class)->evaluate('DTA', null, $student);
    }

    public function test_kmeans_failure_keeps_saw_ranking_and_reports_analysis_failure(): void
    {
        $criterion = Criterion::factory()->create([
            'name' => 'Kriteria A',
            'type' => CriterionType::Benefit,
            'weight' => 1,
        ]);
        $alpha = Partner::factory()->create(['name' => 'Alpha']);
        $beta = Partner::factory()->create(['name' => 'Beta']);
        $this->score($alpha, $criterion, 5);
        $this->score($beta, $criterion, 3);

        $this->configurePipeline([$criterion->id]);
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $this->configurePrerequisites($student);

        Http::fake([
            'http://algorithm.test/kmeans' => Http::response([
                'message' => 'K-Means service unavailable.',
            ], 500),
            'http://algorithm.test/saw' => Http::response([
                'success' => true,
                'data' => [
                    'scores' => [1.0, 0.6],
                    'ranking' => [
                        ['alternative_index' => 0, 'score' => 1.0, 'rank' => 1],
                        ['alternative_index' => 1, 'score' => 0.6, 'rank' => 2],
                    ],
                ],
            ]),
        ]);

        $result = app(RecommendationService::class)->evaluate('DTA', null, $student);

        $this->assertSame('ready', $result['status']);
        $this->assertSame(
            ['Alpha', 'Beta'],
            array_column($result['ranking'], 'partner_name'),
        );
        $this->assertSame([null, null], array_column($result['ranking'], 'cluster_index'));
        $this->assertNull($result['kmeans']);
        $this->assertSame('blocked', $this->checkStatus($result, 'kmeans_execution'));
        $this->assertSame('analysis', $this->checkCategory($result, 'kmeans_execution'));
        $this->assertStringContainsString(
            'Analitik K-Means gagal dihitung.',
            $this->checkMessage($result, 'kmeans_execution'),
        );
        $this->assertStringContainsString(
            'Analitik K-Means gagal dihitung; label klaster tidak tersedia',
            $result['explanation'],
        );
        Http::assertSentCount(2);
    }

    public function test_kmeans_failure_does_not_bypass_the_not_ready_gate(): void
    {
        $criterion = Criterion::factory()->create([
            'name' => 'Kriteria A',
            'type' => CriterionType::Benefit,
            'weight' => 1,
        ]);
        $partner = Partner::factory()->create(['name' => 'PT A']);
        $this->score($partner, $criterion, 4);

        $student = User::factory()->create(['role' => 'mahasiswa']);
        $this->configurePrerequisites($student);
        $this->configurePipeline([$criterion->id]);
        config(['recommendation.enabled' => false]);

        Http::fake([
            '*' => fn () => throw new ConnectionException('timed out'),
        ]);

        $result = app(RecommendationService::class)->evaluate('DTA', null, $student);

        $this->assertSame('not_ready', $result['status']);
        $this->assertSame([], $result['ranking']);
        $this->assertNull($result['kmeans']);
        $this->assertSame('blocked', $this->checkStatus($result, 'activation'));
        $this->assertFalse(
            collect($result['checks'])->contains(
                fn (array $check): bool => $check['key'] === 'kmeans_execution',
            ),
        );
        Http::assertNothingSent();
    }

    public function test_empty_criteria_block_ranking_without_calling_the_service(): void
    {
        $this->configurePipeline([]);
        Http::fake();

        Partner::factory()->create(['name' => 'PT A']);

        $result = app(RecommendationService::class)->evaluate('DTA');

        $this->assertSame('not_ready', $result['status']);
        $this->assertSame([], $result['ranking']);
        $this->assertSame('blocked', $this->checkStatus($result, 'criteria'));
        $this->assertSame('blocked', $this->checkStatus($result, 'scores'));
        $this->assertStringContainsString(
            'Belum ada kriteria penilaian yang tersimpan.',
            $this->checkMessage($result, 'criteria'),
        );
        Http::assertNothingSent();
    }

    public function test_invalid_criteria_weights_block_ranking(): void
    {
        $criterion = Criterion::factory()->create([
            'name' => 'Kriteria A',
            'type' => CriterionType::Benefit,
            'weight' => 0,
        ]);
        $partner = Partner::factory()->create(['name' => 'PT A']);
        $this->score($partner, $criterion, 4);

        $this->configurePipeline([$criterion->id]);
        Http::fake();

        $zeroTotal = app(RecommendationService::class)->evaluate('DTA');

        $this->assertSame('not_ready', $zeroTotal['status']);
        $this->assertSame('blocked', $this->checkStatus($zeroTotal, 'criteria'));
        $this->assertStringContainsString(
            'Total bobot kriteria harus lebih besar dari nol.',
            $this->checkMessage($zeroTotal, 'criteria'),
        );

        $criterion->update(['weight' => -1]);

        $negative = app(RecommendationService::class)->evaluate('DTA');

        $this->assertSame('not_ready', $negative['status']);
        $this->assertSame('blocked', $this->checkStatus($negative, 'criteria'));
        $this->assertStringContainsString(
            'Bobot kriteria tidak valid untuk: Kriteria A.',
            $this->checkMessage($negative, 'criteria'),
        );
        Http::assertNothingSent();
    }

    public function test_activation_must_be_explicit_even_when_all_inputs_are_configured(): void
    {
        $criterion = Criterion::factory()->create([
            'name' => 'Kriteria A',
            'type' => CriterionType::Benefit,
            'weight' => 1,
        ]);
        $partner = Partner::factory()->create(['name' => 'PT A']);
        $this->score($partner, $criterion, 4);

        $student = User::factory()->create(['role' => 'mahasiswa']);
        $this->configurePrerequisites($student);

        $this->configureAlgorithm();
        config([
            'recommendation.enabled' => false,
            'recommendation.kmeans.cluster_count' => 2,
            'recommendation.kmeans.random_seed' => 42,
            'recommendation.kmeans.feature_criterion_ids' => [$criterion->id],
            'recommendation.peminatan_cluster_map' => ['DTA' => [0]],
            'recommendation.ranking.limit' => 10,
        ]);
        Http::fake();

        $result = app(RecommendationService::class)->evaluate('DTA', null, $student);

        $this->assertSame('not_ready', $result['status']);
        $this->assertSame([], $result['ranking']);
        $this->assertSame('blocked', $this->checkStatus($result, 'activation'));
        $this->assertStringContainsString(
            'belum diaktifkan secara eksplisit',
            $this->checkMessage($result, 'activation'),
        );
        Http::assertNothingSent();
    }

    public function test_ranking_limit_must_be_configured_and_is_applied(): void
    {
        $criterion = Criterion::factory()->create([
            'name' => 'Kriteria A',
            'type' => CriterionType::Benefit,
            'weight' => 1,
        ]);
        $alpha = Partner::factory()->create(['name' => 'Alpha']);
        $beta = Partner::factory()->create(['name' => 'Beta']);
        $gamma = Partner::factory()->create(['name' => 'Gamma']);

        $this->score($alpha, $criterion, 5);
        $this->score($beta, $criterion, 4);
        $this->score($gamma, $criterion, 3);

        $student = User::factory()->create(['role' => 'mahasiswa']);
        $this->configurePrerequisites($student);
        $this->configurePipeline([$criterion->id]);
        config(['recommendation.ranking.limit' => 1]);

        Http::fake([
            'http://algorithm.test/kmeans' => Http::response([
                'success' => true,
                'data' => [
                    'labels' => [0, 0, 0],
                    'centroids' => [[4.0], [4.0]],
                    'iterations' => 2,
                    'inertia' => 0.0,
                    'converged' => true,
                ],
            ]),
            'http://algorithm.test/saw' => Http::response([
                'success' => true,
                'data' => [
                    'scores' => [1.0, 0.8, 0.6],
                    'ranking' => [
                        ['alternative_index' => 0, 'score' => 1.0, 'rank' => 1],
                        ['alternative_index' => 1, 'score' => 0.8, 'rank' => 2],
                        ['alternative_index' => 2, 'score' => 0.6, 'rank' => 3],
                    ],
                ],
            ]),
        ]);

        $result = app(RecommendationService::class)->evaluate('DTA', null, $student);

        $this->assertSame('ready', $result['status']);
        $this->assertCount(1, $result['ranking']);
        $this->assertSame('Alpha', $result['ranking'][0]['partner_name']);
        $this->assertSame(3, $result['kmeans']['partner_count']);
        $this->assertStringContainsString(
            'Maksimal 1 mitra ditampilkan',
            $result['explanation'],
        );

        config(['recommendation.ranking.limit' => 0]);

        $blocked = app(RecommendationService::class)->evaluate('DTA', null, $student);

        $this->assertSame('not_ready', $blocked['status']);
        $this->assertSame([], $blocked['ranking']);
        $this->assertSame('blocked', $this->checkStatus($blocked, 'ranking_policy'));
        Http::assertSentCount(2);
    }

    public function test_prerequisite_grades_are_evaluated_only_for_the_given_student(): void
    {
        $criterion = Criterion::factory()->create([
            'name' => 'Kriteria A',
            'type' => CriterionType::Benefit,
            'weight' => 1,
        ]);
        $alpha = Partner::factory()->create(['name' => 'Alpha']);
        $beta = Partner::factory()->create(['name' => 'Beta']);
        $this->score($alpha, $criterion, 5);
        $this->score($beta, $criterion, 3);

        $course = Course::factory()->create(['name' => 'Prasyarat Uji']);
        $eligible = User::factory()->create(['role' => 'mahasiswa']);
        $ineligible = User::factory()->create(['role' => 'mahasiswa']);

        StudentGrade::factory()->create([
            'user_id' => $eligible->id,
            'course_id' => $course->id,
            'score' => 80,
        ]);

        config([
            'academic.prerequisites.rules' => [
                ['course_id' => $course->id, 'minimum_score' => 70],
            ],
        ]);
        $this->configurePipeline([$criterion->id]);

        Http::fake([
            'http://algorithm.test/kmeans' => Http::response([
                'success' => true,
                'data' => [
                    'labels' => [0, 0],
                    'centroids' => [[4.0], [4.0]],
                    'iterations' => 2,
                    'inertia' => 0.0,
                    'converged' => true,
                ],
            ]),
            'http://algorithm.test/saw' => Http::response([
                'success' => true,
                'data' => [
                    'scores' => [1.0, 0.6],
                    'ranking' => [
                        ['alternative_index' => 0, 'score' => 1.0, 'rank' => 1],
                        ['alternative_index' => 1, 'score' => 0.6, 'rank' => 2],
                    ],
                ],
            ]),
        ]);

        $eligibleResult = app(RecommendationService::class)
            ->evaluate('DTA', null, $eligible);
        $ineligibleResult = app(RecommendationService::class)
            ->evaluate('DTA', null, $ineligible);

        $this->assertSame('ready', $eligibleResult['status']);
        $this->assertCount(2, $eligibleResult['ranking']);
        $this->assertSame('not_ready', $ineligibleResult['status']);
        $this->assertSame([], $ineligibleResult['ranking']);
        $this->assertSame('blocked', $this->checkStatus($ineligibleResult, 'prerequisites'));
        $this->assertStringContainsString(
            'Nilai prasyarat belum diisi',
            $this->checkMessage($ineligibleResult, 'prerequisites'),
        );
        Http::assertSentCount(2);
    }

    private function configureAlgorithm(?string $url = 'http://algorithm.test'): void
    {
        config([
            'services.algorithm.url' => $url,
            'services.algorithm.timeout' => 5,
            'services.algorithm.connect_timeout' => 3,
        ]);
    }

    private function configurePipeline(array $featureCriterionIds): void
    {
        $this->configureAlgorithm();
        config([
            'recommendation.enabled' => true,
            'recommendation.kmeans.cluster_count' => 2,
            'recommendation.kmeans.random_seed' => 42,
            'recommendation.kmeans.feature_criterion_ids' => $featureCriterionIds,
            'recommendation.peminatan_cluster_map' => ['DTA' => [0]],
            'recommendation.ranking.limit' => 10,
        ]);
    }

    private function configurePrerequisites(
        User $student,
        float $score = 80,
    ): void {
        $course = Course::factory()->create(['name' => 'Prasyarat Uji']);

        StudentGrade::factory()->create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'score' => $score,
        ]);

        config([
            'academic.prerequisites.rules' => [
                ['course_id' => $course->id, 'minimum_score' => 70],
            ],
        ]);
    }

    private function score(
        Partner $partner,
        Criterion $criterion,
        float $score,
    ): void {
        CriterionScore::factory()->create([
            'partner_id' => $partner->id,
            'criterion_id' => $criterion->id,
            'score' => $score,
        ]);
    }

    private function checkStatus(array $result, string $key): string
    {
        foreach ($result['checks'] as $check) {
            if ($check['key'] === $key) {
                return $check['status'];
            }
        }

        $this->fail('Check not found: '.$key);
    }

    private function checkMessage(array $result, string $key): string
    {
        foreach ($result['checks'] as $check) {
            if ($check['key'] === $key) {
                return $check['message'];
            }
        }

        $this->fail('Check not found: '.$key);
    }

    private function checkCategory(array $result, string $key): string
    {
        foreach ($result['checks'] as $check) {
            if ($check['key'] === $key) {
                return $check['category'];
            }
        }

        $this->fail('Check not found: '.$key);
    }
}
