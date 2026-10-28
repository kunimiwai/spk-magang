# UAT Test Plan — SPK Magang

**Versi:** 1.4  
**Tanggal:** 22 Oktober 2026; diperbarui 23 Oktober 2026  
**Status dokumen:** Rencana UAT dengan hasil eksekusi browser teknis pada
23 Oktober 2026. Operator menjalankan 79 skenario memakai Playwright + Google
Chrome terhadap environment UAT: **78 `PASS`, 1 `FAIL`**. Sebanyak 35 baris
tetap `BLOCKED`, 5 `NOT RUN`, dan 3 `N/A`; hasil belum ditandatangani pemilik
produk dan bukan pengganti UAT pengguna sebenarnya. Rincian ada di §17.5.  
Langkah provisioning lingkungan terpisah ada di
[`UAT-OPERATIONAL-CHECKLIST.md`](UAT-OPERATIONAL-CHECKLIST.md). Prosedur data
ada di [`UAT-DATA-PREP.md`](UAT-DATA-PREP.md), dan urutan browser ada di
[`UAT-BROWSER-EXECUTION.md`](UAT-BROWSER-EXECUTION.md).  
**Pemilik dokumen:** Tim proyek SPK Magang  
**Branch acuan:** `feat/frontend-authentication`

## 1. Tujuan dan ruang lingkup

### 1.1 Tujuan

Dokumen ini menjadi rencana UAT untuk memverifikasi bahwa fitur yang sudah
diimplementasikan dapat digunakan sesuai perilaku yang disepakati, membatasi
akses sesuai role yang berlaku saat ini, dan tidak menampilkan atau mengubah
data di luar kewenangan pengguna.

UAT juga harus memisahkan dua hal:

1. **Perilaku teknis yang sudah dapat diuji** pada implementasi saat ini.
2. **Keputusan bisnis yang belum ada**, sehingga skenario terkait tidak boleh
   dianggap lulus, gagal, atau disepakati sebelum pemilik produk menetapkan
   keputusan pada `docs/BUSINESS-DECISION-REGISTER.md`.

### 1.2 Ruang lingkup yang direncanakan

- Autentikasi, logout, pemulihan sesi, dan navigasi lintas role.
- Role Admin, Prodi, Mahasiswa, dan DPM sesuai baseline teknis saat ini.
- CRUD mitra oleh Admin.
- Pengajuan magang oleh Mahasiswa dan pembacaan oleh Admin/Prodi.
- Keputusan `menunggu` → `diterima`/`ditolak`.
- Pencatatan komunikasi mitra manual (email/surat), tanpa pengiriman otomatis.
- Unggah dan unduh surat penerimaan privat.
- Penetapan satu DPM untuk pengajuan yang sudah diterima.
- Daftar dan detail mahasiswa bimbingan DPM yang bersifat read-only.
- Isolasi data antarmahasiswa, antar-DPM, dan pembatasan role.
- Validasi unggahan, termasuk tipe isi berkas dan penolakan berkas berbahaya.
- State loading, error, empty, dan invalid-ID pada halaman yang diuji.
- Navigasi detail Admin/Prodi dan DPM saat ID route berubah.

### 1.3 Di luar ruang lingkup atau belum dapat diterima

- Perangkingan rekomendasi K-Means/SAW resmi. `RECOMMENDATION_ENABLED` tetap
  `false`; halaman rekomendasi hanya boleh menunjukkan status belum siap.
- Registrasi mandiri mahasiswa dan pengelolaan pengguna.
- Email/surat otomatis, portal mitra, WhatsApp, notifikasi, tenggat, pengingat,
  dan template surat resmi.
- Verifikasi/revisi/penolakan dokumen oleh Admin/Prodi.
- Reversal keputusan, pembatalan, pengunduran diri, pengajuan ulang, dan
  lamaran ke beberapa mitra.
- Penggantian DPM, kriteria beban DPM, bimbingan, penilaian, dan tanda tangan.
- Laporan, ekspor, integrasi akademik, dan histori/banding rekomendasi.
- Klaim keamanan, retensi, audit trail, performa, dan backup sebagai acceptance
  criteria produksi.

Butir-butir di atas dirinci sebagai **BLOCKED** pada §14.

### 1.4 Referensi

- `docs/proposal/proposal proyek capstone.docx` — latar belakang, DTA/PSI/SIA,
  K-Means, dan SAW.
- `docs/bpmn/BPMN.pdf` dan `docs/BPMN-ANALYSIS.md` — lane dan aktivitas BPMN.
- `docs/PRD.md` — ruang lingkup dan kebutuhan.
- `docs/BUSINESS-DECISION-REGISTER.md` — keputusan D-001–D-004 dan OD-001–OD-031.
- `docs/REQUIREMENTS-TRACEABILITY.md` — status kebutuhan dan bukti teknis.
- `docs/VERIFICATION.md` — hasil verifikasi otomatis dan browser yang sudah
  benar-benar dijalankan.

### 1.5 Aturan interpretasi

- Skenario **PASS** hanya diberikan setelah hasil aktual dan bukti dicatat.
- Skenario yang tidak dapat dijalankan karena keputusan belum ada diberi status
  **BLOCKED** dan wajib merujuk ID OD.
- Baseline teknis saat ini bukan pengganti keputusan bisnis. Misalnya, route
  Admin/Prodi yang saat ini berbagi akses tidak berarti matriks izin sudah
  disetujui.
- Dokumen ini tidak mengubah `.env`, data pengembangan, status pengajuan,
  rekomendasi, role, atau keputusan terbuka.

## 2. Definisi status dan bukti

### 2.1 Status hasil

| Status | Arti |
|---|---|
| `NOT RUN` | Skenario sudah direncanakan tetapi belum dijalankan. |
| `PASS` | Hasil aktual sama dengan hasil yang diharapkan dan bukti tersimpan. |
| `FAIL` | Hasil aktual berbeda; defect wajib dicatat dan ditriase. |
| `BLOCKED` | Tidak dapat dijalankan karena keputusan bisnis/implementasi belum tersedia; cantumkan OD. |
| `N/A` | Di luar ruang lingkup atau memang tidak boleh ada sesuai keputusan yang sudah dikonfirmasi. |
| `PARTIAL` | Baseline teknis berjalan, tetapi acceptance bisnis belum dapat diselesaikan karena OD terkait. |

### 2.2 Bukti minimum

Setiap skenario wajib menyimpan bukti berikut di folder UAT di luar repository
(misalnya `uat-evidence/2026-10-22/<ID>/`):

- screenshot halaman sebelum dan sesudah aksi;
- request/response network yang relevan, dengan token dan password disunting;
- ID record uji, bukan data pengembangan;
- hasil query read-only bila perlu membuktikan status/relasi;
- catatan waktu, browser, role, dan eksekutor;
- defect ID bila status `FAIL`.

Jangan menyimpan password, token Bearer, cookie, `.env`, database dump, atau
dokumen pribadi nyata di repository.

## 3. Prasyarat dan setup pengujian

### 3.1 Isolasi lingkungan

UAT **wajib** memakai lingkungan dan data terpisah dari data pengembangan:

| Komponen | Ketentuan UAT |
|---|---|
| Database | Database UAT khusus, terpisah dari database pengembangan. Jangan mengarahkan UAT ke database pengembangan. |
| Storage | Disk/storage UAT khusus untuk surat penerimaan. Jangan memakai `backend/storage` pengembangan. |
| Backend | Instance UAT dengan environment UAT; `.env` repository tidak diubah. |
| Frontend | Build/dev server UAT dengan `VITE_API_BASE_URL` menuju backend UAT. |
| Akun | Akun uji yang dibuat khusus; tidak ada akun produksi atau akun pengembangan. |
| Data | Semua nama data uji memakai awalan `UAT-`. |
| Rekomendasi | `RECOMMENDATION_ENABLED=false`; jangan mengaktifkan ranking untuk UAT. |

Jangan menjalankan `migrate:fresh`, reset database, atau operasi destruktif
pada database pengembangan. Untuk lingkungan UAT, provision database kosong
dengan migration yang sama secara terkontrol, lalu isi akun dan mitra uji.
Perintah operasional untuk container PostgreSQL, storage, cache, port, dan
environment UAT yang terpisah dari development ada di
[`UAT-OPERATIONAL-CHECKLIST.md`](UAT-OPERATIONAL-CHECKLIST.md).

### 3.2 Akun uji

Password dibuat acak oleh operator UAT dan disimpan di password manager atau
secret store. Password tidak boleh ditulis di dokumen ini, tiket, screenshot,
atau repository.

