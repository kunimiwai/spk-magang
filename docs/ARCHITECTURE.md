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
| Frontend shell | Terimplementasi dan terverifikasi | Layout, navigasi, halaman login, dashboard per role berbasis data backend, profil, kriteria, master mata kuliah, nilai akademik, rekomendasi, katalog mitra mahasiswa, pengajuan mahasiswa beserta detailnya, daftar/detail pengajuan admin/prodi, pencatatan komunikasi mitra manual, unggah/unduh surat penerimaan, penempatan DPM, serta daftar/detail bimbingan DPM read-only; `npm run lint` dan `npm run build` lulus |
| Frontend auth | Terimplementasi dan terverifikasi | Pemulihan sesi, redirect, penanganan 401, logout |
| Frontend mitra admin | Terimplementasi dan terverifikasi | Halaman `/mitra` terhubung ke API CRUD; pagination, validasi, dialog, dan state lengkap; lolos lint/build serta E2E browser desktop/tablet/ponsel |
| Backend auth | Terimplementasi dan terverifikasi | Sanctum, rate limit, test fitur |
| Backend role middleware | Terimplementasi sebagian | `admin`, `mahasiswa`, `prodi`, `dpm`; matriks izin lengkap belum final (OD-001–OD-003) |
| Database | Terimplementasi sebagian | Tabel `users`, token Sanctum, cache, jobs, `partners`, `criteria`, `criterion_scores`, `student_peminatan`, `courses`, `student_grades`, `internship_applications`, `acceptance_letters`, `dpm_placements`, dan `application_communications`; tabel bisnis lain belum ada |
| Nilai akademik | Struktur terimplementasi; aturan prasyarat belum | Master `courses` untuk `admin`/`prodi`, nilai `student_grades` hanya untuk akun mahasiswa sendiri, unique `(user_id, course_id)`, transaksi penggantian nilai. Daftar prasyarat, skala, sumber, dan ambang kelulusan menunggu OD-007/OD-008 |
| Pengajuan magang | API dan UI terimplementasi sebagian | Tabel `internship_applications` dengan FK `user_id` (cascade), `partner_id` (restrict), dan `reviewed_by` (null on delete). Mahasiswa hanya melihat pengajuan sendiri (pengajuan mahasiswa lain 404); `admin`/`prodi` mencatat `diterima`/`ditolak` dari `menunggu` secara atomik. Tabel `acceptance_letters` menyimpan metadata satu surat per pengajuan `diterima`; file berada di disk privat dengan path yang dihasilkan server. Tabel `dpm_placements` menyimpan satu DPM per pengajuan dengan FK ke `users` role `dpm`. Tabel `application_communications` menyimpan jejak manual pengiriman/balasan mitra; pencatatan tidak mengirim pesan atau mengubah status, dan waktu ber-offset dinormalisasi ke UTC. Status antara, verifikasi/revisi dokumen, penggantian DPM, dan reversal menunggu OD-016–OD-024 |
| Algorithm Service | Terimplementasi sebagai layanan generik | Endpoint `GET /health`, `POST /kmeans`, dan `POST /saw`; parameter bisnis tetap kosong |
| Modul bisnis | Sebagian | CRUD mitra admin, kriteria, peminatan (bergantung OD-015), master mata kuliah, nilai akademik, integrasi rekomendasi, pengajuan magang, komunikasi mitra manual, surat penerimaan, penempatan DPM, serta daftar/detail bimbingan DPM read-only tersedia; seleksi mitra otomatis, verifikasi dokumen, tindakan/penilaian bimbingan DPM, dan lainnya menunggu OD-017–OD-026 |
| Notifikasi/laporan/integrasi | Belum diimplementasikan | Terblokir OD-029–OD-031 |

## Keputusan arsitektur yang masih terbuka

- Apakah layanan algoritma tetap terpisah untuk produksi?
- Parameter bisnis dan pemetaan cluster pada kontrak backend–algorithm service.
- Format data akademik lanjutan di luar nama/deskripsi mata kuliah dan nilai.
- Bagaimana error, timeout, dan retry antar layanan ditangani untuk produksi?
- Apa strategi caching dan performa?

