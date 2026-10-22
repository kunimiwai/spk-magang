import { useEffect, useState, type FormEvent } from 'react'
import { ClipboardList, Send } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { AcceptanceLetterPanel } from '../components/applications/AcceptanceLetterPanel'
import { ApplicationStatusBadge } from '../components/applications/ApplicationStatusBadge'
import { DpmSummary } from '../components/applications/DpmSummary'
import { AppLayout } from '../components/layout/AppLayout'
import {
  PageContainer,
  PageHeader,
} from '../components/layout/PageContainer'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/Card'
import { Field } from '../components/ui/Field'
import { Select } from '../components/ui/Select'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { getApiErrorMessage, getFieldErrors } from '../lib/apiError'
import {
  formatApplicationDate,
  statusLabel,
} from '../lib/applications'
import {
  createStudentApplication,
  listStudentApplications,
  listStudentPartnerOptions,
  type InternshipApplication,
  type PartnerOption,
} from '../services/applications'

type ApplicationListState =
  | { status: 'loading' }
  | { status: 'ready'; applications: InternshipApplication[] }
  | { status: 'error'; message: string }

type PartnerOptionsState =
  | { status: 'loading' }
  | { status: 'ready'; options: PartnerOption[] }
  | { status: 'error'; message: string }

export default function StudentApplicationsPage() {
  const { user, isLoading: authLoading, logout } = useAuth()

  const [listState, setListState] = useState<ApplicationListState>({
    status: 'loading',
  })
  const [optionsState, setOptionsState] = useState<PartnerOptionsState>({
    status: 'loading',
  })
  const [selectedPartnerId, setSelectedPartnerId] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [listReloadKey, setListReloadKey] = useState(0)
  const [optionsReloadKey, setOptionsReloadKey] = useState(0)
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadApplications() {
      try {
        const applications = await listStudentApplications()

        if (active) {
          setListState({ status: 'ready', applications })
        }
      } catch (error: unknown) {
        if (active) {
          setListState({
            status: 'error',
            message: getApiErrorMessage(
              error,
              'Pengajuan gagal dimuat. Coba lagi.',
            ),
          })
        }
      }
    }

    void loadApplications()

    return () => {
      active = false
    }
  }, [listReloadKey])

  useEffect(() => {
    let active = true

    async function loadPartnerOptions() {
      try {
        const options = await listStudentPartnerOptions()

        if (active) {
          setOptionsState({ status: 'ready', options })
        }
      } catch (error: unknown) {
        if (active) {
          setOptionsState({
            status: 'error',
            message: getApiErrorMessage(
              error,
              'Daftar mitra gagal dimuat. Coba lagi.',
            ),
          })
        }
      }
    }

    void loadPartnerOptions()

    return () => {
      active = false
    }
  }, [optionsReloadKey])

  function retryApplications() {
    setListState({ status: 'loading' })
    setListReloadKey((current) => current + 1)
  }

  function retryPartnerOptions() {
    setOptionsState({ status: 'loading' })
    setOptionsReloadKey((current) => current + 1)
  }

  function handleApplicationUpdated(updated: InternshipApplication) {
    setListState((current) =>
      current.status === 'ready'
        ? {
            status: 'ready',
            applications: current.applications.map((application) =>
              application.id === updated.id ? updated : application,
            ),
          }
        : current,
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) return

    setFieldError('')
    setFormError('')
    setSuccessMessage('')

    if (selectedPartnerId === '') {
      setFieldError('Pilih mitra magang terlebih dahulu.')
      return
    }

    const partnerId = Number(selectedPartnerId)

    if (!Number.isInteger(partnerId) || partnerId <= 0) {
      setFieldError('Mitra magang tidak valid.')
      return
    }

    setSubmitting(true)

    try {
      const created = await createStudentApplication(partnerId)

      setListState((current) =>
        current.status === 'ready'
          ? {
              status: 'ready',
              applications: [created, ...current.applications],
            }
          : { status: 'ready', applications: [created] },
      )
      setSelectedPartnerId('')
      setSuccessMessage(
        `Pengajuan berhasil dikirim dengan status ${statusLabel(created.status)}.`,
      )
    } catch (error: unknown) {
      const fieldErrors = getFieldErrors(error)

      if (fieldErrors.partner_id) {
        setFieldError(fieldErrors.partner_id)
      } else {
        const firstFieldError = Object.values(fieldErrors)[0]

        setFormError(
          firstFieldError ??
            getApiErrorMessage(
              error,
              'Pengajuan gagal dikirim. Coba lagi.',
            ),
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLogout() {
    setLogoutLoading(true)

    try {
      await logout()
    } finally {
      setLogoutLoading(false)
    }
  }

  return (
    <AppLayout
      user={user}
      authLoading={authLoading}
      onLogout={handleLogout}
      logoutLoading={logoutLoading}
    >
      <PageContainer>
        <PageHeader
          eyebrow="Mahasiswa"
          title="Pengajuan magang"
          description="Ajukan permohonan ke mitra dan pantau status keputusan yang dicatat Admin/Prodi."
        />

        <div className="space-y-4">
          <Alert variant="warning" title="Rekomendasi belum menjadi filter">
            Pipeline rekomendasi K-Means/SAW masih belum siap. Daftar mitra di
            halaman ini berasal dari master data, bukan ranking rekomendasi.
            Pengajuan tetap dapat dikirim, tetapi hasil rekomendasi tidak
            ditampilkan sebagai hasil nyata.
          </Alert>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Send className="size-5 text-primary" aria-hidden="true" />
                <CardTitle>Ajukan pengajuan baru</CardTitle>
              </div>
              <CardDescription>
                Pilih mitra dari data API. Status awal selalu Menunggu hasil
                seleksi; pengajuan tidak otomatis diterima.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {optionsState.status === 'loading' && (
                <LoadingState message="Memuat daftar mitra..." />
              )}

              {optionsState.status === 'error' && (
                <ErrorState
                  title="Daftar mitra gagal dimuat"
                  message={optionsState.message}
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={retryPartnerOptions}
                    >
                      Coba lagi
                    </Button>
                  }
                />
              )}

              {optionsState.status === 'ready' &&
                (optionsState.options.length === 0 ? (
                  <EmptyState
                    title="Belum ada mitra"
                    description="Admin belum menambahkan data mitra magang. Pengajuan belum dapat dikirim sampai master mitra tersedia."
                  />
                ) : (
                  <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                    <Field
                      id="application-partner"
                      label="Mitra magang"
                      required
                      error={fieldError}
                      hint="Daftar mitra berasal dari API master mitra, bukan daftar hardcoded."
                    >
                      <Select
                        id="application-partner"
                        name="partner_id"
                        value={selectedPartnerId}
                        onChange={(event) => {
                          setFieldError('')
                          setFormError('')
                          setSuccessMessage('')
                          setSelectedPartnerId(event.target.value)
                        }}
                        disabled={submitting}
                      >
                        <option value="">Pilih mitra magang</option>
                        {optionsState.options.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </Select>
                    </Field>

                    <Alert variant="info" title="Status awal pengajuan">
                      Pengajuan disimpan dengan status Menunggu hasil seleksi
                      mitra.
                      Status Diterima atau Ditolak hanya dicatat setelah
                      Admin/Prodi menerima hasil seleksi mitra.
                    </Alert>

                    {formError && (
                      <Alert
                        variant="danger"
                        title="Pengajuan belum terkirim"
                      >
                        {formError}
                      </Alert>
                    )}

                    {successMessage && (
                      <Alert variant="success" title="Pengajuan terkirim">
                        {successMessage}
                      </Alert>
                    )}

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        isLoading={submitting}
                        loadingLabel="Mengirim…"
                        leftIcon={
                          <Send className="size-4" aria-hidden="true" />
                        }
                      >
                        Kirim pengajuan
                      </Button>
                    </div>
                  </form>
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ClipboardList
                  className="size-5 text-primary"
                  aria-hidden="true"
                />
                <CardTitle>Riwayat pengajuan</CardTitle>
              </div>
              <CardDescription>
                Hanya pengajuan milik akun yang sedang login yang ditampilkan.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {listState.status === 'loading' && (
                <LoadingState message="Memuat pengajuan..." />
              )}

              {listState.status === 'error' && (
                <ErrorState
                  title="Pengajuan gagal dimuat"
                  message={listState.message}
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={retryApplications}
                    >
                      Coba lagi
                    </Button>
                  }
                />
              )}

              {listState.status === 'ready' &&
                (listState.applications.length === 0 ? (
                  <EmptyState
                    title="Belum ada pengajuan"
                    description="Pengajuan yang Anda kirim akan muncul di sini beserta status dari backend."
                  />
                ) : (
                  <ul
                    className="space-y-3"
                    aria-label="Daftar pengajuan magang"
                  >
                    {listState.applications.map((application) => (
                      <li key={application.id}>
                        <article className="rounded-xl border border-border-subtle p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1">
                              <p className="font-semibold text-foreground">
                                {application.partner.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Diajukan{' '}
                                {formatApplicationDate(
                                  application.submittedAt,
                                )}
                              </p>
                            </div>

                            <ApplicationStatusBadge
                              status={application.status}
                            />
                          </div>

                          {application.partner.description && (
                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                              {application.partner.description}
                            </p>
                          )}

                          <dl className="mt-3 grid gap-2 border-t border-border-subtle pt-3 text-sm sm:grid-cols-2">
                            <div>
                              <dt className="text-muted-foreground">
                                Email mitra
                              </dt>
                              <dd className="break-all text-foreground">
                                {application.partner.email ?? '—'}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-muted-foreground">Kontak</dt>
                              <dd className="break-words text-foreground">
                                {application.partner.contact ?? '—'}
                              </dd>
                            </div>
                            <div className="sm:col-span-2">
                              <dt className="text-muted-foreground">Alamat</dt>
                              <dd className="break-words text-foreground">
                                {application.partner.address ?? '—'}
                              </dd>
                            </div>
                          </dl>

                          {application.status === 'menunggu' && (
                            <Alert
                              variant="info"
                              title="Menunggu hasil seleksi mitra"
                              className="mt-3"
                            >
                              Pengajuan sedang menunggu hasil seleksi mitra.
                              Keputusan akan tampil setelah Admin/Prodi
                              mencatatnya.
                            </Alert>
                          )}

                          {application.status === 'diterima' && (
                            <Alert
                              variant="success"
                              title="Pengajuan diterima"
                              className="mt-3"
                            >
                              <p>Pengajuan dinyatakan diterima.</p>
                              <p className="mt-1">
                                {application.reviewNote ??
                                  'Tidak ada catatan review.'}
                              </p>
                            </Alert>
                          )}

                          {application.status === 'ditolak' && (
                            <Alert
                              variant="danger"
                              title="Pengajuan ditolak"
                              className="mt-3"
                            >
                              <p>Pengajuan dinyatakan ditolak.</p>
                              <p className="mt-1">
                                {application.reviewNote ??
                                  'Tidak ada catatan review.'}
                              </p>
                            </Alert>
                          )}

                          {application.reviewedAt && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Keputusan dicatat{' '}
                              {formatApplicationDate(
                                application.reviewedAt,
                              )}
                            </p>
                          )}

                          {application.status === 'diterima' && (
                            <>
                              <AcceptanceLetterPanel
                                application={application}
                                mode="student"
                                onApplicationUpdated={handleApplicationUpdated}
                              />
                              <DpmSummary
                                placement={application.dpmPlacement}
                              />
                            </>
                          )}
                        </article>
                      </li>
                    ))}
                  </ul>
                ))}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppLayout>
  )
}