| Kode akun | Role | Kegunaan | Data awal |
|---|---|---|---|
| `UAT-ADM-01` | `admin` | CRUD mitra, keputusan, komunikasi, surat, DPM | Tidak ada pengajuan |
| `UAT-PRD-01` | `prodi` | Daftar/detail pengajuan, komunikasi, keputusan | Tidak ada pengajuan |
| `UAT-MHS-01` | `mahasiswa` | Alur utama pengajuan, diterima, surat PDF | Tidak ada pengajuan |
| `UAT-MHS-02` | `mahasiswa` | Alur ditolak dan isolasi data | Tidak ada pengajuan |
| `UAT-MHS-03` | `mahasiswa` | Opsional: surat JPEG | Tidak ada pengajuan |
| `UAT-MHS-04` | `mahasiswa` | Opsional: surat PNG | Tidak ada pengajuan |
| `UAT-DPM-01` | `dpm` | DPM yang ditugaskan ke `UAT-MHS-01` | Tidak ada penempatan |
| `UAT-DPM-02` | `dpm` | DPM tanpa penugasan untuk uji isolasi | Tidak ada penempatan |

Mitra **tidak memiliki akun** sesuai D-003. Komunikasi dengan mitra dicatat
manual oleh Admin/Prodi.

### 3.3 Data mitra uji

| Kode | Nama tampilan | Kegunaan |
|---|---|---|
| `UAT-MITRA-01` | `UAT Mitra Alpha` | Pengajuan utama `UAT-MHS-01` |
| `UAT-MITRA-02` | `UAT Mitra Beta` | Pengajuan `UAT-MHS-02` dan uji isolasi |
| `UAT-MITRA-03` | `UAT Mitra Gamma` | Opsional untuk surat JPEG/PNG |

Jangan mengisi kriteria, bobot SAW, atau nilai mitra resmi untuk UAT. Modul
kriteria boleh diperiksa hanya sebagai smoke test teknis; isi contoh tidak boleh
disebut sebagai data resmi.

### 3.4 Urutan pembuatan data

Urutan ini menjaga agar satu record tidak dipakai untuk dua aturan yang
bertentangan:

1. Operator UAT menyiapkan akun dan mitra di database UAT.
2. `UAT-MHS-01` membuat pengajuan ke `UAT-MITRA-01` sehingga status awal
   `menunggu`.
3. Admin menjalankan komunikasi, keputusan diterima, dan penetapan DPM.
4. `UAT-MHS-01` mengunggah surat valid dan mengunduhnya.
5. `UAT-MHS-02` membuat pengajuan ke `UAT-MITRA-02`; Prodi mencatat komunikasi
   dan keputusan ditolak.
6. Jika matriks format surat dijalankan, `UAT-MHS-03`/`UAT-MHS-04` membuat
   pengajuan terpisah dan Admin menerimanya sebelum unggahan JPEG/PNG.
7. DPM-01 dan DPM-02 diuji setelah penempatan utama terbentuk.

Jangan menguji lamaran ganda dengan satu akun; aturan tersebut masih menunggu
OD-019.

### 3.5 Alat dan batas pengujian

- Browser utama: Chrome desktop versi stabil.
- Browser lain belum menjadi syarat sampai OD-028 menetapkan matriks dukungan.
- Login dibatasi 5 percobaan per menit; beri jeda bila mengulang login.
- Gunakan fixture surat yang dibuat khusus UAT, bukan dokumen pribadi nyata.
- Ukuran batas unggah mengikuti respons
  `GET /api/mahasiswa/acceptance-letter/limit`; jangan mengubah konfigurasi
  server hanya untuk membuat skenario lulus.
- Rekomendasi tetap nonaktif; kegagalan/ketidaksiapan layanan algoritma bukan
  defect UAT selama status `not_ready` ditampilkan dengan benar.

## 4. Matriks cakupan per role

| Area | Admin | Prodi | Mahasiswa | DPM |
|---|---|---|---|---|
| Login/logout | Ya | Ya | Ya | Ya |
| CRUD mitra | Ya | Tidak (baseline saat ini) | Tidak | Tidak |
| Kriteria/mata kuliah | Smoke test teknis | Smoke test teknis | Tidak | Tidak |
| Daftar semua pengajuan | Ya | Ya | Tidak | Tidak |
| Detail pengajuan | Ya | Ya | Milik sendiri | Yang ditugaskan |
| Keputusan diterima/ditolak | Ya | Ya | Lihat hasil | Lihat status |
| Komunikasi mitra manual | Ya | Ya | Tidak | Tidak |
| Unggah surat | Tidak | Tidak | Milik sendiri, setelah diterima | Tidak |
| Unduh surat | Ya | Ya | Milik sendiri | Tidak |
| Tetapkan DPM | Ya | Ya | Tidak | Tidak |
| Daftar/detail bimbingan | Tidak | Tidak | Tidak | Milik sendiri |
| Rekomendasi resmi | Tidak | Tidak | Tidak (nonaktif) | Tidak |

Tabel ini menggambarkan **baseline teknis**. Kewenangan resmi Admin/Prodi
tetap menunggu OD-001–OD-003.

## 5. Skenario autentikasi dan navigasi lintas role

| ID | Skenario | Langkah ringkas | Hasil yang diharapkan | Bukti | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| UAT-AUTH-01 | Login tiap role | Login `UAT-ADM-01`, `UAT-PRD-01`, `UAT-MHS-01`, `UAT-DPM-01` dengan kredensial yang diberikan operator | Login berhasil; nama/role tampil; menu sesuai baseline; refresh mempertahankan sesi | Screenshot header dan network `POST /api/auth/login`, `GET /api/auth/me` | Empat role berhasil login, header menampilkan nama/role, dan refresh mempertahankan sesi melalui GET /api/auth/me. | PASS |
| UAT-AUTH-02 | Kredensial salah | Login dengan email benar dan password salah | Pesan generik “Email atau password tidak valid.”; tidak ada token/session; tidak membocorkan role | Screenshot dan response 401/422 | Respons 422 dan pesan generik "Email atau password tidak valid."; sessionStorage tidak berisi token. | PASS |
| UAT-AUTH-03 | Rate limit login | Lakukan 6 percobaan gagal dalam satu menit | Percobaan ke-6 ditolak 429 dan pesan menunggu; setelah jeda, login valid berhasil | Response 429 dan timestamp | Percobaan 1–5 422; percobaan ke-6 429; setelah 61 detik login valid MHS4 berhasil. | PASS |
| UAT-AUTH-04 | Logout | Klik Logout pada header | Kembali ke `/login`; token aktif dicabut; route terlindungi tidak dapat dibuka tanpa login | Network `POST /api/auth/logout`; buka ulang route | Logout mengembalikan ke /login; GET /auth/me dengan token lama 401; /admin/pengajuan diarahkan ke login. | PASS |
| UAT-AUTH-05 | Redirect tujuan lama lintas role | Logout; buka `/admin/pengajuan` tanpa login; login sebagai Mahasiswa | Mahasiswa tidak diarahkan ke halaman Admin; diarahkan ke halaman aman `/` | URL akhir dan screenshot | Setelah login, Mahasiswa 01 diarahkan ke / dan bukan ke /admin/pengajuan. | PASS |
| UAT-AUTH-06 | Redirect mahasiswa ke Admin | Logout; buka `/mahasiswa/pengajuan` tanpa login; login sebagai Admin | Admin tidak diarahkan ke halaman mahasiswa; diarahkan ke halaman aman `/` | URL akhir dan screenshot | Setelah login, Admin 01 diarahkan ke / dan bukan ke /mahasiswa/pengajuan. | PASS |
| UAT-AUTH-07 | Akses langsung per role | Buka route role lain secara langsung: Mahasiswa ke `/mitra`, Prodi ke `/mitra`, DPM ke `/admin/pengajuan`, Admin ke `/dpm/bimbingan` | Layar “Akses ditolak”; tidak ada request API data yang dilindungi | Screenshot dan network | Keempat role menerima layar Akses ditolak; tidak ada request data modul terlarang pada irisan network. | PASS |
| UAT-AUTH-08 | Sesi tidak valid | Hapus token di sessionStorage atau gunakan token kedaluwarsa yang disediakan operator | Request terlindungi menghasilkan 401; UI kembali ke login tanpa menampilkan data | Network 401 dan screenshot | Token tidak valid menghasilkan GET /auth/me 401 dan redirect ke /login tanpa data bimbingan. | PASS |

## 6. Skenario Admin

