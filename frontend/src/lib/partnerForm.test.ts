import assert from 'node:assert/strict'
import test from 'node:test'
import {
  emptyPartnerForm,
  partnerFormToInput,
  partnerToFormValues,
  validatePartnerForm,
} from './partnerForm.ts'

test('nama instansi wajib diisi', () => {
  const errors = validatePartnerForm({
    ...emptyPartnerForm,
    name: '   ',
  })

  assert.equal(errors.name, 'Nama instansi wajib diisi.')
})

test('email tidak valid ditolak', () => {
  const errors = validatePartnerForm({
    ...emptyPartnerForm,
    name: 'PT Contoh',
    email: 'bukan-email',
  })

  assert.equal(errors.email, 'Format email tidak valid.')
})

test('nama instansi lebih dari 255 karakter ditolak', () => {
  const errors = validatePartnerForm({
    ...emptyPartnerForm,
    name: 'a'.repeat(256),
  })

  assert.equal(errors.name, 'Nama instansi maksimal 255 karakter.')
})

test('payload memangkas spasi dan mengubah field kosong menjadi null', () => {
  const input = partnerFormToInput({
    name: '  PT Contoh  ',
    address: '  ',
    contact: ' 081234567890 ',
    email: ' mitra@example.com ',
    description: '',
  })

  assert.deepEqual(input, {
    name: 'PT Contoh',
    address: null,
    contact: '081234567890',
    email: 'mitra@example.com',
    description: null,
  })
})

test('nilai null dari API ditampilkan sebagai string kosong pada form', () => {
  const values = partnerToFormValues({
    id: 1,
    name: 'PT Contoh',
    address: null,
    contact: null,
    email: null,
    description: null,
    created_at: '2026-10-20T00:00:00Z',
    updated_at: '2026-10-20T00:00:00Z',
  })

  assert.deepEqual(values, {
    name: 'PT Contoh',
    address: '',
    contact: '',
    email: '',
    description: '',
  })
})
