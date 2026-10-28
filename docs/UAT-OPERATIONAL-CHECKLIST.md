# Checklist Operasional UAT — SPK Magang

**Tanggal:** 22 Oktober 2026; diperiksa ulang, diuji, disiapkan, dan dipindahkan 23 Oktober 2026  
**Status:** Panduan operasional. PostgreSQL UAT terpisah sudah dibuat,
di-smoke-test, diisi 8 akun serta 3 mitra UAT, dan dipindahkan ke root persisten
pada 23 Oktober 2026. Belum ada eksekusi UAT oleh pengguna. Container aktif
memakai secret dari `/home/kunimiwai/.local/share/spk-magang-uat`; root `/tmp`
hanya dipertahankan sebagai rollback. Data development tidak diubah.  
**Rencana induk:** [`UAT-TEST-PLAN.md`](UAT-TEST-PLAN.md)  
**Urutan browser:** [`UAT-BROWSER-EXECUTION.md`](UAT-BROWSER-EXECUTION.md)

Checklist ini menjelaskan cara memulai UAT dengan PostgreSQL, storage, cache,
port, dan data yang terpisah dari development. **Jangan mengubah
`backend/.env` development.** Konfigurasi UAT diberikan sebagai environment
variable eksplisit pada shell UAT.

## Ringkasan mulai cepat

1. Jalankan preflight read-only §1; pastikan container development tetap
   `running/healthy` dan port `55432`, `8020`, serta `5182` sesuai kondisi.
2. Gunakan root aktif
   `$UAT_ROOT=$UAT_PERSIST=/home/kunimiwai/.local/share/spk-magang-uat`.
   Container sudah memakai secret dari root ini. Root lama
   `/tmp/opencode/spk-magang-uat` hanya rollback dan **bukan** dependensi
   startup. Secret tersimpan dengan mode `0600`; jangan membuat ulang,
   menimpa, atau menyalinnya ke repository.
3. Nyalakan container PostgreSQL UAT yang sudah ada pada `127.0.0.1:55432`
   (§3). Jangan menjalankan `podman run` bila nama container/volume sudah ada.
4. Muat environment UAT eksplisit dari `$UAT_ROOT/uat.env` (§4), termasuk
   `DB_DATABASE=spk_magang_uat`, `LARAVEL_STORAGE_PATH=$UAT_ROOT/storage`, dan
   `RECOMMENDATION_ENABLED=false`. Jangan menulis nilai ini ke `backend/.env`.
5. Verifikasi proses benar-benar memakai konfigurasi UAT dengan
   `php artisan about` dan `tinker` (§4) sebelum menjalankan migration.
6. Periksa `migrate:status`. Jika database UAT masih kosong, jalankan migration
   (§5); jika 15 migration sudah `Ran`, jangan jalankan ulang. Verifikasi
   `db:show --counts` dan struktur tabel.
7. Akun dan mitra UAT sudah disiapkan secara idempotent (§6). Jalankan ulang
   script hanya jika perlu; script tidak membuat pengajuan/keputusan. Lanjutkan
   urutan browser [`UAT-BROWSER-EXECUTION.md`](UAT-BROWSER-EXECUTION.md) dan
   pertahankan seluruh baris `BLOCKED`.

## 0. Batas yang tidak boleh dilanggar

- Jangan mengarahkan UAT ke database development `spk_magang` atau storage
  `backend/storage`.
- Jangan mengubah `backend/.env`, kredensial development, port development,
  volume development, atau `docker-compose.yml`.
- Jangan menjalankan `migrate:fresh`, reset, truncate, rollback migration, atau
  `db:wipe` pada database development. Smoke test UAT memakai transaksi
  database yang di-rollback, bukan reset schema atau truncate.
- Jangan mengaktifkan rekomendasi. Nilai UAT harus
  `RECOMMENDATION_ENABLED=false`.