| ID | Skenario | Langkah ringkas | Hasil yang diharapkan | Bukti | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| UAT-ADM-01 | Empty state pengajuan | Buka `/admin/pengajuan` sebelum ada pengajuan | Empty state tampil; tidak ada exception; tidak ada data mitra palsu | Screenshot dan console | Empty state "Belum ada pengajuan" tampil; console tidak memuat exception. | PASS |
| UAT-ADM-02 | CRUD mitra | Tambah `UAT Mitra Delta`, ubah nama, hapus sebelum dipakai | Tambah/ubah/hapus berhasil; validasi field wajib; data hilang dari daftar setelah hapus | Screenshot, network, dan empty state | Validasi nama wajib tampil; create/edit/delete berhasil dan Delta hilang dari daftar. | PASS |
| UAT-ADM-03 | Mitra yang sudah dipakai | Coba hapus `UAT-MITRA-01` setelah dipakai pengajuan | Ditolak 409 dengan pesan jelas; data mitra tetap ada | Response 409 dan screenshot | Respons DELETE /api/admin/partners/3 adalah 409 dan Alpha tetap ada, tetapi UI hanya menampilkan "Mitra magang gagal dihapus. Coba lagi." tanpa alasan konflik. Defect UAT-DEF-01. Perbaikan kode dan regression test ditambahkan 23 Oktober 2026; retest browser belum dijalankan. | FAIL (fixed, retest pending) |
| UAT-ADM-04 | Daftar pengajuan | Buka daftar setelah `UAT-MHS-01` dan `UAT-MHS-02` membuat pengajuan | Kedua pengajuan tampil dengan nama, mitra, tanggal, status, dan aksi detail | Screenshot dan network | Kedua pengajuan tampil lengkap dengan nama, email, mitra, status Menunggu, dan tautan Lihat detail. | PASS |
| UAT-ADM-05 | Detail pending | Buka detail pengajuan `UAT-MHS-01` | Status menunggu; form keputusan tampil; panel DPM/surat tidak tampil; catatan review kosong | Screenshot dan network detail | Status Menunggu, form Catat keputusan tampil, panel DPM/surat tidak tampil, catatan review kosong. | PASS |
| UAT-ADM-06 | Komunikasi outbound | Catat arah “Dikirim ke mitra”, kanal email, waktu, ringkasan | Catatan muncul; pencatat dan waktu server benar; status tetap menunggu; tidak ada email terkirim | Screenshot dan response 201 | Catatan outbound tersimpan 201, muncul dengan pencatat UAT Admin 01; status MHS1 tetap menunggu; UI menyatakan sistem tidak mengirim email/surat. | PASS |
| UAT-ADM-07 | Komunikasi inbound | Catat balasan mitra via surat | Catatan muncul sebagai balasan; urutan waktu benar; status tidak berubah otomatis | Screenshot dan response | Balasan inbound tersimpan, tampil lebih awal dari outbound sesuai waktu, dan status tetap menunggu. | PASS |
| UAT-ADM-08 | Validasi komunikasi | Kirim form kosong, arah/kanal tidak valid, dan ringkasan >2000 karakter | Pesan validasi per field; tidak ada record baru | Screenshot dan network | Ringkasan kosong ditolak klien tanpa POST; direct request arah/kanal/ringkasan tidak valid ditolak 422; jumlah record tetap 2. | PASS |
| UAT-ADM-09 | Keputusan diterima | Pilih Diterima dan isi catatan, lalu simpan | Status menjadi diterima; reviewer/waktu/catatan tampil; form keputusan hilang; reversal tidak tersedia | Screenshot dan response | Status Diterima, reviewer UAT Admin 01, waktu dan catatan tampil; form keputusan hilang; panel Penempatan DPM dan Surat penerimaan tersedia. | PASS |
| UAT-ADM-10 | Keputusan ganda | Coba kirim keputusan lagi melalui UI atau request langsung | UI tidak menyediakan aksi; request ditolak 409; status tidak berubah | Screenshot/response 409 | Form keputusan tidak tampil; PATCH kedua ditolak 409; status tetap diterima. | PASS |
| UAT-ADM-11 | Keputusan ditolak | Pada pengajuan `UAT-MHS-02`, pilih Ditolak dan isi catatan | Status ditolak; catatan terlihat; panel DPM/surat tidak tersedia | Screenshot dan response |  | NOT RUN |
| UAT-ADM-12 | Penetapan DPM | Pada pengajuan diterima, pilih `UAT DPM 01` dan tetapkan | Penempatan tersimpan; DPM tampil; hanya satu DPM; tidak ada aksi ganti | Screenshot dan response 201 | UAT DPM 01 berhasil ditetapkan 201; nama DPM tampil; form penggantian tidak tersedia. | PASS |
| UAT-ADM-13 | DPM pada status salah | Coba tetapkan DPM pada pengajuan menunggu/ditolak melalui request langsung | Ditolak 409; tidak ada penempatan | Response 409 | Request DPM pada pengajuan ditolak menghasilkan 409; tidak ada penempatan. | PASS |
| UAT-ADM-14 | Unduh surat | Setelah `UAT-MHS-01` mengunggah surat, klik unduh/pratinjau | Berkas terunduh; nama asli tampil; tidak ada URL publik; tipe/ukuran sesuai | Download dan response header | Admin mengunduh berkas melalui endpoint terotorisasi; nama asli dan ukuran sesuai; tidak ada URL publik pada UI. | PASS |
| UAT-ADM-15 | ID tidak valid | Buka `/admin/pengajuan/999999` | State error “tidak ditemukan”; tidak ada data ID sebelumnya; tombol retry hanya tampil untuk ID valid | Screenshot | Halaman menampilkan error detail gagal dimuat/tidak ditemukan; tidak ada data pengajuan lain. | PASS |
| UAT-ADM-16 | Perubahan ID tanpa unmount | Dari detail `UAT-MHS-01`, buka detail `UAT-MHS-02` melalui navigasi | Loading langsung tampil; data lama hilang; hanya data ID baru yang tampil | Screenshot sebelum/sesudah dan network | Saat ID berubah, state loading tampil tanpa data MHS1; setelah respons MHS2, hanya data MHS2 yang tampil. | PASS |
| UAT-ADM-17 | Respons terlambat | Gunakan DevTools throttling/network delay saat berpindah ID | Respons ID lama tidak menimpa data ID baru; error ID lama tidak muncul di ID baru | Network timing dan screenshot | Respons MHS2 yang terlambat diabaikan; UI tetap menampilkan data MHS1 setelah respons tersebut tiba. | PASS |

## 7. Skenario Prodi

| ID | Skenario | Langkah ringkas | Hasil yang diharapkan | Bukti | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| UAT-PRD-01 | Akses baseline Prodi | Login `UAT-PRD-01`; buka `/admin/pengajuan`, `/kriteria`, `/mata-kuliah`, `/admin/analitik` | Halaman baseline terbuka; tidak ada error tak tertangani | Screenshot dan network | Keempat halaman baseline terbuka tanpa layar akses ditolak maupun exception JavaScript. | PASS |
| UAT-PRD-02 | Mitra khusus Admin | Prodi membuka `/mitra` | Layar akses ditolak; tidak ada request data mitra | Screenshot dan network | Layar Akses ditolak tampil; tidak ada request GET /api/admin/partners. | PASS |
| UAT-PRD-03 | Daftar/detail semua pengajuan | Buka daftar dan detail `UAT-MHS-01`/`UAT-MHS-02` | Data pengajuan, mahasiswa, mitra, status, dan catatan review tampil | Screenshot dan network | Prodi melihat kedua pengajuan dan detailnya, termasuk mahasiswa, mitra, status, serta catatan review kosong. | PASS |
| UAT-PRD-04 | Komunikasi tanpa ubah status | Catat balasan mitra pada pengajuan yang sudah diterima | Catatan muncul; status tetap diterima; reviewer/waktu keputusan tidak berubah | Screenshot dan response | Balasan Prodi tersimpan 201; status, reviewer, waktu, dan catatan keputusan tetap sama. | PASS |
| UAT-PRD-05 | Keputusan Prodi | Pada `UAT-MHS-02`, catat Ditolak dengan catatan | Status ditolak; mahasiswa melihat hasil; tidak ada panel surat/DPM | Screenshot dan response | Keputusan ditolak tersimpan; catatan tampil; panel surat/DPM tidak tersedia. | PASS |
| UAT-PRD-06 | Unduh surat | Buka detail `UAT-MHS-01` dan unduh surat | Unduhan berhasil melalui endpoint terotorisasi | Response download | Prodi berhasil mengunduh surat MHS1; nama asli dan ukuran sesuai. | PASS |
| UAT-PRD-07 | Batas kewenangan resmi | Bandingkan aksi yang tersedia dengan matriks izin yang disetujui | **Tidak dapat disetujui** sampai OD-001–OD-003 ditetapkan; baseline teknis dicatat terpisah, bukan sebagai acceptance | Dokumen keputusan |  | BLOCKED (OD-001–OD-003) |

## 8. Skenario Mahasiswa

