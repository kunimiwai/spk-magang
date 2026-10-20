# Fondasi UI/UX Frontend

Dokumen ini menjelaskan fondasi antarmuka SPK Magang. Sumber arah desain:
`design-system/spk-magang/MASTER.md`, dengan penyesuaian untuk aplikasi
internal dan Tailwind CSS v4.

## Tailwind CSS v4

Proyek memakai Tailwind CSS v4 melalui plugin `@tailwindcss/vite`. Tidak ada
`tailwind.config.js`; konfigurasi dilakukan CSS-first di
`frontend/src/index.css`:

- `@import "tailwindcss";`
- `@theme { ... }` untuk token yang menghasilkan utility seperti
  `bg-primary`, `text-muted-foreground`, dan `font-mono`.

Token di `:root` saja tidak menghasilkan utility Tailwind. Tambahkan token baru
di blok `@theme`.

## Token warna

| Token | Nilai | Pemakaian |
|-------|-------|-----------|
| `--color-primary` | `#1e40af` | Aksi utama, tautan, focus ring |
| `--color-primary-hover` | `#1e3a8a` | Hover aksi utama |
| `--color-on-primary` | `#ffffff` | Teks di atas primary |
| `--color-secondary` | `#3b82f6` | Aksi sekunder |
| `--color-secondary-hover` | `#60a5fa` | Hover aksi sekunder |
| `--color-on-secondary` | `#000000` | Teks di atas secondary |
| `--color-accent` | `#d97706` | Aksen/CTA |
| `--color-accent-hover` | `#f59e0b` | Hover aksen |
| `--color-on-accent` | `#000000` | Teks di atas aksen |
| `--color-background` | `#f8fafc` | Latar halaman |
| `--color-card` | `#ffffff` | Latar kartu/permukaan |
| `--color-foreground` | `#1e3a8a` | Teks utama |
| `--color-muted` | `#e9eef6` | Latar netral/hover |
| `--color-muted-foreground` | `#475569` | Teks sekunder |
| `--color-border` | `#7c8ba1` | Batas komponen (kontras >= 3:1) |
| `--color-border-subtle` | `#cbd5e1` | Garis dekoratif/pemisah |
| `--color-destructive` | `#dc2626` | Aksi berbahaya/error |
| `--color-ring` | `#1e40af` | Outline focus |

Token permukaan status: `--color-{success,warning,info,danger}-surface` dan
`--color-{success,warning,info,danger}-foreground`.

Aturan:

- Gunakan `border-border` untuk batas input/kontrol dan
  `border-border-subtle` untuk pemisah dekoratif.
- Jangan memakai `border-border-subtle` sebagai satu-satunya penanda kontrol
  interaktif.
- Teks aksen memakai `text-on-accent`, bukan putih, agar kontras memenuhi AA.
- Belum ada dark mode pada tahap ini.

## Tipografi

- UI: **Fira Sans** (`font-sans`).
- Heading teknis, label kecil, dan nilai kode: **Fira Code** (`font-mono`).
- Jangan menjadikan semua heading monospace. Gunakan `font-mono` secara
  selektif (eyebrow, role, service, label teknis).
- Font dimuat dari Google Fonts melalui `frontend/index.html`.

## Ikon

- Gunakan `lucide-react` secara konsisten.
- Ikon dekoratif memakai `aria-hidden="true"`.
- Tombol ikon wajib memiliki label aksesibel (`aria-label`).
- Jangan memakai emoji sebagai ikon antarmuka.

## Komponen

| Komponen | Lokasi | Catatan |
|----------|--------|---------|
| `Button` | `src/components/ui/Button.tsx` | Varian primary, secondary, outline, ghost, accent, destructive |
| `Input` | `src/components/ui/Input.tsx` | Border kuat, focus ring, state invalid/disabled |
| `Field` | `src/components/ui/Field.tsx` | Label, hint, error; menghubungkan `aria-describedby`/`aria-invalid` |
| `Card` | `src/components/ui/Card.tsx` | Permukaan non-interaktif; tanpa `cursor-pointer` |
| `Badge` | `src/components/ui/Badge.tsx` | Netral, info, success, warning, danger |
| `Alert` | `src/components/ui/Alert.tsx` | `danger` memakai `role="alert"` |
| `LoadingState`, `ErrorState`, `EmptyState` | `src/components/ui/States.tsx` | Status dan empty state |
| `AppLayout`, `AppHeader`, `AppSidebar` | `src/components/layout/` | Shell dashboard, navigasi responsif |
| `PageContainer`, `PageHeader` | `src/components/layout/PageContainer.tsx` | Lebar konten dan hierarki judul |

Aturan pemakaian:

- Tombol aksi utama memakai `variant="primary"`. `accent` hanya untuk CTA yang
  memang perlu penekanan aksen.
- Jangan menambahkan `cursor-pointer` ke kartu non-interaktif.
- Semua kontrol interaktif harus memiliki focus state (`focus-visible`) dan
  target sentuh minimal 44px pada ukuran `md`.
- Badge status hanya untuk status sistem yang benar-benar diketahui
  (misalnya koneksi backend). Jangan menampilkan status aturan bisnis yang
  belum terverifikasi.

## Layout

- `AppLayout` menyediakan skip link, sidebar desktop, header, drawer mobile,
  dan landmark `main`.
- Sidebar desktop menggunakan lebar tetap 16rem; pada layar < 1024px menjadi
  drawer dengan overlay, focus trap sederhana, tombol tutup, dan dukungan
  tombol Escape.
- `PageContainer` membatasi lebar konten (maksimal 72rem) dan memberi padding
  responsif.

## Keterbatasan

- Verifikasi visual di browser belum dilakukan pada tahap ini.
- Focus trap drawer bersifat sederhana (Tab/Shift+Tab di dalam panel); belum
  merupakan audit aksesibilitas penuh.
- `src/App.css` masih ada tetapi tidak diimpor; belum dihapus agar perubahan
  tetap minimal.
