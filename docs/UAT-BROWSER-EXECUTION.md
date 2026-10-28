# Urutan Eksekusi UAT Browser — SPK Magang

**Tanggal:** 23 Oktober 2026  
**Status:** Eksekusi browser teknis selesai pada 23 Oktober 2026 untuk 79
skenario: **78 `PASS`, 1 `FAIL`**. Sebanyak 35 baris tetap `BLOCKED`, 5
`NOT RUN`, dan 3 `N/A`; hasil belum ditandatangani pemilik produk dan bukan
pengganti UAT pengguna sebenarnya. Rincian hasil ada di §8 dan
`UAT-TEST-PLAN.md` §17.5.  
**Rencana induk:** [`UAT-TEST-PLAN.md`](UAT-TEST-PLAN.md)  
**Operasional:** [`UAT-OPERATIONAL-CHECKLIST.md`](UAT-OPERATIONAL-CHECKLIST.md)

Dokumen ini mengatur **urutan** eksekusi agar setiap skenario memakai record
yang tepat dan tidak saling merusak. Detail langkah, hasil yang diharapkan, dan
bukti per skenario tetap merujuk pada baris terkait di `UAT-TEST-PLAN.md`.

## 1. Batas dan prinsip

- UAT hanya terhadap database `spk_magang_uat` pada port `55432`, storage dan
  cache UAT, serta backend/frontend UAT.
- Jangan memakai akun, data, atau storage development.
- Jangan mengubah `.env` development.
- Jangan mengaktifkan rekomendasi.
- Jangan mengisi atau mengubah keputusan bisnis OD.
- Skenario `BLOCKED` tidak boleh diubah menjadi `PASS`; keputusan deferral harus
  merujuk OD yang tepat.
- Satu record tidak boleh dipakai untuk dua aturan yang bertentangan. Jika
  sebuah unggahan valid sudah dibuat, jangan menguji format lain pada record
  yang sama.
- UAT dianggap selesai hanya setelah eksekutor role terkait benar-benar
  menjalankan skenario, bukti tersimpan, dan pemilik produk menandatangani
  hasil/deferral.

## 2. Prasyarat dan pemetaan data

### 2.1 Lingkungan

Gunakan checklist §4, §7, dan §9 untuk:

1. memastikan container UAT sehat dan database target `spk_magang_uat`;
2. memuat environment UAT tanpa mencetak secret;
3. menjalankan backend pada `127.0.0.1:8020`;
4. menjalankan frontend pada `127.0.0.1:5182`;
5. memastikan `RECOMMENDATION_ENABLED=false`.

Root aktif adalah
`/home/kunimiwai/.local/share/spk-magang-uat`. Container sudah memakai secret
dari root ini; root `/tmp/opencode/spk-magang-uat` hanya rollback. Gunakan root
persisten untuk sesi UAT.

```sh
export UAT_PERSIST=/home/kunimiwai/.local/share/spk-magang-uat
export UAT_ROOT="$UAT_PERSIST"
```

### 2.2 Akun dan mitra

Kredensial hanya dibaca dari file lokal mode `0600`; jangan menempelkan password
ke dokumen ini, screenshot, tiket, atau chat.

| Kode | Role | Penggunaan utama |
|---|---|---|
| `UAT-ADM-01` | `admin` | Empty state, mitra, komunikasi, keputusan, DPM, unduh surat |
| `UAT-PRD-01` | `prodi` | Daftar/detail, komunikasi, keputusan, unduh surat, batas akses |
| `UAT-MHS-01` | `mahasiswa` | Pengajuan utama, diterima, PDF valid, DPM |
| `UAT-MHS-02` | `mahasiswa` | Pengajuan kedua, ditolak, isolasi data |
| `UAT-MHS-03` | `mahasiswa` | Opsional: keputusan tanpa komunikasi dan format surat tambahan |
| `UAT-MHS-04` | `mahasiswa` | Opsional: format surat tambahan dan rate-limit login |
| `UAT-DPM-01` | `dpm` | DPM yang ditugaskan ke `UAT-MHS-01` |
| `UAT-DPM-02` | `dpm` | DPM tanpa penugasan untuk uji isolasi |

