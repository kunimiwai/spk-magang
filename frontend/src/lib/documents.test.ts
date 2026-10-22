import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ACCEPTANCE_LETTER_MAX_BYTES,
  formatFileSize,
  validateAcceptanceLetterFile,
} from './documents.ts'

test('validasi surat penerimaan menerima PDF, JPG, dan PNG dalam batas ukuran', () => {
  assert.equal(
    validateAcceptanceLetterFile({
      name: 'surat.pdf',
      size: 1024,
      type: 'application/pdf',
    }),
    null,
  )
  assert.equal(
    validateAcceptanceLetterFile({
      name: 'surat.jpg',
      size: ACCEPTANCE_LETTER_MAX_BYTES,
      type: 'image/jpeg',
    }),
    null,
  )
  assert.equal(
    validateAcceptanceLetterFile({
      name: 'surat.png',
      size: 2048,
      type: 'image/png',
    }),
    null,
  )
})

test('validasi surat penerimaan menolak format dan ukuran yang tidak didukung', () => {
  assert.equal(
    validateAcceptanceLetterFile({
      name: 'surat.txt',
      size: 100,
      type: 'text/plain',
    }),
    'Format surat penerimaan harus PDF, JPG, atau PNG.',
  )
  assert.equal(
    validateAcceptanceLetterFile({
      name: 'surat.pdf',
      size: ACCEPTANCE_LETTER_MAX_BYTES + 1,
      type: 'application/pdf',
    }),
    'Ukuran surat penerimaan maksimal 5 MB.',
  )
  assert.equal(
    validateAcceptanceLetterFile({
      name: 'kosong.pdf',
      size: 0,
      type: 'application/pdf',
    }),
    'Berkas surat penerimaan kosong.',
  )
})

test('validasi surat penerimaan memakai batas efektif dari server ketika diberikan', () => {
  const effectiveBytes = 2 * 1024 * 1024

  assert.equal(
    validateAcceptanceLetterFile(
      {
        name: 'surat.pdf',
        size: effectiveBytes,
        type: 'application/pdf',
      },
      effectiveBytes,
    ),
    null,
  )
  assert.equal(
    validateAcceptanceLetterFile(
      {
        name: 'surat.pdf',
        size: effectiveBytes + 1,
        type: 'application/pdf',
      },
      effectiveBytes,
    ),
    'Ukuran surat penerimaan maksimal 2 MB.',
  )
})

test('format ukuran berkas memakai satuan yang mudah dibaca', () => {
  assert.equal(formatFileSize(512), '512 B')
  assert.equal(formatFileSize(2048), '2 KB')
  assert.equal(formatFileSize(5 * 1024 * 1024), '5 MB')
  assert.equal(formatFileSize(-1), '—')
  assert.equal(formatFileSize(Number.NaN), '—')
})
