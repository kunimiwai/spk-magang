<?php

namespace Database\Factories;

use App\Models\Partner;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Partner>
 */
class PartnerFactory extends Factory
{
    protected $model = Partner::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'address' => fake()->address(),
            'contact' => fake()->phoneNumber(),
            'email' => fake()->unique()->companyEmail(),
            'description' => fake()->sentence(12),
            'partner_type' => fake()->randomElement(['IT', 'Consulting', 'Manufacturing', 'Other']),
            'da_score' => fake()->randomFloat(4, 1, 5),
            'sd_score' => fake()->randomFloat(4, 1, 5),
            'itg_score' => fake()->randomFloat(4, 1, 5),
            'distance_km' => fake()->randomFloat(3, 1, 50),
            'rating' => fake()->randomFloat(2, 1, 5),
            'vacancy_status' => 'open',
            'quota' => fake()->numberBetween(1, 10),
            'requirements' => [],
            'is_verified' => true,
            'source_metadata' => [],
        ];
    }
}

