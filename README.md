# SPK Rekomendasi Tempat Magang

Sistem Pendukung Keputusan (SPK) untuk membantu proses rekomendasi
tempat magang berdasarkan pengelompokan dan penilaian alternatif.
Proyek ini dikembangkan bertahap dari repository yang sudah ada.

## Teknologi

- Frontend: React 19, TypeScript, Vite, React Router, Axios, Tailwind CSS v4
- Backend: Laravel 13, Laravel Sanctum, PostgreSQL 17
- Algorithm Service: Python, FastAPI, dan Uvicorn (layanan generik dengan klien HTTP Laravel; parameter bisnis belum ditetapkan)
- Metode: K-Means dan Simple Additive Weighting (SAW) (fungsi generik dan integrasi teknis tersedia; pipeline rekomendasi resmi menunggu keputusan bisnis)
- Lingkungan pengembangan: Docker Compose atau Podman Compose

## Status implementasi

Status per 23 Oktober 2026. Status ini membedakan implementasi yang sudah
diverifikasi dari pekerjaan yang masih berupa desain atau terblokir keputusan
produk.

| Area | Status | Keterangan |
|---|---|---|
| Autentikasi backend | Terimplementasi dan terverifikasi | Login token Sanctum, profil, logout, rate limit login, dan test fitur |
| Autentikasi frontend | Terimplementasi dan terverifikasi | Login, pemulihan sesi, logout, route terlindungi, redirect login yang memeriksa role tujuan, halaman profil; lolos Vitest, lint, dan build |
| UI mitra admin | Terimplementasi dan terverifikasi | Halaman `/mitra` terhubung ke API CRUD, role `admin`, pagination, dialog, serta loading/error/empty/success state; lolos lint, build, dan E2E browser desktop/tablet/ponsel. Pesan konflik 409 dari backend kini ditampilkan apa adanya, bukan pesan generik. Perbaikan yang sama diterapkan pada hapus mata kuliah dan kriteria |
| Dashboard per role | Terimplementasi dan terverifikasi otomatis | `/` mengarahkan setiap role ke dashboard yang membaca data backend: Admin/Prodi ke `/admin`, Mahasiswa ke `/mahasiswa/dashboard`, dan DPM ke `/dpm`. Dashboard Admin/Prodi menampilkan hitungan pengajuan, notifikasi pengajuan menunggu, data terbaru, dan kesiapan data; dashboard DPM menampilkan mahasiswa bimbingan serta status surat. Tidak ada data dummy |
| Katalog mitra mahasiswa | Terimplementasi dan terverifikasi otomatis | `/mahasiswa/mitra` membaca `GET /api/mahasiswa/partners` dan menampilkan nama, deskripsi, email, kontak, serta alamat mitra. Tautan pengajuan memilih mitra tersebut pada form. Data katalog bukan ranking rekomendasi |
| Otorisasi role | Terimplementasi sebagian | Middleware `role` tersedia untuk `admin`, `mahasiswa`, `prodi`, dan `dpm`; matriks izin lengkap menunggu OD-001–OD-003 |
| Role Prodi | Terimplementasi untuk modul kriteria, master mata kuliah, keputusan pengajuan, dan penempatan DPM | Prodi dapat mengelola kriteria, nilai mitra, master mata kuliah, mencatat keputusan pengajuan, serta menetapkan DPM untuk pengajuan yang sudah diterima sesuai lane BPMN Admin/Prodi; pembagian kewenangan rinci tetap menunggu OD-001–OD-003 |
| Skema database | Terimplementasi sebagian | Tabel autentikasi, pendukung Laravel, `partners`, `criteria`, `criterion_scores`, `student_peminatan`, `courses`, `student_grades`, `internship_applications`, `acceptance_letters`, `dpm_placements`, dan `application_communications`; tabel bisnis lain belum dibuat |
| Data mitra | CRUD admin terimplementasi dan terverifikasi | Endpoint `/api/admin/partners`; atribut lanjutan, status, peminatan, dan kewenangan Prodi menunggu OD-001–OD-003, OD-009, OD-012, dan OD-015 |
| Data mahasiswa | Profil peminatan terimplementasi; atribut akademik lain belum | Dashboard `/mahasiswa/dashboard` dan halaman `/mahasiswa` memuat peminatan tersimpan dari `GET /api/mahasiswa/profile`. `PUT /api/mahasiswa/profile` hanya mengubah peminatan akun yang sedang login dan menolak `user_id`. Penulisan peminatan tetap dinonaktifkan sampai mode `single`/`multiple` ditetapkan secara eksplisit (OD-015). NIM, program studi, fakultas, angkatan, status magang, dan atribut akademik lain tidak dikarang dan menunggu OD-005–OD-008 |
| Nilai akademik | Struktur, API, dan UI terimplementasi; aturan prasyarat belum ditetapkan | Master mata kuliah `courses` dapat dikelola role `admin`/`prodi`. Mahasiswa hanya dapat membaca dan mengganti nilai milik akun sendiri melalui `GET/PUT /api/mahasiswa/grades`; `user_id` ditolak, nilai kosong tidak diubah menjadi nol, dan unique constraint mencegah duplikasi mata kuliah. Daftar mata kuliah prasyarat, skala nilai, sumber nilai, ambang kelulusan, dan aturan validasi resmi tetap menunggu OD-007/OD-008 |
| Kriteria penilaian | Struktur dan UI terimplementasi; data resmi belum ditetapkan | Master kriteria (nama, deskripsi, tipe benefit/cost, bobot), nilai per mitra dengan unique constraint, endpoint CRUD role `admin`/`prodi`, dan halaman `/kriteria`; tidak ada daftar kriteria, bobot awal, skala, normalisasi, atau data produksi bawaan karena OD-012–OD-015 belum diputuskan |
| K-Means/SAW/rekomendasi | Integrasi teknis terimplementasi; rekomendasi resmi belum aktif | Klien Laravel memanggil FastAPI dari URL environment dengan timeout dan validasi respons. Endpoint `GET /api/mahasiswa/recommendations` membaca peminatan dari database dan memeriksa aktivasi eksplisit, kriteria, kelengkapan nilai mitra, aturan prasyarat, kebijakan ranking, serta layanan sebelum membuat ranking. K-Means dijalankan sebagai analitik profil mitra dan label cluster **tidak** menyaring kandidat SAW; pemeriksaan konfigurasi K-Means dan label cluster berkategori `analysis` sehingga tidak memblokir ranking. Setiap pemeriksaan diberi kategori `technical`, `data`, `decision`, atau `analysis`. Ranking SAW dihitung dari seluruh mitra dengan nilai lengkap dan dibatasi `RECOMMENDATION_RANKING_LIMIT`; tidak ada penyimpanan hasil. `RECOMMENDATION_ENABLED` bernilai `false` secara default. Peminatan ganda tetap memblokir ranking, dan fitur K-Means, jumlah cluster, serta jumlah ranking menunggu OD-009, OD-010, dan OD-014. Dashboard analitik `GET /api/admin/analytics` menampilkan statistik nilai mitra, kesiapan K-Means, dan kesiapan ranking tanpa menghitung peringkat resmi. Matriks kesiapan ada di `docs/REQUIREMENTS-TRACEABILITY.md` §20 |
| Dashboard analitik | Terimplementasi sebagian | Halaman `/admin/analitik` (role `admin`/`prodi`) menampilkan statistik nilai mitra per kriteria dari database, status konfigurasi K-Means (OD-009/OD-010), dan pemeriksaan kesiapan rekomendasi. Peringkat SAW resmi tidak dihitung di halaman ini dan distribusi klaster hanya tampil setelah konfigurasi ditetapkan; label klaster tidak menyaring ranking |
| Pengajuan magang | API dan UI terimplementasi sebagian | Mahasiswa dapat melihat katalog dan detail mitra, memilih mitra dari master data, mengirim pengajuan, melihat daftar pengajuan milik sendiri, serta membuka detail berisi status, riwayat, surat penerimaan, dan DPM. `admin`/`prodi` dapat melihat semua pengajuan dan mencatat keputusan `diterima`/`ditolak` dari status `menunggu`; keputusan bersifat final pada modul ini. Untuk pengajuan yang diterima, mahasiswa dapat mengunggah dan mengunduh surat penerimaan, serta `admin`/`prodi` dapat menetapkan DPM. Detail Admin/Prodi, Mahasiswa, dan DPM mengikat hasil ke ID route, sehingga data ID lama tidak tampil dan respons request lama tidak menimpa request terbaru. Status antara, verifikasi dokumen, penerusan ke mitra, reversal, batas lamaran ganda, dan pengajuan ulang resmi tetap menunggu OD-016–OD-021. Mitra yang sudah dipakai tidak dapat dihapus (409) |
| Komunikasi mitra | Pencatatan manual terimplementasi; pengiriman otomatis belum | Halaman detail pengajuan `admin`/`prodi` mencatat arah (dikirim ke mitra/balasan mitra), kanal email/surat, waktu (dinormalisasi ke UTC), dan ringkasan melalui `application_communications`. Sistem tidak mengirim email/surat, tidak menyediakan portal mitra, dan tidak mengubah status pengajuan dari catatan ini. Status hasil seleksi tetap dicatat manual melalui keputusan pengajuan. Template/format surat, tenggat, sumber kebenaran status, dan otomasi menunggu OD-020–OD-022 |
| Surat penerimaan | API dan UI terimplementasi sebagian | Satu surat per pengajuan `diterima`, disimpan di disk privat melalui `backend/config/internship.php`. Format PDF/JPEG/PNG dan batas konfigurasi 5 MB adalah default teknis, bukan kebijakan institusi. Backend memvalidasi MIME yang dideteksi dari isi berkas, bukan ekstensi atau MIME kiriman klien; PDF bernama `.jpg` tetap dikenali sebagai PDF, sedangkan teks bernama `.pdf` ditolak. Allowlist kosong atau rusak jatuh ke default aman PDF/JPEG/PNG agar batasan MIME tidak hilang. Batas efektif mengikuti nilai terkecil dari konfigurasi aplikasi, `upload_max_filesize`, dan `post_max_size`; `GET /api/mahasiswa/acceptance-letter/limit` mengembalikan batas efektif dan allowlist MIME yang dipakai UI untuk validasi, atribut `accept`, dan petunjuk. Penggantian/revisi dinonaktifkan sampai OD-017 ditetapkan. Unduhan selalu melewati otorisasi backend dan tidak memiliki URL publik |
| Penempatan dan akses DPM | API dan UI terimplementasi sebagian | `admin`/`prodi` dapat memilih akun pengguna ber-role `dpm` dan menetapkan satu DPM untuk pengajuan yang diterima. DPM hanya dapat melihat daftar dan detail pengajuan yang ditugaskan kepada akunnya; detail memuat identitas mahasiswa, mitra, penempatan, dan metadata surat, tetapi tidak memuat catatan review internal, riwayat komunikasi mitra, atau unduhan surat. Tidak ada akun dosen dummy atau master dosen baru. Kriteria penugasan, beban, persetujuan, penggantian, bimbingan, penilaian, dan komunikasi DPM menunggu OD-023–OD-026 |
| Seleksi mitra dan verifikasi dokumen | Sebagian: pencatatan komunikasi manual; integrasi mitra belum | Pengiriman email/surat otomatis, portal mitra, verifikasi surat, dan alur revisi menunggu OD-017 dan OD-020–OD-022. Pencatatan manual komunikasi mitra tersedia sebagai jejak audit dengan waktu UTC, bukan pengganti keputusan bisnis |
| Testing | Terimplementasi untuk autentikasi, otorisasi, mitra, profil/peminatan mahasiswa, nilai akademik, pengajuan magang, surat penerimaan, penempatan dan akses DPM, alur komunikasi–keputusan–penempatan lintas role, komunikasi mitra manual, dashboard per role, katalog mitra mahasiswa, kriteria dan nilai mitra, integrasi algoritma, rekomendasi, helper frontend, dan fungsi algoritma | Backend **208 PHPUnit / 1.367 assertion** dan Pint; frontend **56 test Node**, **154 test Vitest (22 file)**, ESLint, TypeScript, dan Vite build; algoritma **44 test Python `unittest`**; integrasi HTTP nyata Laravel ke FastAPI untuk `POST /saw` dan `POST /kmeans` diperiksa manual. Browser E2E ad hoc Chrome headless **43 pemeriksaan** dengan SQLite dan storage sementara dijalankan pada iterasi sebelumnya. Belum ada test suite E2E otomatis |

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
├── algorithm/         # Fungsi generik K-Means/SAW dan layanan FastAPI
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
| GET | `/api/admin/partner-options` | Role `admin`/`prodi` | Daftar mitra read-only untuk form penilaian |
| GET | `/api/admin/criteria` | Role `admin`/`prodi` | Daftar kriteria beserta jumlah nilai mitra |
| POST | `/api/admin/criteria` | Role `admin`/`prodi` | Tambah kriteria (nama, deskripsi, tipe, bobot) |
| GET | `/api/admin/criteria/{criterion}` | Role `admin`/`prodi` | Detail kriteria |
| PUT/PATCH | `/api/admin/criteria/{criterion}` | Role `admin`/`prodi` | Ubah kriteria |
| DELETE | `/api/admin/criteria/{criterion}` | Role `admin`/`prodi` | Hapus kriteria jika belum memiliki nilai mitra |
| GET | `/api/admin/courses` | Role `admin`/`prodi` | Daftar master mata kuliah beserta jumlah nilai tersimpan |
| POST | `/api/admin/courses` | Role `admin`/`prodi` | Tambah mata kuliah (nama, deskripsi opsional) |
| GET | `/api/admin/courses/{course}` | Role `admin`/`prodi` | Detail mata kuliah |
| PUT/PATCH | `/api/admin/courses/{course}` | Role `admin`/`prodi` | Ubah mata kuliah |
| DELETE | `/api/admin/courses/{course}` | Role `admin`/`prodi` | Hapus mata kuliah jika belum memiliki nilai mahasiswa |
| GET | `/api/admin/applications` | Role `admin`/`prodi` | Daftar seluruh pengajuan magang |
| GET | `/api/admin/analytics` | Role `admin`/`prodi` | Statistik nilai mitra, kesiapan K-Means, dan kesiapan ranking; tidak menghitung peringkat resmi |
| GET | `/api/admin/applications/{application}` | Role `admin`/`prodi` | Detail pengajuan beserta identitas mahasiswa dan mitra |
| PATCH | `/api/admin/applications/{application}/status` | Role `admin`/`prodi` | Catat keputusan `diterima`/`ditolak` dari status `menunggu`; 409 jika sudah diputuskan |
| GET | `/api/admin/applications/{application}/communications` | Role `admin`/`prodi` | Riwayat pencatatan komunikasi manual dengan mitra |
| POST | `/api/admin/applications/{application}/communications` | Role `admin`/`prodi` | Catat pengiriman atau balasan mitra; tidak mengirim email/surat dan tidak mengubah status |
| GET | `/api/admin/applications/{application}/acceptance-letter` | Role `admin`/`prodi` | Unduh/pratinjau surat penerimaan melalui respons terotorisasi; 404 jika belum ada |
| GET | `/api/admin/dpm-options` | Role `admin`/`prodi` | Daftar akun pengguna ber-role `dpm` sebagai kandidat; bukan master dosen baru |
| PUT | `/api/admin/applications/{application}/dpm` | Role `admin`/`prodi` | Tetapkan DPM untuk pengajuan `diterima`; 409 untuk status lain atau penempatan ulang |
| GET | `/api/admin/partners/{partner}/scores` | Role `admin`/`prodi` | Semua kriteria dan nilai mitra terpilih |
| PUT | `/api/admin/partners/{partner}/scores` | Role `admin`/`prodi` | Simpan/hapus nilai secara transaksional; `score: null` menghapus nilai |
| DELETE | `/api/admin/partners/{partner}/scores/{criterion}` | Role `admin`/`prodi` | Hapus satu nilai mitra-kriteria |
| GET | `/api/mahasiswa/access-check` | Role `mahasiswa` | Pemeriksaan middleware role |
| GET | `/api/mahasiswa/peminatan` | Role `mahasiswa` | Referensi label dan status penyimpanan peminatan DTA/PSI/SIA |
| GET | `/api/mahasiswa/profile` | Role `mahasiswa` | Profil peminatan akun yang sedang login |
| PUT | `/api/mahasiswa/profile` | Role `mahasiswa` | Simpan peminatan; hanya untuk akun sendiri, menolak `user_id`, dan bergantung pada mode OD-015 |
| GET | `/api/mahasiswa/grades` | Role `mahasiswa` | Semua master mata kuliah dan nilai milik akun yang sedang login; status aturan prasyarat disertakan |
| PUT | `/api/mahasiswa/grades` | Role `mahasiswa` | Ganti nilai milik akun sendiri secara transaksional; menolak `user_id`; `score: null` menghapus nilai tanpa mengubahnya menjadi nol |
| GET | `/api/mahasiswa/partner-options` | Role `mahasiswa` | Daftar mitra read-only untuk form pengajuan; bukan ranking rekomendasi |
| GET | `/api/mahasiswa/partners` | Role `mahasiswa` | Katalog mitra dengan detail kontak dan deskripsi untuk ditampilkan sebelum mengajukan |
| GET | `/api/mahasiswa/applications` | Role `mahasiswa` | Daftar pengajuan magang milik akun sendiri |
| POST | `/api/mahasiswa/applications` | Role `mahasiswa` | Kirim pengajuan; identitas dari akun, status awal `menunggu`, `user_id`/`status`/metadata review ditolak |
| GET | `/api/mahasiswa/applications/{application}` | Role `mahasiswa` | Detail pengajuan milik sendiri; pengajuan mahasiswa lain menghasilkan 404 |
| POST | `/api/mahasiswa/applications/{application}/acceptance-letter` | Role `mahasiswa` | Unggah surat penerimaan untuk pengajuan `diterima` milik sendiri; `user_id` dan metadata server ditolak |
| GET | `/api/mahasiswa/applications/{application}/acceptance-letter` | Role `mahasiswa` | Unduh/pratinjau surat milik sendiri melalui respons terotorisasi; pengajuan mahasiswa lain 404 |
| GET | `/api/mahasiswa/acceptance-letter/limit` | Role `mahasiswa` | Batas ukuran unggah efektif dari konfigurasi aplikasi dan batas runtime PHP, beserta MIME yang diizinkan |
| GET | `/api/mahasiswa/recommendations` | Role `mahasiswa` | Status/ranking rekomendasi; menolak parameter perhitungan dari klien dan hanya memakai peminatan serta data database |
| GET | `/api/dpm/access-check` | Role `dpm` | Pemeriksaan middleware role |
| GET | `/api/dpm/applications` | Role `dpm` | Daftar pengajuan yang ditugaskan kepada DPM yang sedang login |
| GET | `/api/dpm/applications/{application}` | Role `dpm` | Detail pengajuan yang ditugaskan; 404 untuk pengajuan DPM lain |

