<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecommendationHistory extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'kmeans_run_id',
        'peminatan',
        'weights',
        'ranking',
        'metadata',
        'status',
        'calculated_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'peminatan' => 'array',
            'weights' => 'array',
            'ranking' => 'array',
            'metadata' => 'array',
            'calculated_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function kmeansRun(): BelongsTo
    {
        return $this->belongsTo(KmeansRun::class);
    }
}
