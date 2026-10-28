# Requirements Traceability — SPK Magang

**Tanggal:** 23 Oktober 2026<br>
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

- Bagian 1–17 adalah dokumen traceability dan tidak mengubah status keputusan. §19–§21 mencatat status implementasi teknis, matriks kesiapan, serta usulan awal; semuanya bukan keputusan bisnis.
- PRD rujukan adalah `docs/PRD.md` versi 0.3.
- D-001–D-004 tercatat sebagai **DIKONFIRMASI**; OD-001–OD-031 tetap terbuka; Q1–Q58 dipertahankan.
- Traceability memuat 75 kebutuhan fungsional, 9 baris aktor, 13 langkah alur, dan 7 baris NFR/ACC/SCOPE (total 104 baris).
- Hanya 7 baris yang berstatus **DIKONFIRMASI** karena terkait langsung dengan D-001–D-004: ACT-02, ACT-03, ACT-04, ACT-06, ACT-07, FR-AUTH-06, dan SCOPE-01.
- Status BPMN tidak diubah menjadi status keputusan. Kebutuhan lain tetap terbuka sesuai kolom **Status keputusan**.
- Jika BPMN atau keputusan pemilik produk diperbarui, dokumen ini dan `docs/PRD.md` harus disinkronkan ulang.

---

## 19. Lampiran status implementasi teknis

Bagian ini **bukan status keputusan** dan tidak mengubah tabel di atas.
Bagian ini hanya mencatat apa yang benar-benar ada di repository per
23 Oktober 2026, agar implementasi tidak disalahartikan sebagai konfirmasi
kebutuhan produk.

