import assert from 'node:assert/strict'
import test from 'node:test'
import {
  formatApplicationDate,
  normalizeApplication,
  normalizeApplicationList,
  normalizeDpmOptionList,
  normalizePartnerList,
  normalizePartnerOptionList,
  reviewInputFromForm,
  statusBadgeVariant,
  statusLabel,
  validateReviewForm,
} from './applications.ts'

const validApplication = {
  id: 5,
  user_id: 7,
  partner_id: 3,
  status: 'menunggu',
  submitted_at: '2026-10-21T08:00:00.000000Z',
  review_note: null,
  reviewed_at: null,
  reviewed_by: null,
  partner: {
    id: 3,
    name: 'PT Maju',
    address: 'Jl. Contoh 1',
    contact: '08123456789',
    email: 'mitra@example.test',
    description: 'Mitra magang.',
  },
}

test('normalisasi pengajuan mempertahankan status dan data mitra', () => {
  const application = normalizeApplication(validApplication)

  assert.ok(application)
  assert.equal(application.id, 5)
  assert.equal(application.status, 'menunggu')
  assert.equal(application.partner.name, 'PT Maju')
  assert.equal(application.partner.email, 'mitra@example.test')
  assert.equal(application.reviewNote, null)
  assert.equal(application.student, null)
  assert.equal(application.reviewer, null)
})

test('normalisasi pengajuan menolak status atau mitra yang tidak valid', () => {
  assert.equal(
    normalizeApplication({ ...validApplication, status: 'diperiksa' }),
    null,
  )
  assert.equal(
    normalizeApplication({ ...validApplication, partner: null }),
    null,
  )
  assert.equal(
    normalizeApplication({ ...validApplication, submitted_at: '' }),
    null,
  )
  assert.equal(normalizeApplication(null), null)
})

test('daftar pengajuan menyaring entri rusak dan duplikat', () => {
  const applications = normalizeApplicationList([
    validApplication,
    { ...validApplication, id: 5, status: 'ditolak' },
    { ...validApplication, id: 6, status: 'diterima' },
    { ...validApplication, id: 'x' },
    null,
  ])

  assert.equal(applications.length, 2)
  assert.equal(applications[0].id, 5)
  assert.equal(applications[0].status, 'menunggu')
  assert.equal(applications[1].id, 6)
  assert.equal(applications[1].status, 'diterima')
  assert.deepEqual(normalizeApplicationList('bukan-array'), [])
})

test('daftar opsi mitra menyaring id dan nama yang tidak valid', () => {
  const options = normalizePartnerOptionList([
    { id: 1, name: 'PT A' },
    { id: 1, name: 'PT Duplikat' },
    { id: 2, name: '  PT B  ' },
    { id: 0, name: 'Tidak Valid' },
    { id: 3, name: '' },
    null,
  ])

  assert.deepEqual(options, [
    { id: 1, name: 'PT A' },
    { id: 2, name: 'PT B' },
  ])
  assert.deepEqual(normalizePartnerOptionList(null), [])
})

test('katalog mitra mempertahankan detail dan menyaring entri rusak', () => {
  const partners = normalizePartnerList([
    {
      id: 1,
      name: 'PT A',
      address: 'Jl. A',
      contact: '0811',
      email: 'a@example.test',
      description: 'Mitra A.',
    },
    { id: 1, name: 'PT Duplikat' },
    { id: 2, name: '  PT B  ', address: '', contact: null },
    { id: 0, name: 'Tidak Valid' },
    null,
  ])

  assert.deepEqual(partners, [
    {
      id: 1,
      name: 'PT A',
      address: 'Jl. A',
      contact: '0811',
      email: 'a@example.test',
      description: 'Mitra A.',
    },
    {
      id: 2,
      name: 'PT B',
      address: null,
      contact: null,
      email: null,
      description: null,
    },
  ])
  assert.deepEqual(normalizePartnerList('bukan-array'), [])
})

