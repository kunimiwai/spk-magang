<?php

namespace Tests\Feature\Api;

use App\Models\Course;
use App\Models\StudentGrade;
use App\Models\User;
use App\Services\AcademicPrerequisiteEvaluator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AcademicPrerequisiteTest extends TestCase
{
    use RefreshDatabase;

    public function test_unconfigured_rules_are_reported_without_evaluating_grades(): void
    {
        config(['academic.prerequisites.rules' => []]);
        $student = User::factory()->create(['role' => 'mahasiswa']);

        $result = app(AcademicPrerequisiteEvaluator::class)->evaluate($student);

        $this->assertSame(
            'Aturan mata kuliah prasyarat dan ambang kelulusan belum dikonfigurasi (OD-007/OD-008).',
            $result['issue'],
        );
    }

    public function test_missing_grade_is_not_treated_as_zero(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $course = Course::factory()->create(['name' => 'Algoritma']);
        config([
            'academic.prerequisites.rules' => [
                ['course_id' => $course->id, 'minimum_score' => 70],
            ],
        ]);

        $result = app(AcademicPrerequisiteEvaluator::class)->evaluate($student);

        $this->assertStringContainsString('Algoritma', $result['issue']);
        $this->assertStringContainsString(
            'Nilai yang hilang tidak dianggap nol.',
            $result['issue'],
        );
    }

    public function test_stored_zero_is_evaluated_against_the_configured_threshold(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $course = Course::factory()->create(['name' => 'Algoritma']);
        StudentGrade::factory()->create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'score' => 0,
        ]);
        config([
            'academic.prerequisites.rules' => [
                ['course_id' => $course->id, 'minimum_score' => 70],
            ],
        ]);

        $result = app(AcademicPrerequisiteEvaluator::class)->evaluate($student);

        $this->assertStringContainsString(
            'Nilai belum memenuhi ambang konfigurasi',
            $result['issue'],
        );
        $this->assertStringNotContainsString('belum diisi', $result['issue']);
    }

    public function test_configured_threshold_is_met_without_claiming_official_graduation(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $course = Course::factory()->create(['name' => 'Algoritma']);
        StudentGrade::factory()->create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'score' => 70,
        ]);
        config([
            'academic.prerequisites.rules' => [
                ['course_id' => $course->id, 'minimum_score' => 70],
            ],
        ]);

        $result = app(AcademicPrerequisiteEvaluator::class)->evaluate($student);

        $this->assertNull($result['issue']);
        $this->assertStringContainsString(
            'Aturan prasyarat yang dikonfigurasi terpenuhi',
            $result['ok'],
        );
    }

    public function test_invalid_or_unknown_rule_configuration_blocks_evaluation(): void
    {
        $student = User::factory()->create(['role' => 'mahasiswa']);
        $evaluator = app(AcademicPrerequisiteEvaluator::class);

        foreach ([
            'bukan-daftar' => ['course_id' => 1],
            'tanpa-course' => [['minimum_score' => 70]],
            'tanpa-ambang' => [['course_id' => 1]],
            'duplikat' => [
                ['course_id' => 1, 'minimum_score' => 70],
                ['course_id' => 1, 'minimum_score' => 80],
            ],
        ] as $rules) {
            config(['academic.prerequisites.rules' => $rules]);

            $result = $evaluator->evaluate($student);

            $this->assertSame(
                'Konfigurasi aturan prasyarat tidak valid.',
                $result['issue'],
            );
        }

        $course = Course::factory()->create();
        config([
            'academic.prerequisites.rules' => [
                ['course_id' => $course->id + 999999, 'minimum_score' => 70],
            ],
        ]);

        $this->assertSame(
            'Konfigurasi aturan prasyarat merujuk mata kuliah yang tidak tersedia.',
            $evaluator->evaluate($student)['issue'],
        );
    }

    public function test_configuration_status_reflects_empty_valid_and_unknown_rules(): void
    {
        $evaluator = app(AcademicPrerequisiteEvaluator::class);
        $course = Course::factory()->create();

        config(['academic.prerequisites.rules' => []]);
        $this->assertSame('not_configured', $evaluator->configurationStatus()['status']);

        config([
            'academic.prerequisites.rules' => [
                ['course_id' => $course->id, 'minimum_score' => 70],
            ],
        ]);
        $this->assertSame('configured', $evaluator->configurationStatus()['status']);

        config([
            'academic.prerequisites.rules' => [
                ['course_id' => $course->id + 999999, 'minimum_score' => 70],
            ],
        ]);
        $this->assertSame('invalid', $evaluator->configurationStatus()['status']);
    }
}
