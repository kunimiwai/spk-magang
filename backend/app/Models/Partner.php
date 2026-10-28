<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Partner extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'address',
        'contact',
        'email',
        'description',
        'partner_type',
        'da_score',
        'sd_score',
        'itg_score',
        'distance_km',
        'rating',
        'vacancy_status',
        'quota',
        'requirements',
        'is_verified',
        'source_metadata',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'da_score' => 'decimal:4',
            'sd_score' => 'decimal:4',
            'itg_score' => 'decimal:4',
            'distance_km' => 'decimal:3',
            'rating' => 'decimal:2',
            'quota' => 'integer',
            'requirements' => 'array',
            'is_verified' => 'boolean',
            'source_metadata' => 'array',
        ];
    }

    public function criterionScores(): HasMany
    {
        return $this->hasMany(CriterionScore::class);
    }

    public function internshipApplications(): HasMany
    {
        return $this->hasMany(InternshipApplication::class);
    }

    /**
     * @return HasMany<KmeansRunPartner>
     */
    public function kmeansRunPartners(): HasMany
    {
        return $this->hasMany(KmeansRunPartner::class);
    }
}
