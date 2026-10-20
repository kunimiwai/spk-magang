# Requirements Traceability — SPK Magang

**Tanggal:** 20 Oktober 2026<br>
**Sumber proses:** `docs/bpmn/BPMN.pdf`<br>
**Analisis pendukung:** `docs/BPMN-ANALYSIS.md`<br>
**PRD:** `docs/PRD.md` versi 0.3<br>
**Status:** Dokumen traceability; dokumentasi saja, tidak mengimplementasikan fitur.

---

## 1. Cara membaca dokumen ini

### 1.1 Dua dimensi status

Dokumen ini memakai **dua dimensi status** yang tidak saling menggantikan:

1. **Status BPMN** — seberapa jauh BPMN mendukung kebutuhan.
2. **Status keputusan** — apakah keputusan produk sudah diambil.

**Status BPMN:**

- **SESUAI BPMN** — BPMN secara eksplisit menggambarkan aktivitas/hasil terkait.
- **BERTENTANGAN DENGAN BPMN** — kebutuhan/asumsi PRD bertentangan dengan gambar atau catatan BPMN.
- **BELUM JELAS DI BPMN** — BPMN menyentuh topik, tetapi aktor, urutan, atau hasilnya ambigu.
- **BELUM TERCANTUM DI BPMN** — topik tidak ditemukan dalam BPMN.
- **KEPUTUSAN PEMILIK PRODUK DIPERLUKAN** — keputusan scope/kebijakan/aturan bisnis harus diambil sebelum implementasi.
- **— (tidak berlaku)** — status BPMN tidak relevan untuk baris tersebut.

**Status keputusan:**

- **DIKONFIRMASI** — keputusan sudah diambil dan mengikat dokumentasi.
- **BELUM DIPUTUSKAN** — keputusan sudah diidentifikasi, tetapi belum ada jawaban.
- **BELUM JELAS DI BPMN** — BPMN sendiri ambigu; klarifikasi atau revisi BPMN diperlukan sebelum keputusan.
- **PERLU KONFIRMASI PEMILIK PRODUK** — pemilik produk harus memilih scope, kebijakan, atau aturan bisnis.

### 1.2 Aturan interpretasi

1. “SESUAI BPMN” berarti aktivitasnya ada, bukan berarti aturan detailnya sudah lengkap.
2. Ketiadaan informasi di BPMN tidak otomatis berarti fitur tidak diperlukan.
3. Detail yang tidak ada di BPMN tidak boleh diisi dengan asumsi.
4. BPMN adalah PDF satu halaman; beberapa alur pesan putus-putus ambigu dan tidak boleh dianggap kontrak teknis.
5. Arsitektur teknis (React/Laravel/FastAPI/PostgreSQL) berasal dari repository, bukan BPMN.
6. **Hanya baris yang terkait langsung dengan D-001–D-004 yang berstatus DIKONFIRMASI.** Status BPMN tidak berubah menjadi status keputusan, dan keputusan awal tidak mengonfirmasi kebutuhan lain.

### 1.3 Rujukan ID

- **D-001–D-004** — keputusan awal di `docs/PRD.md` Bagian 7.
- **OD-001–OD-031** — keputusan terbuka di `docs/PRD.md` Bagian 8 dan Bagian 16 dokumen ini.
- **Q1–Q58** — pertanyaan rinci di `docs/PRD.md` Bagian 9. ID lama dipertahankan; beberapa pertanyaan kini menjadi pertanyaan lanjutan setelah D-001–D-004.

### 1.4 Aturan status keputusan

- **DIKONFIRMASI** hanya dipakai untuk keputusan D-001–D-004 dan baris yang secara langsung terkena keputusan tersebut.
- **BELUM DIPUTUSKAN** dipakai untuk kebutuhan yang sudah teridentifikasi tetapi belum diputuskan, termasuk kandidat MVP yang belum menjadi daftar fitur final.
- **BELUM JELAS DI BPMN** dipakai jika ambiguitas BPMN harus diselesaikan lebih dahulu.
- **PERLU KONFIRMASI PEMILIK PRODUK** dipakai jika pemilik produk harus menetapkan kebijakan, aturan, atau scope.
- Status pada kolom **Status BPMN** tidak diubah hanya karena D-001–D-004 dibuat.

---

## 2. Keputusan awal yang dikonfirmasi (D-001–D-004)

| ID | Keputusan | Status | Cakupan yang mengikat | Yang masih terbuka |
|---|---|---|---|---|
| **D-001** | Admin dan Prodi adalah dua role terpisah | **DIKONFIRMASI** | Pemisahan role; tidak boleh menganggap hak akses sama | Kewenangan Admin, kewenangan Prodi, pembagian tugas, matriks izin (OD-001–OD-003) |
| **D-002** | DPM adalah Dosen Pembimbing Magang | **DIKONFIRMASI** | Definisi dan istilah DPM mengikuti BPMN | Penunjukan, penggantian, cakupan bimbingan, kewenangan, akun/login (OD-023–OD-025) |
| **D-003** | Mitra tidak memiliki akun aplikasi; komunikasi melalui email dan/atau surat | **DIKONFIRMASI** | Tidak ada portal/autentikasi mitra; kanal komunikasi email/surat | Pembuatan, pengiriman, penerimaan, pencatatan, tenggat, sumber kebenaran status (OD-020–OD-022) |
| **D-004** | MVP memprioritaskan alur yang eksplisit di BPMN | **DIKONFIRMASI** | Alur BPMN menjadi prioritas; fitur tambahan tidak otomatis masuk MVP | Daftar fitur final, kebutuhan tambahan, dan definisi akhir proses (OD-006, OD-019, OD-029–OD-031) |

