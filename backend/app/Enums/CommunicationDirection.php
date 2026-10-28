<?php

namespace App\Enums;

/**
 * Arah komunikasi dengan mitra.
 *
 * - `Outbound` mencatat pengajuan yang sudah dikirim Admin/Prodi kepada
 *   mitra melalui email atau surat.
 * - `Inbound` mencatat balasan mitra yang diterima secara manual.
 *
 * Pencatatan ini tidak mengubah status pengajuan secara otomatis. Sumber
 * kebenaran status hasil seleksi masih menunggu OD-021.
 */
enum CommunicationDirection: string
{
    case Outbound = 'outbound';
    case Inbound = 'inbound';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
