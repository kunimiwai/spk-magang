<?php

namespace Tests\Feature\Api;

use App\Enums\ApplicationStatus;
use App\Enums\CriterionType;
use App\Models\Course;
use App\Models\Criterion;
use App\Models\CriterionScore;
use App\Models\Partner;
use App\Models\StudentGrade;
use App\Models\StudentPeminatan;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RecommendationIntegrationTest extends TestCase
{
    use RefreshDatabase;

    private function seedCompleteConfiguration(): array
    {
        $criterionA = Criterion::factory()->create([
            'name' => 'Kemampuan Teknis',
            'type' => CriterionType::Benefit,
            'weight' => 0.6,
        ]);
        $criterionB = Criterion::factory()->create([
            'name' => 'Biaya',
            'type' => CriterionType::Cost,
            'weight' => 0.4,
        ]);

        $alpha = Partner::factory()->create(['name' => 'PT Alpha']);
        $beta = Partner::factory()->create(['name' => 'PT Beta']);
        $gamma = Partner::factory()->create(['name' => 'PT Gamma']);

        CriterionScore::factory()->create([
            'partner_id' => $alpha->id,
            'criterion_id' => $criterionA->id,
            'score' => 4,
        ]);
        CriterionScore::factory()->create([
            'partner_id' => $alpha->id,
            'criterion_id' => $criterionB->id,
            'score' => 2,
        ]);
        CriterionScore::factory()->create([
            'partner_id' => $beta->id,
            'criterion_id' => $criterionA->id,
            'score' => 3,
        ]);
        CriterionScore::factory()->create([
            'partner_id' => $beta->id,
            'criterion_id' => $criterionB->id,
            'score' => 1,
        ]);
        CriterionScore::factory()->create([
            'partner_id' => $gamma->id,
            'criterion_id' => $criterionA->id,
            'score' => 5,
        ]);
        CriterionScore::factory()->create([
            'partner_id' => $gamma->id,
            'criterion_id' => $criterionB->id,
            'score' => 3,
        ]);

        SystemSetting::set('recommendation.enabled', true, 'general', 'Aktifkan rekomendasi.');
        SystemSetting::set('recommendation.kmeans.cluster_count', 2, 'recommendation.kmeans', 'Jumlah cluster.');
        SystemSetting::set('recommendation.kmeans.random_seed', 42, 'recommendation.kmeans', 'Random seed.');
        SystemSetting::set(
            'recommendation.kmeans.feature_criterion_ids',
            [$criterionA->id],
            'recommendation.kmeans',
            'Fitur K-Means.',
        );
        SystemSetting::set(
            'recommendation.peminatan_cluster_map',
            ['DTA' => [0]],
            'recommendation.peminatan',
            'Pemetaan cluster.',
        );
        SystemSetting::set('recommendation.ranking.limit', 10, 'recommendation.ranking', 'Batas ranking.');

        $course = Course::factory()->create(['name' => 'Prasyarat Akademik']);
        SystemSetting::set(
            'academic.prerequisites.rules',
            [['course_id' => $course->id, 'minimum_score' => 70]],
            'academic.prerequisites',
            'Aturan prasyarat.',
        );

        return [
            'criterionA' => $criterionA,
            'criterionB' => $criterionB,
            'course' => $course,
        ];
    }

    public function test_full_recommendation_flow_from_database_to_api(): void
    {
        config(['services.algorithm.url' => 'http://algorithm.test']);

        $config = $this->seedCompleteConfiguration();

        $eligible = User::factory()->create(['role' => 'mahasiswa']);
        StudentPeminatan::create([
            'user_id' => $eligible->id,
            'peminatan' => 'DTA',
        ]);
        StudentGrade::factory()->create([
            'user_id' => $eligible->id,
            'course_id' => $config['course']->id,
            'score' => 80,
        ]);

        $ineligible = User::factory()->create(['role' => 'mahasiswa']);
        StudentPeminatan::create([
            'user_id' => $ineligible->id,
            'peminatan' => 'DTA',
        ]);

        Http::fake([
            'http://algorithm.test/kmeans' => Http::response([
                'success' => true,
                'data' => [
                    'labels' => [0, 0, 1],
                    'centroids' => [[4.0], [5.0]],
                    'iterations' => 2,
                    'inertia' => 0.5,
                    'converged' => true,
                ],
            ]),
            'http://algorithm.test/saw' => Http::response([
                'success' => true,
                'data' => [
                    'scores' => [1.0, 0.65, 0.9],
                    'ranking' => [
                        ['alternative_index' => 0, 'score' => 1.0, 'rank' => 1],
                        ['alternative_index' => 2, 'score' => 0.9, 'rank' => 2],
                        ['alternative_index' => 1, 'score' => 0.65, 'rank' => 3],
                    ],
                ],
            ]),
        ]);

        $response = $this->actingAs($eligible, 'sanctum')
            ->getJson('/api/mahasiswa/recommendations')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'ready')
            ->assertJsonCount(3, 'data.ranking')
            ->assertJsonPath('data.ranking.0.partner_name', 'PT Alpha')
            ->assertJsonPath('data.ranking.0.score', 1)
            ->assertJsonPath('data.ranking.0.rank', 1)
            ->assertJsonPath('data.kmeans.cluster_count', 2)
            ->assertJsonPath('data.kmeans.feature_criterion_ids', [$config['criterionA']->id])
            ->assertJsonPath('data.kmeans.converged', true);

        $json = $response->json();
        $this->assertNotNull($json['data']['explanation'] ?? null);
        $this->assertNotNull($json['data']['disclaimer'] ?? null);

        Http::assertSentCount(2);
        Http::assertSent(function ($request) use ($config): bool {
            return $request->url() === 'http://algorithm.test/kmeans'
                && $request['n_clusters'] === 2
                && $request['random_seed'] === 42
                && $request['data'] == [[4.0], [3.0], [5.0]];
        });
        Http::assertSent(function ($request) use ($config): bool {
            return $request->url() === 'http://algorithm.test/saw'
                && $request['weights'] == [0.6, 0.4]
                && $request['criteria_types'] === ['benefit', 'cost'];
        });

        // Mahasiswa yang prasyaratnya tidak terpenuhi diblokir dengan alasan spesifik.
        $this->actingAs($ineligible, 'sanctum')
            ->getJson('/api/mahasiswa/recommendations')
            ->assertOk()
            ->assertJsonPath('data.status', 'not_ready')
            ->assertJsonPath('data.ranking', [])
            ->assertJsonFragment([
                'key' => 'prerequisites',
                'status' => 'blocked',
            ]);
    }

    public function test_incomplete_configuration_blocks_recommendation_with_specific_reasons(): void
    {
        $mahasiswa = User::factory()->create(['role' => 'mahasiswa']);
        StudentPeminatan::create([
            'user_id' => $mahasiswa->id,
            'peminatan' => 'DTA',
        ]);

        $this->actingAs($mahasiswa, 'sanctum')
            ->getJson('/api/mahasiswa/recommendations')
            ->assertOk()
            ->assertJsonPath('data.status', 'not_ready')
            ->assertJsonPath('data.ranking', [])
            ->assertJsonFragment([
                'key' => 'activation',
                'status' => 'blocked',
            ])
            ->assertJsonFragment([
                'key' => 'criteria',
                'status' => 'blocked',
            ])
            ->assertJsonFragment([
                'key' => 'ranking_policy',
                'status' => 'blocked',
            ])
            ->assertJsonFragment([
                'key' => 'algorithm_service',
                'status' => 'ok',
            ])
            ->assertJsonFragment([
                'key' => 'algorithm_service',
                'category' => 'technical',
            ]);
    }

    public function test_invalid_weights_block_ranking(): void
    {
        config(['services.algorithm.url' => 'http://algorithm.test']);

        $criterion = Criterion::factory()->create([
            'name' => 'Kriteria A',
            'type' => CriterionType::Benefit,
            'weight' => -1,
        ]);
        $partner = Partner::factory()->create(['name' => 'PT A']);
        CriterionScore::factory()->create([
            'partner_id' => $partner->id,
            'criterion_id' => $criterion->id,
            'score' => 4,
        ]);

        SystemSetting::set('recommendation.enabled', true, 'general', 'Aktif.');
        SystemSetting::set('recommendation.kmeans.cluster_count', 2, 'recommendation.kmeans', '');
        SystemSetting::set('recommendation.kmeans.random_seed', 42, 'recommendation.kmeans', '');
        SystemSetting::set(
            'recommendation.kmeans.feature_criterion_ids',
            [$criterion->id],
            'recommendation.kmeans',
            '',
        );
        SystemSetting::set(
            'recommendation.peminatan_cluster_map',
            ['DTA' => [0]],
            'recommendation.peminatan',
            '',
        );
        SystemSetting::set('recommendation.ranking.limit', 10, 'recommendation.ranking', '');

        $course = Course::factory()->create();
        StudentGrade::factory()->create([
            'user_id' => $mahasiswa = User::factory()->create(['role' => 'mahasiswa']),
            'course_id' => $course->id,
            'score' => 80,
        ]);
        SystemSetting::set(
            'academic.prerequisites.rules',
            [['course_id' => $course->id, 'minimum_score' => 70]],
            'academic.prerequisites',
            '',
        );
        StudentPeminatan::create([
            'user_id' => $mahasiswa->id,
            'peminatan' => 'DTA',
        ]);

        Http::fake();

        $this->actingAs($mahasiswa, 'sanctum')
            ->getJson('/api/mahasiswa/recommendations')
            ->assertOk()
            ->assertJsonPath('data.status', 'not_ready')
            ->assertJsonFragment([
                'key' => 'criteria',
                'status' => 'blocked',
            ]);

        Http::assertNothingSent();
    }

    public function test_missing_partner_scores_block_ranking(): void
    {
        config(['services.algorithm.url' => 'http://algorithm.test']);

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

        SystemSetting::set('recommendation.enabled', true, 'general', '');
        SystemSetting::set('recommendation.kmeans.cluster_count', 2, 'recommendation.kmeans', '');
        SystemSetting::set('recommendation.kmeans.random_seed', 42, 'recommendation.kmeans', '');
        SystemSetting::set(
            'recommendation.kmeans.feature_criterion_ids',
            [$criterionA->id],
            'recommendation.kmeans',
            '',
        );
        SystemSetting::set(
            'recommendation.peminatan_cluster_map',
            ['DTA' => [0]],
            'recommendation.peminatan',
            '',
        );
        SystemSetting::set('recommendation.ranking.limit', 10, 'recommendation.ranking', '');

        $course = Course::factory()->create();
        $mahasiswa = User::factory()->create(['role' => 'mahasiswa']);
        StudentGrade::factory()->create([
            'user_id' => $mahasiswa->id,
            'course_id' => $course->id,
            'score' => 80,
        ]);
        SystemSetting::set(
            'academic.prerequisites.rules',
            [['course_id' => $course->id, 'minimum_score' => 70]],
            'academic.prerequisites',
            '',
        );
        StudentPeminatan::create([
            'user_id' => $mahasiswa->id,
            'peminatan' => 'DTA',
        ]);

        Http::fake();

        $this->actingAs($mahasiswa, 'sanctum')
            ->getJson('/api/mahasiswa/recommendations')
            ->assertOk()
            ->assertJsonPath('data.status', 'not_ready')
            ->assertJsonFragment([
                'key' => 'scores',
                'status' => 'blocked',
            ]);

        Http::assertNothingSent();
    }

    public function test_algorithm_service_unavailable_returns_503(): void
    {
        config(['services.algorithm.url' => 'http://algorithm.test']);
        $config = $this->seedCompleteConfiguration();

        $mahasiswa = User::factory()->create(['role' => 'mahasiswa']);
        StudentPeminatan::create([
            'user_id' => $mahasiswa->id,
            'peminatan' => 'DTA',
        ]);
        StudentGrade::factory()->create([
            'user_id' => $mahasiswa->id,
            'course_id' => $config['course']->id,
            'score' => 80,
        ]);

        Http::fake([
            '*' => fn () => throw new \Illuminate\Http\Client\ConnectionException('timed out'),
        ]);

        $this->actingAs($mahasiswa, 'sanctum')
            ->getJson('/api/mahasiswa/recommendations')
            ->assertStatus(503)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Layanan rekomendasi sedang tidak tersedia. Coba lagi nanti.');
    }

    public function test_ranking_limit_is_applied(): void
    {
        config(['services.algorithm.url' => 'http://algorithm.test']);

        $config = $this->seedCompleteConfiguration();
        SystemSetting::set('recommendation.ranking.limit', 1, 'recommendation.ranking', 'Batas 1.');

        $mahasiswa = User::factory()->create(['role' => 'mahasiswa']);
        StudentPeminatan::create([
            'user_id' => $mahasiswa->id,
            'peminatan' => 'DTA',
        ]);
        StudentGrade::factory()->create([
            'user_id' => $mahasiswa->id,
            'course_id' => $config['course']->id,
            'score' => 80,
        ]);

        Http::fake([
            'http://algorithm.test/kmeans' => Http::response([
                'success' => true,
                'data' => [
                    'labels' => [0, 0, 0],
                    'centroids' => [[4.0], [4.0], [4.0]],
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

        $this->actingAs($mahasiswa, 'sanctum')
            ->getJson('/api/mahasiswa/recommendations')
            ->assertOk()
            ->assertJsonPath('data.status', 'ready')
            ->assertJsonCount(1, 'data.ranking')
            ->assertJsonPath('data.ranking.0.partner_name', 'PT Alpha');
    }

    public function test_application_decision_affects_access(): void
    {
        config(['services.algorithm.url' => 'http://algorithm.test']);
        $config = $this->seedCompleteConfiguration();

        $mahasiswa = User::factory()->create(['role' => 'mahasiswa']);
        StudentPeminatan::create([
            'user_id' => $mahasiswa->id,
            'peminatan' => 'DTA',
        ]);
        StudentGrade::factory()->create([
            'user_id' => $mahasiswa->id,
            'course_id' => $config['course']->id,
            'score' => 80,
        ]);

        Http::fake([
            'http://algorithm.test/kmeans' => Http::response([
                'success' => true,
                'data' => [
                    'labels' => [0, 0, 1],
                    'centroids' => [[4.0], [5.0]],
                    'iterations' => 2,
                    'inertia' => 0.5,
                    'converged' => true,
                ],
            ]),
            'http://algorithm.test/saw' => Http::response([
                'success' => true,
                'data' => [
                    'scores' => [1.0, 0.9, 0.65],
                    'ranking' => [
                        ['alternative_index' => 0, 'score' => 1.0, 'rank' => 1],
                        ['alternative_index' => 1, 'score' => 0.9, 'rank' => 2],
                        ['alternative_index' => 2, 'score' => 0.65, 'rank' => 3],
                    ],
                ],
            ]),
        ]);

        $this->actingAs($mahasiswa, 'sanctum')
            ->getJson('/api/mahasiswa/recommendations')
            ->assertOk()
            ->assertJsonPath('data.status', 'ready');
    }

    public function test_full_recommendation_flow_with_local_computation(): void
    {
        // No external algorithm service URL; local computation is used.
        config(['services.algorithm.url' => null]);
        Http::fake();

        $config = $this->seedCompleteConfiguration();

        $mahasiswa = User::factory()->create(['role' => 'mahasiswa']);
        StudentPeminatan::create([
            'user_id' => $mahasiswa->id,
            'peminatan' => 'DTA',
        ]);
        StudentGrade::factory()->create([
            'user_id' => $mahasiswa->id,
            'course_id' => $config['course']->id,
            'score' => 80,
        ]);

        $response = $this->actingAs($mahasiswa, 'sanctum')
            ->getJson('/api/mahasiswa/recommendations')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'ready')
            ->assertJsonCount(3, 'data.ranking')
            ->assertJsonPath('data.ranking.0.partner_name', 'PT Beta')
            ->assertJsonPath('data.kmeans.cluster_count', 2)
            ->assertJsonPath('data.kmeans.converged', true);

        $json = $response->json();
        $this->assertNotNull($json['data']['explanation'] ?? null);
        $this->assertNotNull($json['data']['disclaimer'] ?? null);

        // No HTTP requests should be sent to external service.
        Http::assertNothingSent();

        // Verify SAW computation: Alpha should rank first.
        // Criterion A (benefit, weight 0.6): Alpha=4, Beta=3, Gamma=5 → normalized: [0.8, 0.6, 1.0]
        // Criterion B (cost, weight 0.4): Alpha=2, Beta=1, Gamma=3 → normalized: [0.5, 1.0, 0.333...]
        // Scores: Alpha = 0.6*0.8 + 0.4*0.5 = 0.68; Beta = 0.6*0.6 + 0.4*1.0 = 0.76; Gamma = 0.6*1.0 + 0.4*0.333... = 0.733...
        // Ranking: Beta (0.76) > Gamma (0.733) > Alpha (0.68)
        $this->assertSame('PT Beta', $response->json('data.ranking.0.partner_name'));
        $this->assertSame(1, $response->json('data.ranking.0.rank'));
        $this->assertSame('PT Gamma', $response->json('data.ranking.1.partner_name'));
        $this->assertSame(2, $response->json('data.ranking.1.rank'));
        $this->assertSame('PT Alpha', $response->json('data.ranking.2.partner_name'));
        $this->assertSame(3, $response->json('data.ranking.2.rank'));
    }
}