### 2.1 Peta dampak keputusan

| Keputusan | Kebutuhan yang terkait | Efek | Masih terbuka |
|---|---|---|---|
| **D-001** | ACT-02, FR-AUTH-05, FR-MIT-01, FR-MIT-02, FR-UI-03, FLOW-01, FLOW-02, FLOW-07, FLOW-08, FLOW-11 | Admin dan Prodi tidak boleh diperlakukan sebagai satu role dengan hak akses sama | OD-001, OD-002, OD-003 |
| **D-002** | ACT-03, ACT-04, ACT-05, FR-DPM-08 | DPM adalah Dosen Pembimbing Magang; peran validasi DPM tetap terbuka | OD-023, OD-024, OD-025 |
| **D-003** | ACT-06, ACT-07, FR-AUTH-06, FR-APP-07, FR-APP-08, FR-MITRA-01, FR-MITRA-03 | Mitra tanpa akun/portal; komunikasi melalui email/surat | OD-020, OD-021, OD-022 |
| **D-004** | SCOPE-01, FLOW-01–FLOW-13, dan kebutuhan yang eksplisit di BPMN | Alur BPMN menjadi kandidat prioritas MVP; bukan daftar fitur final | OD-006, OD-019, OD-029, OD-030, OD-031, serta seluruh scope fitur |

**Catatan:** D-001–D-004 tidak mengubah status kebutuhan lain menjadi DIKONFIRMASI. Baris lain tetap BELUM DIPUTUSKAN, BELUM JELAS DI BPMN, atau PERLU KONFIRMASI PEMILIK PRODUK.

---

## 3. Traceability aktor

| ID | Kebutuhan/klaim | Sumber BPMN | Status BPMN | Status keputusan | Dasar/OD | Q |
|---|---|---|---|---|---|---|
| ACT-01 | Mahasiswa sebagai pelaku proses | Lane “Mahasiswa” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004 (kandidat) | — |
| ACT-02 | Admin dan Prodi adalah dua role terpisah | Lane “Admin / Prodi”; D-001 | **BELUM JELAS DI BPMN** | **DIKONFIRMASI** | D-001; OD-001–OD-003 | Q1, Q2 |
| ACT-03 | DPM sebagai pelaku proses | Lane “Dosen Pembimbing Magang (DPM)” | **SESUAI BPMN** | **DIKONFIRMASI** | D-002; OD-004 | Q3, Q4 |
| ACT-04 | Definisi DPM = Dosen Pembimbing Magang | Label lane DPM; D-002 | **SESUAI BPMN** | **DIKONFIRMASI** | D-002 | Q3 |
| ACT-05 | Klaim lama: DPM memvalidasi data mahasiswa; BPMN menempatkan validasi di lane sistem | Lane “Sistem SPK”; D-002 | **BERTENTANGAN DENGAN BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | D-002 (definisi saja) | Q3 |
| ACT-06 | Mitra magang sebagai aktor eksternal | Lane “Mitra Magang (Eksternal)”; D-003 | **SESUAI BPMN** | **DIKONFIRMASI** | D-003; OD-020–OD-022 | Q5 |
| ACT-07 | Mitra tidak memiliki akun aplikasi | Catatan BPMN: mitra tidak memiliki akun; D-003 | **SESUAI BPMN** | **DIKONFIRMASI** | D-003 | Q5 |
| ACT-08 | Sistem SPK sebagai lane pelaku otomatis | Lane “Sistem SPK (Website)” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004 (kandidat) | — |
| ACT-09 | Role lain (koordinator/staf) | Tidak ada | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-003 | Q6 |

---

## 4. Traceability autentikasi, akun, dan akses

| ID | Kebutuhan | Sumber BPMN | Status BPMN | Status keputusan | Dasar/OD | Q |
|---|---|---|---|---|---|---|
| FR-AUTH-01 | Mahasiswa login | “Login ke sistem” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004 (kandidat) | — |
| FR-AUTH-02 | Admin/Prodi dan DPM login | Tidak ada aktivitas login eksplisit | **BELUM JELAS DI BPMN** | **BELUM JELAS DI BPMN** | OD-004 | Q4, Q56 |
| FR-AUTH-03 | Logout | Tidak ada | **BELUM TERCANTUM DI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-006 | Q55 |
| FR-AUTH-04 | Registrasi/pendaftaran akun mahasiswa | BPMN dimulai dari login | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-005 | Q7 |
| FR-AUTH-05 | Otorisasi berbasis role/matriks izin | Hanya pemisahan lane; D-001 | **KEPUTUSAN PEMILIK PRODUK DIPERLUKAN** | **PERLU KONFIRMASI PEMILIK PRODUK** | D-001; OD-003 | Q1, Q2, Q10 |
| FR-AUTH-06 | Akun/portal mitra | Catatan: mitra tidak memiliki akun; D-003 | **BERTENTANGAN DENGAN BPMN** | **DIKONFIRMASI** | D-003 | Q5 |
| FR-AUTH-07 | Profil mahasiswa | Tidak ada | **BELUM TERCANTUM DI BPMN** | **BELUM DIPUTUSKAN** | OD-006 | Q8 |
| FR-AUTH-08 | Admin/Prodi mengelola pengguna | Tidak ada | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-030 | Q9 |
| FR-AUTH-09 | SSO/Google login | Tidak ada | **BELUM TERCANTUM DI BPMN** | **BELUM DIPUTUSKAN** | OD-004 | Q56 |

