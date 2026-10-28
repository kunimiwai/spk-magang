import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BellRing,
  Building2,
  ChartColumn,
  ClipboardList,
  ListChecks,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { ApplicationStatusBadge } from '../components/applications/ApplicationStatusBadge'
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
import { getApiErrorMessage } from '../lib/apiError'
import { formatApplicationDate } from '../lib/applications'
import { buttonClasses } from '../lib/buttonStyles'
import { getAnalytics, type AnalyticsData } from '../services/analytics'
import {
  listAdminApplications,
  type InternshipApplication,
} from '../services/applications'

type ApplicationsState =
  | { status: 'loading' }
  | { status: 'ready'; applications: InternshipApplication[] }
  | { status: 'error'; message: string }

type AnalyticsState =
  | { status: 'loading' }
  | { status: 'ready'; data: AnalyticsData }
  | { status: 'error'; message: string }

function StatCard({
  label,
  value,
  description,
  tone,
}: {
  label: string
  value: number
  description: string
  tone: 'neutral' | 'warning' | 'success' | 'danger'
}) {
  return (
    <Card>
      <CardContent className="space-y-2 pt-6">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tracking-tight text-foreground">
          {value}
        </p>
        <Badge variant={tone}>{description}</Badge>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading, logout } = useAuth()

  const [applicationsState, setApplicationsState] =
    useState<ApplicationsState>({ status: 'loading' })
  const [analyticsState, setAnalyticsState] = useState<AnalyticsState>({
    status: 'loading',
  })
  const [applicationsReloadKey, setApplicationsReloadKey] = useState(0)
  const [analyticsReloadKey, setAnalyticsReloadKey] = useState(0)
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadApplications() {
      try {
        const applications = await listAdminApplications()

        if (active) {
          setApplicationsState({ status: 'ready', applications })
        }
      } catch (error: unknown) {
        if (active) {
          setApplicationsState({
            status: 'error',
            message: getApiErrorMessage(
              error,
              'Ringkasan pengajuan gagal dimuat. Coba lagi.',
            ),
          })
        }
      }
    }

    void loadApplications()

    return () => {
      active = false
    }
  }, [applicationsReloadKey])

  useEffect(() => {
    let active = true

    async function loadAnalytics() {
      try {
        const data = await getAnalytics()

        if (active) {
          setAnalyticsState({ status: 'ready', data })
        }
      } catch (error: unknown) {
        if (active) {
          setAnalyticsState({
            status: 'error',
            message: getApiErrorMessage(
              error,
              'Ringkasan data pendukung gagal dimuat. Coba lagi.',
            ),
          })
        }
      }
    }

    void loadAnalytics()

    return () => {
      active = false
    }
  }, [analyticsReloadKey])

  function retryApplications() {
    setApplicationsState({ status: 'loading' })
    setApplicationsReloadKey((current) => current + 1)
  }

  function retryAnalytics() {
    setAnalyticsState({ status: 'loading' })
    setAnalyticsReloadKey((current) => current + 1)
  }

  function refreshAll() {
    retryApplications()
    retryAnalytics()
  }

  async function handleLogout() {
    setLogoutLoading(true)

    try {
      await logout()
    } finally {
      setLogoutLoading(false)
    }
  }

  const applications =
    applicationsState.status === 'ready'
      ? applicationsState.applications
      : []
  const pendingApplications = applications.filter(
    (application) => application.status === 'menunggu',
  )
  const acceptedCount = applications.filter(
    (application) => application.status === 'diterima',
  ).length
  const rejectedCount = applications.filter(
    (application) => application.status === 'ditolak',
  ).length
  const latestPending = pendingApplications.slice(0, 5)
  const roleLabel = user?.role === 'prodi' ? 'Prodi' : 'Admin'

  return (
    <AppLayout
      user={user}
      authLoading={authLoading}
      onLogout={handleLogout}
      logoutLoading={logoutLoading}
    >
      <PageContainer>
        <PageHeader
          eyebrow={`Dashboard ${roleLabel}`}
          title={`Selamat datang${user ? `, ${user.name}` : ''}`}
          description="Ringkasan pengajuan dan data pendukung yang benar-benar tersimpan di backend."
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAll}
              disabled={
                applicationsState.status === 'loading' ||
                analyticsState.status === 'loading'
              }
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Muat ulang
            </Button>
          }
        />

        <div className="space-y-4">
          {applicationsState.status === 'loading' && (
            <Card>
              <CardContent>
                <LoadingState message="Memuat ringkasan pengajuan..." />
              </CardContent>
            </Card>
          )}

          {applicationsState.status === 'error' && (
            <Card>
              <CardContent>
                <ErrorState
                  title="Ringkasan pengajuan gagal dimuat"
                  message={applicationsState.message}
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
              </CardContent>
            </Card>
          )}

          {applicationsState.status === 'ready' && (
            <>
              {pendingApplications.length > 0 ? (
                <Alert
                  variant="warning"
                  title={`${pendingApplications.length} pengajuan perlu ditinjau`}
                >
                  Notifikasi ini dihitung dari pengajuan berstatus menunggu.
                  Kanal notifikasi eksternal belum tersedia.
                </Alert>
              ) : (
                <Alert variant="success" title="Tidak ada pengajuan menunggu">
                  Semua pengajuan yang tercatat sudah memiliki keputusan.
                </Alert>
              )}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Menunggu keputusan"
                  value={pendingApplications.length}
                  description="Perlu ditinjau"
                  tone="warning"
                />
                <StatCard
                  label="Diterima"
                  value={acceptedCount}
                  description="Keputusan tercatat"
                  tone="success"
                />
                <StatCard
                  label="Ditolak"
                  value={rejectedCount}
                  description="Keputusan tercatat"
                  tone="danger"
                />
                <StatCard
                  label="Total pengajuan"
                  value={applications.length}
                  description="Seluruh data"
                  tone="neutral"
                />
              </div>

              <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,1fr)]">
                <Card>
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <BellRing
                            className="size-5 text-primary"
                            aria-hidden="true"
                          />
                          <CardTitle>Pengajuan menunggu terbaru</CardTitle>
                        </div>
                        <CardDescription>
                          Maksimal lima pengajuan yang belum diputuskan.
                        </CardDescription>
                      </div>

                      <Link
                        to="/admin/pengajuan"
                        className={buttonClasses({
                          variant: 'outline',
                          size: 'sm',
                        })}
                      >
                        Semua pengajuan
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {latestPending.length === 0 ? (
                      <EmptyState
                        title="Tidak ada pengajuan menunggu"
                        description="Pengajuan baru akan muncul di sini setelah mahasiswa mengirimkannya."
                      />
                    ) : (
                      <ul className="divide-y divide-border-subtle border-y border-border-subtle">
                        {latestPending.map((application) => (
                          <li
                            key={application.id}
                            className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                          >
                            <div className="space-y-1">
                              <p className="font-semibold text-foreground">
                                {application.student?.name ??
                                  'Mahasiswa tidak tersedia'}
                              </p>
                              <p className="break-all text-sm text-muted-foreground">
                                {application.student?.email ?? '—'}
                              </p>
                              <p className="text-sm text-foreground">
                                Mitra:{' '}
                                <span className="font-medium">
                                  {application.partner.name}
                                </span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Diajukan{' '}
                                {formatApplicationDate(
                                  application.submittedAt,
                                )}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                              <ApplicationStatusBadge
                                status={application.status}
                              />
                              <Link
                                to={`/admin/pengajuan/${application.id}`}
                                className={buttonClasses({
                                  variant: 'outline',
                                  size: 'sm',
                                })}
                              >
                                Tinjau
                              </Link>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <ChartColumn
                        className="size-5 text-primary"
                        aria-hidden="true"
                      />
                      <CardTitle>Kesiapan data</CardTitle>
                    </div>
                    <CardDescription>
                      Ringkasan master data dan kesiapan rekomendasi.
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {analyticsState.status === 'loading' && (
                      <LoadingState message="Memuat kesiapan data..." />
                    )}

                    {analyticsState.status === 'error' && (
                      <Alert variant="danger" title="Data pendukung gagal dimuat">
                        <div className="space-y-3">
                          <p>{analyticsState.message}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={retryAnalytics}
                          >
                            Coba lagi
                          </Button>
                        </div>
                      </Alert>
                    )}

                    {analyticsState.status === 'ready' && (
                      <dl className="grid gap-1 text-sm">
                        <div className="flex items-center justify-between gap-3 border-b border-border-subtle py-2.5">
                          <dt className="text-muted-foreground">Mitra</dt>
                          <dd className="font-mono text-foreground">
                            {analyticsState.data.partners.count}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-b border-border-subtle py-2.5">
                          <dt className="text-muted-foreground">Kriteria</dt>
                          <dd className="font-mono text-foreground">
                            {analyticsState.data.criteria.length}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-b border-border-subtle py-2.5">
                          <dt className="text-muted-foreground">Nilai terisi</dt>
                          <dd className="font-mono text-foreground">
                            {analyticsState.data.scores.filled_pairs} /{' '}
                            {analyticsState.data.scores.total_pairs}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-3 py-2.5">
                          <dt className="text-muted-foreground">
                            Rekomendasi
                          </dt>
                          <dd>
                            <Badge
                              variant={
                                analyticsState.data.recommendation.status ===
                                'ready'
                                  ? 'success'
                                  : 'warning'
                              }
                              withDot
                            >
                              {analyticsState.data.recommendation.status ===
                              'ready'
                                ? 'Siap'
                                : 'Belum siap'}
                            </Badge>
                          </dd>
                        </div>
                      </dl>
                    )}
                  </CardContent>
                </Card>
              </div>

              <section aria-labelledby="akses-cepat-admin">
                <h2
                  id="akses-cepat-admin"
                  className="mb-3 text-lg font-semibold tracking-tight text-foreground"
                >
                  Akses cepat
                </h2>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <ClipboardList
                          className="size-5 text-primary"
                          aria-hidden="true"
                        />
                        <CardTitle>Pengajuan</CardTitle>
                      </div>
                      <CardDescription>
                        Tinjau dan catat keputusan hasil seleksi mitra.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link
                        to="/admin/pengajuan"
                        className={buttonClasses({
                          variant: 'primary',
                          size: 'sm',
                        })}
                      >
                        Buka pengajuan
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <ListChecks
                          className="size-5 text-primary"
                          aria-hidden="true"
                        />
                        <CardTitle>Kriteria dan nilai mitra</CardTitle>
                      </div>
                      <CardDescription>
                        Kelola kriteria, bobot, dan nilai mitra.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link
                        to="/kriteria"
                        className={buttonClasses({
                          variant: 'outline',
                          size: 'sm',
                        })}
                      >
                        Buka kriteria
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </CardContent>
                  </Card>

                  {user?.role === 'admin' ? (
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
                          Kelola master data mitra magang.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Link
                          to="/mitra"
                          className={buttonClasses({
                            variant: 'outline',
                            size: 'sm',
                          })}
                        >
                          Buka mitra
                          <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <ChartColumn
                            className="size-5 text-primary"
                            aria-hidden="true"
                          />
                          <CardTitle>Analitik mitra</CardTitle>
                        </div>
                        <CardDescription>
                          Lihat statistik nilai dan kesiapan rekomendasi.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Link
                          to="/admin/analitik"
                          className={buttonClasses({
                            variant: 'outline',
                            size: 'sm',
                          })}
                        >
                          Buka analitik
                          <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </PageContainer>
    </AppLayout>
  )
}