| Kode mitra | Nama tampilan | Penggunaan |
|---|---|---|
| `UAT-MITRA-01` | `UAT Mitra Alpha` | Pengajuan utama `UAT-MHS-01` |
| `UAT-MITRA-02` | `UAT Mitra Beta` | Pengajuan `UAT-MHS-02` |
| `UAT-MITRA-03` | `UAT Mitra Gamma` | Opsional: pengajuan tambahan/format surat |

Data awal saat dokumen ini dibuat: 8 akun, 3 mitra, 0 pengajuan, 0 komunikasi,
0 surat, dan 0 penempatan. Jangan membuat pengajuan melalui database atau
seeder; pengajuan harus dibuat melalui UI/API oleh akun mahasiswa yang diuji.

## 3. Aturan bukti minimum

Setiap skenario wajib memiliki folder sendiri:

```text
$UAT_PERSIST/evidence/browser/<tanggal>/<SCENARIO-ID>/
```

Isi minimum:

| Artefak | Ketentuan |
|---|---|
| `notes.md` | ID skenario, eksekutor, role/akun, waktu, browser, langkah, hasil yang diharapkan vs aktual, ID record, status, defect |
| `before.png` / `after.png` | Screenshot keadaan sebelum dan sesudah aksi; boleh lebih dari dua |
| `network.txt` atau `network.har` | Request/response relevan; **token Bearer, cookie, password, dan header sensitif disunting** |
| `record-ids.txt` | ID pengajuan/mitra/surat/penempatan yang diuji, bukan data development |
| `console.txt` | Wajib untuk skenario UI; tidak ada exception JavaScript tak tertangani |
| `result.txt` | Satu baris status aktual: `NOT RUN`, `PASS`, `FAIL`, `PARTIAL`, atau `BLOCKED` |
| `blocked.md` | Wajib untuk `BLOCKED`; cantumkan OD dan dasar deferral |

Aturan redaksi:

- Jangan menyimpan password, token, cookie, `.env`, database dump, APP_KEY,
  kredensial database, atau dokumen pribadi nyata.
- Data UAT sintetis tetap diminimalkan; jangan menampilkan seluruh isi
  kredensial di layar saat screenshot.
- Bukti `FAIL` harus menyertakan defect ID dan langkah reproduksi.
- Bukti `BLOCKED` tidak boleh berisi klaim hasil yang tidak dijalankan.

Kolom **Bukti** pada setiap baris `UAT-TEST-PLAN.md` adalah minimum spesifik
skenario. Tabel fase di bawah menambahkan bukti dependensi/urutan.

## 4. Urutan eksekusi

### Fase 0 — Preflight operator

**Pelaksana:** operator teknis, bukan pengguna UAT.

**Prasyarat:** container UAT dan development sudah diperiksa read-only.

**Aksi:**

1. Verifikasi target database, port, storage, cache, APP_KEY, dan rekomendasi
   nonaktif.
2. Catat jumlah akun, mitra, dan transaksi; jangan mereset data yang sudah ada.
   Sesi baru harus memakai record UAT yang tersedia atau record tambahan yang
   disetujui, bukan `migrate:fresh`/truncate.
3. Pastikan file kredensial ada, mode `0600`, dan tidak berada di repository.
4. Jalankan backend/frontend UAT; catat versi browser Chrome.
5. Siapkan folder bukti dan fixture surat UAT (PDF/JPEG/PNG) yang bukan dokumen
   pribadi.

**Bukti:** output verifikasi target, jumlah data, status server, versi browser,
dan daftar fixture. Jangan menampilkan secret.

**Status skenario:** tidak ada skenario UAT yang berubah.

### Fase 1 — Autentikasi dan navigasi lintas role

**Pelaksana:** Admin, Prodi, Mahasiswa, DPM, didampingi operator.

**Skenario:** `UAT-AUTH-01`–`UAT-AUTH-08`.

**Urutan/dependensi:**

1. `UAT-AUTH-01` login tiap role.
2. `UAT-AUTH-02` kredensial salah.
3. `UAT-AUTH-03` rate limit; gunakan `UAT-MHS-04` dengan password salah enam
   kali, catat 429, tunggu satu menit, lalu login valid.
4. `UAT-AUTH-04` logout.
5. `UAT-AUTH-05` dan `UAT-AUTH-06` redirect tujuan lama.
6. `UAT-AUTH-07` akses route role lain.
7. `UAT-AUTH-08` sesi/token tidak valid.

