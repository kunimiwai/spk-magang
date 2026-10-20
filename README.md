# SPK Rekomendasi Tempat Magang

Sistem Pendukung Keputusan (SPK) untuk membantu proses rekomendasi
tempat magang berdasarkan pengelompokan dan penilaian alternatif.
Proyek ini dikembangkan bertahap dari repository yang sudah ada.

## Teknologi

- Frontend: React 19, TypeScript, Vite, React Router, Axios, Tailwind CSS v4
- Backend: Laravel 13, Laravel Sanctum, PostgreSQL 17
- Algorithm Service: Python dan FastAPI (belum diimplementasikan)
- Metode: K-Means dan Simple Additive Weighting (SAW) (belum diimplementasikan)
- Lingkungan pengembangan: Docker Compose atau Podman Compose

## Status implementasi

Status per 20 Oktober 2026. Status ini membedakan implementasi yang sudah
diverifikasi dari pekerjaan yang masih berupa desain atau terblokir keputusan
produk.

| Area | Status | Keterangan |
|---|---|---|
| Autentikasi backend | Terimplementasi dan terverifikasi | Login token Sanctum, profil, logout, rate limit login, dan test fitur |
| Autentikasi frontend | Terimplementasi dan terverifikasi | Login, pemulihan sesi, logout, route terlindungi, halaman profil; lolos lint dan build |
| Otorisasi role | Terimplementasi sebagian | Middleware `role` tersedia untuk `admin`, `mahasiswa`, dan `dpm`; matriks izin lengkap menunggu OD-001–OD-003 |
| Role Prodi | Baru pada tingkat label | D-001 menetapkan Prodi sebagai role terpisah; kewenangan dan endpoint Prodi belum diputuskan |
| Skema database | Terimplementasi sebagian | Hanya tabel autentikasi dan pendukung Laravel; tabel bisnis belum dibuat |
| Data mahasiswa/mitra | Belum diimplementasikan | Menunggu OD-005, OD-007–OD-009, dan keputusan atribut data |
| K-Means/SAW/rekomendasi | Belum diimplementasikan | `algorithm/` masih kosong; menunggu OD-009–OD-015 |
| Pengajuan, dokumen, mitra, DPM | Belum diimplementasikan | Menunggu OD-016–OD-026 |
| Testing | Terimplementasi untuk autentikasi/otorisasi | Backend PHPUnit, Pint, frontend ESLint dan build; belum ada test runner frontend |

Rincian kebutuhan dan keputusan terbuka ada di
[`docs/PRD.md`](docs/PRD.md) dan
[`docs/REQUIREMENTS-TRACEABILITY.md`](docs/REQUIREMENTS-TRACEABILITY.md).
Modul bisnis tidak boleh diimplementasikan dengan mengarang aturan yang belum
diputuskan.

## Struktur repository

```text
spk-magang/
├── frontend/          # Aplikasi React
├── backend/           # Laravel REST API
├── algorithm/         # Layanan K-Means dan SAW (belum diisi)
├── docs/              # PRD, BPMN, traceability, arsitektur, fondasi UI
├── infra/
│   └── postgres/      # Konfigurasi database
├── .env.example
├── docker-compose.yml
├── CONTRIBUTING.md
└── README.md
```

## Prasyarat

- Git
- Node.js dan npm
- PHP 8.3+ dan Composer
- PostgreSQL 17 melalui Docker/Podman, atau database PostgreSQL lain
- Python dan pip (untuk layanan algoritma pada tahap berikutnya)

## Menjalankan secara lokal

1. Salin konfigurasi contoh. Jangan commit file `.env`.

   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

2. Sesuaikan `POSTGRES_PASSWORD` di `.env` dan `DB_PASSWORD` di
   `backend/.env` dengan nilai lokal yang sama. Gunakan nilai acak; jangan
   memakai kredensial produksi.

3. Jalankan PostgreSQL.

   ```bash
   docker compose up -d postgres
   # atau: podman-compose up -d postgres
   ```

4. Siapkan backend.

   ```bash
   cd backend
   composer install
   php artisan key:generate
   php artisan migrate
   php artisan serve
   ```

5. Siapkan frontend pada terminal lain.

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Backend berjalan di `http://localhost:8000` dan frontend di
`http://localhost:5173` secara default.

**Akun awal tidak dibuat otomatis.** Sumber akun dan mekanisme pembuatan akun
mahasiswa, Admin, Prodi, dan DPM masih menunggu OD-004 dan OD-005. Untuk
pengujian lokal, buat akun uji secara eksplisit melalui factory/tinker dan
jangan gunakan kredensial contoh di lingkungan nyata.

## Endpoint yang tersedia

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| GET | `/api/health` | Publik | Status layanan backend |
| POST | `/api/auth/login` | Publik | Login; dibatasi 5 percobaan per menit |
| GET | `/api/auth/me` | Bearer token | Profil pengguna aktif |
| POST | `/api/auth/logout` | Bearer token | Mencabut token aktif |
| GET | `/api/admin/access-check` | Role `admin` | Pemeriksaan middleware role |
| GET | `/api/mahasiswa/access-check` | Role `mahasiswa` | Pemeriksaan middleware role |
| GET | `/api/dpm/access-check` | Role `dpm` | Pemeriksaan middleware role |

Endpoint `access-check` adalah alat verifikasi teknis, bukan definisi matriks
izin bisnis. Kewenangan tiap role tetap menunggu keputusan produk.

## Verifikasi

```bash
# Backend
cd backend
php artisan test --compact
./vendor/bin/pint --test

# Frontend
cd frontend
npm run lint
npm run build
```

## Dokumentasi

- [`docs/PRD.md`](docs/PRD.md) — kebutuhan produk, keputusan D-001–D-004, dan OD-001–OD-031
- [`docs/BPMN-ANALYSIS.md`](docs/BPMN-ANALYSIS.md) — analisis BPMN
- [`docs/REQUIREMENTS-TRACEABILITY.md`](docs/REQUIREMENTS-TRACEABILITY.md) — traceability kebutuhan
- [`docs/UI-FOUNDATION.md`](docs/UI-FOUNDATION.md) — token dan komponen UI
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — arsitektur dan status implementasi
- [`docs/bpmn/BPMN.pdf`](docs/bpmn/BPMN.pdf) — sumber proses bisnis
- [`design-system/spk-magang/MASTER.md`](design-system/spk-magang/MASTER.md) — arah desain

## Keamanan

- File `.env` tidak di-commit; gunakan `.env.example` untuk nama variabel.
- Tidak ada akun default dengan password yang diketahui pada seeder.
- Otorisasi ditegakkan di backend melalui `auth:sanctum` dan middleware role.
  Penyembunyian menu di frontend bukan kontrol keamanan.
- Token disimpan di `sessionStorage` pada implementasi frontend saat ini.
  Kebijakan masa berlaku token, audit trail, dan perlindungan data masih
  menunggu OD-027 dan OD-028.
- Mitra tidak memiliki akun aplikasi sesuai D-003.
