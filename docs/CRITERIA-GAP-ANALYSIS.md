# Gap Analysis — Modul Kriteria Penilaian SPK Magang

**Tanggal:** 20 Oktober 2026 (diperbarui 21 Oktober 2026)
**Status:** Audit selesai. Struktur, API, dan UI kriteria serta nilai mitra sudah tersedia; **data kriteria/bobot resmi tetap NO-GO** sampai OD-012–OD-015 disetujui.
**Ruang lingkup:** master kriteria penilaian SAW di backend. Tidak mencakup algoritma SAW/K-Means, nilai mitra, mahasiswa, pengajuan, atau frontend.
**Status terkini:** lihat `docs/REQUIREMENTS-TRACEABILITY.md` §19–§21.

---

## 1. Kesimpulan

Dokumentasi hanya menetapkan bahwa **Admin/Prodi mengelola kriteria dan bobot SAW**
(BPMN; `FR-MIT-02`). Dokumentasi **tidak menetapkan** daftar kriteria, bobot,
jenis benefit/cost, skala nilai, normalisasi, atau aturan penerapan kriteria.

Karena itu, migration dan API kriteria **tidak dibuat** pada task ini. Membuat
skema final sekarang berarti mengarang keputusan bisnis yang secara eksplisit
masih berstatus terbuka (`OD-012`, `OD-013`, `OD-015`).

---

## 2. Sumber yang diaudit

- `docs/bpmn/BPMN.pdf`
- `docs/BPMN-ANALYSIS.md`
- `docs/PRD.md`
- `docs/REQUIREMENTS-TRACEABILITY.md`
- `docs/ARCHITECTURE.md`
- `README.md` dan `backend/README.md`
- Implementasi Mitra Magang: model, migration, form request, controller, route,
  dan feature test.

---

## 3. Ketentuan yang sudah ditetapkan

| Sumber | Ketentuan | Status keputusan |
|---|---|---|
| BPMN, lane Admin/Prodi | Ada aktivitas **“Kelola kriteria dan bobot SAW”** | Aktivitasnya sesuai BPMN; aturan detail belum diputuskan |
| `FR-MIT-02` | Admin/Prodi mengelola kriteria dan bobot SAW | BPMN **SESUAI**; keputusan **BELUM DIPUTUSKAN** |
| `FR-ALG-03` | SAW dipakai untuk perangkingan | BPMN **SESUAI**; detail algoritma **BELUM DIPUTUSKAN** |
| `FR-ALG-06` | Kriteria, bobot, benefit/cost, dan normalisasi SAW | **BELUM TERCANTUM DI BPMN**; perlu konfirmasi |
| `D-001` | Admin dan Prodi adalah role terpisah | **DIKONFIRMASI**; kewenangan masing-masing masih terbuka |
| `D-004` | MVP memprioritaskan alur BPMN | **DIKONFIRMASI**; daftar fitur final tetap terbuka |

Yang dapat disimpulkan secara aman:

1. Modul kriteria adalah master data pendukung SAW, bukan algoritma SAW itu sendiri.
2. Data kriteria perlu menyimpan **nama** dan **bobot** karena keduanya disebut BPMN.
3. Pengelolaan berada pada lane Admin/Prodi, tetapi pembagian hak akses belum jelas.
4. Kriteria harus dapat dipakai oleh proses perangkingan pada tahap berikutnya.

---

## 4. Keputusan yang masih terbuka

