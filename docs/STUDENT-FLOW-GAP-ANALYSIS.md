# Gap Analysis — Alur Mahasiswa SPK Magang

**Tanggal:** 20 Oktober 2026
**Status:** Sebagian alur belum dapat diimplementasikan karena keputusan produk masih terbuka.
**Konteks:** Lanjutan dari `docs/CRITERIA-GAP-ANALYSIS.md` dan implementasi admin Mitra Magang.

---

## 1. Ringkasan

BPMN menempatkan mahasiswa pada alur login, pilih peminatan, input nilai mata
kuliah prasyarat, melihat ranking, memilih mitra, dan mengajukan magang.
Dokumentasi hanya menetapkan **label peminatan** dan **aktivitas input nilai**;
detail data, validasi, penyimpanan, status, dan aturan pengajuan belum
ditetapkan.

Pekerjaan yang aman dan sudah diselesaikan pada tahap ini adalah **UI
manajemen Mitra Magang untuk admin**, karena aturan CRUD dan kontrak API-nya
sudah ada. Fitur mahasiswa yang membutuhkan skema atau aturan baru tidak
dipaksakan.

---

## 2. Audit alur mahasiswa

| Langkah BPMN | Status dokumentasi | Status implementasi | Dapat diimplementasikan sekarang? |
|---|---|---|---|
| Login mahasiswa | `FR-AUTH-01` sesuai BPMN; autentikasi teknis sudah ada | Login frontend/backend tersedia | Sudah tersedia |
| Profil mahasiswa | Tidak ada di BPMN; `OD-006` belum diputuskan | Profil teknis hanya menampilkan nama, email, ID, role | Tidak; field profil belum ditetapkan |
| Pilih peminatan DTA/PSI/SIA | Label peminatan eksplisit; penyimpanan, perubahan, multi-peminatan, dan pemetaan ke mitra terbuka (`OD-015`) | Belum ada | Belum; perlu keputusan model data |
| Input nilai mata kuliah prasyarat | Aktivitas eksplisit; daftar mata kuliah, ambang nilai, sumber nilai, dan validasi terbuka (`OD-007`, `OD-008`) | Belum ada | Tidak; skema nilai belum ditetapkan |
| Melihat rekomendasi/ranking | `FR-ALG-04`; kriteria, bobot, dan algoritma belum ditetapkan (`OD-009`–`OD-015`) | Belum ada | Tidak; terblokir audit kriteria |
| Memilih perusahaan dan mengajukan magang | Aktivitas eksplisit; status, dokumen, batas pengajuan, dan alur revisi terbuka (`OD-016`–`OD-019`) | Belum ada | Tidak; state machine belum ditetapkan |
| Menunggu hasil dan melihat rekomendasi lain | Alur eksplisit; aturan pengajuan ulang terbuka (`OD-018`) | Belum ada | Tidak |

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

**Dampak:** endpoint pilihan peminatan belum dibuat karena aturan persistensi
dan kardinalitas belum ditetapkan. Label `DTA`, `PSI`, dan `SIA` sudah tersedia
di BPMN dan dapat dipakai setelah keputusan di atas disetujui.

### 3.3 Nilai mata kuliah prasyarat

- Daftar mata kuliah prasyarat (`OD-007`, `OD-008`, Q23–Q24).
- Ambang nilai dan skala nilai.
- Sumber nilai: input manual, impor, atau integrasi akademik.
- Aturan validasi dan penanganan nilai tidak lengkap.
- Apakah nilai disimpan sebagai histori atau nilai terbaru saja.

**Dampak:** tidak ada migration nilai atau validasi nilai pada tahap ini.

### 3.4 Pengajuan magang

- Daftar status dan transisi (`OD-016`).
- Jenis dokumen, syarat kelengkapan, dan alur revisi (`OD-017`).
- Batas pengajuan dan pengajuan ulang (`OD-018`, `OD-019`).
- Apakah mahasiswa boleh melamar ke beberapa mitra sekaligus.

**Dampak:** modul pengajuan belum dibuat.

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

---

## 5. Urutan pekerjaan yang disarankan

1. **Selesai:** CRUD backend dan UI admin Mitra Magang.
2. Putuskan model profil dan peminatan mahasiswa, lalu implementasikan
   penyimpanan serta validasinya.
3. Putuskan daftar mata kuliah prasyarat, skala nilai, sumber data, dan aturan
   validasi.
4. Putuskan state machine pengajuan, dokumen, dan batas pengajuan.
5. Putuskan kriteria, bobot, benefit/cost, skala, dan normalisasi SAW
   (`docs/CRITERIA-GAP-ANALYSIS.md`).
6. Implementasikan K-Means/SAW setelah kontrak data dan aturan tersedia.

---

## 6. Status

| Item | Status |
|---|---|
| UI admin Mitra Magang | Selesai dan terverifikasi; termasuk E2E browser untuk CRUD, pagination, dan role guard |
| Profil mahasiswa | Ditunda — `OD-006` |
| Peminatan | Ditunda — `OD-015` |
| Nilai prasyarat | Ditunda — `OD-007`, `OD-008` |
| Pengajuan magang | Ditunda — `OD-016`–`OD-019` |
| Kriteria/SAW/K-Means | Ditunda — `docs/CRITERIA-GAP-ANALYSIS.md` |
