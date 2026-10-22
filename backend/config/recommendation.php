<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Aktivasi pipeline rekomendasi
    |--------------------------------------------------------------------------
    |
    | Rekomendasi tetap nonaktif sampai pemilik sistem mengaktifkannya secara
    | eksplisit. Flag ini adalah kontrol operasional, bukan keputusan bisnis:
    | mengaktifkannya tidak menggantikan keputusan OD-007 sampai OD-015.
    | Semua pemeriksaan lain tetap wajib lulus sebelum ranking dibuat.
    |
    */

    'enabled' => (bool) env('RECOMMENDATION_ENABLED', false),

    /*
    |--------------------------------------------------------------------------
    | Parameter pipeline rekomendasi
    |--------------------------------------------------------------------------
    |
    | Nilai bisnis di bawah ini sengaja kosong sampai keputusan OD-009 sampai
    | OD-015 ditetapkan. Jangan mengisi nilai produksi berdasarkan asumsi.
    |
    | - cluster_count: jumlah cluster K-Means.
    | - random_seed: seed K-Means agar hasil dapat direproduksi.
    | - feature_criterion_ids: ID kriteria yang disepakati sebagai fitur
    |   K-Means. Daftar ini harus diisi setelah atribut K-Means diputuskan.
    | - peminatan_cluster_map: pemetaan peminatan ke indeks cluster generik,
    |   misalnya ['DTA' => [0, 1]]. Pemetaan ini belum ditetapkan (OD-011/
    |   OD-015) dan hanya berdampak pada label analitik: proposal menetapkan
    |   label cluster bukan filter wajib sebelum SAW, sehingga nilai kosong
    |   di sini tidak memblokir ranking rekomendasi.
    |
    */

    'kmeans' => [
        'cluster_count' => env('RECOMMENDATION_KMEANS_CLUSTERS'),
        'random_seed' => env('RECOMMENDATION_KMEANS_RANDOM_SEED'),
        'feature_criterion_ids' => [],
    ],

    'peminatan_cluster_map' => [],

    /*
    |--------------------------------------------------------------------------
    | Kebijakan ranking
    |--------------------------------------------------------------------------
    |
    | Jumlah rekomendasi yang ditampilkan belum ditetapkan (OD-014). Nilai
    | kosong berarti keputusan belum tersedia dan ranking tidak boleh dibuat.
    | Urutan skor mengikuti keluaran generik SAW; aturan tie-break resmi tetap
    | menunggu OD-014 dan tidak ditambahkan di sini.
    |
    */

    'ranking' => [
        'limit' => env('RECOMMENDATION_RANKING_LIMIT'),
    ],

];
