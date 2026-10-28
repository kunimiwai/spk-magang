<?php

namespace Tests\Feature\Api;

use App\Models\Course;
use App\Models\StudentGrade;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentGradeTest extends TestCase
{
    use RefreshDatabase;

    public function test_mahasiswa_gets_an_empty_sheet_when_no_courses_exist(): void
    {
        $user = User::factory()->create(['role' => 'mahasiswa']);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/mahasiswa/grades')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.courses', [])
            ->assertJsonPath('data.prerequisite_evaluation.status', 'not_configured')
            ->assertJsonPath(
                'data.prerequisite_evaluation.message',
                'Aturan mata kuliah prasyarat dan ambang kelulusan belum dikonfigurasi (OD-007/OD-008).',
            )
            ->assertJsonPath('data.score_bounds.min', -999999.999999)
            ->assertJsonPath('data.score_bounds.max', 999999.999999);
    }

    public function test_sheet_lists_all_courses_and_only_the_authenticated_students_grades(): void
    {
        $user = User::factory()->create(['role' => 'mahasiswa']);
        $other = User::factory()->create(['role' => 'mahasiswa']);
        $algoritma = Course::factory()->create(['name' => 'Algoritma']);
        $basisData = Course::factory()->create(['name' => 'Basis Data']);

        StudentGrade::factory()->create([
            'user_id' => $user->id,
            'course_id' => $algoritma->id,
            'score' => 82.5,
        ]);
        StudentGrade::factory()->create([
            'user_id' => $other->id,
            'course_id' => $basisData->id,
            'score' => 91,
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/mahasiswa/grades')
            ->assertOk()
            ->assertJsonCount(2, 'data.courses')
            ->assertJsonFragment([
                'id' => $algoritma->id,
                'name' => 'Algoritma',
                'score' => 82.5,
            ])
            ->assertJsonFragment([
                'id' => $basisData->id,
                'name' => 'Basis Data',
                'score' => null,
            ]);
    }

    public function test_mahasiswa_can_save_replace_and_clear_their_grades(): void
    {
        $user = User::factory()->create(['role' => 'mahasiswa']);
        $algoritma = Course::factory()->create(['name' => 'Algoritma']);
        $basisData = Course::factory()->create(['name' => 'Basis Data']);
        $jaringan = Course::factory()->create(['name' => 'Jaringan']);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/mahasiswa/grades', [
                'grades' => [
                    ['course_id' => $algoritma->id, 'score' => 85.5],
                    ['course_id' => $basisData->id, 'score' => 0],
                    ['course_id' => $jaringan->id, 'score' => null],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Nilai akademik berhasil disimpan.')
            ->assertJsonFragment([
                'id' => $algoritma->id,
                'score' => 85.5,
            ])
            ->assertJsonFragment([
                'id' => $basisData->id,
                'score' => 0,
            ])
            ->assertJsonFragment([
                'id' => $jaringan->id,
                'score' => null,
            ]);

        $this->assertDatabaseHas('student_grades', [
            'user_id' => $user->id,
            'course_id' => $algoritma->id,
            'score' => 85.5,
        ]);
        $this->assertDatabaseHas('student_grades', [
            'user_id' => $user->id,
            'course_id' => $basisData->id,
            'score' => 0,
        ]);
        $this->assertDatabaseMissing('student_grades', [
            'user_id' => $user->id,
            'course_id' => $jaringan->id,
        ]);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/mahasiswa/grades', [
                'grades' => [
                    ['course_id' => $algoritma->id, 'score' => 90],
                ],
            ])
            ->assertOk();

        $this->assertDatabaseCount('student_grades', 1);
        $this->assertDatabaseMissing('student_grades', [
            'user_id' => $user->id,
            'course_id' => $basisData->id,
        ]);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/mahasiswa/grades', ['grades' => []])
            ->assertOk();

        $this->assertDatabaseCount('student_grades', 0);
    }

    public function test_grade_update_validates_course_and_score_input(): void
    {
        $user = User::factory()->create(['role' => 'mahasiswa']);
        $course = Course::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/mahasiswa/grades', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['grades']);
        $this->actingAs($user, 'sanctum')
            ->putJson('/api/mahasiswa/grades', [
                'grades' => [
                    ['course_id' => 999999, 'score' => 80],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['grades.0.course_id']);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/mahasiswa/grades', [
                'grades' => [
                    ['course_id' => $course->id, 'score' => 80],
                    ['course_id' => $course->id, 'score' => 90],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['grades.0.course_id']);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/mahasiswa/grades', [
                'grades' => [
                    ['course_id' => $course->id, 'score' => 'bukan-angka'],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['grades.0.score']);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/mahasiswa/grades', [
                'grades' => [
                    ['course_id' => $course->id, 'score' => 1000000],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['grades.0.score']);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/mahasiswa/grades', [
                'grades' => [
                    ['course_id' => $course->id, 'score' => 80],
                ],
                'user_id' => 999,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['user_id']);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/mahasiswa/grades', [
                'grades' => [
                    [
                        'course_id' => $course->id,
                        'score' => 80,
                        'user_id' => 999,
                    ],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['grades.0.user_id']);

        $this->assertDatabaseCount('student_grades', 0);
    }

    public function test_grades_are_isolated_between_mahasiswa_and_identity_cannot_be_overridden(): void
    {
        $first = User::factory()->create(['role' => 'mahasiswa']);
        $second = User::factory()->create(['role' => 'mahasiswa']);
        $course = Course::factory()->create();

        $this->actingAs($first, 'sanctum')
            ->putJson('/api/mahasiswa/grades', [
                'grades' => [
                    ['course_id' => $course->id, 'score' => 80],
                ],
            ])
            ->assertOk();

        $this->actingAs($second, 'sanctum')
            ->getJson('/api/mahasiswa/grades')
            ->assertOk()
            ->assertJsonFragment([
                'id' => $course->id,
                'score' => null,
            ]);

        $this->actingAs($second, 'sanctum')
            ->putJson('/api/mahasiswa/grades', [
                'grades' => [
                    ['course_id' => $course->id, 'score' => 90],
                ],
                'user_id' => $first->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['user_id']);

        $this->actingAs($second, 'sanctum')
            ->putJson('/api/mahasiswa/grades', [
                'grades' => [
                    ['course_id' => $course->id, 'score' => 90],
                ],
            ])
            ->assertOk();

        $this->actingAs($first, 'sanctum')
            ->getJson('/api/mahasiswa/grades')
            ->assertOk()
            ->assertJsonFragment([
                'id' => $course->id,
                'score' => 80,
            ]);

        $this->assertDatabaseHas('student_grades', [
            'user_id' => $first->id,
            'course_id' => $course->id,
            'score' => 80,
        ]);
        $this->assertDatabaseHas('student_grades', [
            'user_id' => $second->id,
            'course_id' => $course->id,
            'score' => 90,
        ]);
    }

    public function test_grade_endpoints_require_authentication_and_mahasiswa_role(): void
    {
        $this->getJson('/api/mahasiswa/grades')->assertUnauthorized();
        $this->putJson('/api/mahasiswa/grades', ['grades' => []])->assertUnauthorized();

        foreach (['admin', 'prodi', 'dpm'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/mahasiswa/grades')
                ->assertForbidden();

            $this->actingAs($user, 'sanctum')
                ->putJson('/api/mahasiswa/grades', ['grades' => []])
                ->assertForbidden();
        }

        $this->assertDatabaseCount('student_grades', 0);
    }

    public function test_database_rejects_duplicate_user_course_grade(): void
    {
        $grade = StudentGrade::factory()->create();

        $this->expectException(QueryException::class);

        StudentGrade::factory()->create([
            'user_id' => $grade->user_id,
            'course_id' => $grade->course_id,
        ]);
    }

    public function test_deleting_a_user_cascades_their_grades(): void
    {
        $grade = StudentGrade::factory()->create();

        $grade->user->delete();

        $this->assertDatabaseMissing('student_grades', ['id' => $grade->id]);
    }
}
