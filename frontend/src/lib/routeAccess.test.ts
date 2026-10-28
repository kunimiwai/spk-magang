import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isPathAllowedForRole } from './routeAccess.ts'

describe('isPathAllowedForRole', () => {
  it('allows authenticated roles on the shared home and profile pages', () => {
    for (const role of ['admin', 'prodi', 'mahasiswa', 'dpm']) {
      assert.equal(isPathAllowedForRole('/', role), true)
      assert.equal(isPathAllowedForRole('/profil', role), true)
    }
  })

  it('keeps partner master data admin-only', () => {
    assert.equal(isPathAllowedForRole('/mitra', 'admin'), true)
    assert.equal(isPathAllowedForRole('/mitra/12', 'admin'), true)
    assert.equal(isPathAllowedForRole('/mitra', 'prodi'), false)
    assert.equal(isPathAllowedForRole('/mitra', 'mahasiswa'), false)
  })

  it('keeps academic master data and review screens for admin and prodi', () => {
    for (const path of [
      '/kriteria',
      '/mata-kuliah',
      '/admin',
      '/admin/pengajuan',
      '/admin/pengajuan/9',
      '/admin/analitik',
    ]) {
      assert.equal(isPathAllowedForRole(path, 'admin'), true)
      assert.equal(isPathAllowedForRole(path, 'prodi'), true)
      assert.equal(isPathAllowedForRole(path, 'mahasiswa'), false)
      assert.equal(isPathAllowedForRole(path, 'dpm'), false)
    }
  })

  it('scopes student and DPM routes to their own role', () => {
    assert.equal(isPathAllowedForRole('/mahasiswa/pengajuan', 'mahasiswa'), true)
    assert.equal(isPathAllowedForRole('/mahasiswa/pengajuan/12', 'mahasiswa'), true)
    assert.equal(isPathAllowedForRole('/mahasiswa/mitra', 'mahasiswa'), true)
    assert.equal(isPathAllowedForRole('/mahasiswa/pengajuan', 'admin'), false)
    assert.equal(isPathAllowedForRole('/dpm', 'dpm'), true)
    assert.equal(isPathAllowedForRole('/dpm/bimbingan', 'dpm'), true)
    assert.equal(isPathAllowedForRole('/dpm/bimbingan/4', 'dpm'), true)
    assert.equal(isPathAllowedForRole('/dpm/bimbingan', 'prodi'), false)
  })

  it('rejects malformed or unknown targets', () => {
    assert.equal(isPathAllowedForRole('//evil.test', 'admin'), false)
    assert.equal(isPathAllowedForRole('https://evil.test', 'admin'), false)
    assert.equal(isPathAllowedForRole('/tidak-ada', 'admin'), false)
  })

  it('ignores query strings and hashes when matching a route', () => {
    assert.equal(
      isPathAllowedForRole('/admin/pengajuan/5?tab=komunikasi', 'prodi'),
      true,
    )
    assert.equal(
      isPathAllowedForRole('/mahasiswa/pengajuan#riwayat', 'mahasiswa'),
      true,
    )
    assert.equal(
      isPathAllowedForRole('/mahasiswa/pengajuan#riwayat', 'admin'),
      false,
    )
  })
})
