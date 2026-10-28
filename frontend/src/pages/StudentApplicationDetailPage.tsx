import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  FileText,
  UserRound,
} from 'lucide-react'
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
import { ErrorState, LoadingState } from '../components/ui/States'
import { getApiErrorMessage } from '../lib/apiError'
import { formatApplicationDate, statusLabel } from '../lib/applications'
import { buttonClasses } from '../lib/buttonStyles'
import {
  getStudentApplication,
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

export default function StudentApplicationDetailPage() {
  const { user, isLoading: authLoading, logout } = useAuth()
  const { id } = useParams()
  const applicationId = Number(id)
  const hasValidId = Number.isInteger(applicationId) && applicationId > 0

  const [detailState, setDetailState] = useState<DetailState>({
    status: 'loading',
  })
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
        const application = await getStudentApplication(applicationId)

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
    setReloadKey((current) => current + 1)
  }

  function handleApplicationUpdated(updated: InternshipApplication) {
    setDetailState((current) =>
      current.status === 'ready' && current.application.id === updated.id
        ? { ...current, application: updated }
        : current,
    )
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
    message: 'Data pengajuan tidak ditemukan.',
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
          eyebrow="Mahasiswa"
          title="Detail pengajuan magang"
          description="Status, riwayat keputusan, surat penerimaan, dan DPM untuk pengajuan milik Anda."
          actions={
            <Link
              to="/mahasiswa/pengajuan"
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
            <Alert variant="info" title="Akses data">
              Halaman ini hanya memuat pengajuan milik akun yang sedang login.
              Riwayat komunikasi internal Admin/Prodi dengan mitra tidak
              ditampilkan di sini.
            </Alert>

            <div className="grid items-start gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText
                          className="size-5 text-primary"
                          aria-hidden="true"
                        />
                        <CardTitle>Status pengajuan</CardTitle>
                      </div>
                      <CardDescription>
                        Keputusan yang tercatat pada backend.
                      </CardDescription>
                    </div>
                    <ApplicationStatusBadge status={application.status} />
                  </div>
                </CardHeader>

                <CardContent>
                  <dl>
                    <DetailItem label="ID pengajuan">
                      <span className="font-mono">{application.id}</span>
                    </DetailItem>
                    <DetailItem label="Diajukan">
                      {formatApplicationDate(application.submittedAt)}
                    </DetailItem>
                    <DetailItem label="Keputusan dicatat">
                      {formatApplicationDate(application.reviewedAt)}
                    </DetailItem>
                    <DetailItem label="Catatan review">
                      {application.reviewNote ?? '—'}
                    </DetailItem>
                  </dl>

                  {application.status === 'menunggu' && (
                    <Alert
                      variant="info"
                      title="Menunggu hasil seleksi mitra"
                      className="mt-4"
                    >
                      Pengajuan sudah tersimpan. Keputusan akan tampil setelah
                      Admin/Prodi mencatat hasil seleksi mitra.
                    </Alert>
                  )}

                  {application.status === 'diterima' && (
                    <Alert
                      variant="success"
                      title="Pengajuan diterima"
                      className="mt-4"
                    >
                      Unggah surat penerimaan dari mitra pada panel di bawah.
                      DPM ditetapkan oleh Admin/Prodi setelah pengajuan
                      diterima.
                    </Alert>
                  )}

                  {application.status === 'ditolak' && (
                    <Alert
                      variant="danger"
                      title="Pengajuan ditolak"
                      className="mt-4"
                    >
                      Pengajuan ini dinyatakan ditolak. Status keputusan tidak
                      dapat diubah dari akun mahasiswa. Informasi mitra lain
                      tersedia di katalog mitra.
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Building2
                      className="size-5 text-primary"
                      aria-hidden="true"
                    />
                    <CardTitle>Mitra magang</CardTitle>
                  </div>
                  <CardDescription>
                    Data mitra yang dipilih pada pengajuan ini.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <dl>
                    <DetailItem label="Nama mitra">
                      {application.partner.name}
                    </DetailItem>
                    <DetailItem label="Deskripsi">
                      {application.partner.description ?? '—'}
                    </DetailItem>
                    <DetailItem label="Email">
                      {application.partner.email ?? '—'}
                    </DetailItem>
                    <DetailItem label="Kontak">
                      {application.partner.contact ?? '—'}
                    </DetailItem>
                    <DetailItem label="Alamat">
                      {application.partner.address ?? '—'}
                    </DetailItem>
                  </dl>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CalendarClock
                    className="size-5 text-primary"
                    aria-hidden="true"
                  />
                  <CardTitle>Riwayat pengajuan</CardTitle>
                </div>
                <CardDescription>
                  Kejadian yang benar-benar tercatat untuk pengajuan ini.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ol className="space-y-4 border-l border-border-subtle pl-4">
                  <li className="relative">
                    <span
                      className="absolute -left-[1.35rem] top-1 grid size-3 place-items-center rounded-full bg-primary"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-medium text-foreground">
                      Pengajuan dikirim
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatApplicationDate(application.submittedAt)}
                    </p>
                  </li>

                  {application.reviewedAt && (
                    <li className="relative">
                      <span
                        className="absolute -left-[1.35rem] top-1 grid size-3 place-items-center rounded-full bg-accent"
                        aria-hidden="true"
                      />
                      <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <CheckCircle2
                          className="size-4 text-success-foreground"
                          aria-hidden="true"
                        />
                        Keputusan dicatat: {statusLabel(application.status)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatApplicationDate(application.reviewedAt)}
                      </p>
                    </li>
                  )}

                  {application.acceptanceLetter && (
                    <li className="relative">
                      <span
                        className="absolute -left-[1.35rem] top-1 grid size-3 place-items-center rounded-full bg-primary"
                        aria-hidden="true"
                      />
                      <p className="text-sm font-medium text-foreground">
                        Surat penerimaan diunggah
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {application.acceptanceLetter.originalName} ·{' '}
                        {formatApplicationDate(
                          application.acceptanceLetter.uploadedAt,
                        )}
                      </p>
                    </li>
                  )}

                  {application.dpmPlacement && (
                    <li className="relative">
                      <span
                        className="absolute -left-[1.35rem] top-1 grid size-3 place-items-center rounded-full bg-primary"
                        aria-hidden="true"
                      />
                      <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <UserRound
                          className="size-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                        DPM ditetapkan
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {application.dpmPlacement.dpm?.name ??
                          'Akun DPM tidak tersedia'}{' '}
                        ·{' '}
                        {formatApplicationDate(
                          application.dpmPlacement.assignedAt,
                        )}
                      </p>
                    </li>
                  )}
                </ol>
              </CardContent>
            </Card>

            {application.status === 'diterima' && (
              <div className="grid items-start gap-4 lg:grid-cols-2">
                <AcceptanceLetterPanel
                  application={application}
                  mode="student"
                  onApplicationUpdated={handleApplicationUpdated}
                />
                <Card>
                  <CardHeader>
                    <CardTitle>Dosen Pembimbing Magang</CardTitle>
                    <CardDescription>
                      Penetapan DPM untuk pengajuan yang sudah diterima.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DpmSummary placement={application.dpmPlacement} />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </PageContainer>
    </AppLayout>
  )
}