| Kebutuhan | Implementasi aktual | Verifikasi | Catatan |
|---|---|---|---|
| FR-AUTH-01 | Endpoint login, form login, dan penyimpanan token Bearer | PHPUnit, Vitest, ESLint, build, browser E2E | Mahasiswa belum tentu boleh registrasi; OD-005 tetap terbuka |
| FR-AUTH-02 | Login teknis memakai email/password untuk semua user | PHPUnit, browser E2E | Mekanisme login Admin/Prodi/DPM tetap menunggu OD-004 |
| FR-AUTH-03 | Endpoint logout dan tombol logout | PHPUnit, Vitest, build, browser E2E | Status kebutuhan logout tetap BELUM DIPUTUSKAN (OD-006) |
| FR-AUTH-04 | Tidak diimplementasikan | — | Registrasi menunggu OD-005 |
| FR-AUTH-05 | Middleware `role` untuk `admin`, `prodi`, `mahasiswa`, dan `dpm`; route guard frontend dan redirect login yang memeriksa role tujuan | PHPUnit termasuk alur token lintas role, Vitest, browser E2E | Matriks izin lengkap belum ada; OD-001–OD-003. Redirect login memakai tujuan aman per role agar state halaman role sebelumnya tidak dipakai ulang; ini bukan penambahan hak akses |
| FR-AUTH-06 | Sengaja tidak diimplementasikan | — | D-003: mitra tanpa akun |
| FR-AUTH-07 | Halaman profil teknis menampilkan id, nama, email, role | Build | Status profil sebagai MVP tetap BELUM DIPUTUSKAN (OD-006) |
| FR-AUTH-08 | Tidak diimplementasikan | — | Pengelolaan pengguna menunggu OD-030 |
| FR-AUTH-09 | Tidak diimplementasikan | — | SSO tidak diputuskan |
| FR-MIT-01 | CRUD mitra admin melalui `/api/admin/partners` dan UI `/mitra` | PHPUnit, Pint, migration PostgreSQL, ESLint, build, E2E browser | UI dibatasi role admin; kewenangan Prodi dan aturan lanjutan menunggu OD-001–OD-003. Bukti E2E ada di `docs/VERIFICATION.md` |
| FR-MIT-02 | Struktur `criteria`, CRUD `/api/admin/criteria`, nilai mitra, dan UI `/kriteria` tersedia | PHPUnit, Vitest, build | Daftar kriteria, bobot awal, skala, dan total bobot resmi belum ditetapkan (OD-012/OD-013); kewenangan rinci menunggu OD-001–OD-003 |
| FR-MIT-03 | Nilai kriteria per mitra tersedia melalui `criterion_scores` dan endpoint admin/prodi | PHPUnit, Vitest | Daftar atribut resmi dan sumber nilainya menunggu OD-009/OD-012 |
| FR-MIT-04–FR-MIT-05 | Tidak diimplementasikan | — | Pemetaan mitra–peminatan, kuota, dan status mitra belum diputuskan |
| FR-DATA-01 | Tidak diimplementasikan | — | Menunggu OD-005/OD-030 |
| FR-PREF-01 | Struktur `student_peminatan`, endpoint profil, dan UI tersedia | PHPUnit, Vitest, build | Penulisan menunggu mode `single`/`multiple` (OD-015); belum ada pemetaan peminatan ke mitra |
| FR-PREF-02 | Tidak diimplementasikan | — | Perubahan/multi-peminatan menunggu OD-015 |
| FR-GRADE-01 | Master `courses`, `student_grades`, `GET/PUT /api/mahasiswa/grades`, dan UI nilai milik sendiri | PHPUnit, Vitest, build | Mencatat nilai tanpa menyatakan lulus/tidak lulus; sumber nilai resmi menunggu OD-007 |
| FR-GRADE-02–FR-GRADE-05 | Sebagian: validasi teknis, isolasi akun, dan status prasyarat belum dikonfigurasi | PHPUnit, Vitest | Daftar prasyarat, skala, ambang, sumber, histori, dan aturan validasi resmi menunggu OD-007/OD-008 |
| FR-ALG-01–FR-ALG-11 | Sebagian: layanan generik, klien HTTP tervalidasi, pipeline rekomendasi, readiness gate berkategori, dan status `not_ready` | PHPUnit, Python unittest, Vitest, build | Parameter K-Means/SAW, jumlah ranking, dan pemetaan menunggu OD-009–OD-015; aturan prasyarat menunggu OD-007/OD-008. Matriks kesiapan ada di §20 |
| FR-APP-01–FR-APP-15 | Sebagian: katalog mitra berisi detail kontak, kirim pengajuan dengan mitra terpilih dari katalog, daftar dan detail pengajuan milik sendiri, daftar/detail admin/prodi, keputusan `menunggu` → `diterima`/`ditolak`, unggah/unduh surat penerimaan untuk pengajuan diterima, serta pencatatan manual komunikasi mitra (arah, kanal email/surat, waktu, ringkasan). Validasi surat memakai MIME isi berkas dan allowlist server; detail Admin/Prodi/Mahasiswa/DPM mengabaikan respons ID lama | PHPUnit termasuk alur integrasi token, katalog mitra, dan validasi MIME isi berkas; Vitest termasuk perubahan ID, respons terbalik, katalog, dan detail mahasiswa; build, browser E2E | Pengiriman email/surat otomatis, verifikasi/revisi dokumen, notifikasi keluar, reversal, batas lamaran ganda, dan pengajuan ulang menunggu OD-016–OD-021. Alur integrasi membuktikan log komunikasi tidak mengubah status, reviewer, atau waktu keputusan |
| FR-MITRA-01–FR-MITRA-05 | Sebagian: Admin/Prodi dapat mencatat pengiriman ke mitra dan balasan yang diterima secara manual; waktu ber-offset dinormalisasi ke UTC; tidak ada portal, email otomatis, atau status hasil otomatis | PHPUnit termasuk alur integrasi token dan normalisasi waktu, Vitest, browser E2E | Penerimaan/peninjauan oleh mitra, template, tenggat, pengingat, dan sumber kebenaran status menunggu OD-020–OD-022 |
| FR-DPM-01–FR-DPM-08 | Sebagian: `admin`/`prodi` dapat menetapkan satu akun ber-role `dpm` untuk pengajuan diterima; DPM hanya dapat melihat daftar dan detail pengajuan yang ditugaskan, termasuk identitas mahasiswa, mitra, penempatan, dan metadata surat | PHPUnit termasuk alur integrasi token dan penolakan lintas DPM, Vitest, build, browser E2E | Catatan review internal, riwayat komunikasi mitra, dan unduhan surat tidak diakses DPM. Kriteria penugasan, beban, persetujuan, penggantian, bimbingan, penilaian, dan komunikasi DPM menunggu OD-023–OD-026 |
| FR-STATUS-01–FR-STATUS-02 | Sebagian: `menunggu`, `diterima`, `ditolak`; transisi hanya `menunggu` → keputusan | PHPUnit, Vitest | Status antara dan reversal menunggu OD-016/OD-021 |
| FR-NOTIF-01–FR-NOTIF-03 | Sebagian: dashboard Admin/Prodi menghitung pengajuan berstatus `menunggu` sebagai notifikasi dalam aplikasi dan menampilkan pengajuan terbaru. Tidak ada email, push, atau kanal keluar | Vitest, build | Pemicu, kanal, template, dan riwayat notifikasi keluar menunggu OD-029; hitungan dashboard bukan definisi kanal resmi |
| FR-REPORT-01, FR-INTEG-01 | Tidak diimplementasikan | — | Belum diputuskan |
| FR-UI-01–FR-UI-04 | Shell UI, login, dashboard per role berbasis data backend, profil, halaman admin mitra, katalog mitra mahasiswa, nilai akademik, rekomendasi, daftar/detail pengajuan mahasiswa/admin-prodi, pencatatan komunikasi manual, unggah/unduh surat, penempatan DPM, serta daftar/detail mahasiswa bimbingan DPM tersedia | Vitest, build, browser E2E | Verifikasi dokumen, notifikasi keluar, revisi, dan aksi bimbingan/penilaian DPM belum ada |
| FR-API-01 | REST API frontend–backend untuk health, auth, CRUD mitra, nilai akademik, rekomendasi, pengajuan, surat penerimaan, penempatan DPM, komunikasi mitra manual, serta daftar/detail DPM terbatas | PHPUnit termasuk alur integrasi token, build, browser E2E | Kontrak modul bisnis lain belum ada |
| FR-API-02–FR-API-03 | Klien backend–algorithm service dan validasi kontrak request/response tersedia; parameter bisnis tetap kosong | PHPUnit, Python unittest | Kontrak generik sudah ada; isi parameter bisnis menunggu OD-009–OD-015 |

