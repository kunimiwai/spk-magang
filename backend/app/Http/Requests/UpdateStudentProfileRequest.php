<?php

namespace App\Http\Requests;

use App\Services\StudentProfileService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudentProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $mode = config('student.peminatan.mode');

        if (! in_array($mode, [
            StudentProfileService::MODE_SINGLE,
            StudentProfileService::MODE_MULTIPLE,
        ], true)) {
            // The controller returns 409 with the OD-015 reason. Skipping
            // validation keeps that conflict response accurate for any body.
            return [];
        }

        $options = config('student.peminatan.options');
        $options = is_array($options)
            ? array_values(array_filter(
                $options,
                fn (mixed $option): bool => is_string($option) && $option !== '',
            ))
            : [];

        $rules = [
            'peminatan' => ['required', 'array', 'list', 'min:1'],
            'peminatan.*' => ['required', 'string', 'distinct', Rule::in($options)],
            'user_id' => ['prohibited'],
        ];

        if ($mode === StudentProfileService::MODE_SINGLE) {
            $rules['peminatan'][] = 'max:1';
        }

        return $rules;
    }

    protected function prepareForValidation(): void
    {
        $peminatan = $this->input('peminatan');

        if (! is_array($peminatan)) {
            return;
        }

        $this->merge([
            'peminatan' => array_map(
                fn (mixed $value): mixed => is_string($value) ? trim($value) : $value,
                $peminatan,
            ),
        ]);
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'peminatan.required' => 'Pilih minimal satu peminatan.',
            'peminatan.array' => 'Peminatan harus dikirim sebagai daftar pilihan.',
            'peminatan.list' => 'Peminatan harus dikirim sebagai daftar pilihan.',
            'peminatan.min' => 'Pilih minimal satu peminatan.',
            'peminatan.max' => 'Hanya satu peminatan yang dapat dipilih.',
            'peminatan.*.in' => 'Peminatan harus salah satu dari DTA, PSI, atau SIA.',
            'peminatan.*.distinct' => 'Peminatan tidak boleh dipilih lebih dari sekali.',
            'user_id.prohibited' => 'user_id tidak boleh dikirim; profil selalu mengikuti akun yang sedang login.',
        ];
    }
}