| ID | Skenario | Langkah ringkas | Hasil yang diharapkan | Bukti | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| UAT-MHS-01 | Empty state | Login `UAT-MHS-01`; buka dashboard dan pengajuan sebelum ada data | Empty state jelas; tidak ada data mahasiswa lain | Screenshot | Dashboard dan daftar pengajuan menampilkan empty state; tidak ada nama mahasiswa lain. | PASS |
| UAT-MHS-02 | Buat pengajuan | Pilih `UAT Mitra Alpha`, kirim pengajuan | Status awal menunggu; data mitra benar; pengajuan muncul di daftar sendiri | Screenshot dan response 201 | Pengajuan MHS1 Alpha (record 9) dan MHS2 Beta dibuat dengan status Menunggu; masing-masing muncul di daftar pemilik. | PASS |
| UAT-MHS-03 | Validasi form pengajuan | Kirim tanpa memilih mitra; kirim ID mitra tidak valid | Pesan validasi; tidak ada request/record baru | Screenshot/network | Submit kosong menampilkan "Pilih mitra magang terlebih dahulu." tanpa POST; direct request partner_id 999999 ditolak 422. | PASS |
| UAT-MHS-04 | Daftar hanya milik sendiri | Login `UAT-MHS-02`; buka daftar pengajuan | Hanya pengajuan `UAT-MHS-02`; pengajuan `UAT-MHS-01` tidak tampil | Screenshot dan network | Daftar MHS1 hanya memuat Alpha; daftar MHS2 hanya memuat Beta; tidak ada kebocoran antarmahasiswa. | PASS |
| UAT-MHS-05 | Detail milik orang lain | Saat login `UAT-MHS-02`, minta endpoint detail pengajuan `UAT-MHS-01` secara langsung | State tidak ditemukan/404; tidak ada nama, mitra, status, atau surat | Screenshot dan response 404 | Endpoint detail milik MHS1 menghasilkan 404; tidak ada payload data MHS1 pada respons. | PASS |
| UAT-MHS-06 | Surat pada status menunggu | Buka detail pengajuan menunggu | Panel unggah tidak tersedia; request langsung ke endpoint unggah ditolak 409 | Screenshot/response | Panel surat tidak tampil pada status menunggu; request langsung ditolak 409. | PASS |
| UAT-MHS-07 | Melihat keputusan diterima | Setelah Admin menerima, buka detail | Status diterima; catatan review; DPM; panel surat tersedia | Screenshot | MHS1 melihat status Diterima, catatan review, panel surat (belum diunggah), dan DPM belum ditetapkan. | PASS |
| UAT-MHS-08 | Unggah surat valid | Unggah PDF UAT yang valid dan berada di bawah batas | Unggah berhasil; metadata nama/tipe/ukuran tampil; file privat | Screenshot, response 201, storage path tidak terekspos | PDF valid terunggah 201; metadata nama, tipe application/pdf, ukuran tampil; respons tidak memuat path/disk. | PASS |
| UAT-MHS-09 | Unduh surat sendiri | Klik unduh/pratinjau | Berkas terunduh; hanya untuk pengajuan sendiri | Response download | Unduhan melalui endpoint terautentikasi berhasil; nama asli dan ukuran sesuai fixture. | PASS |
| UAT-MHS-10 | Penggantian surat | Setelah surat ada, cari aksi unggah ulang; coba request langsung | Aksi tidak tersedia; request penggantian ditolak 409; surat lama tetap | Screenshot/response 409 | Form unggah tidak tampil; request penggantian 409; metadata/ID surat lama tidak berubah. | PASS |
| UAT-MHS-11 | Melihat penolakan | Setelah Prodi menolak `UAT-MHS-02`, buka detail | Status ditolak; catatan terlihat; tidak ada panel surat/DPM; arahan rekomendasi alternatif tidak menyatakan pengajuan ada di halaman rekomendasi | Screenshot dan network | MHS2 melihat status Ditolak dan catatan; tidak ada panel surat/DPM. | PASS |
| UAT-MHS-12 | Rekomendasi nonaktif | Buka `/mahasiswa/rekomendasi` | Status belum siap/`not_ready`; tidak ada ranking yang diklaim resmi; tidak ada aktivasi | Screenshot dan response | Halaman menampilkan Rekomendasi belum dapat dihitung; API mengembalikan status not_ready; tidak ada ranking/aktivasi. | PASS |
| UAT-MHS-13 | Profil/peminatan | Buka `/mahasiswa` dan coba simpan peminatan | Data tersimpan terbaca; penulisan tetap ditolak/di luar scope sampai OD-015; tidak ada field akademik karangan | Screenshot dan response 409 |  | BLOCKED (OD-006, OD-015) |
| UAT-MHS-14 | Nilai akademik | Buka `/mahasiswa/nilai` | Nilai milik sendiri tampil; status prasyarat “belum dikonfigurasi”; tidak ada klaim lulus/tidak lulus | Screenshot |  | BLOCKED (OD-007, OD-008) |
| UAT-MHS-15 | Riwayat komunikasi | Buka detail pengajuan | Riwayat komunikasi internal Admin/Prodi tidak tampil | Screenshot dan response | Ringkasan komunikasi internal tidak tampil di UI dan payload pengajuan tidak memuat relasi communications. | PASS |

## 9. Skenario DPM

| ID | Skenario | Langkah ringkas | Hasil yang diharapkan | Bukti | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| UAT-DPM-01 | Empty state sebelum penugasan | Login `UAT-DPM-01` sebelum DPM ditetapkan | Daftar kosong; tidak ada mahasiswa lain | Screenshot | Daftar kosong dengan empty state "Belum ada mahasiswa bimbingan"; tidak ada mahasiswa lain. | PASS |
| UAT-DPM-02 | Daftar setelah penugasan | Setelah Admin menetapkan DPM, buka `/dpm/bimbingan` | Hanya `UAT-MHS-01` yang tampil; mitra dan tanggal tampil | Screenshot dan network | Daftar hanya memuat UAT Mahasiswa 01 dengan mitra Alpha dan tanggal pengajuan; tidak ada mahasiswa lain. | PASS |
| UAT-DPM-03 | Isolasi DPM lain | Login `UAT-DPM-02`; buka daftar dan detail milik `UAT-DPM-01` | Daftar kosong; detail langsung menghasilkan state tidak ditemukan/404 | Screenshot dan response 404 | Daftar DPM 02 kosong; detail MHS1 menghasilkan 404. | PASS |
| UAT-DPM-04 | Detail bimbingan | Buka detail `UAT-MHS-01` | Identitas mahasiswa, mitra, status, penempatan, metadata surat tampil | Screenshot | Detail menampilkan UAT Mahasiswa 01, Mitra Alpha, status Diterima, DPM 01, dan metadata surat. | PASS |
| UAT-DPM-05 | Data internal disembunyikan | Periksa detail DPM | Catatan review Admin/Prodi, riwayat komunikasi, dan aksi unduh surat tidak tampil | Screenshot dan response JSON (tanpa field sensitif) | UI tidak menampilkan Riwayat komunikasi atau tombol Unduh surat; payload detail DPM tidak memuat review_note, reviewer, atau communications. | PASS |
| UAT-DPM-06 | Route/ID invalid | Buka `/dpm/bimbingan/999999` dan ID milik DPM lain | Error/404; tidak ada data ID sebelumnya; retry hanya untuk ID valid | Screenshot dan network | ID 999999 dan ID MHS2 sama-sama menghasilkan state error/404 tanpa data bimbingan lama. | PASS |
| UAT-DPM-07 | Perubahan ID tanpa unmount | Dari detail `UAT-MHS-01`, buka ID lain/invalid | Loading segera tampil; data lama hilang; respons lama tidak menimpa | Screenshot dan network timing | Loading tampil saat ID berubah, data MHS1 hilang, lalu state error 404 tanpa data lama. | PASS |
| UAT-DPM-08 | Akses role lain | DPM membuka `/admin/pengajuan`, `/mitra`, `/mahasiswa/pengajuan` | Layar akses ditolak; tidak ada data yang dimuat | Screenshot dan network | Ketiga route menampilkan Akses ditolak tanpa request data modul terlarang. | PASS |
| UAT-DPM-09 | Tindakan bimbingan/penilaian | Cari aksi bimbingan, komunikasi, penilaian, atau ganti DPM | Tidak ada aksi; fitur belum diimplementasikan | Screenshot |  | BLOCKED (OD-024–OD-026) |

## 10. Skenario lintas peran dan isolasi data

