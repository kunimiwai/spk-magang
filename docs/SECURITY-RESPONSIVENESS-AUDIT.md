# Audit Keamanan dan Responsivitas

**Tanggal:** 20 Oktober 2026
**Cakupan:** fondasi autentikasi Sanctum, API mitra magang, frontend shell,
halaman login, `/mitra`, dialog, drawer navigasi, dan layout responsif.
**Status:** Audit selesai untuk cakupan di atas. Dokumen ini bukan klaim bahwa
seluruh aplikasi aman atau telah diuji secara menyeluruh.

---

## 1. Metode

- Inspeksi kode backend dan frontend, konfigurasi auth/session/CORS, route,
  middleware, request validation, model, serta interceptor API.
- Pemeriksaan respons HTTP aktual dengan `curl` untuk endpoint publik,
  endpoint tanpa token, endpoint role salah, preflight CORS, dan pencabutan
  token setelah logout.
- Pengujian browser ad hoc memakai Google Chrome 155 headless melalui Chrome
  DevTools Protocol pada viewport 1280×900, 768×1024, 390×844, dan 320×568.
- Browser memakai backend Laravel dengan database SQLite sementara dan akun
  uji sementara. Database pengembangan, isi `.env`, dan data pengguna tidak
  diubah. Nilai rahasia tidak dicetak.
- Pemeriksaan keyboard mencakup focus trap dialog/drawer, Escape, pengembalian
  fokus, validasi Enter-to-submit, dan fokus region tabel yang dapat digulir.

---

## 2. Temuan keamanan

| ID | Tingkat | Temuan | Bukti | Tindakan |
|---|---|---|---|---|
| SEC-01 | Sedang | CORS mengizinkan semua origin (`Access-Control-Allow-Origin: *`). | Preflight ke `/api/health` dengan `Origin: https://evil.example` tetap mendapat header CORS sebelum perbaikan. | **Diperbaiki.** `backend/config/cors.php` hanya mengizinkan origin dari `CORS_ALLOWED_ORIGINS`. Dengan konfigurasi bawaan dua origin, origin asing tidak mendapat `Access-Control-Allow-Origin`. Ditambah 3 feature test. Catatan: pustaka `php-cors` mengirim satu-satunya origin yang dikonfigurasi secara statis; browser tetap memblokir origin lain karena nilainya tidak cocok. |
| SEC-02 | Sedang (lokal) | `backend/.env` memiliki permission `644` pada mesin pengembangan, sehingga dapat dibaca pengguna lain di host yang sama. | `stat -c '%a %n' backend/.env` → `644`. File berisi konfigurasi sensitif. | **Tidak diubah** karena batasan tugas melarang perubahan `.env`. Rekomendasi: `chmod 600 backend/.env` dan gunakan secret manager di deployment. |
| SEC-03 | Sedang | Token Sanctum tidak memiliki masa berlaku. | `config('sanctum.expiration')` bernilai `null`. | **Tertunda.** Kebijakan masa berlaku token dan audit trail menunggu OD-027/OD-028. |
| SEC-04 | Rendah | Token Bearer disimpan di `sessionStorage`, sehingga dapat dibaca bila terjadi XSS pada origin aplikasi. | `frontend/src/services/api.ts` memakai `sessionStorage`. Tidak ditemukan `dangerouslySetInnerHTML`, `innerHTML`, `eval`, atau `document.write` di `frontend/src`. | **Risiko residual.** Tidak diubah tanpa keputusan arsitektur autentikasi. React melakukan escaping pada data mitra. |
| SEC-05 | Rendah | Lingkungan lokal memakai `APP_DEBUG=true`, dan PHP mengirim header `X-Powered-By: PHP/...`. | Nilai `config('app.debug')` lokal `true`; header terlihat pada respons `curl`. | **Tidak diubah.** Wajib `APP_DEBUG=false` dan `expose_php=Off` di produksi. |
| SEC-06 | Rendah | Cookie sesi tidak dipaksa `Secure` pada konfigurasi lokal. | `config('session.secure')` bernilai `null`. API memakai Bearer token; cookie hanya dipakai sementara saat login. | **Tidak diubah.** Produksi harus memakai HTTPS dan `SESSION_SECURE_COOKIE=true`. |

### Kontrol yang diverifikasi

- Endpoint mitra memakai `auth:sanctum` dan `role:admin`; request tanpa token
  menghasilkan `401`, sedangkan token role `mahasiswa` menghasilkan `403`.
