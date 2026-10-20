# Product Requirements Document (PRD) - SPK Magang

**Proyek:** Sistem Pendukung Keputusan (SPK) untuk rekomendasi tempat magang<br>
**Tanggal:** 20 Oktober 2026<br>
**Versi:** 0.3 (Draft, keputusan awal D-001–D-004)<br>
**Status:** Dokumen kebutuhan; empat keputusan awal telah dikonfirmasi. Implementasi modul bisnis tetap belum dimulai karena keputusan lanjutan belum tersedia.

**Sumber utama:**

- `docs/bpmn/BPMN.pdf` — BPMN satu halaman, studi kasus Mahasiswa Sistem Informasi UIN Raden Fatah Palembang.
- `docs/BPMN-ANALYSIS.md` — analisis BPMN, termasuk bagian yang ambigu.
- `README.md` dan `docs/ARCHITECTURE.md` — fakta teknis repository.
- `docs/REQUIREMENTS-TRACEABILITY.md` — pemetaan kebutuhan, keputusan, dan status.

**Riwayat versi:**

| Versi | Tanggal | Perubahan |
|---|---|---|
| 0.1 | 20 Oktober 2026 | Draft awal berdasarkan inspeksi repository; BPMN belum ditemukan |
| 0.2 | 20 Oktober 2026 | Sinkronisasi dengan BPMN; status kebutuhan dan konflik dicatat |
| 0.3 | 20 Oktober 2026 | Mencatat D-001–D-004; menambahkan register keputusan terbuka; memperbarui aktor dan batas MVP |

---

## 0. Ringkasan Kesesuaian BPMN dan Status Keputusan

Dokumen ini memakai **dua dimensi status**:

1. **Status BPMN** — seberapa jauh BPMN mendukung kebutuhan.
2. **Status keputusan** — apakah keputusan produk sudah diambil.

Keduanya tidak saling menggantikan. Kebutuhan dapat **SESUAI BPMN** tetapi masih **BELUM DIPUTUSKAN** untuk dimasukkan ke MVP atau dirinci aturannya.

### 0.1 Status BPMN

- **SESUAI BPMN** — BPMN secara eksplisit menggambarkan aktivitas atau hasil yang dimaksud.
- **BERTENTANGAN DENGAN BPMN** — kebutuhan/asumsi PRD lama bertentangan dengan BPMN.
- **BELUM JELAS DI BPMN** — BPMN menyentuh topik, tetapi aktor, urutan, atau hasilnya ambigu.
- **BELUM TERCANTUM DI BPMN** — topik tidak ditemukan dalam BPMN.
- **KEPUTUSAN PEMILIK PRODUK DIPERLUKAN** — keputusan scope/kebijakan/aturan bisnis harus diambil sebelum implementasi.
- **— (tidak berlaku)** — status BPMN tidak relevan untuk baris tersebut.

### 0.2 Status keputusan

- **DIKONFIRMASI** — keputusan sudah diambil dan mengikat dokumentasi.
- **BELUM DIPUTUSKAN** — keputusan sudah diidentifikasi, tetapi belum ada jawaban.
- **BELUM JELAS DI BPMN** — BPMN sendiri ambigu; klarifikasi atau revisi BPMN diperlukan sebelum keputusan.
- **PERLU KONFIRMASI PEMILIK PRODUK** — pemilik produk harus memilih scope, kebijakan, atau aturan bisnis.

### 0.3 Ringkasan per area

| Area | Status BPMN | Status keputusan | Ringkasan |
|---|---|---|---|
| Identitas dan pemisahan aktor | **BELUM JELAS DI BPMN** | **DIKONFIRMASI** | D-001 memisahkan Admin dan Prodi; D-002 menetapkan DPM = Dosen Pembimbing Magang; kewenangan rinci masih terbuka |
| Autentikasi dan hak akses | **BELUM JELAS DI BPMN** | **BELUM DIPUTUSKAN** | Login mahasiswa eksplisit; login Admin/Prodi/DPM dan matriks izin belum diputuskan |
| Pengelolaan mitra | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | Aktivitas pengelolaan mitra ada; detail data dan kewenangan belum diputuskan |
| Peminatan DTA/PSI/SIA | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | Pilihan peminatan ada; aturan pemetaan ke mitra belum diputuskan |
| Input/validasi nilai prasyarat | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | Input dan validasi ada; sumber nilai dan aturan validasi belum diputuskan |
| K-Means dan SAW | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | Metode disebut; atribut, cluster, kriteria, bobot, dan normalisasi belum diputuskan |
| Pengajuan dan dokumen | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | Alur pengajuan/verifikasi ada; syarat dokumen dan status belum diputuskan |
| Akses dan kanal mitra | **SESUAI BPMN** | **DIKONFIRMASI** | D-003 menetapkan mitra tanpa akun dan komunikasi melalui email/surat; mekanisme teknis belum diputuskan |
| Penerimaan/penolakan | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | Mitra memutuskan dan mengirim surat; model status dan sumber kebenaran belum diputuskan |
| Definisi DPM | **SESUAI BPMN** | **DIKONFIRMASI** | D-002 menetapkan DPM = Dosen Pembimbing Magang; waktu, kriteria, dan kewenangan belum diputuskan |
| Status dan notifikasi | **BELUM JELAS DI BPMN** | **BELUM DIPUTUSKAN** | Notifikasi Admin dan status Diterima/Ditolak ada; status antara dan kanal lain belum diputuskan |
| Batas MVP | **—** | **DIKONFIRMASI** | D-004 memprioritaskan alur yang eksplisit di BPMN; daftar fitur final tetap terbuka |

**Kesimpulan:** Empat keputusan awal sudah mengikat, tetapi belum cukup untuk implementasi modul bisnis. Daftar keputusan terbuka ada di Bagian 8; traceability rinci ada di `docs/REQUIREMENTS-TRACEABILITY.md`.

---

## 1. Tujuan Proyek

### Fakta dan status

- **SESUAI BPMN** — Membangun SPK untuk membantu rekomendasi tempat magang berdasarkan pengelompokan dan penilaian alternatif. BPMN memuat “Proses K-Means (pengelompokan mitra)”, “Filter mitra sesuai peminatan”, “Perhitungan SAW (perangkingan)”, dan “Tampilkan hasil rekomendasi”.
- **SESUAI BPMN** — Menggunakan K-Means dan SAW sebagai metode utama. BPMN menyebut kedua metode tersebut.
- **BELUM TERCANTUM DI BPMN** — Tujuan kuantitatif seperti peningkatan kepuasan mahasiswa, pengurangan waktu pencarian, atau peningkatan kecocokan kompetensi.
- **PERLU KONFIRMASI PEMILIK PRODUK** — Target pengguna akhir dan metrik keberhasilan SPK.

### Pertanyaan

- Apakah tujuan utama cukup “memberikan ranking rekomendasi”, atau ada target terukur yang harus dicapai?
- Siapa pengguna akhir yang diprioritaskan: mahasiswa, Admin, Prodi, DPM, atau kombinasi?
- Apakah mitra dianggap pengguna sistem, atau tetap pihak eksternal tanpa akun? **D-003 menetapkan mitra tanpa akun aplikasi.**

---

## 2. Ruang Lingkup Proyek

### D-004 — Batas MVP

**Status: DIKONFIRMASI.**

- MVP memprioritaskan alur yang secara eksplisit terdapat pada BPMN.
- Fitur tambahan yang tidak dinyatakan pada BPMN tidak otomatis menjadi bagian MVP.
- Kebutuhan tambahan yang sudah ada dalam PRD tidak dihapus; kebutuhan tersebut ditandai sebagai **BELUM DIPUTUSKAN** atau **PERLU KONFIRMASI PEMILIK PRODUK**.
- D-004 menetapkan prinsip prioritas, bukan daftar fitur final. Setiap fitur tetap memerlukan konfirmasi scope.

