# Analisis BPMN — SPK Rekomendasi Tempat Magang

**Sumber:** `docs/bpmn/BPMN.pdf`  
**Judul dokumen:** BPMN Proses Bisnis SPK Rekomendasi Tempat Magang Berdasarkan Peminatan  
**Studi kasus:** Mahasiswa Sistem Informasi UIN Raden Fatah Palembang  
**Jumlah halaman:** 1  
**Status analisis:** Dokumen terbaca dan dianalisis dari PDF. Tidak ada file BPMN XML/source terpisah.  
**Catatan sinkronisasi:** Perbandingan di Bagian 8 merujuk pada PRD v0.1. PRD v0.2 telah disinkronkan dengan BPMN; bagian perbandingan dipertahankan sebagai catatan historis.

---

## 1. Ringkasan

BPMN menggambarkan satu proses rekomendasi tempat magang berbasis peminatan dengan lima lane:

1. **Mahasiswa**
2. **Sistem SPK (Website)**
3. **Admin / Prodi**
4. **Mitra Magang (Eksternal)**
5. **Dosen Pembimbing Magang (DPM)**

Alur besarnya:

1. Admin/Prodi menyiapkan data mitra serta kriteria dan bobot SAW.
2. Mahasiswa login, memilih peminatan, dan menginput nilai mata kuliah prasyarat.
3. Sistem memvalidasi data, menjalankan K-Means untuk pengelompokan mitra, memfilter mitra sesuai peminatan, menghitung SAW, lalu menampilkan ranking rekomendasi.
4. Mahasiswa memilih perusahaan, mengajukan magang, dan menunggu hasil seleksi mitra.
5. Admin memeriksa pengajuan, memverifikasi dokumen, lalu meneruskannya ke mitra melalui email/surat.
6. Mitra meninjau berkas dan memutuskan menerima atau menolak, lalu mengirim surat keputusan.
7. Admin menerima informasi hasil seleksi, memperbarui status di sistem, dan menetapkan DPM.
8. Jika diterima, mahasiswa mengunggah surat penerimaan dan mengikuti magang dengan bimbingan DPM.
9. Jika ditolak, mahasiswa melihat rekomendasi lain dan mengajukan kembali.

Dokumen ini juga memuat catatan penting:

- Mitra magang tidak memiliki akun sistem.
- Admin meneruskan pengajuan melalui email/surat yang dibuat oleh sistem.
- Hasil seleksi disampaikan mitra ke admin/mahasiswa, lalu diinput admin ke sistem.
- DPM mulai terlibat setelah mahasiswa diterima dan ditetapkan admin.

---

## 2. Aktor dan Lane

| Lane | Aktor | Peran yang terlihat di BPMN |
|---|---|---|
| Mahasiswa | Mahasiswa | Login, memilih peminatan, input nilai, melihat rekomendasi, memilih dan mengajukan magang, menunggu hasil, mengunggah surat penerimaan, mengikuti magang |
| Sistem SPK (Website) | Sistem | Validasi data, K-Means, filter peminatan, SAW, menampilkan rekomendasi, menyimpan pengajuan, memperbarui status |
| Admin / Prodi | Admin dan/atau Prodi | Mengelola data mitra, kriteria/bobot SAW, memeriksa pengajuan, verifikasi dokumen, meneruskan ke mitra, menginput hasil, menetapkan DPM |
| Mitra Magang (Eksternal) | Mitra/perusahaan | Menerima pengajuan, meninjau berkas, memutuskan menerima/menolak, mengirim surat keputusan |
| Dosen Pembimbing Magang (DPM) | DPM | Menerima penetapan dari admin dan membimbing mahasiswa selama magang |

Catatan aktor:

- **Admin / Prodi digabung dalam satu lane.** BPMN tidak menjelaskan apakah keduanya role yang sama, role berbeda, atau memiliki pembagian tugas.
- **Mitra Magang adalah pihak eksternal tanpa akun sistem.** Interaksinya melalui email/surat.
- **Sistem SPK** diperlakukan sebagai lane pelaku otomatis, bukan sekadar alat bantu.
- **DPM** dalam BPMN adalah **Dosen Pembimbing Magang**. Ini berbeda dari perluasan singkatan yang tertulis di PRD v0.1, yaitu “Dewan Pengawah Mahasiswa” (kemungkinan maksud: Dewan Pengawas Mahasiswa).