**Bukti verifikasi 23 Oktober 2026.** Backend lulus **208 test PHPUnit / 1.367
assertion** dan Pint; alur integrasi memakai token login nyata untuk pengajuan,
komunikasi, keputusan, surat penerimaan, penempatan DPM, akses detail DPM,
penolakan lintas mahasiswa, penolakan lintas DPM, serta pemeriksaan status dan
metadata review. Waktu komunikasi ber-offset juga diuji tersimpan sebagai UTC.
Validasi surat diuji dengan berkas nyata: MIME dideteksi dari isi, PDF bernama
`.jpg` diterima sebagai PDF, teks bernama `.pdf` ditolak, PDF bernama `.php`
ditolak, dan allowlist kosong/rusak jatuh ke default aman PDF/JPEG/PNG. Frontend
lulus **56 test Node**, **154 test Vitest (22 file)**, ESLint, TypeScript, dan Vite
build. Penambahan mencakup dashboard Admin/Prodi dan DPM, katalog mitra
mahasiswa, detail pengajuan mahasiswa, redirect beranda per role, serta pesan
konflik hapus mitra. Integrasi HTTP nyata Laravel ke FastAPI untuk `POST /saw`
dan `POST /kmeans` juga diperiksa manual selain test dengan HTTP fake. Test detail Admin/Prodi dan DPM mencakup
perubahan ID tanpa unmount serta respons request yang selesai terbalik. Algorithm
service lulus **44 test Python `unittest`** setelah dependensi test dipasang.
Browser E2E ad hoc memakai Chrome 155 headless melalui Chrome DevTools Protocol,
database SQLite sementara, storage sementara, dan port alternatif; **43
pemeriksaan lulus** untuk alur mahasiswa, Admin, Prodi, dan dua DPM, termasuk
unggah/unduh surat serta pemeriksaan bahwa DPM lain tidak dapat membuka detail.
E2E dijalankan ulang setelah hardening validasi surat dan konsistensi detail.
E2E sebelumnya menemukan satu bug UX redirect login lintas role; perbaikannya
memakai tujuan redirect yang divalidasi terhadap role dan diuji dengan Node
serta Vitest. Tidak ada exception JavaScript tak tertangkap; respons 404 lintas
DPM yang memang diharapkan ditampilkan sebagai state error UI. E2E ini tidak
disimpan sebagai test suite otomatis dan hanya diuji pada Chrome/SQLite. Database
pengembangan, `.env`, dan data bisnis tidak diubah.

Database saat ini memuat tabel autentikasi dan pendukung Laravel, `partners`,
`criteria`, `criterion_scores`, `student_peminatan`, `courses`,
`student_grades`, `internship_applications`, `acceptance_letters`,
`dpm_placements`, dan `application_communications`. `internship_applications`
hanya memuat status yang dapat dipertanggungjawabkan dari BPMN; status antara
dan aturan lanjutan belum ditambahkan karena keputusan produk belum tersedia.
`acceptance_letters` menyimpan metadata satu surat per pengajuan diterima,
`dpm_placements` merujuk akun `users` ber-role `dpm`, dan
`application_communications` menyimpan jejak manual pengiriman/balasan mitra
tanpa mengubah status pengajuan. Kebijakan revisi/penggantian dan sumber
kebenaran status tetap menunggu OD-017, OD-021, dan OD-024.
Seeder tidak membuat akun default; akun uji harus dibuat secara eksplisit untuk
lingkungan lokal.

