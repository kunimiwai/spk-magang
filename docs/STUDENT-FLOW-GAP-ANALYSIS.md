# Gap Analysis — Alur Mahasiswa SPK Magang

**Tanggal:** 21 Oktober 2026
**Status:** Sebagian alur belum dapat diimplementasikan karena keputusan produk masih terbuka.
**Konteks:** Lanjutan dari `docs/CRITERIA-GAP-ANALYSIS.md`, implementasi admin Mitra Magang, serta modul pengajuan, surat penerimaan, dan penempatan DPM.

---

## 1. Ringkasan

BPMN menempatkan mahasiswa pada alur login, pilih peminatan, input nilai mata
kuliah prasyarat, melihat ranking, memilih mitra, mengajukan magang, mengunggah
surat penerimaan setelah diterima, dan menerima penetapan DPM. Dokumentasi hanya
menetapkan **label peminatan**, **aktivitas input nilai**, **aktivitas unggah
surat penerimaan**, dan **penetapan DPM**; detail data, validasi, status,
dokumen, dan aturan penugasan belum ditetapkan.

Pekerjaan yang aman dan sudah diselesaikan mencakup UI manajemen Mitra Magang,
profil/peminatan, nilai akademik, pengajuan magang, surat penerimaan privat, dan
penempatan DPM dari akun ber-role `dpm`. Fitur yang membutuhkan aturan baru
tidak dipaksakan.

---

## 2. Audit alur mahasiswa

| Langkah BPMN | Status dokumentasi | Status implementasi | Dapat diimplementasikan sekarang? |
|---|---|---|---|
| Login mahasiswa | `FR-AUTH-01` sesuai BPMN; autentikasi teknis sudah ada | Login frontend/backend tersedia | Sudah tersedia |
| Profil mahasiswa | Tidak ada di BPMN; `OD-006` belum diputuskan | Profil teknis hanya menampilkan nama, email, ID, role | Tidak; field profil belum ditetapkan |
| Pilih peminatan DTA/PSI/SIA | Label peminatan eksplisit; penyimpanan, perubahan, multi-peminatan, dan pemetaan ke mitra terbuka (`OD-015`) | Struktur `student_peminatan`, endpoint profil, dan UI tersedia; penulisan bergantung mode `STUDENT_PEMINATAN_MODE` | Sebagian; kardinalitas dan aturan perubahan masih terbuka |
| Input nilai mata kuliah prasyarat | Aktivitas eksplisit; daftar mata kuliah, ambang nilai, sumber nilai, dan validasi terbuka (`OD-007`, `OD-008`) | Master `courses`, nilai `student_grades`, API nilai milik sendiri, dan UI nilai tersedia; aturan prasyarat kosong | Sebagian; pencatatan aman, keputusan prasyarat belum ada |
| Melihat rekomendasi/ranking | `FR-ALG-04`; kriteria, bobot, dan algoritma belum ditetapkan (`OD-009`–`OD-015`) | Integrasi generik dan status `not_ready` tersedia; ranking belum diaktifkan | Tidak; terblokir audit kriteria dan aturan prasyarat |
| Memilih perusahaan dan mengajukan magang | Aktivitas eksplisit; status, dokumen, batas pengajuan, dan alur revisi terbuka (`OD-016`–`OD-019`) | API/UI pengajuan tersedia; status keputusan, surat, dan DPM tersedia sebagian | Sebagian; pengajuan ulang, verifikasi/revisi dokumen, dan lamaran ganda belum |
| Menunggu hasil dan melihat rekomendasi lain | Alur eksplisit; aturan pengajuan ulang terbuka (`OD-018`) | Daftar/detail pengajuan dan status tersedia; loop rekomendasi/pengajuan ulang belum | Sebagian |
| Mengunggah surat penerimaan | Aktivitas eksplisit; format, jumlah, dan revisi terbuka (`OD-017`) | Unggah/unduh privat untuk pengajuan `diterima`; satu surat; penggantian nonaktif | Sebagian |
| Menerima penetapan DPM | Aktivitas eksplisit; kriteria, kewenangan, dan penggantian terbuka (`OD-023`–`OD-024`) | `admin`/`prodi` menetapkan satu akun ber-role `dpm`; mahasiswa melihat miliknya | Sebagian |

