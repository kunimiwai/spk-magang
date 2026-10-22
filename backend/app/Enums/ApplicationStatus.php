<?php

namespace App\Enums;

/**
 * Status pengajuan magang yang benar-benar dinyatakan BPMN.
 *
 * - `Menunggu` mewakili aktivitas BPMN "Menunggu hasil seleksi mitra" dan
 *   dipakai sebagai status awal saat pengajuan disimpan.
 * - `Diterima` dan `Ditolak` adalah satu-satunya hasil seleksi yang eksplisit
 *   di BPMN dan diinput Admin/Prodi.
 *
 * Status antara (misalnya verifikasi dokumen atau penerusan ke mitra),
 * pembatalan, pengunduran diri, dan aturan reversal belum ditetapkan
 * (OD-016/OD-017/OD-018/OD-021) sehingga sengaja tidak dibuat.
 */
enum ApplicationStatus: string
{
    case Menunggu = 'menunggu';
    case Diterima = 'diterima';
    case Ditolak = 'ditolak';

    /**
     * Nilai keputusan yang boleh dikirim klien melalui endpoint status.
     *
     * @return list<string>
     */
    public static function decisionValues(): array
    {
        return [self::Diterima->value, self::Ditolak->value];
    }
}