- Jangan membuat akun UAT di database development.
- Jangan mengisi 31 baris matriks [`UAT-TEST-PLAN.md`](UAT-TEST-PLAN.md) §14
  (30 `BLOCKED` dan 1 `N/A` D-003) sebelum keputusan OD terkait disetujui.
- Jangan menyimpan password, token, `.env`, database, atau dokumen pribadi di
  repository atau bukti UAT.

## 1. Preflight read-only

Jalankan dari root repository sebelum membuat apa pun:

```sh
git status --short
podman inspect spk-magang-postgres \
  --format 'status={{.State.Status}} health={{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}'
podman ps --format '{{.Names}}\t{{.Status}}\t{{.Ports}}'
ss -ltnp | grep -E ':(5432|55432|8020|5182)\b' || true
df -h /
free -h
```

Yang diharapkan:

- container development `spk-magang-postgres` tetap `running/healthy`;
- pada 23 Oktober 2026 port `55432` sudah dipakai container UAT yang ada;
  port backend `8020` dan frontend `5182` belum dipakai kecuali sesi UAT
  sedang berjalan;
- ruang disk dan RAM cukup untuk container PostgreSQL UAT.

Jangan menyalakan ulang, menghentikan, atau mengubah container development
sebagai bagian dari setup UAT.

## 2. Tentukan lokasi UAT di luar repository

Gunakan satu root khusus UAT. Contoh:

```sh
export UAT_ROOT=/home/kunimiwai/.local/share/spk-magang-uat
umask 077
mkdir -p \
  "$UAT_ROOT/bootstrap-cache" \
  "$UAT_ROOT/storage/app/private" \
  "$UAT_ROOT/storage/framework/cache/data" \
  "$UAT_ROOT/storage/framework/sessions" \
  "$UAT_ROOT/storage/framework/views" \
  "$UAT_ROOT/storage/logs" \
  "$UAT_ROOT/evidence"
```

Jika UAT harus bertahan setelah reboot, gunakan direktori persisten milik
operator di luar repository, bukan `/tmp`. Jangan memakai
`backend/storage` development.

## 3. Provision PostgreSQL UAT terpisah

### 3.1 Resource UAT yang sudah ada (23 Oktober 2026)

| Resource | Nilai |
|---|---|
| Container | `spk-magang-uat-postgres` |
| Volume | `spk-magang-uat-postgres-data` |
| Port host | `127.0.0.1:55432` |
| Database / user | `spk_magang_uat` / `spk_uat` |
| Root aktif | `/home/kunimiwai/.local/share/spk-magang-uat` |
| Root rollback | `/tmp/opencode/spk-magang-uat` — tidak dipakai container aktif |
| Volume persisten | `/home/kunimiwai/.local/share/containers/storage/volumes/spk-magang-uat-postgres-data` |
| Mount secret aktif | `/home/kunimiwai/.local/share/spk-magang-uat/secrets/postgres-password` → `/run/secrets/uat_db_password` (read-only, `:Z`) |
| Secret | `secrets/postgres-password` dan `secrets/app-key`, mode `0600` |
| Environment | `uat.env`, mode `0600` |
| Storage | `<root>/storage` |
| Migration | 15 migration `Ran`; 20 tabel |
| Data UAT | 8 akun (1 admin, 1 prodi, 4 mahasiswa, 2 DPM), 3 mitra, 2 pengajuan (1 diterima, 1 ditolak), 3 komunikasi, 1 surat, dan 1 penempatan DPM setelah eksekusi browser 23 Oktober 2026 |

Container sekarang memakai secret dari root persisten; file `/tmp` tidak lagi
menjadi dependensi startup. Bind mount memakai `:Z` agar label SELinux sesuai
container baru. Volume data tetap persisten dan tidak dihapus saat recreate.
Root `/tmp` dipertahankan sebagai rollback, tetapi jangan dianggap sebagai
lingkungan aktif.

Jangan menjalankan `podman run` dengan nama container, volume, port, atau
database di atas selama resource tersebut sudah ada. Periksa lebih dulu:

```sh
podman container exists spk-magang-uat-postgres && echo "container sudah ada"
podman volume exists spk-magang-uat-postgres-data && echo "volume sudah ada"
ss -ltn | grep ':55432' || true
```

Jika nama sudah dipakai tetapi kondisinya tidak jelas, **berhenti dan
laporkan**; jangan menghapus, mengganti nama, atau menimpa resource.

Pendekatan provisioning di bawah hanya untuk lingkungan UAT yang benar-benar
baru. Container dan volume baru pada port `55432` tidak mengubah container
development dan tidak memakai database development.

Ambil password dari password manager/secret store. Jangan menuliskan password
langsung di command line atau repository.

```sh
umask 077
mkdir -p "$UAT_ROOT/secrets"
export UAT_DB_PASSWORD='<ambil-dari-secret-store>'
printf '%s' "$UAT_DB_PASSWORD" > "$UAT_ROOT/secrets/postgres-password"
chmod 600 "$UAT_ROOT/secrets/postgres-password"

podman run -d \
  --name spk-magang-uat-postgres \
  --restart unless-stopped \
  -e POSTGRES_DB=spk_magang_uat \
  -e POSTGRES_USER=spk_uat \
  -e POSTGRES_PASSWORD_FILE=/run/secrets/uat_db_password \
  -v "$UAT_ROOT/secrets/postgres-password:/run/secrets/uat_db_password:ro,Z" \
  -v spk-magang-uat-postgres-data:/var/lib/postgresql/data \
  -p 127.0.0.1:55432:5432 \
  docker.io/library/postgres:17-alpine
```

Periksa kesehatan dengan read-only:

```sh
podman exec spk-magang-uat-postgres \
  pg_isready -U spk_uat -d spk_magang_uat
podman logs --tail 30 spk-magang-uat-postgres
```

Jangan memakai port `5432` untuk UAT. Jangan menghapus volume
`spk-magang-uat-postgres-data` sebelum bukti UAT diarsipkan dan keputusan
retensi dibuat.

Alternatif database terpisah pada cluster development tidak disarankan karena
hanya memberikan isolasi logis, bukan isolasi container/volume. Jika terpaksa,
database harus bernama `spk_magang_uat`, role harus terpisah, dan operator wajib
memastikan aplikasi UAT tidak pernah memakai `DB_DATABASE=spk_magang`.

## 4. Environment UAT eksplisit

Root aktif sekarang adalah
`/home/kunimiwai/.local/share/spk-magang-uat`. Container sudah memakai secret
dari root ini; root `/tmp` hanya rollback.

```sh
export UAT_PERSIST=/home/kunimiwai/.local/share/spk-magang-uat
export UAT_ROOT="$UAT_PERSIST"
```

Muat file environment lokal yang sudah berisi referensi ke secret (jangan
mencetak isinya):

```sh
set -a
. "$UAT_ROOT/uat.env"
set +a
```

Gunakan shell khusus UAT. Jangan menulis nilai berikut ke `backend/.env`, dan
jangan menyalin password/APP_KEY ke command line, log, atau repository.

```sh
export UAT_ROOT=/home/kunimiwai/.local/share/spk-magang-uat
export APP_ENV=uat
export APP_DEBUG=false
export APP_KEY="$(cat "$UAT_ROOT/secrets/app-key")"
export APP_URL=http://127.0.0.1:8020

export DB_CONNECTION=pgsql
export DB_HOST=127.0.0.1
export DB_PORT=55432
export DB_DATABASE=spk_magang_uat
export DB_USERNAME=spk_uat
export DB_PASSWORD="$(cat "$UAT_ROOT/secrets/postgres-password")"

export LARAVEL_STORAGE_PATH="$UAT_ROOT/storage"
export APP_CONFIG_CACHE="$UAT_ROOT/bootstrap-cache/config.php"
export APP_SERVICES_CACHE="$UAT_ROOT/bootstrap-cache/services.php"
export APP_PACKAGES_CACHE="$UAT_ROOT/bootstrap-cache/packages.php"
export APP_ROUTES_CACHE="$UAT_ROOT/bootstrap-cache/routes-v7.php"
export APP_EVENTS_CACHE="$UAT_ROOT/bootstrap-cache/events.php"

export FILESYSTEM_DISK=local
export CACHE_STORE=database
export SESSION_DRIVER=database
export QUEUE_CONNECTION=database
export MAIL_MAILER=log
export CORS_ALLOWED_ORIGINS=http://127.0.0.1:5182
export RECOMMENDATION_ENABLED=false
```

