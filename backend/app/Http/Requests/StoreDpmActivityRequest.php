<?php

namespace App\Http\Requests;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Throwable;

class StoreDpmActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'activity_type' => [
                'required',
                'string',
                'max:100',
            ],
            'description' => [
                'sometimes',
                'nullable',
                'string',
                'max:2000',
            ],
            'occurred_at' => ['sometimes', 'nullable', 'date'],
            // Metadata ditetapkan server.
            'dpm_placement_id' => ['prohibited'],
            'dpm_id' => ['prohibited'],
            'created_at' => ['prohibited'],
            'updated_at' => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        return [
            'activity_type.required' => 'Jenis aktivitas wajib diisi.',
            'activity_type.max' => 'Jenis aktivitas maksimal 100 karakter.',
            'description.max' => 'Deskripsi maksimal 2000 karakter.',
            'occurred_at.date' => 'Waktu aktivitas tidak valid.',
            'dpm_placement_id.prohibited' => 'Penempatan ditentukan dari URL.',
            'dpm_id.prohibited' => 'DPM ditetapkan dari akun yang sedang login.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $occurredAt = $this->input('occurred_at');

        if (! is_string($occurredAt) || trim($occurredAt) === '') {
            $this->merge([
                'occurred_at' => now()->toIso8601String(),
            ]);

            return;
        }

        try {
            $this->merge([
                'occurred_at' => CarbonImmutable::parse($occurredAt)
                    ->utc()
                    ->toIso8601String(),
            ]);
        } catch (Throwable) {
            // The date rule reports the validation error.
        }
    }
}