Keputusan tersebut belum diambil. Lihat `docs/PRD.md` Bagian 8 dan
`docs/REQUIREMENTS-TRACEABILITY.md` Bagian 16.

## Catatan keamanan

- File `.env` tidak di-commit; nilai rahasia tidak boleh masuk repository.
- CORS hanya mengizinkan origin frontend yang tercantum di
  `CORS_ALLOWED_ORIGINS` (`backend/config/cors.php`). Wildcard origin tidak
  dipakai, dan `supports_credentials` tetap `false` karena API memakai Bearer
  token.
- Token Bearer tidak memakai cookie untuk request API, sehingga CORS tidak
  mengaktifkan kredensial. Cookie sesi hanya dipakai sementara saat login.
- Deployment produksi wajib memakai HTTPS, `APP_DEBUG=false`, cookie sesi
  `Secure`, dan origin CORS yang eksplisit.
- Masa berlaku token, audit trail, retensi data, dan kebijakan perlindungan
  data belum ditetapkan (OD-027, OD-028).
- Mitra tidak memiliki akun aplikasi sesuai D-003; tidak ada autentikasi mitra
  yang boleh ditambahkan tanpa keputusan baru.
- Pengajuan mahasiswa diisolasi melalui query relasi akun; akses ke pengajuan
  mahasiswa lain mengembalikan 404. Endpoint keputusan memakai conditional
  update atomik dan hanya menerima `diterima`/`ditolak` dari `menunggu`, serta
  menolak `user_id`, `partner_id`, dan metadata review dari klien.
- Surat penerimaan disimpan di disk privat `local` (`storage/app/private`)
  dengan nama file yang dihasilkan server. Nama asli hanya metadata. Backend
  memvalidasi MIME yang dideteksi dari isi berkas dan batas ukuran efektif;
  ekstensi atau MIME kiriman klien tidak dipercaya. Allowlist kosong atau rusak
  jatuh ke default aman PDF/JPEG/PNG agar batasan MIME tidak hilang. Frontend
  membaca batas dan allowlist MIME dari endpoint limit, lalu memakai fallback
  konstanta hanya bila request gagal. Path dan disk tidak diekspos di
  JSON; unduhan melewati endpoint ber-`auth:sanctum` dengan pemeriksaan
  kepemilikan/role dan header `X-Content-Type-Options: nosniff`.
- Halaman detail Admin/Prodi dan DPM mengikat state ke ID parameter route.
  Perubahan ID langsung menampilkan loading untuk ID baru; respons request lama
  diabaikan sehingga tidak dapat menimpa data ID terbaru atau menampilkan data
  ID sebelumnya.
- Riwayat komunikasi mitra hanya tersedia untuk `admin`/`prodi` melalui
  endpoint terautentikasi. Pencatat diambil dari akun aktif, metadata server
  ditolak dari body, ringkasan dibatasi 2000 karakter, dan waktu ber-offset
  disimpan sebagai UTC. Riwayat tidak dimuat ke respons pengajuan mahasiswa
  atau DPM.
- Kandidat DPM diambil dari akun `users` ber-role `dpm`; tidak ada akun dummy
  atau master dosen baru. FK `dpm_id` memastikan penempatan merujuk akun nyata,
  dan role divalidasi server.
- DPM hanya dapat membaca pengajuan yang `dpm_id`-nya sama dengan akun aktif
  melalui `GET /api/dpm/applications` dan
  `GET /api/dpm/applications/{application}`. Respons memuat identitas
  mahasiswa, mitra, metadata surat penerimaan, dan penempatan DPM; catatan
  review Admin/Prodi, riwayat komunikasi, path/disk surat, dan unduhan surat
  tidak disertakan. Pengajuan DPM lain menghasilkan 404. Endpoint admin dan
  mahasiswa tetap tertutup untuk role `dpm`.

## Batasan dokumen

Dokumen ini mencatat arsitektur aktual dan rancangan yang sudah ada. Detail
proses, entitas, kriteria, atribut K-Means, bobot SAW, dan hak akses harus
divalidasi terhadap BPMN serta kebutuhan sistem sebelum implementasi.
