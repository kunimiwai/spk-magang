# Verification — Integrasi Aplikasi SPK Magang

**Tanggal:** 20 Oktober 2026; diperbarui 23 Oktober 2026
**Cakupan:** §3–§7 mencakup `FR-MIT-01`, login admin, route `/mitra`, CRUD mitra, pagination, dan pembatasan role. §8 mencakup alur pengajuan, komunikasi mitra, keputusan, surat penerimaan, penempatan DPM, dan isolasi akses mahasiswa/DPM. §9 memuat finalisasi workspace, pemeriksaan PostgreSQL, dan kesiapan UAT.
**Status:** Lulus untuk verifikasi otomatis dan E2E yang tercatat. PostgreSQL
development dipulihkan dan diperiksa secara read-only pada pass finalisasi
22 Oktober 2026; lihat §9.1. UAT oleh pengguna sebenarnya belum dilaksanakan.

---

## 1. Tujuan

Memverifikasi bahwa halaman `/mitra` benar-benar berjalan di browser dan
terhubung ke backend, bukan hanya lulus unit test dan build. Verifikasi mencakup
alur utama BPMN “Kelola data mitra magang (tambah/ubah/hapus)”.

---

## 2. Lingkungan pengujian

| Komponen | Nilai |
|---|---|
| Frontend | Vite dev server, React 19, TypeScript |
| Backend | Laravel 13, Sanctum, SQLite sementara |
| Database | `/tmp/.../database.sqlite`, bukan database PostgreSQL pengembangan |
| Browser | Google Chrome headless, dikendalikan melalui Chrome DevTools Protocol |
| Akun uji | Admin dan mahasiswa sementara di database terpisah |
| Data uji | Mitra sementara yang dibuat dan dihapus selama pengujian |

Database sementara dimigrasikan dari nol, diisi akun uji, lalu dihapus setelah
pengujian. Database pengembangan, `.env`, dan data pengguna tidak diubah.
Pengujian juga memakai migration `partners` yang sudah ada; tidak ada migration
baru.

---

## 3. Skenario dan hasil

| No | Skenario | Hasil aktual |
|---|---|---|
| 1 | Login admin melalui form | `POST /api/auth/login` → `200`, redirect ke beranda, nama admin tampil |
| 2 | Buka menu Mitra Magang | Navigasi ke `/mitra`, heading “Mitra magang” tampil |
| 3 | Muat daftar mitra | `GET /api/admin/partners?page=1&per_page=10` → `200` |
| 4 | Submit form kosong | Pesan “Nama instansi wajib diisi.” tampil; tidak ada request `POST` |
| 5 | Tambah mitra | `POST /api/admin/partners` → `201`, pesan sukses dan baris baru tampil |
| 6 | Reload halaman | Data mitra tetap tampil setelah `GET` ulang |
| 7 | Ubah mitra | `PUT /api/admin/partners/{id}` → `200`, nama baru tampil |
| 8 | Hapus mitra | `DELETE /api/admin/partners/{id}` → `200`, empty state tampil |
| 9 | Pagination 11 data | Halaman 1 menampilkan 10 baris; halaman 2 menampilkan 1 baris; `GET page=2` → `200` |
| 10 | Mahasiswa membuka `/mitra` | Layar “Akses ditolak”; tidak ada request ke `/api/admin/partners` |
| 11 | Logout admin | `POST /api/auth/logout` → `200`, redirect ke `/login` |

Tidak ada exception JavaScript di halaman dan tidak ada request API yang gagal
selama skenario di atas.

Setelah audit responsivitas, tombol aksi dialog dipindahkan ke footer tetap di
luar area form yang dapat digulir. Alur tambah dan hapus diuji ulang di browser
pada 390×844: `POST /api/admin/partners` → `201` dan
`DELETE /api/admin/partners/{id}` → `200`, tanpa error konsol atau request
gagal. Validasi Enter-to-submit juga diverifikasi ulang.

---

## 4. Bukti integrasi

Request API yang teramati dari browser:

```text
POST   /api/auth/login                              200
GET    /api/auth/me                                 200
GET    /api/admin/partners?page=1&per_page=10       200
POST   /api/admin/partners                          201
PUT    /api/admin/partners/{id}                     200
DELETE /api/admin/partners/{id}                     200
GET    /api/admin/partners?page=2&per_page=10       200
POST   /api/auth/logout                             200
```

