# SPK Magang — Frontend

Aplikasi React 19 + TypeScript + Vite untuk SPK Rekomendasi Tempat Magang.
Styling memakai Tailwind CSS v4 (CSS-first melalui `src/index.css`).

## Perintah

```bash
npm install
npm run dev      # server pengembangan Vite
npm run lint     # ESLint
npm test         # unit test Node untuk helper validasi dan error API
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
- Pemulihan sesi dari token Bearer di `sessionStorage`.
- Redirect ke halaman login untuk route terlindungi.
- Penjagaan route role `admin` untuk halaman mitra; backend tetap menjadi
  sumber kebenaran otorisasi.
- Penanganan 401 global dan logout.
- Label role `admin`, `prodi`, `mahasiswa`, dan `dpm`.

Belum ada navigasi atau halaman khusus role karena matriks izin masih menunggu
OD-001–OD-003. Frontend tidak boleh dijadikan satu-satunya kontrol otorisasi;
validasi tetap dilakukan backend.

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
ESLint, unit test Node untuk helper murni, build TypeScript, dan pengujian
backend untuk kontrak API. Verifikasi browser masih dilakukan secara ad hoc.