`LARAVEL_STORAGE_PATH` didukung oleh Laravel 13.37.0 dan disk `local` memakai
`storage_path('app/private')`, sehingga surat penerimaan UAT tidak masuk ke
`backend/storage` development. Gunakan path absolut dan pastikan direktori
tersebut dapat ditulis oleh proses PHP. Verifikasi CLI di bawah tidak cukup:
periksa juga proses server yang benar-benar melayani port `8020` (§7), karena
environment dapat hilang pada proses anak.

`APP_KEY` UAT dibuat sekali dan disimpan di `$UAT_ROOT/secrets/app-key`
(mode `0600`) atau password manager. Jangan membuat key baru setiap shell dan
jangan memakai ulang key development. Jangan menjalankan `config:cache` pada
checkout development; path cache di atas menjaga cache UAT tetap di
`$UAT_ROOT/bootstrap-cache`.

Verifikasi bahwa proses benar-benar memakai konfigurasi UAT **sebelum**
migration atau smoke test:

```sh
cd backend
php artisan tinker --execute='
$c = config("database.default");
echo json_encode([
  "db_connection" => $c,
  "db_host" => config("database.connections.$c.host"),
  "db_port" => config("database.connections.$c.port"),
  "db_database" => config("database.connections.$c.database"),
  "current_database" => DB::selectOne("select current_database() as db")->db,
  "storage_path" => storage_path(),
  "local_disk_root" => config("filesystems.disks.local.root"),
  "cache_default" => config("cache.default"),
  "cached_config" => app()->getCachedConfigPath(),
  "recommendation_enabled" => config("recommendation.enabled"),
], JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES), PHP_EOL;
'
```

Nilai yang diharapkan: koneksi `pgsql`, host `127.0.0.1`, port `55432`,
database `spk_magang_uat`, `current_database` juga `spk_magang_uat`, storage
dan `local_disk_root` di bawah `$UAT_ROOT/storage`, cache default `database`,
`cached_config` di bawah `$UAT_ROOT/bootstrap-cache`, dan rekomendasi `false`.
Jika salah satu nilai tidak sesuai, **jangan menjalankan migration**.

## 5. Siapkan schema pada database UAT kosong

Lakukan hanya setelah langkah 4 memastikan `DB_DATABASE=spk_magang_uat` dan
`DB_PORT=55432`.

**Status 23 Oktober 2026:** database UAT sudah dimigrasikan; 15 migration
berstatus `Ran`, 20 tabel. Setelah eksekusi browser, data UAT berisi 8 akun,
3 mitra, 2 pengajuan (1 diterima, 1 ditolak), 3 komunikasi, 1 surat, dan
1 penempatan DPM. Jangan menjalankan `migrate` lagi jika `migrate:status` tidak
menunjukkan pending.

```sh
cd backend
php artisan db:show --no-ansi
php artisan migrate:status --no-ansi
php artisan migrate --pretend --no-ansi
```

Database UAT baru dapat menampilkan migration table belum ada atau semua
migration pending. Setelah target dipastikan dan database UAT masih kosong:

```sh
php artisan migrate --force --no-ansi
php artisan migrate:status --no-ansi
php artisan db:show --counts --no-ansi
php artisan db:table application_communications --no-ansi
```

Jangan menjalankan langkah ini pada `spk_magang`. Jangan memakai
`DatabaseSeeder` sebagai mekanisme akun resmi: seeder memang tidak membuat akun
default, dan sumber akun masih dirujuk ke OD-004/OD-005.