Perilaku UI yang terverifikasi secara visual:

- Tabel mitra menampilkan nama, kontak, email, alamat, dan aksi.
- Dialog tambah/ubah tampil di atas halaman dan dapat ditutup dengan tombol
  Batal.
- Pesan sukses tampil setelah tambah, ubah, dan hapus.
- Empty state tampil saat daftar kosong.
- Pagination menampilkan jumlah data dan halaman aktif.
- Menu “Mitra Magang” hanya tampil untuk admin.
- Layar akses ditolak tampil untuk mahasiswa.

---

## 5. Keterbatasan

- Pengujian browser ini bersifat ad hoc dan tidak disimpan sebagai test suite
  E2E di repository.
- Verifikasi integrasi awal dilakukan pada viewport desktop 1280×900. Audit
  responsivitas lanjutan mencakup 320×568, 390×844, 768×1024, dan 1280×900;
  lihat `docs/SECURITY-RESPONSIVENESS-AUDIT.md`.
- Tabel mitra masih memerlukan gulir horizontal pada layar sempit.
- Database pengembangan PostgreSQL tidak dipakai pada E2E; kontrak backend
  tetap diverifikasi oleh PHPUnit dan migration yang sudah berjalan.
- Pengujian tidak mencakup PostgreSQL-specific behavior di browser. Perbedaan
  driver tidak memengaruhi kontrak JSON yang diuji.
- Browser yang diuji hanya Chrome headless; Safari, Firefox, dan perangkat
  ponsel nyata belum diuji.

---

## 6. Langkah verifikasi manual

Jika browser tersedia:

1. Jalankan backend dan frontend.
2. Login dengan akun role `admin`.
3. Buka `/mitra`.
4. Tambah mitra dengan nama unik.
5. Reload halaman dan pastikan data tetap ada.
6. Ubah nama mitra dan pastikan perubahan tampil.
7. Hapus mitra dan pastikan empty state tampil.
8. Login dengan akun role `mahasiswa`, lalu buka `/mitra`; pastikan layar
   “Akses ditolak” tampil.
9. Periksa DevTools Network: request CRUD harus menuju
   `/api/admin/partners` dan tidak ada respons `401`, `403`, atau `5xx` untuk
   admin.

Jika browser tidak tersedia, verifikasi minimal:

```bash
cd backend
php artisan test --compact
./vendor/bin/pint --test

cd ../frontend
npm test
npm run lint
npm run build
```

Lalu verifikasi kontrak API memakai akun admin lokal dan `curl`/Postman untuk
`GET`, `POST`, `PUT`, dan `DELETE /api/admin/partners`.

---

## 7. Audit lanjutan

Audit keamanan dan responsivitas pada 20 Oktober 2026 mencakup CORS, token,
middleware role, validasi/mass assignment, viewport 320–1280 px, keyboard/focus,
dan dialog footer. Temuan, perbaikan, serta risiko residual dicatat di
[`SECURITY-RESPONSIVENESS-AUDIT.md`](SECURITY-RESPONSIVENESS-AUDIT.md).

---

## 8. Verifikasi alur pengajuan, komunikasi, surat, dan DPM (22 Oktober 2026)

**Status:** Lulus. Verifikasi ini bersifat ad hoc dan memakai data terpisah;
bukan test suite E2E yang dijalankan otomatis di CI.

### 8.1 Lingkungan

| Komponen | Nilai |
|---|---|
| Frontend | Vite dev server, React 19, TypeScript, port `5180` |
| Backend | Laravel 13, Sanctum, SQLite sementara, port `8010` |
| Database | `/tmp/opencode/spk-magang-e2e/database.sqlite` |
| Storage surat | `LARAVEL_STORAGE_PATH` sementara, bukan `backend/storage` pengembangan |
| Browser | Google Chrome 155 headless melalui Chrome DevTools Protocol |
| Akun uji | Admin, Prodi, dua mahasiswa, dan dua DPM sementara |
| Data uji | Dua mitra dan satu pengajuan mahasiswa B yang sudah diterima serta ditempatkan ke DPM B |

