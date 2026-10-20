# Verification — Integrasi Admin Mitra Magang

**Tanggal:** 20 Oktober 2026
**Cakupan:** `FR-MIT-01`, login admin, route `/mitra`, CRUD mitra, pagination, dan pembatasan role.
**Status:** Lulus.

---

## 1. Tujuan

Memverifikasi bahwa halaman `/mitra` benar-benar berjalan di browser dan
terhubung ke backend, bukan hanya lulus unit test dan build. Verifikasi mencakup
alur utama BPMN “Kelola data mitra magang (tambah/ubah/hapus)”.

---

## 2. Lingkungan pengujian

| Komponen | Nilai |
|---|---|
| Frontend | Vite dev server, React 19, TypeScript |
| Backend | Laravel 13, Sanctum, SQLite sementara |
| Database | `/tmp/.../database.sqlite`, bukan database PostgreSQL pengembangan |
| Browser | Google Chrome headless, dikendalikan melalui Chrome DevTools Protocol |
| Akun uji | Admin dan mahasiswa sementara di database terpisah |
| Data uji | Mitra sementara yang dibuat dan dihapus selama pengujian |

Database sementara dimigrasikan dari nol, diisi akun uji, lalu dihapus setelah
pengujian. Database pengembangan, `.env`, dan data pengguna tidak diubah.
Pengujian juga memakai migration `partners` yang sudah ada; tidak ada migration
baru.

---

## 3. Skenario dan hasil

| No | Skenario | Hasil aktual |
|---|---|---|
| 1 | Login admin melalui form | `POST /api/auth/login` → `200`, redirect ke beranda, nama admin tampil |
| 2 | Buka menu Mitra Magang | Navigasi ke `/mitra`, heading “Mitra magang” tampil |
| 3 | Muat daftar mitra | `GET /api/admin/partners?page=1&per_page=10` → `200` |
| 4 | Submit form kosong | Pesan “Nama instansi wajib diisi.” tampil; tidak ada request `POST` |
| 5 | Tambah mitra | `POST /api/admin/partners` → `201`, pesan sukses dan baris baru tampil |
| 6 | Reload halaman | Data mitra tetap tampil setelah `GET` ulang |
| 7 | Ubah mitra | `PUT /api/admin/partners/{id}` → `200`, nama baru tampil |
| 8 | Hapus mitra | `DELETE /api/admin/partners/{id}` → `200`, empty state tampil |
| 9 | Pagination 11 data | Halaman 1 menampilkan 10 baris; halaman 2 menampilkan 1 baris; `GET page=2` → `200` |
| 10 | Mahasiswa membuka `/mitra` | Layar “Akses ditolak”; tidak ada request ke `/api/admin/partners` |
| 11 | Logout admin | `POST /api/auth/logout` → `200`, redirect ke `/login` |

Tidak ada exception JavaScript di halaman dan tidak ada request API yang gagal
selama skenario di atas.

Setelah audit responsivitas, tombol aksi dialog dipindahkan ke footer tetap di
luar area form yang dapat digulir. Alur tambah dan hapus diuji ulang di browser
pada 390×844: `POST /api/admin/partners` → `201` dan
`DELETE /api/admin/partners/{id}` → `200`, tanpa error konsol atau request
gagal. Validasi Enter-to-submit juga diverifikasi ulang.

---

## 4. Bukti integrasi

Request API yang teramati dari browser:

```text
POST   /api/auth/login                              200
GET    /api/auth/me                                 200
GET    /api/admin/partners?page=1&per_page=10       200
POST   /api/admin/partners                          201
PUT    /api/admin/partners/{id}                     200
DELETE /api/admin/partners/{id}                     200
GET    /api/admin/partners?page=2&per_page=10       200
POST   /api/auth/logout                             200
```

Perilaku UI yang terverifikasi secara visual:

- Tabel mitra menampilkan nama, kontak, email, alamat, dan aksi.
- Dialog tambah/ubah tampil di atas halaman dan dapat ditutup dengan tombol
  Batal.
- Pesan sukses tampil setelah tambah, ubah, dan hapus.
- Empty state tampil saat daftar kosong.
- Pagination menampilkan jumlah data dan halaman aktif.
- Menu “Mitra Magang” hanya tampil untuk admin.
- Layar akses ditolak tampil untuk mahasiswa.

---

## 5. Keterbatasan

- Pengujian browser ini bersifat ad hoc dan tidak disimpan sebagai test suite
  E2E di repository.
- Verifikasi integrasi awal dilakukan pada viewport desktop 1280×900. Audit
  responsivitas lanjutan mencakup 320×568, 390×844, 768×1024, dan 1280×900;
  lihat `docs/SECURITY-RESPONSIVENESS-AUDIT.md`.
- Tabel mitra masih memerlukan gulir horizontal pada layar sempit.
- Database pengembangan PostgreSQL tidak dipakai pada E2E; kontrak backend
  tetap diverifikasi oleh PHPUnit dan migration yang sudah berjalan.
- Pengujian tidak mencakup PostgreSQL-specific behavior di browser. Perbedaan
  driver tidak memengaruhi kontrak JSON yang diuji.
- Browser yang diuji hanya Chrome headless; Safari, Firefox, dan perangkat
  ponsel nyata belum diuji.

---

## 6. Langkah verifikasi manual

Jika browser tersedia:

1. Jalankan backend dan frontend.
2. Login dengan akun role `admin`.
3. Buka `/mitra`.
4. Tambah mitra dengan nama unik.
5. Reload halaman dan pastikan data tetap ada.
6. Ubah nama mitra dan pastikan perubahan tampil.
7. Hapus mitra dan pastikan empty state tampil.
8. Login dengan akun role `mahasiswa`, lalu buka `/mitra`; pastikan layar
   “Akses ditolak” tampil.
9. Periksa DevTools Network: request CRUD harus menuju
   `/api/admin/partners` dan tidak ada respons `401`, `403`, atau `5xx` untuk
   admin.

Jika browser tidak tersedia, verifikasi minimal:

```bash
cd backend
php artisan test --compact
./vendor/bin/pint --test

cd ../frontend
npm test
npm run lint
npm run build
```

Lalu verifikasi kontrak API memakai akun admin lokal dan `curl`/Postman untuk
`GET`, `POST`, `PUT`, dan `DELETE /api/admin/partners`.

---

## 7. Audit lanjutan

Audit keamanan dan responsivitas pada 20 Oktober 2026 mencakup CORS, token,
middleware role, validasi/mass assignment, viewport 320–1280 px, keyboard/focus,
dan dialog footer. Temuan, perbaikan, serta risiko residual dicatat di
[`SECURITY-RESPONSIVENESS-AUDIT.md`](SECURITY-RESPONSIVENESS-AUDIT.md).
