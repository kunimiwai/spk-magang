<?php

namespace App\Services;

use App\Models\Course;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class StudentGradeService
{
    public function __construct(
        private AcademicPrerequisiteEvaluator $prerequisites,
    ) {}

    /**
     * @return array{
     *     courses: list<array{
     *         id: int,
     *         name: string,
     *         description: string|null,
     *         score: float|null,
     *         grade_updated_at: string|null
     *     }>,
     *     prerequisite_evaluation: array{status: string, message: string},
     *     score_bounds: array{min: float, max: float}
     * }
     */
    public function sheet(User $user): array
    {
        $grades = $user->studentGrades()
            ->get()
            ->keyBy('course_id');

        $courses = Course::query()
            ->orderBy('name')
            ->orderBy('id')
            ->get()
            ->map(function (Course $course) use ($grades): array {
                $grade = $grades->get($course->id);

                return [
                    'id' => $course->id,
                    'name' => $course->name,
                    'description' => $course->description,
                    'score' => $grade === null ? null : (float) $grade->score,
                    'grade_updated_at' => $grade?->updated_at?->toIso8601String(),
                ];
            })
            ->values()
            ->all();

        return [
            'courses' => $courses,
            'prerequisite_evaluation' => $this->prerequisites->configurationStatus(),
            'score_bounds' => [
                'min' => (float) config('academic.grade.min'),
                'max' => (float) config('academic.grade.max'),
            ],
        ];
    }

    /**
     * Replace the authenticated student's grades with the submitted rows.
     *
     * A null score removes the stored grade. The list is validated to contain
     * distinct, existing course IDs before this method is called.
     *
     * @param  list<array{course_id: int|string, score: int|float|string|null}>  $grades
     * @return array{
     *     courses: list<array{
     *         id: int,
     *         name: string,
     *         description: string|null,
     *         score: float|null,
     *         grade_updated_at: string|null
     *     }>,
     *     prerequisite_evaluation: array{status: string, message: string},
     *     score_bounds: array{min: float, max: float}
     * }
     */
    public function replace(User $user, array $grades): array
    {
        DB::transaction(function () use ($user, $grades): void {
            $user->studentGrades()->delete();

            foreach ($grades as $row) {
                if ($row['score'] === null) {
                    continue;
                }

                $user->studentGrades()->create([
                    'course_id' => (int) $row['course_id'],
                    'score' => (float) $row['score'],
                ]);
            }
        });

        return $this->sheet($user->fresh());
    }
}
