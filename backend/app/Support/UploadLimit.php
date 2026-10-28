<?php

namespace App\Support;

final class UploadLimit
{
    /**
     * Resolve the effective acceptance-letter upload limit in kilobytes.
     *
     * The application limit is authoritative only when the PHP runtime can
     * actually accept the file. PHP's upload_max_filesize and post_max_size
     * are lower bounds that cannot be overridden from application code.
     */
    public static function acceptanceLetterMaxKb(): int
    {
        return self::effectiveMaxKb(
            (int) config('internship.acceptance_letter.max_size_kb'),
            self::iniSizeKb('upload_max_filesize'),
            self::iniSizeKb('post_max_size'),
        );
    }

    /**
     * Return the smallest positive limit. Unknown or unlimited values are
     * ignored; the result is never below one kilobyte.
     */
    public static function effectiveMaxKb(
        int $configuredKb,
        ?int $uploadMaxKb,
        ?int $postMaxKb,
    ): int {
        $limits = array_filter(
            [$configuredKb, $uploadMaxKb, $postMaxKb],
            static fn (?int $limit): bool => $limit !== null && $limit > 0,
        );

        if ($limits === []) {
            return 1;
        }

        return max(1, min($limits));
    }

    /**
     * Read a PHP ini size value and convert it to kilobytes.
     */
    public static function iniSizeKb(string $key): ?int
    {
        return self::parseSizeKb(ini_get($key));
    }

    /**
     * Parse a PHP shorthand size such as "2M", "512K", or "1G" into KB.
     * A missing, zero, negative, or malformed value is treated as unknown.
     */
    public static function parseSizeKb(string|false|null $value): ?int
    {
        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        if ($value === '' || $value === '-1') {
            return null;
        }

        if (preg_match('/^(\d+)([KMG]?)$/i', $value, $matches) !== 1) {
            return null;
        }

        $number = (int) $matches[1];

        if ($number <= 0) {
            return null;
        }

        return match (strtoupper($matches[2])) {
            'G' => $number * 1024 * 1024,
            'M' => $number * 1024,
            'K' => $number,
            default => (int) ceil($number / 1024),
        };
    }
}