---

## 3. Aktivitas per Lane

### 3.1 Mahasiswa

Aktivitas yang tertulis:

1. **Login ke sistem**
2. **Pilih peminatan (DTA / PSI / SIA)**
3. **Input nilai mata kuliah prasyarat**
4. **Melihat hasil rekomendasi (ranking perusahaan)**
5. **Pilih perusahaan dan ajukan magang**
6. **Menunggu hasil seleksi mitra**
7. **Melihat rekomendasi lain dan mengajukan kembali**
8. **Mengunggah dokumen diterima (surat penerimaan)**
9. **Mengikuti magang dengan bimbingan DPM**

Urutan utama:

```text
Mulai
  -> Login ke sistem
  -> Pilih peminatan (DTA / PSI / SIA)
  -> Input nilai mata kuliah prasyarat
  -> Melihat hasil rekomendasi (ranking perusahaan)
  -> Pilih perusahaan dan ajukan magang
  -> Menunggu hasil seleksi mitra
  -> Diterima?
       Ya   -> Mengunggah dokumen diterima (surat penerimaan)
            -> Mengikuti magang dengan bimbingan DPM
            -> End
       Tidak -> Melihat rekomendasi lain dan mengajukan kembali
             -> Pilih perusahaan dan ajukan magang
```

### 3.2 Sistem SPK (Website)

Aktivitas yang tertulis:

1. **Validasi data mahasiswa**
2. **Proses K-Means (pengelompokan mitra)**
3. **Filter mitra sesuai peminatan**
4. **Perhitungan SAW (perangkingan)**
5. **Tampilkan hasil rekomendasi**
6. **Simpan data pengajuan magang**
7. **Update status pengajuan**

Urutan yang digambarkan:

```text
Validasi data mahasiswa
  -> Proses K-Means (pengelompokan mitra)
  -> Filter mitra sesuai peminatan
  -> Perhitungan SAW (perangkingan)
  -> Tampilkan hasil rekomendasi
```

Aktivitas penyimpanan terpisah:

```text
Simpan data pengajuan magang -> Database
Update status pengajuan     -> Database
```

Catatan:

- Tidak ada gateway, cabang kegagalan, atau jalur alternatif di lane sistem.
- Tidak ada aktivitas eksplisit untuk memilih jumlah cluster, menangani data kosong, atau menangani kegagalan algoritma.
- “Simpan data pengajuan magang” dan “Update status pengajuan” tampak dipicu oleh interaksi lintas lane, bukan bagian dari urutan linear rekomendasi.
- Database digambarkan dua kali; tidak ada skema data atau entitas yang dirinci.

### 3.3 Admin / Prodi

Aktivitas yang tertulis:

1. **Kelola data mitra magang (tambah/ubah/hapus)**
2. **Kelola kriteria dan bobot SAW**
3. **Melihat notifikasi pengajuan baru di dashboard**
4. **Cek detail pengajuan mahasiswa**
5. **Verifikasi dokumen dan kelengkapan**
6. **Teruskan pengajuan ke mitra**
7. **Menerima informasi hasil seleksi dari mitra (melalui email/WA/surat)**
8. **Update status Diterima / Ditolak di sistem**
9. **Menetapkan dosen pembimbing magang**

Urutan utama:

```text
Mulai
  -> Kelola data mitra magang (tambah/ubah/hapus)
  -> Kelola kriteria dan bobot SAW
  -> Melihat notifikasi pengajuan baru di dashboard
  -> Cek detail pengajuan mahasiswa
  -> Verifikasi dokumen dan kelengkapan
  -> Teruskan pengajuan ke mitra
  -> Menerima informasi hasil seleksi dari mitra
     (melalui email/WA/surat)
  -> Update status Diterima / Ditolak di sistem
  -> Menetapkan dosen pembimbing magang
```

Catatan:

- Tidak ada end event eksplisit di lane Admin/Prodi.
- Tidak ada gateway untuk dokumen tidak lengkap, pengajuan ditolak admin, atau revisi dokumen.
- Tidak ada aktivitas terpisah untuk membuat surat/email; dokumen “Surat/Email Pengajuan” hanya digambarkan sebagai objek.
- Penetapan DPM digambarkan setelah update status, tetapi tidak ada gateway yang memastikan hanya mahasiswa diterima yang mendapat DPM.
- Tidak ada pengelolaan pengguna, role, atau hak akses dalam BPMN.