- Logout mencabut token aktif. Token yang sama menghasilkan `401` setelah
  logout.
- Login dibatasi 5 percobaan per menit dan pesan gagal login tidak membedakan
  email yang tidak ada dari password yang salah.
- Validasi dilakukan di server melalui Form Request. `Partner` memakai
  `$fillable` terbatas dan controller hanya menyimpan `$request->validated()`.
  Field tambahan seperti `role` tidak masuk ke model.
- Route model binding menghasilkan `404` untuk ID mitra yang tidak ada.
- Tidak ditemukan raw SQL, `eval`, manipulasi HTML mentah, atau logging
  kredensial pada kode yang diaudit.
- Respons login/profil hanya memuat `id`, `name`, `email`, dan `role`.
- Frontend role guard hanya untuk UX. Otorisasi tetap ditegakkan backend.
- `backend/.env` dan `frontend/.env.local` tidak dilacak Git; hanya file
  `.env.example` yang dilacak.
- CORS hasil perbaikan tidak mengirim kredensial (`supports_credentials` tetap
  `false`) dan hanya mengizinkan origin frontend yang terdaftar.
- `allowed_methods` dan `allowed_headers` masih memakai `*` (perilaku default
  Laravel). Ini bukan wildcard origin dan tidak memperluas daftar origin yang
  diizinkan. Pembatasan method/header dapat dipertimbangkan bila kebijakan
  least privilege diminta.

---

## 3. Temuan responsivitas

| ID | Tingkat | Temuan | Bukti | Tindakan |
|---|---|---|---|---|
| RES-01 | Sedang | Tombol sekunder dialog terpotong di bagian bawah pada viewport 390×844. | Sebelum perbaikan, tombol “Batal” berakhir di `y=860` sementara dialog berakhir di `y=844`; hanya 28 dari 44 px terlihat. | **Diperbaiki.** `Dialog` menerima `footer` yang dirender di luar area scroll. Tombol aksi form tambah/ubah dan hapus selalu terlihat pada 390×844 dan 320×568. |
| RES-02 | Rendah | Tombol `size="sm"` hanya setinggi 36 px pada ponsel. | Tombol aksi tabel, pagination, dan logout terukur 36 px pada 390×844 sebelum perbaikan. | **Diperbaiki.** Ukuran `sm` menjadi minimal 44 px di bawah breakpoint `sm`, lalu 36 px pada layar yang lebih besar. |
| RES-03 | Rendah | Tombol tutup dialog hanya 40×40 px. | Terukur `closeHeight: 40` sebelum perbaikan. | **Diperbaiki.** Tombol tutup dialog menjadi 44×44 px. |
| RES-04 | Rendah | Region tabel yang dapat digulir horizontal tidak dapat difokuskan dengan keyboard. | Wrapper tabel memiliki `tabIndex=-1`, tanpa role atau label. | **Diperbaiki.** Wrapper menjadi `role="region"`, `tabIndex=0`, label aksesibel, focus ring, dan petunjuk visual “Geser tabel ke samping...” di bawah breakpoint `xl`. |

Tabel mitra tetap memakai gulir horizontal pada layar sempit. Perbaikan ini
tidak mengganti tabel menjadi kartu karena itu perubahan desain yang lebih
besar; petunjuk visual dan fokus keyboard ditambahkan agar perilaku tersebut
dapat ditemukan dan dioperasikan.

### Hasil viewport

| Viewport | Overflow dokumen | Tabel mitra | Hasil penting |
|---|---|---|---|
| 1280×900 | Tidak ada | Muat penuh, `903/903 px` | Aksi tabel dan pagination 36 px; dialog footer terlihat. |
| 768×1024 | Tidak ada | Gulir horizontal, `678/832 px` | Petunjuk geser tampil; tidak ada overflow halaman. |
| 390×844 | Tidak ada | Gulir horizontal, `316/832 px` | Aksi tabel, pagination, dan logout 44 px; dialog 390×776 px dengan kedua tombol terlihat; tombol tutup 44 px. |
| 320×568 | Tidak ada | Gulir horizontal, `246/832 px` | Dialog 320×523 px; area form dapat digulir; kedua tombol aksi tetap terlihat; tombol tutup 44 px. |

Pemeriksaan tambahan pada 390×844:

- Drawer navigasi selebar 288 px, fokus awal pada tombol tutup, Escape menutup
  drawer, dan fokus kembali ke tombol menu.
