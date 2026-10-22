# SPK Magang — Frontend

Aplikasi React 19 + TypeScript + Vite untuk SPK Rekomendasi Tempat Magang.
Styling memakai Tailwind CSS v4 (CSS-first melalui `src/index.css`).

## Perintah

```bash
npm install
npm run dev      # server pengembangan Vite
npm run lint     # ESLint
npm test         # unit test Node + test komponen Vitest
npm run build    # type check + build produksi
npm run preview  # pratinjau hasil build
```

## Konfigurasi

Salin `.env.example` menjadi `.env.local` dan sesuaikan bila perlu:

```dotenv
VITE_API_BASE_URL=http://localhost:8000/api
```

## Cakupan saat ini

- Halaman login, ringkasan, dan profil.
- Halaman manajemen mitra magang untuk role `admin` (`/mitra`), terhubung ke
  API CRUD backend dengan pagination, validasi form, dialog tambah/ubah/hapus,
  serta loading, error, empty, dan success state.
- Halaman data mahasiswa untuk role `mahasiswa` (`/mahasiswa`): memuat profil
  peminatan dari `GET /api/mahasiswa/profile` dan menyimpannya melalui
  `PUT /api/mahasiswa/profile`. Form hanya muncul setelah backend menyatakan
  penyimpanan aktif; bila kardinalitas OD-015 belum ditetapkan, halaman
  menampilkan konflik dan tidak memilih aturan secara diam-diam. Tersedia
  loading, validasi, error, success, dan empty state. Atribut akademik yang
  belum diputuskan tidak ditampilkan atau dikarang.
- Dashboard mahasiswa untuk role `mahasiswa` (`/mahasiswa/dashboard`): sapaan
  dan identitas dari sesi aktif, peminatan yang tersimpan, pengajuan terbaru
  beserta status, surat penerimaan, dan DPM jika tersedia, serta akses ke
  halaman Data Mahasiswa, Nilai Akademik, dan Rekomendasi. Tersedia loading,
  error, empty, dan retry state. Statistik dan status tidak dikarang.
- Halaman nilai akademik untuk role `mahasiswa` (`/mahasiswa/nilai`): memuat
  semua master mata kuliah dan nilai milik akun sendiri melalui
  `GET /api/mahasiswa/grades`, lalu menyimpannya melalui
  `PUT /api/mahasiswa/grades`. Nilai kosong dikirim sebagai `null` dan tidak
  dianggap nol. Status aturan prasyarat yang belum dikonfigurasi ditampilkan
  tanpa klaim lulus/tidak lulus; tersedia loading, error, empty, validasi,
  sukses, dan retry state.
- Halaman pengajuan magang untuk role `mahasiswa` (`/mahasiswa/pengajuan`):
  memilih mitra dari `GET /api/mahasiswa/partner-options`, mengirim pengajuan
  melalui `POST /api/mahasiswa/applications`, lalu menampilkan pengajuan milik
  akun sendiri beserta status, catatan review, surat penerimaan, dan DPM.
  Pengajuan `diterima` dapat memperoleh unggahan surat melalui endpoint
  terotorisasi; unduhan memakai blob dari API, bukan URL publik. Tersedia
  loading, error, empty, validasi, sukses, retry, dan pencegahan kirim ganda.
  Daftar mitra berasal dari master data, bukan ranking, karena pipeline
  rekomendasi belum siap. Penggantian surat dan DPM belum disediakan sampai
  OD-017/OD-024 ditetapkan.
- Halaman daftar dan detail pengajuan untuk role `admin`/`prodi`
  (`/admin/pengajuan` dan `/admin/pengajuan/:id`): menampilkan seluruh
  pengajuan, mencatat keputusan `diterima`/`ditolak` dari status `menunggu`,
  menampilkan/mengunduh surat penerimaan, dan menetapkan DPM dari akun
  ber-role `dpm`. Status antara, verifikasi dokumen, penerusan, penggantian
  DPM, dan reversal belum disediakan karena OD-016–OD-024 belum diputuskan.
- Halaman master mata kuliah untuk role `admin`/`prodi` (`/mata-kuliah`):
  CRUD nama/deskripsi mata kuliah dengan konfirmasi hapus, loading, error,
  empty, validasi, dan success state. Daftar mata kuliah prasyarat, skala, dan
  ambang kelulusan tidak ditentukan di halaman ini.
