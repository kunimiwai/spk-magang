# Arsitektur Sistem SPK Magang

## Komponen

1. Frontend
   - React, TypeScript, dan Vite.
   - Menyediakan antarmuka pengguna.
   - Mengakses backend melalui REST API.

2. Backend
   - Laravel REST API.
   - Menangani autentikasi, validasi, aturan bisnis,
     dan akses database.

3. Algorithm Service
   - Python dan FastAPI.
   - Menyediakan proses K-Means dan SAW.
   - Dipanggil backend melalui API internal.

4. Database
   - PostgreSQL.
   - Menyimpan data aplikasi sesuai rancangan skema.

## Alur Umum

Frontend -> Backend API -> Database

Untuk proses rekomendasi:

Frontend -> Backend API -> Algorithm Service
                         -> Database

Backend bertanggung jawab atas validasi permintaan dan
pengelolaan data. Algorithm Service menjalankan perhitungan
SPK sesuai kontrak input dan output yang ditetapkan.

## Catatan

Dokumen ini merupakan rancangan awal. Detail proses, entitas,
kriteria, atribut K-Means, bobot SAW, dan hak akses harus
divalidasi terhadap BPMN serta kebutuhan sistem sebelum implementasi.
