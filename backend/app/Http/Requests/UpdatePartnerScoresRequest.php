<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePartnerScoresRequest extends FormRequest
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
        return [
            'scores' => ['required', 'array'],
            'scores.*.criterion_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('criteria', 'id'),
            ],
            'scores.*.score' => [
                'present',
                'nullable',
                'numeric',
                'min:-999999.999999',
                'max:999999.999999',
            ],
        ];
    }
}