Endpoint `access-check` adalah alat verifikasi teknis, bukan definisi matriks
izin bisnis. Kewenangan tiap role tetap menunggu keputusan produk.

### Status pengajuan magang

Hanya status yang dapat dipertanggungjawabkan dari BPMN yang disimpan:

- `menunggu` — representasi tersimpan dari aktivitas BPMN
  “Menunggu hasil seleksi mitra”; dipakai sebagai status awal saat pengajuan
  dibuat.
- `diterima` dan `ditolak` — hasil seleksi yang eksplisit di BPMN dan hanya
  dapat dicatat oleh `admin`/`prodi`.

Transisi yang tersedia hanya `menunggu` → `diterima`/`ditolak`. Setelah
keputusan tersimpan, endpoint mengembalikan 409 dan UI tidak menyediakan
perubahan/reversal. Status verifikasi dokumen, penerusan ke mitra, pembatalan,
pengunduran diri, batas lamaran ganda, dan pengajuan ulang resmi belum
diimplementasikan karena OD-016–OD-021 belum diputuskan. Daftar mitra pada form
mahasiswa berasal dari master data, bukan ranking K-Means/SAW, karena pipeline
rekomendasi masih `not_ready`.

Pencatatan komunikasi manual tidak menutup OD-020/OD-021. Catatan tersebut
hanya menyimpan jejak aktivitas yang sudah dilakukan Admin/Prodi; sistem tidak
mengirim email/surat, tidak menentukan tenggat, dan tidak menetapkan sumber
kebenaran status hasil seleksi. Status tetap diubah melalui endpoint keputusan
pengajuan.

