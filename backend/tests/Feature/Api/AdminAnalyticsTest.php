<?php

namespace Tests\Feature\Api;

use App\Enums\CriterionType;
use App\Models\Criterion;
use App\Models\CriterionScore;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AdminAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_and_prodi_can_read_analytics_with_real_database_numbers(): void
    {
        $criterionA = Criterion::factory()->create([
            'name' => 'Jarak',
            'type' => CriterionType::Cost,
            'weight' => 0.4,
        ]);
        $criterionB = Criterion::factory()->create([
            'name' => 'Fasilitas',
            'type' => CriterionType::Benefit,
            'weight' => 0.6,
        ]);

        $alpha = Partner::factory()->create(['name' => 'Alpha']);
        $beta = Partner::factory()->create(['name' => 'Beta']);

        CriterionScore::factory()->create([
            'partner_id' => $alpha->id,
            'criterion_id' => $criterionA->id,
            'score' => 2,
        ]);
        CriterionScore::factory()->create([
            'partner_id' => $alpha->id,
            'criterion_id' => $criterionB->id,
            'score' => 4,
        ]);
        CriterionScore::factory()->create([
            'partner_id' => $beta->id,
            'criterion_id' => $criterionA->id,
            'score' => 4,
        ]);

        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/analytics');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.partners.count', 2)
            ->assertJsonPath('data.scores.filled_pairs', 3)
            ->assertJsonPath('data.scores.total_pairs', 4)
            ->assertJsonPath('data.criteria.0.name', 'Jarak')
            ->assertJsonPath('data.criteria.0.type', 'cost')
            ->assertJsonPath('data.criteria.0.weight', 0.4)
            ->assertJsonPath('data.criteria.0.stats.count', 2)
            ->assertJsonPath('data.criteria.0.stats.min', 2)
            ->assertJsonPath('data.criteria.0.stats.max', 4)
            ->assertJsonPath('data.criteria.0.stats.average', 3)
            ->assertJsonPath('data.criteria.0.missing_partner_count', 0)
            ->assertJsonPath('data.criteria.1.missing_partner_count', 1);

        // K-Means belum dikonfigurasi (OD-009/OD-010) dan analitik ini tidak
        // menghitung ranking SAW resmi.
        $this->assertFalse($response->json('data.kmeans.configured'));
        $this->assertNull($response->json('data.kmeans.distribution'));
        $this->assertStringContainsString(
            'OD-010',
            $response->json('data.kmeans.message'),
        );
        $this->assertSame(
            'not_ready',
            $response->json('data.recommendation.status'),
        );
        $this->assertNotEmpty($response->json('data.recommendation.checks'));
        $this->assertNotEmpty($response->json('data.notes'));

        $prodi = User::factory()->create(['role' => 'prodi']);

        $this->actingAs($prodi, 'sanctum')
            ->getJson('/api/admin/analytics')
            ->assertOk();
    }

    public function test_analytics_does_not_call_the_algorithm_while_kmeans_is_unconfigured(): void
    {
        Criterion::factory()->create();
        Partner::factory()->create();
        Http::fake();
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/analytics')
            ->assertOk();

        Http::assertNothingSent();
    }

    public function test_configured_kmeans_returns_cluster_distribution_without_ranking(): void
    {
        $feature = Criterion::factory()->create([
            'name' => 'Kriteria A',
            'type' => CriterionType::Benefit,
            'weight' => 1,
        ]);
        $alpha = Partner::factory()->create(['name' => 'Alpha']);
        $beta = Partner::factory()->create(['name' => 'Beta']);

        foreach ([$alpha, $beta] as $partner) {
            CriterionScore::factory()->create([
                'partner_id' => $partner->id,
                'criterion_id' => $feature->id,
                'score' => $partner->id === $alpha->id ? 4 : 1,
            ]);
        }

        config([
            'recommendation.kmeans.cluster_count' => 2,
            'recommendation.kmeans.random_seed' => 42,
            'recommendation.kmeans.feature_criterion_ids' => [$feature->id],
            'services.algorithm.url' => 'http://algorithm.test',
        ]);

        Http::fake([
            'http://algorithm.test/kmeans' => Http::response([
                'success' => true,
                'data' => [
                    'labels' => [0, 1],
                    'centroids' => [[4.0], [1.0]],
                    'iterations' => 2,
                    'inertia' => 0.0,
                    'converged' => true,
                ],
            ]),
        ]);

        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/analytics');

        $response->assertOk();
        $this->assertTrue($response->json('data.kmeans.configured'));
        $this->assertSame(2, $response->json('data.kmeans.iterations'));
        $this->assertTrue($response->json('data.kmeans.converged'));
        $this->assertNull($response->json('data.kmeans.service_error'));

        $distribution = $response->json('data.kmeans.distribution');

        $this->assertCount(2, $distribution);
        $this->assertSame(1, $distribution[0]['partner_count']);
        $this->assertSame(4, $distribution[0]['feature_averages'][0]['average']);
        $this->assertSame(1, $distribution[1]['feature_averages'][0]['average']);

        // Analitik tidak boleh mengeluarkan peringkat SAW resmi.
        $this->assertArrayNotHasKey('ranking', $response->json('data'));
        $this->assertSame(
            'not_ready',
            $response->json('data.recommendation.status'),
        );
        Http::assertSentCount(1);
        Http::assertSent(fn (Request $request): bool => str_ends_with(
            $request->url(),
            '/kmeans',
        ));
        Http::assertNotSent(
            fn (Request $request): bool => str_ends_with($request->url(), '/saw'),
        );
    }

    public function test_configured_kmeans_waits_for_complete_feature_scores(): void
    {
        $feature = Criterion::factory()->create();
        $partner = Partner::factory()->create();
        CriterionScore::factory()->create([
            'partner_id' => $partner->id,
            'criterion_id' => $feature->id,
            'score' => 3,
        ]);
        // Mitra kedua belum memiliki nilai fitur.
        Partner::factory()->create();

        config([
            'recommendation.kmeans.cluster_count' => 2,
            'recommendation.kmeans.random_seed' => 42,
            'recommendation.kmeans.feature_criterion_ids' => [$feature->id],
            'services.algorithm.url' => 'http://algorithm.test',
        ]);
        Http::fake();

        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/analytics');

        $response->assertOk();
        $this->assertTrue($response->json('data.kmeans.configured'));
        $this->assertNull($response->json('data.kmeans.distribution'));
        $this->assertNull($response->json('data.kmeans.service_error'));
        $this->assertNull($response->json('data.kmeans.iterations'));
        // Nilai yang hilang tidak boleh diganti angka default.
        Http::assertNothingSent();
    }

    public function test_analytics_reports_service_errors_without_sensitive_details(): void
    {
        $feature = Criterion::factory()->create();
        $partner = Partner::factory()->create();
        CriterionScore::factory()->create([
            'partner_id' => $partner->id,
            'criterion_id' => $feature->id,
            'score' => 3,
        ]);

        config([
            'recommendation.kmeans.cluster_count' => 1,
            'recommendation.kmeans.random_seed' => 42,
            'recommendation.kmeans.feature_criterion_ids' => [$feature->id],
            'services.algorithm.url' => 'http://algorithm.test',
        ]);
        Http::fake([
            'http://algorithm.test/kmeans' => Http::response(
                ['message' => 'Trace secret internal'],
                500,
            ),
        ]);

        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/analytics');

        $response->assertOk();
        $this->assertSame(
            'Layanan analitik klaster sedang tidak tersedia.',
            $response->json('data.kmeans.service_error'),
        );
        $this->assertNull($response->json('data.kmeans.distribution'));
        $response->assertDontSee('Trace secret internal', false);
    }

    public function test_analytics_requires_admin_or_prodi_role_and_authentication(): void
    {
        $this->getJson('/api/admin/analytics')->assertUnauthorized();

        foreach (['mahasiswa', 'dpm'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/admin/analytics')
                ->assertForbidden();
        }
    }
}
