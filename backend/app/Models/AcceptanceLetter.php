<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcceptanceLetter extends Model
{
    use HasFactory;

    /**
     * The storage path and disk are internal details. Files are always served
     * through an authorized controller response, never through a public URL.
     *
     * @var list<string>
     */
    protected $hidden = [
        'disk',
        'path',
    ];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'internship_application_id',
        'uploaded_by',
        'disk',
        'path',
        'original_name',
        'mime_type',
        'size',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'size' => 'integer',
        ];
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(
            InternshipApplication::class,
            'internship_application_id',
        );
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
