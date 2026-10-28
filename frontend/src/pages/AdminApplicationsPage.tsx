import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Inbox } from 'lucide-react'
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
import {
  listAdminApplications,
  type InternshipApplication,
} from '../services/applications'

type ApplicationListState =
  | { status: 'loading' }
  | { status: 'ready'; applications: InternshipApplication[] }
  | { status: 'error'; message: string }

export default function AdminApplicationsPage() {
  const { user, isLoading: authLoading, logout } = useAuth()

  const [listState, setListState] = useState<ApplicationListState>({
    status: 'loading',
  })
  const [reloadKey, setReloadKey] = useState(0)
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadApplications() {
      try {
        const applications = await listAdminApplications()

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
  }, [reloadKey])

  function retry() {
    setListState({ status: 'loading' })
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
          title="Pengajuan magang"
          description="Tinjau pengajuan mahasiswa dan catat keputusan hasil seleksi mitra."
        />

        <div className="space-y-4">
          <Alert variant="info" title="Cakupan modul saat ini">
            Hanya keputusan Diterima dan Ditolak yang tersedia dari BPMN.
            Verifikasi dokumen, penerusan ke mitra, dan tenggat respons belum
            tersedia karena OD-017/OD-020/OD-021 belum diputuskan.
          </Alert>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Inbox
                      className="size-5 text-primary"
                      aria-hidden="true"
                    />
                    <CardTitle>Daftar pengajuan</CardTitle>
                  </div>
                  <CardDescription>
                    Pengajuan dari seluruh mahasiswa yang tercatat di backend.
                  </CardDescription>
                </div>

                {listState.status === 'ready' && (
                  <Badge variant="neutral">
                    {listState.applications.length} pengajuan
                  </Badge>
                )}
              </div>
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
                    <Button variant="outline" size="sm" onClick={retry}>
                      Coba lagi
                    </Button>
                  }
                />
              )}

              {listState.status === 'ready' &&
                (listState.applications.length === 0 ? (
                  <EmptyState
                    title="Belum ada pengajuan"
                    description="Belum ada mahasiswa yang mengirim pengajuan magang."
                  />
                ) : (
                  <ul
                    className="divide-y divide-border-subtle border-y border-border-subtle"
                    aria-label="Daftar pengajuan magang"
                  >
                    {listState.applications.map((application) => (
                      <li
                        key={application.id}
                        className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
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
                            {formatApplicationDate(application.submittedAt)}
                          </p>

                          {application.status === 'diterima' && (
                            <p className="text-xs text-muted-foreground">
                              Surat:{' '}
                              {application.acceptanceLetter
                                ? 'sudah diunggah'
                                : 'belum diunggah'}{' '}
                              · DPM:{' '}
                              {application.dpmPlacement?.dpm?.name ??
                                'belum ditetapkan'}
                            </p>
                          )}
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
                            Lihat detail
                            <ArrowRight
                              className="size-4"
                              aria-hidden="true"
                            />
                          </Link>
                        </div>
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