---

## 20. Matriks kesiapan aturan rekomendasi (OD-007–OD-015)

Bagian ini adalah **lampiran teknis**, bukan register keputusan. Sumber
keputusan bisnis tetap `docs/BUSINESS-DECISION-REGISTER.md`; perubahan status
keputusan tidak boleh disimpulkan dari tabel di bawah. Matriks ini mencatat
bagian kode/konfigurasi yang sudah tersedia, data yang masih dibutuhkan, dan
konsekuensi bila keputusan belum diambil.

### 20.1 Mekanisme readiness

Endpoint `GET /api/mahasiswa/recommendations` tidak pernah memakai nilai
default yang tidak disetujui. Setiap pemeriksaan mengembalikan `category`:

| Kategori | Arti | Contoh pemeriksaan |
|---|---|---|
| `technical` | Validasi teknis konfigurasi/LAYANAN | URL layanan algoritma valid dan dapat dipanggil |
| `data` | Kelengkapan data yang tersimpan | Mitra tersedia, nilai mitra lengkap, peminatan mahasiswa tersedia |
| `decision` | Keputusan bisnis/aktivasi yang belum final | Aktivasi eksplisit, prasyarat, kriteria SAW, kebijakan ranking |
| `analysis` | Konfigurasi analitik/dashboard yang tidak memblokir SAW | Fitur/jumlah/seed K-Means dan label cluster untuk analitik |

Aturan fail-closed yang berlaku:

1. Pemeriksaan kategori `technical`, `data`, dan `decision` harus `ok`; satu
   pemeriksaan pada kategori tersebut yang `blocked` menghasilkan
   `status = not_ready`, `ranking = []`, dan `kmeans = null`. Pemeriksaan
   kategori `analysis` tetap ditampilkan pada `checks`, tetapi tidak memblokir
   perhitungan SAW (proposal menetapkan label klaster sebagai informasi
   analitik, bukan filter wajib sebelum SAW).
2. `RECOMMENDATION_ENABLED` bernilai `false` secara default. Mengaktifkannya
   adalah kontrol operasional dan tidak menggantikan keputusan OD-007–OD-015.
3. `recommendation.kmeans.feature_criterion_ids` dan
   `recommendation.peminatan_cluster_map` sengaja berupa daftar kosong di
   konfigurasi; tidak ada fallback dari browser, query, atau body request.
   Nilai kosong hanya menonaktifkan analitik/label klaster, bukan ranking.
4. `recommendation.ranking.limit` kosong berarti jumlah ranking belum
   ditetapkan (OD-014) dan ranking tidak dibuat.
5. Nilai mitra yang hilang tidak dianggap nol. Nilai akademik yang hilang tidak
   dianggap nol. Mahasiswa hanya dievaluasi dengan peminatan dan nilai milik
   akun yang sedang login.
6. Data dari FastAPI divalidasi bentuk, jumlah, indeks, dan nilainya sebelum
   dipakai; kegagalan layanan menjadi respons aman tanpa stack trace.
7. Parameter aktual yang dipakai (cluster, seed, ID fitur) dikembalikan pada
   ringkasan `kmeans` agar hasil dapat ditelusuri.

Konfigurasi terkait: `backend/config/recommendation.php`,
`backend/config/academic.php`, `backend/config/student.php`, dan
`backend/config/services.php`. Contoh variabel ada di `backend/.env.example`;
file `.env` tidak diubah oleh implementasi ini.

### 20.2 Matriks per keputusan

