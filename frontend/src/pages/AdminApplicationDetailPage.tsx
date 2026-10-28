import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { AcceptanceLetterPanel } from '../components/applications/AcceptanceLetterPanel'
import { ApplicationStatusBadge } from '../components/applications/ApplicationStatusBadge'
import { CommunicationLogPanel } from '../components/applications/CommunicationLogPanel'
import { DpmPlacementPanel } from '../components/applications/DpmPlacementPanel'
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
import { ErrorState, LoadingState } from '../components/ui/States'
import { Textarea } from '../components/ui/Textarea'
import { getApiErrorMessage, getFieldErrors } from '../lib/apiError'
import {
  formatApplicationDate,
  reviewInputFromForm,
  validateReviewForm,
  type ReviewFormErrors,
} from '../lib/applications'
import { buttonClasses } from '../lib/buttonStyles'
import {
  getAdminApplication,
  updateAdminApplicationStatus,
  type InternshipApplication,
} from '../services/applications'

type DetailState =
  | { status: 'loading' }
  | {
      status: 'ready'
      applicationId: number
      application: InternshipApplication
    }
  | { status: 'error'; applicationId: number; message: string }

export default function AdminApplicationDetailPage() {
  const { user, isLoading: authLoading, logout } = useAuth()
  const { id } = useParams()
  const applicationId = Number(id)
  const hasValidId = Number.isInteger(applicationId) && applicationId > 0

  const [detailState, setDetailState] = useState<DetailState>({
    status: 'loading',
  })
  const applicationIdRef = useRef(applicationId)
  const [reloadKey, setReloadKey] = useState(0)
  const [decision, setDecision] = useState('')
  const [reviewNote, setReviewNote] = useState('')
  const [reviewErrors, setReviewErrors] = useState<ReviewFormErrors>({})
  const [reviewError, setReviewError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    applicationIdRef.current = applicationId
  }, [applicationId])

  useEffect(() => {
    let active = true

    if (!hasValidId) {
      return () => {
        active = false
      }
    }

    async function loadApplication() {
      try {
        const application = await getAdminApplication(applicationId)

        if (active) {
          setDecision('')
          setReviewNote(application.reviewNote ?? '')
          setReviewErrors({})
          setReviewError('')
          setSuccessMessage('')
          setSaving(false)
          setDetailState({
            status: 'ready',
            applicationId,
            application,
          })
        }
      } catch (error: unknown) {
        if (active) {
          setDetailState({
            status: 'error',
            applicationId,
            message: getApiErrorMessage(
              error,
              'Detail pengajuan gagal dimuat. Coba lagi.',
            ),
          })
        }
      }
    }

    void loadApplication()

    return () => {
      active = false
    }
  }, [applicationId, hasValidId, reloadKey])

  function retry() {
    setDetailState({ status: 'loading' })
    setReviewError('')
    setSuccessMessage('')
    setReloadKey((current) => current + 1)
  }

  function handleApplicationUpdated(updated: InternshipApplication) {
    if (updated.id !== applicationIdRef.current) return

    setDetailState({
      status: 'ready',
      applicationId: applicationIdRef.current,
      application: updated,
    })
  }

  async function handleDecisionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (detailState.status !== 'ready' || saving) return

    const submittedApplicationId = detailState.application.id

    setReviewError('')
    setSuccessMessage('')

    const values = { status: decision, reviewNote }
    const errors = validateReviewForm(values)

    if (Object.keys(errors).length > 0) {
      setReviewErrors(errors)
      setReviewError('Periksa kembali keputusan yang dipilih.')
      return
    }

    setReviewErrors({})
    setSaving(true)

    try {
      const updated = await updateAdminApplicationStatus(
        submittedApplicationId,
        reviewInputFromForm(values),
      )

      if (applicationIdRef.current !== submittedApplicationId) return

      setDetailState({
        status: 'ready',
        applicationId: submittedApplicationId,
        application: updated,
      })
      setDecision('')
      setReviewNote('')
      setSuccessMessage('Keputusan pengajuan berhasil disimpan.')
    } catch (error: unknown) {
      if (applicationIdRef.current !== submittedApplicationId) return

      const fieldErrors = getFieldErrors(error)
      const nextErrors: ReviewFormErrors = {}

      if (fieldErrors.status) {
        nextErrors.status = fieldErrors.status
      }

      if (fieldErrors.review_note) {
        nextErrors.reviewNote = fieldErrors.review_note
      }

      if (Object.keys(nextErrors).length > 0) {
        setReviewErrors(nextErrors)
        setReviewError('Periksa kembali keputusan yang dikirim.')
      } else if (
        axios.isAxiosError(error) &&
        error.response?.status === 409
      ) {
        setReviewError(
          'Pengajuan ini sudah memiliki keputusan. Muat ulang detail untuk melihat status terbaru.',
        )
      } else {
        setReviewError(
          getApiErrorMessage(
            error,
            'Keputusan gagal disimpan. Coba lagi.',
          ),
        )
      }
    } finally {
      setSaving(false)
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

  const invalidIdState: DetailState = {
    status: 'error',
    applicationId,
    message: 'Pengajuan tidak ditemukan.',
  }
  const isCurrentDetail =
    detailState.status === 'loading' ||
    detailState.applicationId === applicationId
  const visibleState: DetailState = !hasValidId
    ? invalidIdState
    : isCurrentDetail
      ? detailState
      : { status: 'loading' }
  const application =
    visibleState.status === 'ready' ? visibleState.application : null

  return (
    <AppLayout
      user={user}
      authLoading={authLoading}
      onLogout={handleLogout}
      logoutLoading={logoutLoading}
    >
      <PageContainer>
        <PageHeader
          eyebrow="Admin / Prodi"
          title="Detail pengajuan"
          description="Periksa data pengajuan dan catat keputusan hasil seleksi mitra."
          actions={
            <Link
              to="/admin/pengajuan"
              className={buttonClasses({
                variant: 'outline',
                size: 'sm',
              })}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Kembali
            </Link>
          }
        />

        {visibleState.status === 'loading' && (
          <Card>
            <CardContent>
              <LoadingState message="Memuat detail pengajuan..." />
            </CardContent>
          </Card>
        )}

        {visibleState.status === 'error' && (
          <Card>
            <CardContent>
              <ErrorState
                title="Detail pengajuan gagal dimuat"
                message={visibleState.message}
                action={
                  hasValidId ? (
                    <Button variant="outline" size="sm" onClick={retry}>
                      Coba lagi
                    </Button>
                  ) : undefined
                }
              />
            </CardContent>
          </Card>
        )}

        {application && (
          <div className="space-y-4">
            {successMessage && (
              <Alert variant="success" title="Keputusan tersimpan">
                {successMessage}
              </Alert>
            )}

            <Alert variant="info" title="Cakupan modul">
              Modul ini mencatat keputusan Diterima atau Ditolak, menampilkan
              surat penerimaan, mencatat komunikasi manual dengan mitra, dan
              menetapkan DPM untuk pengajuan yang sudah diterima. Pengiriman
              email/surat otomatis, verifikasi dokumen, dan reversal keputusan
              belum ditetapkan (OD-016/OD-017/OD-020/OD-021).
            </Alert>

            <div className="grid items-start gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle>Ringkasan pengajuan</CardTitle>
                      <CardDescription>
                        Status dan metadata keputusan dari backend.
                      </CardDescription>
                    </div>

                    <ApplicationStatusBadge status={application.status} />
                  </div>
                </CardHeader>

                <CardContent>
                  <dl className="divide-y divide-border-subtle">
                    <DetailItem label="ID pengajuan">
                      <span className="font-mono">{application.id}</span>
                    </DetailItem>
                    <DetailItem label="Waktu pengajuan">
                      {formatApplicationDate(application.submittedAt)}
                    </DetailItem>
                    <DetailItem label="Waktu keputusan">
                      {formatApplicationDate(application.reviewedAt)}
                    </DetailItem>
                    <DetailItem label="Dicatat oleh">
                      {application.reviewer
                        ? `${application.reviewer.name} (${application.reviewer.email})`
                        : '—'}
                    </DetailItem>
                    <DetailItem label="Catatan review">
                      {application.reviewNote ?? '—'}
                    </DetailItem>
                  </dl>

                  {application.status === 'menunggu' && (
                    <Alert
                      variant="warning"
                      title="Belum ada keputusan"
                      className="mt-4"
                    >
                      Pengajuan masih menunggu hasil seleksi mitra. Pilih
                      Diterima atau Ditolak setelah hasil seleksi tersedia.
                    </Alert>
                  )}

                  {application.status === 'diterima' && (
                    <Alert
                      variant="success"
                      title="Pengajuan diterima"
                      className="mt-4"
                    >
                      Keputusan sudah dicatat. Perubahan keputusan belum
                      tersedia sampai aturan reversal ditetapkan
                      (OD-016/OD-021).
                    </Alert>
                  )}

                  {application.status === 'ditolak' && (
                    <Alert
                      variant="danger"
                      title="Pengajuan ditolak"
                      className="mt-4"
                    >
                      Keputusan sudah dicatat. Perubahan keputusan belum
                      tersedia sampai aturan reversal ditetapkan
                      (OD-016/OD-021).
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mahasiswa dan mitra</CardTitle>
                  <CardDescription>
                    Identitas pemohon dan mitra yang dipilih.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <dl className="divide-y divide-border-subtle">
                    <DetailItem label="Mahasiswa">
                      {application.student?.name ??
                        'Mahasiswa tidak tersedia'}
                    </DetailItem>
                    <DetailItem label="Email mahasiswa">
                      {application.student?.email ?? '—'}
                    </DetailItem>
                    <DetailItem label="Mitra">
                      {application.partner.name}
                    </DetailItem>
                    <DetailItem label="Email mitra">
                      {application.partner.email ?? '—'}
                    </DetailItem>
                    <DetailItem label="Kontak mitra">
                      {application.partner.contact ?? '—'}
                    </DetailItem>
                    <DetailItem label="Alamat mitra">
                      {application.partner.address ?? '—'}
                    </DetailItem>
                    <DetailItem label="Deskripsi mitra">
                      {application.partner.description ?? '—'}
                    </DetailItem>
                  </dl>
                </CardContent>
              </Card>
            </div>

            <CommunicationLogPanel applicationId={application.id} />

            {application.status === 'diterima' && (
              <div className="grid items-start gap-4 lg:grid-cols-2">
                <DpmPlacementPanel
                  application={application}
                  onApplicationUpdated={handleApplicationUpdated}
                />
                <AcceptanceLetterPanel
                  application={application}
                  mode="admin"
                />
              </div>
            )}

            {application.status === 'menunggu' && (
              <Card>
                <CardHeader>
                  <CardTitle>Catat keputusan</CardTitle>
                  <CardDescription>
                    Pilih hasil seleksi yang diterima dari mitra. Keputusan
                    akan terlihat oleh mahasiswa.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <form
                    className="space-y-4"
                    onSubmit={handleDecisionSubmit}
                    noValidate
                  >
                    <Field
                      id="decision-status"
                      label="Keputusan"
                      required
                      error={reviewErrors.status}
                      hint="Hanya Diterima atau Ditolak yang tersedia dari BPMN."
                    >
                      <Select
                        id="decision-status"
                        name="status"
                        value={decision}
                        onChange={(event) => {
                          setReviewError('')
                          setSuccessMessage('')
                          setReviewErrors((current) => ({
                            ...current,
                            status: undefined,
                          }))
                          setDecision(event.target.value)
                        }}
                        disabled={saving}
                      >
                        <option value="">Pilih keputusan</option>
                        <option value="diterima">Diterima</option>
                        <option value="ditolak">Ditolak</option>
                      </Select>
                    </Field>

                    <Field
                      id="review-note"
                      label="Catatan review"
                      error={reviewErrors.reviewNote}
                      hint="Opsional. Catatan ini terlihat oleh mahasiswa."
                    >
                      <Textarea
                        id="review-note"
                        name="review_note"
                        value={reviewNote}
                        onChange={(event) => {
                          setReviewError('')
                          setSuccessMessage('')
                          setReviewErrors((current) => ({
                            ...current,
                            reviewNote: undefined,
                          }))
                          setReviewNote(event.target.value)
                        }}
                        maxLength={5000}
                        rows={4}
                        disabled={saving}
                      />
                    </Field>

                    <Alert variant="warning" title="Keputusan final">
                      Setelah disimpan, keputusan tidak dapat diubah melalui
                      modul ini. Reversal dan koreksi menunggu keputusan
                      OD-016/OD-021.
                    </Alert>

                    {reviewError && (
                      <Alert
                        variant="danger"
                        title="Keputusan belum tersimpan"
                      >
                        {reviewError}
                      </Alert>
                    )}

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        isLoading={saving}
                        loadingLabel="Menyimpan…"
                        leftIcon={
                          <CheckCircle2
                            className="size-4"
                            aria-hidden="true"
                          />
                        }
                      >
                        Simpan keputusan
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </PageContainer>
    </AppLayout>
  )
}

function DetailItem({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:items-start">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm text-foreground">{children}</dd>
    </div>
  )
}