### Fakta teknis repository

| Kebutuhan/fakta | Status BPMN | Catatan |
|---|---|---|
| Frontend React + TypeScript + Vite | **BELUM TERCANTUM DI BPMN** | Fakta repository; BPMN tidak membahas stack |
| Backend REST API Laravel | **BELUM TERCANTUM DI BPMN** | Fakta repository; BPMN tidak membahas stack |
| Algorithm service Python/FastAPI | **BELUM TERCANTUM DI BPMN** | Rancangan arsitektur; BPMN hanya memiliki lane “Sistem SPK (Website)” |
| Database PostgreSQL | **BELUM TERCANTUM DI BPMN** | Fakta repository; skema tidak digambarkan |
| Docker Compose | **BELUM TERCANTUM DI BPMN** | Fakta repository; di luar proses bisnis |
| Design system “Data-Dense Dashboard” | **BELUM TERCANTUM DI BPMN** | Fakta desain; bukan aturan bisnis |

### Batas ruang lingkup

- **DIKONFIRMASI (D-004)** — Alur BPMN menjadi prioritas MVP.
- **PERLU KONFIRMASI PEMILIK PRODUK** — Fitur tambahan, cakupan program studi, pemisahan layanan algoritma, registrasi/profil, pengelolaan pengguna, laporan, dan portal mitra.

---

## 3. Aktor dan Tanggung Jawab

### 3.1 Keputusan aktor

#### D-001 — Admin dan Prodi adalah dua role terpisah

**Status: DIKONFIRMASI.**

- Admin dan Prodi tidak boleh dianggap memiliki hak akses yang sama.
- Rincian kewenangan Admin dan Prodi belum dikonfirmasi.
- Matriks hak akses seluruh role masih menjadi keputusan lanjutan (OD-001, OD-002, OD-003).

#### D-002 — DPM adalah Dosen Pembimbing Magang

**Status: DIKONFIRMASI.**

- DPM mengikuti label BPMN: **Dosen Pembimbing Magang**.
- Mekanisme penunjukan, penggantian, cakupan bimbingan, dan kewenangan DPM belum dikonfirmasi (OD-023, OD-024, OD-025).
- Tidak ada asumsi bahwa DPM memiliki akun, memvalidasi data mahasiswa, atau menilai magang.

#### D-003 — Mitra tidak memiliki akun aplikasi

**Status: DIKONFIRMASI.**

- Mitra tidak memiliki akun aplikasi dan tidak memerlukan autentikasi mitra.
- Komunikasi dilakukan melalui email dan/atau surat sesuai alur BPMN.
- Mekanisme pembuatan, pengiriman, penerimaan, dan pencatatan komunikasi belum diputuskan (OD-020, OD-021, OD-022).
- Tidak ada asumsi bahwa sistem otomatis membuat atau mengirim email/surat.

### 3.2 Aktor yang terlihat di BPMN

| Aktor/lane | Status BPMN | Status keputusan | Tanggung jawab yang tergambar |
|---|---|---|---|
| **Mahasiswa** | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | Login, memilih peminatan DTA/PSI/SIA, input nilai prasyarat, melihat ranking, memilih perusahaan dan mengajukan magang, menunggu hasil, mengunggah surat penerimaan, mengikuti magang dengan bimbingan DPM |
| **Sistem SPK (Website)** | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | Validasi data, K-Means, filter peminatan, SAW, menampilkan rekomendasi, menyimpan pengajuan, memperbarui status |
| **Admin** | **SESUAI BPMN** | **DIKONFIRMASI (D-001)** | Role terpisah dari Prodi; kewenangan rinci belum diputuskan |
| **Prodi** | **SESUAI BPMN** | **DIKONFIRMASI (D-001)** | Role terpisah dari Admin; kewenangan rinci belum diputuskan |
| **Mitra Magang (Eksternal)** | **SESUAI BPMN** | **DIKONFIRMASI (D-003)** | Menerima pengajuan melalui email/surat, meninjau berkas, memutuskan menerima/menolak, mengirim surat keputusan; tidak memiliki akun |
| **DPM** | **SESUAI BPMN** | **DIKONFIRMASI (D-002)** | Dosen Pembimbing Magang; menerima penetapan dan membimbing mahasiswa; mekanisme dan kewenangan belum diputuskan |

### 3.3 Tanggung jawab yang diklaim PRD lama

| Klaim PRD lama | Status BPMN | Status keputusan | Temuan BPMN |
|---|---|---|---|
| Admin mengelola kriteria dan tempat/mitra magang | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | “Kelola data mitra magang” dan “Kelola kriteria dan bobot SAW” |
| Admin/Prodi mengelola pengguna dan sistem | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | Tidak ada aktivitas pengelolaan pengguna/sistem; D-001 hanya memisahkan role |
| Mahasiswa melihat profil | **BELUM TERCANTUM DI BPMN** | **BELUM DIPUTUSKAN** | Tidak ada aktivitas profil |
| Mahasiswa mengajukan preferensi magang | **BELUM JELAS DI BPMN** | **BELUM DIPUTUSKAN** | BPMN memuat pemilihan peminatan dan pemilihan perusahaan; tidak ada preferensi berperingkat |
| Mahasiswa melihat rekomendasi | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | “Melihat hasil rekomendasi (ranking perusahaan)” |
| DPM memvalidasi data mahasiswa | **BERTENTANGAN DENGAN BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | BPMN menempatkan validasi di lane sistem; kewenangan DPM belum dikonfirmasi (D-002 hanya menetapkan definisi) |
| DPM mengawasi/membimbing proses magang | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | “Membimbing mahasiswa selama magang” |
| DPM memberikan feedback/penilaian | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | Tidak ada aktivitas feedback, penilaian, atau tanda tangan |

---

## 4. Kebutuhan Fungsional

Status di bawah adalah **Status BPMN** yang dipertahankan dari PRD v0.2. Status keputusan per kebutuhan dan kaitan D-001–D-004 tersedia di `docs/REQUIREMENTS-TRACEABILITY.md`. D-001–D-004 tidak otomatis mengonfirmasi kebutuhan lain.

### 4.1 Autentikasi, akun, dan akses

| ID | Kebutuhan | Status BPMN | Bukti/catatan |
|---|---|---|---|
| FR-AUTH-01 | Mahasiswa login ke sistem | **SESUAI BPMN** | “Login ke sistem” di lane Mahasiswa |
| FR-AUTH-02 | Admin/Prodi dan DPM login ke sistem | **BELUM JELAS DI BPMN** | Tidak ada login eksplisit di lane Admin/Prodi atau DPM |
| FR-AUTH-03 | Logout | **BELUM TERCANTUM DI BPMN** | Tidak digambarkan; implementasi frontend bukan bukti kebutuhan bisnis |
| FR-AUTH-04 | Registrasi/pendaftaran akun mahasiswa | **BELUM TERCANTUM DI BPMN** | BPMN dimulai dari login |
| FR-AUTH-05 | Otorisasi berbasis role dan matriks izin | **KEPUTUSAN PEMILIK PRODUK DIPERLUKAN** | D-001 memisahkan Admin/Prodi; izin rinci belum ada |
| FR-AUTH-06 | Akun atau portal mitra | **BERTENTANGAN DENGAN BPMN** | D-003 menetapkan mitra tidak memiliki akun aplikasi |
| FR-AUTH-07 | Profil mahasiswa | **BELUM TERCANTUM DI BPMN** | Tidak ada aktivitas profil |
| FR-AUTH-08 | Admin/Prodi mengelola pengguna | **BELUM TERCANTUM DI BPMN** | Tidak ada aktivitas pengelolaan pengguna |
| FR-AUTH-09 | Login Google/SSO atau mekanisme lain | **BELUM TERCANTUM DI BPMN** | Tidak ada informasi mekanisme autentikasi |