### Surat penerimaan dan penempatan DPM

- Hanya pengajuan berstatus `diterima` yang dapat memiliki surat penerimaan dan DPM. Endpoint menolak status lain dengan 409; status tidak dapat dikirim dari klien.
- Surat disimpan di disk privat `local` (`storage/app/private`) dengan nama file yang dihasilkan server. Nama asli hanya disimpan sebagai metadata tampilan, bukan path penyimpanan.
- `backend/config/internship.php` memusatkan default teknis: PDF/JPEG/PNG, maksimal 5 MB, satu surat per pengajuan, dan penggantian dinonaktifkan. Nilai ini bukan kebijakan institusi; format, jumlah, dan revisi tetap menunggu OD-017.
- Kandidat DPM adalah akun `users` yang sudah memiliki role `dpm`. Tidak ada master dosen atau akun dummy yang dibuat. Satu pengajuan memiliki satu DPM; penggantian dinonaktifkan sampai OD-024 ditetapkan.
- Mahasiswa hanya dapat mengunggah/mengunduh surat dan melihat DPM dari pengajuan miliknya. `admin`/`prodi` dapat mengunduh surat dan menetapkan DPM. Tidak ada endpoint surat publik.

## Layanan algoritma

Layanan FastAPI terpisah menyediakan `GET /health`, `POST /kmeans`, dan
`POST /saw`. Layanan ini hanya mengekspos fungsi generik; kriteria, bobot,
jumlah cluster, dan aturan bisnis tidak ditetapkan di dalamnya.

