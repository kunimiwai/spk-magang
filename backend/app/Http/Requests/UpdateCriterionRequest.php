<?php

namespace App\Http\Requests;

use App\Enums\CriterionType;
use App\Models\Criterion;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCriterionRequest extends FormRequest
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
        $criterion = $this->route('criterion');

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('criteria', 'name')->ignore(
                    $criterion instanceof Criterion ? $criterion : null,
                ),
            ],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'type' => ['sometimes', 'required', Rule::enum(CriterionType::class)],
            'weight' => ['sometimes', 'required', 'numeric', 'min:0', 'max:999999.999999'],
        ];
    }
}