---

## 5. Traceability data mitra dan kriteria

| ID | Kebutuhan | Sumber BPMN | Status BPMN | Status keputusan | Dasar/OD | Q |
|---|---|---|---|---|---|---|
| FR-MIT-01 | Admin/Prodi mengelola data mitra (tambah/ubah/hapus) | “Kelola data mitra magang (tambah/ubah/hapus)” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-001–OD-003 | — |
| FR-MIT-02 | Admin/Prodi mengelola kriteria dan bobot SAW | “Kelola kriteria dan bobot SAW” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-012 | Q14, Q15 |
| FR-MIT-03 | Atribut/data mitra yang dinilai | Tidak dirinci | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-009, OD-012 | Q11, Q14 |
| FR-MIT-04 | Pemetaan mitra ke peminatan DTA/PSI/SIA | Hanya “Filter mitra sesuai peminatan” | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-015 | Q18, Q19 |
| FR-MIT-05 | Kriteria seleksi mitra, kuota, tenggat respons | Tidak ada | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-021 | Q38, Q39 |
| FR-DATA-01 | Admin/Prodi mengelola data mahasiswa | Tidak ada | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-005, OD-030 | Q8, Q9 |

---

## 6. Traceability peminatan dan nilai

| ID | Kebutuhan | Sumber BPMN | Status BPMN | Status keputusan | Dasar/OD | Q |
|---|---|---|---|---|---|---|
| FR-PREF-01 | Mahasiswa memilih peminatan DTA/PSI/SIA | “Pilih peminatan (DTA / PSI / SIA)” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004 (kandidat) | — |
| FR-PREF-02 | Mengubah/memilih lebih dari satu peminatan | Tidak ada | **BELUM TERCANTUM DI BPMN** | **BELUM DIPUTUSKAN** | OD-015 | Q19 |
| FR-GRADE-01 | Mahasiswa input nilai mata kuliah prasyarat | “Input nilai mata kuliah prasyarat” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004 (kandidat) | — |
| FR-GRADE-02 | Sumber nilai: manual/impor/integrasi | Tidak ada | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-007 | Q23 |
| FR-GRADE-03 | Daftar mata kuliah dan ambang nilai | Tidak ada | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-007, OD-008 | Q24 |
| FR-GRADE-04 | Validasi data mahasiswa | “Validasi data mahasiswa” | **SESUAI BPMN** | **BELUM JELAS DI BPMN** | OD-008 | Q24 |
| FR-GRADE-05 | Penanganan data tidak valid/kurang | Tidak ada gateway | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-008 | Q27 |

---

## 7. Traceability K-Means, filter, dan SAW

| ID | Kebutuhan | Sumber BPMN | Status BPMN | Status keputusan | Dasar/OD | Q |
|---|---|---|---|---|---|---|
| FR-ALG-01 | K-Means untuk pengelompokan mitra | “Proses K-Means (pengelompokan mitra)” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-009–OD-011 | Q11, Q12, Q13 |
| FR-ALG-02 | Filter mitra sesuai peminatan | “Filter mitra sesuai peminatan” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-015 | Q18 |
| FR-ALG-03 | SAW untuk perangkingan | “Perhitungan SAW (perangkingan)” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-012–OD-014 | Q14, Q15, Q16, Q17 |
| FR-ALG-04 | Menampilkan hasil ranking | “Tampilkan hasil rekomendasi”; “Melihat hasil rekomendasi (ranking perusahaan)” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-014 | Q20 |
| FR-ALG-05 | Atribut K-Means dan jumlah cluster | Tidak dirinci | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-009, OD-010 | Q11, Q12, Q13 |
| FR-ALG-06 | Kriteria, bobot, benefit/cost, normalisasi SAW | Tidak dirinci | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-012, OD-013 | Q14, Q15, Q16, Q17 |
| FR-ALG-07 | Jumlah rekomendasi dan tie-breaking | Tidak dirinci | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-014 | Q17, Q20 |
| FR-ALG-08 | Data kosong/tidak ada mitra/kegagalan algoritma | Tidak ada gateway | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-008, OD-014 | Q21 |
| FR-ALG-09 | Perhitungan ulang setelah penolakan/perubahan data | Tidak ada | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-018 | Q22 |
| FR-ALG-10 | Algorithm service Python/FastAPI terpisah | Tidak ada | **BELUM TERCANTUM DI BPMN** | **BELUM DIPUTUSKAN** | Arsitektur PRD §11 | — |
| FR-ALG-11 | Menyimpan hasil rekomendasi sebagai histori | Tidak ada | **BELUM TERCANTUM DI BPMN** | **BELUM DIPUTUSKAN** | OD-031 | Q57 |

---

## 8. Traceability pengajuan dan dokumen