| ID terkait | Pertanyaan yang belum terjawab | Dampak pada skema/API |
|---|---|---|
| `OD-012`, Q14 | Apa daftar kriteria resmi SAW? | Menentukan jumlah dan isi data awal; tidak boleh dikarang |
| `OD-012`, Q15 | Berapa bobot setiap kriteria dan siapa yang menetapkan? | Menentukan validasi bobot dan aturan total bobot |
| `OD-013`, Q16 | Kriteria mana benefit dan mana cost? | Menentukan enum `type` dan rumus normalisasi |
| `OD-013`, Q17 | Skala penilaian, normalisasi, dan nilai kosong | Menentukan `scale_min`/`scale_max`, validasi nilai, dan perilaku data kosong |
| `OD-015`, Q18–Q19 | Apakah kriteria berbeda per peminatan DTA/PSI/SIA? | Menentukan relasi kriteria–peminatan dan multi-peminatan |
| `OD-001`–`OD-003`, Q1–Q2, Q10 | Apakah Admin, Prodi, atau keduanya boleh mengelola kriteria? | Menentukan middleware/otorisasi endpoint |
| `OD-027`, Q53 | Apakah perubahan bobot perlu audit trail/versioning? | Menentukan histori, status aktif, dan larangan perubahan setelah dipakai |
| `FR-MIT-03`, `OD-009`, `OD-012` | Dari mana nilai kriteria untuk setiap mitra diperoleh? | Menentukan apakah perlu tabel nilai mitra; master kriteria saja tidak cukup untuk SAW |
| Tidak tercantum | Apakah nama kriteria unik? Apakah ada kode/urutan tampilan? | Menentukan unique constraint dan kolom tambahan |
| Tidak tercantum | Apakah bobot disimpan 0–1 atau 0–100? Harus berjumlah 1/100? | Menentukan tipe presisi dan validasi total bobot |
| Tidak tercantum | Apakah kriteria dapat dinonaktifkan atau dihapus setelah dipakai? | Menentukan soft delete/status dan aturan referensi |

---

## 5. Audit implementasi Mitra Magang

Audit dilakukan tanpa mengubah kode Mitra.

| Aspek | Temuan |
|---|---|
| Endpoint | 5 endpoint CRUD `/api/admin/partners` tersedia |
| Autentikasi | Dilindungi `auth:sanctum`; tanpa token menghasilkan `401` |
| Otorisasi | Middleware `role:admin`; role lain menghasilkan `403` |
| Validasi | `name` wajib; `email` nullable dan harus valid; panjang field dibatasi |
| Route model binding | `{partner}` menghasilkan `404` untuk ID yang tidak ada |
| Pagination | `per_page` default 15, dibatasi 1–100 |
| Migration | `2026_10_20_181159_create_partners_table` berstatus **Ran** (batch 4) |
| Tes | `PartnerTest` mencakup CRUD, validasi, 401, 403, dan 404 |
| Bug terkait kriteria | Tidak ditemukan bug yang menghalangi modul kriteria |

Catatan minor: field `contact` masih berupa satu string sehingga belum jelas
apakah mewakili kontak person atau nomor telepon. Ini bukan bug fungsional dan
tidak diubah karena berada di luar task.

---

## 6. Usulan desain minimum — belum diimplementasikan

Usulan ini adalah bahan keputusan, bukan skema final.

### 6.1 Tabel `criteria` (draft)

| Kolom | Tipe usulan | Alasan |
|---|---|---|
| `id` | bigint primary key | Identitas |
| `name` | varchar(255) | Nama kriteria; wajib |
| `description` | text nullable | Penjelasan kriteria |
| `type` | enum `benefit`/`cost` | Dibutuhkan SAW; nilai enum final menunggu `OD-013` |
| `weight` | decimal(8,4) | Bobot; skala dan total menunggu `OD-012` |
| `scale_min` | decimal(8,2) nullable | Batas bawah nilai; menunggu `OD-013` |
| `scale_max` | decimal(8,2) nullable | Batas atas nilai; menunggu `OD-013` |
| `is_active` | boolean default true | Menonaktifkan tanpa menghapus; perilaku menunggu konfirmasi |
| `sort_order` | unsigned integer default 0 | Urutan tampilan; opsional |
| `created_at`, `updated_at` | timestamp | Audit dasar |

Constraint yang perlu diputuskan sebelum migration:

- apakah `name` harus unik;
- apakah bobot harus berada pada rentang 0–1 atau 0–100;
- apakah total bobot wajib sama dengan 1 atau 100;
- apakah `scale_min < scale_max`;
- apakah kriteria dengan `is_active = false` boleh diubah/dihapus;
- apakah perubahan bobot perlu versioning.

### 6.2 Kebutuhan data di luar master kriteria

Master kriteria saja tidak cukup untuk SAW. Diperlukan keputusan tentang tabel
nilai/score mitra per kriteria (`FR-MIT-03`, `OD-009`), termasuk:

- sumber nilai: input Admin/Prodi, impor, atau perhitungan lain;
- skala nilai mentah;
- penanganan nilai kosong;
- apakah nilai historis disimpan;
- relasi ke peminatan bila kriteria berbeda per peminatan.

### 6.3 Endpoint usulan

```text
GET    /api/admin/criteria
POST   /api/admin/criteria
GET    /api/admin/criteria/{criterion}
PUT    /api/admin/criteria/{criterion}
PATCH  /api/admin/criteria/{criterion}
DELETE /api/admin/criteria/{criterion}
```

- Gunakan `auth:sanctum`.
- Role mengikuti keputusan `OD-001`–`OD-003`; jangan mengunci hanya `admin`
  sebelum kewenangan Prodi ditetapkan.
- Daftar memakai pagination.
- Respons mengikuti pola `success`, `message`, `data`, dan `meta`.
- Validasi bobot/rentang/total mengikuti keputusan yang disetujui.

### 6.4 Pengujian yang disiapkan setelah keputusan

- CRUD oleh role yang berwenang.
- Validasi nama, tipe, bobot, rentang nilai, dan total bobot.
- `401` tanpa autentikasi.
- `403` untuk role tanpa izin.
- `404` untuk resource yang tidak ditemukan.
- Pagination dan urutan data.
- Penolakan perubahan yang melanggar aturan versioning/status, bila ditetapkan.

---

## 7. Keputusan yang perlu disetujui sebelum implementasi

1. Daftar kriteria resmi dan bobot awalnya.
2. Jenis setiap kriteria: benefit atau cost.
3. Skala nilai mentah dan rentang valid.
4. Apakah bobot memakai skala 0–1 atau 0–100 dan apakah wajib berjumlah tetap.
5. Rumus normalisasi serta perilaku nilai kosong/nol.
6. Apakah kriteria global atau berbeda per peminatan.
7. Role yang boleh melihat dan mengubah kriteria.
8. Aturan perubahan bobot setelah kriteria dipakai (versioning/audit).
9. Sumber nilai kriteria untuk setiap mitra.
10. Aturan nonaktif/hapus kriteria yang sudah direferensikan.

Jika keputusan 1–5 belum ada, migration dan API tidak boleh dibuat karena akan
mengunci skema dan validasi yang tidak dapat dipertanggungjawabkan.

---

## 8. Status implementasi

| Item | Status |
|---|---|
| Audit dokumen | Selesai |
| Audit Mitra Magang | Selesai; tidak ada bug terkait |
| Migration kriteria | Tersedia (`criteria`, `criterion_scores`); bukan data resmi |
| Model/Form Request/Controller/Route kriteria | Tersedia untuk `admin`/`prodi`; kewenangan rinci menunggu OD-001–OD-003 |
| Feature test kriteria | Tersedia (CRUD, validasi, otorisasi, unique, cascade) |
| Algoritma SAW/K-Means | Fungsi generik dan integrasi teknis tersedia; parameter bisnis belum |
| Data kriteria/bobot resmi | **NO-GO** sampai keputusan pada Bagian 7 disetujui |
| Kesimpulan | Struktur boleh ada; **ranking produksi tetap nonaktif** sampai OD-007–OD-015 disetujui dan `RECOMMENDATION_ENABLED` diaktifkan secara eksplisit |