### 4.2 Data mitra, kriteria, dan mahasiswa

| ID | Kebutuhan | Status BPMN | Bukti/catatan |
|---|---|---|---|
| FR-MIT-01 | Admin/Prodi mengelola data mitra (tambah/ubah/hapus) | **SESUAI BPMN** | “Kelola data mitra magang (tambah/ubah/hapus)” |
| FR-MIT-02 | Admin/Prodi mengelola kriteria dan bobot SAW | **SESUAI BPMN** | “Kelola kriteria dan bobot SAW” |
| FR-MIT-03 | Atribut/data mitra yang dinilai | **BELUM TERCANTUM DI BPMN** | BPMN tidak merinci atribut mitra |
| FR-MIT-04 | Pemetaan mitra ke peminatan DTA/PSI/SIA | **BELUM TERCANTUM DI BPMN** | Hanya “Filter mitra sesuai peminatan” |
| FR-MIT-05 | Kriteria seleksi mitra, kuota, atau tenggat respons | **BELUM TERCANTUM DI BPMN** | Tidak ada aturan terkait |
| FR-DATA-01 | Admin/Prodi mengelola data mahasiswa | **BELUM TERCANTUM DI BPMN** | BPMN hanya memuat validasi dan input nilai oleh mahasiswa |

### 4.3 Peminatan dan nilai mata kuliah prasyarat

| ID | Kebutuhan | Status BPMN | Bukti/catatan |
|---|---|---|---|
| FR-PREF-01 | Mahasiswa memilih peminatan DTA/PSI/SIA | **SESUAI BPMN** | “Pilih peminatan (DTA / PSI / SIA)” |
| FR-PREF-02 | Mahasiswa dapat mengubah atau memilih lebih dari satu peminatan | **BELUM TERCANTUM DI BPMN** | Batas/perubahan tidak dijelaskan |
| FR-GRADE-01 | Mahasiswa menginput nilai mata kuliah prasyarat | **SESUAI BPMN** | “Input nilai mata kuliah prasyarat” |
| FR-GRADE-02 | Sumber nilai: manual, impor, atau integrasi akademik | **BELUM TERCANTUM DI BPMN** | Asal data tidak dijelaskan |
| FR-GRADE-03 | Daftar mata kuliah prasyarat dan ambang nilai | **BELUM TERCANTUM DI BPMN** | Tidak dirinci |
| FR-GRADE-04 | Validasi data mahasiswa dan nilai | **SESUAI BPMN** | “Validasi data mahasiswa”; aturan belum jelas |
| FR-GRADE-05 | Penanganan data tidak valid/tidak lengkap | **BELUM TERCANTUM DI BPMN** | Tidak ada gateway/alur kegagalan |

### 4.4 K-Means, filter peminatan, dan SAW

| ID | Kebutuhan | Status BPMN | Bukti/catatan |
|---|---|---|---|
| FR-ALG-01 | Pengelompokan mitra dengan K-Means | **SESUAI BPMN** | “Proses K-Means (pengelompokan mitra)” |
| FR-ALG-02 | Filter mitra sesuai peminatan | **SESUAI BPMN** | “Filter mitra sesuai peminatan” |
| FR-ALG-03 | Perangkingan dengan SAW | **SESUAI BPMN** | “Perhitungan SAW (perangkingan)” |
| FR-ALG-04 | Menampilkan hasil rekomendasi/ranking | **SESUAI BPMN** | “Tampilkan hasil rekomendasi” dan “Melihat hasil rekomendasi” |
| FR-ALG-05 | Atribut K-Means, jumlah cluster, dan normalisasi | **BELUM TERCANTUM DI BPMN** | Tidak dirinci |
| FR-ALG-06 | Kriteria SAW, bobot, benefit/cost, dan normalisasi | **BELUM TERCANTUM DI BPMN** | Tidak dirinci |
| FR-ALG-07 | Jumlah rekomendasi dan tie-breaking | **BELUM TERCANTUM DI BPMN** | Tidak dirinci |
| FR-ALG-08 | Data kosong, tidak ada mitra cocok, atau kegagalan algoritma | **BELUM TERCANTUM DI BPMN** | Tidak ada gateway/alur kegagalan |
| FR-ALG-09 | Perhitungan ulang setelah penolakan/perubahan data | **BELUM TERCANTUM DI BPMN** | Hanya ada loop memilih rekomendasi lain |
| FR-ALG-10 | Algorithm service Python/FastAPI terpisah | **BELUM TERCANTUM DI BPMN** | Arsitektur repository, bukan proses bisnis |
| FR-ALG-11 | Menyimpan hasil rekomendasi sebagai histori | **BELUM TERCANTUM DI BPMN** | BPMN hanya menampilkan hasil |

### 4.5 Pengajuan magang dan dokumen

| ID | Kebutuhan | Status BPMN | Bukti/catatan |
|---|---|---|---|
| FR-APP-01 | Mahasiswa memilih perusahaan dan mengajukan magang | **SESUAI BPMN** | “Pilih perusahaan dan ajukan magang” |
| FR-APP-02 | Sistem menyimpan data pengajuan | **SESUAI BPMN** | “Simpan data pengajuan magang” dan Database |
| FR-APP-03 | Admin/Prodi menerima notifikasi pengajuan baru | **SESUAI BPMN** | “Melihat notifikasi pengajuan baru di dashboard” |
| FR-APP-04 | Admin/Prodi memeriksa detail dan memverifikasi dokumen | **SESUAI BPMN** | “Cek detail pengajuan mahasiswa” dan “Verifikasi dokumen dan kelengkapan” |
| FR-APP-05 | Jenis dokumen, format, dan syarat kelengkapan | **BELUM JELAS DI BPMN** | Verifikasi disebut, dokumen tidak dirinci |
| FR-APP-06 | Dokumen kurang, revisi, atau penolakan Admin/Prodi | **BELUM TERCANTUM DI BPMN** | Tidak ada gateway/alur revisi |
| FR-APP-07 | Admin/Prodi meneruskan pengajuan ke mitra melalui email/surat | **SESUAI BPMN** | “Teruskan pengajuan ke mitra” dan “Surat/Email Pengajuan” |
| FR-APP-08 | Pembuatan template dan pengiriman email/surat | **BELUM JELAS DI BPMN** | Catatan menyebut dibuat sistem; aktivitas tidak digambarkan |
| FR-APP-09 | Admin/Prodi memperbarui status Diterima/Ditolak | **SESUAI BPMN** | “Update status Diterima / Ditolak di sistem” |
| FR-APP-10 | Mahasiswa mengunggah surat penerimaan | **SESUAI BPMN** | “Mengunggah dokumen diterima (surat penerimaan)” |
| FR-APP-11 | Admin/Prodi memverifikasi surat penerimaan | **BELUM TERCANTUM DI BPMN** | Verifikasi yang digambarkan terjadi sebelum penerusan ke mitra |
| FR-APP-12 | Mahasiswa melihat rekomendasi lain dan mengajukan kembali | **SESUAI BPMN** | Loop gateway “Diterima?” cabang “Tidak” |
| FR-APP-13 | Batas jumlah pengajuan/lamaran dan pengajuan ulang | **BELUM TERCANTUM DI BPMN** | Tidak dirinci |
| FR-APP-14 | Status antara, pembatalan, atau pengunduran diri | **BELUM TERCANTUM DI BPMN** | Hanya Diterima/Ditolak yang eksplisit |
| FR-APP-15 | Mahasiswa melamar ke lebih dari satu mitra sekaligus | **BELUM TERCANTUM DI BPMN** | Tidak dijelaskan |

### 4.6 Keputusan mitra

