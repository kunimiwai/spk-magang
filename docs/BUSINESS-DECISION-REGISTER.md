# Business Decision Register — SPK Magang

**Proyek:** Sistem Pendukung Keputusan (SPK) untuk rekomendasi tempat magang<br>
**Tanggal:** 20 Oktober 2026<br>
**Versi:** 0.2 — revisi konsistensi setelah audit 20 Oktober 2026<br>
**Status:** Register keputusan; dokumentasi saja. Tidak ada kode aplikasi, migration, database, konfigurasi, atau workflow CI yang diubah. Satu catatan pemetaan silang ditambahkan di `docs/PRD.md` §7.<br>
**Sumber utama:**

- `docs/bpmn/BPMN.pdf` — BPMN satu halaman.
- `docs/BPMN-ANALYSIS.md` — analisis BPMN dan bagian yang ambigu.
- `docs/PRD.md` versi 0.3 — D-001–D-004, OD-001–OD-031, dan Q1–Q58.
- `docs/REQUIREMENTS-TRACEABILITY.md` — pemetaan kebutuhan, keputusan, dan blocker.
- `docs/CRITERIA-GAP-ANALYSIS.md` — kesenjangan modul kriteria/SAW.
- `docs/STUDENT-FLOW-GAP-ANALYSIS.md` — kesenjangan alur mahasiswa.

---

## 1. Tujuan dan Batas Dokumen

Dokumen ini menyatukan seluruh keputusan bisnis yang sudah dikonfirmasi dan yang masih terbuka ke dalam satu register yang dapat ditindaklanjuti oleh pemilik proses bisnis.

Dokumen ini:

1. Mempertahankan ID dan redaksi keputusan dari `docs/PRD.md` dan `docs/REQUIREMENTS-TRACEABILITY.md`.
2. Membedakan keputusan yang sudah dikonfirmasi dari keputusan yang masih terbuka.
3. Mengelompokkan keputusan terbuka menjadi yang memblokir implementasi dan yang dapat ditunda.
4. Mencatat pertanyaan, opsi yang benar-benar didukung sumber, dampak, dependensi, dan kriteria penutupan keputusan.
5. Menandai pertanyaan yang wajib dijawab pemilik proses bisnis.

Dokumen ini **tidak**:

- menetapkan daftar kriteria SAW, bobot, atribut K-Means, jumlah cluster, sumber nilai, status pengajuan, atau hak akses;
- mengimplementasikan modul bisnis, migration, API, UI, atau algoritma;
- mengubah makna keputusan di BPMN, PRD, traceability, atau dokumen lain; catatan pemetaan silang di `docs/PRD.md` §7 hanya menandai anomali;
- menganggap fakta teknis repository sebagai keputusan bisnis.

Jika sumber tidak memberikan opsi atau jawaban, dokumen ini menulis **“belum ditentukan dalam sumber”**. Kalimat tersebut berarti tidak ada keputusan yang boleh disimpulkan dari dokumen yang ada.

---

## 2. Cara Membaca Register

### 2.1 Dua dimensi yang tidak saling menggantikan

Register ini memakai dua dimensi:

1. **Status sumber** — status keputusan yang sudah tercatat di `docs/PRD.md`: **DIKONFIRMASI**, **BELUM DIPUTUSKAN**, **BELUM JELAS DI BPMN**, atau **PERLU KONFIRMASI PEMILIK PRODUK**.
2. **Kelompok register** — klasifikasi kerja untuk menentukan kapan keputusan harus dijawab.

Kelompok register **tidak mengubah** status sumber. Keputusan yang berada di kelompok “dapat ditunda” tetap belum dikonfirmasi.

### 2.2 Kelompok register

| Kelompok | Arti | Konsekuensi |
|---|---|---|
| **A — Sudah dikonfirmasi** | Keputusan sudah diambil dan mengikat dokumentasi. | Hanya D-001–D-004. Tidak ada OD yang masuk kelompok ini. |
| **B — Terbuka dan memblokir implementasi** | Harus dijawab sebelum modul/fondasi yang bergantung langsung padanya dimulai. | Skema, API, UI, dan/atau algoritma yang bergantung langsung pada keputusan ini tidak boleh dibuat. |
| **C1 — Terbuka, dapat ditunda sampai fase BPMN terkait** | Tidak memblokir fondasi rekomendasi, tetapi wajib dijawab sebelum modul/fase yang bergantung langsung padanya diimplementasikan. | Bukan berarti opsional; keputusan tetap menjadi gate modul terkait. |
| **C2 — Terbuka, dapat ditunda lebih lama** | Berkaitan dengan fitur non-BPMN, detail lanjutan, atau kesiapan produksi. | Wajib dijawab sebelum fitur/produksi terkait, tetapi tidak memblokir fondasi rekomendasi. |

**Blocker fondasi dan blocker modul.** Istilah “blocker implementasi” di `docs/REQUIREMENTS-TRACEABILITY.md` §17 berarti kebutuhan pada modul tertentu tidak boleh diimplementasikan sebelum keputusan tersedia. Register memakai istilah **memblokir fondasi** untuk kelompok B. Kelompok C1 dan C2 tidak memblokir fondasi, tetapi tetap menjadi gate modul atau fase terkait. Perbedaan ini adalah perbedaan granularitas, bukan perubahan status OD: tidak ada OD yang dipindahkan kelompok hanya untuk menyamakan istilah.

### 2.3 Prioritas perhatian

Prioritas di bawah adalah **prioritas perhatian**, bukan status blocking dan bukan keputusan bisnis:

| Prioritas perhatian | Cakupan | Alasan |
|---|---|---|
| **P1** | OD-001–OD-015 | Prioritas perhatian pemilik proses bisnis karena memengaruhi fondasi akses, data mahasiswa, kriteria, K-Means, SAW, dan ranking. |
| **P2** | OD-016–OD-018, OD-020–OD-021, OD-023, OD-026 | Memengaruhi alur BPMN inti setelah ranking. |
| **P3** | OD-019, OD-022, OD-024–OD-025, OD-027–OD-031 | Detail lanjutan, fitur non-BPMN, atau kesiapan produksi. |

Prioritas P1–P3 **tidak sama** dengan status blocking. Status blocking ditentukan oleh kelompok register:

| Kelompok | Memblokir fondasi? | Gate yang berlaku |
|---|---|---|
| **B** | **Ya** | Modul yang bergantung langsung pada keputusan B tidak boleh dimulai sebelum keputusan itu dicatat. |
| **C1** | **Tidak** | Gate modul terkait; bukan gate semua modul. |
| **C2** | **Tidak secara umum** | Gate fitur/fase/produksi terkait; bukan gate semua modul. |

Karena itu **OD-006 tetap P1 meskipun C2**. P1 menjelaskan prioritas perhatian; C2 menjelaskan bahwa keputusan itu tidak memblokir fondasi secara umum. **Pengecualian dependensi langsung:** keputusan B/C1 yang mencantumkan OD C2 sebagai dependensi tetap harus menunggu OD tersebut. Contohnya OD-005/OD-007 → OD-006, OD-016/OD-018 → OD-019, OD-020 → OD-022, dan OD-026 → OD-025. Ini bukan alasan menjadikan seluruh C2 wajib.

### 2.4 Penanda pemilik keputusan

- **`[PBP — wajib]`** — pertanyaan wajib dijawab **pemilik proses bisnis**. Dalam dokumen sumber, istilah yang dipakai adalah “pemilik produk”.
- **`[PBP + teknis]`** — pemilik proses bisnis menetapkan kebijakan; tim teknis memberikan masukan yang diperlukan.

Semua OD di register ini memerlukan keputusan pemilik proses bisnis. Penanda di atas membuat kewajiban itu eksplisit dan tidak dapat dianggap sebagai keputusan teknis semata.

### 2.5 Aturan opsi

Opsi pada setiap OD hanya berasal dari dokumen sumber. Opsi tersebut dicatat sebagai **pertanyaan yang masih terbuka**, bukan sebagai pilihan yang sudah disetujui.

Jika sumber hanya menyebut sebuah istilah tanpa memberikan pilihan, register menulis **“belum ditentukan dalam sumber”**. Register tidak menambahkan daftar kriteria, bobot, atribut, cluster, status, dokumen, atau hak akses yang tidak ada di sumber.

### 2.6 Kriteria penutupan keputusan

Sebuah keputusan dinyatakan selesai jika:

1. Ada pemilik keputusan yang tercatat.
2. Ada tanggal dan versi keputusan.
3. Opsi yang dipilih dinyatakan secara eksplisit, termasuk alasan pemilihannya.
4. Dampak terhadap skema, API, UI, dan algoritma dicatat.
5. Dependensi dan keputusan lain yang terdampak dicatat.
6. Dokumen `docs/PRD.md`, `docs/REQUIREMENTS-TRACEABILITY.md`, dan BPMN diperbarui bila keputusan mengubah aktor, status, atau alur.
7. Tidak ada pertentangan dengan D-001–D-004.
8. Kriteria teknis yang didukung sumber dan rencana pengujian modul terkait dicatat.
9. Implementasi modul terkait baru dimulai setelah keputusan disetujui.

Isi keputusan (misalnya daftar kriteria atau status) tidak boleh diisi dengan asumsi. Isi tersebut harus berasal dari keputusan pemilik proses bisnis.

### 2.7 Tiga lapis kriteria penerimaan

Setiap OD memakai tiga lapis yang tidak boleh dicampur:

1. **Kriteria penutupan keputusan** — memeriksa dokumentasi, persetujuan, dampak, dependensi, dan rencana pengujian. Lapis ini wajib dan dapat diverifikasi tanpa menetapkan aturan bisnis baru.
2. **Kriteria teknis yang didukung sumber** — hanya dicantumkan jika dokumen sumber secara eksplisit menyebut requirement teknis tersebut. Jika tidak ada, lapis ini tidak diisi.
3. **Kebutuhan teknis yang belum ditentukan** — topik teknis yang mungkin diperlukan, tetapi belum disebut sumber. Topik ini **bukan** acceptance criteria dan tidak boleh menjadi requirement wajib sampai ada keputusan teknis terpisah.

Dengan demikian, “perlu diputuskan” tidak otomatis berarti “wajib ada”. Item seperti versi parameter, pembulatan, batas unggah, histori penggantian, penanganan kegagalan pengiriman, dan pelaporan hanya boleh menjadi requirement jika sumber mendukung atau pemilik proses bisnis menyetujuinya.

Jika suatu OD tidak memiliki baris **Kriteria teknis yang didukung sumber**, berarti sumber tidak menetapkan kriteria teknis khusus untuk OD tersebut. Rencana pengujian yang disebut pada kriteria penutupan tetap merupakan bagian dari verifikasi keputusan, bukan requirement bisnis baru.

Status implementasi teknis dan matriks kesiapan OD-007–OD-015 dicatat di `docs/REQUIREMENTS-TRACEABILITY.md` §20. Matriks tersebut hanya mencatat kesiapan kode/konfigurasi dan tidak mengubah status keputusan pada register ini.

---

## 3. Ringkasan Keputusan

### 3.1 Keputusan yang sudah dikonfirmasi

| ID | Keputusan | Status | Cakupan yang mengikat | Yang masih terbuka |
|---|---|---|---|---|
| **D-001** | Admin dan Prodi adalah dua role terpisah | **DIKONFIRMASI** | Pemisahan role; tidak boleh menganggap hak akses sama | Kewenangan Admin, kewenangan Prodi, pembagian tugas, matriks izin (OD-001–OD-003) |
| **D-002** | DPM adalah Dosen Pembimbing Magang | **DIKONFIRMASI** | Definisi dan istilah DPM mengikuti BPMN | Penunjukan, penggantian, cakupan bimbingan, kewenangan, akun/login (OD-004, OD-023–OD-025) |
| **D-003** | Mitra tidak memiliki akun aplikasi; komunikasi melalui email dan/atau surat | **DIKONFIRMASI** | Tidak ada portal/autentikasi mitra; kanal komunikasi email/surat | Pembuatan, pengiriman, penerimaan, pencatatan, tenggat, sumber kebenaran status (OD-020–OD-022); cakupan WhatsApp belum diputuskan |
| **D-004** | MVP memprioritaskan alur yang eksplisit di BPMN | **DIKONFIRMASI** | Alur BPMN menjadi prioritas; fitur tambahan tidak otomatis masuk MVP | Daftar fitur final, kebutuhan tambahan, definisi akhir proses, dan seluruh scope fitur (OD-006, OD-019, OD-029–OD-031) |

