<?php

namespace Tests\Feature\Api;

use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SystemSettingTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_store_and_read_system_setting(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/system-settings', [
                'key' => 'recommendation.kmeans.cluster_count',
                'value' => '3',
                'group' => 'recommendation.kmeans',
                'description' => 'Jumlah cluster K-Means.',
            ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.key', 'recommendation.kmeans.cluster_count')
            ->assertJsonPath('data.value', '3');

        $this->assertDatabaseHas('system_settings', [
            'key' => 'recommendation.kmeans.cluster_count',
            'value' => '3',
            'group' => 'recommendation.kmeans',
        ]);
    }

    public function test_array_setting_is_returned_with_correct_type(): void
    {
        User::factory()->create(['role' => 'admin']);

        SystemSetting::set(
            'recommendation.kmeans.feature_criterion_ids',
            [1, 2, 3],
            'recommendation.kmeans',
            'ID kriteria fitur K-Means.',
        );

        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/system-settings/grouped')
            ->assertOk();

        $allGroups = $response->json('data');
        $kmeans = $allGroups['recommendation.kmeans'] ?? null;
        $featureEntry = collect($kmeans)->firstWhere('key', 'recommendation.kmeans.feature_criterion_ids');

        $this->assertNotNull($featureEntry);
        $this->assertIsArray($featureEntry['value']);
        $this->assertSame([1, 2, 3], $featureEntry['value']);
    }

    public function test_boolean_setting_is_returned_with_correct_type(): void
    {
        User::factory()->create(['role' => 'admin']);

        SystemSetting::set('recommendation.enabled', true, 'general', 'Aktifkan rekomendasi.');

        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/system-settings')
            ->assertOk()
            ->assertJsonFragment([
                'key' => 'recommendation.enabled',
                'value' => true,
            ]);
    }

    public function test_admin_can_update_system_setting_and_cache_is_cleared(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/system-settings', [
                'key' => 'recommendation.ranking.limit',
                'value' => '5',
                'group' => 'recommendation.ranking',
                'description' => 'Batas hasil ranking.',
            ])
            ->assertCreated();

        $setting = SystemSetting::where('key', 'recommendation.ranking.limit')->first();

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/system-settings/{$setting->id}", [
                'value' => '10',
                'group' => 'recommendation.ranking',
                'description' => 'Batas hasil ranking diperbarui.',
            ])
            ->assertOk()
            ->assertJsonPath('data.value', '10');

        $this->assertDatabaseHas('system_settings', [
            'key' => 'recommendation.ranking.limit',
            'value' => '10',
        ]);
    }

    public function test_duplicate_key_is_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        SystemSetting::set('general.site_name', 'SPK Magang', 'general', 'Nama situs.');

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/system-settings', [
                'key' => 'general.site_name',
                'value' => 'Lainnya',
                'group' => 'general',
            ])
            ->assertStatus(422);
    }

    public function test_missing_key_and_value_are_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/system-settings', [
                'group' => 'general',
            ])
            ->assertStatus(422);
    }

    public function test_non_admin_cannot_access_system_settings(): void
    {
        foreach (['mahasiswa', 'dpm'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/admin/system-settings')
                ->assertForbidden();

            $this->actingAs($user, 'sanctum')
                ->postJson('/api/admin/system-settings', [
                    'key' => 'test.key',
                    'value' => 'test',
                ])
                ->assertForbidden();
        }
    }

    public function test_unauthenticated_cannot_access_system_settings(): void
    {
        $this->getJson('/api/admin/system-settings')->assertUnauthorized();
        $this->postJson('/api/admin/system-settings', [
            'key' => 'test.key',
            'value' => 'test',
        ])->assertUnauthorized();
    }

    public function test_admin_can_delete_system_setting(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        SystemSetting::set('general.temp_key', 'temp_value', 'general', 'Sementara.');

        $setting = SystemSetting::where('key', 'general.temp_key')->first();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/system-settings/{$setting->id}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('system_settings', [
            'key' => 'general.temp_key',
        ]);
    }
}
