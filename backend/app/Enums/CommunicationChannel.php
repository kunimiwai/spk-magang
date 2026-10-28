<?php

namespace App\Enums;

/**
 * Kanal komunikasi manual yang diizinkan oleh D-003.
 *
 * WhatsApp tidak dimasukkan sampai cakupannya diputuskan (OD-020).
 */
enum CommunicationChannel: string
{
    case Email = 'email';
    case Surat = 'surat';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