**Catatan penting:** D-001–D-004 tidak mengonfirmasi satu pun OD. D-001 hanya memisahkan role; D-002 hanya menetapkan definisi DPM; D-003 hanya menetapkan mitra tanpa akun dan kanal email/surat; D-004 hanya menetapkan prinsip prioritas BPMN.

### 3.2 Matriks seluruh keputusan terbuka

| ID | Pertanyaan ringkas | Kelompok | Status sumber | Prioritas perhatian | Gate utama | Pemilik |
|---|---|---|---|---|---|---|
| OD-001 | Kewenangan Admin | **B** | PERLU KONFIRMASI PEMILIK PRODUK | P1 | Sebelum endpoint/UI Admin diperluas | **PBP — wajib** |
| OD-002 | Kewenangan Prodi | **B** | PERLU KONFIRMASI PEMILIK PRODUK | P1 | Sebelum endpoint/UI Prodi | **PBP — wajib** |
| OD-003 | Matriks izin seluruh role | **B** | PERLU KONFIRMASI PEMILIK PRODUK | P1 | Sebelum otorisasi modul bisnis | **PBP — wajib** |
| OD-004 | Login Admin/Prodi/DPM | **B** | BELUM JELAS DI BPMN | P1 | Sebelum perluasan autentikasi | **PBP — wajib** |
| OD-005 | Sumber akun mahasiswa/registrasi | **B** | PERLU KONFIRMASI PEMILIK PRODUK | P1 | Sebelum alur mahasiswa | **PBP — wajib** |
| OD-006 | Profil mahasiswa dalam MVP | **C2** | BELUM DIPUTUSKAN | P1 | Sebelum field profil ditambahkan | **PBP — wajib** |
| OD-007 | Sumber nilai prasyarat | **B** | PERLU KONFIRMASI PEMILIK PRODUK | P1 | Sebelum skema nilai | **PBP — wajib** |
| OD-008 | Validasi data mahasiswa/nilai | **B** | BELUM JELAS DI BPMN | P1 | Sebelum validasi dan eligibility | **PBP — wajib** |
| OD-009 | Atribut dan preprocessing K-Means | **B** | PERLU KONFIRMASI PEMILIK PRODUK | P1 | Sebelum K-Means | **PBP — wajib** |
| OD-010 | Jumlah cluster | **B** | PERLU KONFIRMASI PEMILIK PRODUK | P1 | Sebelum K-Means | **PBP — wajib** |
| OD-011 | Target clustering dan penggunaannya | **B** | BELUM JELAS DI BPMN | P1 | Sebelum K-Means/ranking | **PBP — wajib** |
| OD-012 | Kriteria dan bobot SAW | **B** | PERLU KONFIRMASI PEMILIK PRODUK | P1 | Sebelum skema kriteria/SAW | **PBP — wajib** |
| OD-013 | Benefit/cost, normalisasi, nilai kosong | **B** | PERLU KONFIRMASI PEMILIK PRODUK | P1 | Sebelum SAW | **PBP — wajib** |
| OD-014 | Jumlah ranking dan tie-break | **B** | PERLU KONFIRMASI PEMILIK PRODUK | P1 | Sebelum UI ranking | **PBP — wajib** |
| OD-015 | Pemetaan peminatan dan multi-peminatan | **B** | PERLU KONFIRMASI PEMILIK PRODUK | P1 | Sebelum filter/relasi mitra | **PBP — wajib** |
| OD-016 | Daftar status dan transisi | **C1** | PERLU KONFIRMASI PEMILIK PRODUK | P2 | Sebelum modul pengajuan | **PBP — wajib** |
| OD-017 | Validasi dokumen/revisi/penolakan | **C1** | BELUM JELAS DI BPMN | P2 | Sebelum modul dokumen | **PBP — wajib** |
| OD-018 | Penolakan mitra/pembatalan/pengajuan ulang | **C1** | PERLU KONFIRMASI PEMILIK PRODUK | P2 | Sebelum alur penolakan | **PBP — wajib** |
| OD-019 | Lamaran ke beberapa mitra | **C2** | BELUM DIPUTUSKAN | P3 | Sebelum fitur lamaran multiple; dependensi OD-016/OD-018 | **PBP — wajib** |
| OD-020 | Penyusun/pengirim email/surat | **C1** | BELUM JELAS DI BPMN | P2 | Sebelum penerusan ke mitra | **PBP — wajib** |
| OD-021 | Respons, tenggat, sumber kebenaran status | **C1** | PERLU KONFIRMASI PEMILIK PRODUK | P2 | Sebelum status hasil seleksi | **PBP — wajib** |
| OD-022 | Template/format/riwayat surat | **C2** | BELUM DIPUTUSKAN | P3 | Sebelum template dan histori | **PBP — wajib** |
| OD-023 | Waktu dan pihak penetapan DPM | **C1** | BELUM JELAS DI BPMN | P2 | Sebelum modul DPM | **PBP — wajib** |
| OD-024 | Kriteria/beban/persetujuan/penggantian DPM | **C2** | PERLU KONFIRMASI PEMILIK PRODUK | P3 | Sebelum aturan kriteria/beban/penggantian; bukan gate penetapan dasar | **PBP — wajib** |
| OD-025 | Kewenangan/cakupan/komunikasi DPM | **C2** | PERLU KONFIRMASI PEMILIK PRODUK | P3 | Sebelum fitur DPM | **PBP — wajib** |
| OD-026 | Batas MVP dan penyelesaian magang | **C1** | PERLU KONFIRMASI PEMILIK PRODUK | P2 | Sebelum definisi akhir proses | **PBP — wajib** |
| OD-027 | Keamanan, privasi, audit log | **C2** | PERLU KONFIRMASI PEMILIK PRODUK | P3 | Sebelum data pribadi/produksi | **PBP + teknis** |
| OD-028 | Kinerja, backup, kriteria penerimaan | **C2** | PERLU KONFIRMASI PEMILIK PRODUK | P3 | Sebelum acceptance/produksi | **PBP + teknis** |
| OD-029 | Notifikasi mahasiswa/mitra | **C2** | BELUM DIPUTUSKAN | P3 | Sebelum fitur notifikasi | **PBP — wajib** |
| OD-030 | Laporan, integrasi, pengelolaan pengguna | **C2** | BELUM DIPUTUSKAN | P3 | Sebelum fitur tambahan | **PBP — wajib** |
| OD-031 | Histori rekomendasi/banding | **C2** | BELUM DIPUTUSKAN | P3 | Sebelum histori/banding | **PBP — wajib** |

**Cara membaca gate:** kolom **Kelompok** menentukan status blocking. **B** memblokir fondasi; **C1** adalah gate modul; **C2** adalah gate fitur/fase. Kolom **Prioritas perhatian** tidak mengubah status blocking. OD-006 tetap P1/C2: ia diprioritaskan untuk perhatian dan tidak memblokir fondasi secara umum. Pengecualian: bila keputusan B/C1 mencantumkan OD C2 sebagai dependensi langsung, OD C2 itu harus jelas sebelum keputusan tersebut ditutup; lihat daftar di §2.3.

---

## 4. Keputusan yang Sudah Dikonfirmasi (A)

### D-001 — Admin dan Prodi adalah dua role terpisah

- **Kelompok:** **A — Sudah dikonfirmasi**.
- **Status:** **DIKONFIRMASI**.
- **Yang mengikat:** Admin dan Prodi tidak boleh dianggap memiliki hak akses yang sama.
- **Yang tidak ditetapkan:** kewenangan Admin, kewenangan Prodi, pembagian tugas, dan matriks izin.
- **Dampak:** skema role harus dapat membedakan Admin dan Prodi; API dan UI tidak boleh memakai satu role gabungan; matriks izin tetap menunggu OD-001–OD-003.
- **Kriteria kepatuhan:** tidak ada endpoint, menu, atau test yang memberlakukan Admin dan Prodi sebagai role dengan izin identik.

### D-002 — DPM adalah Dosen Pembimbing Magang

- **Kelompok:** **A — Sudah dikonfirmasi**.
- **Status:** **DIKONFIRMASI**.
- **Yang mengikat:** istilah dan definisi DPM mengikuti BPMN, yaitu **Dosen Pembimbing Magang**.
- **Yang tidak ditetapkan:** mekanisme penunjukan, penggantian, cakupan bimbingan, kewenangan, dan apakah DPM memiliki akun/login (OD-004, OD-023–OD-025).
- **Dampak:** penamaan role/domain harus konsisten; detail akses dan penugasan menunggu OD-004 dan OD-023–OD-025.
- **Catatan istilah:** `docs/BPMN-ANALYSIS.md` §2 mencatat bahwa PRD v0.1 memakai istilah “Dewan Pengawah Mahasiswa”; dokumen aktif menetapkan “Dosen Pembimbing Magang”. Riwayat ini dipertahankan; yang dilarang adalah memakai istilah lama sebagai definisi aktif.
- **Catatan pemetaan:** `docs/PRD.md` §3.1/§7 dan `docs/REQUIREMENTS-TRACEABILITY.md` §2 masih mencantumkan akun/login pada rentang OD-023–OD-025. OD-004 adalah keputusan login Admin/Prodi/DPM. Register menambahkan OD-004; anomali sumber ditandai untuk klarifikasi, bukan diubah maknanya.
- **Kriteria kepatuhan:** tidak ada dokumen aktif atau implementasi baru yang menyebut DPM sebagai “Dewan Pengawah Mahasiswa” atau memberi kewenangan validasi tanpa keputusan; PRD v0.1 tetap dicatat sebagai riwayat.

### D-003 — Mitra tidak memiliki akun aplikasi; komunikasi melalui email dan/atau surat

- **Kelompok:** **A — Sudah dikonfirmasi**.
- **Status:** **DIKONFIRMASI**.
- **Yang mengikat:** tidak ada portal atau autentikasi mitra; komunikasi memakai email dan/atau surat.
- **Yang tidak ditetapkan:** siapa yang membuat/mengirim, apakah sistem mengirim otomatis, apakah WhatsApp termasuk cakupan, bagaimana respons dicatat, tenggat, dan sumber kebenaran status.
- **Dampak:** tidak boleh membuat akun/portal atau endpoint autentikasi mitra; mekanisme komunikasi teknis dan cakupan kanal menunggu OD-020–OD-022.
- **Perbedaan sumber:** PRD/D-003 mengikat **email dan/atau surat**. `docs/BPMN-ANALYSIS.md` §3.3–§3.4 juga menyebut **WhatsApp** pada aktivitas menerima hasil seleksi. Apakah WhatsApp termasuk cakupan D-003 belum diputuskan; register tidak memilih jawaban.
- **Kriteria kepatuhan:** tidak ada fitur login, akun, atau portal mitra yang dibuat berdasarkan asumsi.

### D-004 — MVP memprioritaskan alur yang eksplisit di BPMN

- **Kelompok:** **A — Sudah dikonfirmasi**.
- **Status:** **DIKONFIRMASI**.
- **Yang mengikat:** alur BPMN menjadi prioritas; fitur yang tidak dinyatakan di BPMN tidak otomatis masuk MVP.
- **Yang tidak ditetapkan:** daftar fitur final, kebutuhan tambahan, definisi akhir proses, dan seluruh scope fitur.
- **Dampak:** prioritas implementasi mengikuti alur BPMN, tetapi setiap fitur tetap memerlukan keputusan scope.
- **Kriteria kepatuhan:** tidak ada fitur non-BPMN yang dianggap MVP hanya karena ada di PRD lama atau sudah ada secara teknis.