Database sementara dimigrasikan dari nol dan diisi melalui factory. Database
PostgreSQL pengembangan tidak dipakai untuk E2E; jumlah baris bisnisnya tetap
`users 2`, `partners 2`, `internship_applications 2`, `acceptance_letters 1`,
`dpm_placements 0`, dan `application_communications 0`. File `.env` tidak
diubah.

### 8.2 Skenario dan hasil

| No | Skenario | Hasil aktual |
|---|---|---|
| 1 | Mahasiswa A login dan membuat pengajuan | Pengajuan baru tampil dengan status “Menunggu hasil seleksi mitra” |
| 2 | Logout mahasiswa A, lalu login Admin | Admin tidak diarahkan ke halaman mahasiswa yang tersimpan dari sesi sebelumnya |
| 3 | Admin mencatat komunikasi keluar saat status masih menunggu | Catatan tampil; status tetap menunggu dan metadata review tetap kosong |
| 4 | Admin mencatat keputusan diterima dan menetapkan DPM A | Status berubah menjadi diterima; DPM A tampil pada penempatan |
| 5 | Admin mencatat komunikasi setelah keputusan | Status diterima dan keputusan tidak berubah |
| 6 | Mahasiswa A mengunggah surat penerimaan dan mengunduhnya | Unggah dan unduh berhasil melalui UI; metadata `surat-e2e.pdf` tampil |
| 7 | DPM A membuka daftar dan detail bimbingan | Data mahasiswa, mitra, penempatan, dan metadata surat tampil |
| 8 | DPM A membuka detail bimbingan | Riwayat komunikasi, catatan review internal, dan aksi unduh surat tidak tampil |
| 9 | DPM B membuka daftar dan detail milik DPM A | Daftar tidak memuat mahasiswa A; detail langsung menghasilkan state “tidak ditemukan” |
| 10 | Mahasiswa B membuka pengajuan miliknya dan halaman Admin | Hanya satu pengajuan miliknya yang tampil; halaman Admin menampilkan “Akses ditolak” |
| 11 | Prodi membuka daftar/detail pengajuan dan mencatat komunikasi | Daftar/detail dan pencatatan berhasil; status diterima tidak berubah |
| 12 | Prodi membuka halaman mitra yang khusus Admin | Layar “Akses ditolak” tampil |

Browser E2E menjalankan **43 pemeriksaan** dan selesai tanpa exception
JavaScript tak tertangkap. Respons `404` pada probe lintas DPM adalah hasil yang
diharapkan dan ditampilkan sebagai state error, bukan kegagalan aplikasi.

### 8.3 Bukti otomatis

| Pemeriksaan | Hasil |
|---|---|
| PHPUnit backend | 205 test, 1.351 assertion |
| Laravel Pint | Lulus |
| Unit test Node frontend | 55 test |
| Test komponen Vitest | 121 test pada 14 file |
| ESLint | Lulus |
| TypeScript dan Vite build | Lulus |
| Python `unittest` | 44 test |
| Browser E2E Chrome headless | 43 pemeriksaan lulus (dijalankan ulang setelah hardening) |

Angka backend dan frontend di atas mencakup test regresi pada §8.5 dan §8.6.
Browser E2E dijalankan ulang setelah hardening memakai database SQLite baru,
storage sementara, port alternatif, dan jeda 61 detik sebelum login berikutnya
agar rate limit login 5/menit tidak mengubah hasil. E2E selesai dengan 43
pemeriksaan lulus dan tanpa exception JavaScript tak tertangkap.

Test integrasi token di `backend/tests/Feature/Api/InternshipWorkflowTest.php`
mencakup pengajuan, komunikasi, keputusan, surat, penempatan DPM, detail DPM,
penolakan lintas mahasiswa, penolakan lintas DPM, serta pemeriksaan status dan
metadata review. Test redirect login ada di
`frontend/src/lib/routeAccess.test.ts` dan
`frontend/src/pages/LoginPage.test.tsx`.

### 8.4 Temuan dan perbaikan