```bash
cd algorithm
python3 -m venv .venv
. .venv/bin/activate
pip install -e '.[test]'
uvicorn spk_service.main:app --host 127.0.0.1 --port 8001 --reload
```

Atau melalui Compose: `docker compose up -d algorithm`. Detail kontrak,
contoh request, dan perintah test ada di
[`algorithm/README.md`](algorithm/README.md).

Backend membaca URL layanan dari environment, bukan dari controller:

```dotenv
ALGORITHM_SERVICE_URL=http://127.0.0.1:8001
ALGORITHM_SERVICE_TIMEOUT=5
ALGORITHM_SERVICE_CONNECT_TIMEOUT=3
```

Jika backend berjalan di dalam jaringan Compose yang sama dengan layanan
algoritma, gunakan hostname layanan (misalnya `http://algorithm:8001`). Batas
timeout dipakai untuk mencegah permintaan menggantung, dan kegagalan layanan
dikembalikan sebagai pesan aman tanpa stack trace.

Parameter pipeline rekomendasi berada di `backend/config/recommendation.php`.
Nilai fitur K-Means, jumlah cluster, pemetaan peminatan, dan jumlah ranking
sengaja kosong. `RECOMMENDATION_ENABLED` juga bernilai `false` secara default;
flag ini adalah kontrol operasional, bukan pengganti keputusan bisnis. Sampai
keputusan bisnis ditetapkan dan seluruh pemeriksaan lulus, endpoint rekomendasi
mengembalikan status `not_ready` beserta alasan spesifik berkategori
(`technical`, `data`, `decision`) dan tidak membuat ranking. Tidak ada fallback
yang menganggap nilai hilang sebagai nol atau memberi label DTA/PSI/SIA pada
cluster generik.

