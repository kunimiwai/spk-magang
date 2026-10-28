<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentPeminatan extends Model
{
    use HasFactory;

    protected $table = 'student_peminatan';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'peminatan',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