E2E menemukan bug UX yang nyata: state tujuan halaman milik mahasiswa masih
tersimpan setelah logout, sehingga akun Admin yang login berikutnya diarahkan
ke halaman mahasiswa dan berakhir di layar “Akses ditolak”. Backend tetap
menolak akses, jadi ini bukan kebocoran otorisasi. Perbaikannya memvalidasi
tujuan redirect login terhadap role akun melalui
`frontend/src/lib/routeAccess.ts`, lalu memakai tujuan aman `/` bila role tidak
berhak. `App.tsx` dan `LoginPage.tsx` memakai kelompok role yang sama; tidak ada
hak akses baru yang ditambahkan.

### 8.5 Regresi audit akhir

Audit lanjutan setelah E2E menemukan enam bug kecil yang tidak memerlukan
keputusan bisnis baru. Semuanya diperbaiki dan diberi test regresi:

| Temuan | Perbaikan | Verifikasi |
|---|---|---|
| Peringatan halaman DPM menyatakan surat tidak ditampilkan, padahal metadata surat tampil | Teks dibedakan: metadata tampil, unduhan tidak tersedia | Vitest `DpmAssignmentDetailPage.test.tsx` |
| Tombol “Coba lagi” pada ID admin/DPM yang tidak valid tidak melakukan apa pun | Tombol hanya dirender untuk ID valid; ID tidak valid tetap menampilkan error tanpa aksi palsu | Vitest halaman detail admin dan DPM |
| Pengajuan berhasil dibuat saat daftar awal gagal memuat hanya menampilkan pengajuan baru dan menyembunyikan pengajuan lama | Daftar dimuat ulang agar data lengkap kembali, bukan diganti dengan satu entri | Vitest `StudentApplicationsPage.test.tsx` |
| Catatan komunikasi baru selalu ditempatkan paling atas meskipun waktunya lebih lama | Riwayat diurutkan ulang berdasarkan `occurred_at` terbaru, lalu ID | Node `communications.test.ts`, Vitest `CommunicationLogPanel.test.tsx` |
| Waktu komunikasi dengan offset zona waktu kehilangan offset saat disimpan | Nilai dinormalisasi ke UTC sebelum validasi/penyimpanan | PHPUnit `ApplicationCommunicationTest` |
| Teks dashboard mahasiswa menyebut “pengajuan lain” ada di halaman rekomendasi | Teks diarahkan ke rekomendasi alternatif dan halaman Pengajuan Magang | Vitest `StudentDashboardPage.test.tsx` |

Tidak ada perubahan hak akses, status, skema bisnis, atau data pengembangan
dalam perbaikan ini. Test otorisasi dan isolasi data yang sudah ada tetap lulus.

### 8.6 Hardening validasi surat dan konsistensi detail (22 Oktober 2026)

Hardening ini tidak mengubah hak akses, status bisnis, tipe/ukuran surat, atau
keputusan OD yang masih terbuka.

| Temuan | Perbaikan | Verifikasi |
|---|---|---|
| Panel unggah memakai allowlist MIME hardcoded dan tidak mengikuti konfigurasi server | Panel memakai `allowed_mime_types` dari `GET /api/mahasiswa/acceptance-letter/limit`; atribut `accept`, petunjuk, dan validasi klien mengikuti daftar tersebut. Konstanta frontend hanya menjadi fallback saat request gagal atau daftar server kosong | Node `documents.test.ts`, Vitest `StudentApplicationsPage.test.tsx` |
| Validasi server harus membuktikan tipe isi berkas, bukan ekstensi | Regresi menambahkan berkas nyata: PDF bernama `.jpg` diterima berdasarkan MIME terdeteksi dan disimpan dengan ekstensi server; teks bernama `.pdf` ditolak; PDF bernama `.php` ditolak. Allowlist kosong/rusak sekarang jatuh ke default aman PDF/JPEG/PNG, sehingga `File::types([])` tidak menghapus batasan MIME. Tidak ada pelonggaran validasi server | PHPUnit `AcceptanceLetterTest` |
| Detail Admin/Prodi/DPM masih dapat menampilkan data ID sebelumnya saat parameter route berubah | State detail mengikat hasil ke ID request; ID baru langsung menampilkan loading, respons lama tidak dapat menimpa respons baru, dan form Admin direset saat data ID baru berhasil dimuat. Respons update yang selesai setelah pindah ID diabaikan | Vitest halaman detail Admin/Prodi dan DPM, termasuk perubahan ID tanpa unmount dan respons terbalik |