## 6. Akun dan data uji

**Status 23 Oktober 2026:** 8 akun dan 3 mitra UAT sudah dibuat. Tidak ada
pengajuan, keputusan, komunikasi, surat, atau penempatan yang dibuat. Login
kedelapan akun sudah diverifikasi dengan test HTTP di dalam transaksi yang
di-rollback.

Data disiapkan oleh script lokal di luar repository. Prosedur lengkap, guard,
dan hasil aktual ada di [`UAT-DATA-PREP.md`](UAT-DATA-PREP.md).

```sh
$UAT_PERSIST/bin/prepare-uat-data.php
```

Script bersifat idempotent: akun/mitra yang sudah ada tidak diubah dan password
tidak dirotasi. Script menolak berjalan jika database bukan `spk_magang_uat`,
port bukan `55432`, `APP_ENV` bukan `uat`, storage/cache bukan di bawah
`UAT_ROOT`, atau rekomendasi aktif. Password baru hanya ditulis ke:

```text
$UAT_PERSIST/credentials/uat-accounts.env
```

File tersebut bermode `0600` dan tidak boleh dibuka di layar bersama, disalin ke
repository, atau dilampirkan ke laporan. Jika file kredensial hilang tetapi akun
sudah ada, jangan membuat akun duplikat; gunakan prosedur rotasi password UAT
yang disetujui.

- Buat akun hanya di database UAT, sesuai daftar `UAT-*` pada
  [`UAT-TEST-PLAN.md`](UAT-TEST-PLAN.md) §3.2.
- Password acak disimpan di password manager/secret store; jangan masuk
  screenshot, tiket, atau repository.
- Perlakukan akun UAT sebagai fixture pengujian, bukan implementasi registrasi
  atau keputusan sumber akun.
- Semua nama mitra dan data uji memakai awalan `UAT-`.
- Jangan menyalin data development, data pribadi nyata, atau dokumen mitra
  nyata.

## 7. Jalankan backend dan frontend UAT

Di shell yang sudah memuat environment langkah 4, jalankan server bawaan PHP
langsung dari `backend/public`. **Jangan** memakai `php artisan serve` untuk
sesi ini: perintah itu tidak meneruskan seluruh environment UAT ke proses
`php -S` anak pada konfigurasi saat ini, sehingga CORS `5182` dan
`LARAVEL_STORAGE_PATH` dapat kembali ke nilai development. `variables_order`
harus memuat `E` agar `$_ENV` terisi.

```sh
cd backend/public
php -d variables_order=EGPCS \
  -S 127.0.0.1:8020 \
  ../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php
```

Verifikasi setelah server hidup:

```sh
curl -sS http://127.0.0.1:8020/api/health
curl -sS -i -X OPTIONS http://127.0.0.1:8020/api/auth/login \
  -H 'Origin: http://127.0.0.1:5182' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type'
```

Preflight harus memuat `Access-Control-Allow-Origin: http://127.0.0.1:5182`.
Unggah satu berkas sintetis melalui alur UAT lalu pastikan berkas muncul di
`$UAT_ROOT/storage/app/private`, bukan `backend/storage/app/private`.

Di terminal kedua:

```sh
cd frontend
VITE_API_BASE_URL=http://127.0.0.1:8020/api \
  npm run dev -- --host 127.0.0.1 --port 5182
```

Buka `http://127.0.0.1:5182`, bukan port development `5173`. Untuk build
produksi UAT, set `VITE_API_BASE_URL` pada saat build karena Vite menanamkan
nilai tersebut ke bundle.

## 8. Eksekusi dan bukti