| ID | Kebutuhan | Status BPMN | Bukti/catatan |
|---|---|---|---|
| FR-MITRA-01 | Mitra menerima dan meninjau berkas | **SESUAI BPMN** | “Menerima pengajuan” dan “Meninjau berkas mahasiswa” |
| FR-MITRA-02 | Mitra memutuskan menerima/menolak | **SESUAI BPMN** | Gateway “Menerima?” |
| FR-MITRA-03 | Mitra mengirim surat penerimaan/penolakan | **SESUAI BPMN** | Dua aktivitas pengiriman surat |
| FR-MITRA-04 | Tenggat respons, pengingat, dan tanpa respons | **BELUM TERCANTUM DI BPMN** | Tidak ada aturan/timer |
| FR-MITRA-05 | Sumber kebenaran status hasil seleksi | **BELUM JELAS DI BPMN** | Ada alur pesan ke Admin/Mahasiswa dan input Admin; prioritas tidak jelas |

### 4.7 DPM

| ID | Kebutuhan | Status BPMN | Bukti/catatan |
|---|---|---|---|
| FR-DPM-01 | Admin/Prodi menetapkan DPM | **SESUAI BPMN** | “Menetapkan dosen pembimbing magang” |
| FR-DPM-02 | DPM menerima penetapan | **SESUAI BPMN** | “Menerima penetapan dari admin” |
| FR-DPM-03 | DPM membimbing mahasiswa selama magang | **SESUAI BPMN** | “Membimbing mahasiswa selama magang” |
| FR-DPM-04 | DPM hanya ditetapkan untuk mahasiswa yang diterima | **BELUM JELAS DI BPMN** | Catatan BPMN menyatakan demikian, tetapi diagram tidak memiliki gateway |
| FR-DPM-05 | Kriteria penugasan, beban, persetujuan, dan penggantian DPM | **BELUM TERCANTUM DI BPMN** | Tidak dirinci |
| FR-DPM-06 | Monitoring, penilaian, feedback, tanda tangan, atau penyelesaian magang | **BELUM TERCANTUM DI BPMN** | Hanya aktivitas membimbing dan end event DPM |
| FR-DPM-07 | Komunikasi eksplisit antara DPM dan mahasiswa | **BELUM JELAS DI BPMN** | Tidak ada alur pesan yang jelas |
| FR-DPM-08 | Klaim lama: DPM memvalidasi data mahasiswa | **BERTENTANGAN DENGAN BPMN** | Validasi berada di lane sistem; D-002 menetapkan DPM sebagai Dosen Pembimbing Magang |

### 4.8 Status, notifikasi, dan pelaporan

| ID | Kebutuhan | Status BPMN | Bukti/catatan |
|---|---|---|---|
| FR-STATUS-01 | Status pengajuan Diterima/Ditolak | **SESUAI BPMN** | Update status oleh Admin/Prodi dan gateway “Diterima?” |
| FR-STATUS-02 | Model status lengkap dan transisinya | **KEPUTUSAN PEMILIK PRODUK DIPERLUKAN** | BPMN tidak mendefinisikan status antara |
| FR-NOTIF-01 | Notifikasi pengajuan baru di dashboard Admin/Prodi | **SESUAI BPMN** | Ikon notifikasi pada aktivitas Admin/Prodi |
| FR-NOTIF-02 | Notifikasi untuk mahasiswa dan mitra | **BELUM JELAS DI BPMN** | Kanal dan pemicu tidak konsisten |
| FR-NOTIF-03 | Kanal, template, dan riwayat notifikasi | **BELUM TERCANTUM DI BPMN** | Tidak dirinci |
| FR-REPORT-01 | Laporan/ekspor data | **BELUM TERCANTUM DI BPMN** | Tidak ada aktivitas pelaporan |
| FR-INTEG-01 | Integrasi akademik/email/WhatsApp | **BELUM TERCANTUM DI BPMN** | Email/WA/surat adalah kanal, bukan integrasi teknis |

### 4.9 Kebutuhan antarmuka dan API

| ID | Kebutuhan | Status BPMN | Catatan |
|---|---|---|---|
| FR-UI-01 | Dashboard menampilkan rekomendasi | **SESUAI BPMN** | “Tampilkan hasil rekomendasi” |
| FR-UI-02 | Profil mahasiswa | **BELUM TERCANTUM DI BPMN** | Tidak ada di BPMN |
| FR-UI-03 | Pengelolaan data sesuai role | **BELUM JELAS DI BPMN** | D-001 memisahkan role; matriks izin belum ada |
| FR-UI-04 | Upload/download dokumen | **BELUM JELAS DI BPMN** | Upload surat penerimaan sesuai; dokumen lain tidak dirinci |
| FR-API-01 | REST API frontend-backend | **BELUM TERCANTUM DI BPMN** | Arsitektur teknis |
| FR-API-02 | Backend memanggil layanan algoritma | **BELUM TERCANTUM DI BPMN** | Arsitektur teknis |
| FR-API-03 | Endpoint dan kontrak data algoritma | **BELUM TERCANTUM DI BPMN** | Belum ditentukan |

---

## 5. Alur Bisnis yang Tergambar di BPMN

BPMN menggambarkan alur berikut. **D-004** menjadikan alur ini kandidat prioritas MVP; ini bukan konfirmasi final setiap fitur.

| Langkah | Aktor | Status BPMN | Catatan |
|---|---|---|---|
| 1. Menyiapkan data mitra dan kriteria/bobot SAW | Admin/Prodi | **SESUAI BPMN** | Aktivitas awal; pembagian Admin/Prodi belum diputuskan |
| 2. Login, memilih peminatan, input nilai prasyarat | Mahasiswa | **SESUAI BPMN** | Peminatan DTA/PSI/SIA |
| 3. Validasi data, K-Means, filter peminatan, SAW, tampilkan ranking | Sistem | **SESUAI BPMN** | Detail algoritma belum diputuskan |
| 4. Memilih perusahaan dan mengajukan magang | Mahasiswa | **SESUAI BPMN** | Pengajuan disimpan sistem |
| 5. Menerima notifikasi dan memeriksa pengajuan | Admin/Prodi | **SESUAI BPMN** | Notifikasi dashboard |
| 6. Memverifikasi dokumen dan meneruskan ke mitra | Admin/Prodi | **SESUAI BPMN** | Melalui email/surat; rincian dokumen belum jelas |
| 7. Meninjau berkas dan memutuskan menerima/menolak | Mitra | **SESUAI BPMN** | Mitra tanpa akun |
| 8. Mengirim surat penerimaan/penolakan | Mitra | **SESUAI BPMN** | Ditujukan ke Admin/Prodi dan/atau mahasiswa menurut catatan BPMN |
| 9. Menerima hasil dan memperbarui status | Admin/Prodi | **SESUAI BPMN** | Status Diterima/Ditolak |
| 10. Menetapkan DPM | Admin/Prodi | **SESUAI BPMN** | Waktu dan syarat belum diputuskan |
| 11. Mengunggah surat penerimaan dan mengikuti magang | Mahasiswa | **SESUAI BPMN** | Jika diterima |
| 12. Membimbing mahasiswa | DPM | **SESUAI BPMN** | Berakhir pada end event DPM |
| 13. Melihat rekomendasi lain dan mengajukan kembali | Mahasiswa | **SESUAI BPMN** | Batas pengajuan ulang belum diputuskan |

### 5.1 Alur alternatif yang tergambar

- **Ditolak oleh mitra:** mahasiswa melihat rekomendasi lain dan mengajukan kembali.
- **Diterima:** mahasiswa mengunggah surat penerimaan, mengikuti magang, dan DPM membimbing.
- **Mitra menolak:** mitra mengirim surat penolakan.
- **Mitra menerima:** mitra mengirim surat penerimaan.

### 5.2 Alur yang tidak tergambar