Browser E2E dijalankan ulang setelah perubahan ini dan mencakup login lintas
role, detail Admin/Prodi, detail DPM, unggah/unduh surat, isolasi data
mahasiswa/DPM, serta penolakan akses. Hasil aktual: **43 pemeriksaan lulus,
0 gagal, 0 exception JavaScript**.

### 8.7 Keterbatasan

- Skrip E2E dijalankan dari direktori sementara dan tidak disimpan sebagai test
  suite otomatis di repository.
- Playwright/Puppeteer tidak terpasang; browser dikendalikan langsung melalui
  Chrome DevTools Protocol.
- Browser yang diuji hanya Chrome headless; Firefox, Safari, dan perangkat
  nyata belum diuji.
- Backend browser E2E memakai SQLite sementara, bukan PostgreSQL pengembangan.
- E2E tidak mencakup otomasi email/surat, notifikasi, verifikasi dokumen,
  reversal status, penggantian DPM, bimbingan, atau penilaian karena keputusan
  OD-016–OD-026 dan OD-029 belum tersedia.

---

## 9. Finalisasi workspace dan kesiapan UAT (22 Oktober 2026)

**Status:** Verifikasi teknis otomatis lulus. PostgreSQL development berhasil
dipulihkan dan diperiksa secara read-only pada pass finalisasi ini. UAT oleh
pengguna sebenarnya **belum dilaksanakan**. Rencana UAT ada di
[`UAT-TEST-PLAN.md`](UAT-TEST-PLAN.md); langkah lingkungan UAT terpisah ada di
[`UAT-OPERATIONAL-CHECKLIST.md`](UAT-OPERATIONAL-CHECKLIST.md).

### 9.1 Pemeriksaan workspace, migration, dan koneksi database

| Pemeriksaan | Hasil aktual |
|---|---|
| Working tree | 29 file modified dan 20 file untracked setelah dokumen UAT dan checklist operasional dibuat; tidak ada commit/push |
| File untracked | Seluruhnya source, test, migration, atau dokumentasi yang berkaitan; tidak ada `.env`, database, log, build, screenshot, atau PDF uji |
| Secret scan repository | Tidak ditemukan token/password/API key yang dilacak. File `.env`, SQLite, log, `dist/`, `vendor/`, dan `node_modules/` berada pada daftar ignored |
| Migration baru | `2026_10_22_000000_create_application_communications_table.php` hanya membuat tabel baru; `down()` hanya menghapus tabel baru tersebut. Migration ini ikut dijalankan oleh suite PHPUnit pada database test SQLite |
| PostgreSQL runtime | Container Podman `spk-magang-postgres` ditemukan berhenti dengan exit code `0`; log menunjukkan `fast shutdown request`, bukan crash. Penyebab pemicu penghentian tidak tercatat di log. Container yang sama dinyalakan kembali tanpa mengubah port, volume, atau kredensial; status akhir `running/healthy` pada `127.0.0.1:5432` |
| Migration PostgreSQL | `php artisan migrate:status` menunjukkan seluruh 15 migration, termasuk tabel komunikasi, berstatus `Ran`; `php artisan migrate --pretend` menghasilkan `Nothing to migrate` |
| Struktur tabel baru | `php artisan db:table application_communications`: 9 kolom, indeks `(internship_application_id, occurred_at)`, indeks `recorded_by`, FK cascade ke `internship_applications`, dan FK set-null ke `users` |
| Data pengembangan | `php artisan db:show --counts`: 20 tabel; `users 2`, `partners 2`, `internship_applications 2`, `acceptance_letters 1`, `dpm_placements 0`, `application_communications 0`; tidak ada perubahan data |
| Batas pemeriksaan | Hanya perintah read-only yang dijalankan. Tidak ada migration pending, `migrate:fresh`, reset, rollback, truncate, atau perubahan data |
| `.env` | Tidak diubah. Inspeksi hanya menampilkan nama koneksi/database tanpa nilai sensitif |

### 9.2 Pengujian otomatis yang dijalankan ulang

| Pemeriksaan | Hasil aktual |
|---|---|
| PHPUnit backend | **205 test, 1.351 assertion**, lulus |
| Laravel Pint | Lulus |
| Unit test Node frontend | **55 test**, lulus |
| Test komponen Vitest | **121 test pada 14 file**, lulus |
| ESLint | Lulus |
| TypeScript dan Vite build | Lulus |
| Python `unittest` | **44 test**, lulus dengan `algorithm/.venv/bin/python` |
| `git diff --check` | Lulus, exit code `0` |