| OD | Keputusan yang diperlukan | Kode/config terdampak | Data yang dibutuhkan | Dampak bila belum ditentukan | Tes yang diperlukan | Status |
|---|---|---|---|---|---|---|
| **OD-007** | Sumber nilai resmi (manual/impor/integrasi), skala nilai, dan apakah menyimpan histori atau nilai terbaru | `student_grades`, `StudentGradeService`, `config/academic.php` (`grade.min/max` hanya batas penyimpanan), `UpdateStudentGradesRequest` | Sumber resmi, skala, pemilik data, aturan sinkronisasi/histori | Struktur dan API nilai tersedia, tetapi tidak ada klaim sumber resmi; ranking tetap `not_ready` karena aturan prasyarat kosong | Isolasi nilai per akun, nilai kosong tidak menjadi nol, validasi input, status sumber | **Sebagian** |
| **OD-008** | Daftar mata kuliah prasyarat, ambang lulus, validasi data, dan penanganan data tidak valid | `AcademicPrerequisiteEvaluator`, `config/academic.php` (`prerequisites.rules`), `StudentGradeService`, `RecommendationService` | Daftar `course_id`, `minimum_score`, kebijakan data tidak valid/kosong | `rules = []` menghasilkan pemeriksaan `prerequisites` blocked dan ranking tidak dibuat | Rules kosong, nilai hilang, nilai nol, di bawah ambang, konfigurasi tidak valid, evaluasi hanya untuk mahasiswa terkait | **Sebagian** |
| **OD-009** | Atribut K-Means dan preprocessing | `config/recommendation.php` (`kmeans.feature_criterion_ids`), `RecommendationService` (matriks fitur), `AlgorithmService::kmeans`, `algorithm/spk_algorithm/kmeans.py` | Daftar atribut resmi, tipe/skala, transformasi, penanganan nilai kosong | Daftar kosong menghasilkan pemeriksaan `kmeans_configuration` berkategori `analysis` berstatus blocked; analitik klaster tidak dihitung, tetapi ranking SAW tetap dapat berjalan bila gate lain terpenuhi | Daftar kosong, ID kriteria tidak dikenal/duplikat, matriks hanya dari kriteria terpilih | **Sebagian (analitik)** |
| **OD-010** | Jumlah cluster dan cara menentukannya | `config/recommendation.php` (`kmeans.cluster_count`, `random_seed`), `AlgorithmService::kmeans`, `kmeans.py` | Jumlah/aturan cluster, dasar penentuan, seed reproducible | `cluster_count` null menonaktifkan analitik klaster (kategori `analysis`), bukan ranking; cluster melebihi jumlah mitra ditolak untuk analitik | Null, nilai tidak valid, cluster > jumlah mitra, seed diteruskan ke layanan | **Sebagian (analitik)** |
| **OD-011** | Objek yang dikelompokkan, tujuan cluster, dan pemanfaatan hasil | `config/recommendation.php` (`peminatan_cluster_map`), `RecommendationService` (K-Means analitik + SAW seluruh mitra), `AdminAnalyticsController` | Target clustering (mitra/mahasiswa/keduanya), arti cluster, aturan hitung ulang | Label cluster tidak menyaring kandidat SAW; pemetaan kosong hanya membuat pemeriksaan `analysis` blocked dan analitik tidak berlabel. Proposal menetapkan label klaster sebagai informasi analitik, bukan filter wajib | Label cluster tidak memfilter kandidat, pemetaan kosong, indeks cluster di luar rentang, distribusi analitik, himpunan mitra kosong | **Sebagian (analitik; keputusan final terbuka)** |
| **OD-012** | Daftar kriteria SAW resmi, bobot, skala/total bobot, penanggung jawab, dan aturan perubahan | Tabel `criteria`, `CriterionController`, `Store/UpdateCriterionRequest`, `CriterionScoreController`, `RecommendationService` | Daftar kriteria, bobot awal, skala (0–1/0–100), total wajib, versioning/audit | Master dan UI tersedia, tetapi tidak ada daftar/bobot resmi; `RECOMMENDATION_ENABLED=false` menjaga ranking tetap nonaktif | Kriteria kosong, bobot negatif/tidak finite, total bobot nol, validasi CRUD, aktivasi eksplisit | **Sebagian** |
| **OD-013** | Tipe benefit/cost per kriteria, rumus normalisasi, skala nilai, dan perilaku nilai kosong/nol | `CriterionType`, `algorithm/spk_algorithm/saw.py`, `RecommendationService` (validasi kolom), `UpdatePartnerScoresRequest` | Tipe per kriteria, skala nilai, kebijakan nol/kosong, rumus resmi | Normalisasi generik tersedia; nilai cost nol dan benefit semua nol diblokir, tetapi kebijakan resmi belum ditetapkan | Cost bernilai nol, benefit semua nol, nilai hilang, nilai negatif, respons SAW tidak valid | **Sebagian** |
| **OD-014** | Jumlah rekomendasi, tie-break, serta perilaku hasil kosong/kegagalan | `config/recommendation.php` (`ranking.limit`), `algorithm/spk_algorithm/saw.py` (competition ranking), `RecommendationService` (slice ranking), `RecommendationController` (503) | Top-N atau semua, aturan tie-break, kebijakan hasil kosong dan kegagalan | `ranking.limit` kosong menghasilkan `ranking_policy` blocked; tie-break masih memakai perilaku deterministik generik dan belum disetujui | Limit diterapkan, limit tidak valid, layanan gagal, respons tidak valid | **Sebagian** |
| **OD-015** | Kardinalitas peminatan, aturan perubahan, cakupan persistensi, dan pemetaan peminatan ke mitra | `student_peminatan`, `StudentProfileService`, `StudentPeminatanResolver`, `config/student.php`, `config/recommendation.php` (`peminatan_cluster_map`) | Satu/lebih dari satu, aturan perubahan, per mahasiswa/pengajuan, pemetaan mitra | Mode kosong membuat `PUT /api/mahasiswa/profile` 409; peminatan ganda memblokir ranking; pemetaan kosong hanya memblokir label analitik, bukan ranking | Profil belum lengkap, multi-peminatan, mode kosong, isolasi profil, pemetaan kosong | **Sebagian** |

