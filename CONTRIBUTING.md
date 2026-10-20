# Contributing Guide

## 1. Branch Strategy

- `main`: branch integrasi utama.
- `feat/frontend-setup`: setup dan pengembangan frontend.
- `feat/backend-setup`: setup dan pengembangan backend.
- `feat/spk-engine-setup`: setup dan pengembangan mesin SPK.
- `feat/<nama-fitur>`: pengembangan fitur baru.
- `fix/<nama-perbaikan>`: perbaikan bug.
- `chore/<nama-pekerjaan>`: konfigurasi dan pemeliharaan.

## 2. Workflow

1. Sinkronkan branch utama sebelum memulai pekerjaan.
2. Kerjakan fitur pada branch yang sesuai.
3. Hindari mengubah direktori milik anggota lain tanpa koordinasi.
4. Uji perubahan sebelum commit.
5. Gunakan Pull Request untuk menggabungkan perubahan ke `main`.
6. Selesaikan konflik sebelum melakukan merge.

## 3. Commit Convention

Gunakan format:

type: deskripsi singkat

Contoh:
- feat: add internship recommendation endpoint
- fix: validate SAW criteria weights
- chore: initialize project structure
- docs: document local development setup

## 4. Security

- Jangan commit file `.env`.
- Jangan menyimpan password, token, atau API key di repository.
- Gunakan `.env.example` untuk mendokumentasikan nama variabel.
- Jangan menggunakan data pribadi atau data produksi tanpa izin.