| ID | Skenario | Langkah ringkas | Hasil yang diharapkan | Bukti | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| UAT-ISO-01 | Mahasiswa A vs B | Bandingkan daftar/detail/unduhan `UAT-MHS-01` dan `UAT-MHS-02` | Tidak ada data, surat, atau DPM yang bocor antarmahasiswa | Screenshot dan network | Daftar terpisah; cross-detail dan cross-letter 404; DPM hanya melekat pada MHS1. | PASS |
| UAT-ISO-02 | DPM A vs B | Bandingkan daftar/detail `UAT-DPM-01` dan `UAT-DPM-02` | Tidak ada mahasiswa DPM lain; detail lintas DPM 404 | Screenshot dan network | DPM 01 melihat MHS1; DPM 02 kosong; detail lintas DPM 404. | PASS |
| UAT-ISO-03 | Admin/Prodi vs mahasiswa | Mahasiswa mencoba endpoint admin/prodi dengan role sendiri | 403; tidak ada data pengajuan lain | Response 403 | Semua endpoint admin/prodi yang diuji menghasilkan 403 untuk MHS1; tidak ada data yang dikembalikan. | PASS |
| UAT-ISO-04 | DPM vs Admin/Prodi | DPM mencoba endpoint keputusan/komunikasi/unduh surat | 403; tidak ada mutasi data | Response 403 | Semua percobaan menghasilkan 403; status, komunikasi, surat, dan penempatan tidak berubah. | PASS |
| UAT-ISO-05 | Surat privat | Coba akses path storage langsung atau URL publik | 404/akses ditolak; tidak ada URL publik | Response 404/403 | Kedua URL publik mengembalikan 404; berkas ada pada storage privat persisten dan unduhan terautentikasi mengembalikan PDF yang sama. | PASS |
| UAT-ISO-06 | Mitra tanpa akun | Cari halaman/login/portal mitra | Tidak ada portal/akun mitra; hanya pencatatan manual oleh Admin/Prodi | Screenshot/catatan |  | N/A (D-003) |
| UAT-ISO-07 | Dataset bercampur | Pastikan semua data UAT berawalan `UAT-` dan tidak ada data pengembangan | Tidak ada data pengembangan yang tampil/berubah | Daftar record dan query read-only | Semua user, mitra, dan pengajuan pada database UAT berawalan UAT; tidak ada data development pada hasil query. | PASS |

## 11. Skenario validasi unggahan surat

Skenario ini memakai pengajuan yang sudah `diterima`. Jangan menguji penggantian
pada record yang sama setelah unggahan valid; penggantian memang dinonaktifkan
sampai OD-017.

| ID | Skenario | Fixture/aksi | Hasil yang diharapkan | Bukti | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| UAT-UPL-01 | PDF valid | PDF UAT di bawah batas | Diterima; metadata PDF; file privat | Response 201 dan metadata | Metadata PDF (application/pdf) tersimpan; path/disk tidak ada pada payload; file hanya dapat diakses melalui endpoint terautentikasi. | PASS |
| UAT-UPL-02 | JPEG valid | JPEG UAT pada pengajuan terpisah | Diterima; metadata `image/jpeg` | Response 201 |  | NOT RUN |
| UAT-UPL-03 | PNG valid | PNG UAT pada pengajuan terpisah | Diterima; metadata `image/png` | Response 201 |  | NOT RUN |
| UAT-UPL-04 | Tanpa berkas | Klik unggah tanpa memilih file | Validasi klien; tidak ada request/record | Screenshot/network | Pesan "Pilih berkas surat penerimaan terlebih dahulu." tampil; tidak ada POST dan tidak ada file tersimpan. | PASS |
| UAT-UPL-05 | Melebihi batas | File `limit + 1 KB` | Ditolak klien; jika bypass, server 422; tidak ada file tersimpan | Screenshot/response 422 | UI menolak berkas oversize tanpa POST; request langsung oversize ke MHS2 ditolak 422. | PASS |
| UAT-UPL-06 | Tipe tidak didukung | TXT/DOCX/EXE | Ditolak; tidak ada file tersimpan | Response 422 | UI menolak TXT sebelum request; direct request TXT ditolak 422; tidak ada surat tersimpan. | PASS |
| UAT-UPL-07 | Teks bernama `.pdf` | File teks/MIME spoof `application/pdf` | Server mendeteksi isi dan menolak 422; tidak ada file | Response 422 | Server menolak teks bernama .pdf dengan 422; tidak ada surat tersimpan pada MHS1/MHS2. | PASS |
| UAT-UPL-08 | PDF bernama `.php` | PDF valid dengan nama `.php` | Ditolak 422; tidak ada file | Response 422 | Server menolak PDF bernama .php dengan 422; tidak ada surat tersimpan. | PASS |
| UAT-UPL-09 | PDF bernama `.jpg` | PDF valid dengan nama `.jpg` | Server mendeteksi PDF dan menerima sebagai PDF (bukan mempercayai ekstensi) | Response 201 dan `mime_type=application/pdf` |  | NOT RUN |
| UAT-UPL-10 | Status belum diterima | Unggah ke pengajuan menunggu/ditolak | 409; tidak ada file | Response 409 | Panel unggah tidak tampil; direct upload ke pengajuan ditolak 409; tidak ada surat tersimpan. | PASS |
| UAT-UPL-11 | Pengajuan orang lain | Unggah ke ID milik mahasiswa lain | 404; tidak membocorkan keberadaan | Response 404 | Request MHS2 ke pengajuan MHS1 menghasilkan 404; tidak ada file baru. | PASS |
| UAT-UPL-12 | Penggantian | Unggah lagi setelah surat ada | 409; surat lama tetap | Response 409 | UI tidak menyediakan unggah ulang; direct replacement 409; surat lama tetap. | PASS |
| UAT-UPL-13 | Admin/Prodi/DPM | Cari kontrol unggah/unduh DPM dan unggah Admin | Admin/Prodi hanya dapat mengunduh; DPM tidak dapat mengunduh; tidak ada unggah untuk role tersebut | Screenshot/response 403 | DPM GET surat 403; DPM POST 403; Admin POST 403; Prodi POST 405; UI Admin/Prodi hanya menampilkan Unduh surat dan halaman DPM tidak memiliki tombol unduh. | PASS |
| UAT-UPL-14 | Kontrak UI limit | Periksa `accept`, petunjuk, dan validasi klien setelah `GET /api/mahasiswa/acceptance-letter/limit` | Nilai mengikuti allowlist server; fallback tidak digunakan saat respons valid | Screenshot dan network | Input accept memuat PDF/JPG/JPEG/PNG; petunjuk ukuran mengikuti limit server; GET limit mengembalikan allowlist yang sama dan replaceable=false. | PASS |
| UAT-UPL-15 | Allowlist kosong/rusak | Hanya di lingkungan teknis terpisah; ubah konfigurasi UAT, bukan `.env` pengembangan | Fallback aman PDF/JPEG/PNG; bukan allowlist kosong | Catatan konfigurasi dan response |  | N/A (teknis; tercakup test otomatis) |

## 12. Skenario alur utama dan keputusan

| ID | Skenario | Langkah ringkas | Hasil yang diharapkan | Bukti | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| UAT-FLOW-01 | Pengajuan → komunikasi → keputusan → DPM | Jalankan alur `UAT-MHS-01` dari awal sampai penempatan | Setiap langkah tersimpan; status akhir diterima; DPM dan surat dapat dilihat sesuai role | Screenshot, network, dan query read-only | MHS1 berstatus diterima, memiliki komunikasi, surat, dan DPM; mahasiswa dan DPM melihat data sesuai kewenangannya. | PASS |
| UAT-FLOW-02 | Keputusan tanpa komunikasi | Admin menerima pengajuan yang belum pernah dikomunikasikan | Keputusan tetap dapat dicatat; komunikasi bukan syarat yang dikarang | Screenshot dan response |  | NOT RUN |
| UAT-FLOW-03 | Komunikasi setelah keputusan | Catat balasan mitra setelah status diterima | Status, reviewer, dan waktu keputusan tidak berubah | Screenshot dan query read-only | Status diterima, reviewer, waktu, dan catatan keputusan tidak berubah setelah komunikasi. | PASS |
| UAT-FLOW-04 | Penolakan | Prodi menolak `UAT-MHS-02` | Status ditolak; tidak ada DPM/surat; mahasiswa melihat catatan | Screenshot dan query | Status ditolak, catatan terlihat, dan tidak ada panel DPM/surat. | PASS |
| UAT-FLOW-05 | Keputusan final | Coba ubah keputusan setelah tersimpan | Tidak ada UI reversal; request 409; status tetap | Screenshot/response 409 | Tidak ada kontrol reversal; request PATCH 409; status tetap diterima. | PASS |
| UAT-FLOW-06 | Satu DPM per pengajuan | Coba tetapkan DPM kedua | Ditolak 409; penempatan pertama tetap | Response 409 | Request DPM kedua ditolak 409; penempatan UAT DPM 01 tetap. | PASS |
| UAT-FLOW-07 | Urutan surat dan DPM | Tetapkan DPM sebelum/sesudah unggah surat pada pengajuan diterima | Keduanya dapat dilakukan sesuai implementasi; jangan menyimpulkan urutan resmi karena OD-023/OD-024 belum ada | Screenshot |  | BLOCKED (OD-023, OD-024) |

## 13. Skenario state UI dan kualitas dasar