### 20.3 Ringkasan status

- **Siap secara teknis:** fungsi generik K-Means/SAW, klien HTTP tervalidasi,
  penyimpanan nilai/kriteria/peminatan, evaluator prasyarat, readiness gate,
  isolasi data mahasiswa, dan penanganan kegagalan layanan.
- **Sebagian:** seluruh OD-007–OD-015 memiliki struktur/konfigurasi teknis,
  tetapi keputusan bisnisnya belum final. Tidak ada ranking produksi yang
  dihasilkan selama konfigurasi wajib kosong atau aktivasi belum eksplisit.
- **Blocked untuk ranking produksi:** OD-007–OD-008 (sumber nilai/prasyarat),
  OD-012–OD-014 (kriteria/bobot, tipe/normalisasi, kebijakan ranking), dan
  aktivasi eksplisit. OD-009–OD-011 kini hanya memengaruhi analitik klaster
  (kategori `analysis`) dan tidak memblokir SAW. Membuka ranking memerlukan
  keputusan pemilik sistem, bukan perubahan kode atau data uji.
- **Data uji bukan data produksi:** fixture PHPUnit/Python hanya untuk menguji
  perilaku dan tidak menjadi kriteria, bobot, cluster, atau ambang default.

---

## 21. Daftar keputusan yang diperlukan dan usulan awal

Bagian ini melengkapi §16 dan §20.2 untuk keputusan yang masih terbuka.
**Kolom “Usulan awal” adalah bahan diskusi, bukan keputusan, bukan komitmen
implementasi, dan tidak mengubah status pada §16 atau
`docs/BUSINESS-DECISION-REGISTER.md`.** Usulan tidak boleh dikutip sebagai
persetujuan pemilik produk. Tidak ada hak akses, status, parameter algoritma,
atau aturan bisnis baru yang diaktifkan oleh dokumen ini.

### 21.1 Hak akses (OD-001–OD-003)

| OD | Keputusan yang diperlukan | Dampak sistem | Usulan awal (bukan keputusan) | Status keputusan |
|---|---|---|---|---|
| **OD-001** | Kewenangan Admin setelah pemisahan role | Matriks route/API, menu, tombol, dan audit tindakan Admin; saat ini Admin mengelola mitra dan bersama Prodi mengakses kriteria, mata kuliah, analitik, serta pengajuan | Pertahankan pembagian minimum yang sudah berjalan sebagai baseline, lalu minta PBP mengesahkan daftar aksi Admin sebelum menambah kewenangan | **PERLU KONFIRMASI PEMILIK PRODUK** |
| **OD-002** | Kewenangan Prodi | Route/API/UI Prodi; saat ini Prodi dapat mengakses kriteria, mata kuliah, analitik, pengajuan, dan komunikasi, tetapi CRUD mitra tetap Admin-only | Baseline usulan: Prodi menangani akademik, kriteria/nilai mitra, dan monitoring pengajuan; CRUD mitra tetap Admin sampai PBP memutuskan lain | **PERLU KONFIRMASI PEMILIK PRODUK** |
| **OD-003** | Matriks izin seluruh role | Model role/permission, otorisasi endpoint, route guard, menu, dan aksi baca/tulis/setujui; termasuk batas DPM dan ketiadaan akun mitra | Susun matriks role × aksi dengan prinsip least privilege dan deny-by-default; jangan menambah permission sebelum matriks disahkan. DPM tetap read-only sesuai batas saat ini | **PERLU KONFIRMASI PEMILIK PRODUK** |

### 21.2 Data, nilai, dan algoritma (OD-007–OD-015)

