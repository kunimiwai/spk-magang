<?php

namespace Database\Factories;

use App\Enums\ApplicationStatus;
use App\Models\InternshipApplication;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InternshipApplication>
 */
class InternshipApplicationFactory extends Factory
{
    protected $model = InternshipApplication::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->state(['role' => 'mahasiswa']),
            'partner_id' => Partner::factory(),
            'status' => ApplicationStatus::Menunggu,
            'submitted_at' => now(),
            'review_note' => null,
            'reviewed_at' => null,
            'reviewed_by' => null,
        ];
    }
}
