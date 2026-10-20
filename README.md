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
| UI mitra admin | Terimplementasi dan terverifikasi | Halaman `/mitra` terhubung ke API CRUD, role `admin`, pagination, dialog, serta loading/error/empty/success state; lolos lint, build, dan E2E browser desktop/tablet/ponsel |
| Otorisasi role | Terimplementasi sebagian | Middleware `role` tersedia untuk `admin`, `mahasiswa`, dan `dpm`; matriks izin lengkap menunggu OD-001–OD-003 |
| Role Prodi | Baru pada tingkat label | D-001 menetapkan Prodi sebagai role terpisah; kewenangan dan endpoint Prodi belum diputuskan |
| Skema database | Terimplementasi sebagian | Tabel autentikasi, pendukung Laravel, dan `partners`; tabel bisnis lain belum dibuat |
| Data mitra | CRUD admin terimplementasi dan terverifikasi | Endpoint `/api/admin/partners`; atribut lanjutan, status, peminatan, dan kewenangan Prodi menunggu OD-001–OD-003, OD-009, OD-012, dan OD-015 |
| Data mahasiswa | Belum diimplementasikan | Menunggu OD-005, OD-007–OD-009, dan keputusan atribut data |
| Kriteria penilaian | Audit selesai; implementasi ditunda | Daftar kriteria, bobot, benefit/cost, skala, dan normalisasi belum diputuskan; lihat `docs/CRITERIA-GAP-ANALYSIS.md` |
| K-Means/SAW/rekomendasi | Belum diimplementasikan | `algorithm/` masih kosong; menunggu OD-009–OD-015 |
| Pengajuan, dokumen, DPM | Belum diimplementasikan | Menunggu OD-016–OD-026 |
| Testing | Terimplementasi untuk autentikasi, otorisasi, mitra, dan helper frontend | Backend PHPUnit dan Pint; frontend ESLint, unit test Node, build, serta verifikasi browser ad hoc desktop/tablet/ponsel; belum ada test suite E2E otomatis |

Rincian kebutuhan dan keputusan terbuka ada di
[`docs/PRD.md`](docs/PRD.md) dan
[`docs/REQUIREMENTS-TRACEABILITY.md`](docs/REQUIREMENTS-TRACEABILITY.md).
Modul bisnis lain tidak boleh diimplementasikan dengan mengarang aturan yang
belum diputuskan. CRUD mitra hanya memakai atribut minimum yang eksplisit pada
tugas implementasi; atribut penilaian dan aturan bisnis lanjutan tetap terbuka.

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

3. Pastikan `CORS_ALLOWED_ORIGINS` di `backend/.env` memuat origin frontend.
   Nilai bawaan contoh adalah `http://localhost:5173,http://127.0.0.1:5173`.
   Jangan memakai wildcard origin `*`; tambahkan origin produksi secara
   eksplisit saat deployment.

4. Jalankan PostgreSQL.

   ```bash
   docker compose up -d postgres
   # atau: podman-compose up -d postgres
   ```

5. Siapkan backend.

   ```bash
   cd backend
   composer install
   php artisan key:generate
   php artisan migrate
   php artisan serve
   ```

6. Siapkan frontend pada terminal lain.

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
| GET | `/api/admin/partners` | Role `admin` | Daftar mitra dengan pagination |
| POST | `/api/admin/partners` | Role `admin` | Tambah mitra |
| GET | `/api/admin/partners/{partner}` | Role `admin` | Detail mitra |
| PUT/PATCH | `/api/admin/partners/{partner}` | Role `admin` | Ubah mitra |
| DELETE | `/api/admin/partners/{partner}` | Role `admin` | Hapus mitra |
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
npm test
npm run lint
npm run build
```

Verifikasi browser untuk login admin, CRUD mitra, pagination, dan pembatasan
role mahasiswa tercatat di
[`docs/VERIFICATION.md`](docs/VERIFICATION.md). Audit keamanan dan
responsivitas lanjutan, termasuk viewport 320×568, 390×844, 768×1024, dan
1280×900, tercatat di
[`docs/SECURITY-RESPONSIVENESS-AUDIT.md`](docs/SECURITY-RESPONSIVENESS-AUDIT.md).
Pengujian tersebut memakai database SQLite sementara dan tidak mengubah
database pengembangan.

## Dokumentasi

- [`docs/PRD.md`](docs/PRD.md) — kebutuhan produk, keputusan D-001–D-004, dan OD-001–OD-031
- [`docs/BPMN-ANALYSIS.md`](docs/BPMN-ANALYSIS.md) — analisis BPMN
- [`docs/REQUIREMENTS-TRACEABILITY.md`](docs/REQUIREMENTS-TRACEABILITY.md) — traceability kebutuhan
- [`docs/CRITERIA-GAP-ANALYSIS.md`](docs/CRITERIA-GAP-ANALYSIS.md) — audit dan gap modul kriteria penilaian
- [`docs/STUDENT-FLOW-GAP-ANALYSIS.md`](docs/STUDENT-FLOW-GAP-ANALYSIS.md) — gap alur mahasiswa, peminatan, nilai, dan pengajuan
- [`docs/VERIFICATION.md`](docs/VERIFICATION.md) — hasil verifikasi browser login admin, CRUD mitra, pagination, dan role guard
- [`docs/SECURITY-RESPONSIVENESS-AUDIT.md`](docs/SECURITY-RESPONSIVENESS-AUDIT.md) — audit keamanan dan responsivitas fondasi aplikasi
- [`docs/UI-FOUNDATION.md`](docs/UI-FOUNDATION.md) — token dan komponen UI
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — arsitektur dan status implementasi
- [`docs/bpmn/BPMN.pdf`](docs/bpmn/BPMN.pdf) — sumber proses bisnis
- [`design-system/spk-magang/MASTER.md`](design-system/spk-magang/MASTER.md) — arah desain

## Keamanan

- File `.env` tidak di-commit; gunakan `.env.example` untuk nama variabel.
- Tidak ada akun default dengan password yang diketahui pada seeder.
- Otorisasi ditegakkan di backend melalui `auth:sanctum` dan middleware role.
  Penyembunyian menu di frontend bukan kontrol keamanan.
- CORS hanya mengizinkan origin frontend yang terdaftar di
  `CORS_ALLOWED_ORIGINS`; wildcard origin tidak dipakai. Set origin produksi
  secara eksplisit.
- Token disimpan di `sessionStorage` pada implementasi frontend saat ini.
  Kebijakan masa berlaku token, audit trail, dan perlindungan data masih
  menunggu OD-027 dan OD-028.
- Deployment produksi wajib memakai HTTPS, `APP_DEBUG=false`, cookie sesi
  `Secure`, dan konfigurasi header server yang tidak membocorkan versi PHP.
- Mitra tidak memiliki akun aplikasi sesuai D-003.