Rincian kode, konfigurasi, data, dan tes per OD sudah ada di §20.2. Tabel ini
meringkas keputusan dan usulan yang belum disetujui.

| OD | Keputusan yang diperlukan | Dampak sistem | Usulan awal (bukan keputusan) | Status keputusan |
|---|---|---|---|---|
| **OD-007** | Sumber nilai resmi, skala nilai, dan kebijakan histori versus nilai terbaru | `student_grades`, validasi nilai, evaluator prasyarat, dan readiness ranking | Mulai dari input manual sebagai draf dengan pemilik data yang jelas; jangan menyebut nilai sebagai resmi sebelum PBP menetapkan sumber, skala, dan histori | **PERLU KONFIRMASI PEMILIK PRODUK** |
| **OD-008** | Daftar mata kuliah prasyarat, ambang lulus, dan penanganan data tidak valid | `AcademicPrerequisiteEvaluator`, aturan prasyarat, dan ranking `not_ready` selama aturan kosong | Gunakan daftar prasyarat eksplisit dengan ambang per mata kuliah; nilai hilang/tidak dikenal diperlakukan belum memenuhi, bukan nol | **BELUM JELAS DI BPMN** |
| **OD-009** | Atribut K-Means dan preprocessing | Matriks fitur, `config/recommendation.php`, layanan K-Means, dan analitik klaster | Pilih hanya kriteria dengan cakupan data mitra yang lengkap, dokumentasikan skala/transformasi, dan jangan melakukan imputasi diam-diam | **PERLU KONFIRMASI PEMILIK PRODUK** |
| **OD-010** | Jumlah cluster dan cara menentukannya | Konfigurasi cluster, seed, analitik, dan reproducibility | Jangan menetapkan default; uji beberapa kandidat dengan elbow/silhouette, lalu PBP memilih jumlah dan aturan seed | **PERLU KONFIRMASI PEMILIK PRODUK** |
| **OD-011** | Target clustering dan pemanfaatan hasil | Hubungan K-Means dengan filter/ranking, label analitik, dan perhitungan ulang | Perlakukan cluster sebagai informasi analitik/label, bukan filter wajib SAW, kecuali PBP memutuskan sebaliknya | **BELUM JELAS DI BPMN** |
| **OD-012** | Daftar kriteria SAW, bobot, skala, total bobot, dan aturan perubahan | Tabel `criteria`, validasi CRUD, nilai mitra, dan ranking | Minta PBP memasok daftar dan bobot resmi; simpan sebagai konfigurasi/data tervalidasi, bukan fixture atau nilai contoh | **PERLU KONFIRMASI PEMILIK PRODUK** |
| **OD-013** | Tipe benefit/cost, normalisasi, skala, dan perilaku nilai kosong/nol | `saw.py`, validasi kolom, perhitungan, dan arti hasil | Deklarasikan tipe dan rumus per kriteria; blokir ranking bila kebijakan nilai kosong/nol belum disetujui | **PERLU KONFIRMASI PEMILIK PRODUK** |
| **OD-014** | Jumlah ranking, tie-break, dan perilaku kosong/gagal | `ranking.limit`, slice ranking, tampilan hasil, dan respons kegagalan | Minta PBP menetapkan top-N; usulan teknis: tie-break deterministik berdasarkan skor lalu ID mitra, dengan hasil kosong ditampilkan jujur | **PERLU KONFIRMASI PEMILIK PRODUK** |
| **OD-015** | Kardinalitas peminatan, aturan perubahan, dan pemetaan ke mitra | `student_peminatan`, endpoint profil, mode `single`/`multiple`, dan label/filter rekomendasi | Usulan MVP: satu peminatan per mahasiswa dan pemetaan mitra terpisah; konfirmasi istilah DTA/PSI/SIA serta aturan perubahan sebelum diaktifkan | **PERLU KONFIRMASI PEMILIK PRODUK** |

### 21.3 Pengajuan, dokumen, dan komunikasi (OD-016–OD-022)