---

## 5. Keputusan Terbuka yang Memblokir Implementasi (B)

Kelompok ini berisi keputusan yang harus dijawab sebelum modul/fondasi yang bergantung langsung padanya dimulai. Urutan penyajian mengikuti prioritas perhatian, bukan urutan dependensi.

### OD-001 — Kewenangan Admin

- **Kelompok:** **B — Terbuka dan memblokir implementasi**.
- **Status sumber:** **PERLU KONFIRMASI PEMILIK PRODUK**.
- **Prioritas:** P1 — fondasi akses.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum endpoint, UI, atau test yang memperluas kewenangan Admin.
- **Pertanyaan yang harus dijawab:** Apa kewenangan Admin setelah D-001?
- **Opsi yang didukung sumber:** **belum ditentukan dalam sumber**. Sumber hanya menetapkan bahwa Admin adalah role terpisah (D-001) dan lane Admin/Prodi memuat aktivitas mengelola mitra, mengelola kriteria/bobot, melihat notifikasi, memeriksa pengajuan, memverifikasi dokumen, meneruskan ke mitra, menerima hasil, memperbarui status, dan menetapkan DPM. Tidak ada daftar kewenangan Admin yang ditetapkan.
- **Dampak skema:** menentukan apakah diperlukan tabel/kolom izin tambahan atau cukup role yang sudah ada; belum ada skema izin final.
- **Dampak API:** menentukan middleware dan otorisasi endpoint mitra, kriteria, pengajuan, status, dan DPM.
- **Dampak UI:** menentukan menu, route guard, dan aksi yang terlihat untuk Admin.
- **Dampak algoritma:** tidak langsung; dapat memengaruhi siapa yang boleh mengubah kriteria/bobot dan menjalankan ulang rekomendasi.
- **Dependensi:** D-001; OD-002, OD-003; ACT-02, FR-AUTH-05, FR-MIT-01, FR-MIT-02, FR-UI-03, FLOW-01, FLOW-02, FLOW-07, FLOW-08, FLOW-11.
- **Kriteria penutupan keputusan:** daftar aktivitas Admin disetujui; batas dengan Prodi dinyatakan; matriks izin diperbarui; endpoint/UI/test yang terdampak diidentifikasi; tidak ada aktivitas yang diasumsikan sama dengan Prodi.

### OD-002 — Kewenangan Prodi

- **Kelompok:** **B — Terbuka dan memblokir implementasi**.
- **Status sumber:** **PERLU KONFIRMASI PEMILIK PRODUK**.
- **Prioritas:** P1 — fondasi akses.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum endpoint, UI, atau test yang melibatkan Prodi.
- **Pertanyaan yang harus dijawab:** Apa kewenangan Prodi?
- **Opsi yang didukung sumber:** **belum ditentukan dalam sumber**. Sumber hanya menetapkan Prodi sebagai role terpisah (D-001) dan berada dalam lane Admin/Prodi. Tidak ada daftar kewenangan Prodi yang ditetapkan.
- **Dampak skema:** menentukan apakah Prodi memerlukan relasi ke program studi, mahasiswa, atau mitra; belum ada skema final.
- **Dampak API:** menentukan akses Prodi ke endpoint mitra, kriteria, pengajuan, verifikasi, status, dan DPM.
- **Dampak UI:** menentukan menu dan aksi Prodi; saat ini Prodi hanya label frontend tanpa route/API khusus.
- **Dampak algoritma:** tidak langsung; dapat memengaruhi kewenangan mengelola kriteria/bobot dan melihat hasil.
- **Dependensi:** D-001; OD-001, OD-003; ACT-02, FR-AUTH-05, FR-MIT-01, FR-MIT-02, FR-UI-03, FLOW-01, FLOW-02, FLOW-07, FLOW-08, FLOW-11.
- **Kriteria penutupan keputusan:** daftar aktivitas Prodi disetujui; batas dengan Admin dinyatakan; matriks izin diperbarui; endpoint/UI/test yang terdampak diidentifikasi; tidak ada asumsi bahwa Prodi memiliki izin yang sama dengan Admin.

### OD-003 — Matriks izin seluruh role

- **Kelompok:** **B — Terbuka dan memblokir implementasi**.
- **Status sumber:** **PERLU KONFIRMASI PEMILIK PRODUK**.
- **Prioritas:** P1 — fondasi akses.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum otorisasi modul bisnis apa pun.
- **Pertanyaan yang harus dijawab:** Bagaimana matriks izin seluruh role?
- **Opsi yang didukung sumber:** **belum ditentukan dalam sumber**. Kandidat aktor yang disebut adalah Admin, Prodi, Mahasiswa, DPM, dan Mitra eksternal (tanpa akun); Sistem bukan role pengguna. Role lain seperti koordinator atau staf prodi belum diputuskan (Q6). Tidak ada izin per aktor yang ditetapkan.
- **Dampak skema:** menentukan model role/permission, relasi pengguna–role, dan apakah diperlukan permission granular; belum ada skema final.
- **Dampak API:** menentukan otorisasi setiap endpoint, termasuk read/write/approve dan kepemilikan data.
- **Dampak UI:** menentukan route guard, menu, tombol, dan state “tidak berwenang”.
- **Dampak algoritma:** menentukan siapa yang boleh melihat, mengubah, atau menjalankan ulang hasil rekomendasi.
- **Dependensi:** D-001; OD-001, OD-002; ACT-09, FR-AUTH-05, FR-UI-03; Q10.
- **Kriteria penutupan keputusan:** matriks role × aksi disetujui; setiap endpoint/UI dipetakan ke izin; aturan penambahan role dicatat; test `401`/`403` direncanakan; tidak ada role yang diberi izin berdasarkan asumsi.

### OD-004 — Login Admin/Prodi dan DPM

- **Kelompok:** **B — Terbuka dan memblokir implementasi**.
- **Status sumber:** **BELUM JELAS DI BPMN**.
- **Prioritas:** P1 — fondasi akses.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum memperluas autentikasi ke Admin/Prodi/DPM.
- **Pertanyaan yang harus dijawab:** Bagaimana login Admin/Prodi dan DPM? Apakah DPM memiliki akun dan login?
- **Opsi yang didukung sumber:** sumber menyebut **email/password**, **SSO/Google**, atau **mekanisme lain** (Q56), serta pertanyaan apakah DPM memiliki akun (Q4). **Tidak ada pilihan yang ditetapkan.** Implementasi teknis saat ini memakai email/password untuk semua user, tetapi fakta teknis tersebut bukan keputusan bisnis.
- **Dampak skema:** menentukan struktur akun, role, profil DPM, dan mekanisme token/sesi; belum ada skema final.
- **Dampak API:** menentukan endpoint login, refresh/revocation, profil, dan akses berbasis role.
- **Dampak UI:** menentukan halaman login, redirect per role, dan penanganan sesi.
- **Dampak algoritma:** tidak langsung.
- **Dependensi:** D-002; OD-003, OD-005; ACT-03, FR-AUTH-02, FR-AUTH-09; Q4, Q56.
- **Kriteria penutupan keputusan:** mekanisme login per role disetujui; keberadaan akun DPM disetujui; kebijakan token/sesi dicatat; redirect dan test autentikasi direncanakan; tidak ada asumsi bahwa semua role memakai mekanisme yang sama.

### OD-005 — Sumber akun mahasiswa dan registrasi

- **Kelompok:** **B — Terbuka dan memblokir implementasi**.
- **Status sumber:** **PERLU KONFIRMASI PEMILIK PRODUK**.
- **Prioritas:** P1 — fondasi akses/data.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum alur mahasiswa dan provisioning akun.
- **Pertanyaan yang harus dijawab:** Bagaimana sumber akun mahasiswa dan apakah registrasi diperlukan?
- **Opsi yang didukung sumber:** sumber menyebut **pendaftaran mandiri oleh mahasiswa** atau **akun dibuat oleh Admin/Prodi** (Q7). **Tidak ada pilihan yang ditetapkan.**
- **Dampak skema:** menentukan apakah registrasi menyimpan data awal, apakah profil terpisah dari `users`, dan bagaimana status akun; belum ada skema final.
- **Dampak API:** menentukan endpoint registrasi, provisioning, verifikasi, dan pengelolaan akun.
- **Dampak UI:** menentukan halaman registrasi atau alur pembuatan akun oleh Admin/Prodi.
- **Dampak algoritma:** tidak langsung; data mahasiswa menjadi input validasi dan peminatan.
- **Dependensi:** OD-003, OD-004, OD-006; FR-AUTH-04, FR-DATA-01; Q7, Q55.
- **Kriteria penutupan keputusan:** sumber akun disetujui; pihak yang membuat akun disetujui; verifikasi dan data awal dicatat; duplikasi/penolakan akun dicatat; test provisioning direncanakan.

### OD-007 — Sumber nilai mata kuliah prasyarat

- **Kelompok:** **B — Terbuka dan memblokir implementasi**.
- **Status sumber:** **PERLU KONFIRMASI PEMILIK PRODUK**.
- **Prioritas:** P1 — fondasi data/algoritma.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum skema nilai dan input algoritma.
- **Pertanyaan yang harus dijawab:** Dari mana nilai mata kuliah prasyarat diperoleh?
- **Pertanyaan turunan:** daftar mata kuliah prasyarat dan ambang nilai; apakah nilai disimpan sebagai histori atau nilai terbaru saja (Lampiran A butir 4–5).
- **Opsi yang didukung sumber:** **input manual**, **impor**, atau **integrasi akademik** (Q23). **Tidak ada pilihan yang ditetapkan.**
- **Dampak skema:** menentukan tabel nilai, sumber, status sinkronisasi, dan histori; belum ada skema final.
- **Dampak API:** menentukan endpoint input/impor/sinkronisasi dan validasi sumber.
- **Dampak UI:** menentukan form input, unggah berkas, atau status integrasi.
- **Dampak algoritma:** menentukan kualitas dan asal nilai yang dipakai dalam validasi/SAW.
- **Dependensi:** OD-005, OD-006, OD-008; FR-GRADE-02, FR-GRADE-03; Q23.
- **Kriteria penutupan keputusan:** sumber nilai disetujui; format dan pemilik data dicatat; aturan sinkronisasi/manual dicatat; validasi dan audit sumber dicatat; test input/impor direncanakan.

### OD-008 — Aturan validasi data mahasiswa dan nilai

- **Kelompok:** **B — Terbuka dan memblokir implementasi**.
- **Status sumber:** **BELUM JELAS DI BPMN**.
- **Prioritas:** P1 — fondasi data/algoritma.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum validasi, eligibility, dan pemrosesan algoritma.
- **Pertanyaan yang harus dijawab:** Apa aturan validasi data mahasiswa dan nilai?
- **Pertanyaan turunan:** daftar mata kuliah prasyarat dan ambang nilai; apakah nilai disimpan sebagai histori atau nilai terbaru saja (Lampiran A butir 4–5).
- **Opsi yang didukung sumber:** **belum ditentukan dalam sumber**. Sumber hanya menyebut “Validasi data mahasiswa”, menanyakan mata kuliah/ambang nilai (Q24), dan menanyakan penanganan data tidak valid (Q27). Tidak ada aturan validasi yang ditetapkan.
- **Dampak skema:** menentukan constraint, status validasi, dan kemungkinan histori perbaikan; belum ada skema final.
- **Dampak API:** menentukan respons validasi, kode error, dan apakah data tidak valid boleh disimpan.
- **Dampak UI:** menentukan pesan error, state data tidak lengkap, dan alur perbaikan.
- **Dampak algoritma:** menentukan apakah mahasiswa memenuhi syarat untuk diproses dan bagaimana data kosong ditangani.
- **Dependensi:** OD-007, OD-009, OD-012; FR-GRADE-03, FR-GRADE-04, FR-GRADE-05, FR-ALG-08; Q24, Q27.
- **Kriteria penutupan keputusan:** aturan validasi disetujui; ambang/skala dicatat; perilaku data tidak valid/kosong dicatat; pihak yang memperbaiki data dicatat; test validasi dan error state direncanakan.