| ID | Skenario | Langkah ringkas | Hasil yang diharapkan | Bukti | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| UAT-UI-01 | Loading state | Throttle network saat memuat daftar/detail | Loading tampil; tidak ada data lama | Screenshot | Loading daftar dan detail tampil saat respons ditunda; tidak ada data lama. | PASS |
| UAT-UI-02 | Error state | Matikan backend sementara atau gunakan route invalid | Pesan error jelas; tombol retry berfungsi untuk ID valid; tidak ada data lama | Screenshot/network | Error state "Pengajuan gagal dimuat" dan tombol Coba lagi tampil; setelah route dipulihkan, retry memuat daftar. | PASS |
| UAT-UI-03 | Empty state | Gunakan akun tanpa data | Empty state spesifik per halaman | Screenshot | MHS4 menampilkan empty state pengajuan pada dashboard/daftar; DPM 02 menampilkan empty state bimbingan; tidak ada data akun lain. | PASS |
| UAT-UI-04 | Responsif dasar | Uji 320×568 dan 390×844 untuk login, daftar, detail, form | Tidak ada konten terpotong yang menghalangi aksi; fokus keyboard terlihat | Screenshot | Login, daftar, form, dan detail tetap dapat digunakan pada viewport mobile; tidak ada overflow dokumen yang menghalangi aksi. | PASS |
| UAT-UI-05 | Aksesibilitas dasar | Navigasi keyboard pada login/form/dialog; cek label | Fokus terlihat; label dan pesan error terbaca; tidak ada kontrol tanpa nama | Screenshot dan catatan | Field Email/Password memiliki label; Tab memindahkan fokus ke field password; dialog memberi fokus ke Nama instansi dan dapat ditutup dengan Escape. | PASS |
| UAT-UI-06 | Console bersih | Jalankan alur utama dengan DevTools | Tidak ada exception JavaScript tak tertangani; 404 lintas role yang diharapkan bukan exception | Console log | Tidak ada pageerror/exception JavaScript tak tertangani pada alur utama; pesan resource 4xx yang diharapkan tidak dihitung sebagai exception. | PASS |

## 14. Matriks BLOCKED — keputusan bisnis belum disetujui

Semua baris di bawah ini **tidak boleh** diberi status PASS atau dianggap
acceptance criteria final. Status awalnya `BLOCKED`. Rujukan utama adalah
`docs/BUSINESS-DECISION-REGISTER.md`.

| ID | Skenario/ketentuan yang belum dapat diuji | OD terkait | Alasan/Gate | Status |
|---|---|---|---|---|
| UAT-BLK-01 | Matriks kewenangan Admin, Prodi, dan seluruh role | OD-001–OD-003 | Belum ada matriks izin resmi; baseline teknis bukan keputusan | BLOCKED |
| UAT-BLK-02 | Mekanisme login/provisioning Admin, Prodi, dan DPM | OD-004 | BPMN tidak eksplisit; mekanisme resmi belum ditetapkan | BLOCKED |
| UAT-BLK-03 | Sumber akun dan registrasi mahasiswa | OD-005 | BPMN dimulai dari login; registrasi belum diputuskan | BLOCKED |
| UAT-BLK-04 | Field profil mahasiswa (NIM, prodi, fakultas, angkatan, status) | OD-006 | Field dan cakupan MVP belum ditetapkan | BLOCKED |
| UAT-BLK-05 | Sumber nilai, skala, dan histori nilai | OD-007 | Sumber dan kebijakan nilai belum ada | BLOCKED |
| UAT-BLK-06 | Mata kuliah prasyarat, ambang lulus, dan eligibility | OD-008 | Daftar/ambang belum ada; data tidak valid belum ditangani | BLOCKED |
| UAT-BLK-07 | Atribut dan preprocessing K-Means | OD-009 | Vektor fitur belum ditetapkan | BLOCKED |
| UAT-BLK-08 | Jumlah cluster dan metode penentuannya | OD-010 | Parameter cluster belum ditetapkan | BLOCKED |
| UAT-BLK-09 | Target clustering dan penggunaan hasil | OD-011 | Hubungan cluster dengan filter/SAW belum jelas | BLOCKED |
| UAT-BLK-10 | Kriteria SAW, bobot, skala, dan total bobot | OD-012 | Tidak ada daftar/bobot resmi | BLOCKED |
| UAT-BLK-11 | Benefit/cost, normalisasi, nilai kosong/nol | OD-013 | Rumus dan perilaku nilai belum ditetapkan | BLOCKED |
| UAT-BLK-12 | Jumlah ranking, tie-break, hasil kosong, kegagalan algoritma | OD-014 | Kebijakan ranking belum ditetapkan | BLOCKED |
| UAT-BLK-13 | Kardinalitas peminatan dan pemetaan DTA/PSI/SIA | OD-015 | Mode dan pemetaan mitra belum ditetapkan | BLOCKED |
| UAT-BLK-14 | Status antara, pembatalan, pengunduran diri, reversal | OD-016 | Hanya Diterima/Ditolak yang eksplisit; state machine belum ada | BLOCKED |
| UAT-BLK-15 | Verifikasi, revisi, dan penolakan dokumen | OD-017 | Alur dokumen belum ditetapkan | BLOCKED |
| UAT-BLK-16 | Penolakan mitra, pembatalan, dan pengajuan ulang | OD-018 | Aturan final dan pengajuan ulang belum ditetapkan | BLOCKED |
| UAT-BLK-17 | Lamaran ke beberapa mitra sekaligus | OD-019 | Batas lamaran belum diputuskan | BLOCKED |
| UAT-BLK-18 | Penyusunan/pengiriman email atau surat otomatis | OD-020 | Sistem saat ini hanya mencatat manual; pengirim/template belum ditetapkan | BLOCKED |
| UAT-BLK-19 | Tenggat respons, pengingat, dan sumber kebenaran status | OD-021 | Status hasil seleksi dan tenggat belum ditetapkan | BLOCKED |
| UAT-BLK-20 | Template, format, dan riwayat surat resmi | OD-022 | Template/riwayat belum ditetapkan | BLOCKED |
| UAT-BLK-21 | Waktu/pihak/kriteria/beban/persetujuan DPM | OD-023–OD-024 | Penetapan dasar sudah teknis, tetapi aturan resmi dan penggantian belum ada | BLOCKED |
| UAT-BLK-22 | Kewenangan, bimbingan, komunikasi, penilaian DPM | OD-025 | DPM saat ini read-only; cakupan bimbingan belum ditetapkan | BLOCKED |
| UAT-BLK-23 | Batas MVP dan penyelesaian magang | OD-026 | Definisi akhir proses belum ditetapkan | BLOCKED |
| UAT-BLK-24 | Keamanan, privasi, audit trail, retensi | OD-027 | Kebijakan keamanan dan audit belum disetujui | BLOCKED |
| UAT-BLK-25 | Kinerja, backup, dan acceptance criteria produksi | OD-028 | Target dan prosedur belum ditetapkan | BLOCKED |
| UAT-BLK-26 | Notifikasi mahasiswa/mitra dan dashboard | OD-029 | Pemicu, kanal, dan template belum ditetapkan | BLOCKED |
| UAT-BLK-27 | Laporan, integrasi, dan pengelolaan pengguna | OD-030 | Scope fitur tambahan belum diputuskan | BLOCKED |
| UAT-BLK-28 | Histori rekomendasi dan banding | OD-031 | Belum diputuskan | BLOCKED |
| UAT-BLK-29 | Ranking rekomendasi resmi dan aktivasi pipeline | OD-007–OD-015 | `RECOMMENDATION_ENABLED=false`; parameter belum lengkap | BLOCKED |
| UAT-BLK-30 | Kanal WhatsApp | OD-020 (dan D-003) | D-003 hanya menyebut email/surat; WhatsApp belum diputuskan | BLOCKED |
| UAT-BLK-31 | Portal/akun mitra | D-003 | D-003 sudah mengonfirmasi mitra tanpa akun; skenario ini memang tidak termasuk | N/A (D-003) |

## 15. Kriteria keluar UAT

UAT dapat dinyatakan selesai untuk scope yang diuji apabila:

1. Seluruh skenario wajib yang berstatus `NOT RUN` sudah dijalankan dan diberi
   hasil aktual serta bukti.
2. Tidak ada defect kritis/blocker yang masih terbuka pada scope yang diuji.
3. Semua skenario `BLOCKED` sudah dikonfirmasi sebagai deferral oleh pemilik
   produk dan dirujuk ke OD yang tepat.
4. Tidak ada data pengembangan, `.env`, token, password, atau dokumen pribadi
   yang masuk ke repository atau bukti UAT.
5. Rekomendasi tetap nonaktif dan tidak ada parameter bisnis yang diisi tanpa
   keputusan.
6. Pemilik produk menandatangani hasil UAT dan daftar deferral.

Dokumen ini **belum** menyatakan UAT selesai. Eksekusi browser teknis sudah
menghasilkan 78 `PASS` dan 1 `FAIL`, tetapi masih ada 5 `NOT RUN`, 35 `BLOCKED`,
3 `N/A`, satu defect terbuka, dan belum ada tanda tangan/persetujuan pemilik
produk. Status pada §5–§13 karena itu tidak boleh dibaca sebagai acceptance
bisnis final.

## 16. Pelaporan defect

Setiap defect minimal memuat:

