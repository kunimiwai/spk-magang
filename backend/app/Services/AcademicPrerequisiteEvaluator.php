<?php

namespace App\Services;

use App\Models\Course;
use App\Models\User;

/**
 * Evaluates configured prerequisite rules without inventing them.
 *
 * The production config is intentionally empty until OD-007/OD-008 decide
 * the source of grades, the prerequisite course list, and the passing
 * threshold. Missing grades are always reported as missing and are never
 * treated as zero.
 */
class AcademicPrerequisiteEvaluator
{
    /**
     * @return array{status: string, message: string}
     */
    public function configurationStatus(): array
    {
        $rules = $this->rules();

        if ($rules === null) {
            return [
                'status' => 'invalid',
                'message' => 'Konfigurasi aturan prasyarat tidak valid.',
            ];
        }

        if ($rules === []) {
            return [
                'status' => 'not_configured',
                'message' => $this->note(),
            ];
        }

        $courseIds = array_map(
            fn (array $rule): int => $rule['course_id'],
            $rules,
        );

        $knownCourses = Course::query()
            ->whereIn('id', array_values(array_unique($courseIds)))
            ->pluck('id')
            ->all();

        if (array_diff($courseIds, $knownCourses) !== []) {
            return [
                'status' => 'invalid',
                'message' => 'Konfigurasi aturan prasyarat merujuk mata kuliah yang tidak tersedia.',
            ];
        }

        return [
            'status' => 'configured',
            'message' => 'Aturan prasyarat terkonfigurasi untuk '.count($rules).' mata kuliah.',
        ];
    }

    /**
     * @return array{issue: string|null, ok: string}
     */
    public function evaluate(?User $student): array
    {
        $ok = 'Aturan prasyarat yang dikonfigurasi terpenuhi oleh nilai tersimpan.';
        $rules = $this->rules();

        if ($rules === null) {
            return [
                'issue' => 'Konfigurasi aturan prasyarat tidak valid.',
                'ok' => $ok,
            ];
        }

        if ($rules === []) {
            return [
                'issue' => $this->note(),
                'ok' => $ok,
            ];
        }

        if ($student === null) {
            return [
                'issue' => 'Data mahasiswa tidak tersedia untuk mengevaluasi prasyarat.',
                'ok' => $ok,
            ];
        }

        $courseIds = array_map(
            fn (array $rule): int => $rule['course_id'],
            $rules,
        );
        $courseIds = array_values(array_unique($courseIds));

        $courses = Course::query()
            ->whereIn('id', $courseIds)
            ->get()
            ->keyBy('id');

        $unknownCourses = array_diff($courseIds, $courses->keys()->all());

        if ($unknownCourses !== []) {
            return [
                'issue' => 'Konfigurasi aturan prasyarat merujuk mata kuliah yang tidak tersedia.',
                'ok' => $ok,
            ];
        }

        $grades = $student->studentGrades()
            ->whereIn('course_id', $courseIds)
            ->get()
            ->keyBy('course_id');

        $missing = [];
        $belowThreshold = [];

        foreach ($rules as $rule) {
            $course = $courses->get($rule['course_id']);
            $grade = $grades->get($rule['course_id']);
            $minimumScore = $rule['minimum_score'];

            if ($grade === null) {
                $missing[] = $course->name;

                continue;
            }

            $score = $this->finiteNumber($grade->score);

            if ($score === null || $score < $minimumScore) {
                $belowThreshold[] = $course->name;
            }
        }

        if ($missing !== []) {
            return [
                'issue' => 'Nilai prasyarat belum diisi untuk '
                    .$this->limitedList($missing)
                    .'. Nilai yang hilang tidak dianggap nol.',
                'ok' => $ok,
            ];
        }

        if ($belowThreshold !== []) {
            return [
                'issue' => 'Nilai belum memenuhi ambang konfigurasi untuk '
                    .$this->limitedList($belowThreshold)
                    .'.',
                'ok' => $ok,
            ];
        }

        return ['issue' => null, 'ok' => $ok];
    }

    private function note(): string
    {
        $note = config('academic.prerequisites.note');

        return is_string($note) && $note !== ''
            ? $note
            : 'Aturan mata kuliah prasyarat dan ambang kelulusan belum dikonfigurasi (OD-007/OD-008).';
    }

    /**
     * @return list<array{course_id: int, minimum_score: float}>|null
     */
    private function rules(): ?array
    {
        $raw = config('academic.prerequisites.rules');

        if (! is_array($raw) || ! array_is_list($raw)) {
            return null;
        }

        $result = [];
        $courseIds = [];

        foreach ($raw as $rule) {
            if (! is_array($rule)) {
                return null;
            }

            $courseId = $this->positiveInteger($rule['course_id'] ?? null);
            $minimumScore = $this->finiteNumber($rule['minimum_score'] ?? null);

            if (
                $courseId === null
                || $minimumScore === null
                || in_array($courseId, $courseIds, true)
            ) {
                return null;
            }

            $courseIds[] = $courseId;
            $result[] = [
                'course_id' => $courseId,
                'minimum_score' => $minimumScore,
            ];
        }

        return $result;
    }

    private function positiveInteger(mixed $value): ?int
    {
        $number = $this->integerValue($value);

        return $number !== null && $number > 0 ? $number : null;
    }

    private function integerValue(mixed $value): ?int
    {
        if (is_int($value)) {
            return $value;
        }

        if (is_string($value) && preg_match('/^\d+$/', trim($value)) === 1) {
            return (int) trim($value);
        }

        return null;
    }

    private function finiteNumber(mixed $value): ?float
    {
        if (! is_int($value) && ! is_float($value)) {
            return null;
        }

        $number = (float) $value;

        return is_finite($number) ? $number : null;
    }

    /**
     * @param  list<string>  $items
     */
    private function limitedList(array $items, int $limit = 5): string
    {
        $shown = array_slice($items, 0, $limit);
        $message = implode(', ', $shown);

        if (count($items) > $limit) {
            $message .= ', dan '.(count($items) - $limit).' lainnya';
        }

        return $message;
    }
}