**Smoke test PostgreSQL UAT (23 Oktober 2026):** 1 test, **104 assertion**,
lulus. Cakupan: pengajuan, komunikasi manual tanpa perubahan status, keputusan,
validasi isi surat, unggah/unduh surat, penempatan DPM, serta isolasi akses
mahasiswa/DPM/Admin. Test memakai `DatabaseTransactions` (bukan
`RefreshDatabase`), sehingga schema tidak direset dan data uji di-rollback.
Setelah test: `users=0`, `partners=0`, `internship_applications=0`,
`application_communications=0`, `acceptance_letters=0`, `dpm_placements=0`,
dan tidak ada berkas surat tersisa di storage UAT. Angka ini adalah kondisi
saat smoke test; setelah preparasi data, database UAT berisi 8 akun dan 3 mitra
tanpa pengajuan.

**Preparasi data UAT (23 Oktober 2026):** 8 akun dan 3 mitra dibuat; login
kedelapan akun lulus 31 assertion; saat preparasi: 0 pengajuan, 0 komunikasi,
0 surat, dan 0 penempatan. Bukti tersimpan di
`$UAT_PERSIST/evidence/2026-10-23/persistence-data-prep/`.

**Setelah eksekusi browser (23 Oktober 2026):** 2 pengajuan (1 diterima,
1 ditolak), 3 komunikasi, 1 surat, dan 1 penempatan DPM. Jangan menghapus
record ini; status dan bukti per skenario ada di `UAT-TEST-PLAN.md` §17.5.

**Recreate container ke root persisten (23 Oktober 2026):** container lama
dihentikan, di-rename sebagai rollback, lalu dihapus setelah verifikasi.
Container baru memakai secret dari root persisten dengan `:Z`. Login 8 akun
(31 assertion) dan smoke test (104 assertion) lulus setelah recreate; satu
siklus stop/start juga lulus. Bukti ada di
`$UAT_PERSIST/evidence/2026-10-23/persistence-switch/`.

**Urutan eksekusi browser:** gunakan
[`UAT-BROWSER-EXECUTION.md`](UAT-BROWSER-EXECUTION.md). Dokumen tersebut
menetapkan urutan per role, dependensi data, bukti minimum, dan skenario yang
tetap `BLOCKED`.

Bukti smoke test tersimpan di `$UAT_ROOT/evidence/2026-10-23/`:

- `preflight.txt`
- `target-verification.txt`
- `migration-and-schema.txt`
- `smoke-postgres.txt`
- `persistence-data-prep/`
- `persistence-switch/`

Perintah smoke test (harness lokal di luar repository):

```sh
set -a
. "$UAT_ROOT/uat.env"
set +a
cd backend
php vendor/bin/phpunit --no-configuration \
  --bootstrap vendor/autoload.php \
  "$UAT_ROOT/UatSmokeTest.php"
```

- Ikuti [`UAT-TEST-PLAN.md`](UAT-TEST-PLAN.md) §3.4 untuk urutan data.
- Simpan bukti di `$UAT_ROOT/evidence/<tanggal>/`, bukan di repository.
- Catat ID skenario, akun, role, waktu, langkah, hasil yang diharapkan/aktual,
  dan tautan bukti yang sudah disunting.
- Jangan menandai `PASS` sebelum langkah benar-benar dijalankan oleh eksekutor.
- Pertahankan seluruh baris `BLOCKED` dan rujukan OD; jangan mengisi keputusan
  bisnis yang belum disetujui.
- Setelah selesai, periksa kembali bahwa tidak ada file UAT yang masuk ke Git:

```sh
git status --short
```

## 9. Startup, shutdown, dan retensi

### 9.1 Startup aman

Gunakan container yang sudah ada; jangan membuat container baru:

```sh
podman start spk-magang-uat-postgres
for i in $(seq 1 15); do
  podman exec spk-magang-uat-postgres \
    pg_isready -U spk_uat -d spk_magang_uat && break
  sleep 2
done
```

Kemudian muat environment dan ulangi verifikasi target §4 sebelum menjalankan
perintah apa pun yang menulis ke database. Jangan menyalakan atau menghentikan
container development `spk-magang-postgres` sebagai bagian dari prosedur UAT.

### 9.2 Shutdown aman

```sh
podman stop spk-magang-uat-postgres
```