### OD-009 — Atribut dan preprocessing K-Means

- **Kelompok:** **B — Terbuka dan memblokir implementasi**.
- **Status sumber:** **PERLU KONFIRMASI PEMILIK PRODUK**.
- **Prioritas:** P1 — fondasi algoritma.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum implementasi K-Means dan atribut mitra.
- **Pertanyaan yang harus dijawab:** Atribut apa yang digunakan dan bagaimana preprocessing?
- **Opsi yang didukung sumber:** **belum ditentukan dalam sumber**. Tidak ada daftar atribut, skala, transformasi, atau penanganan data kosong.
- **Dampak skema:** menentukan atribut mitra yang harus disimpan dan apakah diperlukan tabel nilai/atribut terpisah; belum ada skema final.
- **Dampak API:** menentukan kontrak input K-Means dan endpoint data atribut.
- **Dampak UI:** menentukan form/daftar atribut yang dikelola Admin/Prodi.
- **Dampak algoritma:** menentukan vektor input, normalisasi, dan reproduksibilitas clustering.
- **Dependensi:** OD-007, OD-011, OD-012, OD-015; FR-MIT-03, FR-ALG-01, FR-ALG-05; Q11.
- **Kriteria penutupan keputusan:** daftar atribut disetujui; tipe/skala dan preprocessing dicatat; sumber nilai atribut dicatat; penanganan nilai kosong dicatat; kontrak algoritma disetujui; tidak ada atribut yang dikarang.

### OD-010 — Jumlah cluster dan cara menentukannya

- **Kelompok:** **B — Terbuka dan memblokir implementasi**.
- **Status sumber:** **PERLU KONFIRMASI PEMILIK PRODUK**.
- **Prioritas:** P1 — fondasi algoritma.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum implementasi K-Means.
- **Pertanyaan yang harus dijawab:** Berapa jumlah cluster dan bagaimana menentukannya?
- **Opsi yang didukung sumber:** **belum ditentukan dalam sumber**. Tidak ada jumlah cluster, metode penentuan, atau ambang evaluasi yang ditetapkan.
- **Dampak skema:** menentukan apakah parameter cluster disimpan sebagai konfigurasi/versi hasil; belum ada skema final.
- **Dampak API:** menentukan parameter yang dapat dikirim/dibaca dan apakah hasil clustering disimpan.
- **Dampak UI:** menentukan apakah pengguna dapat memilih/melihat jumlah cluster; belum ditentukan.
- **Dampak algoritma:** menentukan jumlah kelompok, stabilitas hasil, dan cara evaluasi.
- **Dependensi:** OD-009, OD-011; FR-ALG-01, FR-ALG-05; Q12.
- **Kriteria penutupan keputusan:** jumlah cluster atau aturan penentuannya disetujui; dasar penentuan dicatat; test hasil clustering direncanakan.
- **Kebutuhan teknis belum ditentukan:** penyimpanan versi parameter dan tingkat reproduksibilitas hasil; tidak disebut sumber, sehingga bukan acceptance criteria sampai ada keputusan teknis terpisah.

### OD-011 — Target clustering dan penggunaan hasil

- **Kelompok:** **B — Terbuka dan memblokir implementasi**.
- **Status sumber:** **BELUM JELAS DI BPMN**.
- **Catatan sumber proposal:** dokumen proposal capstone menyatakan label klaster ditampilkan sebagai **informasi analitik** dan bukan filter wajib sebelum SAW. Implementasi saat ini mengikuti pernyataan tersebut (klaster tidak menyaring kandidat SAW), tetapi target clustering, arti label, dan penggunaan hasil secara resmi tetap menunggu keputusan pada OD ini.
- **Prioritas:** P1 — fondasi algoritma.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum K-Means, filter, dan ranking.
- **Pertanyaan yang harus dijawab:** Apa target clustering dan bagaimana hasilnya digunakan?
- **Opsi yang didukung sumber:** sumber menanyakan apakah yang dikelompokkan adalah **mitra**, **mahasiswa**, atau **keduanya** (Q13). BPMN menyebut “pengelompokan mitra”, tetapi penggunaan hasilnya tidak dijelaskan. **Tidak ada pilihan yang ditetapkan.**
- **Dampak skema:** menentukan entitas yang memiliki hasil cluster dan relasi hasil ke mitra/mahasiswa; belum ada skema final.
- **Dampak API:** menentukan endpoint hasil cluster dan apakah hasil menjadi input filter/ranking.
- **Dampak UI:** menentukan tampilan cluster/label dan pengaruhnya pada rekomendasi.
- **Dampak algoritma:** menentukan pipeline K-Means → filter → SAW dan apakah cluster memfilter atau hanya memberi konteks.
- **Dependensi:** OD-009, OD-010, OD-015; FR-ALG-01; Q13.
- **Kriteria penutupan keputusan:** target clustering disetujui; arti setiap cluster disetujui; penggunaan hasil dalam filter/SAW disetujui; aturan kapan hasil dihitung ulang dicatat; test pipeline direncanakan.

### OD-012 — Kriteria dan bobot SAW

- **Kelompok:** **B — Terbuka dan memblokir implementasi**.
- **Status sumber:** **PERLU KONFIRMASI PEMILIK PRODUK**.
- **Prioritas:** P1 — fondasi algoritma.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum migration/API/UI kriteria dan implementasi SAW.
- **Pertanyaan yang harus dijawab:** Apa kriteria dan bobot SAW? Siapa yang menetapkan bobot?
- **Pertanyaan turunan:** apakah kriteria berbeda per peminatan; apakah nama kriteria unik dan apakah ada kode/urutan tampilan; apakah kriteria dapat dinonaktifkan atau dihapus setelah dipakai (Lampiran A butir 1–3).
- **Opsi yang didukung sumber:** **belum ditentukan dalam sumber**. Tidak ada daftar kriteria resmi, bobot, skala bobot, atau pihak yang menetapkan bobot. Draft tabel `criteria` di `docs/CRITERIA-GAP-ANALYSIS.md` §6.1 adalah **bahan keputusan, bukan skema final**.
- **Dampak skema:** menentukan tabel kriteria, bobot, status aktif, urutan, dan kemungkinan versioning; draft yang ada belum final.
- **Dampak API:** menentukan CRUD kriteria/bobot dan validasi total/rentang.
- **Dampak UI:** menentukan halaman pengelolaan kriteria dan bobot oleh role yang berwenang.
- **Dampak algoritma:** menentukan input SAW dan hasil peringkat.
- **Dependensi:** OD-001–OD-003, OD-009, OD-015; FR-MIT-02, FR-ALG-03, FR-ALG-06, FLOW-02; Q14, Q15.
- **Kriteria penutupan keputusan:** daftar kriteria resmi disetujui; bobot dan penanggung jawabnya disetujui; skala/total bobot disetujui; aturan perubahan/versioning disetujui; skema/API/UI/algoritma diperbarui; tidak ada kriteria atau bobot yang dikarang.

### OD-013 — Benefit/cost, normalisasi, dan nilai kosong

- **Kelompok:** **B — Terbuka dan memblokir implementasi**.
- **Status sumber:** **PERLU KONFIRMASI PEMILIK PRODUK**.
- **Prioritas:** P1 — fondasi algoritma.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum implementasi SAW.
- **Pertanyaan yang harus dijawab:** Bagaimana benefit/cost, normalisasi, dan nilai kosong?
- **Opsi yang didukung sumber:** sumber hanya menyebut istilah **benefit** dan **cost**, serta menanyakan normalisasi, skala penilaian, dan nilai kosong (Q16, Q17). **Tidak ada kriteria mana yang benefit/cost, rumus normalisasi, skala, atau perilaku nilai kosong yang ditetapkan.**
- **Dampak skema:** menentukan tipe kriteria, batas skala, dan representasi nilai kosong; belum ada skema final.
- **Dampak API:** menentukan validasi nilai dan respons terhadap data kosong.
- **Dampak UI:** menentukan label benefit/cost, rentang input, dan pesan data kosong.
- **Dampak algoritma:** menentukan rumus normalisasi, pembagian nol, dan hasil akhir.
- **Dependensi:** OD-012, OD-009, OD-014; FR-ALG-03, FR-ALG-06; Q16, Q17.
- **Kriteria penutupan keputusan:** tipe benefit/cost per kriteria disetujui; skala dan rumus normalisasi disetujui; perilaku nilai kosong/nol disetujui; test perhitungan direncanakan.
- **Kebutuhan teknis belum ditentukan:** aturan pembulatan hasil; tidak disebut sumber, sehingga bukan acceptance criteria sampai ada keputusan teknis terpisah.

### OD-014 — Jumlah ranking dan tie-break

- **Kelompok:** **B — Terbuka dan memblokir implementasi**.
- **Status sumber:** **PERLU KONFIRMASI PEMILIK PRODUK**.
- **Prioritas:** P1 — fondasi UI/algoritma.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum UI ranking dan implementasi pengurutan.
- **Pertanyaan yang harus dijawab:** Berapa ranking yang ditampilkan dan bagaimana tie-break? Apa yang terjadi jika tidak ada mitra cocok, hasil kosong, atau K-Means/SAW gagal?
- **Pertanyaan turunan:** penanganan kegagalan K-Means/SAW (Lampiran A butir 6).
- **Opsi yang didukung sumber:** sumber menanyakan apakah **semua mitra** atau **top-N** yang ditampilkan (Q20). Aturan tie-break tidak ditetapkan (Q17). **Tidak ada pilihan yang ditetapkan.**
- **Dampak skema:** menentukan apakah hasil ranking disimpan dan apakah diperlukan urutan/versi; belum ada skema final.
- **Dampak API:** menentukan parameter limit/top-N, pagination, dan urutan hasil.
- **Dampak UI:** menentukan jumlah kartu/baris, penanda peringkat, dan perilaku hasil kosong.
- **Dampak algoritma:** menentukan pengurutan dan aturan tie-break yang reproducible.
- **Dependensi:** OD-012, OD-013; FR-ALG-04, FR-ALG-07, FR-ALG-08, FR-UI-01; Q17, Q20.
- **Kriteria penutupan keputusan:** jumlah/semua ranking disetujui; tie-break disetujui; perilaku hasil kosong dan kegagalan K-Means/SAW disetujui; parameter API/UI dicatat; test urutan dan tie-break direncanakan.

### OD-015 — Pemetaan peminatan DTA/PSI/SIA dan multi-peminatan

- **Kelompok:** **B — Terbuka dan memblokir implementasi**.
- **Status sumber:** **PERLU KONFIRMASI PEMILIK PRODUK**.
- **Prioritas:** P1 — fondasi data/algoritma.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum relasi mitra–peminatan, penyimpanan pilihan mahasiswa, dan filter.
- **Pertanyaan yang harus dijawab:** Bagaimana pemetaan DTA/PSI/SIA dan aturan multi-peminatan?
- **Pertanyaan turunan:** apakah kriteria SAW berbeda per peminatan (Lampiran A butir 1).
- **Opsi yang didukung sumber:** label **DTA**, **PSI**, dan **SIA** disebut eksplisit. Sumber menanyakan apakah mahasiswa memilih **tepat satu** atau **lebih dari satu** peminatan (Q19), apakah pilihan dapat diubah, apakah disimpan **per mahasiswa atau per pengajuan** (`docs/STUDENT-FLOW-GAP-ANALYSIS.md` §3.2), dan bagaimana pemetaan ke mitra. **Tidak ada pilihan yang ditetapkan.**
- **Dampak skema:** menentukan relasi mahasiswa–peminatan, mitra–peminatan, kardinalitas, dan histori perubahan; belum ada skema final.
- **Dampak API:** menentukan endpoint pilihan peminatan, validasi, dan filter mitra.
- **Dampak UI:** menentukan pemilih peminatan, status terkunci, dan tampilan filter.
- **Dampak algoritma:** menentukan himpunan mitra yang masuk filter sebelum SAW.
- **Dependensi:** OD-007, OD-009, OD-012; FR-MIT-04, FR-PREF-02, FR-ALG-02; Q18, Q19.
- **Kriteria penutupan keputusan:** kardinalitas pilihan disetujui; cakupan persistensi (mahasiswa/pengajuan) disetujui; aturan perubahan disetujui; pemetaan mitra–peminatan disetujui; perilaku multi-peminatan disetujui; test filter direncanakan.