- Data mahasiswa tidak valid atau tidak lengkap.
- Dokumen pengajuan tidak lengkap atau perlu revisi.
- Admin/Prodi menolak pengajuan sebelum diteruskan ke mitra.
- Tidak ada mitra cocok atau tidak ada hasil ranking.
- K-Means/SAW gagal.
- Mitra tidak merespons.
- Mahasiswa membatalkan atau mengundurkan diri.
- Magang selesai, dinilai, atau disetujui DPM.
- Proses berakhir untuk Admin/Prodi dan Mitra.

### 5.3 Catatan pemodelan

- BPMN adalah PDF satu halaman; tidak ada file BPMN XML/source terpisah.
- Beberapa alur pesan putus-putus ambigu, terutama hubungan “Menunggu hasil seleksi mitra” dengan penyimpanan pengajuan, hasil penolakan dengan gateway “Diterima?”, dan garis dari surat penolakan ke “Menerima penetapan dari admin”.
- Alur teknis Frontend → Backend → Algorithm Service tidak digambarkan dalam BPMN; itu rancangan arsitektur repository.

---

## 6. Konflik dan Ketidakjelasan

| No | Konflik/ketidakjelasan | Status BPMN | Status keputusan | Dampak/tindak lanjut |
|---|---|---|---|---|
| K-01 | Definisi DPM | **SESUAI BPMN** | **DIKONFIRMASI (D-002)** | DPM = Dosen Pembimbing Magang; mekanisme penunjukan dan kewenangan tetap terbuka |
| K-02 | Admin dan Prodi berada dalam satu lane BPMN | **BELUM JELAS DI BPMN** | **DIKONFIRMASI (D-001)** | Role terpisah; kewenangan dan matriks izin belum diputuskan (OD-001–OD-003) |
| K-03 | Mitra tanpa akun/portal | **SESUAI BPMN** | **DIKONFIRMASI (D-003)** | Mitra tanpa akun; komunikasi email/surat; mekanisme belum diputuskan (OD-020–OD-022) |
| K-04 | Hanya login mahasiswa yang eksplisit | **BELUM JELAS DI BPMN** | **BELUM JELAS DI BPMN** | Mekanisme login Admin/Prodi/DPM belum diputuskan (OD-004) |
| K-05 | Registrasi dan profil mahasiswa tidak digambarkan | **BELUM TERCANTUM DI BPMN** | **BELUM DIPUTUSKAN** | Scope registrasi/profil perlu dikonfirmasi (OD-005, OD-006) |
| K-06 | Jumlah dan jenis role | **BELUM JELAS DI BPMN** | **DIKONFIRMASI (D-001–D-003)** | Admin, Prodi, Mahasiswa, DPM, dan Mitra eksternal; Sistem bukan role pengguna; matriks izin tetap terbuka |
| K-07 | Waktu dan syarat penetapan DPM | **BELUM JELAS DI BPMN** | **BELUM JELAS DI BPMN** | Perlu keputusan (OD-023, OD-024) |
| K-08 | Tidak ada gateway untuk dokumen kurang/data tidak valid/tidak ada hasil | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | Alur gagal/revisi belum dapat diimplementasikan (OD-017) |
| K-09 | Hanya status Diterima/Ditolak yang eksplisit | **BELUM JELAS DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | State machine belum lengkap (OD-016) |
| K-10 | Pembuatan/pengiriman surat/email tidak digambarkan | **BELUM JELAS DI BPMN** | **BELUM JELAS DI BPMN** | Batas sistem belum jelas (OD-020) |
| K-11 | Sumber kebenaran status hasil seleksi | **BELUM JELAS DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | Risiko konflik data (OD-021) |
| K-12 | Tidak ada penilaian/feedback/penyelesaian magang | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | Cakupan DPM dan akhir proses belum jelas (OD-025, OD-026) |
| K-13 | Tidak ada end event Admin/Prodi dan Mitra | **BELUM JELAS DI BPMN** | **BELUM DIPUTUSKAN** | Definisi selesai belum ada (OD-026) |
| K-14 | Atribut K-Means, cluster, kriteria/bobot SAW, pemetaan peminatan | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | Modul rekomendasi belum dapat diimplementasikan (OD-009–OD-015) |
| K-15 | Tidak ada tenggat respons mitra/kuota/pengingat | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | Proses dapat menggantung (OD-021) |
| K-16 | Tidak ada pembatalan/pengunduran diri/magang gagal | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | Penanganan kasus tidak normal belum jelas (OD-018) |
| K-17 | Tidak ada matriks hak akses per role | **KEPUTUSAN PEMILIK PRODUK DIPERLUKAN** | **PERLU KONFIRMASI PEMILIK PRODUK** | Otorisasi belum dapat dimulai (OD-003) |
| K-18 | Arti validasi/persetujuan rekomendasi | **BELUM JELAS DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | BPMN hanya memuat verifikasi dokumen dan keputusan mitra (OD-017) |
| K-19 | Eskalasi/banding di luar pengajuan ulang | **BELUM JELAS DI BPMN** | **BELUM DIPUTUSKAN** | Tidak boleh menganggap ada banding (OD-031) |

---

## 7. Keputusan Awal yang Dikonfirmasi (D-001–D-004)

| ID | Keputusan | Status | Cakupan yang mengikat | Yang masih terbuka |
|---|---|---|---|---|
| **D-001** | Admin dan Prodi adalah dua role terpisah | **DIKONFIRMASI** | Pemisahan role; tidak boleh menganggap hak akses sama | Kewenangan Admin, kewenangan Prodi, pembagian tugas, matriks izin (OD-001–OD-003) |
| **D-002** | DPM adalah Dosen Pembimbing Magang | **DIKONFIRMASI** | Definisi dan istilah DPM mengikuti BPMN | Penunjukan, penggantian, cakupan bimbingan, kewenangan, akun/login (OD-023–OD-025) |
| **D-003** | Mitra tidak memiliki akun aplikasi; komunikasi melalui email dan/atau surat | **DIKONFIRMASI** | Tidak ada portal/autentikasi mitra; kanal komunikasi email/surat | Pembuatan, pengiriman, penerimaan, pencatatan, tenggat, sumber kebenaran status (OD-020–OD-022) |
| **D-004** | MVP memprioritaskan alur yang eksplisit di BPMN | **DIKONFIRMASI** | Alur BPMN menjadi prioritas; fitur tambahan tidak otomatis masuk MVP | Daftar fitur final, kebutuhan tambahan, dan definisi akhir proses (OD-006, OD-019, OD-029–OD-031) |

**Catatan:** D-001–D-004 tidak mengonfirmasi kebutuhan lain. Kebutuhan yang terkait tetap berstatus terbuka sampai keputusan lanjutan dibuat.

---

## 8. Daftar Keputusan Terbuka

Setiap baris memiliki ID, pertanyaan spesifik, alasan, bagian sistem terdampak, status, dan sumber. ID pertanyaan lama (Q1–Q58) dipertahankan dan dirujuk pada kolom sumber.

