import { useEffect, useState } from 'react'
import { FileText, GraduationCap, UserRound } from 'lucide-react'
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
import {
  listDpmApplications,
  type InternshipApplication,
} from '../services/applications'

type AssignmentListState =
  | { status: 'loading' }
  | { status: 'ready'; applications: InternshipApplication[] }
  | { status: 'error'; message: string }

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function DpmAssignmentsPage() {
  const { user, isLoading: authLoading, logout } = useAuth()

  const [listState, setListState] = useState<AssignmentListState>({
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
          setListState({ status: 'ready', applications })
        }
      } catch (error: unknown) {
        if (active) {
          setListState({
            status: 'error',
            message: getApiErrorMessage(
              error,
              'Daftar mahasiswa bimbingan gagal dimuat. Coba lagi.',
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
          eyebrow="Dosen Pembimbing Magang"
          title="Mahasiswa bimbingan"
          description="Mahasiswa yang ditugaskan Admin/Prodi kepada Anda untuk bimbingan magang."
        />

        <div className="space-y-4">
          <Alert variant="info" title="Cakupan data">
            Halaman ini hanya menampilkan penempatan DPM milik akun Anda.
            Data mahasiswa bimbingan DPM lain tidak ditampilkan. Tindakan
            bimbingan, penilaian, dan perubahan penempatan belum tersedia
            sampai aturan kewenangan DPM ditetapkan (OD-024/OD-025).
          </Alert>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <GraduationCap
                      className="size-5 text-primary"
                      aria-hidden="true"
                    />
                    <CardTitle>Daftar bimbingan</CardTitle>
                  </div>
                  <CardDescription>
                    Satu mahasiswa untuk setiap pengajuan magang yang telah
                    diterima dan ditetapkan kepada Anda.
                  </CardDescription>
                </div>

                {listState.status === 'ready' && (
                  <Badge variant="neutral">
                    {listState.applications.length} mahasiswa
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {listState.status === 'loading' && (
                <LoadingState message="Memuat mahasiswa bimbingan..." />
              )}

              {listState.status === 'error' && (
                <ErrorState
                  title="Mahasiswa bimbingan gagal dimuat"
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
                    title="Belum ada mahasiswa bimbingan"
                    description="Admin/Prodi belum menetapkan mahasiswa magang kepada akun Anda."
                  />
                ) : (
                  <ul
                    className="divide-y divide-border-subtle border-y border-border-subtle"
                    aria-label="Daftar mahasiswa bimbingan magang"
                  >
                    {listState.applications.map((application) => (
                      <li
                        key={application.id}
                        className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
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

                          <p className="text-xs text-muted-foreground">
                            Diajukan{' '}
                            {formatApplicationDate(application.submittedAt)}
                            {application.dpmPlacement
                              ? ` · Ditetapkan ${formatApplicationDate(
                                  application.dpmPlacement.assignedAt,
                                )}`
                              : ''}
                          </p>

                          <div className="flex items-start gap-1.5 pt-1 text-xs text-muted-foreground">
                            <FileText
                              className="mt-0.5 size-3.5 shrink-0"
                              aria-hidden="true"
                            />
                            {application.acceptanceLetter ? (
                              <span>
                                Surat penerimaan:{' '}
                                {application.acceptanceLetter.originalName} (
                                {formatFileSize(
                                  application.acceptanceLetter.size,
                                )}
                                )
                              </span>
                            ) : (
                              <span>Surat penerimaan belum diunggah</span>
                            )}
                          </div>
                        </div>

                        <div className="sm:justify-self-end">
                          <ApplicationStatusBadge
                            status={application.status}
                          />
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