| ID | Kebutuhan | Sumber BPMN | Status BPMN | Status keputusan | Dasar/OD | Q |
|---|---|---|---|---|---|---|
| FR-APP-01 | Mahasiswa memilih perusahaan dan mengajukan magang | “Pilih perusahaan dan ajukan magang” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-019 | Q29 |
| FR-APP-02 | Sistem menyimpan pengajuan | “Simpan data pengajuan magang” + Database | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004 (kandidat) | — |
| FR-APP-03 | Admin/Prodi menerima notifikasi pengajuan baru | “Melihat notifikasi pengajuan baru di dashboard” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-029 | Q48 |
| FR-APP-04 | Admin/Prodi memeriksa detail dan verifikasi dokumen | “Cek detail pengajuan mahasiswa”; “Verifikasi dokumen dan kelengkapan” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-017 | Q27 |
| FR-APP-05 | Jenis/format/syarat dokumen | Tidak dirinci | **BELUM JELAS DI BPMN** | **BELUM JELAS DI BPMN** | OD-017 | Q27, Q41 |
| FR-APP-06 | Dokumen kurang/revisi/penolakan Admin/Prodi | Tidak ada gateway | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-017 | Q27, Q28 |
| FR-APP-07 | Admin/Prodi meneruskan pengajuan ke mitra | “Teruskan pengajuan ke mitra”; “Surat/Email Pengajuan” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-003, D-004; OD-020 | Q35, Q36 |
| FR-APP-08 | Pembuatan/pengiriman email/surat | Catatan: dibuat sistem; aktivitas tidak digambarkan | **BELUM JELAS DI BPMN** | **BELUM JELAS DI BPMN** | OD-020 | Q35, Q36, Q37, Q41 |
| FR-APP-09 | Update status Diterima/Ditolak | “Update status Diterima / Ditolak di sistem” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-016, OD-021 | Q26, Q40 |
| FR-APP-10 | Mahasiswa mengunggah surat penerimaan | “Mengunggah dokumen diterima (surat penerimaan)” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-017 | Q31 |
| FR-APP-11 | Admin/Prodi memverifikasi surat penerimaan | Tidak ada | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-017 | Q32 |
| FR-APP-12 | Melihat rekomendasi lain dan mengajukan kembali | Loop gateway “Diterima?” cabang “Tidak” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-018 | Q30 |
| FR-APP-13 | Batas pengajuan/lamaran dan pengajuan ulang | Tidak ada | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-018, OD-019 | Q29, Q30 |
| FR-APP-14 | Status antara/pembatalan/pengunduran diri | Hanya Diterima/Ditolak | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-016 | Q25, Q33 |
| FR-APP-15 | Melamar ke lebih dari satu mitra sekaligus | Tidak ada | **BELUM TERCANTUM DI BPMN** | **BELUM DIPUTUSKAN** | OD-019 | Q29 |

---

## 9. Traceability keputusan mitra

| ID | Kebutuhan | Sumber BPMN | Status BPMN | Status keputusan | Dasar/OD | Q |
|---|---|---|---|---|---|---|
| FR-MITRA-01 | Menerima dan meninjau berkas | “Menerima pengajuan (email/surat dari admin)”; “Meninjau berkas mahasiswa” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-003, D-004; OD-020 | Q37, Q41 |
| FR-MITRA-02 | Memutuskan menerima/menolak | Gateway “Menerima?” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-021 | Q40 |
| FR-MITRA-03 | Mengirim surat penerimaan/penolakan | Dua aktivitas pengiriman surat | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-003, D-004; OD-022 | Q41 |
| FR-MITRA-04 | Tenggat, pengingat, tanpa respons | Tidak ada | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-021 | Q38, Q39 |
| FR-MITRA-05 | Sumber kebenaran status hasil | Alur pesan ke Admin/Mahasiswa + input Admin | **BELUM JELAS DI BPMN** | **BELUM JELAS DI BPMN** | OD-021 | Q40 |

---

## 10. Traceability DPM

| ID | Kebutuhan | Sumber BPMN | Status BPMN | Status keputusan | Dasar/OD | Q |
|---|---|---|---|---|---|---|
| FR-DPM-01 | Admin/Prodi menetapkan DPM | “Menetapkan dosen pembimbing magang” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-023 | Q42, Q43 |
| FR-DPM-02 | DPM menerima penetapan | “Menerima penetapan dari admin” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-023 | — |
| FR-DPM-03 | DPM membimbing mahasiswa | “Membimbing mahasiswa selama magang” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-025 | Q45, Q46 |
| FR-DPM-04 | DPM hanya untuk mahasiswa diterima | Catatan BPMN menyatakan demikian; diagram tidak memiliki gateway dan memiliki garis penolakan ke DPM | **BELUM JELAS DI BPMN** | **BELUM JELAS DI BPMN** | OD-023 | Q42 |
| FR-DPM-05 | Kriteria penugasan/beban/persetujuan/penggantian | Tidak ada | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-024 | Q43, Q44 |
| FR-DPM-06 | Monitoring/penilaian/feedback/tanda tangan/penyelesaian | Tidak ada | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-025, OD-026 | Q45, Q46 |
| FR-DPM-07 | Komunikasi DPM–mahasiswa | Tidak ada alur pesan yang jelas | **BELUM JELAS DI BPMN** | **BELUM JELAS DI BPMN** | OD-025 | Q47 |
| FR-DPM-08 | Klaim lama: DPM memvalidasi data mahasiswa | Validasi berada di lane sistem; D-002 hanya menetapkan definisi | **BERTENTANGAN DENGAN BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | D-002 (definisi saja) | Q3 |

---

## 11. Traceability status, notifikasi, dan pelaporan

