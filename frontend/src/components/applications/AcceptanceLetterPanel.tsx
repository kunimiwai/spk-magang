import { useEffect, useState, type FormEvent } from 'react'
import { Download, FileCheck2, Upload } from 'lucide-react'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import {
  getApiErrorMessage,
  getApiResponseMessage,
  getFieldErrors,
} from '../../lib/apiError'
import { formatApplicationDate } from '../../lib/applications'
import {
  ACCEPTANCE_LETTER_ALLOWED_MIME_TYPES,
  ACCEPTANCE_LETTER_MAX_BYTES,
  acceptanceLetterAcceptAttribute,
  acceptanceLetterFormatLabel,
  formatFileSize,
  saveBlob,
  validateAcceptanceLetterFile,
} from '../../lib/documents'
import {
  downloadAdminAcceptanceLetter,
  downloadStudentAcceptanceLetter,
  getAcceptanceLetterLimit,
  uploadStudentAcceptanceLetter,
  type InternshipApplication,
} from '../../services/applications'

type AcceptanceLetterPanelProps = {
  application: InternshipApplication
  mode: 'student' | 'admin'
  allowUpload?: boolean
  onApplicationUpdated?: (application: InternshipApplication) => void
}

export function AcceptanceLetterPanel({
  application,
  mode,
  allowUpload = true,
  onApplicationUpdated,
}: AcceptanceLetterPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [maxSizeBytes, setMaxSizeBytes] = useState(
    ACCEPTANCE_LETTER_MAX_BYTES,
  )
  const [allowedMimeTypes, setAllowedMimeTypes] = useState<string[]>(
    ACCEPTANCE_LETTER_ALLOWED_MIME_TYPES,
  )

  const letter = application.acceptanceLetter
  const canUpload =
    mode === 'student' && allowUpload && letter === null

  useEffect(() => {
    if (mode !== 'student' || !allowUpload) return

    let active = true

    // The runtime may enforce a lower limit than the application config
    // (PHP upload_max_filesize/post_max_size). Keep the client default when
    // this request fails; the server still validates every upload.
    getAcceptanceLetterLimit()
      .then((limit) => {
        if (!active) return

        setMaxSizeBytes(limit.maxSizeBytes)

        if (limit.allowedMimeTypes.length > 0) {
          setAllowedMimeTypes(limit.allowedMimeTypes)
        }
      })
      .catch(() => undefined)

    return () => {
      active = false
    }
  }, [mode, allowUpload])

  function resetMessages() {
    setFileError('')
    setRequestError('')
    setSuccessMessage('')
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (uploading || !canUpload) return

    resetMessages()

    if (selectedFile === null) {
      setFileError('Pilih berkas surat penerimaan terlebih dahulu.')
      return
    }

    const validationError = validateAcceptanceLetterFile(
      selectedFile,
      maxSizeBytes,
      allowedMimeTypes,
    )

    if (validationError !== null) {
      setFileError(validationError)
      return
    }

    setUploading(true)

    try {
      const updated = await uploadStudentAcceptanceLetter(
        application.id,
        selectedFile,
      )

      onApplicationUpdated?.(updated)
      setSelectedFile(null)
      setSuccessMessage('Surat penerimaan berhasil diunggah.')
    } catch (error: unknown) {
      const fieldErrors = getFieldErrors(error)

      if (fieldErrors.file) {
        setFileError(fieldErrors.file)
      } else {
        setRequestError(
          getApiResponseMessage(error) ??
            getApiErrorMessage(
              error,
              'Surat penerimaan gagal diunggah. Coba lagi.',
            ),
        )
      }
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload() {
    if (downloading || letter === null) return

    resetMessages()
    setDownloading(true)

    try {
      const blob =
        mode === 'student'
          ? await downloadStudentAcceptanceLetter(application.id)
          : await downloadAdminAcceptanceLetter(application.id)

      saveBlob(blob, letter.originalName)
      setSuccessMessage('Surat penerimaan berhasil diunduh.')
    } catch (error: unknown) {
      setRequestError(
        getApiResponseMessage(error) ??
          getApiErrorMessage(
            error,
            'Surat penerimaan gagal diunduh. Coba lagi.',
          ),
      )
    } finally {
      setDownloading(false)
    }
  }

  if (application.status !== 'diterima') {
    return null
  }

  return (
    <section
      className="mt-3 rounded-xl border border-border-subtle p-4"
      aria-labelledby={`acceptance-letter-${application.id}`}
    >
      <div className="flex items-center gap-2">
        <FileCheck2 className="size-5 text-primary" aria-hidden="true" />
        <h3
          id={`acceptance-letter-${application.id}`}
          className="font-semibold text-foreground"
        >
          Surat penerimaan
        </h3>
      </div>

      {letter !== null ? (
        <div className="mt-3 space-y-3">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Nama berkas</dt>
              <dd className="break-all text-foreground">
                {letter.originalName}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Ukuran</dt>
              <dd className="text-foreground">{formatFileSize(letter.size)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tipe berkas</dt>
              <dd className="break-all text-foreground">{letter.mimeType}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Diunggah</dt>
              <dd className="text-foreground">
                {formatApplicationDate(letter.uploadedAt)}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              isLoading={downloading}
              loadingLabel="Menyiapkan…"
              leftIcon={<Download className="size-4" aria-hidden="true" />}
            >
              Unduh surat
            </Button>
          </div>

          {mode === 'student' && (
            <p className="text-xs text-muted-foreground">
              Penggantian surat penerimaan belum tersedia sampai aturan revisi
              dokumen ditetapkan (OD-017).
            </p>
          )}

          {requestError && (
            <Alert variant="danger" title="Surat gagal diunduh">
              {requestError}
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success" title="Berhasil">
              {successMessage}
            </Alert>
          )}
        </div>
      ) : mode === 'admin' ? (
        <Alert variant="warning" title="Belum diunggah" className="mt-3">
          Mahasiswa belum mengunggah surat penerimaan.
        </Alert>
      ) : canUpload ? (
        <form className="mt-3 space-y-3" onSubmit={handleUpload} noValidate>
          <Field
            id={`acceptance-letter-file-${application.id}`}
            label="Berkas surat penerimaan"
            required
            error={fileError}
            hint={`${acceptanceLetterFormatLabel(
              allowedMimeTypes,
            )}. Maksimal ${formatFileSize(
              maxSizeBytes,
            )}. Berkas disimpan di penyimpanan privat dan hanya dapat diakses melalui autentikasi.`}
          >
            <Input
              id={`acceptance-letter-file-${application.id}`}
              name="file"
              type="file"
              accept={acceptanceLetterAcceptAttribute(allowedMimeTypes)}
              onChange={(event) => {
                resetMessages()
                setSelectedFile(event.target.files?.[0] ?? null)
              }}
              disabled={uploading}
            />
          </Field>

          <Alert variant="info" title="Dokumen privat">
            Surat penerimaan tidak memiliki tautan publik. Unduhan melewati
            pemeriksaan otorisasi backend.
          </Alert>

          {requestError && (
            <Alert variant="danger" title="Surat belum terunggah">
              {requestError}
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success" title="Surat terunggah">
              {successMessage}
            </Alert>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={uploading}
              loadingLabel="Mengunggah…"
              leftIcon={<Upload className="size-4" aria-hidden="true" />}
            >
              Unggah surat
            </Button>
          </div>
        </form>
      ) : (
        <Alert variant="warning" title="Belum diunggah" className="mt-3">
          Buka halaman Pengajuan Magang untuk mengunggah surat penerimaan.
        </Alert>
      )}
    </section>
  )
}
