<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Profil peminatan mahasiswa
    |--------------------------------------------------------------------------
    |
    | Label DTA, PSI, dan SIA sudah ditetapkan. Kardinalitas pilihan (tepat
    | satu atau lebih dari satu) dan aturan perubahan belum ditetapkan
    | (OD-015). Karena itu mode penyimpanan sengaja kosong sampai keputusan
    | produk tersedia. Isi hanya dengan "single" atau "multiple".
    |
    */

    'peminatan' => [
        'options' => ['DTA', 'PSI', 'SIA'],
        'mode' => env('STUDENT_PEMINATAN_MODE'),
    ],

];