**Bukti tambahan:** payload `POST /api/auth/login` dan `GET /api/auth/me` yang
sudah disunting; URL akhir; screenshot layar akses ditolak; response 401/429;
status token setelah logout.

**Jangan:** memakai akun development atau menyalin token asli ke bukti.

### Fase 2 — Empty state dan baseline

**Pelaksana:** Admin, Prodi, Mahasiswa, DPM.

**Skenario:** `UAT-ADM-01`, `UAT-ADM-02`, `UAT-MHS-01`, `UAT-DPM-01`,
`UAT-PRD-01`, `UAT-PRD-02`, `UAT-UI-03`.

**Urutan/dependensi:**

1. Sebelum ada pengajuan, jalankan empty state Admin, Mahasiswa 01, DPM 01.
2. Admin membuat `UAT Mitra Delta`, mengubahnya, lalu menghapusnya. Jangan
   menghapus `UAT-MITRA-01`–`03`.
3. Prodi memeriksa halaman baseline dan penolakan akses `/mitra`.
4. Catat empty state yang spesifik per halaman.

**Bukti tambahan:** screenshot empty state, response CRUD mitra, daftar mitra
sebelum/sesudah, dan console.

**Catatan:** `UAT-ADM-03` (mitra yang sudah dipakai) dijalankan setelah
pengajuan `UAT-MHS-01` ada, bukan di fase ini.

### Fase 3 — Pembuatan pengajuan mahasiswa

**Pelaksana:** Mahasiswa 01 dan 02; Admin/Prodi sebagai pemeriksa.

**Skenario:** `UAT-MHS-02`–`UAT-MHS-06`, `UAT-ADM-04`, `UAT-ADM-05`,
`UAT-PRD-03`.

**Urutan/dependensi:**

1. `UAT-MHS-02`: `UAT-MHS-01` membuat pengajuan ke `UAT Mitra Alpha`.
2. `UAT-MHS-03`: validasi form tanpa mitra dan ID mitra tidak valid.
3. `UAT-MHS-02` (akun 02): buat pengajuan ke `UAT Mitra Beta`.
4. `UAT-MHS-04`: pastikan masing-masing mahasiswa hanya melihat pengajuannya.
5. `UAT-MHS-05`: Mahasiswa 02 meminta detail pengajuan Mahasiswa 01 → 404.
6. `UAT-MHS-06`: Mahasiswa 01 membuka detail status menunggu; panel surat tidak
   tersedia dan request unggah langsung → 409.
7. Admin membuka daftar/detail kedua pengajuan; Prodi membuka daftar/detail.

**Bukti tambahan:** response 201/422/404/409, ID pengajuan, screenshot daftar
dan detail, network yang membuktikan tidak ada kebocoran data.

**Jangan:** membuat lebih dari satu pengajuan dengan akun yang sama; aturan
lamaran ganda masih OD-019.

### Fase 4 — Komunikasi, keputusan, dan status akhir

**Pelaksana:** Admin, Prodi, Mahasiswa 01/02.

**Skenario inti:** `UAT-ADM-06`, `UAT-ADM-07`, `UAT-ADM-08`, `UAT-ADM-09`,
`UAT-ADM-10`, `UAT-PRD-04`, `UAT-PRD-05`, `UAT-FLOW-03`, `UAT-FLOW-04`,
`UAT-MHS-07`, `UAT-MHS-11`, `UAT-MHS-12`, `UAT-MHS-15`.

**Urutan/dependensi:**

1. Admin mencatat komunikasi outbound pada `UAT-MHS-01` yang masih `menunggu`.
2. Admin mencatat komunikasi inbound; status tetap `menunggu`.
3. `UAT-ADM-08`: kirim form kosong, arah/kanal tidak valid, ringkasan >2000
   karakter; tidak ada record baru.
4. `UAT-ADM-09`: Admin menerima `UAT-MHS-01`; catat reviewer/waktu/catatan.
5. `UAT-ADM-10`: keputusan kedua melalui UI/request langsung → 409.
6. Prodi mencatat komunikasi setelah keputusan pada `UAT-MHS-01`
   (`UAT-PRD-04`, `UAT-FLOW-03`); status/reviewer/waktu tidak berubah.
