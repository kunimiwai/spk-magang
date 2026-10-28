<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSystemSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'key' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('system_settings', 'key')->ignore(
                    $this->route('system_setting')
                ),
            ],
            'value' => ['sometimes', 'required', 'string'],
            'group' => ['sometimes', 'nullable', 'string', 'max:100'],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'key.unique' => 'Kunci pengaturan sudah digunakan.',
            'value.required' => 'Nilai pengaturan wajib diisi.',
        ];
    }
}
