<?php

namespace App\Support;

final class AcceptanceLetterRules
{
    /**
     * Safe fallback when the configured allowlist is missing, malformed, or
     * empty. An empty Laravel `File::types()` list would otherwise remove the
     * MIME constraint entirely, so the server must fail closed to these types.
     *
     * @var list<string>
     */
    public const DEFAULT_ALLOWED_MIME_TYPES = [
        'application/pdf',
        'image/jpeg',
        'image/png',
    ];

    /**
     * @return list<string>
     */
    public static function allowedMimeTypes(): array
    {
        $configured = config(
            'internship.acceptance_letter.allowed_mime_types',
            self::DEFAULT_ALLOWED_MIME_TYPES,
        );

        if (! is_array($configured)) {
            return self::DEFAULT_ALLOWED_MIME_TYPES;
        }

        $mimeTypes = [];

        foreach ($configured as $mimeType) {
            if (! is_string($mimeType)) {
                continue;
            }

            $mimeType = trim($mimeType);

            if ($mimeType !== '') {
                $mimeTypes[] = $mimeType;
            }
        }

        return $mimeTypes === []
            ? self::DEFAULT_ALLOWED_MIME_TYPES
            : array_values(array_unique($mimeTypes));
    }
}
