/**
 * Client-side mirror of `backend/config/internship.php`.
 *
 * BPMN does not define document format or size (OD-017). These values are
 * technical MVP defaults. The backend remains the source of truth; the upload
 * panel reads the effective limit from `/api/mahasiswa/acceptance-letter/limit`
 * and only falls back to these constants when that request fails.
 */
export const ACCEPTANCE_LETTER_MAX_BYTES = 5 * 1024 * 1024

export const ACCEPTANCE_LETTER_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
]

export const ACCEPTANCE_LETTER_ACCEPT_ATTRIBUTE =
  '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'

export type UploadFileLike = {
  name: string
  size: number
  type: string
}

const sizeFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 1,
})

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '—'
  }

  if (bytes < 1024) {
    return `${sizeFormatter.format(bytes)} B`
  }

  const kilobytes = bytes / 1024

  if (kilobytes < 1024) {
    return `${sizeFormatter.format(kilobytes)} KB`
  }

  return `${sizeFormatter.format(kilobytes / 1024)} MB`
}

export function validateAcceptanceLetterFile(
  file: UploadFileLike,
  maxBytes: number = ACCEPTANCE_LETTER_MAX_BYTES,
): string | null {
  if (file.size <= 0) {
    return 'Berkas surat penerimaan kosong.'
  }

  if (file.size > maxBytes) {
    return `Ukuran surat penerimaan maksimal ${formatFileSize(maxBytes)}.`
  }

  if (!ACCEPTANCE_LETTER_ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Format surat penerimaan harus PDF, JPG, atau PNG.'
  }

  return null
}

/**
 * Trigger a browser download for an already authorized blob response. The
 * file is fetched through the authenticated API, never through a public URL.
 */
export function saveBlob(blob: Blob, filename: string): void {
  if (
    typeof URL.createObjectURL !== 'function' ||
    typeof document === 'undefined'
  ) {
    return
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
