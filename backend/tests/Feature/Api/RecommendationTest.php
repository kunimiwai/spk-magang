<?php

namespace Tests\Feature\Api;

use App\Enums\CriterionType;
use App\Exceptions\AlgorithmServiceException;
use App\Models\Course;
use App\Models\Criterion;
use App\Models\CriterionScore;
use App\Models\Partner;
use App\Models\StudentGrade;
use App\Models\StudentPeminatan;
use App\Models\User;
use App\Services\RecommendationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Mockery\MockInterface;
use Tests\TestCase;

class RecommendationTest extends TestCase
{
    use RefreshDatabase;

    public function test_mahasiswa_gets_specific_not_ready_state_without_algorithm_call(): void
    {
        $mahasiswa = User::factory()->create(['role' => 'mahasiswa']);
        config([
            'services.algorithm.url' => null,
            'recommendation.kmeans.cluster_count' => null,
            'recommendation.kmeans.random_seed' => null,
            'recommendation.kmeans.feature_criterion_ids' => [],
            'recommendation.peminatan_cluster_map' => [],
        ]);
        Http::fake();

        $this->actingAs($mahasiswa, 'sanctum')
            ->getJson('/api/mahasiswa/recommendations')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'not_ready')
            ->assertJsonPath('data.ranking', [])
            ->assertJsonPath('data.kmeans', null)
            ->assertJsonFragment([
                'key' => 'peminatan',
                'status' => 'blocked',
            ])
            ->assertJsonFragment([
                'key' => 'prerequisites',
                'status' => 'blocked',
            ])
            ->assertJsonFragment([
                'key' => 'kmeans_configuration',
                'status' => 'blocked',
            ])
            ->assertJsonFragment([
                'key' => 'peminatan_cluster_map',
                'status' => 'blocked',
            ])
            ->assertJsonFragment([
                'key' => 'algorithm_service',
                'status' => 'blocked',
            ]);

