<?php

namespace Database\Factories;

use App\Enums\CriterionType;
use App\Models\Criterion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Criterion>
 */
class CriterionFactory extends Factory
{
    protected $model = Criterion::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => 'Kriteria Uji '.fake()->unique()->numberBetween(1, 100000),
            'description' => fake()->sentence(8),
            'type' => fake()->randomElement([CriterionType::Benefit, CriterionType::Cost]),
            'weight' => fake()->randomFloat(6, 0.000001, 10),
        ];
    }
}