### 9.3 Browser E2E final

Browser E2E dijalankan ulang pada pass E2E final sebelum pemeriksaan ulang
pass finalisasi ini, dengan:

- Chrome headless;
- database SQLite sementara di
  `/tmp/opencode/spk-magang-e2e-run6/database.sqlite`;
- storage sementara, bukan `backend/storage`;
- backend port `8011`, frontend port `5181`, dan Chrome DevTools port `9230`;
- akun dan data E2E terpisah dari database pengembangan.

Hasil aktual: **43 pemeriksaan lulus, 0 gagal, 0 exception JavaScript tak
tertangkap**. Skenario mencakup login lintas role, pengajuan, komunikasi,
keputusan, unggah/unduh surat, penempatan DPM, detail DPM, isolasi data
mahasiswa/DPM, serta penolakan akses role.

Percobaan pertama pada pass ini gagal melakukan login karena instance frontend
E2E diarahkan ke `VITE_API_BASE_URL` tanpa sufiks `/api`; setelah konfigurasi
instance E2E dikoreksi, seluruh 43 pemeriksaan lulus. Kegagalan tersebut adalah
kesalahan konfigurasi harness sementara, bukan defect aplikasi dan tidak
mengubah kode repository.

Pada satu eksekusi paralel dengan PHPUnit, Pint, lint, dan build, satu test
Vitest `CriteriaPage` melewati batas waktu 5 detik. Eksekusi ulang `npm test`
secara terisolasi lulus **55 test Node + 121 test Vitest**. Timeout test tidak
diubah; kejadian ini dicatat sebagai risiko flakiness di bawah beban CPU, bukan
kegagalan fungsional yang terbukti.

Pemeriksaan ulang pada pass finalisasi ini **tidak menjalankan ulang browser
E2E**. Skrip harness berada di direktori sementara dan bukan suite otomatis
repository; angka 43 pemeriksaan di atas adalah hasil pass E2E sebelumnya.

### 9.4 Keterbatasan finalisasi

- UAT belum dijalankan oleh Admin, Prodi, mahasiswa, atau DPM sebenarnya.
- E2E tetap ad hoc dan tidak tersimpan sebagai suite otomatis repository.
- Browser E2E hanya Chrome headless dan SQLite; perilaku browser lain dan
  PostgreSQL-specific E2E belum diuji.
- Pemeriksaan PostgreSQL development berhasil dilakukan setelah container yang
  berhenti normal dinyalakan kembali. Penyebab pemicu penghentian tidak tercatat;
  restart policy `unless-stopped` tidak menyalakan ulang container yang dihentikan
  secara eksplisit. Operator perlu memantau container ini sebelum UAT.
- Lingkungan UAT terpisah kini tersedia (§9.6–§9.7), tetapi UAT pengguna belum
  dijalankan. Root persisten sudah aktif dan container sudah memakai secret dari
  root tersebut; root `/tmp` hanya rollback.
- Rekomendasi tetap nonaktif; ranking resmi dan parameter K-Means/SAW belum
  dapat diterima sebelum OD-007–OD-015 ditetapkan.
- Skenario UAT yang terblokir keputusan dicatat pada
  `docs/UAT-TEST-PLAN.md` §14.

### 9.5 Pemeriksaan ulang 23 Oktober 2026

Container `spk-magang-postgres` ditemukan `exited` dengan `ExitCode=0` dan
`OOMKilled=false`; log terakhir menunjukkan `fast shutdown request`, bukan
crash. Host menyala ulang pada 23 Oktober 2026 pukul 14:29, sedangkan
`podman-restart.service` untuk pengguna ini `disabled/inactive`, sehingga
container rootless tidak ikut berjalan otomatis. Penyebab pemicu penghentian
sebelum reboot tidak tercatat di log.