```dotenv
RECOMMENDATION_ENABLED=false
RECOMMENDATION_KMEANS_CLUSTERS=
RECOMMENDATION_KMEANS_RANDOM_SEED=
RECOMMENDATION_RANKING_LIMIT=
```

Jangan mengubah `.env` hanya untuk membuat halaman rekomendasi menampilkan
ranking. Isi nilai di atas hanya setelah keputusan OD-007–OD-015 disetujui.
Matriks kesiapan dan dampak tiap keputusan ada di
[`docs/REQUIREMENTS-TRACEABILITY.md`](docs/REQUIREMENTS-TRACEABILITY.md) §20.

Penyimpanan peminatan memakai tabel relasional `student_peminatan` (satu baris
per pilihan) agar skema tidak memaksakan kardinalitas sebelum OD-015
ditetapkan. Variabel `STUDENT_PEMINATAN_MODE` sengaja kosong pada contoh
environment. Isi hanya dengan `single` atau `multiple` setelah keputusan
produk; tanpa nilai tersebut, `PUT /api/mahasiswa/profile` mengembalikan
`409` dan UI menampilkan alasan konflik, bukan memilih aturan secara diam-diam.

## Nilai akademik dan prasyarat

Master mata kuliah disimpan pada tabel `courses` (nama unik dan deskripsi
opsional) dan hanya dapat dikelola role `admin`/`prodi`. Nilai mahasiswa
disimpan pada tabel `student_grades` dengan foreign key `user_id` (cascade) dan
`course_id` (restrict), serta unique constraint `(user_id, course_id)` agar satu
mahasiswa tidak memiliki nilai ganda untuk mata kuliah yang sama.

