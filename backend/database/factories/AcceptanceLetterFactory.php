<?php

namespace Database\Factories;

use App\Enums\ApplicationStatus;
use App\Models\AcceptanceLetter;
use App\Models\InternshipApplication;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<AcceptanceLetter>
 */
class AcceptanceLetterFactory extends Factory
{
    protected $model = AcceptanceLetter::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'internship_application_id' => InternshipApplication::factory()
                ->state(['status' => ApplicationStatus::Diterima]),
            'uploaded_by' => User::factory()->state(['role' => 'mahasiswa']),
            'disk' => 'local',
            'path' => 'acceptance-letters/'.Str::uuid()->toString().'.pdf',
            'original_name' => 'surat-penerimaan.pdf',
            'mime_type' => 'application/pdf',
            'size' => 1024,
        ];
    }
}
