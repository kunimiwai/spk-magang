<?php

namespace App\Services;

use App\Models\User;

class StudentPeminatanResolver
{
    /**
     * Read peminatan only from the authenticated student's stored profile.
     *
     * @return list<string>
     */
    public function resolve(User $user): array
    {
        return $user->studentPeminatan()
            ->orderBy('peminatan')
            ->pluck('peminatan')
            ->filter(fn (mixed $value): bool => is_string($value))
            ->values()
            ->all();
    }

    /**
     * @param  list<string>  $peminatan
     */
    public function issue(array $peminatan): ?string
    {
        return match (count($peminatan)) {
            0 => 'Peminatan mahasiswa belum dipilih.',
            1 => null,
            default => 'Ditemukan '.count($peminatan).' peminatan tersimpan. Filter rekomendasi untuk multi-peminatan belum ditetapkan (OD-015).',
        };
    }
}