---

## 3. Keputusan yang masih terbuka

### 3.1 Profil mahasiswa

- Apakah profil termasuk MVP (`OD-006`)?
- Field apa yang wajib: NIM, program studi, fakultas, angkatan, nomor telepon,
  alamat, atau lainnya?
- Siapa yang boleh membuat dan mengubah profil?
- Apakah profil terpisah dari akun `users` atau menjadi kolom tambahan?

**Dampak:** tidak ada migration `student_profiles` atau perubahan tabel
`users` pada tahap ini.

### 3.2 Peminatan

- Apakah mahasiswa memilih tepat satu peminatan atau lebih dari satu
  (`FR-PREF-02`, `OD-015`)?
- Apakah pilihan dapat diubah setelah disimpan?
- Apakah peminatan disimpan per mahasiswa atau per pengajuan?
- Bagaimana pemetaan peminatan ke mitra?

**Dampak:** tabel `student_peminatan`, endpoint, dan UI sudah tersedia, tetapi
penulisan tetap ditolak (`409`) sampai mode `single`/`multiple` diisi. Label
`DTA`, `PSI`, dan `SIA` sudah tersedia di BPMN. Pemetaan peminatan ke mitra
belum diterapkan.

### 3.3 Nilai mata kuliah prasyarat

- Daftar mata kuliah prasyarat (`OD-007`, `OD-008`, Q23–Q24).
- Ambang nilai dan skala nilai.
- Sumber nilai: input manual, impor, atau integrasi akademik.
- Aturan validasi dan penanganan nilai tidak lengkap.
- Apakah nilai disimpan sebagai histori atau nilai terbaru saja.

**Dampak:** struktur `courses` dan `student_grades`, validasi teknis, API
milik-sendiri, dan UI nilai sudah tersedia. Struktur yang dipakai saat ini
adalah satu nilai terbaru per mahasiswa per mata kuliah, tanpa status
lulus/tidak lulus, karena daftar prasyarat, skala, sumber, ambang, dan aturan
histori belum ditetapkan. `config/academic.php` sengaja memuat aturan kosong;
pemeriksaan prasyarat pada rekomendasi tetap terblokir.

### 3.4 Pengajuan magang

- Daftar status dan transisi (`OD-016`).
- Jenis dokumen, syarat kelengkapan, dan alur revisi (`OD-017`).
- Batas pengajuan dan pengajuan ulang (`OD-018`, `OD-019`).
- Apakah mahasiswa boleh melamar ke beberapa mitra sekaligus.

**Dampak:** modul pengajuan dibuat sebagian dengan status `menunggu`,
`diterima`, dan `ditolak`, serta transisi `menunggu` → keputusan. Surat
penerimaan disimpan privat untuk pengajuan `diterima` dan DPM dapat ditetapkan
dari akun ber-role `dpm`. Status antara, verifikasi/revisi dokumen, reversal,
penggantian DPM, dan batas lamaran ganda tetap terbuka.

### 3.5 DPM

- Kapan dan siapa yang berwenang menetapkan DPM (`OD-023`).
- Kriteria penugasan, beban, persetujuan, dan penggantian (`OD-024`).
- Kewenangan, cakupan bimbingan, dan komunikasi DPM (`OD-025`).

**Dampak:** penempatan dasar untuk pengajuan `diterima` tersedia menggunakan
akun `users` ber-role `dpm`. Tidak ada master dosen atau akun dummy; penggantian
dan bimbingan belum diimplementasikan.

---

## 4. Implementasi yang dipilih pada tahap ini

**UI admin Mitra Magang** di frontend, terhubung ke API yang sudah ada:

- Daftar mitra dengan pagination.
- Tambah, ubah, dan hapus mitra.
- Validasi form di sisi klien dan tampilan error validasi server.
- Loading, error, empty, dan success state.
- Dialog aksesibel dengan fokus terkelola.
- Route dan menu hanya untuk role `admin`, sesuai otorisasi backend saat ini.
  Kewenangan Prodi tetap menunggu `OD-001`–`OD-003`.

Alasan pemilihan:

1. BPMN eksplisit memuat “Kelola data mitra magang (tambah/ubah/hapus)”.
2. API dan aturan validasi sudah diimplementasikan serta diuji.
3. Tidak memerlukan kriteria, bobot, status pengajuan, atau keputusan Prodi.
4. Menyelesaikan kesenjangan nyata: backend tersedia, tetapi belum ada UI
   terintegrasi.

Tahap lanjutan menambahkan modul pengajuan magang dengan hanya status dan
transisi yang eksplisit di BPMN: mahasiswa mengirim dan melihat pengajuan
sendiri, sedangkan `admin`/`prodi` melihat semua pengajuan dan mencatat
keputusan `diterima`/`ditolak` dari `menunggu`. Untuk pengajuan yang diterima,
mahasiswa dapat mengunggah/mengunduh surat penerimaan dan `admin`/`prodi` dapat
menetapkan DPM dari akun ber-role `dpm`. Format/revisi dokumen, penggantian
DPM, dan fitur di luar itu tetap terbuka.

---

## 5. Urutan pekerjaan yang disarankan

1. **Selesai:** CRUD backend dan UI admin Mitra Magang.
2. **Selesai sebagian:** struktur peminatan, endpoint profil, dan UI; keputusan
   mode/kardinalitas masih menunggu OD-015.
3. **Selesai sebagian:** master mata kuliah, pencatatan nilai milik sendiri, dan
   pemeriksaan prasyarat yang tetap terblokir. Putuskan daftar mata kuliah
   prasyarat, skala nilai, sumber data, dan aturan validasi (OD-007/OD-008).
4. **Selesai sebagian:** pengajuan magang (kirim, daftar/detail milik sendiri,
   daftar/detail admin-prodi, dan keputusan `menunggu` → `diterima`/`ditolak`),
   surat penerimaan privat, dan penempatan DPM dasar. Putuskan status antara,
   verifikasi/revisi dokumen, reversal, batas pengajuan, serta kriteria dan
   penggantian DPM (OD-016–OD-024).
5. Putuskan kriteria, bobot, benefit/cost, skala, dan normalisasi SAW
   (`docs/CRITERIA-GAP-ANALYSIS.md`).
6. Implementasikan K-Means/SAW setelah kontrak data dan aturan tersedia.

---

## 6. Status

| Item | Status |
|---|---|
| UI admin Mitra Magang | Selesai dan terverifikasi; termasuk E2E browser untuk CRUD, pagination, dan role guard |
| Profil mahasiswa | Ditunda — `OD-006` |
| Peminatan | Struktur/API/UI tersedia; penulisan menunggu mode `OD-015` |
| Nilai prasyarat | Struktur/API/UI tersedia; aturan prasyarat menunggu `OD-007`, `OD-008` |
| Pengajuan magang | Sebagian: kirim/daftar/detail dan keputusan BPMN tersedia; status antara, verifikasi/revisi dokumen, reversal, dan batas lamaran menunggu `OD-016`–`OD-021` |
| Surat penerimaan | Sebagian: unggah/unduh privat untuk pengajuan diterima; format, jumlah, dan revisi menunggu `OD-017` |
| Penempatan DPM | Sebagian: satu DPM dari akun ber-role `dpm`; kriteria, kewenangan, dan penggantian menunggu `OD-023`–`OD-024` |
| Kriteria/SAW/K-Means | Ditunda — `docs/CRITERIA-GAP-ANALYSIS.md` |