- ID skenario UAT dan langkah reproduksi;
- role, akun uji, dan ID record;
- hasil yang diharapkan versus hasil aktual;
- screenshot/network log yang sudah disunting;
- browser dan waktu;
- dampak terhadap data/keamanan;
- OD terkait bila masalah berasal dari keputusan yang belum ada.

Jangan menandai defect sebagai bug aplikasi jika penyebabnya adalah keputusan
bisnis yang belum disetujui. Sebaliknya, jangan menutup defect keamanan/data
hanya karena ada OD yang belum selesai.

### 16.1 Defect hasil eksekusi browser (23 Oktober 2026)

| ID | Skenario | Komponen | Tingkat | Hasil yang diharapkan | Hasil aktual | Bukti | Status |
|---|---|---|---|---|---|---|---|
| `UAT-DEF-01` | `UAT-ADM-03` | `frontend/src/components/partners/DeletePartnerDialog.tsx` dan `frontend/src/lib/apiError.ts` | Minor (UX/pesan error) | Penghapusan mitra yang masih dipakai ditolak 409 dengan alasan konflik yang jelas | Backend menolak dengan 409 dan data Alpha tetap ada, tetapi UI menampilkan fallback `Mitra magang gagal dihapus. Coba lagi.` tanpa alasan konflik | `$UAT_PERSIST/evidence/browser/2026-10-23/UAT-ADM-03/`; network 409 | Fixed in code; automated regression added; browser retest pending |

Reproduksi: login Admin 01, buka `/mitra`, pilih Hapus pada `UAT Mitra Alpha`
(ID mitra `3`), lalu konfirmasi. Jangan mengulang penghapusan pada data
development. Dampak: pengguna tidak mengetahui bahwa mitra tidak dapat dihapus
karena masih memiliki pengajuan; integritas data tetap terjaga.

## 17. Catatan verifikasi teknis yang sudah ada

Dokumen ini adalah rencana UAT dengan hasil eksekusi teknis, bukan acceptance
final. Verifikasi otomatis dan browser yang sudah dijalankan dicatat di
`docs/VERIFICATION.md` dan §17.1–§17.6, termasuk PHPUnit, Vitest, Node test,
Python unittest, Pint, ESLint, build, smoke test UAT, dan eksekusi browser
Chrome headless. Hasil tersebut tidak menggantikan UAT oleh Admin, Prodi,
mahasiswa, dan DPM sebenarnya.

### 17.1 Pemeriksaan ulang pada pass finalisasi (22 Oktober 2026)

| Pemeriksaan | Hasil aktual pass ini |
|---|---|
| PHPUnit backend | 205 test, 1.351 assertion, lulus |
| Laravel Pint | Lulus |
| Unit test Node frontend | 55 test, lulus |
| Test komponen Vitest | 121 test pada 14 file, lulus |
| ESLint | Lulus |
| TypeScript dan Vite build | Lulus |
| Python `unittest` | 44 test, lulus dengan `algorithm/.venv/bin/python` |
| `git diff --check` | Lulus, exit code `0` |
| PostgreSQL runtime | Container Podman `spk-magang-postgres` ditemukan berhenti dengan exit code `0`; log menunjukkan `fast shutdown request`, bukan crash. Penyebab pemicu penghentian tidak tercatat. Container yang sama dinyalakan kembali tanpa mengubah konfigurasi; status akhir `running/healthy`, port `127.0.0.1:5432` |
| Migration PostgreSQL | `php artisan migrate:status` menunjukkan seluruh 15 migration, termasuk `2026_10_22_000000_create_application_communications_table`, berstatus `Ran`; `php artisan migrate --pretend` menghasilkan `Nothing to migrate` |
| Struktur dan jumlah data | `php artisan db:table application_communications` menunjukkan 9 kolom, indeks `(internship_application_id, occurred_at)`, indeks `recorded_by`, FK cascade ke `internship_applications`, dan FK set-null ke `users`; `db:show --counts`: 20 tabel, `users 2`, `partners 2`, `internship_applications 2`, `acceptance_letters 1`, `dpm_placements 0`, `application_communications 0`; tidak ada perubahan data |
| Browser E2E | Tidak dijalankan ulang pada pass ini; angka 43 pemeriksaan berasal dari pass E2E sebelumnya di `docs/VERIFICATION.md` §8–§9 |

Pemeriksaan ini hanya membuktikan baseline teknis. Tidak ada skenario pada
§5–§13 yang berubah menjadi `PASS` karena UAT oleh pengguna sebenarnya belum
dilakukan. Kolom hasil aktual dan status tetap harus diisi oleh eksekutor UAT.

### 17.2 Pemeriksaan ulang (23 Oktober 2026)

| Pemeriksaan | Hasil aktual pass ini |
|---|---|
| Penyebab PostgreSQL berhenti | Container `spk-magang-postgres` berstatus `exited` dengan `ExitCode=0` dan `OOMKilled=false`; log terakhir menunjukkan `fast shutdown request`, bukan crash. Host tercatat menyala ulang pada 23 Oktober 2026 pukul 14:29, sedangkan `podman-restart.service` untuk pengguna ini `disabled/inactive`; container rootless karena itu tidak ikut menyala otomatis. Penyebab pemicu penghentian sebelum reboot tidak tercatat di log |
| Pemulihan | Container yang sudah ada dinyalakan kembali tanpa mengubah `.env`, kredensial, port, volume, atau konfigurasi. Log menunjukkan automatic recovery selesai dan database siap menerima koneksi; port `127.0.0.1:5432` kembali aktif |
| Migration | `php artisan migrate:status` menunjukkan 15 migration `Ran`, termasuk `2026_10_22_000000_create_application_communications_table`; `php artisan migrate --pretend` menghasilkan `Nothing to migrate` |
| Struktur tabel | `application_communications` memiliki 9 kolom, primary key, indeks `(internship_application_id, occurred_at)`, indeks `recorded_by`, FK cascade ke `internship_applications`, dan FK set-null ke `users` |
| Jumlah data | `db:show --counts`: 20 tabel, `users 2`, `partners 2`, `internship_applications 2`, `acceptance_letters 1`, `dpm_placements 0`, `application_communications 0`; jumlah sama sebelum dan sesudah pemeriksaan read-only |
| Pengujian otomatis | PHPUnit 205 test/1.351 assertion, Pint, 55 test Node, 121 test Vitest pada 14 file, ESLint, serta TypeScript dan Vite build: seluruhnya lulus. Test backend memakai SQLite `:memory:` sesuai `phpunit.xml`, bukan database development |
| Batas | Tidak ada migration pending, `migrate:fresh`, reset, rollback, truncate, atau perubahan data. Pada pemeriksaan ulang ini belum ada akun, container, database, atau storage UAT baru; provisioning dan smoke test UAT dicatat di §17.3. Seluruh baris `BLOCKED` pada §14 tidak berubah |

Pemeriksaan ulang ini tetap bukan eksekusi UAT. Status skenario pada §5–§13
tidak berubah dan tetap menunggu eksekutor UAT.

### 17.3 Smoke test PostgreSQL UAT (23 Oktober 2026)

| Pemeriksaan | Hasil aktual |
|---|---|
| Resource UAT | Container `spk-magang-uat-postgres`, volume `spk-magang-uat-postgres-data`, port `127.0.0.1:55432`, database `spk_magang_uat`, user `spk_uat` |
| Isolasi target | Konfigurasi Laravel membuktikan koneksi ke `spk_magang_uat`, `storage_path()` dan `local_disk_root` di bawah `/tmp/opencode/spk-magang-uat/storage`, cache di `$UAT_ROOT/bootstrap-cache`, APP_KEY berbeda dari development, dan `recommendation_enabled=false` |
| Database sebelum migration | Kosong: 0 tabel public; hanya database `postgres` dan `spk_magang_uat` |
| Migration UAT | 15 migration `Ran` pada batch 1; `migrate --pretend` menghasilkan `Nothing to migrate`; 20 tabel; seluruh tabel bisnis kosong |
| Struktur | `application_communications` 9 kolom, primary key, indeks `(internship_application_id, occurred_at)`, indeks `recorded_by`, FK cascade ke `internship_applications`, FK set-null ke `users` |
| Smoke test | 1 test HTTP, **104 assertion**, lulus; memakai `DatabaseTransactions` dan bukan `RefreshDatabase` |
| Alur yang diuji | Pengajuan mahasiswa, isolasi pengajuan antarmahasiswa, komunikasi manual Admin/Prodi, keputusan `menunggu → diterima`, komunikasi setelah keputusan tanpa mengubah status/reviewer, validasi isi surat, unggah/unduh surat, penempatan DPM, serta isolasi akses DPM/Admin/Mahasiswa |
| Validasi surat | Teks bernama `.pdf` ditolak 422; PDF bernama `.jpg` diterima dan dideteksi sebagai `application/pdf`; unggahan kedua ditolak 409 karena penggantian belum didukung |
| Efek samping | Setelah smoke test: `users=0`, `partners=0`, `internship_applications=0`, `application_communications=0`, `acceptance_letters=0`, `dpm_placements=0`; tidak ada berkas surat tersisa di storage UAT |
| Data development | Jumlah data development tetap `users=2`, `partners=2`, `internship_applications=2`, `acceptance_letters=1`, `dpm_placements=0`, `application_communications=0`; tidak ada perubahan data |
| Bukti | `/tmp/opencode/spk-magang-uat/evidence/2026-10-23/` berisi preflight, target verification, migration/schema, dan smoke test |

