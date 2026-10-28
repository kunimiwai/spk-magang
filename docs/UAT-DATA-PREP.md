# Preparasi Data UAT — SPK Magang

**Tanggal:** 23 Oktober 2026  
**Status:** Prosedur dan hasil aktual. Data UAT sudah dibuat; UAT pengguna belum
dijalankan.  
**Rencana induk:** [`UAT-TEST-PLAN.md`](UAT-TEST-PLAN.md) §3.2–§3.4  
**Operasional:** [`UAT-OPERATIONAL-CHECKLIST.md`](UAT-OPERATIONAL-CHECKLIST.md)

Dokumen ini menjelaskan cara menyiapkan akun dan mitra UAT secara idempotent.
Script tidak membuat pengajuan, keputusan, komunikasi, surat, penempatan, atau
parameter rekomendasi. Semua data hanya boleh masuk ke `spk_magang_uat`.

## 1. Guard target

Script menolak berjalan jika salah satu kondisi berikut tidak terpenuhi:

| Pemeriksaan | Nilai wajib |
|---|---|
| `DB_CONNECTION` | `pgsql` |
| Host / port | `127.0.0.1` / `55432` |
| Database konfigurasi | `spk_magang_uat` |
| `current_database()` | `spk_magang_uat` |
| `current_user` | `spk_uat` |
| `APP_ENV` | `uat` |
| `storage_path()` | di bawah `UAT_ROOT` |
| disk `local` | di bawah `UAT_ROOT` |
| config cache | di bawah `UAT_ROOT` |
| `RECOMMENDATION_ENABLED` | `false` |
| File kredensial | di luar repository |

Jika guard gagal, script berhenti sebelum membuka transaksi tulis.

## 2. Prasyarat

1. Container UAT sehat dan database sudah dimigrasikan.
2. Root aktif adalah `/home/kunimiwai/.local/share/spk-magang-uat`. Container
   sudah memakai secret dari root ini; `/tmp/opencode/spk-magang-uat` hanya
   rollback.
3. Muat environment UAT aktif tanpa mencetak secret:

```sh
export UAT_PERSIST=/home/kunimiwai/.local/share/spk-magang-uat
export UAT_ROOT="$UAT_PERSIST"
set -a
. "$UAT_ROOT/uat.env"
set +a
export UAT_CREDENTIALS_FILE="$UAT_PERSIST/credentials/uat-accounts.env"
```

4. Pastikan backend directory:

```sh
export SPK_BACKEND_DIR=/home/kunimiwai/Developer/spk-magang/backend
```

## 3. Verifikasi sebelum menulis

Jalankan dari shell UAT:

```sh
cd "$SPK_BACKEND_DIR"
php artisan tinker --execute='
$c = config("database.default");
echo json_encode([
  "db_connection" => $c,
  "db_port" => config("database.connections.$c.port"),
  "db_database" => config("database.connections.$c.database"),
  "current_database" => DB::selectOne("select current_database() as db")->db,
  "storage_path" => storage_path(),
  "local_disk_root" => config("filesystems.disks.local.root"),
  "cached_config" => app()->getCachedConfigPath(),
  "recommendation_enabled" => config("recommendation.enabled"),
], JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES), PHP_EOL;
'
```

Nilai wajib: database `spk_magang_uat`, port `55432`, storage/cache di bawah
root UAT, dan rekomendasi `false`.

## 4. Dry-run

Script: `$UAT_PERSIST/bin/prepare-uat-data.php`

```sh
php "$UAT_PERSIST/bin/prepare-uat-data.php" --dry-run
```

Dry-run tidak membuat password atau menulis data. Output harus menunjukkan
target `spk_magang_uat`, daftar akun/mitra, dan jumlah data saat ini.

## 5. Apply

```sh
php "$UAT_PERSIST/bin/prepare-uat-data.php"
```

Perilaku:

- akun yang belum ada dibuat dengan password acak;
- akun yang sudah ada tidak diubah dan password tidak dirotasi;
- role akun yang sudah ada harus sama; jika berbeda, transaksi dibatalkan;
- mitra yang sudah ada tidak diubah;
- password baru diverifikasi dengan `Hash::check` sebelum commit;
- password hanya ditulis ke `$UAT_CREDENTIALS_FILE`, mode `0600`;
- output tidak pernah mencetak password.

## 6. Akun dan mitra

Akun yang disiapkan:

| Kode | Role | Email UAT |
|---|---|---|
| `UAT-ADM-01` | `admin` | `uat-adm-01@uat.example.test` |
| `UAT-PRD-01` | `prodi` | `uat-prd-01@uat.example.test` |
| `UAT-MHS-01` | `mahasiswa` | `uat-mhs-01@uat.example.test` |
| `UAT-MHS-02` | `mahasiswa` | `uat-mhs-02@uat.example.test` |
| `UAT-MHS-03` | `mahasiswa` | `uat-mhs-03@uat.example.test` |
| `UAT-MHS-04` | `mahasiswa` | `uat-mhs-04@uat.example.test` |
| `UAT-DPM-01` | `dpm` | `uat-dpm-01@uat.example.test` |
| `UAT-DPM-02` | `dpm` | `uat-dpm-02@uat.example.test` |

Mitra yang disiapkan: `UAT Mitra Alpha`, `UAT Mitra Beta`, `UAT Mitra Gamma`.
Semua alamat/kontak/email adalah data sintetis `example.test`, bukan data nyata.

Password hanya ada di file kredensial lokal. Jangan menyalinnya ke laporan,
screenshot, tiket, repository, atau chat.

## 7. Idempotensi

Jalankan ulang perintah apply untuk memverifikasi:

- `users_created=0`, `users_existing=8`;
- `partners_created=0`, `partners_existing=3`;
- jumlah baris file kredensial tidak bertambah;
- tidak ada pengajuan baru.

Jika file kredensial hilang tetapi akun sudah ada, script tidak membuat akun
duplikat. Rotasi password UAT harus menjadi prosedur terpisah yang disetujui;
jangan menghapus akun atau membuat akun baru dengan email berbeda.

## 8. Verifikasi setelah apply

```sh
podman exec spk-magang-uat-postgres psql -U spk_uat -d spk_magang_uat \
  -c "SELECT role, count(*) FROM users GROUP BY role ORDER BY role;
      SELECT count(*) AS partners FROM partners;
      SELECT count(*) AS applications FROM internship_applications;"
```

Hasil aktual 23 Oktober 2026:

```text
admin=1, prodi=1, mahasiswa=4, dpm=2
partners=3
applications=0
communications=0
letters=0
placements=0
```

Verifikasi login seluruh akun dijalankan dengan test HTTP lokal di dalam
transaksi yang di-rollback: **1 test, 31 assertion, lulus**, tanpa token/session
tersisa. Test tersebut bukan UAT pengguna.

## 9. Bukti

Bukti operasional tersimpan di:

```text
$UAT_PERSIST/evidence/2026-10-23/persistence-data-prep/
```

Isi: inventory resource, validasi root persisten, dry-run/apply idempotent,
verifikasi login akun, jumlah data UAT, dan jumlah data development.

## 10. Larangan

- Jangan menjalankan script dengan environment development.
- Jangan menyalin akun/data development.
- Jangan membuat pengajuan/keputusan melalui script atau SQL.
- Jangan mengisi kriteria, bobot SAW, atau nilai mitra resmi.
- Jangan mengaktifkan rekomendasi.
- Jangan commit/push kredensial atau bukti UAT.
- Jangan menghapus data UAT sebagai bagian dari rerun; script hanya additive.