| ID | Kelompok | Pertanyaan spesifik | Alasan keputusan dibutuhkan | Bagian sistem terdampak | Status | Sumber/Q |
|---|---|---|---|---|---|---|
| **OD-001** | Hak akses | Apa kewenangan Admin setelah D-001? | D-001 hanya memisahkan role, belum menetapkan izin | Auth, UI, API, alur Admin | **PERLU KONFIRMASI PEMILIK PRODUK** | Q1, Q2, Q9, Q10; BPMN lane Admin/Prodi |
| **OD-002** | Hak akses | Apa kewenangan Prodi? | D-001 hanya memisahkan role, belum menetapkan izin | Auth, UI, API, alur Prodi | **PERLU KONFIRMASI PEMILIK PRODUK** | Q1, Q2, Q10; BPMN lane Admin/Prodi |
| **OD-003** | Hak akses | Bagaimana matriks izin seluruh role? | BPMN tidak memuat matriks izin | Auth, endpoint, UI | **PERLU KONFIRMASI PEMILIK PRODUK** | Q10 |
| **OD-004** | Akun/data | Bagaimana login Admin/Prodi dan DPM? | Hanya login mahasiswa yang eksplisit | Auth | **BELUM JELAS DI BPMN** | Q4, Q56 |
| **OD-005** | Akun/data | Bagaimana sumber akun mahasiswa dan apakah registrasi diperlukan? | BPMN dimulai dari login | Auth, UI | **PERLU KONFIRMASI PEMILIK PRODUK** | Q7, Q55 |
| **OD-006** | Akun/data | Apakah profil mahasiswa termasuk MVP? | Profil tidak ada di BPMN | UI, data | **BELUM DIPUTUSKAN** | Q8 |
| **OD-007** | Akun/data | Dari mana nilai mata kuliah prasyarat diperoleh? | Manual, impor, atau integrasi belum jelas | Data, algoritma | **PERLU KONFIRMASI PEMILIK PRODUK** | Q23 |
| **OD-008** | Akun/data | Apa aturan validasi data mahasiswa dan nilai? | BPMN hanya menyebut validasi | Data, algoritma | **BELUM JELAS DI BPMN** | Q24, Q27 |
| **OD-009** | K-Means | Atribut apa yang digunakan dan bagaimana preprocessing? | Tidak dirinci di BPMN | Algoritma | **PERLU KONFIRMASI PEMILIK PRODUK** | Q11 |
| **OD-010** | K-Means | Berapa jumlah cluster dan bagaimana menentukannya? | Tidak dirinci di BPMN | Algoritma | **PERLU KONFIRMASI PEMILIK PRODUK** | Q12 |
| **OD-011** | K-Means | Apa target clustering dan bagaimana hasilnya digunakan? | BPMN menyebut pengelompokan mitra, penggunaan tidak jelas | Algoritma, rekomendasi | **BELUM JELAS DI BPMN** | Q13 |
| **OD-012** | SAW | Apa kriteria dan bobot SAW? | Tidak dirinci di BPMN | Algoritma | **PERLU KONFIRMASI PEMILIK PRODUK** | Q14, Q15 |
| **OD-013** | SAW | Bagaimana benefit/cost, normalisasi, dan nilai kosong? | Tidak dirinci di BPMN | Algoritma | **PERLU KONFIRMASI PEMILIK PRODUK** | Q16, Q17 |
| **OD-014** | SAW | Berapa ranking ditampilkan dan bagaimana tie-break? | Tidak dirinci di BPMN | UI, algoritma | **PERLU KONFIRMASI PEMILIK PRODUK** | Q17, Q20 |
| **OD-015** | Peminatan | Bagaimana pemetaan DTA/PSI/SIA dan aturan multi-peminatan? | Hanya ada label filter | Algoritma, data | **PERLU KONFIRMASI PEMILIK PRODUK** | Q18, Q19 |
| **OD-016** | Pengajuan | Apa daftar status dan transisi yang sah? | Hanya Diterima/Ditolak eksplisit | Workflow, UI, API | **PERLU KONFIRMASI PEMILIK PRODUK** | Q25, Q26, Q33, Q34 |
| **OD-017** | Pengajuan | Bagaimana validasi dokumen, revisi, dan penolakan Admin/Prodi? | Tidak ada gateway/alur revisi | Workflow, dokumen | **BELUM JELAS DI BPMN** | Q27, Q28, Q31, Q32, Q41 |
| **OD-018** | Pengajuan | Bagaimana penolakan mitra, pembatalan, dan pengajuan ulang? | Hanya ada loop pengajuan ulang | Workflow | **PERLU KONFIRMASI PEMILIK PRODUK** | Q29, Q30, Q33 |
| **OD-019** | Pengajuan | Apakah mahasiswa boleh melamar ke beberapa mitra? | Tidak dijelaskan di BPMN | Workflow | **BELUM DIPUTUSKAN** | Q29 |
| **OD-020** | Mitra/komunikasi | Siapa menyusun dan mengirim email/surat? | Catatan BPMN tidak diikuti aktivitas | Integrasi, workflow | **BELUM JELAS DI BPMN** | Q35, Q36, Q37 |
| **OD-021** | Mitra/komunikasi | Bagaimana pencatatan respons, tenggat, dan sumber kebenaran status? | Tidak ada timer/sumber kebenaran | Workflow, integrasi | **PERLU KONFIRMASI PEMILIK PRODUK** | Q38, Q39, Q40 |
| **OD-022** | Mitra/komunikasi | Bagaimana template, format, dan riwayat surat? | Tidak dirinci | Dokumen, integrasi | **BELUM DIPUTUSKAN** | Q37, Q41 |
| **OD-023** | DPM | Kapan dan siapa yang menetapkan DPM? | Catatan BPMN dan diagram tidak konsisten | DPM, workflow | **BELUM JELAS DI BPMN** | Q42 |
| **OD-024** | DPM | Apa kriteria penugasan, beban, persetujuan, dan penggantian? | Tidak dirinci | DPM, workflow | **PERLU KONFIRMASI PEMILIK PRODUK** | Q43, Q44 |
| **OD-025** | DPM | Apa kewenangan, cakupan bimbingan, dan komunikasi DPM? | Tidak dirinci | DPM, UI | **PERLU KONFIRMASI PEMILIK PRODUK** | Q45, Q47 |
| **OD-026** | Akhir proses | Apakah MVP berhenti di BPMN atau mencakup evaluasi/penyelesaian magang? | BPMN hanya memuat bimbingan dan end event | Scope, DPM | **PERLU KONFIRMASI PEMILIK PRODUK** | Q46 |
| **OD-027** | Nonfungsional | Bagaimana keamanan, privasi, dan audit log? | Tidak dirinci | Keamanan, data | **PERLU KONFIRMASI PEMILIK PRODUK** | Q53 |
| **OD-028** | Nonfungsional | Bagaimana kinerja, backup, dan kriteria penerimaan? | Tidak dirinci | NFR, operasi | **PERLU KONFIRMASI PEMILIK PRODUK** | Q52, Q54 |
| **OD-029** | Tambahan | Apakah notifikasi mahasiswa/mitra termasuk MVP? | BPMN hanya menonjolkan notifikasi Admin/Prodi | Notifikasi | **BELUM DIPUTUSKAN** | Q48, Q49 |
| **OD-030** | Tambahan | Apakah laporan, integrasi, dan pengelolaan pengguna termasuk MVP? | Tidak ada di BPMN | Reporting, integrasi, auth | **BELUM DIPUTUSKAN** | Q9, Q50, Q51 |
| **OD-031** | Tambahan | Apakah histori rekomendasi/banding diperlukan? | Tidak ada di BPMN | Data, workflow | **BELUM DIPUTUSKAN** | Q57, Q58 |

---

## 9. Pertanyaan Rinci (Q1–Q58)

ID Q dipertahankan untuk traceability. Beberapa pertanyaan telah dijawab sebagian oleh D-001–D-004 dan kini menjadi pertanyaan lanjutan.

### 9.1 Aktor, scope, dan hak akses

**Q1.** Bagaimana pembagian kewenangan Admin dan Prodi setelah D-001 menetapkan keduanya sebagai role terpisah?
**Q2.** Aktivitas mana yang boleh dilakukan Admin dan mana yang boleh dilakukan Prodi?
**Q3.** Bagaimana mekanisme penunjukan, penggantian, dan kewenangan DPM setelah D-002 menetapkan definisinya?
**Q4.** Apakah DPM memiliki akun dan login?
**Q5.** Bagaimana mekanisme komunikasi dan pencatatan respons mitra setelah D-003 menetapkan mitra tanpa akun?
**Q6.** Apakah ada role lain, misalnya koordinator magang atau staf prodi?
**Q7.** Apakah pendaftaran akun mahasiswa termasuk MVP, atau akun dibuat oleh Admin/Prodi?
**Q8.** Apakah profil mahasiswa termasuk MVP?
**Q9.** Apakah Admin/Prodi boleh mengelola pengguna dan role?
**Q10.** Apakah matriks izin per role dapat disetujui sebelum implementasi?

