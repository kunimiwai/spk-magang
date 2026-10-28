<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KmeansRun extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'cluster_count',
        'random_seed',
        'iteration_count',
        'inertia',
        'converged',
        'feature_criterion_ids',
        'metadata',
        'ran_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'cluster_count' => 'integer',
            'random_seed' => 'integer',
            'iteration_count' => 'integer',
            'inertia' => 'double',
            'converged' => 'boolean',
            'feature_criterion_ids' => 'array',
            'metadata' => 'array',
            'ran_at' => 'datetime',
        ];
    }

    /**
     * @return HasMany<KmeansRunPartner>
     */
    public function partners(): HasMany
    {
        return $this->hasMany(KmeansRunPartner::class);
    }
}