Jangan menghapus volume UAT sebelum bukti dan keputusan retensi selesai.
Container development `spk-magang-postgres` tidak boleh dihentikan atau dihapus
sebagai bagian dari prosedur ini. Jika UAT selesai permanen, arsipkan bukti,
hapus kredensial UAT dari secret store, lalu hapus container/volume UAT secara
terpisah setelah disetujui.

### 9.3 Retensi

Root UAT aktif berada di
`/home/kunimiwai/.local/share/spk-magang-uat` dan tidak lagi bergantung pada
`/tmp`. Volume data tetap persisten di
`/home/kunimiwai/.local/share/containers/storage/volumes/spk-magang-uat-postgres-data`.
Root lama `/tmp/opencode/spk-magang-uat` dipertahankan sebagai rollback, bukan
dependensi startup. Jangan menyalin secret ke repository.

### 9.4 Aktivasi root persisten — selesai 23 Oktober 2026

Aktivasi dilakukan setelah persetujuan, dengan downtime singkat. Volume data
tidak dihapus.

Backup terbaru sebelum recreate:
`$UAT_PERSIST/backups/uat-before-persistent-mount-20261023T152023.dump`
(mode `0600`, 59.207 byte, 166 entri restore). Backup awal
`uat-before-persistence-switch.dump` juga dipertahankan.

Langkah aktual:

1. Container UAT dihentikan; container lama di-rename menjadi
   `spk-magang-uat-postgres-pre-persist` sebagai rollback.
2. Container baru dijalankan dengan nama, port, database, volume, dan image
   yang sama; secret dimount dari
   `$UAT_PERSIST/secrets/postgres-password`.
3. Recreate pertama gagal karena label MCS SELinux file secret masih milik
   container lama. Container baru dihapus (bukan volume), lalu dijalankan ulang
   dengan bind mount `:Z`.
4. Verifikasi: `pg_isready`, `current_database()`, 8 akun, 3 mitra, 0
   pengajuan, login 8 akun (31 assertion), smoke test (104 assertion), dan satu
   siklus stop/start.
5. Setelah semua verifikasi lulus, container lama dihapus. Volume
   `spk-magang-uat-postgres-data` tetap ada.

Jika suatu saat container perlu dibuat ulang, gunakan `:Z` pada bind mount
secret dan buat backup terbaru terlebih dahulu. Jangan menjalankan
`podman volume rm`.

### 9.5 Startup setelah reboot

Container sekarang dapat start dengan secret persisten. Siklus stop/start sudah
diuji pada 23 Oktober 2026.

```sh
podman start spk-magang-uat-postgres
for i in $(seq 1 15); do
  podman exec spk-magang-uat-postgres \
    pg_isready -U spk_uat -d spk_magang_uat && break
  sleep 2
done
export UAT_ROOT=/home/kunimiwai/.local/share/spk-magang-uat
set -a
. "$UAT_ROOT/uat.env"
set +a
```

Rootless Podman saat ini belum otomatis start setelah reboot:
`podman-restart.service` berstatus `disabled/inactive` dan `Linger=no`. Opsi
yang direkomendasikan, **belum diaktifkan** dan memerlukan persetujuan:

```ini
# ~/.config/systemd/user/spk-magang-uat.service
[Unit]
Description=SPK Magang UAT PostgreSQL
After=network-online.target
Wants=network-online.target
ConditionPathExists=/home/kunimiwai/.local/share/spk-magang-uat/secrets/postgres-password

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/bin/podman start spk-magang-uat-postgres
ExecStop=/usr/bin/podman stop spk-magang-uat-postgres

[Install]
WantedBy=default.target
```

Aktivasi yang diusulkan, setelah persetujuan:

```sh
loginctl enable-linger "$USER"
systemctl --user daemon-reload
systemctl --user enable --now spk-magang-uat.service
```

Linger membuat user manager tetap hidup saat logout, sehingga perlu ditinjau
sebagai perubahan keamanan/operasional. Jangan aktifkan tanpa persetujuan.
