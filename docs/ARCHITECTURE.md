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
   - Direncanakan menyediakan proses K-Means dan SAW.
   - Dipanggil backend melalui API internal.

4. Database
   - PostgreSQL.
   - Menyimpan data aplikasi sesuai rancangan skema.

## Alur Umum

```text
Frontend -> Backend API -> Database

Untuk proses rekomendasi:
Frontend -> Backend API -> Algorithm Service
                         -> Database
```

Backend bertanggung jawab atas validasi permintaan dan pengelolaan data.
Algorithm Service menjalankan perhitungan SPK sesuai kontrak input dan output
yang ditetapkan.

## Alur autentikasi yang sudah diimplementasikan

```text
Frontend                         Backend (Laravel + Sanctum)
   | POST /api/auth/login  ------------->  validasi kredensial
   | <------------- token Bearer + user    buat personal access token
   |
   | GET /api/auth/me      ------------->  auth:sanctum
   | <------------- user (id, name, email, role)
   |
   | POST /api/auth/logout ------------->  auth:sanctum
   | <------------- sukses                  cabut token aktif
```

- Token disimpan di `sessionStorage` oleh frontend.
- Setiap endpoint terlindungi memakai `auth:sanctum`.
- Middleware `role` memeriksa role pengguna di backend. Frontend hanya
  menyesuaikan tampilan; backend tetap menjadi sumber kebenaran otorisasi.
- Login dibatasi 5 percobaan per menit.
- Respons login dan profil memakai kontrak field yang sama:
  `id`, `name`, `email`, `role`.
- Tidak ada akun default pada seeder. Sumber dan mekanisme pembuatan akun
  menunggu OD-004 dan OD-005.

## Status implementasi per komponen

| Komponen | Status | Catatan |
|---|---|---|
| Frontend shell | Terimplementasi dan terverifikasi | Layout, navigasi, halaman login, ringkasan, profil; `npm run lint` dan `npm run build` lulus |
| Frontend auth | Terimplementasi dan terverifikasi | Pemulihan sesi, redirect, penanganan 401, logout |
| Backend auth | Terimplementasi dan terverifikasi | Sanctum, rate limit, test fitur |
| Backend role middleware | Terimplementasi sebagian | `admin`, `mahasiswa`, `dpm`; matriks izin belum final (OD-001–OD-003) |
| Database | Terimplementasi sebagian | Tabel `users`, token Sanctum, cache, jobs; tabel bisnis belum ada |
| Algorithm Service | Belum diimplementasikan | Folder `algorithm/` masih kosong |
| Modul bisnis | Belum diimplementasikan | Terblokir OD-005–OD-026 |
| Notifikasi/laporan/integrasi | Belum diimplementasikan | Terblokir OD-029–OD-031 |

## Keputusan arsitektur yang masih terbuka

- Apakah layanan algoritma tetap terpisah?
- Apa kontrak input/output backend–algorithm service?
- Apa format data antara frontend dan backend?
- Bagaimana error, timeout, dan retry antar layanan ditangani?
- Apa strategi caching dan performa?

Keputusan tersebut belum diambil. Lihat `docs/PRD.md` Bagian 8 dan
`docs/REQUIREMENTS-TRACEABILITY.md` Bagian 16.

## Catatan keamanan

- File `.env` tidak di-commit; nilai rahasia tidak boleh masuk repository.
- Token Bearer tidak memakai cookie, sehingga CORS tidak mengaktifkan
  kredensial.
- Masa berlaku token, audit trail, retensi data, dan kebijakan perlindungan
  data belum ditetapkan (OD-027, OD-028).
- Mitra tidak memiliki akun aplikasi sesuai D-003; tidak ada autentikasi mitra
  yang boleh ditambahkan tanpa keputusan baru.

## Batasan dokumen

Dokumen ini mencatat arsitektur aktual dan rancangan yang sudah ada. Detail
proses, entitas, kriteria, atribut K-Means, bobot SAW, dan hak akses harus
divalidasi terhadap BPMN serta kebutuhan sistem sebelum implementasi.
