import assert from 'node:assert/strict'
import test from 'node:test'
import {
  normalizePeminatanReference,
  normalizeStudentProfile,
} from './peminatan.ts'

test('payload referensi yang valid dinormalisasi apa adanya', () => {
  const reference = normalizePeminatanReference({
    options: ['DTA', 'PSI', 'SIA'],
    selection_available: false,
    note: 'Belum dapat disimpan.',
  })

  assert.deepEqual(reference, {
    options: ['DTA', 'PSI', 'SIA'],
    selectionAvailable: false,
    note: 'Belum dapat disimpan.',
  })
})

test('payload tidak dikenal menghasilkan referensi kosong yang aman', () => {
  const reference = normalizePeminatanReference(null)

  assert.deepEqual(reference.options, [])
  assert.equal(reference.selectionAvailable, false)
  assert.equal(
    reference.note,
    'Keterangan pemilihan peminatan tidak tersedia dari server.',
  )
})

test('entri opsi yang tidak valid dibuang dan duplikat dihilangkan', () => {
  const reference = normalizePeminatanReference({
    options: [' DTA ', 'DTA', 42, '', null, 'psi', 'PSI'],
    selection_available: 'true',
  })

  assert.deepEqual(reference.options, ['DTA', 'psi', 'PSI'])
})

test('selection_available hanya bernilai true bila bertipe boolean true', () => {
  assert.equal(
    normalizePeminatanReference({ selection_available: true })
      .selectionAvailable,
    true,
  )

  assert.equal(
    normalizePeminatanReference({ selection_available: 1 })
      .selectionAvailable,
    false,
  )
})

test('profil mahasiswa valid dinormalisasi tanpa menambah pilihan default', () => {
  const profile = normalizeStudentProfile({
    peminatan: ['DTA'],
    peminatan_options: ['DTA', 'PSI', 'SIA'],
    selection_mode: 'single',
    selection_available: true,
    profile_complete: true,
    selection_note: 'Pilihan peminatan disimpan sebagai satu pilihan.',
  })

  assert.deepEqual(profile, {
    peminatan: ['DTA'],
    options: ['DTA', 'PSI', 'SIA'],
    selectionMode: 'single',
    selectionAvailable: true,
    profileComplete: true,
    note: 'Pilihan peminatan disimpan sebagai satu pilihan.',
  })
})

test('profil kosong tetap kosong dan mode tidak dikenal dinonaktifkan', () => {
  const profile = normalizeStudentProfile({
    peminatan: [],
    peminatan_options: ['DTA', 'PSI', 'SIA'],
    selection_mode: 'unknown',
    selection_available: true,
    profile_complete: false,
  })

  assert.deepEqual(profile.peminatan, [])
  assert.equal(profile.selectionMode, null)
  assert.equal(profile.selectionAvailable, false)
  assert.equal(profile.profileComplete, false)
})

test('mode valid tanpa selection_available true tidak membuka form', () => {
  const profile = normalizeStudentProfile({
    peminatan: [],
    peminatan_options: ['DTA'],
    selection_mode: 'multiple',
    selection_available: false,
  })

  assert.equal(profile.selectionMode, 'multiple')
  assert.equal(profile.selectionAvailable, false)
})

test('profil dengan peminatan tersimpan dianggap lengkap', () => {
  const profile = normalizeStudentProfile({
    peminatan: ['DTA', 'PSI'],
    peminatan_options: ['DTA', 'PSI', 'SIA'],
    selection_mode: 'multiple',
    selection_available: true,
    profile_complete: false,
  })

  assert.equal(profile.profileComplete, true)
})