Endpoint mahasiswa mengambil identitas dari token, bukan dari body atau query.
`PUT /api/mahasiswa/grades` mengganti nilai milik akun tersebut di dalam satu
transaksi. Mata kuliah yang tidak diisi (`score: null`) akan menghapus baris
nilai; nilai kosong tidak pernah dianggap nol. Batas pada
`backend/config/academic.php` hanya batas penyimpanan teknis, bukan skala nilai
resmi.

Daftar mata kuliah prasyarat, sumber nilai, skala, ambang kelulusan, dan aturan
validasi resmi sengaja kosong sampai OD-007/OD-008 diputuskan. Karena itu:

- UI nilai menampilkan status bahwa aturan prasyarat belum dikonfigurasi dan
  tidak menampilkan status lulus/tidak lulus.
- `backend/config/academic.php` memuat `prerequisites.rules` kosong. Format
  setiap aturan adalah `['course_id' => int, 'minimum_score' => float]`, tetapi
  isinya hanya boleh diisi setelah keputusan produk.
- Pemeriksaan `prerequisites` pada rekomendasi akan tetap `blocked` selama
  daftar aturan kosong. Menyimpan nilai akademik saja tidak mengaktifkan
  ranking.

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

# Algorithm service
cd algorithm
pip install -e '.[test]'
python3 -m unittest discover -s tests -t . -v
```

Verifikasi browser untuk login admin, CRUD mitra, pagination, pembatasan role,
alur pengajuan–komunikasi–keputusan–surat–penempatan DPM, serta isolasi akses
mahasiswa dan DPM tercatat di
[`docs/VERIFICATION.md`](docs/VERIFICATION.md). Audit keamanan dan
responsivitas lanjutan, termasuk viewport 320×568, 390×844, 768×1024, dan
1280×900, tercatat di
[`docs/SECURITY-RESPONSIVENESS-AUDIT.md`](docs/SECURITY-RESPONSIVENESS-AUDIT.md).
Pengujian browser memakai Chrome headless, SQLite sementara, dan storage
sementara; database pengembangan, `.env`, dan data bisnis tidak diubah.

## Dokumentasi

- [`docs/PRD.md`](docs/PRD.md) — kebutuhan produk, keputusan D-001–D-004, dan OD-001–OD-031
- [`docs/BPMN-ANALYSIS.md`](docs/BPMN-ANALYSIS.md) — analisis BPMN
- [`docs/REQUIREMENTS-TRACEABILITY.md`](docs/REQUIREMENTS-TRACEABILITY.md) — traceability kebutuhan
- [`docs/CRITERIA-GAP-ANALYSIS.md`](docs/CRITERIA-GAP-ANALYSIS.md) — audit dan gap modul kriteria penilaian
- [`docs/STUDENT-FLOW-GAP-ANALYSIS.md`](docs/STUDENT-FLOW-GAP-ANALYSIS.md) — gap alur mahasiswa, peminatan, nilai, dan pengajuan
- [`docs/VERIFICATION.md`](docs/VERIFICATION.md) — hasil verifikasi browser login admin, CRUD mitra, pagination, role guard, dan alur pengajuan–surat–DPM
- [`docs/UAT-TEST-PLAN.md`](docs/UAT-TEST-PLAN.md) — rencana UAT per role, isolasi data, validasi unggahan, dan daftar skenario yang terblokir keputusan
- [`docs/UAT-OPERATIONAL-CHECKLIST.md`](docs/UAT-OPERATIONAL-CHECKLIST.md) — checklist provisioning PostgreSQL, storage, cache, dan environment UAT terpisah
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
