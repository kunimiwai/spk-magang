import axios from 'axios'

type ApiErrorBody = {
  message?: unknown
  errors?: unknown
}

export type FieldErrors = Record<string, string>

export function getApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (!axios.isAxiosError(error)) {
    return 'Terjadi kesalahan yang tidak diketahui.'
  }

  if (error.code === 'ECONNABORTED') {
    return 'Permintaan melewati batas waktu. Coba lagi.'
  }

  if (!error.response) {
    return 'Tidak dapat terhubung ke backend. Periksa koneksi lalu coba lagi.'
  }

  switch (error.response.status) {
    case 401:
      return 'Sesi Anda berakhir. Silakan masuk kembali.'
    case 403:
      return 'Anda tidak memiliki akses untuk tindakan ini.'
    case 404:
      return 'Data yang diminta tidak ditemukan.'
    case 422:
      return 'Periksa kembali data yang dikirim.'
    case 429:
      return 'Terlalu banyak permintaan. Coba lagi nanti.'
    case 500:
      return 'Terjadi kesalahan pada server. Coba lagi.'
    default:
      return fallback
  }
}

export function getFieldErrors(error: unknown): FieldErrors {
  if (!axios.isAxiosError(error) || error.response?.status !== 422) {
    return {}
  }

  const body = error.response.data as ApiErrorBody | undefined
  const errors = body?.errors

  if (!errors || typeof errors !== 'object') {
    return {}
  }

  const fieldErrors: FieldErrors = {}

  for (const [field, messages] of Object.entries(errors)) {
    if (Array.isArray(messages) && typeof messages[0] === 'string') {
      fieldErrors[field] = messages[0]
    }
  }

  return fieldErrors
}