7. Prodi menolak `UAT-MHS-02` (`UAT-PRD-05`, `UAT-FLOW-04`).
8. Mahasiswa 01 melihat status diterima (`UAT-MHS-07`); Mahasiswa 02 melihat
   penolakan (`UAT-MHS-11`); Mahasiswa 01 membuka rekomendasi nonaktif
   (`UAT-MHS-12`); Mahasiswa 01 memastikan riwayat komunikasi internal tidak
   tampil (`UAT-MHS-15`).
9. `UAT-ADM-11` (keputusan ditolak oleh Admin) memerlukan record terpisah.
   Jangan memakai `UAT-MHS-02` jika `UAT-PRD-05` sudah dijalankan. Gunakan
   pengajuan opsional `UAT-MHS-04`/`UAT-MHS-03` hanya jika skenario opsional
   diaktifkan; jika tidak, biarkan `NOT RUN`.
10. `UAT-FLOW-02` (keputusan tanpa komunikasi) memerlukan pengajuan terpisah;
    gunakan `UAT-MHS-03` ke `UAT Mitra Gamma` pada fase opsional, bukan record
    utama.

**Bukti tambahan:** response 201/409, screenshot status sebelum/sesudah,
query read-only yang menunjukkan `status`, `reviewed_by`, `reviewed_at`, dan
jumlah komunikasi; bukti bahwa komunikasi tidak mengubah status.

### Fase 5 — Surat penerimaan dan validasi unggahan

**Pelaksana:** Mahasiswa 01/02/03/04, Admin, Prodi.

**Skenario inti:** `UAT-MHS-08`, `UAT-MHS-09`, `UAT-MHS-10`, `UAT-ADM-14`,
`UAT-PRD-06`, `UAT-UPL-01`, `UAT-UPL-04`–`UAT-UPL-08`,
`UAT-UPL-10`–`UAT-UPL-14`.

**Urutan/dependensi:**

1. Sebelum unggahan valid pada `UAT-MHS-01`, jalankan validasi tanpa berkas,
   terlalu besar, tipe tidak didukung, teks bernama `.pdf`, dan PDF bernama
   `.php`.
2. `UAT-MHS-08` + `UAT-UPL-01`: unggah PDF valid pada `UAT-MHS-01`.
3. `UAT-MHS-09`: unduh surat sendiri.
4. `UAT-ADM-14` dan `UAT-PRD-06`: Admin/Prodi mengunduh surat.
5. `UAT-MHS-10` + `UAT-UPL-12`: unggah ulang → 409; surat lama tetap.
6. `UAT-UPL-10`: unggah ke pengajuan `UAT-MHS-02` yang ditolak → 409.
7. `UAT-UPL-11`: Mahasiswa 02 mencoba unggah ke `UAT-MHS-01` → 404.
8. `UAT-UPL-13`: DPM tidak dapat mengunduh/mengunggah; Admin/Prodi hanya
   mengunduh.
9. `UAT-UPL-14`: periksa allowlist/limit di UI dan response
   `GET /api/mahasiswa/acceptance-letter/limit`.
10. Opsional format lain: `UAT-UPL-09` pada `UAT-MHS-03` (PDF bernama `.jpg`),
    `UAT-UPL-02` atau `UAT-UPL-03` pada `UAT-MHS-04`. Satu record hanya untuk
    satu unggahan valid; jangan menguji dua format pada record yang sama.
    `UAT-UPL-03` memerlukan fixture/akun tambahan yang disetujui jika
    `UAT-MHS-04` sudah dipakai untuk JPEG.
11. `UAT-UPL-15` tetap `N/A` (teknis; sudah tercakup test otomatis), bukan
    `PASS` UAT pengguna.

**Bukti tambahan:** response 201/422/409/404, metadata `mime_type` dan
`original_name`, file unduhan, screenshot UI, dan bukti path privat tidak
diekspos. Jangan menyimpan berkas surat asli yang berisi data pribadi.

### Fase 6 — Penempatan dan akses DPM

**Pelaksana:** Admin, DPM 01, DPM 02.

**Skenario:** `UAT-ADM-12`, `UAT-ADM-13`, `UAT-FLOW-06`, `UAT-DPM-02`–
`UAT-DPM-08`, `UAT-ISO-02`, `UAT-ISO-04`.

**Urutan/dependensi:**