| ID | Kebutuhan | Sumber BPMN | Status BPMN | Status keputusan | Dasar/OD | Q |
|---|---|---|---|---|---|---|
| FR-STATUS-01 | Status Diterima/Ditolak | Update status oleh Admin/Prodi; gateway “Diterima?” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-016 | Q25, Q26 |
| FR-STATUS-02 | Model status lengkap/transisi | Tidak ada | **KEPUTUSAN PEMILIK PRODUK DIPERLUKAN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-016 | Q25, Q26, Q33 |
| FR-NOTIF-01 | Notifikasi pengajuan baru di dashboard Admin/Prodi | Ikon notifikasi di lane Admin/Prodi | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-029 | Q48 |
| FR-NOTIF-02 | Notifikasi mahasiswa/mitra | Alur pesan tidak konsisten | **BELUM JELAS DI BPMN** | **BELUM JELAS DI BPMN** | OD-029 | Q49 |
| FR-NOTIF-03 | Kanal/template/riwayat notifikasi | Tidak ada | **BELUM TERCANTUM DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-022, OD-029 | Q37, Q41, Q49 |
| FR-REPORT-01 | Laporan/ekspor | Tidak ada | **BELUM TERCANTUM DI BPMN** | **BELUM DIPUTUSKAN** | OD-030 | Q50 |
| FR-INTEG-01 | Integrasi akademik/email/WhatsApp | Tidak ada | **BELUM TERCANTUM DI BPMN** | **BELUM DIPUTUSKAN** | OD-030 | Q51 |

---

## 12. Traceability antarmuka dan API

| ID | Kebutuhan | Sumber | Status BPMN | Status keputusan | Dasar/OD | Q |
|---|---|---|---|---|---|---|
| FR-UI-01 | Dashboard rekomendasi | BPMN: tampilkan hasil | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-014 | Q20 |
| FR-UI-02 | Profil mahasiswa | Tidak ada | **BELUM TERCANTUM DI BPMN** | **BELUM DIPUTUSKAN** | OD-006 | Q8 |
| FR-UI-03 | Pengelolaan data sesuai role | Hanya mitra/kriteria yang jelas; D-001 | **BELUM JELAS DI BPMN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-001–OD-003 | Q1, Q2, Q9, Q10 |
| FR-UI-04 | Upload/download dokumen | Upload surat penerimaan sesuai; dokumen lain tidak | **BELUM JELAS DI BPMN** | **BELUM JELAS DI BPMN** | OD-017 | Q27, Q31, Q32 |
| FR-API-01 | REST API frontend–backend | Arsitektur repository | **BELUM TERCANTUM DI BPMN** | **BELUM DIPUTUSKAN** | Arsitektur PRD §11 | — |
| FR-API-02 | Backend memanggil algorithm service | Arsitektur repository | **BELUM TERCANTUM DI BPMN** | **BELUM DIPUTUSKAN** | Arsitektur PRD §11 | — |
| FR-API-03 | Kontrak endpoint/data | Tidak ada | **BELUM TERCANTUM DI BPMN** | **BELUM DIPUTUSKAN** | Arsitektur PRD §11 | — |

---

## 13. Traceability nonfungsional dan penerimaan

| ID | Kebutuhan | Sumber | Status BPMN | Status keputusan | Dasar/OD | Q |
|---|---|---|---|---|---|---|
| NFR-01 | Responsif desktop/tablet | PRD v0.1 | **BELUM TERCANTUM DI BPMN** | **BELUM DIPUTUSKAN** | — | Q52 |
| NFR-02 | Waktu respons < 2 detik | Usulan PRD v0.1 | **KEPUTUSAN PEMILIK PRODUK DIPERLUKAN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-028 | Q52 |
| NFR-03 | 100 pengguna concurrent | Usulan PRD v0.1 | **KEPUTUSAN PEMILIK PRODUK DIPERLUKAN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-028 | Q52 |
| NFR-04 | Keamanan data/akses | Tidak dirinci | **KEPUTUSAN PEMILIK PRODUK DIPERLUKAN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-027 | Q53 |
| NFR-05 | Retensi/audit trail | Tidak dirinci | **KEPUTUSAN PEMILIK PRODUK DIPERLUKAN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-027 | Q53 |
| ACC-01 | Kriteria penerimaan/definisi done | Tidak ada | **KEPUTUSAN PEMILIK PRODUK DIPERLUKAN** | **PERLU KONFIRMASI PEMILIK PRODUK** | OD-028 | Q54 |
| SCOPE-01 | Prioritas MVP | D-004 | **—** | **DIKONFIRMASI** | D-004 | Q50, Q51, Q54 |

---

## 14. Traceability alur bisnis