test('label dan varian badge mengikuti status BPMN', () => {
  assert.equal(statusLabel('menunggu'), 'Menunggu hasil seleksi mitra')
  assert.equal(statusLabel('diterima'), 'Diterima')
  assert.equal(statusLabel('ditolak'), 'Ditolak')
  assert.equal(statusBadgeVariant('menunggu'), 'warning')
  assert.equal(statusBadgeVariant('diterima'), 'success')
  assert.equal(statusBadgeVariant('ditolak'), 'danger')
})

test('validasi keputusan mewajibkan status dan membatasi catatan', () => {
  assert.deepEqual(validateReviewForm({ status: '', reviewNote: '' }), {
    status: 'Pilih keputusan pengajuan.',
  })
  assert.deepEqual(
    validateReviewForm({
      status: 'diterima',
      reviewNote: 'a'.repeat(5001),
    }),
    {
      reviewNote: 'Catatan review maksimal 5000 karakter.',
    },
  )
  assert.deepEqual(
    validateReviewForm({ status: 'ditolak', reviewNote: 'Sesuai hasil.' }),
    {},
  )
})

test('form keputusan memangkas catatan kosong menjadi null', () => {
  assert.deepEqual(
    reviewInputFromForm({ status: 'diterima', reviewNote: '  Diterima.  ' }),
    { status: 'diterima', reviewNote: 'Diterima.' },
  )
  assert.deepEqual(
    reviewInputFromForm({ status: 'ditolak', reviewNote: '   ' }),
    { status: 'ditolak', reviewNote: null },
  )
})

test('format tanggal menampilkan tanda hubung untuk nilai tidak valid', () => {
  assert.equal(formatApplicationDate(null), '—')
  assert.equal(formatApplicationDate('bukan-tanggal'), '—')
  assert.notEqual(
    formatApplicationDate('2026-10-21T08:00:00.000000Z'),
    '—',
  )
})

test('normalisasi menyertakan surat penerimaan dan penempatan DPM', () => {
  const application = normalizeApplication({
    ...validApplication,
    status: 'diterima',
    acceptance_letter: {
      id: 21,
      original_name: 'surat-penerimaan.pdf',
      mime_type: 'application/pdf',
      size: 204800,
      created_at: '2026-10-23T10:00:00.000000Z',
    },
    dpm_placement: {
      id: 31,
      assigned_at: '2026-10-24T09:00:00.000000Z',
      dpm: {
        id: 5,
        name: 'Dr. Dosen',
        email: 'dosen@example.test',
        role: 'dpm',
      },
    },
  })

  assert.ok(application)
  assert.equal(application.acceptanceLetter?.originalName, 'surat-penerimaan.pdf')
  assert.equal(application.acceptanceLetter?.size, 204800)
  assert.equal(application.dpmPlacement?.dpm?.name, 'Dr. Dosen')
})

test('normalisasi mengabaikan relasi surat atau DPM yang rusak', () => {
  const brokenLetter = normalizeApplication({
    ...validApplication,
    acceptance_letter: { id: 21, original_name: '', size: -1 },
  })
  const brokenPlacement = normalizeApplication({
    ...validApplication,
    dpm_placement: { id: 31, assigned_at: '', dpm: null },
  })

  assert.ok(brokenLetter)
  assert.equal(brokenLetter.acceptanceLetter, null)
  assert.ok(brokenPlacement)
  assert.equal(brokenPlacement.dpmPlacement, null)
})

test('daftar opsi DPM menyaring data yang tidak valid', () => {
  const options = normalizeDpmOptionList([
    { id: 1, name: 'Dosen A', email: 'a@example.test' },
    { id: 1, name: 'Dosen Duplikat', email: 'duplikat@example.test' },
    { id: 2, name: '  Dosen B  ', email: '' },
    { id: 0, name: 'Tidak Valid', email: 'x@example.test' },
    null,
  ])

  assert.deepEqual(options, [
    { id: 1, name: 'Dosen A', email: 'a@example.test' },
    { id: 2, name: 'Dosen B', email: '' },
  ])
  assert.deepEqual(normalizeDpmOptionList(null), [])
})
