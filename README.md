# SPK Rekomendasi Tempat Magang

Sistem Pendukung Keputusan (SPK) untuk membantu proses rekomendasi
tempat magang berdasarkan pengelompokan dan penilaian alternatif.

## Teknologi

- Frontend: React, TypeScript, Vite
- Backend: Laravel REST API
- Algorithm Service: Python, FastAPI
- Metode: K-Means dan Simple Additive Weighting (SAW)
- Database: PostgreSQL
- Development environment: Docker Compose

## Struktur Repository

```text
spk-magang/
├── frontend/          # Aplikasi React
├── backend/           # Laravel REST API
├── algorithm/         # Layanan K-Means dan SAW
├── docs/              # Dokumentasi proyek
├── infra/
│   └── postgres/      # Konfigurasi database
├── .env.example
├── .gitignore
├── docker-compose.yml
├── CONTRIBUTING.md
└── README.md
```

## Prasyarat

- Git
- Node.js dan npm
- PHP dan Composer
- Python dan pip
- Docker Engine dan Docker Compose

Versi dependensi akan ditetapkan sesuai konfigurasi masing-masing layanan.

## Memulai

1. Clone repository.
2. Masuk ke direktori proyek.
3. Salin `.env.example` menjadi `.env`.
4. Ikuti petunjuk konfigurasi pada dokumentasi setiap layanan.
5. Jalankan layanan sesuai konfigurasi pengembangan.

## Metode SPK

- K-Means: pengelompokan data sesuai atribut yang ditetapkan.
- SAW: perankingan alternatif berdasarkan bobot dan kriteria.

Detail kriteria, atribut, bobot, serta alur bisnis harus mengikuti
dokumen kebutuhan dan BPMN proyek.

## Status

Tahap awal: persiapan struktur repository dan lingkungan pengembangan.
