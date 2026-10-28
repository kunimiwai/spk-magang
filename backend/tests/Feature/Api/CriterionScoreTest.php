<?php

namespace Tests\Feature\Api;

use App\Models\Criterion;
use App\Models\CriterionScore;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CriterionScoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_score_sheet_lists_all_criteria_and_existing_scores(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $partner = Partner::factory()->create(['name' => 'PT Uji']);
        $criterionA = Criterion::factory()->create([
            'name' => 'Kriteria A',
            'weight' => 1.5,
        ]);
        $criterionB = Criterion::factory()->create([
            'name' => 'Kriteria B',
            'weight' => 2.5,
        ]);
        CriterionScore::factory()->create([
            'partner_id' => $partner->id,
            'criterion_id' => $criterionA->id,
            'score' => 4.5,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/admin/partners/{$partner->id}/scores")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.partner.id', $partner->id)
            ->assertJsonPath('data.partner.name', 'PT Uji')
            ->assertJsonCount(2, 'data.criteria')
            ->assertJsonFragment([
                'criterion_id' => $criterionA->id,
                'name' => 'Kriteria A',
                'score' => 4.5,
            ])
            ->assertJsonFragment([
                'criterion_id' => $criterionB->id,
                'name' => 'Kriteria B',
                'score' => null,
            ]);
    }

    public function test_admin_can_create_and_update_partner_scores(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $partner = Partner::factory()->create();
        $criterionA = Criterion::factory()->create();
        $criterionB = Criterion::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/partners/{$partner->id}/scores", [
                'scores' => [
                    ['criterion_id' => $criterionA->id, 'score' => 4.5],
                    ['criterion_id' => $criterionB->id, 'score' => 7],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('criterion_scores', [
            'partner_id' => $partner->id,
            'criterion_id' => $criterionA->id,
        ]);
        $this->assertDatabaseHas('criterion_scores', [
            'partner_id' => $partner->id,
            'criterion_id' => $criterionB->id,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/partners/{$partner->id}/scores", [
                'scores' => [
                    ['criterion_id' => $criterionA->id, 'score' => 9.25],
                ],
            ])
            ->assertOk();

        $this->assertDatabaseCount('criterion_scores', 2);
        $this->assertDatabaseHas('criterion_scores', [
            'partner_id' => $partner->id,
            'criterion_id' => $criterionA->id,
            'score' => 9.25,
        ]);
    }

    public function test_null_score_removes_the_existing_value(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $partner = Partner::factory()->create();
        $criterion = Criterion::factory()->create();
        CriterionScore::factory()->create([
            'partner_id' => $partner->id,
            'criterion_id' => $criterion->id,
            'score' => 3,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/partners/{$partner->id}/scores", [
                'scores' => [
                    ['criterion_id' => $criterion->id, 'score' => null],
                ],
            ])
            ->assertOk();

        $this->assertDatabaseMissing('criterion_scores', [
            'partner_id' => $partner->id,
            'criterion_id' => $criterion->id,
        ]);
    }

    public function test_score_payload_validates_duplicates_and_missing_criteria(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $partner = Partner::factory()->create();
        $criterion = Criterion::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/partners/{$partner->id}/scores", [
                'scores' => [
                    ['criterion_id' => $criterion->id, 'score' => 1],
                    ['criterion_id' => $criterion->id, 'score' => 2],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('scores.0.criterion_id');

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/partners/{$partner->id}/scores", [
                'scores' => [
                    ['criterion_id' => 999999, 'score' => 1],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('scores.0.criterion_id');

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/partners/{$partner->id}/scores", [
                'scores' => [
                    ['criterion_id' => $criterion->id, 'score' => 'bukan-angka'],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('scores.0.score');

        $this->assertDatabaseCount('criterion_scores', 0);
    }

    public function test_prodi_can_manage_partner_scores(): void
    {
        $prodi = User::factory()->create(['role' => 'prodi']);
        $partner = Partner::factory()->create();
        $criterion = Criterion::factory()->create();

        $this->actingAs($prodi, 'sanctum')
            ->getJson("/api/admin/partners/{$partner->id}/scores")
            ->assertOk();

        $this->actingAs($prodi, 'sanctum')
            ->putJson("/api/admin/partners/{$partner->id}/scores", [
                'scores' => [
                    ['criterion_id' => $criterion->id, 'score' => 5],
                ],
            ])
            ->assertOk();

        $this->assertDatabaseHas('criterion_scores', [
            'partner_id' => $partner->id,
            'criterion_id' => $criterion->id,
            'score' => 5,
        ]);
    }

    public function test_admin_can_delete_a_single_partner_score(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $partner = Partner::factory()->create();
        $criterion = Criterion::factory()->create();
        CriterionScore::factory()->create([
            'partner_id' => $partner->id,
            'criterion_id' => $criterion->id,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/partners/{$partner->id}/scores/{$criterion->id}")
            ->assertOk();

        $this->assertDatabaseMissing('criterion_scores', [
            'partner_id' => $partner->id,
            'criterion_id' => $criterion->id,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/partners/{$partner->id}/scores/{$criterion->id}")
            ->assertNotFound();
    }

    public function test_score_endpoints_return_not_found_for_missing_partner(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $criterion = Criterion::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/partners/999999/scores')
            ->assertNotFound();

        $this->actingAs($admin, 'sanctum')
            ->putJson('/api/admin/partners/999999/scores', [
                'scores' => [
                    ['criterion_id' => $criterion->id, 'score' => 1],
                ],
            ])
            ->assertNotFound();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/partners/999999/scores/{$criterion->id}")
            ->assertNotFound();
    }

    public function test_database_rejects_duplicate_partner_criterion_pair(): void
    {
        $score = CriterionScore::factory()->create();

        $this->expectException(QueryException::class);

        CriterionScore::factory()->create([
            'partner_id' => $score->partner_id,
            'criterion_id' => $score->criterion_id,
        ]);
    }

    public function test_deleting_a_partner_cascades_its_scores(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $partner = Partner::factory()->create();
        $score = CriterionScore::factory()->create(['partner_id' => $partner->id]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/partners/{$partner->id}")
            ->assertOk();

        $this->assertDatabaseMissing('criterion_scores', ['id' => $score->id]);
    }

    public function test_partner_options_are_available_to_admin_and_prodi_only(): void
    {
        Partner::factory()->count(2)->create();

        $this->getJson('/api/admin/partner-options')->assertUnauthorized();

        foreach (['admin', 'prodi'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/admin/partner-options')
                ->assertOk()
                ->assertJsonCount(2, 'data');
        }

        foreach (['mahasiswa', 'dpm'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/admin/partner-options')
                ->assertForbidden();
        }
    }

    public function test_score_endpoints_require_authentication_and_allowed_role(): void
    {
        $partner = Partner::factory()->create();
        $criterion = Criterion::factory()->create();

        $this->getJson("/api/admin/partners/{$partner->id}/scores")
            ->assertUnauthorized();

        foreach (['mahasiswa', 'dpm'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user, 'sanctum')
                ->getJson("/api/admin/partners/{$partner->id}/scores")
                ->assertForbidden();

            $this->actingAs($user, 'sanctum')
                ->putJson("/api/admin/partners/{$partner->id}/scores", [
                    'scores' => [
                        ['criterion_id' => $criterion->id, 'score' => 1],
                    ],
                ])
                ->assertForbidden();

            $this->actingAs($user, 'sanctum')
                ->deleteJson("/api/admin/partners/{$partner->id}/scores/{$criterion->id}")
                ->assertForbidden();
        }
    }
}