---

## 6. Keputusan Terbuka yang Dapat Ditunda (C)

Kelompok ini tidak memblokir fondasi rekomendasi, tetapi tetap menjadi gate sebelum modul atau fase terkait dimulai. “Dapat ditunda” tidak berarti “opsional”.

### 6.1 C1 — Gate alur BPMN inti

#### OD-016 — Daftar status dan transisi pengajuan

- **Kelompok:** **C1 — Dapat ditunda sampai fase pengajuan**.
- **Status sumber:** **PERLU KONFIRMASI PEMILIK PRODUK**.
- **Prioritas:** P2 — alur BPMN inti.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum modul pengajuan, status, dan dashboard pengajuan.
- **Pertanyaan yang harus dijawab:** Apa daftar status dan transisi yang sah? Siapa yang berwenang mengubah setiap status?
- **Opsi yang didukung sumber:** hanya **Diterima** dan **Ditolak** yang eksplisit di BPMN. Status antara, pembatalan, pengunduran diri, dan definisi “selesai” untuk pengajuan tanpa respons belum ditentukan (Q25, Q26, Q33, Q34). **Tidak ada daftar status atau transisi yang ditetapkan.**
- **Dampak skema:** menentukan tabel/kolom status, riwayat transisi, dan constraint; belum ada skema final.
- **Dampak API:** menentukan endpoint transisi, guard, dan respons status.
- **Dampak UI:** menentukan stepper/badge status dan aksi yang tersedia per status.
- **Dampak algoritma:** dapat memengaruhi perhitungan ulang setelah penolakan/perubahan data (Q22).
- **Dependensi:** OD-017, OD-018, OD-019, OD-021; FR-APP-09, FR-APP-14, FR-STATUS-01, FR-STATUS-02, FLOW-05, FLOW-11.
- **Kriteria penutupan keputusan:** state machine lengkap (status, aktor, pemicu, guard, efek samping) disetujui; status pembatalan/pengunduran diri/tanpa respons disetujui; audit transisi dicatat; test transisi direncanakan.

#### OD-017 — Validasi dokumen, revisi, dan penolakan Admin/Prodi

- **Kelompok:** **C1 — Dapat ditunda sampai fase dokumen**.
- **Status sumber:** **BELUM JELAS DI BPMN**.
- **Prioritas:** P2 — alur BPMN inti.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum modul dokumen dan verifikasi.
- **Pertanyaan yang harus dijawab:** Bagaimana validasi dokumen, revisi, dan penolakan Admin/Prodi? Apakah rekomendasi juga memerlukan persetujuan Admin/Prodi?
- **Pertanyaan turunan:** makna persetujuan rekomendasi oleh Admin/Prodi (Lampiran A butir 7).
- **Opsi yang didukung sumber:** **belum ditentukan dalam sumber**. Sumber menyebut verifikasi dokumen dan kelengkapan, serta menanyakan jenis/format dokumen (Q27, Q41), penolakan Admin/Prodi (Q28), dan verifikasi surat penerimaan (Q32). Tidak ada daftar dokumen, syarat, atau alur revisi.
- **Dampak skema:** menentukan tabel dokumen, status verifikasi, versi berkas, dan retensi; belum ada skema final.
- **Dampak API:** menentukan unggah, validasi, verifikasi, revisi, dan penolakan.
- **Dampak UI:** menentukan checklist dokumen, unggah ulang, dan state revisi.
- **Dampak algoritma:** tidak langsung.
- **Dependensi:** OD-016; FR-APP-04, FR-APP-05, FR-APP-06, FR-APP-10, FR-APP-11, FR-UI-04, FLOW-07, FLOW-08.
- **Kriteria penutupan keputusan:** daftar dokumen wajib disetujui; format berkas disetujui; alur revisi/penolakan disetujui; verifikasi surat penerimaan disetujui; retensi/akses dicatat; test unggah/verifikasi direncanakan.
- **Kebutuhan teknis belum ditentukan:** batas ukuran unggah berkas; tidak disebut sumber, sehingga bukan acceptance criteria sampai ada keputusan teknis terpisah.

#### OD-018 — Penolakan mitra, pembatalan, dan pengajuan ulang

- **Kelompok:** **C1 — Dapat ditunda sampai fase pengajuan**.
- **Status sumber:** **PERLU KONFIRMASI PEMILIK PRODUK**.
- **Prioritas:** P2 — alur BPMN inti.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum alur penolakan dan pengajuan ulang.
- **Pertanyaan yang harus dijawab:** Bagaimana penolakan mitra, pembatalan, dan pengajuan ulang?
- **Opsi yang didukung sumber:** BPMN memiliki **loop pengajuan ulang** setelah penolakan. Batas jumlah pengajuan ulang tidak ditentukan (Q30); pembatalan/pengunduran diri tidak ada di BPMN (Q33); perhitungan ulang setelah penolakan belum ditentukan (Q22). **Tidak ada aturan yang ditetapkan.**
- **Dampak skema:** menentukan status/histori pengajuan dan batas pengajuan; belum ada skema final.
- **Dampak API:** menentukan endpoint pengajuan ulang, pembatalan, dan validasi batas.
- **Dampak UI:** menentukan aksi “ajukan lagi”, status penolakan, dan konfirmasi pembatalan.
- **Dampak algoritma:** menentukan apakah rekomendasi dihitung ulang setelah penolakan/perubahan.
- **Dependensi:** OD-016, OD-019, OD-021; FR-APP-12, FR-APP-13, FR-ALG-09, FLOW-13.
- **Kriteria penutupan keputusan:** aturan penolakan disetujui; batas pengajuan ulang disetujui; pembatalan/pengunduran diri disetujui atau dinyatakan di luar scope; aturan hitung ulang disetujui; test alur direncanakan.

#### OD-020 — Penyusun dan pengirim email/surat

- **Kelompok:** **C1 — Dapat ditunda sampai fase komunikasi mitra**.
- **Status sumber:** **BELUM JELAS DI BPMN**.
- **Prioritas:** P2 — alur BPMN inti.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum penerusan pengajuan ke mitra.
- **Pertanyaan yang harus dijawab:** Siapa menyusun dan mengirim email/surat? Apakah sistem benar-benar mengirim, atau hanya membuat dokumen? Apakah WhatsApp termasuk kanal yang dimaksud?
- **Pertanyaan turunan:** apakah WhatsApp termasuk cakupan D-003; lihat catatan perbedaan sumber pada D-003.
- **Opsi yang didukung sumber:** **sistem**, **Admin**, atau **Prodi** sebagai penyusun/pengirim (Q35); **sistem mengirim email** atau **hanya membuat dokumen untuk dikirim manual** (Q36); kanal yang ditanyakan adalah **dashboard, email, WhatsApp, atau surat** (Q37). D-003 mengikat kanal **email dan/atau surat** serta mitra tanpa akun. `docs/BPMN-ANALYSIS.md` §3.3–§3.4 juga menyebut WhatsApp, sehingga cakupan WhatsApp **belum diputuskan**; register tidak memilih. D-003 tidak memutuskan otomasi. **Tidak ada pilihan yang ditetapkan.**
- **Dampak skema:** menentukan tabel dokumen/email, status pengiriman, dan riwayat; belum ada skema final.
- **Dampak API:** menentukan endpoint generate/send dan integrasi email.
- **Dampak UI:** menentukan aksi “buat surat”, “kirim”, dan status pengiriman.
- **Dampak algoritma:** tidak langsung.
- **Dependensi:** D-003; OD-017, OD-021, OD-022; FR-APP-07, FR-APP-08, FR-MITRA-01, FLOW-08.
- **Kriteria penutupan keputusan:** penyusun/pengirim disetujui; batas otomasi disetujui; kanal disetujui; audit pengiriman dicatat; tidak ada asumsi pengiriman otomatis.
- **Kebutuhan teknis belum ditentukan:** penanganan kegagalan pengiriman; tidak disebut sumber, sehingga bukan acceptance criteria sampai ada keputusan teknis terpisah.

#### OD-021 — Pencatatan respons, tenggat, dan sumber kebenaran status

- **Kelompok:** **C1 — Dapat ditunda sampai fase status mitra**.
- **Status sumber:** **PERLU KONFIRMASI PEMILIK PRODUK**.
- **Prioritas:** P2 — alur BPMN inti.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum status hasil seleksi dan pencatatan respons mitra.
- **Pertanyaan yang harus dijawab:** Bagaimana pencatatan respons, tenggat, dan sumber kebenaran status? Apakah ada kriteria seleksi mitra dan kuota?
- **Pertanyaan turunan:** kriteria seleksi mitra dan kuota (Lampiran A butir 8).
- **Opsi yang didukung sumber:** sumber menanyakan ada/tidaknya **tenggat respons** dan **pengingat otomatis** (Q38), perilaku jika **mitra tidak merespons** (Q39), dan sumber kebenaran status: **mitra**, **Admin/Prodi**, atau **sistem** (Q40). **Tidak ada pilihan yang ditetapkan.**
- **Dampak skema:** menentukan tabel respons, tenggat, pengingat, dan histori status; belum ada skema final.
- **Dampak API:** menentukan endpoint pencatatan respons dan transisi status.
- **Dampak UI:** menentukan input hasil, countdown/tenggat, dan penanda “tanpa respons”.
- **Dampak algoritma:** dapat memengaruhi status pengajuan dan perhitungan ulang.
- **Dependensi:** D-003; OD-016, OD-020; FR-MIT-05, FR-MITRA-02, FR-MITRA-04, FR-MITRA-05, FR-APP-09, FLOW-09.
- **Kriteria penutupan keputusan:** sumber kebenaran disetujui; cara pencatatan respons disetujui; tenggat/pengingat disetujui; status tanpa respons disetujui; aturan konflik data disetujui; kriteria seleksi mitra/kuota disetujui atau dinyatakan di luar scope; test direncanakan.

#### OD-023 — Waktu dan pihak penetapan DPM

- **Kelompok:** **C1 — Dapat ditunda sampai fase DPM**.
- **Status sumber:** **BELUM JELAS DI BPMN**.
- **Prioritas:** P2 — alur BPMN inti.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum modul penetapan DPM.
- **Pertanyaan yang harus dijawab:** Kapan dan siapa yang menetapkan DPM?
- **Opsi yang didukung sumber:** BPMN menempatkan penetapan setelah update status dan menyebut Admin/Prodi sebagai pelaku; catatan BPMN menyatakan DPM baru terlibat setelah mahasiswa diterima, tetapi diagram tidak memiliki gateway dan memiliki garis penolakan yang membingungkan. Sumber menanyakan apakah DPM **hanya untuk mahasiswa diterima** (Q42). **Tidak ada pilihan yang ditetapkan.**
- **Dampak skema:** menentukan relasi mahasiswa–DPM, waktu penetapan, status, dan histori; belum ada skema final.
- **Dampak API:** menentukan endpoint penetapan, validasi eligibility, dan penggantian.
- **Dampak UI:** menentukan aksi penetapan dan tampilan DPM.
- **Dampak algoritma:** tidak langsung.
- **Dependensi:** D-002; OD-003, OD-016, OD-026; FR-DPM-01, FR-DPM-02, FR-DPM-04, FLOW-11.
- **Kriteria penutupan keputusan:** eligibility disetujui; waktu penetapan disetujui; pihak berwenang disetujui; test penetapan direncanakan.