| OD | Keputusan yang diperlukan | Dampak sistem | Usulan awal (bukan keputusan) | Status keputusan |
|---|---|---|---|---|
| **OD-016** | Daftar status dan transisi yang sah | Enum status, endpoint keputusan, UI, audit, dan kemungkinan reversal | Usulan MVP: hanya `menunggu → diterima/ditolak`; status antara, pembatalan, dan reversal tidak ditambahkan sebelum PBP menetapkan state machine | **PERLU KONFIRMASI PEMILIK PRODUK** |
| **OD-017** | Validasi dokumen, revisi, dan penolakan Admin/Prodi | Persyaratan unggah, verifikasi, penggantian, alur revisi, dan akses surat | Usulan MVP: satu surat penerimaan privat (PDF/JPG/PNG), tanpa penggantian; verifikasi/revisi menjadi keputusan terpisah | **BELUM JELAS DI BPMN** |
| **OD-018** | Penolakan mitra, pembatalan, dan pengajuan ulang | Status akhir, tombol pengajuan ulang, audit, dan komunikasi mitra | Usulan: keputusan final per pengajuan; pengajuan baru hanya setelah PBP menetapkan aturan; pembatalan/reversal tidak diaktifkan | **PERLU KONFIRMASI PEMILIK PRODUK** |
| **OD-019** | Bolehkah mahasiswa melamar ke beberapa mitra | Validasi pembuatan pengajuan, tampilan daftar, dan alur rekomendasi | Usulan MVP: satu pengajuan aktif per mahasiswa, lalu boleh mengajukan lagi setelah keputusan final | **BELUM DIPUTUSKAN** |
| **OD-020** | Siapa menyusun dan mengirim email/surat | Integrasi email/surat, hak aksi, template, dan audit | Usulan: Admin/Prodi tetap mengirim di luar sistem; aplikasi hanya mencatat aktivitas manual tanpa email otomatis atau akun mitra | **BELUM JELAS DI BPMN** |
| **OD-021** | Pencatatan respons, tenggat, pengingat, dan sumber kebenaran status | Status pengajuan, log komunikasi, timer, notifikasi, dan rekonsiliasi | Usulan: status pengajuan tetap sumber kebenaran; log komunikasi tidak mengubah status; tenggat/pengingat ditunda sampai disetujui | **PERLU KONFIRMASI PEMILIK PRODUK** |
| **OD-022** | Template, format, dan riwayat surat | Penyimpanan, generate surat, pratinjau, unduhan, retensi, dan akses | Usulan: pertahankan surat privat yang diunggah, tanpa generator template; template/riwayat resmi menunggu keputusan | **BELUM DIPUTUSKAN** |

### 21.4 DPM dan notifikasi (OD-023–OD-026, OD-029)

| OD | Keputusan yang diperlukan | Dampak sistem | Usulan awal (bukan keputusan) | Status keputusan |
|---|---|---|---|---|
| **OD-023** | Kapan dan siapa yang menetapkan DPM | Endpoint penempatan, status yang boleh, UI Admin/Prodi, dan audit | Usulan: tetap setelah pengajuan `diterima`, ditetapkan oleh Admin/Prodi; konfirmasi urutan terhadap surat/verifikasi | **BELUM JELAS DI BPMN** |
| **OD-024** | Kriteria penugasan, beban, persetujuan, dan penggantian DPM | Validasi kandidat, kuota/beban, persetujuan, dan reassignment | Usulan MVP: satu DPM per pengajuan, tanpa reassignment atau approval berlapis; kriteria/beban ditunda | **PERLU KONFIRMASI PEMILIK PRODUK** |
| **OD-025** | Kewenangan, cakupan bimbingan, komunikasi, dan penilaian DPM | Route/API/UI DPM, akses data, dan tindakan bimbingan | Usulan MVP: DPM read-only untuk pengajuan yang ditugaskan, tanpa catatan internal, komunikasi, unduhan surat, atau penilaian | **PERLU KONFIRMASI PEMILIK PRODUK** |
| **OD-026** | Apakah MVP berhenti di BPMN atau mencakup evaluasi/penyelesaian magang | Scope modul, status akhir, penilaian, dan laporan | Usulan: MVP berhenti setelah penempatan dan tampilan bimbingan dasar; evaluasi/penyelesaian menjadi fase terpisah | **PERLU KONFIRMASI PEMILIK PRODUK** |
| **OD-029** | Apakah notifikasi mahasiswa/mitra termasuk MVP | Pemicu, kanal, template, status, dan hak akses | Usulan: belum ada notifikasi keluar; status dapat dilihat di aplikasi; email/pengingat memerlukan keputusan dan implementasi terpisah | **BELUM DIPUTUSKAN** |

**Ringkasan:** seluruh baris di atas tetap **terbuka**. Usulan awal tidak
mengubah kode, data, konfigurasi, status keputusan, atau matriks izin. Bila PBP
memilih salah satu opsi, perubahan harus dicatat lebih dulu di
`docs/BUSINESS-DECISION-REGISTER.md`, dilengkapi dampak, pemilik, dan kriteria
penutupan sebelum implementasi.