Container yang sudah ada dinyalakan kembali tanpa mengubah `.env`, kredensial,
port, volume, atau konfigurasi. PostgreSQL menyelesaikan automatic recovery dan
menerima koneksi pada `127.0.0.1:5432`. Pemeriksaan read-only menunjukkan 15
migration `Ran`, `migrate --pretend` menghasilkan `Nothing to migrate`, struktur
`application_communications` sesuai migration, dan jumlah data tidak berubah
(`users 2`, `partners 2`, `internship_applications 2`, `acceptance_letters 1`,
`dpm_placements 0`, `application_communications 0`).

Pengujian otomatis dijalankan ulang: PHPUnit 205 test/1.351 assertion, Pint,
55 test Node, 121 test Vitest pada 14 file, ESLint, serta TypeScript dan Vite
build seluruhnya lulus. Backend test memakai SQLite `:memory:` sesuai
`phpunit.xml`. Pada pemeriksaan ulang ini belum ada UAT, akun, database, atau
storage UAT baru yang dibuat; provisioning dan smoke test UAT dicatat di §9.6.

### 9.6 Smoke test PostgreSQL UAT (23 Oktober 2026)

Lingkungan UAT terpisah dibuat dengan container `spk-magang-uat-postgres`,
volume `spk-magang-uat-postgres-data`, port `127.0.0.1:55432`, database
`spk_magang_uat`, user `spk_uat`, dan root `/tmp/opencode/spk-magang-uat`.
Secret disimpan lokal dengan mode `0600`; `.env` development tidak diubah.

Sebelum migration, konfigurasi Laravel dibuktikan mengarah ke database UAT,
storage dan cache di bawah root UAT, APP_KEY berbeda dari development, dan
rekomendasi `false`. Database UAT masih kosong (0 tabel public), lalu 15
migration dijalankan pada batch 1 dan berstatus `Ran`; `migrate --pretend`
menghasilkan `Nothing to migrate`.

Smoke test HTTP terhadap PostgreSQL UAT berjalan **1 test, 104 assertion,
lulus**. Test memakai `DatabaseTransactions` (bukan `RefreshDatabase`), sehingga
schema tidak direset. Cakupan: pengajuan, komunikasi manual tanpa perubahan
status, keputusan, validasi isi surat, unggah/unduh surat, penempatan DPM, dan
isolasi akses antarpengguna. Setelah test, seluruh tabel bisnis UAT kembali
kosong dan tidak ada berkas surat tersisa. Data development tidak berubah.
Bukti tersimpan di `/tmp/opencode/spk-magang-uat/evidence/2026-10-23/`.

Smoke test ini bukan UAT pengguna dan tidak mengubah status skenario UAT pada
`docs/UAT-TEST-PLAN.md` §5–§13 maupun baris `BLOCKED` pada §14.

### 9.7 Persistensi dan preparasi data UAT (23 Oktober 2026)

Container UAT sekarang memakai bind mount secret read-only dari
`/home/kunimiwai/.local/share/spk-magang-uat/secrets/postgres-password` dengan
relabel `:Z`, sedangkan volume data persisten di
`/home/kunimiwai/.local/share/containers/storage/volumes/spk-magang-uat-postgres-data`.
Entrypoint PostgreSQL membaca `POSTGRES_PASSWORD_FILE` sebelum server database
dijalankan. Setelah switch, file secret di `/tmp` tidak lagi menjadi dependensi
startup.

Root persisten `/home/kunimiwai/.local/share/spk-magang-uat` sudah aktif:
secret dan `uat.env` mode `0600`, storage/cache di bawah root, database target
`spk_magang_uat`, port `55432`, dan rekomendasi `false`. Container lama
di-rename sebagai rollback, lalu container baru dibuat dengan volume, port,
image, dan policy yang sama. Percobaan pertama gagal karena label MCS SELinux
file secret masih milik container lama; recreate berhasil setelah bind mount
memakai `:Z`. Container lama dihapus setelah verifikasi, volume tetap ada, dan
root `/tmp` dipertahankan sebagai rollback. Verifikasi setelah switch: login 8
akun (31 assertion), smoke test (104 assertion), dan satu siklus stop/start
lulus. Bukti ada di
`/home/kunimiwai/.local/share/spk-magang-uat/evidence/2026-10-23/persistence-switch/`.

