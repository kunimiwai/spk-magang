<?php

namespace Tests\Feature\Api;

use App\Models\Partner;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PartnerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_partners_with_pagination(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Partner::factory()->count(3)->create();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/partners?per_page=2')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data')
            ->assertJsonStructure([
                'data' => [
                    ['id', 'name', 'address', 'contact', 'email', 'description', 'created_at', 'updated_at'],
                ],
                'meta' => ['current_page', 'per_page', 'last_page', 'total'],
            ])
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonPath('meta.total', 3);
    }

    public function test_admin_can_create_a_partner(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $payload = [
            'name' => 'PT Contoh Teknologi',
            'address' => 'Jl. Contoh No. 1, Palembang',
            'contact' => '081234567890',
            'email' => 'mitra@example.com',
            'description' => 'Mitra magang bidang pengembangan perangkat lunak.',
        ];

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/partners', $payload)
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', $payload['name'])
            ->assertJsonPath('data.email', $payload['email'])
            ->assertJsonStructure([
                'data' => ['id', 'name', 'address', 'contact', 'email', 'description'],
            ]);

        $this->assertDatabaseHas('partners', [
            'name' => $payload['name'],
            'email' => $payload['email'],
        ]);
    }

    public function test_admin_can_create_a_partner_with_only_the_required_fields(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/partners', ['name' => 'CV Minimal'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'CV Minimal')
            ->assertJsonPath('data.address', null)
            ->assertJsonPath('data.email', null);

        $this->assertDatabaseHas('partners', ['name' => 'CV Minimal']);
    }

    public function test_partner_creation_validates_input(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/partners', [
                'name' => '',
                'email' => 'bukan-email',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email']);

        $this->assertDatabaseCount('partners', 0);
    }

    public function test_admin_can_show_a_partner(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $partner = Partner::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/admin/partners/{$partner->id}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $partner->id)
            ->assertJsonPath('data.name', $partner->name);
    }

    public function test_admin_can_update_a_partner_with_put(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $partner = Partner::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/partners/{$partner->id}", [
                'name' => 'PT Nama Baru',
                'address' => 'Alamat baru',
                'contact' => '089999999999',
                'email' => 'baru@example.com',
                'description' => 'Deskripsi baru.',
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'PT Nama Baru')
            ->assertJsonPath('data.email', 'baru@example.com');

        $this->assertDatabaseHas('partners', [
            'id' => $partner->id,
            'name' => 'PT Nama Baru',
            'email' => 'baru@example.com',
        ]);
    }

    public function test_admin_can_update_a_partner_with_patch(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $partner = Partner::factory()->create([
            'name' => 'PT Nama Lama',
            'address' => 'Alamat lama',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/partners/{$partner->id}", [
                'address' => 'Alamat baru',
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'PT Nama Lama')
            ->assertJsonPath('data.address', 'Alamat baru');

        $this->assertDatabaseHas('partners', [
            'id' => $partner->id,
            'name' => 'PT Nama Lama',
            'address' => 'Alamat baru',
        ]);
    }

    public function test_partner_update_validates_input(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $partner = Partner::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/partners/{$partner->id}", [
                'name' => '',
                'email' => 'bukan-email',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email']);
    }

    public function test_admin_can_delete_a_partner(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $partner = Partner::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/partners/{$partner->id}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('partners', ['id' => $partner->id]);
    }

    public function test_partner_endpoints_return_not_found_for_missing_resource(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/partners/999999')
            ->assertNotFound();

        $this->actingAs($admin, 'sanctum')
            ->putJson('/api/admin/partners/999999', ['name' => 'Tidak Ada'])
            ->assertNotFound();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson('/api/admin/partners/999999')
            ->assertNotFound();
    }

    public function test_partner_endpoints_require_authentication(): void
    {
        $partner = Partner::factory()->create();

        $this->getJson('/api/admin/partners')->assertUnauthorized();
        $this->postJson('/api/admin/partners', ['name' => 'Tanpa Login'])->assertUnauthorized();
        $this->getJson("/api/admin/partners/{$partner->id}")->assertUnauthorized();
        $this->putJson("/api/admin/partners/{$partner->id}", ['name' => 'Tanpa Login'])->assertUnauthorized();
        $this->deleteJson("/api/admin/partners/{$partner->id}")->assertUnauthorized();
    }

    public function test_non_admin_users_cannot_manage_partners(): void
    {
        $user = User::factory()->create(['role' => 'mahasiswa']);
        $partner = Partner::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/admin/partners')
            ->assertForbidden();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/admin/partners', ['name' => 'Tidak Diizinkan'])
            ->assertForbidden();

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/admin/partners/{$partner->id}")
            ->assertForbidden();

        $this->actingAs($user, 'sanctum')
            ->putJson("/api/admin/partners/{$partner->id}", ['name' => 'Tidak Diizinkan'])
            ->assertForbidden();

        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/admin/partners/{$partner->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('partners', [
            'id' => $partner->id,
            'name' => $partner->name,
        ]);
    }
}