1. Admin menetapkan `UAT-DPM-01` ke `UAT-MHS-01` (`UAT-ADM-12`).
2. `UAT-FLOW-06`: coba DPM kedua → 409; penempatan pertama tetap.
3. DPM 01 melihat hanya `UAT-MHS-01` (`UAT-DPM-02`), membuka detail
   (`UAT-DPM-04`), dan memastikan catatan review/komunikasi/unduh surat tidak
   tampil (`UAT-DPM-05`).
4. DPM 02 melihat daftar kosong dan detail `UAT-MHS-01` → 404
   (`UAT-DPM-03`, `UAT-ISO-02`).
5. Uji ID invalid/ID milik DPM lain dan perubahan ID tanpa unmount
   (`UAT-DPM-06`, `UAT-DPM-07`).
6. DPM membuka route Admin/Mahasiswa (`UAT-DPM-08`, `UAT-ISO-04`).
7. `UAT-ADM-13`: penetapan DPM pada pengajuan `menunggu`/`ditolak` → 409.
8. `UAT-DPM-09` tetap `BLOCKED` (OD-024–OD-026).

**Bukti tambahan:** response 201/409/404/403, screenshot daftar/detail, dan
response JSON tanpa field internal.

### Fase 7 — Isolasi lintas peran dan keamanan data

**Pelaksana:** semua role, didampingi operator.

**Skenario:** `UAT-ISO-01`, `UAT-ISO-03`, `UAT-ISO-04`, `UAT-ISO-05`,
`UAT-ISO-07`, `UAT-ADM-15`, `UAT-ADM-16`, `UAT-ADM-17`.

**Urutan/dependensi:**

1. Bandingkan daftar/detail/unduhan Mahasiswa 01 vs 02.
2. Mahasiswa mencoba endpoint Admin/Prodi; DPM mencoba endpoint Admin/unduh.
3. Coba akses path storage langsung/URL publik → 404/403; jangan menebak path
   privat dari response.
4. Admin membuka ID tidak valid dan berpindah ID tanpa unmount; uji respons
   terlambat dengan DevTools throttling.
5. `UAT-ISO-07`: query read-only memastikan semua record UAT berawalan `UAT-`
   dan tidak ada record development.
6. `UAT-ISO-06` tetap `N/A (D-003)`; bukan hasil UAT.

**Bukti tambahan:** response 401/403/404, screenshot, network timing, dan
daftar record UAT. Jangan menampilkan token/cookie.

### Fase 8 — Kualitas UI dasar

**Pelaksana:** perwakilan tiap role + observer.

**Skenario:** `UAT-UI-01`, `UAT-UI-02`, `UAT-UI-04`, `UAT-UI-05`, `UAT-UI-06`.

**Urutan/dependensi:**

1. Loading state dengan throttling.
2. Error state dengan backend tidak tersedia/route invalid; pulihkan backend
   setelah skenario.
3. Responsif 320×568 dan 390×844.
4. Navigasi keyboard, label, dan pesan error.
5. Console bersih selama alur utama.

**Bukti tambahan:** screenshot per viewport, fokus keyboard, console log, dan
catatan browser. Jangan mengubah konfigurasi server hanya agar skenario lulus.

### Fase 9 — BLOCKED dan serah terima

**Pelaksana:** pemilik produk/observer, bukan menandai PASS.

**Skenario:** `UAT-PRD-07`, `UAT-MHS-13`, `UAT-MHS-14`, `UAT-DPM-09`,
`UAT-FLOW-07`, `UAT-ISO-06`, `UAT-UPL-15`, serta `UAT-BLK-01`–`UAT-BLK-31`.

**Tindakan:**

1. Konfirmasi bahwa setiap baris masih `BLOCKED`/`N/A` dan merujuk OD yang
   benar.
2. Catat deferral resmi dari pemilik produk; jangan mengisi hasil aktual
   seolah-olah sudah diuji.
3. `UAT-BLK-31` dan `UAT-ISO-06` tetap `N/A (D-003)`; bukan `PASS`.
4. Rekap status `NOT RUN`/`PASS`/`FAIL`/`BLOCKED`, defect terbuka, dan bukti.
5. Minta tanda tangan/persetujuan pemilik produk.

## 5. Ringkasan dependensi kritis

