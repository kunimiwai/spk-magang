<?php

namespace Database\Factories;

use App\Enums\ApplicationStatus;
use App\Models\DpmPlacement;
use App\Models\InternshipApplication;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DpmPlacement>
 */
class DpmPlacementFactory extends Factory
{
    protected $model = DpmPlacement::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'internship_application_id' => InternshipApplication::factory()
                ->state(['status' => ApplicationStatus::Diterima]),
            'dpm_id' => User::factory()->state(['role' => 'dpm']),
            'assigned_by' => User::factory()->state(['role' => 'admin']),
            'assigned_at' => now(),
        ];
    }
}
