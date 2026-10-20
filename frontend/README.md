# SPK Magang — Frontend

Aplikasi React 19 + TypeScript + Vite untuk SPK Rekomendasi Tempat Magang.
Styling memakai Tailwind CSS v4 (CSS-first melalui `src/index.css`).

## Perintah

```bash
npm install
npm run dev      # server pengembangan Vite
npm run lint     # ESLint
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
- Pemulihan sesi dari token Bearer di `sessionStorage`.
- Redirect ke halaman login untuk route terlindungi.
- Penanganan 401 global dan logout.
- Label role `admin`, `prodi`, `mahasiswa`, dan `dpm`.

Belum ada navigasi atau halaman khusus role karena matriks izin masih menunggu
OD-001–OD-003. Frontend tidak boleh dijadikan satu-satunya kontrol otorisasi;
validasi tetap dilakukan backend.

Belum ada test runner frontend. Verifikasi perilaku saat ini dilakukan melalui
ESLint, build TypeScript, dan pengujian backend untuk kontrak API.
