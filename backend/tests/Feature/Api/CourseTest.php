<?php

namespace Tests\Feature\Api;

use App\Models\Course;
use App\Models\StudentGrade;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_and_prodi_can_list_courses(): void
    {
        Course::factory()->create(['name' => 'Mata Kuliah Uji']);

        foreach (['admin', 'prodi'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/admin/courses')
                ->assertOk()
                ->assertJsonPath('success', true)
                ->assertJsonCount(1, 'data')
                ->assertJsonPath('data.0.name', 'Mata Kuliah Uji')
                ->assertJsonPath('data.0.grades_count', 0);
        }
    }

    public function test_course_list_is_empty_when_no_courses_exist(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/courses')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_admin_and_prodi_can_create_a_course(): void
    {
        foreach (['admin', 'prodi'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user, 'sanctum')
                ->postJson('/api/admin/courses', [
                    'name' => 'Mata Kuliah '.$role,
                    'description' => 'Deskripsi mata kuliah uji.',
                ])
                ->assertCreated()
                ->assertJsonPath('success', true)
                ->assertJsonPath('data.name', 'Mata Kuliah '.$role)
                ->assertJsonPath('data.grades_count', 0);
        }

        $this->assertDatabaseCount('courses', 2);
    }

    public function test_course_creation_validates_name_and_uniqueness(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Course::factory()->create(['name' => 'Mata Kuliah Sama']);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/courses', [
                'name' => '',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/courses', [
                'name' => 'Mata Kuliah Sama',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);

        $this->assertDatabaseCount('courses', 1);
    }

    public function test_course_can_be_shown_and_updated(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $course = Course::factory()->create([
            'name' => 'Nama Lama',
            'description' => 'Deskripsi lama.',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/admin/courses/{$course->id}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Nama Lama')
            ->assertJsonPath('data.grades_count', 0);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/courses/{$course->id}", [
                'name' => 'Nama Baru',
                'description' => null,
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Nama Baru')
            ->assertJsonPath('data.description', null);

        $this->assertDatabaseHas('courses', [
            'id' => $course->id,
            'name' => 'Nama Baru',
        ]);
    }

    public function test_course_can_keep_its_name_when_updated(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $course = Course::factory()->create(['name' => 'Nama Tetap']);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/courses/{$course->id}", [
                'name' => 'Nama Tetap',
                'description' => 'Deskripsi baru.',
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Nama Tetap');
    }

    public function test_course_update_rejects_another_courses_name(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $first = Course::factory()->create(['name' => 'Algoritma']);
        Course::factory()->create(['name' => 'Basis Data']);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/courses/{$first->id}", [
                'name' => 'Basis Data',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);

        $this->assertDatabaseHas('courses', [
            'id' => $first->id,
            'name' => 'Algoritma',
        ]);
    }

    public function test_course_without_grades_can_be_deleted(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $course = Course::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/courses/{$course->id}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('courses', ['id' => $course->id]);
    }

    public function test_course_with_student_grades_cannot_be_deleted(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $course = Course::factory()->create();
        StudentGrade::factory()->create(['course_id' => $course->id]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/courses/{$course->id}")
            ->assertStatus(409)
            ->assertJsonPath('success', false);

        $this->assertDatabaseHas('courses', ['id' => $course->id]);
    }

    public function test_course_endpoints_return_not_found_for_missing_resource(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/courses/999999')
            ->assertNotFound();

        $this->actingAs($admin, 'sanctum')
            ->putJson('/api/admin/courses/999999', ['name' => 'Tidak Ada'])
            ->assertNotFound();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson('/api/admin/courses/999999')
            ->assertNotFound();
    }

    public function test_course_endpoints_require_authentication_and_allowed_role(): void
    {
        $course = Course::factory()->create();

        $this->getJson('/api/admin/courses')->assertUnauthorized();

        foreach (['mahasiswa', 'dpm'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/admin/courses')
                ->assertForbidden();

            $this->actingAs($user, 'sanctum')
                ->postJson('/api/admin/courses', ['name' => 'Tidak Boleh'])
                ->assertForbidden();

            $this->actingAs($user, 'sanctum')
                ->putJson("/api/admin/courses/{$course->id}", ['name' => 'Tidak Boleh'])
                ->assertForbidden();

            $this->actingAs($user, 'sanctum')
                ->deleteJson("/api/admin/courses/{$course->id}")
                ->assertForbidden();
        }

        $this->assertDatabaseCount('courses', 1);
    }
}
