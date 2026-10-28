<?php

namespace App\Http\Requests;

use App\Enums\CriterionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCriterionRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255', Rule::unique('criteria', 'name')],
            'description' => ['nullable', 'string', 'max:5000'],
            'type' => ['required', Rule::enum(CriterionType::class)],
            'weight' => ['required', 'numeric', 'min:0', 'max:999999.999999'],
        ];
    }
}