### 3.4 Mitra Magang (Eksternal)

Aktivitas/pemicu yang tertulis:

1. **Menerima pengajuan (email/surat dari admin)** — digambarkan sebagai event pesan, bukan aktivitas biasa
2. **Meninjau berkas mahasiswa**
3. **Menerima?** — gateway keputusan
4. **Mengirimkan surat penerimaan ke admin/mahasiswa**
5. **Mengirimkan surat penolakan ke admin/mahasiswa**

Alur:

```text
Menerima pengajuan (email/surat dari admin)
  -> Meninjau berkas mahasiswa
  -> Menerima?
       Ya   -> Mengirimkan surat penerimaan ke admin/mahasiswa
       Tidak -> Mengirimkan surat penolakan ke admin/mahasiswa
```

Catatan:

- Tidak ada end event eksplisit di lane Mitra.
- Tidak ada akun sistem untuk mitra.
- Tidak ada aktivitas wawancara, kuota, tenggat respons, atau kriteria seleksi mitra.
- Tidak ada mekanisme pencatatan otomatis hasil keputusan mitra; hasil dikirim melalui email/WA/surat.

### 3.5 Dosen Pembimbing Magang (DPM)

Aktivitas yang tertulis:

1. **Menerima penetapan dari admin**
2. **Membimbing mahasiswa selama magang**

Alur:

```text
Menerima penetapan dari admin
  -> Membimbing mahasiswa selama magang
  -> End
```

Catatan:

- Lane DPM tidak memiliki start event; proses dimulai dari penetapan admin.
- Tidak ada aktivitas monitoring, penilaian, persetujuan, atau tanda tangan.
- Tidak ada alur komunikasi eksplisit antara DPM dan mahasiswa.
- End event DPM ada, tetapi tidak dijelaskan apakah akhirnya bersamaan dengan selesainya magang mahasiswa.

---

## 4. Gateway dan Alur Alternatif

Hanya ada dua gateway keputusan yang terlihat:

| Gateway | Lane | Makna yang tergambar | Cabang “Ya” | Cabang “Tidak” |
|---|---|---|---|---|
| **Diterima?** | Mahasiswa | Apakah hasil seleksi mitra diterima? | Mengunggah dokumen diterima -> mengikuti magang dengan DPM -> End | Melihat rekomendasi lain dan mengajukan kembali -> kembali ke “Pilih perusahaan dan ajukan magang” |
| **Menerima?** | Mitra | Apakah mitra menerima mahasiswa? | Mengirimkan surat penerimaan ke admin/mahasiswa | Mengirimkan surat penolakan ke admin/mahasiswa |

Catatan penting:

- Gateway **Diterima?** berada secara visual di lane Mahasiswa, tetapi keputusannya berasal dari hasil seleksi mitra. Tidak dijelaskan siapa yang mengevaluasi atau mengubah status gateway tersebut.
- Tidak ada gateway untuk:
  - data mahasiswa tidak valid;
  - dokumen tidak lengkap;
  - tidak ada mitra yang cocok;
  - tidak ada hasil rekomendasi;
  - kegagalan K-Means/SAW;
  - pengajuan ditolak admin;
  - DPM hanya untuk mahasiswa yang diterima;
  - pembatalan atau pengunduran diri.
- Tidak ada parallel gateway, inclusive gateway, atau event-based gateway.
- Alur penolakan mahasiswa hanya berupa loop untuk memilih rekomendasi lain; tidak ada jalur eskalasi atau banding.

---

## 5. Alur Pesan, Data, dan Notifikasi

Simbol putus-putus dalam legenda disebut **Alur Pesan/Antar Lane**. Yang dapat diidentifikasi:

- Login/aktivitas mahasiswa berhubungan dengan validasi data dan proses sistem.
- Sistem mengirim notifikasi pengajuan baru ke dashboard Admin (ikon lonceng).
- Admin meneruskan pengajuan ke mitra melalui email/surat; terdapat objek **Surat/Email Pengajuan**.
- Mitra mengirim hasil seleksi kepada Admin dan/atau Mahasiswa.
- Admin mengirim pembaruan status ke sistem.
- Admin mengirim penetapan kepada DPM.
- Sistem menyimpan pengajuan dan status ke Database.