- Dialog memberi fokus awal ke field nama, Tab dari tombol submit kembali ke
  tombol tutup, Escape menutup dialog, dan fokus kembali ke tombol pemicu.
- Enter pada field nama tetap menjalankan validasi form setelah tombol submit
  dipindahkan ke footer dialog.
- Tidak ada exception JavaScript, warning konsol, atau respons API `4xx/5xx`
  selama alur admin yang diuji.

---

## 4. Verifikasi API dan browser

Status yang teramati:

```text
OPTIONS /api/auth/login                              204 (preflight)
POST    /api/auth/login                              200
GET     /api/auth/me                                 200
GET     /api/admin/partners?page=1&per_page=10       200
POST    /api/admin/partners                          201
DELETE  /api/admin/partners/{id}                     200
GET     /api/health                                  200
```

Pemeriksaan keamanan langsung:

```text
GET  /api/admin/partners tanpa token                 401
GET  /api/admin/partners token mahasiswa             403
GET  /api/admin/access-check token mahasiswa         403
GET  /api/auth/me setelah token admin di-logout      401
```

Setelah perbaikan CORS:

```text
OPTIONS /api/health, Origin: http://localhost:5173   204 + ACAO origin tersebut
OPTIONS /api/health, Origin: https://evil.example     204 tanpa ACAO
```

---

## 5. File yang berubah

- `backend/config/cors.php` (baru)
- `backend/tests/Feature/Api/CorsTest.php` (baru)
- `backend/.env.example`
- `frontend/src/lib/buttonStyles.ts`
- `frontend/src/components/ui/Dialog.tsx`
- `frontend/src/components/partners/PartnerFormDialog.tsx`
- `frontend/src/components/partners/DeletePartnerDialog.tsx`
- `frontend/src/pages/PartnersPage.tsx`
- Dokumentasi: `README.md`, `backend/README.md`, `frontend/README.md`,
  `docs/ARCHITECTURE.md`, `docs/UI-FOUNDATION.md`, `docs/VERIFICATION.md`,
  dan dokumen ini.

Audit ini tidak menambah migration baru, tidak mengubah database pengembangan,
tidak mengubah `.env` aktual, dan tidak membuat commit atau push.

---

## 6. Pengujian aktual

| Pemeriksaan | Hasil |
|---|---|
| Backend PHPUnit | 31 test, 139 assertion, lulus |
| Backend Pint | Lulus |
| Frontend unit test | 8 test, lulus |
| Frontend ESLint | Lulus |
| Frontend TypeScript + Vite build | Lulus |
| Browser ad hoc | Login, `/mitra`, validasi Enter, focus trap, Escape, pengembalian fokus, create `201`, delete `200`; tanpa error konsol/jaringan |
| `git diff --check` | Lulus |

Pengujian CORS mencakup origin yang diizinkan, preflight, dan origin yang
tidak diizinkan. Pengujian browser memakai database sementara dan dihapus
setelah audit.

---

## 7. Keterbatasan audit

- Bukan penetration test, audit infrastruktur produksi, atau audit menyeluruh
  seluruh endpoint masa depan.
- Browser yang diuji hanya Chrome headless desktop. Safari, Firefox, dan
  browser ponsel nyata belum diuji.
- Keyboard diuji secara terprogram; belum diuji dengan screen reader nyata
  (NVDA/JAWS/VoiceOver).
- Keyboard virtual ponsel, orientasi lanskap, dan perbesaran teks 200% belum
  diuji.
- Tabel mitra pada layar sempit masih memerlukan gulir horizontal; desain
  kartu alternatif belum diputuskan.
- Belum ada test suite E2E otomatis; pengujian browser masih ad hoc.
- Tidak ada uji beban, retry, atau ketahanan jaringan buruk.
- Permission file `.env` lokal dan konfigurasi produksi (TLS, `APP_DEBUG`,
  header server, session secure) tetap menjadi tanggung jawab deployment.

---

## 8. Keputusan produk yang masih terbuka

- Masa berlaku token, refresh/revocation policy, audit trail, dan retensi data
  (OD-027, OD-028).
- Kebijakan session/cookie bila autentikasi cookie akan ditambahkan.
- Kewenangan Prodi dan matriks izin lengkap (OD-001–OD-003).
- Bentuk tampilan tabel mitra pada ponsel bila gulir horizontal dianggap tidak
  memadai.
- Seluruh keputusan bisnis lain yang tercatat pada `docs/PRD.md`; audit ini
  tidak mengubah aturan bisnis tersebut.
