<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DpmActivity extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'dpm_placement_id',
        'dpm_id',
        'activity_type',
        'description',
        'occurred_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
        ];
    }

    public function placement(): BelongsTo
    {
        return $this->belongsTo(DpmPlacement::class, 'dpm_placement_id');
    }

    public function dpm(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dpm_id');
    }
}