Beberapa arah panah putus-putus sulit dipastikan dari PDF, terutama:

- Hubungan antara “Menunggu hasil seleksi mitra” dan “Simpan data pengajuan magang”.
- Hubungan antara hasil penolakan mitra dan gate “Diterima?” di lane Mahasiswa.
- Garis putus-putus dari “Mengirimkan surat penolakan” menuju “Menerima penetapan dari admin” di lane DPM; ini tidak konsisten dengan catatan bahwa DPM baru terlibat setelah mahasiswa diterima.
- Hubungan antara “Perhitungan SAW” dan “Melihat hasil rekomendasi”; secara bisnis, hasil yang ditampilkan seharusnya berasal dari “Tampilkan hasil rekomendasi”.

Karena itu, alur pesan tidak boleh dijadikan dasar implementasi tanpa konfirmasi.

Objek/data yang digambarkan:

| Objek | Lokasi | Keterangan |
|---|---|---|
| Database | Setelah “Simpan data pengajuan magang” | Menyimpan pengajuan |
| Database | Setelah “Update status pengajuan” | Menyimpan status |
| Surat/Email Pengajuan | Dekat “Teruskan pengajuan ke mitra” | Dokumen yang dikirim ke mitra |
| Notifikasi/Email | Dashboard Admin dan lane Mitra | Pemicu/komunikasi |
| Dokumen | Legenda | Tidak ada objek dokumen rinci selain surat/email pengajuan |

Tidak ada model data eksplisit untuk:

- mahasiswa;
- mitra;
- kriteria;
- bobot SAW;
- atribut K-Means;
- nilai mata kuliah;
- hasil clustering;
- hasil ranking;
- surat penerimaan/penolakan;
- penetapan DPM;
- status pengajuan selain “Diterima/Ditolak”.

---

## 6. Hasil Proses dan Kondisi Akhir

### Hasil yang tergambar

1. **Diterima**
   - Mahasiswa mengunggah surat penerimaan.
   - Mahasiswa mengikuti magang dengan bimbingan DPM.
   - DPM ditetapkan oleh Admin.
   - Mahasiswa mencapai end event.
   - DPM mencapai end event.

2. **Ditolak oleh mitra**
   - Mitra mengirim surat penolakan.
   - Mahasiswa dapat melihat rekomendasi lain dan mengajukan kembali.
   - Tidak ada end event untuk jalur penolakan; proses dapat berulang.

3. **Hasil seleksi diinput Admin**
   - Admin memperbarui status Diterima/Ditolak di sistem.
   - Sistem menyimpan status pengajuan ke Database.

### Kondisi akhir yang tidak jelas

- Tidak ada end event di lane Admin/Prodi.
- Tidak ada end event di lane Mitra.
- Tidak ada kondisi akhir untuk pengajuan yang tidak pernah direspons mitra.
- Tidak ada kondisi akhir untuk mahasiswa yang tidak mendapatkan rekomendasi.
- Tidak ada kondisi akhir untuk magang yang selesai/dinilai.
- Tidak ada status “dibatalkan”, “mengundurkan diri”, atau “gagal”.

---

## 7. Hal yang Tidak Jelas / Pertanyaan Terbuka

### 7.1 Aktor dan hak akses

1. Apakah **Admin** dan **Prodi** adalah role yang sama atau dua role berbeda?
2. Siapa yang berwenang mengelola data mitra dan kriteria SAW: Admin, Prodi, atau keduanya?
3. Apakah DPM adalah **Dosen Pembimbing Magang** atau **Dewan Pengawah Mahasiswa**? BPMN dan PRD memakai perluasan yang berbeda.
4. Apakah DPM memiliki akun dan login? BPMN hanya menunjukkan “Menerima penetapan dari admin”.
5. Apakah mitra benar-benar tidak memiliki akun, termasuk untuk mengirim hasil seleksi?
6. Apakah mahasiswa sudah memiliki akun sebelum login, atau ada proses registrasi yang tidak digambarkan?
7. Apakah ada role lain, misalnya koordinator magang, staf prodi, atau administrator sistem?

### 7.2 Data dan algoritma

