<?php

namespace Database\Factories;

use App\Models\StudentPeminatan;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StudentPeminatan>
 */
class StudentPeminatanFactory extends Factory
{
    protected $model = StudentPeminatan::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'peminatan' => fake()->randomElement(['DTA', 'PSI', 'SIA']),
        ];
    }
}
