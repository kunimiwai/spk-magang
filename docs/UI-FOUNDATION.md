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
| `Textarea` | `src/components/ui/Textarea.tsx` | Gaya konsisten dengan input; dapat diubah ukurannya |
| `Field` | `src/components/ui/Field.tsx` | Label, hint, error; menghubungkan `aria-describedby`/`aria-invalid` |
| `Card` | `src/components/ui/Card.tsx` | Permukaan non-interaktif; tanpa `cursor-pointer` |
| `Badge` | `src/components/ui/Badge.tsx` | Netral, info, success, warning, danger |
| `Alert` | `src/components/ui/Alert.tsx` | `danger` memakai `role="alert"` |
| `Dialog` | `src/components/ui/Dialog.tsx` | Overlay, focus trap, Escape, pengembalian fokus, dan footer aksi opsional di luar area scroll |
| `LoadingState`, `ErrorState`, `EmptyState` | `src/components/ui/States.tsx` | Status dan empty state |
| `AppLayout`, `AppHeader`, `AppSidebar` | `src/components/layout/` | Shell dashboard, navigasi responsif |
| `PageContainer`, `PageHeader` | `src/components/layout/PageContainer.tsx` | Lebar konten dan hierarki judul |
| `RoleRoute` | `src/components/auth/RoleRoute.tsx` | Penjagaan route berbasis role untuk UX; bukan pengganti otorisasi backend |
| `PartnerFormDialog`, `DeletePartnerDialog` | `src/components/partners/` | Form dan konfirmasi hapus mitra |

Aturan pemakaian:

- Tombol aksi utama memakai `variant="primary"`. `accent` hanya untuk CTA yang
  memang perlu penekanan aksen.
- Jangan menambahkan `cursor-pointer` ke kartu non-interaktif.
- Semua kontrol interaktif harus memiliki focus state (`focus-visible`) dan
  target sentuh minimal 44px pada ukuran `md`.
- Di viewport < 640px, tombol `size="sm"` juga memakai tinggi minimal 44px.
  Pada layar yang lebih besar, kontrol `sm` kembali ke 36px agar tabel tetap
  padat.
- Aksi utama dan sekunder dialog ditempatkan pada `footer` `Dialog`, bukan di
  dalam area form yang dapat digulir, agar tetap terlihat di layar kecil.
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
- Tabel mitra memakai region yang dapat digulir horizontal, dapat difokuskan
  dengan keyboard, dan menampilkan petunjuk geser pada layar di bawah
  breakpoint `xl`. Gulir horizontal dipertahankan agar kolom tidak dipaksa
  turun menjadi kartu tanpa keputusan desain.

## Label peran

- `src/lib/roleLabels.ts` adalah satu sumber label untuk role yang sudah
  dikonfirmasi: `admin`, `prodi`, `mahasiswa`, dan `dpm`.
- D-001 menetapkan Admin dan Prodi sebagai role terpisah; D-002 menetapkan DPM
  sebagai Dosen Pembimbing Magang.
- Mitra tidak memiliki akun aplikasi (D-003), sehingga tidak ada label role
  mitra pada antarmuka pengguna.
- Role yang tidak dikenal ditampilkan apa adanya, bukan dipetakan ke role lain.

## Batas otorisasi frontend

- Menu “Mitra Magang” dan route `/mitra` hanya tersedia untuk role `admin`
  karena endpoint backend mitra saat ini memakai `role:admin`.
- `RoleRoute` menampilkan layar akses ditolak, tetapi bukan kontrol keamanan.
  Backend tetap menolak request tanpa role yang sesuai.
- Kewenangan Prodi terhadap mitra dan halaman bisnis lain masih menunggu
  OD-001–OD-003; role tersebut tidak diberi akses UI baru.
- Halaman mitra adalah satu-satunya halaman bisnis berbasis role saat ini.

## Keterbatasan

- Verifikasi browser sudah mencakup 1280×900, 768×1024, 390×844, dan 320×568.
  Lihat `docs/VERIFICATION.md` dan
  `docs/SECURITY-RESPONSIVENESS-AUDIT.md`.
- Tabel mitra masih memerlukan gulir horizontal pada layar sempit; alternatif
  kartu belum diputuskan.
- Belum ada test suite E2E otomatis; verifikasi browser masih ad hoc.
- Pengujian keyboard dilakukan secara terprogram; belum diuji dengan screen
  reader nyata, keyboard virtual ponsel, atau perbesaran teks 200%.
- Focus trap drawer dan dialog bersifat sederhana (Tab/Shift+Tab di dalam
  panel); belum merupakan audit aksesibilitas penuh.
- `src/App.css` masih ada tetapi tidak diimpor; belum dihapus agar perubahan
  tetap minimal.
- Unit test frontend memakai Node test runner untuk helper murni; belum ada
  pengujian komponen berbasis DOM.
