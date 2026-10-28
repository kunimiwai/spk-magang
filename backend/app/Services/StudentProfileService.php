<?php

namespace App\Services;

use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class StudentProfileService
{
    public const MODE_SINGLE = 'single';

    public const MODE_MULTIPLE = 'multiple';

    private const MODES = [self::MODE_SINGLE, self::MODE_MULTIPLE];

    public function __construct(
        private StudentPeminatanResolver $peminatanResolver,
    ) {}

    /**
     * @return list<string>
     */
    public function options(): array
    {
        $options = config('student.peminatan.options');

        if (! is_array($options)) {
            return [];
        }

        return array_values(array_filter(
            $options,
            fn (mixed $option): bool => is_string($option) && $option !== '',
        ));
    }

    public function mode(): ?string
    {
        // Prioritaskan nilai dari tabel system_settings (dikelola melalui UI),
        // lalu fall back ke konfigurasi environment.
        $mode = SystemSetting::get('student.peminatan.mode');

        if ($mode !== null && $mode !== '') {
            return is_string($mode) && in_array($mode, self::MODES, true)
                ? $mode
                : null;
        }

        $mode = config('student.peminatan.mode');

        return is_string($mode) && in_array($mode, self::MODES, true)
            ? $mode
            : null;
    }

    public function selectionAvailable(): bool
    {
        return $this->mode() !== null;
    }

    public function note(): string
    {
        return match ($this->mode()) {
            self::MODE_SINGLE => 'Pilihan peminatan disimpan sebagai satu pilihan.',
            self::MODE_MULTIPLE => 'Pilihan peminatan dapat terdiri dari satu atau lebih pilihan.',
            default => 'Penyimpanan peminatan belum diaktifkan karena keputusan satu atau lebih peminatan belum ditetapkan (OD-015).',
        };
    }

    /**
     * @return list<string>
     */
    public function peminatan(User $user): array
    {
        return $this->peminatanResolver->resolve($user);
    }

    /**
     * @return array{
     *     peminatan: list<string>,
     *     peminatan_options: list<string>,
     *     selection_mode: string|null,
     *     selection_available: bool,
     *     profile_complete: bool,
     *     selection_note: string
     * }
     */
    public function profile(User $user): array
    {
        $peminatan = $this->peminatan($user);

        return [
            'peminatan' => $peminatan,
            'peminatan_options' => $this->options(),
            'selection_mode' => $this->mode(),
            'selection_available' => $this->selectionAvailable(),
            'profile_complete' => $peminatan !== [],
            'selection_note' => $this->note(),
        ];
    }

    /**
     * @param  list<string>  $peminatan
     * @return array{
     *     peminatan: list<string>,
     *     peminatan_options: list<string>,
     *     selection_mode: string|null,
     *     selection_available: bool,
     *     profile_complete: bool,
     *     selection_note: string
     * }
     */
    public function update(User $user, array $peminatan): array
    {
        $values = array_values(array_unique($peminatan));

        DB::transaction(function () use ($user, $values): void {
            $user->studentPeminatan()->delete();

            $user->studentPeminatan()->createMany(
                array_map(
                    fn (string $value): array => ['peminatan' => $value],
                    $values,
                ),
            );
        });

        return $this->profile($user->fresh());
    }
}
