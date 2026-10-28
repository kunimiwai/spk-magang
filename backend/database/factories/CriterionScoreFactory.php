<?php

namespace Database\Factories;

use App\Models\Criterion;
use App\Models\CriterionScore;
use App\Models\Partner;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CriterionScore>
 */
class CriterionScoreFactory extends Factory
{
    protected $model = CriterionScore::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'partner_id' => Partner::factory(),
            'criterion_id' => Criterion::factory(),
            'score' => fake()->randomFloat(6, 0, 100),
        ];
    }
}