#### OD-026 — Batas MVP dan penyelesaian magang

- **Kelompok:** **C1 — Dapat ditunda sampai definisi akhir proses**.
- **Status sumber:** **PERLU KONFIRMASI PEMILIK PRODUK**.
- **Prioritas:** P2 — scope.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum mendefinisikan “selesai” dan fitur DPM akhir.
- **Pertanyaan yang harus dijawab:** Apakah MVP berhenti di BPMN atau mencakup evaluasi/penyelesaian magang?
- **Opsi yang didukung sumber:** BPMN berhenti pada **membimbing mahasiswa selama magang** dan end event DPM; evaluasi, penilaian, feedback, tanda tangan, dan penyelesaian magang tidak tercantum. Sumber menanyakan apakah proses berakhir setelah mahasiswa **mulai magang** atau setelah **magang selesai** (Q46). **Tidak ada pilihan yang ditetapkan.**
- **Dampak skema:** menentukan apakah diperlukan tabel evaluasi/penilaian/penyelesaian; belum ada skema final.
- **Dampak API:** menentukan endpoint akhir proses dan status penyelesaian.
- **Dampak UI:** menentukan dashboard/status akhir untuk mahasiswa dan DPM.
- **Dampak algoritma:** tidak langsung.
- **Dependensi:** D-004; OD-023, OD-025; FR-DPM-06, FLOW-12; Q46.
- **Kriteria penutupan keputusan:** batas MVP disetujui; definisi “selesai” per alur disetujui; fitur di luar batas dicatat; dampak ke DPM dicatat.
- **Kebutuhan teknis belum ditentukan:** pelaporan; tidak tercantum di BPMN, sehingga bukan acceptance criteria sampai ada keputusan scope terpisah.

### 6.2 C2 — Dapat ditunda lebih lama

#### OD-006 — Profil mahasiswa dalam MVP

- **Kelompok:** **C2 — Dapat ditunda lebih lama**.
- **Status sumber:** **BELUM DIPUTUSKAN**.
- **Prioritas:** P1 — prioritas perhatian; dapat ditunda sampai field profil dibutuhkan.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum menambah field/halaman profil mahasiswa.
- **Pertanyaan yang harus dijawab:** Apakah profil mahasiswa termasuk MVP? Field apa yang wajib? Siapa yang boleh membuat/mengubah?
- **Opsi yang didukung sumber:** sumber menanyakan apakah profil termasuk MVP (Q8). `docs/STUDENT-FLOW-GAP-ANALYSIS.md` §3.1 menyebut kandidat field **NIM, program studi, fakultas, angkatan, nomor telepon, alamat, atau lainnya** sebagai pertanyaan; tidak ada field yang ditetapkan. **Belum ditentukan dalam sumber.**
- **Dampak skema:** menentukan apakah profil menjadi kolom tambahan `users` atau tabel `student_profiles`; belum ada skema final.
- **Dampak API:** menentukan endpoint baca/ubah profil dan otorisasinya.
- **Dampak UI:** menentukan halaman profil dan field wajib/opsional.
- **Dampak algoritma:** dapat memengaruhi data peminatan dan nilai, tetapi tidak langsung.
- **Dependensi:** OD-005, OD-015; FR-AUTH-07, FR-UI-02; Q8.
- **Catatan dependensi:** meskipun C2, OD-006 muncul sebagai dependensi langsung OD-005 dan OD-007. Modul yang benar-benar membutuhkannya harus menunggu keputusan ini; modul lain tidak.
- **Kriteria penutupan keputusan:** status MVP disetujui; daftar field disetujui; pemilik dan aturan ubah disetujui; skema/API/UI diperbarui.

#### OD-019 — Lamaran ke beberapa mitra

- **Kelompok:** **C2 — Dapat ditunda lebih lama**.
- **Status sumber:** **BELUM DIPUTUSKAN**.
- **Prioritas:** P3 — detail pengajuan.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum fitur lamaran ke beberapa mitra; OD-016 dan OD-018 mencantumkannya sebagai dependensi, sehingga bagian status/penolakan yang menyentuh lamaran multiple harus menunggu.
- **Pertanyaan yang harus dijawab:** Apakah mahasiswa boleh melamar ke beberapa mitra?
- **Catatan:** preferensi magang berperingkat tidak sama dengan lamaran multiple; pertanyaan itu belum terpetakan ke OD (Lampiran A butir 9).
- **Opsi yang didukung sumber:** sumber hanya menanyakan apakah boleh melamar ke lebih dari satu mitra (Q29); BPMN menggambarkan satu pengajuan pada satu waktu dan loop pengajuan ulang, tetapi tidak menyatakan izin atau larangan multiple. **Tidak ada pilihan yang ditetapkan.**
- **Dampak skema:** menentukan constraint pengajuan aktif, relasi mahasiswa–mitra, dan histori; belum ada skema final.
- **Dampak API:** menentukan validasi jumlah lamaran aktif dan endpoint pengajuan.
- **Dampak UI:** menentukan tampilan lamaran aktif dan aksi pengajuan.
- **Dampak algoritma:** dapat memengaruhi rekomendasi dan perhitungan ulang.
- **Dependensi:** OD-016, OD-018; FR-APP-01, FR-APP-13, FR-APP-15, FLOW-05, FLOW-13.
- **Kriteria penutupan keputusan:** izin/larangan multiple disetujui; batas lamaran aktif disetujui; dampak ke status dan komunikasi mitra dicatat; test validasi direncanakan.

#### OD-022 — Template, format, dan riwayat surat

- **Kelompok:** **C2 — Dapat ditunda lebih lama**.
- **Status sumber:** **BELUM DIPUTUSKAN**.
- **Prioritas:** P3 — detail dokumen.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum template dan histori surat.
- **Pertanyaan yang harus dijawab:** Bagaimana template, format, dan riwayat surat?
- **Opsi yang didukung sumber:** **belum ditentukan dalam sumber**. Sumber hanya menanyakan format surat penerimaan/penolakan (Q41) dan kanal/riwayat (Q37); tidak ada template atau format yang ditetapkan.
- **Dampak skema:** menentukan tabel template dan riwayat dokumen; belum ada skema final.
- **Dampak API:** menentukan generate/preview/unduh dan penyimpanan riwayat.
- **Dampak UI:** menentukan pratinjau, unduh, dan histori.
- **Dampak algoritma:** tidak langsung.
- **Dependensi:** OD-020, OD-021; FR-MITRA-03, FR-NOTIF-03, FLOW-10.
- **Kriteria penutupan keputusan:** pemilik template disetujui; format dan aturan riwayat disetujui; retensi/akses riwayat disetujui; test generate/unduh direncanakan.

#### OD-024 — Kriteria, beban, persetujuan, dan penggantian DPM

- **Kelompok:** **C2 — Dapat ditunda lebih lama**.
- **Status sumber:** **PERLU KONFIRMASI PEMILIK PRODUK**.
- **Prioritas:** P3 — detail DPM.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum aturan kriteria, beban, persetujuan, dan penggantian DPM; **bukan** gate untuk penetapan DPM dasar.
- **Pertanyaan yang harus dijawab:** Apa kriteria penugasan, beban, persetujuan, dan penggantian DPM?
- **Opsi yang didukung sumber:** sumber menanyakan **beban dosen**, **peminatan**, **ketersediaan**, atau **persetujuan dosen** (Q43), serta apakah DPM dapat **menolak penetapan atau diganti** (Q44). **Tidak ada pilihan yang ditetapkan.**
- **Dampak skema:** menentukan data dosen, beban, status persetujuan, dan histori penggantian; belum ada skema final.
- **Dampak API:** menentukan validasi penugasan dan endpoint penggantian.
- **Dampak UI:** menentukan daftar DPM, beban, dan aksi persetujuan/penggantian.
- **Dampak algoritma:** tidak langsung.
- **Dependensi:** OD-023, OD-025; FR-DPM-05; Q43, Q44.
- **Kriteria penutupan keputusan:** kriteria penugasan disetujui; batas beban disetujui; alur persetujuan disetujui; aturan penggantian disetujui; test penugasan direncanakan.
- **Kebutuhan teknis belum ditentukan:** histori penggantian DPM; Q44 menanyakan penggantian, tetapi tidak menetapkan histori, sehingga bukan acceptance criteria sampai ada keputusan teknis terpisah.

#### OD-025 — Kewenangan, cakupan bimbingan, dan komunikasi DPM

- **Kelompok:** **C2 — Dapat ditunda lebih lama**.
- **Status sumber:** **PERLU KONFIRMASI PEMILIK PRODUK**.
- **Prioritas:** P3 — detail DPM.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum fitur DPM selain penetapan.
- **Pertanyaan yang harus dijawab:** Apa kewenangan, cakupan bimbingan, dan komunikasi DPM?
- **Opsi yang didukung sumber:** BPMN hanya memuat **membimbing mahasiswa selama magang**. Sumber menanyakan apakah DPM melakukan **monitoring, penilaian, feedback, atau tanda tangan** (Q45) dan bagaimana komunikasi DPM–mahasiswa dicatat (Q47). **Tidak ada kewenangan tambahan yang ditetapkan.**
- **Dampak skema:** menentukan tabel catatan bimbingan, penilaian, feedback, atau tanda tangan jika dipilih; belum ada skema final.
- **Dampak API:** menentukan endpoint DPM dan akses data mahasiswa.
- **Dampak UI:** menentukan dashboard DPM dan aksi bimbingan.
- **Dampak algoritma:** tidak langsung.
- **Dependensi:** D-002; OD-023, OD-024, OD-026, OD-027; FR-DPM-03, FR-DPM-06, FR-DPM-07, FLOW-12.
- **Kriteria penutupan keputusan:** daftar kewenangan disetujui; cakupan bimbingan disetujui; kanal/catatan komunikasi disetujui; akses data disetujui; test akses DPM direncanakan.

#### OD-027 — Keamanan, privasi, dan audit log

- **Kelompok:** **C2 — Dapat ditunda lebih lama; gate produksi**.
- **Status sumber:** **PERLU KONFIRMASI PEMILIK PRODUK**.
- **Prioritas:** P3 — kesiapan produksi.
- **Pemilik keputusan:** **`[PBP + teknis]`**.
- **Gate:** sebelum menyimpan data pribadi nyata atau menyatakan sistem siap produksi.
- **Pertanyaan yang harus dijawab:** Bagaimana keamanan, privasi, dan audit log? Siapa yang boleh melihat nilai, dokumen, dan hasil seleksi? Berapa lama data disimpan?
- **Opsi yang didukung sumber:** **belum ditentukan dalam sumber**. PRD §12 menanyakan penyimpanan token, risiko XSS/CSRF, akses nilai/dokumen/hasil, retensi, dan audit trail (Q53); tidak ada kebijakan yang ditetapkan. Fakta teknis repository adalah kondisi implementasi, bukan keputusan keamanan.
- **Dampak skema:** menentukan audit trail, retensi, enkripsi, dan klasifikasi data; belum ada skema final.
- **Dampak API:** menentukan kontrol akses, pencatatan akses, dan kebijakan token.
- **Dampak UI:** menentukan mask data, peringatan akses, dan state sesi.
- **Dampak algoritma:** menentukan siapa yang boleh melihat/menyimpan hasil rekomendasi.
- **Dependensi:** OD-003, OD-016, OD-017; NFR-04, NFR-05; Q53.
- **Kriteria penutupan keputusan:** klasifikasi data disetujui; kontrol akses disetujui; retensi dan audit disetujui; kebijakan token/sesi disetujui; rencana uji keamanan dicatat.

#### OD-028 — Kinerja, backup, dan kriteria penerimaan