Smoke test ini hanya membuktikan baseline teknis pada PostgreSQL UAT. Smoke
test **bukan** eksekusi UAT oleh Admin, Prodi, mahasiswa, atau DPM, dan tidak
mengubah status skenario mana pun pada §5–§13. Seluruh baris `BLOCKED` pada §14
tetap berlaku sampai keputusan bisnis terkait disetujui.

### 17.4 Preparasi data dan persistensi UAT (23 Oktober 2026)

| Pemeriksaan | Hasil aktual |
|---|---|
| Mount container | Volume `spk-magang-uat-postgres-data` persisten di `/home/kunimiwai/.local/share/containers/storage/volumes/...`; secret dimount read-only dari `/home/kunimiwai/.local/share/spk-magang-uat/secrets/postgres-password` dengan `:Z` |
| Root persisten | `/home/kunimiwai/.local/share/spk-magang-uat` **aktif**; secret/environment mode `0600`; root `/tmp` hanya rollback |
| Recreate container | Container lama di-rename sebagai rollback, container baru dibuat dengan volume/port/image yang sama; percobaan pertama gagal karena label MCS SELinux, lalu berhasil dengan `:Z`; container lama dihapus setelah verifikasi |
| Verifikasi setelah switch | `pg_isready`, target `spk_magang_uat`, 8 akun/3 mitra, login 31 assertion, smoke 104 assertion, dan stop/start lulus |
| Guard data | Database `spk_magang_uat`, port `55432`, `APP_ENV=uat`, storage/cache di bawah root UAT, `RECOMMENDATION_ENABLED=false` |
| Akun UAT | 8 akun: 1 admin, 1 prodi, 4 mahasiswa, 2 DPM |
| Mitra UAT | 3 mitra: Alpha, Beta, Gamma |
| Data transaksi | 0 pengajuan, 0 komunikasi, 0 surat, 0 penempatan |
| Integritas data | 8/8 user memakai domain `@uat.example.test`; 3/3 mitra berawalan `UAT ` |
| Guard development | Script menolak environment development dengan exit code 2 sebelum menulis |
| Idempotensi | Rerun script: `users_created=0`, `partners_created=0`; file kredensial tidak bertambah |
| Verifikasi login | 1 test HTTP, 31 assertion, lulus; token/session di-rollback |
| Kredensial | File lokal mode `0600` di luar repository; isi tidak dicetak ke laporan |
| Data development | Tetap `users=2`, `partners=2`, `internship_applications=2`, `acceptance_letters=1`, `dpm_placements=0`, `application_communications=0` |

Pada pass preparasi ini, persistensi root dan data UAT belum mengubah status
UAT. Container sudah aktif dengan mount secret dari root persisten; root `/tmp`
hanya rollback. Prosedur recreate dan hasilnya ada di checklist §9.4 dan
`$UAT_PERSIST/evidence/2026-10-23/persistence-switch/`.

### 17.5 Eksekusi browser UAT (23 Oktober 2026)

| Pemeriksaan | Hasil aktual |
|---|---|
| Lingkungan | Database `spk_magang_uat` port `55432`; backend `http://127.0.0.1:8020`; frontend `http://127.0.0.1:5182`; `RECOMMENDATION_ENABLED=false` |
| Eksekutor | Operator teknis memakai Playwright Core dan Google Chrome 156.0.8078.47 (headless); bukan pengguna Admin/Prodi/Mahasiswa/DPM sebenarnya |
| Cakupan | 79 skenario dari §5–§13 dijalankan berurutan sesuai `UAT-BROWSER-EXECUTION.md`; setiap skenario memiliki folder bukti sendiri |
| Hasil | **78 `PASS`, 1 `FAIL`**; tidak ada status `PARTIAL` |
| Rincian per kelompok | AUTH 8/0, ADM 15/1, PRD 6/0, MHS 13/0, DPM 8/0, ISO 6/0, UPL 11/0, FLOW 5/0, UI 6/0 (PASS/FAIL) |
| Defect | `UAT-DEF-01` pada `UAT-ADM-03` sudah diperbaiki di kode dan memiliki regression test; retest browser belum dijalankan |
| Sisa status | 5 `NOT RUN`: `UAT-ADM-11`, `UAT-FLOW-02`, `UAT-UPL-02`, `UAT-UPL-03`, `UAT-UPL-09`; 35 `BLOCKED`; 3 `N/A` (`UAT-BLK-31`, `UAT-ISO-06`, `UAT-UPL-15`) |
| Alasan `NOT RUN` | `UAT-ADM-11` dan `UAT-FLOW-02` memerlukan pengajuan terpisah; record yang ada sudah dipakai untuk skenario lain dan tidak dibuat record bisnis tambahan. `UAT-UPL-02`, `UAT-UPL-03`, dan `UAT-UPL-09` adalah format unggahan opsional pada record terpisah yang tidak diaktifkan |
| Bukti | `/home/kunimiwai/.local/share/spk-magang-uat/evidence/browser/2026-10-23/<SCENARIO-ID>/` berisi `notes.md`, screenshot, `network.txt`, `console.txt`, `record-ids.txt`, dan `result.txt` |
| Redaksi | Token hanya berada di `sessionStorage` browser; network evidence tidak menyimpan header otorisasi, password, cookie, atau isi berkas privat |
| Batas | `UAT-ISO-05` dan `UAT-ISO-07` memakai pemeriksaan API/storage/database read-only sesuai rancangan, bukan interaksi UI; hasilnya tetap dicatat sebagai bukti skenario |

Catatan operasional: percobaan awal `php artisan serve` tidak meneruskan seluruh
environment UAT ke proses `php -S` anak. Akibatnya CORS `5182` gagal dan satu
berkas surat sintetis sempat tertulis ke `backend/storage` development. Berkas
tersebut dipindahkan ke storage persisten UAT dan direktori kosongnya
dibersihkan; tidak ada data database development yang diubah. Backend kemudian
dijalankan dengan server bawaan PHP dan `variables_order=EGPCS` seperti pada
checklist §7. Unduhan terautentikasi `UAT-ISO-05` memastikan backend memakai
storage persisten.

Eksekusi ini membuktikan perilaku browser terhadap implementasi UAT, tetapi
belum merupakan acceptance final: defect `UAT-DEF-01` masih terbuka, lima
skenario belum dijalankan, deferral `BLOCKED` belum ditandatangani, dan pemilik
produk belum memberikan tanda tangan.

### 17.6 Verifikasi otomatis pendamping (23 Oktober 2026)

| Pemeriksaan | Hasil aktual |
|---|---|
| PHPUnit backend | 205 test, 1.351 assertion, lulus; memakai SQLite `:memory:` sesuai `phpunit.xml`, bukan database UAT |
| Unit test Node frontend | 55 test, lulus |
| Test komponen Vitest | 121 test pada 14 file, lulus |
| ESLint | Lulus |
| TypeScript dan Vite build | Lulus; 2.065 modul ditransformasi |
| Smoke test HTTP UAT PostgreSQL | 1 test, 104 assertion, lulus pada §17.3; tidak dijalankan ulang pada pass ini |
| Hubungan dengan UAT | Test otomatis ini adalah baseline teknis, bukan pengganti 79 skenario browser dan bukan acceptance pengguna |

## 18. Urutan eksekusi browser

Urutan lengkap per role, dependensi data, bukti minimum, dan kondisi berhenti
ada di [`UAT-BROWSER-EXECUTION.md`](UAT-BROWSER-EXECUTION.md). Ringkasnya:

1. Preflight operator dan verifikasi target.
2. Autentikasi/navigasi lintas role.
3. Empty state dan CRUD mitra.
4. Pengajuan `UAT-MHS-01` dan `UAT-MHS-02`.
5. Komunikasi Admin/Prodi dan keputusan.
6. Unggah/unduh surat dan validasi format.
7. Penempatan serta isolasi DPM.
8. Isolasi lintas role dan kualitas UI.
9. Konfirmasi `BLOCKED`, rekap bukti, dan serah terima.

Dokumen tersebut tidak mengubah status secara otomatis. Status dan hasil aktual
pada §5–§13 sudah diisi dari bukti browser 23 Oktober 2026; sisa `NOT RUN`,
`BLOCKED`, dan `N/A` dipertahankan sampai ada eksekusi/deferral yang sah.