| ID | Langkah | Sumber BPMN | Status BPMN | Status keputusan | Dasar/OD | Catatan |
|---|---|---|---|---|---|---|
| FLOW-01 | Admin/Prodi menyiapkan data mitra | “Kelola data mitra magang” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-001–OD-003 | — |
| FLOW-02 | Admin/Prodi mengelola kriteria/bobot | “Kelola kriteria dan bobot SAW” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-012 | Detail bobot belum ada |
| FLOW-03 | Mahasiswa login, pilih peminatan, input nilai | Tiga aktivitas Mahasiswa | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-004–OD-007 | — |
| FLOW-04 | Sistem validasi, K-Means, filter, SAW, tampilkan | Urutan lane Sistem | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-009–OD-015 | Detail algoritma belum ada |
| FLOW-05 | Mahasiswa memilih perusahaan dan mengajukan | “Pilih perusahaan dan ajukan magang” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-016, OD-019 | — |
| FLOW-06 | Sistem menyimpan pengajuan | “Simpan data pengajuan magang” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004 | — |
| FLOW-07 | Admin/Prodi menerima notifikasi dan memeriksa | Notifikasi + cek detail | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-017, OD-029 | — |
| FLOW-08 | Admin/Prodi verifikasi dan meneruskan ke mitra | Verifikasi + teruskan | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-003, D-004; OD-017, OD-020 | Rincian dokumen/email belum jelas |
| FLOW-09 | Mitra meninjau dan memutuskan | Meninjau + gateway “Menerima?” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-021 | — |
| FLOW-10 | Mitra mengirim surat keputusan | Dua aktivitas surat | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-003, D-004; OD-022 | Format belum ada |
| FLOW-11 | Admin/Prodi update status dan menetapkan DPM | Update status + tetapkan DPM | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-016, OD-023 | Syarat/waktu belum jelas |
| FLOW-12 | Mahasiswa unggah surat dan magang dengan DPM | Unggah + mengikuti magang | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-025 | Verifikasi/penyelesaian belum jelas |
| FLOW-13 | Mahasiswa melihat rekomendasi lain dan mengajukan kembali | Loop gateway “Diterima?” | **SESUAI BPMN** | **BELUM DIPUTUSKAN** | D-004; OD-018, OD-019 | Batas pengajuan ulang belum jelas |

---

## 15. Pemetaan D-004 — batas MVP

D-004 menetapkan **prinsip prioritas**, bukan daftar fitur final. Semua kandidat di bawah tetap berstatus **BELUM DIPUTUSKAN** sampai scope fitur dikonfirmasi.

### 15.1 Kandidat prioritas karena eksplisit di BPMN

- FLOW-01–FLOW-13.
- FR-AUTH-01; FR-MIT-01, FR-MIT-02; FR-PREF-01; FR-GRADE-01, FR-GRADE-04.
- FR-ALG-01–FR-ALG-04.
- FR-APP-01–FR-APP-04, FR-APP-07, FR-APP-09, FR-APP-10, FR-APP-12.
- FR-MITRA-01–FR-MITRA-03.
- FR-DPM-01–FR-DPM-03.
- FR-STATUS-01; FR-NOTIF-01; FR-UI-01.

### 15.2 Belum dikonfirmasi sebagai MVP

- FR-AUTH-03, FR-AUTH-04, FR-AUTH-07–FR-AUTH-09.
- FR-MIT-03–FR-MIT-05; FR-DATA-01; FR-PREF-02; FR-GRADE-02, FR-GRADE-03, FR-GRADE-05.
- FR-ALG-05–FR-ALG-11.
- FR-APP-05, FR-APP-06, FR-APP-08, FR-APP-11, FR-APP-13–FR-APP-15.
- FR-MITRA-04, FR-MITRA-05; FR-DPM-04–FR-DPM-08.
- FR-STATUS-02; FR-NOTIF-02, FR-NOTIF-03; FR-REPORT-01; FR-INTEG-01.
- FR-UI-02–FR-UI-04; FR-API-01–FR-API-03; NFR-01–NFR-05; ACC-01.

### 15.3 Tidak termasuk default

- FR-AUTH-06 (akun/portal mitra) — ditolak oleh D-003; mitra tetap eksternal tanpa akun.
- Fitur tambahan yang tidak disebut BPMN tidak otomatis masuk MVP.

---

## 16. Register keputusan terbuka

Setiap keputusan terbuka memiliki ID, pertanyaan spesifik, alasan, bagian sistem terdampak, status, kebutuhan terkait, dan sumber. Register ini sama dengan `docs/PRD.md` Bagian 8.

