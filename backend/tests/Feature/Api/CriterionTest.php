<?php

namespace Tests\Feature\Api;

use App\Enums\CriterionType;
use App\Models\Criterion;
use App\Models\CriterionScore;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CriterionTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_criteria(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $criterion = Criterion::factory()->create([
            'name' => 'Kriteria Uji',
            'type' => CriterionType::Benefit,
            'weight' => 2.5,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/criteria')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $criterion->id)
            ->assertJsonPath('data.0.name', 'Kriteria Uji')
            ->assertJsonPath('data.0.type', 'benefit')
            ->assertJsonPath('data.0.weight', 2.5)
            ->assertJsonPath('data.0.scores_count', 0);
    }

    public function test_criteria_list_is_empty_when_no_criteria_exist(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/criteria')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_admin_and_prodi_can_create_a_criterion(): void
    {
        foreach (['admin', 'prodi'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user, 'sanctum')
                ->postJson('/api/admin/criteria', [
                    'name' => 'Kriteria '.$role,
                    'description' => 'Deskripsi kriteria uji.',
                    'type' => 'cost',
                    'weight' => 1.25,
                ])
                ->assertCreated()
                ->assertJsonPath('success', true)
                ->assertJsonPath('data.name', 'Kriteria '.$role)
                ->assertJsonPath('data.type', 'cost')
                ->assertJsonPath('data.weight', 1.25)
                ->assertJsonPath('data.scores_count', 0);
        }

        $this->assertDatabaseCount('criteria', 2);
    }

    public function test_criterion_creation_validates_name_type_and_weight(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/criteria', [
                'name' => '',
                'type' => 'netral',
                'weight' => -1,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'type', 'weight']);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/criteria', [
                'name' => 'Tanpa Bobot',
                'type' => 'benefit',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['weight']);

        $this->assertDatabaseCount('criteria', 0);
    }

    public function test_criterion_name_must_be_unique(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Criterion::factory()->create(['name' => 'Kriteria Sama']);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/criteria', [
                'name' => 'Kriteria Sama',
                'type' => 'benefit',
                'weight' => 1,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_admin_can_show_and_update_a_criterion(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $criterion = Criterion::factory()->create([
            'name' => 'Nama Lama',
            'type' => CriterionType::Benefit,
            'weight' => 1,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/admin/criteria/{$criterion->id}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Nama Lama')
            ->assertJsonPath('data.scores_count', 0);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/criteria/{$criterion->id}", [
                'name' => 'Nama Baru',
                'type' => 'cost',
                'weight' => 3.75,
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Nama Baru')
            ->assertJsonPath('data.type', 'cost')
            ->assertJsonPath('data.weight', 3.75);

        $this->assertDatabaseHas('criteria', [
            'id' => $criterion->id,
            'name' => 'Nama Baru',
            'type' => 'cost',
        ]);
    }

    public function test_criterion_update_validates_input(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $criterion = Criterion::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/criteria/{$criterion->id}", [
                'name' => '',
                'type' => 'lainnya',
                'weight' => -5,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'type', 'weight']);
    }

    public function test_criterion_can_keep_its_name_when_updated(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $criterion = Criterion::factory()->create([
            'name' => 'Nama Tetap',
            'type' => CriterionType::Benefit,
            'weight' => 1,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/criteria/{$criterion->id}", [
                'name' => 'Nama Tetap',
                'weight' => 2.5,
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Nama Tetap')
            ->assertJsonPath('data.weight', 2.5);
    }

    public function test_admin_can_delete_a_criterion_without_scores(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $criterion = Criterion::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/criteria/{$criterion->id}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('criteria', ['id' => $criterion->id]);
    }

    public function test_criterion_with_scores_cannot_be_deleted(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $criterion = Criterion::factory()->create();
        CriterionScore::factory()->create(['criterion_id' => $criterion->id]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/criteria/{$criterion->id}")
            ->assertStatus(409)
            ->assertJsonPath('success', false);

        $this->assertDatabaseHas('criteria', ['id' => $criterion->id]);
    }

    public function test_criterion_endpoints_return_not_found_for_missing_resource(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/criteria/999999')
            ->assertNotFound();

        $this->actingAs($admin, 'sanctum')
            ->putJson('/api/admin/criteria/999999', [
                'name' => 'Tidak Ada',
                'type' => 'benefit',
                'weight' => 1,
            ])
            ->assertNotFound();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson('/api/admin/criteria/999999')
            ->assertNotFound();
    }

    public function test_criterion_endpoints_require_authentication_and_allowed_role(): void
    {
        $criterion = Criterion::factory()->create();

        $this->getJson('/api/admin/criteria')->assertUnauthorized();
        $this->postJson('/api/admin/criteria', [
            'name' => 'Tanpa Login',
            'type' => 'benefit',
            'weight' => 1,
        ])->assertUnauthorized();

        foreach (['mahasiswa', 'dpm'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/admin/criteria')
                ->assertForbidden();

            $this->actingAs($user, 'sanctum')
                ->postJson('/api/admin/criteria', [
                    'name' => 'Tidak Diizinkan',
                    'type' => 'benefit',
                    'weight' => 1,
                ])
                ->assertForbidden();

            $this->actingAs($user, 'sanctum')
                ->putJson("/api/admin/criteria/{$criterion->id}", [
                    'weight' => 9,
                ])
                ->assertForbidden();

            $this->actingAs($user, 'sanctum')
                ->deleteJson("/api/admin/criteria/{$criterion->id}")
                ->assertForbidden();
        }
    }
}
