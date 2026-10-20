import assert from 'node:assert/strict'
import test from 'node:test'
import { getApiErrorMessage, getFieldErrors } from './apiError.ts'

test('error validasi server diubah menjadi pesan per field', () => {
  const error = {
    isAxiosError: true,
    response: {
      status: 422,
      data: {
        message: 'The name field is required.',
        errors: {
          name: ['Nama wajib diisi.'],
          email: ['Email tidak valid.', 'Email terlalu panjang.'],
        },
      },
    },
  }

  assert.deepEqual(getFieldErrors(error), {
    name: 'Nama wajib diisi.',
    email: 'Email tidak valid.',
  })
})

test('status 403 menghasilkan pesan akses yang jelas', () => {
  const error = {
    isAxiosError: true,
    response: { status: 403, data: {} },
  }

  assert.equal(
    getApiErrorMessage(error, 'Gagal.'),
    'Anda tidak memiliki akses untuk tindakan ini.',
  )
})

test('kegagalan jaringan menghasilkan pesan koneksi', () => {
  const error = {
    isAxiosError: true,
    response: undefined,
  }

  assert.equal(
    getApiErrorMessage(error, 'Gagal.'),
    'Tidak dapat terhubung ke backend. Periksa koneksi lalu coba lagi.',
  )
})