1. Atribut apa yang digunakan untuk **K-Means**?
2. Berapa jumlah cluster dan bagaimana jumlahnya ditentukan?
3. Apa yang dikelompokkan: mitra, mahasiswa, atau keduanya?
4. Bagaimana data mitra dan mahasiswa dinormalisasi?
5. Kriteria apa yang digunakan untuk **SAW**?
6. Berapa bobot setiap kriteria, dan siapa yang menetapkannya?
7. Kriteria mana yang benefit dan mana yang cost?
8. Bagaimana skala penilaian, normalisasi, dan tie-breaking?
9. Bagaimana peminatan DTA/PSI/SIA dipetakan ke mitra?
10. Apakah mitra bisa masuk lebih dari satu peminatan?
11. Berapa banyak rekomendasi yang ditampilkan? Apakah semua mitra atau top-N?
12. Apa yang terjadi jika tidak ada mitra yang cocok atau tidak ada hasil ranking?
13. Apakah K-Means/SAW dijalankan ulang setelah mahasiswa ditolak atau data berubah?
14. Dari mana nilai mata kuliah prasyarat diperoleh: input manual, impor, atau integrasi akademik?
15. Mata kuliah apa yang termasuk prasyarat, dan apa aturan kelulusannya?

### 7.3 Proses dan status

1. Apa pemicu pasti “Validasi data mahasiswa” dan “Proses K-Means”?
2. Apakah admin harus menyelesaikan data mitra dan kriteria sebelum mahasiswa dapat meminta rekomendasi?
3. Apa status pengajuan sebelum “Diterima/Ditolak”? Apakah ada status menunggu, terverifikasi, diteruskan, atau dokumen kurang?
4. Apa yang terjadi jika dokumen pengajuan tidak lengkap?
5. Apakah admin dapat menolak pengajuan sebelum diteruskan ke mitra?
6. Siapa yang membuat surat/email pengajuan: sistem atau admin?
7. Apakah email benar-benar dikirim oleh sistem, atau hanya dibuat lalu dikirim manual?
8. Apa tenggat respons mitra, dan apa yang terjadi jika mitra tidak merespons?
9. Apakah mahasiswa dapat melamar ke lebih dari satu mitra dalam satu waktu?
10. Berapa kali mahasiswa boleh mengajukan kembali setelah ditolak?
11. Apakah status “Diterima” di sistem berasal dari mitra, admin, atau keduanya?
12. Bagaimana mencegah konflik jika mitra mengirim hasil langsung ke mahasiswa tetapi admin belum memperbarui sistem?
13. Apakah mahasiswa wajib mengunggah surat penerimaan sebelum magang dimulai?
14. Apakah admin memverifikasi surat penerimaan yang diunggah mahasiswa?
15. Apakah DPM hanya ditetapkan untuk mahasiswa yang diterima? BPMN tidak memiliki gateway untuk ini.
16. Apa kriteria penugasan DPM: beban dosen, peminatan, ketersediaan, atau persetujuan dosen?
17. Apakah DPM dapat menolak penetapan atau diganti?
18. Apakah ada proses penilaian, monitoring, atau tanda tangan DPM di akhir magang?
19. Apakah proses berakhir setelah mahasiswa mulai magang, atau setelah magang selesai?

### 7.4 Notifikasi dan integrasi

1. Kanal notifikasi apa yang dipakai: dashboard, email, WhatsApp, atau surat?
2. Apakah notifikasi dashboard dan email merupakan dua kanal terpisah?
3. Siapa penerima notifikasi pengajuan baru: Admin, Prodi, atau keduanya?
4. Apakah template surat/email sudah ditentukan?
5. Apakah sistem menyimpan riwayat pengiriman email/surat?
6. Apakah ada integrasi dengan sistem akademik untuk nilai dan data mahasiswa?
7. Apakah ada integrasi email/WA, atau semuanya manual?

### 7.5 Ruang lingkup dan nonfungsional

1. Apakah BPMN ini hanya untuk Program Studi Sistem Informasi, atau untuk semua prodi?
2. Apakah proses berlaku per semester, per tahun akademik, atau berkelanjutan?
3. Apakah data mahasiswa, nilai, dan dokumen perlu retensi/audit tertentu?
4. Apakah ada kebutuhan pelaporan atau ekspor data?
5. Apakah ada kebutuhan SLA, konkurensi, atau batas waktu proses?
6. Apakah ada kriteria penerimaan dan metrik keberhasilan SPK?