Preparasi data UAT dijalankan dengan script idempotent berguard di luar
repository. Hasil aktual: **8 akun** (1 admin, 1 prodi, 4 mahasiswa, 2 DPM), **3
mitra**, dan **0 pengajuan**. Rerun menghasilkan `users_created=0`,
`partners_created=0`, dan jumlah baris file kredensial tidak bertambah.
Password hanya ditulis ke file lokal mode `0600` di root persisten dan tidak
dicetak ke output. Login seluruh akun diverifikasi dengan **1 test HTTP, 31
assertion, lulus**; token/session di-rollback sehingga tidak tersisa.

Data development tetap `users=2`, `partners=2`, `internship_applications=2`,
`acceptance_letters=1`, `dpm_placements=0`, `application_communications=0`.
Tidak ada migration, reset, rollback, truncate, atau perubahan `.env`
development. Script data juga diuji dengan environment development dan berhenti
sebelum menulis karena database bukan `spk_magang_uat`. Pemindaian repository
untuk password database, APP_KEY, dan seluruh password akun UAT tidak menemukan
kecocokan. Bukti ada di
`/home/kunimiwai/.local/share/spk-magang-uat/evidence/2026-10-23/persistence-data-prep/`.
Backup logis awal dibuat di
`/home/kunimiwai/.local/share/spk-magang-uat/backups/uat-before-persistence-switch.dump`
dan backup tepat sebelum recreate di
`/home/kunimiwai/.local/share/spk-magang-uat/backups/uat-before-persistent-mount-20261023T152023.dump`
(masing-masing mode `0600`, 59.207 byte, 166 entri restore). Keduanya
dipertahankan untuk rollback.

UAT browser belum dijalankan. Urutan eksekusi dan bukti minimum ada di
`docs/UAT-BROWSER-EXECUTION.md`; prosedur data ada di
`docs/UAT-DATA-PREP.md`. Seluruh skenario UAT tetap `NOT RUN` dan baris
`BLOCKED` tidak berubah.


---

## 10. Verifikasi penutupan modul inti (23 Oktober 2026)

Perubahan yang diverifikasi pada iterasi ini:

- `/` sekarang mengarahkan setiap role ke dashboard berbasis data backend:
  Admin/Prodi ke `/admin`, Mahasiswa ke `/mahasiswa/dashboard`, dan DPM ke
  `/dpm`.
- Dashboard Admin/Prodi menampilkan hitungan pengajuan per status, notifikasi
  dalam aplikasi untuk pengajuan `menunggu`, lima pengajuan menunggu terbaru,
  serta kesiapan data dari endpoint analitik.
- Dashboard DPM menampilkan jumlah mahasiswa bimbingan, status ketersediaan
  surat, dan lima penempatan terbaru milik DPM yang sedang login.
- Mahasiswa dapat membuka `/mahasiswa/mitra` untuk melihat detail mitra dari
  `GET /api/mahasiswa/partners` dan memilih mitra tersebut pada form pengajuan
  melalui query `?partner={id}`.
- Mahasiswa dapat membuka `/mahasiswa/pengajuan/{id}` untuk melihat status,
  riwayat, mitra, surat penerimaan, dan DPM milik pengajuan sendiri.
- Dialog hapus mitra menampilkan pesan konflik 409 dari backend, bukan pesan
  generik.

Verifikasi otomatis aktual:

```text
Backend  : php artisan test
           208 test, 1.367 assertion, lulus
           vendor/bin/pint --test lulus
Frontend : npm test
           56 test Node lulus
           154 test Vitest pada 22 file lulus
           npm run lint lulus
           npm run build lulus
Algorithm: .venv/bin/python -m unittest discover -s tests -v
           44 test lulus
```

Integrasi HTTP nyata juga diperiksa dengan FastAPI pada port sementara dan
`AlgorithmService` Laravel yang diarahkan melalui environment perintah:
`GET /health`, `POST /saw`, dan `POST /kmeans` mengembalikan respons yang
diterima klien Laravel. `RECOMMENDATION_ENABLED` tetap `false`; tidak ada
perubahan `.env`, migration, reset database, commit, atau push.

Verifikasi browser penuh tidak diulang pada iterasi ini. Bukti browser yang
sudah ada tetap berlaku untuk alur yang tidak berubah; halaman baru diverifikasi
melalui Vitest, TypeScript/Vite build, dan pemeriksaan endpoint backend.
