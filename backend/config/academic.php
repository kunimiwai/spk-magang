<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Nilai akademik mahasiswa
    |--------------------------------------------------------------------------
    |
    | Skala nilai dan ambang kelulusan belum ditetapkan (OD-007/OD-008).
    | Batas di bawah hanya batas penyimpanan teknis, bukan skala penilaian
    | bisnis. Nilai kosong disimpan sebagai tidak ada baris, bukan angka nol.
    |
    */

    'grade' => [
        'min' => -999999.999999,
        'max' => 999999.999999,
    ],

    /*
    |--------------------------------------------------------------------------
    | Aturan prasyarat
    |--------------------------------------------------------------------------
    |
    | Format setiap aturan: ['course_id' => int, 'minimum_score' => float].
    | Daftar ini sengaja kosong sampai sumber nilai, mata kuliah prasyarat,
    | dan ambang kelulusan diputuskan (OD-007/OD-008). Jangan mengisi nilai
    | produksi berdasarkan asumsi.
    |
    */

    'prerequisites' => [
        'rules' => [],
        'note' => 'Aturan mata kuliah prasyarat dan ambang kelulusan belum dikonfigurasi (OD-007/OD-008).',
    ],

];