        Http::assertNothingSent();
    }

    public function test_stored_single_peminatan_is_used_by_recommendation_resolver(): void
    {
        $mahasiswa = User::factory()->create(['role' => 'mahasiswa']);
        StudentPeminatan::create([
            'user_id' => $mahasiswa->id,
            'peminatan' => 'DTA',
        ]);
        config([
            'services.algorithm.url' => null,
            'recommendation.kmeans.cluster_count' => null,
            'recommendation.kmeans.random_seed' => null,
            'recommendation.kmeans.feature_criterion_ids' => [],
            'recommendation.peminatan_cluster_map' => [],
        ]);
        Http::fake();

        $this->actingAs($mahasiswa, 'sanctum')
            ->getJson('/api/mahasiswa/recommendations')
            ->assertOk()
            ->assertJsonPath('data.status', 'not_ready')
            ->assertJsonPath('data.ranking', [])
            ->assertJsonFragment([
                'key' => 'peminatan',
                'status' => 'ok',
                'message' => 'Peminatan DTA tersedia.',
            ])
            ->assertJsonFragment([
                'key' => 'prerequisites',
                'status' => 'blocked',
            ])
            ->assertJsonFragment([
                'key' => 'kmeans_configuration',
                'status' => 'blocked',
            ]);

        Http::assertNothingSent();
    }

    public function test_profile_update_feeds_the_recommendation_resolver(): void
    {
        $mahasiswa = User::factory()->create(['role' => 'mahasiswa']);
        config([
            'student.peminatan.mode' => 'single',
            'services.algorithm.url' => null,
            'recommendation.kmeans.cluster_count' => null,
            'recommendation.kmeans.random_seed' => null,
            'recommendation.kmeans.feature_criterion_ids' => [],
            'recommendation.peminatan_cluster_map' => [],
        ]);
        Http::fake();

        $this->actingAs($mahasiswa, 'sanctum')
            ->putJson('/api/mahasiswa/profile', [
                'peminatan' => ['DTA'],
            ])
            ->assertOk()
            ->assertJsonPath('data.peminatan', ['DTA']);

        $this->actingAs($mahasiswa, 'sanctum')
            ->getJson('/api/mahasiswa/recommendations')
            ->assertOk()
            ->assertJsonPath('data.status', 'not_ready')
            ->assertJsonFragment([
                'key' => 'peminatan',
                'status' => 'ok',
                'message' => 'Peminatan DTA tersedia.',
            ])
            ->assertJsonFragment([
                'key' => 'prerequisites',
                'status' => 'blocked',
            ])
            ->assertJsonFragment([
                'key' => 'kmeans_configuration',
                'status' => 'blocked',
            ]);

        Http::assertNothingSent();
    }

    public function test_multiple_stored_peminatan_blocks_recommendation_with_specific_reason(): void
    {
        $mahasiswa = User::factory()->create(['role' => 'mahasiswa']);
        StudentPeminatan::insert([
            [
                'user_id' => $mahasiswa->id,
                'peminatan' => 'DTA',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => $mahasiswa->id,
                'peminatan' => 'PSI',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
        config([
            'services.algorithm.url' => null,
            'recommendation.kmeans.cluster_count' => null,
            'recommendation.kmeans.random_seed' => null,
            'recommendation.kmeans.feature_criterion_ids' => [],
            'recommendation.peminatan_cluster_map' => [],
        ]);
        Http::fake();

        $response = $this->actingAs($mahasiswa, 'sanctum')
            ->getJson('/api/mahasiswa/recommendations')
            ->assertOk()
            ->assertJsonPath('data.status', 'not_ready')
            ->assertJsonPath('data.ranking', []);

        $peminatanCheck = collect($response->json('data.checks'))
            ->firstWhere('key', 'peminatan');

        $this->assertSame('blocked', $peminatanCheck['status']);
        $this->assertStringContainsString(
            'multi-peminatan belum ditetapkan (OD-015)',
            $peminatanCheck['message'],
        );
        Http::assertNothingSent();
    }

    public function test_saving_academic_grades_does_not_activate_recommendation(): void
    {
        $mahasiswa = User::factory()->create(['role' => 'mahasiswa']);
        $course = Course::factory()->create();
        StudentGrade::factory()->create([
            'user_id' => $mahasiswa->id,
            'course_id' => $course->id,
            'score' => 100,
        ]);
        config([
            'academic.prerequisites.rules' => [],
            'services.algorithm.url' => null,
            'recommendation.kmeans.cluster_count' => null,
            'recommendation.kmeans.random_seed' => null,
            'recommendation.kmeans.feature_criterion_ids' => [],
            'recommendation.peminatan_cluster_map' => [],
        ]);
        Http::fake();

        $response = $this->actingAs($mahasiswa, 'sanctum')
            ->getJson('/api/mahasiswa/recommendations')
            ->assertOk()
            ->assertJsonPath('data.status', 'not_ready')
            ->assertJsonPath('data.ranking', []);

        $prerequisiteCheck = collect($response->json('data.checks'))
            ->firstWhere('key', 'prerequisites');

        $this->assertSame('blocked', $prerequisiteCheck['status']);
        $this->assertStringContainsString(
            'belum dikonfigurasi (OD-007/OD-008)',
            $prerequisiteCheck['message'],
        );
        Http::assertNothingSent();
    }

    public function test_recommendation_uses_only_the_authenticated_students_academic_data(): void
    {
        $criterion = Criterion::factory()->create([
            'name' => 'Kriteria A',
            'type' => CriterionType::Benefit,
            'weight' => 1,
        ]);
        $alpha = Partner::factory()->create(['name' => 'Alpha']);
        $beta = Partner::factory()->create(['name' => 'Beta']);
        CriterionScore::factory()->create([
            'partner_id' => $alpha->id,
            'criterion_id' => $criterion->id,
            'score' => 5,
        ]);
        CriterionScore::factory()->create([
            'partner_id' => $beta->id,
            'criterion_id' => $criterion->id,
            'score' => 3,
        ]);

        $course = Course::factory()->create(['name' => 'Prasyarat Uji']);
        $eligible = User::factory()->create(['role' => 'mahasiswa']);
        $ineligible = User::factory()->create(['role' => 'mahasiswa']);

        foreach ([$eligible, $ineligible] as $student) {
            StudentPeminatan::create([
                'user_id' => $student->id,
                'peminatan' => 'DTA',
            ]);
        }

        StudentGrade::factory()->create([
            'user_id' => $eligible->id,
            'course_id' => $course->id,
            'score' => 80,
        ]);

        config([
            'academic.prerequisites.rules' => [
                ['course_id' => $course->id, 'minimum_score' => 70],
            ],
            'services.algorithm.url' => 'http://algorithm.test',
            'recommendation.enabled' => true,
            'recommendation.kmeans.cluster_count' => 2,
            'recommendation.kmeans.random_seed' => 42,
            'recommendation.kmeans.feature_criterion_ids' => [$criterion->id],
            'recommendation.peminatan_cluster_map' => ['DTA' => [0]],
            'recommendation.ranking.limit' => 10,
        ]);

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

        $this->actingAs($eligible, 'sanctum')
            ->getJson('/api/mahasiswa/recommendations')
            ->assertOk()
            ->assertJsonPath('data.status', 'ready')
            ->assertJsonCount(2, 'data.ranking')
            ->assertJsonPath('data.ranking.0.partner_name', 'Alpha');

        $this->actingAs($ineligible, 'sanctum')
            ->getJson('/api/mahasiswa/recommendations')
            ->assertOk()
            ->assertJsonPath('data.status', 'not_ready')
            ->assertJsonPath('data.ranking', [])
            ->assertJsonFragment([
                'key' => 'prerequisites',
                'status' => 'blocked',
            ]);

        Http::assertSentCount(2);
    }

    public function test_client_cannot_send_algorithm_parameters(): void
    {
        $mahasiswa = User::factory()->create(['role' => 'mahasiswa']);

        $this->mock(RecommendationService::class, function (MockInterface $mock): void {
            $mock->shouldNotReceive('evaluate');
        });

        $this->actingAs($mahasiswa, 'sanctum')
            ->getJson('/api/mahasiswa/recommendations?weights[]=100&matrix[]=1')
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath(
                'message',
                'Endpoint rekomendasi tidak menerima parameter perhitungan dari klien.',
            );

        $this->actingAs($mahasiswa, 'sanctum')
            ->json('GET', '/api/mahasiswa/recommendations', [
                'weights' => [100],
                'matrix' => [[1]],
            ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->actingAs($mahasiswa, 'sanctum')
            ->getJson('/api/mahasiswa/recommendations?peminatan=PSI')
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_algorithm_failure_is_not_exposed_as_internal_details(): void
    {
        $mahasiswa = User::factory()->create(['role' => 'mahasiswa']);

        $this->mock(RecommendationService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('evaluate')
                ->once()
                ->with(null, 'Peminatan mahasiswa belum dipilih.', \Mockery::type(User::class))
                ->andThrow(new AlgorithmServiceException(
                    'cURL error 28 stack trace at app/Services/AlgorithmService.php',
                ));
        });

        $this->actingAs($mahasiswa, 'sanctum')
            ->getJson('/api/mahasiswa/recommendations')
            ->assertStatus(503)
            ->assertJsonPath('success', false)
            ->assertJsonPath(
                'message',
                'Layanan rekomendasi sedang tidak tersedia. Coba lagi nanti.',
            )
            ->assertDontSee('cURL')
            ->assertDontSee('stack trace')
            ->assertDontSee('AlgorithmService');
    }

    public function test_recommendation_endpoint_enforces_mahasiswa_role(): void
    {
        config([
            'services.algorithm.url' => null,
            'recommendation.kmeans.cluster_count' => null,
            'recommendation.kmeans.random_seed' => null,
            'recommendation.kmeans.feature_criterion_ids' => [],
            'recommendation.peminatan_cluster_map' => [],
        ]);
        Http::fake();

        $this->getJson('/api/mahasiswa/recommendations')->assertUnauthorized();

        foreach (['admin', 'prodi', 'dpm'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/mahasiswa/recommendations')
                ->assertForbidden();
        }

        $mahasiswa = User::factory()->create(['role' => 'mahasiswa']);

        $this->actingAs($mahasiswa, 'sanctum')
            ->getJson('/api/mahasiswa/recommendations')
            ->assertOk()
            ->assertJsonPath('data.status', 'not_ready');
    }

    public function test_mahasiswa_cannot_read_or_modify_admin_criteria_data(): void
    {
        $mahasiswa = User::factory()->create(['role' => 'mahasiswa']);
        $criterion = Criterion::factory()->create();
        $partner = Partner::factory()->create();

        $this->actingAs($mahasiswa, 'sanctum')
            ->getJson('/api/admin/criteria')
            ->assertForbidden();

        $this->actingAs($mahasiswa, 'sanctum')
            ->postJson('/api/admin/criteria', [
                'name' => 'Tidak Boleh',
                'type' => 'benefit',
                'weight' => 1,
            ])
            ->assertForbidden();

        $this->actingAs($mahasiswa, 'sanctum')
            ->getJson('/api/admin/partner-options')
            ->assertForbidden();

        $this->actingAs($mahasiswa, 'sanctum')
            ->putJson("/api/admin/partners/{$partner->id}/scores", [
                'scores' => [
                    ['criterion_id' => $criterion->id, 'score' => 99],
                ],
            ])
            ->assertForbidden();

        $this->assertDatabaseCount('criterion_scores', 0);
    }
}