| Dependensi | Harus selesai sebelum |
|---|---|
| `UAT-MHS-01` membuat pengajuan Alpha | Komunikasi/keputusan Admin, surat, DPM |
| `UAT-MHS-02` membuat pengajuan Beta | Uji isolasi mahasiswa, penolakan Prodi |
| Admin menerima `UAT-MHS-01` | Unggah surat, unduh Admin/Prodi, DPM |
| Prodi menolak `UAT-MHS-02` | `UAT-MHS-11`, `UAT-FLOW-04`, uji surat 409 |
| Surat `UAT-MHS-01` ada | `UAT-ADM-14`, `UAT-PRD-06`, `UAT-DPM-05` |
| DPM 01 ditetapkan | `UAT-DPM-02`–`UAT-DPM-08`, `UAT-ISO-02` |
| Dua pengajuan ada | `UAT-ADM-04`, `UAT-ADM-16`, `UAT-ADM-17` |

## 6. Kondisi berhenti

Hentikan sesi UAT dan laporkan jika:

- `current_database()` bukan `spk_magang_uat` atau port bukan `55432`;
- data development muncul di UI/API;
- rekomendasi aktif atau ranking resmi ditampilkan;
- password/token/secret terlihat di screenshot, log, atau network evidence;
- skenario `BLOCKED` hendak ditandai `PASS` tanpa keputusan OD;
- terjadi kehilangan data, error 500 berulang, atau akses lintas role yang
  membocorkan data;
- container/database UAT berhenti dan tidak dapat dipulihkan tanpa tindakan
  destruktif.

## 7. Status saat ini

- Eksekusi browser teknis 23 Oktober 2026: 79 skenario dijalankan; 78 `PASS`,
  1 `FAIL` (`UAT-ADM-03`, defect `UAT-DEF-01`). Defect tersebut sudah diperbaiki
  di kode dan dilindungi regression test pada 23 Oktober 2026; retest browser
  belum dijalankan sehingga status skenario belum diubah menjadi `PASS`.
- 5 `NOT RUN`: `UAT-ADM-11`, `UAT-FLOW-02`, `UAT-UPL-02`, `UAT-UPL-03`,
  `UAT-UPL-09`.
- 35 baris `BLOCKED` dan 3 `N/A` dipertahankan; tidak ada yang diubah menjadi
  `PASS`.
- Data UAT saat ini berisi 8 akun, 3 mitra, 2 pengajuan, 3 komunikasi, 1 surat,
  dan 1 penempatan DPM.
- Smoke test PostgreSQL, PHPUnit, Vitest, unit Node, ESLint, dan build adalah
  bukti teknis pendamping, bukan UAT pengguna.

## 8. Hasil eksekusi

| Kelompok | PASS | FAIL |
|---|---:|---:|
| AUTH | 8 | 0 |
| ADM | 15 | 1 |
| PRD | 6 | 0 |
| MHS | 13 | 0 |
| DPM | 8 | 0 |
| ISO | 6 | 0 |
| UPL | 11 | 0 |
| FLOW | 5 | 0 |
| UI | 6 | 0 |
| **Total** | **78** | **1** |

Bukti per skenario berada di
`/home/kunimiwai/.local/share/spk-magang-uat/evidence/browser/2026-10-23/<SCENARIO-ID>/`.
Setiap folder memuat `notes.md`, `result.txt`, screenshot, `network.txt`,
`console.txt`, dan `record-ids.txt` bila relevan. Token, password, cookie, dan
header otorisasi tidak disimpan. `UAT-ISO-05` dan `UAT-ISO-07` memakai
pemeriksaan API/storage/database read-only sesuai rancangan skenario.

Defect `UAT-DEF-01`: backend sudah menolak penghapusan mitra yang dipakai
dengan 409, tetapi UI menampilkan pesan fallback generik. Perbaikan kini
menampilkan pesan `message` dari respons backend dan regression test frontend
telah ditambahkan. Bukti dan langkah reproduksi awal ada di
`UAT-TEST-PLAN.md` §16.1 dan folder `UAT-ADM-03`.

Eksekusi ini belum menjadi acceptance final: retest browser defect belum
dijalankan, lima skenario belum dijalankan, deferral `BLOCKED` belum disetujui,
dan tanda tangan pemilik produk belum ada.
