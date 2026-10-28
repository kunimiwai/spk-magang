<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSystemSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'key' => [
                'required',
                'string',
                'max:255',
                Rule::unique('system_settings', 'key'),
            ],
            'value' => ['required', 'string'],
            'group' => ['sometimes', 'nullable', 'string', 'max:100'],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'key.required' => 'Kunci pengaturan wajib diisi.',
            'key.unique' => 'Kunci pengaturan sudah digunakan.',
            'value.required' => 'Nilai pengaturan wajib diisi.',
        ];
    }
}