- **Kelompok:** **C2 — Dapat ditunda lebih lama; gate acceptance/produksi**.
- **Status sumber:** **PERLU KONFIRMASI PEMILIK PRODUK**.
- **Prioritas:** P3 — kesiapan produksi.
- **Pemilik keputusan:** **`[PBP + teknis]`**.
- **Gate:** sebelum acceptance dan produksi.
- **Pertanyaan yang harus dijawab:** Bagaimana kinerja, backup, dan kriteria penerimaan?
- **Opsi yang didukung sumber:** PRD v0.1 mengusulkan **waktu respons < 2 detik** dan **minimal 100 pengguna concurrent**, tetapi keduanya belum divalidasi (Q52). Mekanisme backup dan definisi “done” belum ditentukan (Q54). **Usulan tersebut bukan keputusan.**
- **Dampak skema:** dapat memengaruhi indeks, arsip, dan strategi penyimpanan; belum ada keputusan.
- **Dampak API:** menentukan target performa dan pengujian beban.
- **Dampak UI:** menentukan target respons dan state loading.
- **Dampak algoritma:** menentukan batas waktu pemrosesan K-Means/SAW.
- **Dependensi:** OD-027; seluruh modul; NFR-02, NFR-03, ACC-01; Q52, Q54.
- **Kriteria penutupan keputusan:** target NFR terukur disetujui; strategi backup disetujui; kriteria penerimaan per alur disetujui; bukti pengujian direncanakan.

#### OD-029 — Notifikasi mahasiswa dan mitra

- **Kelompok:** **C2 — Dapat ditunda lebih lama**.
- **Status sumber:** **BELUM DIPUTUSKAN**.
- **Prioritas:** P3 — fitur tambahan.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum fitur notifikasi di luar dashboard Admin.
- **Pertanyaan yang harus dijawab:** Apakah notifikasi mahasiswa/mitra termasuk MVP? Siapa penerima, kanal, dan pemicunya?
- **Opsi yang didukung sumber:** BPMN hanya menonjolkan **notifikasi pengajuan baru di dashboard Admin/Prodi**. Sumber menanyakan penerima notifikasi (Q48), notifikasi mahasiswa/mitra (Q49), dan kanal/template/riwayat (Q49). **Tidak ada keputusan yang ditetapkan.**
- **Dampak skema:** menentukan tabel notifikasi dan riwayat; belum ada skema final.
- **Dampak API:** menentukan endpoint notifikasi dan integrasi kanal.
- **Dampak UI:** menentukan pusat notifikasi dan badge.
- **Dampak algoritma:** tidak langsung.
- **Dependensi:** OD-016, OD-020, OD-021; FR-APP-03, FR-NOTIF-01, FR-NOTIF-02, FR-NOTIF-03, FLOW-07.
- **Kriteria penutupan keputusan:** penerima disetujui; pemicu disetujui; kanal disetujui; template dan riwayat disetujui; test notifikasi direncanakan.

#### OD-030 — Laporan, integrasi, dan pengelolaan pengguna

- **Kelompok:** **C2 — Dapat ditunda lebih lama**.
- **Status sumber:** **BELUM DIPUTUSKAN**.
- **Prioritas:** P3 — fitur tambahan.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum fitur di luar BPMN.
- **Pertanyaan yang harus dijawab:** Apakah laporan, integrasi, dan pengelolaan pengguna termasuk MVP?
- **Opsi yang didukung sumber:** sumber menanyakan apakah Admin/Prodi boleh mengelola pengguna dan role (Q9), apakah laporan/ekspor termasuk MVP (Q50), dan apakah integrasi akademik/email/WhatsApp termasuk MVP (Q51). **Tidak ada pilihan yang ditetapkan.** Fitur-fitur ini tidak tercantum di BPMN.
- **Dampak skema:** menentukan tabel user management, laporan, dan integrasi; belum ada skema final.
- **Dampak API:** menentukan CRUD pengguna, ekspor, dan kontrak integrasi.
- **Dampak UI:** menentukan halaman pengguna, laporan, dan pengaturan integrasi.
- **Dampak algoritma:** dapat memengaruhi sumber data dan hasil rekomendasi.
- **Dependensi:** OD-003, OD-027; FR-AUTH-08, FR-DATA-01, FR-REPORT-01, FR-INTEG-01; Q9, Q50, Q51.
- **Kriteria penutupan keputusan:** scope in/out disetujui; sumber data dan izin disetujui; kontrak integrasi disetujui; test fitur direncanakan.

#### OD-031 — Histori rekomendasi dan banding

- **Kelompok:** **C2 — Dapat ditunda lebih lama**.
- **Status sumber:** **BELUM DIPUTUSKAN**.
- **Prioritas:** P3 — fitur tambahan.
- **Pemilik keputusan:** **`[PBP — wajib]`**.
- **Gate:** sebelum histori rekomendasi atau proses banding.
- **Pertanyaan yang harus dijawab:** Apakah histori rekomendasi/banding diperlukan?
- **Opsi yang didukung sumber:** sumber menanyakan apakah hasil rekomendasi **disimpan sebagai histori/audit** atau **hanya ditampilkan saat proses** (Q57), dan apakah ada **banding/eskalasi** selain mengajukan ulang (Q58). BPMN hanya memiliki loop pengajuan ulang; tidak ada banding. **Tidak ada pilihan yang ditetapkan.**
- **Dampak skema:** menentukan tabel histori/versi hasil rekomendasi dan banding; belum ada skema final.
- **Dampak API:** menentukan endpoint histori dan banding.
- **Dampak UI:** menentukan tampilan riwayat dan aksi banding.
- **Dampak algoritma:** menentukan apakah parameter/hasil disimpan sebagai histori.
- **Dependensi:** OD-014, OD-016; FR-ALG-11; Q57, Q58.
- **Kriteria penutupan keputusan:** kebutuhan histori disetujui; retensi dan akses disetujui; proses banding disetujui atau dinyatakan di luar scope; test histori direncanakan.

---

## 7. Paket Keputusan dan Gate Implementasi

### 7.1 Mengapa bukan urutan linear

Graf dependensi pada §5–§6 memuat siklus. Contohnya:

- OD-001, OD-002, dan OD-003 saling merujuk.
- OD-009, OD-012, dan OD-015 saling merujuk; OD-006 juga merujuk OD-015.
- OD-016–OD-022 saling merujuk.
- OD-023–OD-026 saling merujuk.

Karena itu register **tidak menetapkan urutan linear** dan **tidak menyebut urutan ini sebagai topological sort**. Keputusan yang saling bergantung harus diputuskan sebagai paket; keputusan lain dapat berjalan paralel bila tidak ada dependensi langsung. `docs/PRD.md` §15 dan `docs/REQUIREMENTS-TRACEABILITY.md` §17 tetap menjadi rujukan tahapan tingkat tinggi, bukan urutan teknis per OD.

### 7.2 Paket keputusan

| Paket | Keputusan | Sifat dependensi | Dependensi langsung | Catatan |
|---|---|---|---|---|
| **Paket 1 — Akses dan aktor** | OD-001–OD-003 | Siklik internal | — | Putuskan bersama; tidak ada urutan internal yang sah. |
| **Paket 2 — Akun, data mahasiswa, peminatan, kriteria, dan K-Means** | OD-004–OD-012, OD-015 | Siklik internal | Paket 1 | OD-006/OD-015/OD-009/OD-012 saling merujuk. Paket ini memuat kelompok B dan C2; gate mengikuti OD, bukan seluruh paket. |
| **Paket 3 — Ranking SAW** | OD-013–OD-014 | Siklik internal | Paket 2 | Bergantung pada OD-009/OD-012; OD-013 dan OD-014 saling merujuk. |
| **Paket 4 — Pengajuan, dokumen, status, dan komunikasi mitra** | OD-016–OD-022 | Siklik internal | D-003 | Status, dokumen, respons, dan kanal mitra saling terkait. Otorisasi role mengikuti gate global OD-003 (Paket 1). |
| **Paket 5 — DPM dan akhir proses** | OD-023–OD-026 | Siklik internal | Paket 1, Paket 4, Paket 6 (melalui OD-025 → OD-027) | C1 dan C2 bercampur; gate mengikuti OD. |
| **Paket 6 — Keamanan dan acceptance** | OD-027–OD-028 | Berurutan | Paket 1, Paket 4 | OD-028 bergantung pada OD-027. |
| **Paket 7 — Fitur tambahan** | OD-029–OD-031 | Tidak siklik | Paket 1, Paket 4; OD-030 juga Paket 6; OD-031 juga Paket 3 | Scope harus disetujui sebelum implementasi. |

Paket di atas adalah alat analisis dependensi, bukan keputusan bisnis dan tidak mengubah status OD.

### 7.3 Gate implementasi

| Gate | Keputusan | Aturan |
|---|---|---|
| **Fondasi** | **Kelompok B:** OD-001–OD-005, OD-007–OD-015 | Modul hanya boleh dimulai jika keputusan kelompok B yang menjadi **dependensi langsung modul** sudah dicatat. Tidak ada aturan “semua B harus selesai sebelum semua modul”. |
| **Modul** | **Kelompok C1:** OD-016–OD-018, OD-020–OD-021, OD-023, OD-026 | Menjadi gate saat modul terkait dimulai; bukan gate untuk modul lain. |
| **Fase/fitur** | **Kelompok C2:** OD-006, OD-019, OD-022, OD-024–OD-025, OD-027–OD-031 | Menjadi gate saat fitur/fase/produksi terkait dimulai; tidak memblokir modul yang tidak bergantung padanya. |

**Aturan pemakaian:** daftar dependensi langsung ada pada baris **Dependensi** setiap OD. Jangan memperlakukan satu paket sebagai syarat untuk semua modul. Contoh: modul komunikasi mitra tidak memerlukan seluruh keputusan B; modul DPM tidak memerlukan seluruh keputusan C2.

**Pengecualian dependensi langsung:** keputusan B/C1 yang mencantumkan OD C2 sebagai dependensi tidak boleh ditutup tanpa OD tersebut. Contohnya OD-005/OD-007 → OD-006, OD-016/OD-018 → OD-019, OD-020 → OD-022, dan OD-026 → OD-025. Ini tetap bukan alasan untuk menjadikan seluruh C2 sebagai gate fondasi.

---

## 8. Agenda Mendesak untuk Pemilik Proses Bisnis

Bagian ini merangkum pertanyaan **P1 yang memblokir fondasi**. P1 adalah prioritas perhatian, bukan status blocking. OD-006 tetap P1 tetapi C2: ia tidak memblokir fondasi secara umum, tetapi menjadi dependensi langsung OD-005/OD-007 dan baru menjadi gate penuh saat field/halaman profil mahasiswa dibutuhkan. Semua pertanyaan di bawah wajib dijawab pemilik proses bisnis; tim teknis hanya menyediakan analisis dampak.

