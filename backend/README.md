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

## Status

Hanya autentikasi, otorisasi dasar, dan health check yang tersedia. Modul
mahasiswa, mitra, pengajuan, dokumen, DPM, K-Means, SAW, dan rekomendasi belum
diimplementasikan karena keputusan produk pada `docs/PRD.md` Bagian 8 masih
terbuka.
