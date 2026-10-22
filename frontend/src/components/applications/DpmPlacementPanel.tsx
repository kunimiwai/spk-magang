import { useEffect, useState, type FormEvent } from 'react'
import { GraduationCap, UserCheck } from 'lucide-react'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { Select } from '../ui/Select'
import { EmptyState, ErrorState, LoadingState } from '../ui/States'
import {
  getApiErrorMessage,
  getApiResponseMessage,
  getFieldErrors,
} from '../../lib/apiError'
import {
  assignDpm,
  listDpmOptions,
  type DpmOption,
  type InternshipApplication,
} from '../../services/applications'
import { DpmSummary } from './DpmSummary'

type OptionsState =
  | { status: 'loading' }
  | { status: 'ready'; options: DpmOption[] }
  | { status: 'error'; message: string }

type DpmPlacementPanelProps = {
  application: InternshipApplication
  onApplicationUpdated: (application: InternshipApplication) => void
}

export function DpmPlacementPanel({
  application,
  onApplicationUpdated,
}: DpmPlacementPanelProps) {
  const [optionsState, setOptionsState] = useState<OptionsState>({
    status: 'loading',
  })
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedDpmId, setSelectedDpmId] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const placement = application.dpmPlacement
  const canPlace = application.status === 'diterima' && placement === null

  useEffect(() => {
    if (!canPlace) return

    let active = true

    async function loadOptions() {
      try {
        const options = await listDpmOptions()

        if (active) {
          setOptionsState({ status: 'ready', options })
        }
      } catch (error: unknown) {
        if (active) {
          setOptionsState({
            status: 'error',
            message: getApiErrorMessage(
              error,
              'Daftar DPM gagal dimuat. Coba lagi.',
            ),
          })
        }
      }
    }

    void loadOptions()

    return () => {
      active = false
    }
  }, [canPlace, application.id, reloadKey])

  function retryOptions() {
    setOptionsState({ status: 'loading' })
    setRequestError('')
    setSuccessMessage('')
    setReloadKey((current) => current + 1)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (saving || !canPlace) return

    setFieldError('')
    setRequestError('')
    setSuccessMessage('')

    if (selectedDpmId === '') {
      setFieldError('Pilih dosen pembimbing magang terlebih dahulu.')
      return
    }

    const dpmId = Number(selectedDpmId)

    if (!Number.isInteger(dpmId) || dpmId <= 0) {
      setFieldError('Dosen pembimbing magang tidak valid.')
      return
    }

    setSaving(true)

    try {
      const updated = await assignDpm(application.id, dpmId)

      onApplicationUpdated(updated)
      setSelectedDpmId('')
      setSuccessMessage('Dosen pembimbing magang berhasil ditetapkan.')
    } catch (error: unknown) {
      const fieldErrors = getFieldErrors(error)

      if (fieldErrors.dpm_id) {
        setFieldError(fieldErrors.dpm_id)
      } else {
        setRequestError(
          getApiResponseMessage(error) ??
            getApiErrorMessage(
              error,
              'Penempatan DPM gagal disimpan. Coba lagi.',
            ),
        )
      }
    } finally {
      setSaving(false)
    }
  }

  if (application.status !== 'diterima') {
    return null
  }

  return (
    <section
      className="rounded-xl border border-border-subtle p-4"
      aria-labelledby={`dpm-placement-${application.id}`}
    >
      <div className="flex items-center gap-2">
        <GraduationCap className="size-5 text-primary" aria-hidden="true" />
        <h3
          id={`dpm-placement-${application.id}`}
          className="font-semibold text-foreground"
        >
          Penempatan DPM
        </h3>
      </div>

      {placement !== null ? (
        <div className="mt-3 space-y-3">
          {successMessage && (
            <Alert variant="success" title="DPM ditetapkan">
              {successMessage}
            </Alert>
          )}
          <DpmSummary placement={placement} />
          <Alert variant="info" title="Penggantian belum tersedia">
            Penggantian DPM belum didukung sampai kriteria, persetujuan, dan
            aturan penggantian ditetapkan (OD-024).
          </Alert>
          {requestError && (
            <Alert variant="danger" title="Penempatan gagal">
              {requestError}
            </Alert>
          )}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {successMessage && (
            <Alert variant="success" title="DPM ditetapkan">
              {successMessage}
            </Alert>
          )}

          {optionsState.status === 'loading' && (
            <LoadingState message="Memuat akun DPM..." />
          )}

          {optionsState.status === 'error' && (
            <ErrorState
              title="Daftar DPM gagal dimuat"
              message={optionsState.message}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retryOptions}
                >
                  Coba lagi
                </Button>
              }
            />
          )}

          {optionsState.status === 'ready' &&
            (optionsState.options.length === 0 ? (
              <EmptyState
                title="Belum ada akun DPM"
                description="Belum ada pengguna dengan role DPM. Penempatan tidak dapat dilakukan sampai akun DPM tersedia; aplikasi tidak membuat akun dummy."
              />
            ) : (
              <form className="space-y-3" onSubmit={handleSubmit} noValidate>
                <Field
                  id={`dpm-select-${application.id}`}
                  label="Dosen pembimbing magang"
                  required
                  error={fieldError}
                  hint="Hanya akun dengan role DPM yang dapat dipilih."
                >
                  <Select
                    id={`dpm-select-${application.id}`}
                    name="dpm_id"
                    value={selectedDpmId}
                    onChange={(event) => {
                      setFieldError('')
                      setRequestError('')
                      setSuccessMessage('')
                      setSelectedDpmId(event.target.value)
                    }}
                    disabled={saving}
                  >
                    <option value="">Pilih DPM</option>
                    {optionsState.options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                        {option.email ? ` — ${option.email}` : ''}
                      </option>
                    ))}
                  </Select>
                </Field>

                {requestError && (
                  <Alert variant="danger" title="Penempatan gagal">
                    {requestError}
                  </Alert>
                )}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    isLoading={saving}
                    loadingLabel="Menyimpan…"
                    leftIcon={
                      <UserCheck className="size-4" aria-hidden="true" />
                    }
                  >
                    Tetapkan DPM
                  </Button>
                </div>
              </form>
            ))}
        </div>
      )}
    </section>
  )
}