### 9.2 Data dan algoritma

**Q11.** Atribut apa yang digunakan untuk K-Means?
**Q12.** Berapa jumlah cluster, dan bagaimana jumlah itu ditentukan?
**Q13.** Apakah K-Means mengelompokkan mitra, mahasiswa, atau keduanya?
**Q14.** Kriteria apa yang digunakan untuk SAW?
**Q15.** Berapa bobot setiap kriteria, dan siapa yang menetapkannya?
**Q16.** Kriteria mana yang benefit dan mana yang cost?
**Q17.** Bagaimana normalisasi, skala penilaian, dan tie-breaking?
**Q18.** Bagaimana peminatan DTA/PSI/SIA dipetakan ke mitra?
**Q19.** Apakah satu mitra dapat masuk lebih dari satu peminatan?
**Q20.** Berapa banyak rekomendasi yang ditampilkan: semua mitra atau top-N?
**Q21.** Apa yang terjadi jika tidak ada mitra cocok atau tidak ada hasil ranking?
**Q22.** Apakah K-Means/SAW dijalankan ulang setelah penolakan atau perubahan data?
**Q23.** Dari mana nilai mata kuliah prasyarat diperoleh: input manual, impor, atau integrasi akademik?
**Q24.** Mata kuliah apa yang termasuk prasyarat, dan apa ambang nilainya?

### 9.3 Pengajuan, dokumen, dan status

**Q25.** Apa saja status pengajuan yang sah selain Diterima/Ditolak?
**Q26.** Siapa yang berwenang mengubah setiap status?
**Q27.** Apa yang terjadi jika dokumen pengajuan tidak lengkap?
**Q28.** Apakah Admin/Prodi dapat menolak pengajuan sebelum diteruskan ke mitra?
**Q29.** Apakah mahasiswa dapat melamar ke lebih dari satu mitra sekaligus?
**Q30.** Berapa kali mahasiswa boleh mengajukan ulang setelah ditolak?
**Q31.** Apakah mahasiswa wajib mengunggah surat penerimaan sebelum magang dimulai?
**Q32.** Apakah Admin/Prodi memverifikasi surat penerimaan yang diunggah?
**Q33.** Apakah ada status pembatalan atau pengunduran diri?
**Q34.** Apa definisi “selesai” untuk pengajuan yang tidak pernah direspons mitra?

### 9.4 Mitra dan komunikasi

**Q35.** Siapa yang membuat surat/email pengajuan: sistem, Admin, atau Prodi?
**Q36.** Apakah sistem benar-benar mengirim email, atau hanya membuat dokumen untuk dikirim manual?
**Q37.** Kanal apa yang dipakai: dashboard, email, WhatsApp, atau surat?
**Q38.** Apakah ada tenggat respons mitra dan pengingat otomatis?
**Q39.** Apa yang terjadi jika mitra tidak merespons?
**Q40.** Siapa sumber kebenaran status hasil seleksi: mitra, Admin/Prodi, atau sistem?
**Q41.** Apakah format surat penerimaan/penolakan sudah ditentukan?

### 9.5 DPM dan penyelesaian magang

**Q42.** Apakah DPM hanya ditetapkan untuk mahasiswa yang diterima?
**Q43.** Apa kriteria penugasan DPM: beban, peminatan, ketersediaan, atau persetujuan dosen?
**Q44.** Apakah DPM dapat menolak penetapan atau diganti?
**Q45.** Apakah DPM melakukan monitoring, penilaian, feedback, atau tanda tangan?
**Q46.** Apakah proses berakhir setelah mahasiswa mulai magang atau setelah magang selesai?
**Q47.** Bagaimana komunikasi DPM dan mahasiswa dicatat?

### 9.6 Notifikasi, laporan, dan nonfungsional

**Q48.** Siapa penerima notifikasi pengajuan baru: Admin, Prodi, atau keduanya?
**Q49.** Apakah mahasiswa dan mitra menerima notifikasi sistem?
**Q50.** Apakah laporan/ekspor data termasuk MVP?
**Q51.** Apakah integrasi sistem akademik, email, atau WhatsApp termasuk MVP?
**Q52.** Apa target performa, skalabilitas, ketersediaan, dan kompatibilitas browser?
**Q53.** Apa kebutuhan retensi, audit trail, dan perlindungan data pribadi?
**Q54.** Apa kriteria penerimaan dan definisi “done” untuk setiap alur?

### 9.7 Sesi dan mekanisme login

**Q55.** Apakah logout dan manajemen sesi termasuk MVP?
**Q56.** Apakah login memakai email/password, SSO, atau mekanisme lain?

### 9.8 Data hasil dan eskalasi

**Q57.** Apakah hasil rekomendasi perlu disimpan sebagai histori/audit, atau hanya ditampilkan saat proses?
**Q58.** Apakah ada proses banding/eskalasi jika mahasiswa tidak menerima hasil rekomendasi, selain mengajukan ulang?

---

## 10. Batasan Implementasi Sebelum Keputusan Dikonfirmasi

D-001–D-004 sudah dikonfirmasi, tetapi belum cukup untuk implementasi modul bisnis. Sampai keputusan pada Bagian 8 tersedia:

1. **Jangan** mengimplementasikan CRUD bisnis, modul rekomendasi, K-Means, SAW, atau dashboard bisnis.
2. **Jangan** membuat aturan K-Means, kriteria/bobot SAW, pemetaan peminatan, atau jumlah cluster berdasarkan asumsi.
3. **Jangan** membuat status pengajuan, aturan penolakan, pembatalan, atau penyelesaian magang tanpa keputusan.
4. **Jangan** membuat `RequireRole`, matriks izin, atau pembatasan endpoint berdasarkan role sebelum matriks disetujui.
5. **Jangan** membuat akun mitra atau portal mitra; D-003 menetapkan mitra tanpa akun.
6. **Jangan** mengubah alur autentikasi yang sudah ada tanpa keputusan eksplisit.
7. **Jangan** menganggap DPM memvalidasi data mahasiswa; validasi berada di lane sistem.
8. **Jangan** menganggap Admin, Prodi, DPM, dan mahasiswa memiliki mekanisme login yang sama tanpa konfirmasi.
9. **Jangan** menganggap surat/email dibuat atau dikirim otomatis oleh sistem.
10. **Jangan** menganggap registrasi, profil, pengelolaan pengguna, laporan, atau integrasi akademik termasuk MVP.
11. **Jangan** menganggap D-001 memberi Admin dan Prodi hak akses yang sama.
12. **Jangan** menganggap D-002 menetapkan mekanisme penunjukan atau kewenangan DPM.
13. **Jangan** menganggap D-004 mengonfirmasi seluruh fitur BPMN sebagai daftar MVP final.

Pekerjaan yang masih dapat dilakukan tanpa keputusan bisnis: dokumentasi, audit, desain UI non-bisnis, dan perbaikan teknis yang tidak mengunci aturan bisnis.

---

## 11. Arsitektur Sistem

### Fakta dan status

- **BELUM TERCANTUM DI BPMN** — Frontend React/TypeScript/Vite, backend Laravel, algorithm service Python/FastAPI, PostgreSQL, dan Docker Compose.
- **BELUM TERCANTUM DI BPMN** — Alur Frontend → Backend API → Database dan Frontend → Backend API → Algorithm Service.
- **BELUM TERCANTUM DI BPMN** — Kontrak API, format data, caching, logging, error handling, dan deployment.

