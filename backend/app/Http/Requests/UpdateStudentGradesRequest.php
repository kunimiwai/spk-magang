<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudentGradesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        $min = config('academic.grade.min');
        $max = config('academic.grade.max');

        return [
            'grades' => ['present', 'array'],
            'grades.*.course_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('courses', 'id'),
            ],
            'grades.*.score' => [
                'present',
                'nullable',
                'numeric',
                'min:'.$min,
                'max:'.$max,
            ],
            'grades.*.user_id' => ['prohibited'],
            'user_id' => ['prohibited'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'grades.present' => 'Daftar nilai wajib dikirim.',
            'grades.array' => 'Nilai harus dikirim sebagai daftar.',
            'grades.*.course_id.required' => 'Mata kuliah wajib dipilih.',
            'grades.*.course_id.exists' => 'Mata kuliah tidak ditemukan.',
            'grades.*.course_id.distinct' => 'Mata kuliah tidak boleh dikirim lebih dari sekali.',
            'grades.*.score.numeric' => 'Nilai harus berupa angka.',
            'grades.*.score.min' => 'Nilai melebihi batas penyimpanan.',
            'grades.*.score.max' => 'Nilai melebihi batas penyimpanan.',
            'grades.*.user_id.prohibited' => 'user_id tidak boleh dikirim; nilai selalu mengikuti akun yang sedang login.',
            'user_id.prohibited' => 'user_id tidak boleh dikirim; nilai selalu mengikuti akun yang sedang login.',
        ];
    }
}