- Halaman rekomendasi mahasiswa (`/mahasiswa/rekomendasi`): memanggil
  `GET /api/mahasiswa/recommendations`, lalu menampilkan loading, error,
  empty, status konfigurasi belum lengkap, atau ranking SAW bila seluruh
  pemeriksaan backend terpenuhi. Setiap pemeriksaan diberi label kategori
  `Keputusan bisnis`, `Data`, atau `Teknis`. Ranking memuat nama mitra, skor,
  peringkat, ringkasan K-Means/SAW (termasuk seed dan ID fitur), kriteria dan
  bobot, serta keterangan perhitungan. Halaman tidak mengarang label peminatan
  dari cluster generik.
- Halaman kriteria dan penilaian mitra untuk role `admin`/`prodi`
  (`/kriteria`): CRUD master kriteria (nama, deskripsi, tipe benefit/cost,
  bobot), pengisian nilai per mitra, konfirmasi hapus, serta loading, error,
  validasi, dan empty state. Tidak ada daftar kriteria, bobot awal, atau skala
  nilai bawaan karena keputusan bisnis belum ditetapkan.
- Pemulihan sesi dari token Bearer di `sessionStorage`.
- Redirect ke halaman login untuk route terlindungi.
- Penjagaan route role `admin` untuk halaman mitra; backend tetap menjadi
  sumber kebenaran otorisasi.
- Penjagaan route role `admin`/`prodi` untuk halaman kriteria, penilaian
  mitra, master mata kuliah, dan pengajuan, serta role `mahasiswa` untuk
  halaman Data Mahasiswa, Nilai Akademik, Rekomendasi, dan Pengajuan Magang.
- Penanganan 401 global dan logout.
- Label role `admin`, `prodi`, `mahasiswa`, dan `dpm`.

Halaman khusus role hanya ditambahkan bila otorisasi backend untuk role
tersebut sudah ada (`/mitra` untuk `admin`, `/kriteria`, `/mata-kuliah`, dan
`/admin/pengajuan` untuk `admin`/`prodi`, `/mahasiswa`, `/mahasiswa/nilai`,
`/mahasiswa/rekomendasi`, dan `/mahasiswa/pengajuan` untuk `mahasiswa`).
Matriks izin lengkap masih menunggu OD-001–OD-003. Frontend tidak boleh
dijadikan satu-satunya kontrol otorisasi; validasi tetap dilakukan backend.

Surat penerimaan diunduh sebagai blob dari endpoint terotorisasi dan tidak
memakai URL publik. Batas format/ukuran di `src/lib/documents.ts` adalah
cerminan default teknis `backend/config/internship.php`; backend tetap menjadi
sumber kebenaran. Kandidat DPM berasal dari akun ber-role `dpm`; frontend tidak
membuat akun dosen dummy atau master dosen baru.

## Verifikasi integrasi

Alur login admin, halaman `/mitra`, tambah/ubah/hapus mitra, pagination, dan
penolakan akses untuk role mahasiswa sudah diverifikasi di browser pada
20 Oktober 2026. Verifikasi memakai backend SQLite sementara, bukan database
pengembangan. Rincian hasil dan langkah manual ada di
[`../docs/VERIFICATION.md`](../docs/VERIFICATION.md).

Audit responsivitas mencakup 1280×900, 768×1024, 390×844, dan 320×568. Pada
layar sempit, tabel mitra memakai gulir horizontal dengan petunjuk visual dan
region yang dapat difokuskan keyboard; tombol aksi di bawah breakpoint `sm`
berukuran minimal 44px dan footer dialog tetap terlihat. Rincian ada di
[`../docs/SECURITY-RESPONSIVENESS-AUDIT.md`](../docs/SECURITY-RESPONSIVENESS-AUDIT.md).

Belum ada test suite E2E otomatis di repository. Verifikasi rutin memakai
ESLint, unit test Node untuk helper murni, test komponen Vitest untuk
profil/dashboard/nilai mahasiswa, master mata kuliah, kriteria, rekomendasi,
serta pengajuan mahasiswa dan admin/prodi, build TypeScript, serta pengujian
backend untuk kontrak API. Verifikasi browser halaman rekomendasi, nilai
akademik, dan pengajuan masih dilakukan secara ad hoc.