---

## 8. Perbandingan dengan `docs/PRD.md` v0.1

### 8.1 Kesesuaian yang terverifikasi

| PRD | BPMN | Status |
|---|---|---|
| Menggunakan K-Means dan SAW | Lane sistem memuat “Proses K-Means” dan “Perhitungan SAW” | Terverifikasi pada tingkat metode |
| Rekomendasi berupa ranking | “Melihat hasil rekomendasi (ranking perusahaan)” | Terverifikasi |
| Ada mahasiswa, admin, DPM | Lane Mahasiswa, Admin/Prodi, DPM | Sebagian terverifikasi; aktor tidak lengkap |
| Mahasiswa melihat rekomendasi dan mengajukan magang | Aktivitas mahasiswa sesuai | Terverifikasi |
| Admin mengelola mitra dan kriteria | “Kelola data mitra magang” dan “Kelola kriteria dan bobot SAW” | Terverifikasi |

### 8.2 Kebutuhan PRD v0.1 yang belum terverifikasi atau perlu dikoreksi

| PRD | Temuan BPMN | Status |
|---|---|---|
| Tiga peran: Admin, Mahasiswa, DPM | BPMN memiliki lima lane, termasuk Sistem dan Mitra Eksternal; Admin/Prodi digabung | Perlu dikoreksi |
| Admin mengelola pengguna dan sistem | BPMN hanya menunjukkan data mitra, kriteria, verifikasi, status, dan DPM | Belum terverifikasi / di luar BPMN |
| Mahasiswa memiliki profil | BPMN tidak memuat aktivitas profil | Belum terverifikasi |
| Pendaftaran mahasiswa | BPMN dimulai dari login, bukan registrasi | Perlu dikonfirmasi |
| DPM memvalidasi data mahasiswa | BPMN menempatkan validasi data di lane sistem; DPM baru terlibat setelah diterima | Bertentangan dengan asumsi PRD |
| DPM mengawasi dan memberi feedback | BPMN hanya “Membimbing mahasiswa selama magang” | Sebagian / belum terverifikasi |
| “DPM (Dewan Pengawah Mahasiswa)” | BPMN memakai “Dosen Pembimbing Magang (DPM)” | Konflik definisi |
| Mitra/perusahaan sebagai pengguna | BPMN menyatakan mitra tidak memiliki akun sistem | Perlu dikoreksi |
| BPMN belum ditemukan | BPMN tersedia di `docs/bpmn/BPMN.pdf` | PRD sudah kedaluwarsa pada bagian ini |
| Proses validasi/persetujuan rekomendasi | BPMN memiliki verifikasi dokumen oleh admin dan keputusan mitra, bukan persetujuan rekomendasi | Perlu diperjelas |
| Eskalasi/revisi jika rekomendasi tidak diterima | BPMN hanya memiliki loop memilih rekomendasi lain dan mengajukan kembali | Belum terverifikasi |
| Kriteria, bobot SAW, atribut K-Means | BPMN hanya menyebut nama proses, tanpa rincian | Belum terverifikasi |
| Kriteria penerimaan sistem | Tidak ada di BPMN maupun PRD | Belum terverifikasi |

### 8.3 Hal yang tidak boleh diasumsikan dari PRD v0.1

- Jangan menganggap Admin mengelola pengguna hanya karena PRD menyebutkannya.
- Jangan menganggap DPM memvalidasi data mahasiswa; BPMN menunjukkan validasi oleh sistem.
- Jangan menganggap ada registrasi/profil mahasiswa; BPMN dimulai dari login.
- Jangan menganggap mitra memiliki akun.
- Jangan menganggap DPM selalu ditetapkan hanya setelah penerimaan; BPMN tidak memiliki gateway untuk itu, dan bahkan memiliki garis pesan yang membingungkan dari penolakan ke DPM.
- Jangan menganggap ada eskalasi atau banding; BPMN hanya menggambarkan pengajuan ulang.
- Jangan menganggap status hanya “Diterima/Ditolak” tanpa memeriksa kebutuhan status antara.

---

## 9. Implikasi untuk Pengembangan Modul

