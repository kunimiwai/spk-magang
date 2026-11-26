# SPK Magang

Pembangunan ulang SPK Rekomendasi Tempat Magang dengan frontend Next.js, backend Node.js (NestJS), dan PostgreSQL.

## Arsitektur

- apps/web: Next.js App Router + TypeScript.
- apps/api: NestJS + TypeScript sebagai REST API.
- database/prisma: Prisma schema dan migration PostgreSQL.
- packages/: shared contracts/utilities sesuai kebutuhan.
- docs/: keputusan arsitektur, kebutuhan, desain data, dan kontrak API.

## Database baru dan isolasi data lama

Versi ini menggunakan database PostgreSQL terpisah bernama spk_magang_v2 secara default. Database lama harus tetap utuh dan tidak boleh menjadi target migration, reset, seed, atau operasi development.

1. Salin .env.example menjadi .env sesuai lingkungan lokal.
2. Pastikan DATABASE_URL menunjuk ke database baru spk_magang_v2.
3. Buat database baru secara eksplisit sebelum menjalankan migration.
4. Jangan menjalankan prisma migrate reset pada lingkungan yang belum diverifikasi.

Tidak ada pemindahan data otomatis dari database lama.

## Pengembangan lokal

Prasyarat: Node.js LTS, pnpm, dan PostgreSQL.

Jalankan pnpm install lalu pnpm dev setelah scaffold aplikasi pada workspace masing-masing dilengkapi.

## Prinsip implementasi

- K-Means dan SAW tetap menjadi metode inti SPK sesuai ruang lingkup kebutuhan.
- Aturan bisnis, kriteria, bobot, prasyarat, parameter clustering, dan kebijakan rekomendasi tidak boleh direkayasa tanpa keputusan tervalidasi.
- K-Means untuk segmentasi/profil; hasil cluster tidak otomatis menjadi filter kandidat SAW.
- Aktivasi pemeringkatan SAW mengikuti keputusan bisnis yang terdokumentasi.
- Otorisasi dilakukan di backend; frontend bukan batas keamanan.
- Perubahan skema database harus melalui migration yang dapat ditinjau.

## Status

Fondasi repository sedang disiapkan pada branch rebuild/node-next-foundation. File konfigurasi awal belum berarti aplikasi sudah dapat dijalankan atau lulus pengujian.
