import { useEffect, useState, type FormEvent } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { Alert } from '../ui/Alert'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { EmptyState, LoadingState } from '../ui/States'
import { Textarea } from '../ui/Textarea'
import {
  getApiErrorMessage,
  getApiResponseMessage,
  getFieldErrors,
} from '../../lib/apiError'
import { formatApplicationDate } from '../../lib/applications'
import {
  communicationChannelLabel,
  communicationDirectionLabel,
  communicationInputFromForm,
  nowForDateTimeLocal,
  sortCommunicationsNewestFirst,
  validateCommunicationForm,
  type ApplicationCommunication,
  type CommunicationFormErrors,
  type CommunicationFormValues,
} from '../../lib/communications'
import {
  createApplicationCommunication,
  listApplicationCommunications,
} from '../../services/communications'

type CommunicationLogPanelProps = {
  applicationId: number
}

type ListState =
  | { status: 'loading' }
  | { status: 'ready'; communications: ApplicationCommunication[] }
  | { status: 'error'; message: string }

const emptyForm = (): CommunicationFormValues => ({
  direction: 'outbound',
  channel: 'email',
  occurredAt: nowForDateTimeLocal(),
  summary: '',
})

export function CommunicationLogPanel({
  applicationId,
}: CommunicationLogPanelProps) {
  const [listState, setListState] = useState<ListState>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)
  const [form, setForm] = useState<CommunicationFormValues>(emptyForm)
  const [formErrors, setFormErrors] = useState<CommunicationFormErrors>({})
  const [requestError, setRequestError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    async function loadCommunications() {
      try {
        const communications =
          await listApplicationCommunications(applicationId)

        if (active) {
          setListState({ status: 'ready', communications })
        }
      } catch (error: unknown) {
        if (active) {
          setListState({
            status: 'error',
            message: getApiErrorMessage(
              error,
              'Riwayat komunikasi gagal dimuat. Coba lagi.',
            ),
          })
        }
      }
    }

    void loadCommunications()

    return () => {
      active = false
    }
  }, [applicationId, reloadKey])

  function updateForm<K extends keyof CommunicationFormValues>(
    key: K,
    value: CommunicationFormValues[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
    setFormErrors((current) => ({ ...current, [key]: undefined }))
    setRequestError('')
    setSuccessMessage('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (saving) return

    const errors = validateCommunicationForm(form)

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      setRequestError('Periksa kembali data komunikasi.')
      return
    }

    setFormErrors({})
    setRequestError('')
    setSuccessMessage('')
    setSaving(true)

    try {
      const created = await createApplicationCommunication(
        applicationId,
        communicationInputFromForm(form),
      )

      setListState((current) =>
        current.status === 'ready'
          ? {
              status: 'ready',
              communications: sortCommunicationsNewestFirst([
                created,
                ...current.communications.filter(
                  (communication) => communication.id !== created.id,
                ),
              ]),
            }
          : current,
      )
      setForm(emptyForm())
      setSuccessMessage('Komunikasi mitra berhasil dicatat.')
      if (listState.status !== 'ready') {
        setReloadKey((current) => current + 1)
      }
    } catch (error: unknown) {
      const fieldErrors = getFieldErrors(error)
      const nextErrors: CommunicationFormErrors = {}

      if (fieldErrors.direction) nextErrors.direction = fieldErrors.direction
      if (fieldErrors.channel) nextErrors.channel = fieldErrors.channel
      if (fieldErrors.occurred_at) nextErrors.occurredAt = fieldErrors.occurred_at
      if (fieldErrors.summary) nextErrors.summary = fieldErrors.summary

      if (Object.keys(nextErrors).length > 0) {
        setFormErrors(nextErrors)
        setRequestError('Periksa kembali data komunikasi.')
      } else {
        setRequestError(
          getApiResponseMessage(error) ??
            getApiErrorMessage(
              error,
              'Komunikasi gagal dicatat. Coba lagi.',
            ),
        )
      }

      // A newly recorded item may exist even if the follow-up list refresh
      // failed, so make the retry path explicit.
      if (listState.status === 'error') {
        setReloadKey((current) => current + 1)
      }
    } finally {
      setSaving(false)
    }
  }

  function retryList() {
    setListState({ status: 'loading' })
    setReloadKey((current) => current + 1)
  }

  return (
    <section
      className="rounded-xl border border-border-subtle bg-card p-4 sm:p-5"
      aria-labelledby={`communication-log-${applicationId}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-5 text-primary" aria-hidden="true" />
          <div>
            <h3
              id={`communication-log-${applicationId}`}
              className="font-semibold text-foreground"
            >
              Komunikasi mitra
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Catatan manual pengiriman dan balasan di luar sistem.
            </p>
          </div>
        </div>

        {listState.status === 'ready' && (
          <Badge variant="neutral">{listState.communications.length} catatan</Badge>
        )}
      </div>

      <Alert variant="info" title="Bukan pengiriman otomatis" className="mt-4">
        Sistem tidak mengirim email atau surat. Catat aktivitas yang sudah
        dilakukan Admin/Prodi. Pencatatan ini tidak mengubah status pengajuan;
        status hasil seleksi tetap diisi melalui keputusan pengajuan.
      </Alert>

      <div className="mt-4 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.9fr)]">
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            Riwayat komunikasi
          </h4>

          <div className="mt-2">
            {listState.status === 'loading' && (
              <LoadingState message="Memuat riwayat komunikasi..." />
            )}

            {listState.status === 'error' && (
              <Alert variant="danger" title="Riwayat gagal dimuat">
                <div className="space-y-3">
                  <p>{listState.message}</p>
                  <Button variant="outline" size="sm" onClick={retryList}>
                    Coba lagi
                  </Button>
                </div>
              </Alert>
            )}

            {listState.status === 'ready' &&
              (listState.communications.length === 0 ? (
                <EmptyState
                  title="Belum ada catatan komunikasi"
                  description="Catat pengiriman pengajuan atau balasan mitra setelah aktivitas tersebut dilakukan."
                />
              ) : (
                <ol className="divide-y divide-border-subtle border-y border-border-subtle">
                  {listState.communications.map((communication) => (
                    <li key={communication.id} className="space-y-1.5 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            communication.direction === 'inbound'
                              ? 'success'
                              : 'info'
                          }
                        >
                          {communicationDirectionLabel(communication.direction)}
                        </Badge>
                        <Badge variant="neutral">
                          {communicationChannelLabel(communication.channel)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatApplicationDate(communication.occurredAt)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                        {communication.summary}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Dicatat oleh{' '}
                        {communication.recorder?.name ?? 'pengguna yang telah dihapus'}
                      </p>
                    </li>
                  ))}
                </ol>
              ))}
          </div>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit} noValidate>
          <h4 className="text-sm font-semibold text-foreground">
            Catat komunikasi
          </h4>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <Field
              id={`communication-direction-${applicationId}`}
              label="Arah"
              required
              error={formErrors.direction}
            >
              <Select
                id={`communication-direction-${applicationId}`}
                name="direction"
                value={form.direction}
                onChange={(event) =>
                  updateForm('direction', event.target.value)
                }
                disabled={saving}
              >
                <option value="outbound">Dikirim ke mitra</option>
                <option value="inbound">Balasan mitra</option>
              </Select>
            </Field>

            <Field
              id={`communication-channel-${applicationId}`}
              label="Kanal"
              required
              error={formErrors.channel}
              hint="D-003: email atau surat."
            >
              <Select
                id={`communication-channel-${applicationId}`}
                name="channel"
                value={form.channel}
                onChange={(event) =>
                  updateForm('channel', event.target.value)
                }
                disabled={saving}
              >
                <option value="email">Email</option>
                <option value="surat">Surat</option>
              </Select>
            </Field>
          </div>

          <Field
            id={`communication-occurred-at-${applicationId}`}
            label="Waktu komunikasi"
            required
            error={formErrors.occurredAt}
          >
            <Input
              id={`communication-occurred-at-${applicationId}`}
              name="occurred_at"
              type="datetime-local"
              value={form.occurredAt}
              onChange={(event) =>
                updateForm('occurredAt', event.target.value)
              }
              disabled={saving}
            />
          </Field>

          <Field
            id={`communication-summary-${applicationId}`}
            label="Ringkasan"
            required
            error={formErrors.summary}
            hint="Maksimal 2000 karakter. Jangan menulis kredensial atau data sensitif."
          >
            <Textarea
              id={`communication-summary-${applicationId}`}
              name="summary"
              value={form.summary}
              onChange={(event) => updateForm('summary', event.target.value)}
              disabled={saving}
              maxLength={2000}
              placeholder="Contoh: Berkas dikirim ke email resmi mitra."
            />
          </Field>

          {requestError && (
            <Alert variant="danger" title="Komunikasi belum tercatat">
              {requestError}
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success" title="Tersimpan">
              {successMessage}
            </Alert>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={saving}
              loadingLabel="Menyimpan…"
              leftIcon={<Send className="size-4" aria-hidden="true" />}
            >
              Simpan catatan
            </Button>
          </div>
        </form>
      </div>
    </section>
  )
}