| ID | Kelompok | Pertanyaan spesifik | Alasan keputusan dibutuhkan | Bagian terdampak | Status | Kebutuhan terkait | Sumber/Q |
|---|---|---|---|---|---|---|---|
| **OD-001** | Hak akses | Apa kewenangan Admin setelah D-001? | D-001 hanya memisahkan role, belum menetapkan izin | Auth, UI, API, alur Admin | **PERLU KONFIRMASI PEMILIK PRODUK** | ACT-02, FR-AUTH-05, FR-MIT-01, FR-MIT-02, FR-UI-03, FLOW-01, FLOW-02, FLOW-07, FLOW-08, FLOW-11 | Q1, Q2, Q9, Q10 |
| **OD-002** | Hak akses | Apa kewenangan Prodi? | D-001 hanya memisahkan role, belum menetapkan izin | Auth, UI, API, alur Prodi | **PERLU KONFIRMASI PEMILIK PRODUK** | ACT-02, FR-AUTH-05, FR-MIT-01, FR-MIT-02, FR-UI-03, FLOW-01, FLOW-02, FLOW-07, FLOW-08, FLOW-11 | Q1, Q2, Q10 |
| **OD-003** | Hak akses | Bagaimana matriks izin seluruh role? | BPMN tidak memuat matriks izin | Auth, endpoint, UI | **PERLU KONFIRMASI PEMILIK PRODUK** | ACT-09, FR-AUTH-05, FR-UI-03 | Q10 |
| **OD-004** | Akun/data | Bagaimana login Admin/Prodi dan DPM? | Hanya login mahasiswa yang eksplisit | Auth | **BELUM JELAS DI BPMN** | ACT-03, FR-AUTH-02, FR-AUTH-09 | Q4, Q56 |
| **OD-005** | Akun/data | Bagaimana sumber akun mahasiswa dan apakah registrasi diperlukan? | BPMN dimulai dari login | Auth, UI | **PERLU KONFIRMASI PEMILIK PRODUK** | FR-AUTH-04, FR-DATA-01 | Q7, Q55 |
| **OD-006** | Akun/data | Apakah profil mahasiswa termasuk MVP? | Profil tidak ada di BPMN | UI, data | **BELUM DIPUTUSKAN** | FR-AUTH-03, FR-AUTH-07, FR-UI-02 | Q8 |
| **OD-007** | Akun/data | Dari mana nilai mata kuliah prasyarat diperoleh? | Manual, impor, atau integrasi belum jelas | Data, algoritma | **PERLU KONFIRMASI PEMILIK PRODUK** | FR-GRADE-02, FR-GRADE-03 | Q23 |
| **OD-008** | Akun/data | Apa aturan validasi data mahasiswa dan nilai? | BPMN hanya menyebut validasi | Data, algoritma | **BELUM JELAS DI BPMN** | FR-GRADE-03, FR-GRADE-04, FR-GRADE-05, FR-ALG-08 | Q24, Q27 |
| **OD-009** | K-Means | Atribut apa yang digunakan dan bagaimana preprocessing? | Tidak dirinci di BPMN | Algoritma | **PERLU KONFIRMASI PEMILIK PRODUK** | FR-MIT-03, FR-ALG-01, FR-ALG-05 | Q11 |
| **OD-010** | K-Means | Berapa jumlah cluster dan bagaimana menentukannya? | Tidak dirinci di BPMN | Algoritma | **PERLU KONFIRMASI PEMILIK PRODUK** | FR-ALG-01, FR-ALG-05 | Q12 |
| **OD-011** | K-Means | Apa target clustering dan bagaimana hasilnya digunakan? | BPMN menyebut pengelompokan mitra, penggunaan tidak jelas | Algoritma, rekomendasi | **BELUM JELAS DI BPMN** | FR-ALG-01 | Q13 |
| **OD-012** | SAW | Apa kriteria dan bobot SAW? | Tidak dirinci di BPMN | Algoritma | **PERLU KONFIRMASI PEMILIK PRODUK** | FR-MIT-02, FR-MIT-03, FR-ALG-03, FR-ALG-06, FLOW-02 | Q14, Q15 |
| **OD-013** | SAW | Bagaimana benefit/cost, normalisasi, dan nilai kosong? | Tidak dirinci di BPMN | Algoritma | **PERLU KONFIRMASI PEMILIK PRODUK** | FR-ALG-03, FR-ALG-06 | Q16, Q17 |
| **OD-014** | SAW | Berapa ranking ditampilkan dan bagaimana tie-break? | Tidak dirinci di BPMN | UI, algoritma | **PERLU KONFIRMASI PEMILIK PRODUK** | FR-ALG-04, FR-ALG-07, FR-ALG-08, FR-UI-01 | Q17, Q20 |
| **OD-015** | Peminatan | Bagaimana pemetaan DTA/PSI/SIA dan aturan multi-peminatan? | Hanya ada label filter | Algoritma, data | **PERLU KONFIRMASI PEMILIK PRODUK** | FR-MIT-04, FR-PREF-02, FR-ALG-02, FLOW-04 | Q18, Q19 |
| **OD-016** | Pengajuan | Apa daftar status dan transisi yang sah? | Hanya Diterima/Ditolak eksplisit | Workflow, UI, API | **PERLU KONFIRMASI PEMILIK PRODUK** | FR-APP-09, FR-APP-14, FR-STATUS-01, FR-STATUS-02, FLOW-05, FLOW-11 | Q25, Q26, Q33, Q34 |
| **OD-017** | Pengajuan | Bagaimana validasi dokumen, revisi, dan penolakan Admin/Prodi? | Tidak ada gateway/alur revisi | Workflow, dokumen | **BELUM JELAS DI BPMN** | FR-APP-04, FR-APP-05, FR-APP-06, FR-APP-10, FR-APP-11, FR-UI-04, FLOW-07, FLOW-08 | Q27, Q28, Q31, Q32, Q41 |
| **OD-018** | Pengajuan | Bagaimana penolakan mitra, pembatalan, dan pengajuan ulang? | Hanya ada loop pengajuan ulang | Workflow | **PERLU KONFIRMASI PEMILIK PRODUK** | FR-APP-12, FR-APP-13, FR-ALG-09, FLOW-13 | Q29, Q30, Q33 |
| **OD-019** | Pengajuan | Apakah mahasiswa boleh melamar ke beberapa mitra? | Tidak dijelaskan di BPMN | Workflow | **BELUM DIPUTUSKAN** | FR-APP-01, FR-APP-13, FR-APP-15, FLOW-05, FLOW-13 | Q29 |
| **OD-020** | Mitra/komunikasi | Siapa menyusun dan mengirim email/surat? | Catatan BPMN tidak diikuti aktivitas | Integrasi, workflow | **BELUM JELAS DI BPMN** | FR-APP-07, FR-APP-08, FR-MITRA-01, FLOW-08 | Q35, Q36, Q37 |
| **OD-021** | Mitra/komunikasi | Bagaimana pencatatan respons, tenggat, dan sumber kebenaran status? | Tidak ada timer/sumber kebenaran | Workflow, integrasi | **PERLU KONFIRMASI PEMILIK PRODUK** | FR-MIT-05, FR-MITRA-02, FR-MITRA-04, FR-MITRA-05, FR-APP-09, FLOW-09 | Q38, Q39, Q40 |
| **OD-022** | Mitra/komunikasi | Bagaimana template, format, dan riwayat surat? | Tidak dirinci | Dokumen, integrasi | **BELUM DIPUTUSKAN** | FR-MITRA-03, FR-NOTIF-03, FLOW-10 | Q37, Q41 |
| **OD-023** | DPM | Kapan dan siapa yang menetapkan DPM? | Catatan BPMN dan diagram tidak konsisten | DPM, workflow | **BELUM JELAS DI BPMN** | FR-DPM-01, FR-DPM-02, FR-DPM-04, FLOW-11 | Q42 |
| **OD-024** | DPM | Apa kriteria penugasan, beban, persetujuan, dan penggantian? | Tidak dirinci | DPM, workflow | **PERLU KONFIRMASI PEMILIK PRODUK** | FR-DPM-05 | Q43, Q44 |
| **OD-025** | DPM | Apa kewenangan, cakupan bimbingan, dan komunikasi DPM? | Tidak dirinci | DPM, UI | **PERLU KONFIRMASI PEMILIK PRODUK** | FR-DPM-03, FR-DPM-06, FR-DPM-07, FLOW-12 | Q45, Q47 |
| **OD-026** | Akhir proses | Apakah MVP berhenti di BPMN atau mencakup evaluasi/penyelesaian magang? | BPMN hanya memuat bimbingan dan end event | Scope, DPM | **PERLU KONFIRMASI PEMILIK PRODUK** | FR-DPM-06, FLOW-12 | Q46 |
| **OD-027** | Nonfungsional | Bagaimana keamanan, privasi, dan audit log? | Tidak dirinci | Keamanan, data | **PERLU KONFIRMASI PEMILIK PRODUK** | NFR-04, NFR-05 | Q53 |
| **OD-028** | Nonfungsional | Bagaimana kinerja, backup, dan kriteria penerimaan? | Tidak dirinci | NFR, operasi | **PERLU KONFIRMASI PEMILIK PRODUK** | NFR-02, NFR-03, ACC-01 | Q52, Q54 |
| **OD-029** | Tambahan | Apakah notifikasi mahasiswa/mitra termasuk MVP? | BPMN hanya menonjolkan notifikasi Admin/Prodi | Notifikasi | **BELUM DIPUTUSKAN** | FR-APP-03, FR-NOTIF-01, FR-NOTIF-02, FR-NOTIF-03, FLOW-07 | Q48, Q49 |
| **OD-030** | Tambahan | Apakah laporan, integrasi, dan pengelolaan pengguna termasuk MVP? | Tidak ada di BPMN | Reporting, integrasi, auth | **BELUM DIPUTUSKAN** | FR-AUTH-08, FR-DATA-01, FR-REPORT-01, FR-INTEG-01 | Q9, Q50, Q51 |
| **OD-031** | Tambahan | Apakah histori rekomendasi/banding diperlukan? | Tidak ada di BPMN | Data, workflow | **BELUM DIPUTUSKAN** | FR-ALG-11 | Q57, Q58 |

