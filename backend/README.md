# SPK Magang — Backend API

Backend Laravel 13 untuk SPK Rekomendasi Tempat Magang. Autentikasi memakai
Laravel Sanctum dengan token Bearer.

## Persyaratan

- PHP 8.3 atau lebih baru
- Composer
- PostgreSQL 17 (lihat `docker-compose.yml` di root repository)

## Setup lokal

```bash
cp .env.example .env
# Sesuaikan DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, dan DB_PASSWORD.
# Pastikan CORS_ALLOWED_ORIGINS memuat origin frontend yang dipakai.
# Jangan commit file .env.
composer install
php artisan key:generate
php artisan migrate
php artisan serve
```

`php artisan db:seed` tidak membuat akun default. Sumber dan mekanisme
pembuatan akun masih menunggu OD-004 dan OD-005 pada `docs/PRD.md`.

## Endpoint

| Method | Endpoint | Akses |
|---|---|---|
| GET | `/api/health` | Publik |
| POST | `/api/auth/login` | Publik, throttle 5/menit |
| GET | `/api/auth/me` | `auth:sanctum` |
| POST | `/api/auth/logout` | `auth:sanctum` |
| GET | `/api/admin/access-check` | `auth:sanctum` + role `admin` |
| GET | `/api/admin/partners` | `auth:sanctum` + role `admin` |
| POST | `/api/admin/partners` | `auth:sanctum` + role `admin` |
| GET | `/api/admin/partners/{partner}` | `auth:sanctum` + role `admin` |
| PUT/PATCH | `/api/admin/partners/{partner}` | `auth:sanctum` + role `admin` |
| DELETE | `/api/admin/partners/{partner}` | `auth:sanctum` + role `admin` |
| GET | `/api/mahasiswa/access-check` | `auth:sanctum` + role `mahasiswa` |
| GET | `/api/dpm/access-check` | `auth:sanctum` + role `dpm` |

Respons login dan profil hanya memuat `id`, `name`, `email`, dan `role`.
Endpoint `access-check` adalah verifikasi middleware, bukan matriks izin bisnis.

## Testing dan format

```bash
php artisan test --compact
./vendor/bin/pint --test
```

Test menggunakan SQLite in-memory sesuai `phpunit.xml`, sehingga tidak
mengubah database PostgreSQL pengembangan.

CORS hanya mengizinkan origin dari `CORS_ALLOWED_ORIGINS`; jangan memakai
wildcard origin. Feature test CORS mencakup origin yang diizinkan, preflight,
dan origin yang ditolak.

## Status

Autentikasi, otorisasi dasar, health check, dan CRUD mitra magang tersedia.
CRUD mitra memakai atribut minimum (`name`, `address`, `contact`, `email`,
`description`) karena atribut penilaian, pemetaan peminatan, status, kuota, dan
kewenangan Prodi masih menunggu keputusan produk pada `docs/PRD.md` Bagian 8.
Modul kriteria penilaian sudah diaudit tetapi belum diimplementasikan karena
daftar kriteria, bobot, benefit/cost, skala, dan normalisasi belum ditetapkan.
Rincian ada di `docs/CRITERIA-GAP-ANALYSIS.md`. Modul mahasiswa, pengajuan,
dokumen, DPM, K-Means, SAW, dan rekomendasi belum diimplementasikan.
