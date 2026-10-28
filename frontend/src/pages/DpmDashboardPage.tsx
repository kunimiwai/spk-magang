import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  FileText,
  GraduationCap,
  RefreshCw,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { ApplicationStatusBadge } from '../components/applications/ApplicationStatusBadge'
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
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { getApiErrorMessage } from '../lib/apiError'
import { formatApplicationDate } from '../lib/applications'
import { buttonClasses } from '../lib/buttonStyles'
import {
  listDpmApplications,
  type InternshipApplication,
} from '../services/applications'

type AssignmentsState =
  | { status: 'loading' }
  | { status: 'ready'; applications: InternshipApplication[] }
  | { status: 'error'; message: string }

function StatCard({
  label,
  value,
  description,
}: {
  label: string
  value: number
  description: string
}) {
  return (
    <Card>
      <CardContent className="space-y-2 pt-6">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tracking-tight text-foreground">
          {value}
        </p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

export default function DpmDashboardPage() {
  const { user, isLoading: authLoading, logout } = useAuth()

  const [state, setState] = useState<AssignmentsState>({
    status: 'loading',
  })
  const [reloadKey, setReloadKey] = useState(0)
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadAssignments() {
      try {
        const applications = await listDpmApplications()

        if (active) {
          setState({ status: 'ready', applications })
        }
      } catch (error: unknown) {
        if (active) {
          setState({
            status: 'error',
            message: getApiErrorMessage(
              error,
              'Ringkasan mahasiswa bimbingan gagal dimuat. Coba lagi.',
            ),
          })
        }
      }
    }

    void loadAssignments()

    return () => {
      active = false
    }
  }, [reloadKey])

  function retry() {
    setState({ status: 'loading' })
    setReloadKey((current) => current + 1)
  }

  async function handleLogout() {
    setLogoutLoading(true)

    try {
      await logout()
    } finally {
      setLogoutLoading(false)
    }
  }

  const applications = state.status === 'ready' ? state.applications : []
  const withLetter = applications.filter(
    (application) => application.acceptanceLetter !== null,
  ).length
  const withoutLetter = applications.length - withLetter

  return (
    <AppLayout
      user={user}
      authLoading={authLoading}
      onLogout={handleLogout}
      logoutLoading={logoutLoading}
    >
      <PageContainer>
        <PageHeader
          eyebrow="Dashboard DPM"
          title={`Selamat datang${user ? `, ${user.name}` : ''}`}
          description="Ringkasan mahasiswa magang yang ditugaskan kepada akun Anda."
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={retry}
              disabled={state.status === 'loading'}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Muat ulang
            </Button>
          }
        />

        <div className="space-y-4">
          {state.status === 'loading' && (
            <Card>
              <CardContent>
                <LoadingState message="Memuat ringkasan bimbingan..." />
              </CardContent>
            </Card>
          )}

          {state.status === 'error' && (
            <Card>
              <CardContent>
                <ErrorState
                  title="Ringkasan bimbingan gagal dimuat"
                  message={state.message}
                  action={
                    <Button variant="outline" size="sm" onClick={retry}>
                      Coba lagi
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          )}

          {state.status === 'ready' && (
            <>
              <Alert variant="info" title="Cakupan data DPM">
                Data dibatasi pada penempatan DPM milik akun Anda. Fitur
                bimbingan dan penilaian DPM belum tersedia pada modul ini.
              </Alert>

              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Mahasiswa bimbingan"
                  value={applications.length}
                  description="Pengajuan yang ditugaskan"
                />
                <StatCard
                  label="Surat tersedia"
                  value={withLetter}
                  description="Metadata surat sudah diunggah"
                />
                <StatCard
                  label="Surat belum ada"
                  value={withoutLetter}
                  description="Menunggu unggahan mahasiswa"
                />
              </div>

              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <GraduationCap
                          className="size-5 text-primary"
                          aria-hidden="true"
                        />
                        <CardTitle>Mahasiswa bimbingan terbaru</CardTitle>
                      </div>
                      <CardDescription>
                        Maksimal lima penempatan terbaru untuk akun Anda.
                      </CardDescription>
                    </div>

                    <Link
                      to="/dpm/bimbingan"
                      className={buttonClasses({
                        variant: 'outline',
                        size: 'sm',
                      })}
                    >
                      Semua bimbingan
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                </CardHeader>

                <CardContent>
                  {applications.length === 0 ? (
                    <EmptyState
                      title="Belum ada mahasiswa bimbingan"
                      description="Admin/Prodi belum menetapkan mahasiswa magang kepada akun Anda."
                    />
                  ) : (
                    <ul className="divide-y divide-border-subtle border-y border-border-subtle">
                      {applications.slice(0, 5).map((application) => (
                        <li
                          key={application.id}
                          className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <UserRound
                                className="size-4 text-muted-foreground"
                                aria-hidden="true"
                              />
                              <p className="font-semibold text-foreground">
                                {application.student?.name ??
                                  'Mahasiswa tidak tersedia'}
                              </p>
                            </div>
                            <p className="break-all text-sm text-muted-foreground">
                              {application.student?.email ?? '—'}
                            </p>
                            <p className="text-sm text-foreground">
                              Mitra:{' '}
                              <span className="font-medium">
                                {application.partner.name}
                              </span>
                            </p>
                            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <FileText
                                className="mt-0.5 size-3.5 shrink-0"
                                aria-hidden="true"
                              />
                              {application.acceptanceLetter
                                ? `Surat: ${application.acceptanceLetter.originalName}`
                                : 'Surat penerimaan belum diunggah'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Ditetapkan{' '}
                              {formatApplicationDate(
                                application.dpmPlacement?.assignedAt ?? null,
                              )}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            <ApplicationStatusBadge
                              status={application.status}
                            />
                            <Link
                              to={`/dpm/bimbingan/${application.id}`}
                              className={buttonClasses({
                                variant: 'outline',
                                size: 'sm',
                              })}
                            >
                              Lihat detail
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </PageContainer>
    </AppLayout>
  )
}