| ID | Pertanyaan yang harus dijawab | Mengapa mendesak | Jika belum dijawab |
|---|---|---|---|
| OD-001 | Apa kewenangan Admin? | Menentukan otorisasi mitra, kriteria, pengajuan, dan DPM. | Endpoint/UI Admin tidak dapat diperluas tanpa risiko salah akses. |
| OD-002 | Apa kewenangan Prodi? | D-001 memisahkan Prodi, tetapi belum ada izin. | Prodi tidak dapat diberi akses yang dapat dipertanggungjawabkan. |
| OD-003 | Bagaimana matriks izin seluruh role? | Endpoint dan UI yang membutuhkan otorisasi bergantung pada matriks ini. | Modul yang membutuhkan otorisasi role tidak dapat dimulai tanpa matriks izin. |
| OD-004 | Bagaimana login Admin/Prodi/DPM? | Hanya login mahasiswa yang eksplisit di BPMN. | Autentikasi role lain tidak dapat diperluas. |
| OD-005 | Bagaimana sumber akun mahasiswa dan registrasi? | BPMN dimulai dari login, bukan registrasi. | Alur mahasiswa dan provisioning akun tidak dapat dibangun. |
| OD-007 | Dari mana nilai prasyarat diperoleh? | Nilai adalah input validasi/algoritma. | Skema nilai dan kontrak algoritma tidak dapat dibuat. |
| OD-008 | Apa aturan validasi data/nilai? | Validasi menentukan eligibility. | Data tidak valid/tidak lengkap tidak dapat ditangani. |
| OD-009 | Atribut dan preprocessing K-Means? | Menentukan vektor input clustering. | K-Means tidak dapat diimplementasikan tanpa mengarang atribut. |
| OD-010 | Berapa cluster dan bagaimana menentukannya? | Menentukan hasil clustering. | Parameter K-Means tidak dapat ditetapkan. |
| OD-011 | Apa target clustering dan penggunaannya? | Menentukan hubungan cluster dengan filter/SAW. | Hasil K-Means tidak dapat dipakai secara konsisten. |
| OD-012 | Apa kriteria dan bobot SAW? | Menentukan inti perangkingan. | Migration/API/UI kriteria dan SAW tidak boleh dibuat. |
| OD-013 | Benefit/cost, normalisasi, nilai kosong? | Menentukan rumus SAW. | Perhitungan ranking tidak dapat dipertanggungjawabkan. |
| OD-014 | Berapa ranking, bagaimana tie-break, dan apa perilaku jika K-Means/SAW gagal? | Menentukan UI, pengurutan, dan penanganan kegagalan. | Hasil ranking dan kegagalan algoritma tidak dapat ditampilkan secara konsisten. |
| OD-015 | Bagaimana pemetaan peminatan dan multi-peminatan? | Menentukan filter mitra sebelum SAW. | Filter peminatan tidak dapat dibuat. |

---

## 9. Yang Tidak Boleh Diisi dengan Asumsi

Register ini secara eksplisit melarang pengisian berikut tanpa keputusan pemilik proses bisnis:

1. Daftar kriteria SAW.
2. Bobot setiap kriteria.
3. Kriteria mana yang benefit dan mana yang cost.
4. Skala penilaian dan rumus normalisasi.
5. Perilaku nilai kosong/nol.
6. Atribut K-Means.
7. Preprocessing dan normalisasi atribut.
8. Jumlah cluster dan metode penentuannya.
9. Target clustering dan penggunaan hasilnya.
10. Sumber nilai mata kuliah prasyarat.
11. Daftar mata kuliah prasyarat dan ambang nilai.
12. Pemetaan peminatan DTA/PSI/SIA ke mitra.
13. Aturan multi-peminatan.
14. Jumlah ranking dan tie-break.
15. Daftar status pengajuan dan transisinya.
16. Jenis dokumen, format, dan syarat kelengkapan.
17. Batas pengajuan ulang dan lamaran multiple.
18. Tenggat respons mitra dan pengingat.
19. Sumber kebenaran status hasil seleksi.
20. Template dan format surat.
21. Waktu, pihak, kriteria, dan penggantian DPM.
22. Kewenangan DPM selain membimbing.
23. Kebijakan keamanan, retensi, audit, dan backup.
24. Target performa dan kriteria penerimaan.
25. Hak akses setiap role.
26. Fitur tambahan di luar BPMN.

Pertanyaan pada **Lampiran A** juga tidak boleh diisi dengan asumsi, termasuk kriteria per peminatan, keunikan/urutan kriteria, aturan nonaktif/hapus, histori nilai, kegagalan algoritma, persetujuan rekomendasi, kriteria seleksi mitra/kuota, dan preferensi berperingkat.

Jika salah satu item di atas belum diputuskan, implementasi terkait harus berhenti pada dokumentasi, audit, desain non-bisnis, atau perbaikan teknis yang tidak mengunci aturan bisnis.

---

## 10. Pekerjaan yang Dapat Dilakukan Tanpa Keputusan Baru

Mengacu pada `docs/PRD.md` §10, pekerjaan berikut tidak memerlukan keputusan bisnis baru:

- dokumentasi dan audit;
- perbaikan teknis yang tidak mengubah aturan bisnis;
- desain UI non-bisnis yang tidak mengunci data/izin;
- pengujian teknis yang tidak menetapkan aturan bisnis;
- pemeliharaan **non-perilaku** pada autentikasi, CORS, CI, dan dokumentasi yang sudah ada.

Pemeliharaan non-perilaku tidak boleh mengubah alur autentikasi. Perubahan alur autentikasi tetap memerlukan keputusan eksplisit sesuai `docs/PRD.md` §10 item 6.

Pekerjaan berikut **tidak** dapat dimulai sebelum keputusan terkait:

- migration/API/UI kriteria dan bobot;
- implementasi K-Means/SAW;
- ranking dan filter peminatan;
- skema nilai/profil/peminatan;
- state machine pengajuan dan dokumen;
- komunikasi mitra dan pencatatan respons;
- penetapan dan fitur DPM;
- perluasan otorisasi role;
- fitur notifikasi/laporan/integrasi/histori;
- klaim kesiapan produksi.

---

## 11. Format Pencatatan Keputusan

Setiap keputusan yang sudah diambil agar dicatat dengan format berikut:

```text
ID:
Tanggal:
Pemilik keputusan:
Keputusan:
Alasan:
Opsi yang ditolak (jika ada):
Dampak skema:
Dampak API:
Dampak UI:
Dampak algoritma:
Dependensi:
Kriteria penutupan:
Kriteria teknis yang didukung sumber:
Kebutuhan teknis belum ditentukan:
Dokumen yang diperbarui:
Status: DISETUJUI / DITUNDA / DITOLAK
```

Keputusan yang mengubah aktor, status, atau alur wajib diikuti pembaruan BPMN dan `docs/BPMN-ANALYSIS.md`. Keputusan yang mengubah kebutuhan wajib diikuti pembaruan `docs/PRD.md` dan `docs/REQUIREMENTS-TRACEABILITY.md`.

---

## 12. Status Dokumen

- Dokumen ini hanya dokumentasi; tidak ada kode aplikasi, migration, database, konfigurasi, dependency, atau test yang diubah.
- D-001–D-004 tetap menjadi satu-satunya keputusan yang **DIKONFIRMASI**.
- OD-001–OD-031 tetap terbuka; kelompok register tidak mengubah status sumber.
- OD-001–OD-015 adalah prioritas perhatian P1 karena memengaruhi fondasi rekomendasi. OD-006 tetap P1 tetapi C2; ia tidak memblokir fondasi secara umum, tetapi menjadi dependensi langsung OD-005/OD-007 dan dapat ditunda hanya sampai titik itu dibutuhkan.
- OD-016–OD-018, OD-020–OD-021, OD-023, dan OD-026 adalah gate modul C1; keputusan ini tetap wajib sebelum modul terkait, meskipun dapat ditunda sampai fase tersebut.
- OD-019, OD-022, OD-024–OD-025, dan OD-027–OD-031 adalah gate fitur/fase C2; keputusan ini dapat ditunda lebih lama, tetapi tetap wajib sebelum fitur/produksi terkait—termasuk bila menjadi dependensi langsung keputusan B/C1.
- Blocker fondasi (B) berbeda dari blocker modul pada `docs/REQUIREMENTS-TRACEABILITY.md` §17; perbedaan granularitas ini tidak mengubah status OD.
- Register memakai paket keputusan, bukan urutan linear; lihat §7. Tidak ada klaim bahwa urutan tersebut adalah topological sort.
- Tidak ada daftar kriteria, bobot, atribut K-Means, cluster, sumber nilai, status, dokumen, atau hak akses yang ditambahkan dalam dokumen ini.
- Jika BPMN atau keputusan pemilik proses bisnis diperbarui, register ini harus disinkronkan ulang.

---

## Lampiran A — Pertanyaan Belum Terpetakan

Lampiran ini mencatat pertanyaan yang tidak eksplisit pada OD terkait atau belum memiliki OD yang tepat. **Tidak ada jawaban atau aturan baru di sini.** Semua baris tetap terbuka dan memerlukan keputusan pemilik proses bisnis.

| No | Pertanyaan | Sumber | OD terkait | Status |
|---|---|---|---|---|
| 1 | Apakah kriteria SAW berbeda per peminatan DTA/PSI/SIA? | `docs/CRITERIA-GAP-ANALYSIS.md` §4 | OD-012, OD-015 | Terbuka; belum diputuskan |
| 2 | Apakah nama kriteria unik? Apakah ada kode/urutan tampilan? | `docs/CRITERIA-GAP-ANALYSIS.md` §4 | OD-012 | Terbuka; belum diputuskan |
| 3 | Apakah kriteria dapat dinonaktifkan atau dihapus setelah dipakai? | `docs/CRITERIA-GAP-ANALYSIS.md` §4 | OD-012 | Terbuka; belum diputuskan |
| 4 | Apa daftar mata kuliah prasyarat dan ambang nilainya? | `docs/PRD.md` FR-GRADE-03/Q24; `docs/STUDENT-FLOW-GAP-ANALYSIS.md` §3.3 | OD-007, OD-008 | Terbuka; belum diputuskan |
| 5 | Apakah nilai disimpan sebagai histori atau nilai terbaru saja? | `docs/STUDENT-FLOW-GAP-ANALYSIS.md` §3.3 | OD-007, OD-008 | Terbuka; belum diputuskan |
| 6 | Apa yang terjadi jika K-Means/SAW gagal atau tidak menghasilkan ranking? | `docs/PRD.md` FR-ALG-08; `docs/BPMN-ANALYSIS.md` §4 | OD-014 | Terbuka; belum diputuskan |
| 7 | Apakah rekomendasi memerlukan persetujuan Admin/Prodi sebelum digunakan? | `docs/PRD.md` K-18 | OD-017 | Terbuka; belum diputuskan |
| 8 | Apa kriteria seleksi mitra dan apakah ada kuota? | `docs/PRD.md` FR-MIT-05; `docs/BPMN-ANALYSIS.md` §3.4 | OD-021 | Terbuka; belum diputuskan |
| 9 | Apakah preferensi magang berperingkat termasuk MVP? | `docs/PRD.md` §3.3 | **Belum terpetakan ke OD** | Terbuka; perlu keputusan scope |

Pertanyaan nomor 9 tidak dipaksakan ke OD-019 karena OD-019 hanya membahas lamaran ke beberapa mitra, bukan preferensi berperingkat. Jika pemilik proses bisnis ingin memasukkan preferensi berperingkat, diperlukan keputusan scope terpisah dan pemetaan OD baru tanpa mengubah ID OD-001–OD-031.

---

## Lampiran B — Anomali Traceability untuk Klarifikasi

| Anomali | Sumber | Catatan | Tindakan |
|---|---|---|---|
| FR-AUTH-03 (logout) dipetakan ke OD-006 | `docs/REQUIREMENTS-TRACEABILITY.md` §4 dan §19 vs `docs/PRD.md` §8 dan register OD-006 | OD-006 adalah **profil mahasiswa**; logout tidak sama dengan profil. | Ditandai untuk klarifikasi; tidak dikoreksi secara spekulatif. |
| ACT-02 belum ada di dependensi OD-001/OD-002 | `docs/REQUIREMENTS-TRACEABILITY.md` §16 vs register §5 | Traceability mencantumkan ACT-02; register sebelumnya tidak. | Register menambahkan ACT-02 ke dependensi OD-001/OD-002; status tidak berubah. |
| D-002 memetakan akun/login ke OD-023–OD-025 | `docs/PRD.md` §3.1/§7, `docs/REQUIREMENTS-TRACEABILITY.md` §2 vs register OD-004 | OD-004 adalah keputusan login Admin/Prodi/DPM; register D-002 menambahkan OD-004. | Anomali dicatat di register dan pada catatan `docs/PRD.md` §7; belum diubah menjadi keputusan baru. |
| D-004 “seluruh scope fitur” | `docs/REQUIREMENTS-TRACEABILITY.md` §2.1 vs register §3.1 | Register menambahkan frasa “seluruh scope fitur” pada ringkasan D-004. | Diselaraskan tanpa mengubah makna D-004. |
