import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  GraduationCap,
  Plus,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { ApplicationStatusBadge } from '../components/applications/ApplicationStatusBadge'
import { DpmSummary } from '../components/applications/DpmSummary'
import { AppLayout } from '../components/layout/AppLayout'
import {
  PageContainer,
  PageHeader,
} from '../components/layout/PageContainer'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/Card'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { Textarea } from '../components/ui/Textarea'
import { getApiErrorMessage } from '../lib/apiError'
import { formatApplicationDate } from '../lib/applications'
import { formatFileSize } from '../lib/documents'
import { buttonClasses } from '../lib/buttonStyles'
import {
  createDpmActivity,
  listDpmActivities,
  type DpmActivity,
} from '../services/dpmActivities'
import {
  getDpmApplication,
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

type ActivityListState =
  | { status: 'loading' }
  | { status: 'ready'; activities: DpmActivity[] }
  | { status: 'error'; message: string }

function DetailItem({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-1 border-b border-border-subtle py-3 last:border-b-0 sm:grid-cols-[11rem_1fr]">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm text-foreground">{children}</dd>
    </div>
  )
}

export default function DpmAssignmentDetailPage() {
  const { user, isLoading: authLoading, logout } = useAuth()
  const { id } = useParams()
  const applicationId = Number(id)
  const hasValidId = Number.isInteger(applicationId) && applicationId > 0

  const [detailState, setDetailState] = useState<DetailState>({
    status: 'loading',
  })
  const [activityListState, setActivityListState] = useState<ActivityListState>({
    status: 'loading',
  })
  const [activityReloadKey, setActivityReloadKey] = useState(0)
  const [newActivityType, setNewActivityType] = useState('')
  const [newActivityDescription, setNewActivityDescription] = useState('')
  const [newActivityOccurredAt, setNewActivityOccurredAt] = useState('')
  const [activityError, setActivityError] = useState('')
  const [activitySuccess, setActivitySuccess] = useState('')
  const [recording, setRecording] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    let active = true

    if (!hasValidId) {
      return () => {
        active = false
      }
    }

    async function loadApplication() {
      try {
        const application = await getDpmApplication(applicationId)

        if (active) {
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
              'Detail mahasiswa bimbingan gagal dimuat. Coba lagi.',
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

  useEffect(() => {
    let active = true

    async function loadActivities() {
      try {
        const { activities } = await listDpmActivities()

        if (active) {
          setActivityListState({ status: 'ready', activities })
        }
      } catch (error: unknown) {
        if (active) {
          setActivityListState({
            status: 'error',
            message: getApiErrorMessage(
              error,
              'Riwayat aktivitas bimbingan gagal dimuat. Coba lagi.',
            ),
          })
        }
      }
    }

    void loadActivities()

    return () => {
      active = false
    }
  }, [activityReloadKey])

  function retry() {
    setDetailState({ status: 'loading' })
    setActivityListState({ status: 'loading' })
    setReloadKey((key) => key + 1)
    setActivityReloadKey((key) => key + 1)
  }

  function resetActivityForm() {
    setNewActivityType('')
    setNewActivityDescription('')
    setNewActivityOccurredAt(new Date().toISOString().slice(0, 16))
    setActivityError('')
    setActivitySuccess('')
  }

  async function handleRecordActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (recording || detailState.status !== 'ready') return

    setActivityError('')
    setActivitySuccess('')

    if (!newActivityType.trim()) {
      setActivityError('Jenis aktivitas wajib diisi.')
      return
    }

    setRecording(true)

    try {
      await createDpmActivity(applicationId, {
        activity_type: newActivityType.trim(),
        description: newActivityDescription.trim() || null,
        occurred_at: newActivityOccurredAt || null,
      })

      setActivitySuccess('Aktivitas bimbingan berhasil dicatat.')
      resetActivityForm()
      setActivityReloadKey((key) => key + 1)
    } catch (error: unknown) {
      setActivityError(
        getApiErrorMessage(
          error,
          'Aktivitas bimbingan gagal dicatat. Coba lagi.',
        ),
      )
    } finally {
      setRecording(false)
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
    message: 'Data mahasiswa bimbingan tidak ditemukan.',
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

  const activities =
    activityListState.status === 'ready'
      ? activityListState.activities
      : []

  return (
    <AppLayout
      user={user}
      authLoading={authLoading}
      onLogout={handleLogout}
      logoutLoading={logoutLoading}
    >
      <PageContainer>
        <PageHeader
          eyebrow="Dosen Pembimbing Magang"
          title="Detail mahasiswa bimbingan"
          description="Informasi pengajuan dan penempatan yang ditugaskan kepada akun Anda."
          actions={
            <Link
              to="/dpm/bimbingan"
              className={buttonClasses({ variant: 'outline', size: 'sm' })}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Kembali
            </Link>
          }
        />

        {visibleState.status === 'loading' && (
          <Card>
            <CardContent>
              <LoadingState message="Memuat detail mahasiswa bimbingan..." />
            </CardContent>
          </Card>
        )}

        {visibleState.status === 'error' && (
          <Card>
            <CardContent>
              <ErrorState
                title="Detail mahasiswa bimbingan gagal dimuat"
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
            <Alert variant="info" title="Cakupan akses DPM">
              Halaman ini hanya menampilkan pengajuan yang ditugaskan kepada
              Anda. Catatan review internal Admin/Prodi dan riwayat komunikasi
              mitra tidak ditampilkan. Surat penerimaan hanya tampil sebagai
              metadata; unduhannya tidak tersedia di modul DPM. Tindakan
              bimbingan dan penilaian menunggu keputusan OD-024/OD-025.
            </Alert>

            <div className="grid items-start gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <UserRound
                          className="size-5 text-primary"
                          aria-hidden="true"
                        />
                        <CardTitle>Mahasiswa</CardTitle>
                      </div>
                      <CardDescription>
                        Identitas pemohon dari pengajuan yang ditugaskan.
                      </CardDescription>
                    </div>
                    <ApplicationStatusBadge status={application.status} />
                  </div>
                </CardHeader>

                <CardContent>
                  <dl>
                    <DetailItem label="Nama">
                      {application.student?.name ?? 'Mahasiswa tidak tersedia'}
                    </DetailItem>
                    <DetailItem label="Email">
                      {application.student?.email ?? '—'}
                    </DetailItem>
                    <DetailItem label="Waktu pengajuan">
                      {formatApplicationDate(application.submittedAt)}
                    </DetailItem>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="space-y-1">
                    <CardTitle>Mitra magang</CardTitle>
                    <CardDescription>
                      Mitra yang dipilih pada pengajuan ini.
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent>
                  <dl>
                    <DetailItem label="Nama mitra">
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
                  </dl>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <GraduationCap
                    className="size-5 text-primary"
                    aria-hidden="true"
                  />
                  <CardTitle>Penempatan DPM</CardTitle>
                </div>
                <CardDescription>
                  Penetapan yang menghubungkan pengajuan ini dengan akun Anda.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <DpmSummary placement={application.dpmPlacement} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText
                    className="size-5 text-primary"
                    aria-hidden="true"
                  />
                  <CardTitle>Surat penerimaan</CardTitle>
                </div>
                <CardDescription>
                  Metadata dokumen privat. Unduhan tidak tersedia melalui
                  modul DPM.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {application.acceptanceLetter ? (
                  <dl>
                    <DetailItem label="Nama berkas">
                      {application.acceptanceLetter.originalName}
                    </DetailItem>
                    <DetailItem label="Tipe berkas">
                      {application.acceptanceLetter.mimeType}
                    </DetailItem>
                    <DetailItem label="Ukuran">
                      {formatFileSize(application.acceptanceLetter.size)}
                    </DetailItem>
                    <DetailItem label="Diunggah">
                      {formatApplicationDate(
                        application.acceptanceLetter.uploadedAt,
                      )}
                    </DetailItem>
                  </dl>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Mahasiswa belum mengunggah surat penerimaan.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Aktivitas bimbingan DPM */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText
                        className="size-5 text-primary"
                        aria-hidden="true"
                      />
                      <CardTitle>Aktivitas Bimbingan</CardTitle>
                    </div>
                    <CardDescription>
                      Catatan kegiatan bimbingan yang dilakukan oleh DPM untuk
                      mahasiswa ini.
                    </CardDescription>
                  </div>
                  {activityListState.status === 'ready' && (
                    <Badge variant="neutral">{activities.length} aktivitas</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {activityListState.status === 'loading' && (
                  <LoadingState message="Memuat riwayat aktivitas..." />
                )}

                {activityListState.status === 'error' && (
                  <Alert variant="danger" title="Riwayat gagal dimuat">
                    <div className="space-y-3">
                      <p>{activityListState.message}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActivityReloadKey((k) => k + 1)}
                      >
                        Coba lagi
                      </Button>
                    </div>
                  </Alert>
                )}

                {activityListState.status === 'ready' && (
                  <>
                    {activities.length === 0 ? (
                      <EmptyState
                        title="Belum ada aktivitas bimbingan"
                        description="Catat aktivitas bimbingan pertama Anda melalui formulir di bawah."
                      />
                    ) : (
                      <div className="space-y-3">
                        {activities.map((activity) => (
                          <div
                            key={activity.id}
                            className="border-b border-border-subtle pb-3 last:border-b-0"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                              <span
                                className="text-xs font-mono font-medium text-muted-foreground"
                              >
                                {activity.activity_type}
                              </span>
                              <span
                                className="text-xs text-muted-foreground"
                              >
                                {formatApplicationDate(activity.occurred_at)}
                              </span>
                            </div>
                            {activity.description && (
                              <p className="text-sm text-foreground whitespace-pre-wrap">
                                {activity.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Dicatat oleh{' '}
                              {activity.dpm?.name ?? 'DPM tidak tersedia'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-4 border-t border-border-subtle">
                      <div className="flex items-center gap-2 mb-3">
                        <Plus className="size-4" aria-hidden="true" />
                        <h4 className="text-sm font-semibold text-foreground">
                          Catat aktivitas baru
                        </h4>
                      </div>

                      <form onSubmit={handleRecordActivity} className="space-y-3" noValidate>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-foreground">
                              Jenis aktivitas
                            </label>
                            <input
                              type="text"
                              value={newActivityType}
                              onChange={(e) =>
                                setNewActivityType(e.target.value)
                              }
                              className="input w-full"
                              placeholder="Contoh: Konsultasi proposal, Review laporan, Pembimbingan lapangan"
                              disabled={recording}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-foreground">
                              Waktu aktivitas
                            </label>
                            <input
                              type="datetime-local"
                              value={newActivityOccurredAt}
                              onChange={(e) =>
                                setNewActivityOccurredAt(e.target.value)
                              }
                              className="input w-full"
                              disabled={recording}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-sm font-medium text-foreground">
                            Deskripsi
                          </label>
                          <Textarea
                            value={newActivityDescription}
                            onChange={(e) =>
                              setNewActivityDescription(e.target.value)
                            }
                            rows={3}
                            placeholder="Jelaskan singkat kegiatan bimbingan yang dilakukan."
                            disabled={recording}
                          />
                        </div>

                        {activityError && (
                          <Alert variant="danger" title="Aktivitas gagal dicatat">
                            {activityError}
                          </Alert>
                        )}

                        {activitySuccess && (
                          <Alert variant="success" title="Aktivitas dicatat">
                            {activitySuccess}
                          </Alert>
                        )}

                        <Button
                          type="submit"
                          disabled={recording || !newActivityType.trim()}
                          isLoading={recording}
                          loadingLabel="Menyimpan…"
                        >
                          Simpan aktivitas
                        </Button>
                      </form>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </PageContainer>
    </AppLayout>
  )
}