BPMN ini cukup untuk menetapkan **alur besar** dan **aktor utama**, tetapi belum cukup untuk implementasi modul bisnis secara aman.

Yang sudah dapat dijadikan dasar:

- Pemisahan lane Mahasiswa, Sistem, Admin/Prodi, Mitra, dan DPM.
- Urutan umum rekomendasi: validasi -> K-Means -> filter peminatan -> SAW -> tampilkan ranking.
- Adanya pengajuan magang, verifikasi dokumen, penerusan ke mitra, keputusan mitra, input hasil, penetapan DPM, dan bimbingan.
- Adanya loop pengajuan ulang setelah penolakan.
- Mitra berinteraksi melalui email/surat, bukan akun sistem.

Yang belum dapat diimplementasikan tanpa keputusan:

- Skema data dan status pengajuan.
- Atribut K-Means, jumlah cluster, dan data masukan.
- Kriteria, bobot, normalisasi, dan aturan SAW.
- Aturan filter peminatan dan ranking.
- Aturan verifikasi dokumen dan penanganan dokumen kurang.
- Aturan penerusan dan pencatatan hasil mitra.
- Aturan penetapan DPM.
- Batas pengajuan ulang.
- Hak akses per role.
- Integrasi email/WA dan notifikasi.
- Kriteria penerimaan dan pengujian.

---

## 10. Keputusan yang Perlu Dikonfirmasi Sebelum Modul Dibangun

Prioritas keputusan:

1. **Model aktor final**
   - Admin dan Prodi: satu role atau dua role?
   - DPM: Dosen Pembimbing Magang atau Dewan Pengawah Mahasiswa?
   - Apakah mitra tetap tanpa akun?
   - Apakah ada role koordinator/staf lain?

2. **Batas sistem dan integrasi**
   - Apakah surat/email dibuat sistem atau manual?
   - Apakah ada integrasi email/WA dan sistem akademik?
   - Apakah data nilai diinput mahasiswa atau diimpor?

3. **Spesifikasi algoritma**
   - Atribut dan jumlah cluster K-Means.
   - Kriteria, bobot, benefit/cost, dan normalisasi SAW.
   - Aturan filter peminatan dan ranking.
   - Perilaku saat data tidak lengkap atau tidak ada hasil.

4. **State machine pengajuan**
   - Daftar status yang sah.
   - Transisi status dan aktor yang berwenang.
   - Penanganan dokumen kurang, penolakan admin, penolakan mitra, dan pembatalan.
   - Batas pengajuan ulang.

5. **Aturan DPM**
   - Hanya untuk mahasiswa diterima atau semua?
   - Kriteria penugasan, beban, persetujuan, dan penggantian.
   - Apakah ada monitoring/penilaian akhir?

6. **Proses mitra**
   - Kriteria seleksi mitra.
   - Tenggat respons dan reminder.
   - Format surat penerimaan/penolakan.
   - Sumber kebenaran status: mitra, admin, atau sistem.

7. **Dokumen dan kepatuhan**
   - Jenis dokumen yang wajib.
   - Penyimpanan, retensi, akses, dan audit trail.
   - Perlindungan data pribadi mahasiswa.

8. **Ruang lingkup MVP dan kriteria penerimaan**
   - Apakah registrasi/profil mahasiswa termasuk MVP?
   - Apakah pengelolaan pengguna termasuk MVP?
   - Apakah laporan/ekspor termasuk MVP?
   - Definisi “selesai” untuk setiap alur.

---

## 11. Kesimpulan

BPMN ini memberikan gambaran proses bisnis yang cukup jelas pada tingkat **aktor, urutan utama, dua keputusan, dan hasil akhir mahasiswa/DPM**. Namun, dokumen belum memadai untuk implementasi modul bisnis karena:

- tidak merinci data dan algoritma;
- tidak mendefinisikan status pengajuan secara lengkap;
- tidak memiliki jalur gagal/revisi yang penting;
- memiliki beberapa alur pesan yang ambigu;
- tidak konsisten dengan sebagian asumsi PRD;
- tidak memiliki end state untuk Admin dan Mitra.

Implementasi modul bisnis sebaiknya ditunda sampai keputusan pada Bagian 10 dikonfirmasi dan BPMN direvisi atau dilengkapi.
