/**
 * Client-side mirror of `backend/config/internship.php`.
 *
 * BPMN does not define document format or size (OD-017). These values are
 * technical MVP defaults. The backend remains the source of truth; the upload
 * panel reads the effective size limit and MIME allowlist from
 * `/api/mahasiswa/acceptance-letter/limit` and only falls back to these
 * constants when that request fails or the server allowlist is empty.
 */
export const ACCEPTANCE_LETTER_MAX_BYTES = 5 * 1024 * 1024

export const ACCEPTANCE_LETTER_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
]

const MIME_TYPE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
}

const MIME_TYPE_EXTENSIONS: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
}

function effectiveAllowedMimeTypes(allowedMimeTypes: string[]): string[] {
  return allowedMimeTypes.length > 0
    ? allowedMimeTypes
    : ACCEPTANCE_LETTER_ALLOWED_MIME_TYPES
}

export function acceptanceLetterFormatLabel(
  allowedMimeTypes: string[] = ACCEPTANCE_LETTER_ALLOWED_MIME_TYPES,
): string {
  const labels = effectiveAllowedMimeTypes(allowedMimeTypes).map(
    (mimeType) => MIME_TYPE_LABELS[mimeType] ?? mimeType,
  )

  if (labels.length <= 1) {
    return labels[0] ?? 'format yang didukung'
  }

  return `${labels.slice(0, -1).join(', ')}, atau ${labels[labels.length - 1]}`
}

export function acceptanceLetterAcceptAttribute(
  allowedMimeTypes: string[] = ACCEPTANCE_LETTER_ALLOWED_MIME_TYPES,
): string {
  const mimeTypes = effectiveAllowedMimeTypes(allowedMimeTypes)
  const extensions = mimeTypes.flatMap(
    (mimeType) => MIME_TYPE_EXTENSIONS[mimeType] ?? [],
  )

  return [...new Set([...extensions, ...mimeTypes])].join(',')
}

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
  allowedMimeTypes: string[] = ACCEPTANCE_LETTER_ALLOWED_MIME_TYPES,
): string | null {
  if (file.size <= 0) {
    return 'Berkas surat penerimaan kosong.'
  }

  if (file.size > maxBytes) {
    return `Ukuran surat penerimaan maksimal ${formatFileSize(maxBytes)}.`
  }

  const acceptedMimeTypes = effectiveAllowedMimeTypes(allowedMimeTypes)

  if (!acceptedMimeTypes.includes(file.type)) {
    return `Format surat penerimaan harus ${acceptanceLetterFormatLabel(
      acceptedMimeTypes,
    )}.`
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