---

## 17. Blocker implementasi

Kebutuhan berikut tidak boleh diimplementasikan sebelum keputusan tersedia:

1. **Matriks role dan hak akses** — OD-001–OD-003; D-001 hanya menetapkan pemisahan Admin/Prodi.
2. **Login Admin/Prodi/DPM dan mekanisme akun** — OD-004, OD-005; D-002 hanya menetapkan definisi DPM.
3. **Kebijakan mitra dan komunikasi** — OD-020–OD-022; D-003 menetapkan mitra tanpa akun dan kanal email/surat.
4. **Registrasi, profil, dan pengelolaan pengguna** — OD-005, OD-006, OD-030.
5. **Atribut K-Means, cluster, kriteria/bobot SAW, pemetaan peminatan, nilai prasyarat** — OD-007–OD-015.
6. **State machine pengajuan dan penanganan dokumen** — OD-016–OD-019.
7. **Aturan DPM dan penyelesaian magang** — OD-023–OD-026.
8. **NFR dan kriteria penerimaan** — OD-027, OD-028.
9. **Notifikasi, laporan, integrasi, histori/banding** — OD-029–OD-031.
10. **Daftar fitur MVP final** — D-004 menetapkan prinsip prioritas, bukan daftar fitur final.

---

## 18. Status dokumen

- Dokumen ini hanya dokumentasi; tidak ada kode aplikasi, database, migration, seeder, dependency, konfigurasi, atau test yang diubah.
- PRD rujukan adalah `docs/PRD.md` versi 0.3.
- D-001–D-004 tercatat sebagai **DIKONFIRMASI**; OD-001–OD-031 tetap terbuka; Q1–Q58 dipertahankan.
- Traceability memuat 75 kebutuhan fungsional, 9 baris aktor, 13 langkah alur, dan 7 baris NFR/ACC/SCOPE (total 104 baris).
- Hanya 7 baris yang berstatus **DIKONFIRMASI** karena terkait langsung dengan D-001–D-004: ACT-02, ACT-03, ACT-04, ACT-06, ACT-07, FR-AUTH-06, dan SCOPE-01.
- Status BPMN tidak diubah menjadi status keputusan. Kebutuhan lain tetap terbuka sesuai kolom **Status keputusan**.
- Jika BPMN atau keputusan pemilik produk diperbarui, dokumen ini dan `docs/PRD.md` harus disinkronkan ulang.