BPMN hanya menggambarkan lane “Sistem SPK (Website)” dan aktivitas K-Means/SAW. BPMN tidak menetapkan apakah algoritma dijalankan di backend, di layanan terpisah, atau di tempat lain.

### Keputusan yang diperlukan

- Apakah layanan algoritma tetap terpisah?
- Apa kontrak input/output backend–algorithm service?
- Apa format data antara frontend dan backend?
- Bagaimana error, timeout, dan retry antar layanan ditangani?
- Apa strategi caching dan performa?

---

## 12. Keamanan

### Fakta dan status

- **BELUM TERCANTUM DI BPMN** — Laravel Sanctum, token-based authentication, dan implementasi frontend/backend yang sudah ada. Ini fakta implementasi, bukan aturan BPMN.
- **BELUM TERCANTUM DI BPMN** — Aturan repository: `.env` tidak boleh di-commit, password/token/API key tidak disimpan di repository, dan `.env.example` digunakan untuk mendokumentasikan nama variabel (CONTRIBUTING.md).
- **BELUM TERCANTUM DI BPMN** — Laravel menyediakan fitur keamanan bawaan; ini fakta framework, bukan jaminan konfigurasi aplikasi.
- **BELUM JELAS DI BPMN** — Mekanisme autentikasi Admin/Prodi/DPM dan matriks otorisasi.
- **DIKONFIRMASI (D-003)** — Mitra tidak memiliki akun aplikasi; tidak ada autentikasi mitra.
- **PERLU KONFIRMASI PEMILIK PRODUK** — HTTPS/TLS, enkripsi data sensitif, audit log, monitoring, backup, pemulihan, retensi, dan kepatuhan perlindungan data.

### Pertanyaan

- Apakah token disimpan di browser dan bagaimana risiko XSS/CSRF dikelola?
- Siapa yang boleh melihat nilai, dokumen, dan hasil seleksi?
- Berapa lama data dan dokumen disimpan?
- Apakah audit trail perubahan status diperlukan?

---

## 13. Kebutuhan Nonfungsional

| Kebutuhan | Status BPMN | Status keputusan | Catatan |
|---|---|---|---|
| Responsif di desktop/tablet | **BELUM TERCANTUM DI BPMN** | **BELUM DIPUTUSKAN** | Kebutuhan desain; target formal belum ada |
| Waktu respons API < 2 detik | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | Usulan PRD v0.1; belum divalidasi |
| Minimal 100 pengguna concurrent | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | Usulan PRD v0.1; belum divalidasi |
| Design system konsisten | **BELUM TERCANTUM DI BPMN** | **BELUM DIPUTUSKAN** | Fakta desain repository |
| Skalabilitas, uptime, backup, browser support | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | Belum ditentukan |

Fakta repository yang bukan aturan BPMN: Vite menyediakan HMR untuk development; Laravel menyediakan queue, cache, dan event broadcasting; Docker Compose tersedia untuk orchestration. Ketersediaan fitur teknis tersebut tidak menetapkan kebutuhan performa atau arsitektur final.

---

## 14. Kriteria Penerimaan

**Status keputusan: PERLU KONFIRMASI PEMILIK PRODUK.**

Tidak ada kriteria penerimaan yang dapat diturunkan dari BPMN. BPMN tidak memuat:

- fungsi spesifik yang wajib bekerja;
- tingkat akurasi K-Means/SAW;
- kelengkapan UI/UX;
- standar kode dan coverage testing;
- dokumentasi yang wajib;
- uji coba pengguna atau feedback.

Kriteria penerimaan tidak boleh dibuat dengan asumsi. Pemilik produk harus menetapkan definisi “done” untuk setiap alur yang disetujui.

---

## 15. Tahapan Implementasi

**Status keputusan: PERLU KONFIRMASI PEMILIK PRODUK.**

Repository sudah memiliki struktur frontend, backend, algorithm service, Docker Compose, autentikasi awal, dan design system. Namun, BPMN tidak menetapkan prioritas sprint, estimasi, dependensi, atau kriteria kelulusan tahap.

Urutan yang aman secara dokumentasi:

1. Selesaikan keputusan aktor, role, dan hak akses.
2. Selesaikan aturan data, K-Means, SAW, dan peminatan.
3. Selesaikan state machine pengajuan dan alur dokumen.
4. Selesaikan aturan mitra dan DPM.
5. Tentukan kontrak API dan model data.
6. Baru implementasikan modul bisnis secara bertahap.

Urutan ini adalah rekomendasi, bukan keputusan final pemilik produk.

---

## 16. Catatan dan Risiko

### Verifikasi yang diperlukan

1. **BPMN tersedia**, tetapi belum lengkap untuk implementasi. Beberapa alur pesan ambigu dan beberapa aktor belum jelas.
2. **Detail algoritma SPK** — atribut K-Means, jumlah cluster, kriteria SAW, bobot, normalisasi, dan tie-breaking belum ditetapkan.
3. **Hak akses per role** — D-001 memisahkan Admin/Prodi, tetapi matriks izin belum ada.
4. **Status pengajuan** — hanya Diterima/Ditolak yang eksplisit.
5. **Batas sistem komunikasi** — pembuatan/pengiriman email/surat belum jelas.
6. **Penetapan dan peran DPM** — definisi sudah dikonfirmasi, tetapi syarat, mekanisme, dan aktivitas akhir belum jelas.
7. **Spesifikasi API** — kontrak frontend-backend dan backend-algorithm service belum ada.

### Risiko

1. **Salah aktor/role** — Admin, Prodi, DPM, dan mitra dapat diimplementasikan dengan hak akses yang keliru.
2. **Algoritma tanpa dasar** — K-Means/SAW dapat menghasilkan ranking yang tidak dapat dipertanggungjawabkan jika atribut/bobot dikarang.
3. **Proses menggantung** — tidak ada aturan untuk dokumen kurang, mitra tidak merespons, atau pengajuan berulang.
4. **Konflik status** — hasil dari mitra, input Admin/Prodi, dan tampilan mahasiswa dapat berbeda.
5. **Kebocoran data** — nilai, dokumen, dan data pribadi mahasiswa memerlukan kebijakan akses dan retensi.
6. **Ketergantungan pada BPMN yang ambigu** — alur pesan putus-putus tidak boleh dianggap kontrak teknis.
7. **Scope creep** — registrasi, profil, portal mitra, laporan, dan integrasi dapat masuk tanpa keputusan MVP.

### Langkah selanjutnya

1. Pemilik produk menjawab keputusan terbuka pada Bagian 8.
2. Perbarui BPMN jika keputusan mengubah aktor, status, atau alur.
3. Tetapkan matriks hak akses dan state machine pengajuan.
4. Tetapkan atribut/kriteria/bobot algoritma bersama pemilik produk.
5. Buat kontrak API dan model data.
6. Setelah itu, implementasikan modul bisnis secara bertahap.

---

## 17. Sumber dan Batasan Dokumen

- BPMN dianalisis dari `docs/bpmn/BPMN.pdf` (satu halaman). Tidak ada file BPMN XML/source.
- Analisis interpretatif tersimpan di `docs/BPMN-ANALYSIS.md`.
- Traceability kebutuhan tersimpan di `docs/REQUIREMENTS-TRACEABILITY.md`.
- Fakta teknis diambil dari `README.md` dan `docs/ARCHITECTURE.md`; fakta tersebut bukan bagian dari BPMN.
- Dokumen ini tidak menetapkan aturan bisnis yang tidak ada di BPMN. Semua ketidakpastian dicatat sebagai keputusan terbuka.

---

*Dokumen PRD v0.3 ini mencatat D-001–D-004 dan keputusan terbuka pada 20 Oktober 2026. Implementasi modul bisnis belum dimulai.*
