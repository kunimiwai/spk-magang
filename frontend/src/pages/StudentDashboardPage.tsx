import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ClipboardList,
  Compass,
  FileText,
  GraduationCap,
  IdCard,
  Mail,
  Sparkles,
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
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/Card'
import { EmptyState, LoadingState } from '../components/ui/States'
import { getApiErrorMessage } from '../lib/apiError'
import { formatApplicationDate } from '../lib/applications'
import { buttonClasses } from '../lib/buttonStyles'
import type { StudentProfile } from '../lib/peminatan'
import { getRoleLabel } from '../lib/roleLabels'
import {
  listStudentApplications,
  type InternshipApplication,
} from '../services/applications'
import { getStudentProfile } from '../services/mahasiswa'

type ProfileState =
  | { status: 'loading' }
  | { status: 'ready'; profile: StudentProfile }
  | { status: 'error'; message: string }

type ApplicationsState =
  | { status: 'loading' }
  | { status: 'ready'; applications: InternshipApplication[] }
  | { status: 'error'; message: string }

export default function StudentDashboardPage() {
  const { user, isLoading: authLoading, logout } = useAuth()

  const [logoutLoading, setLogoutLoading] = useState(false)
  const [profileState, setProfileState] = useState<ProfileState>({
    status: 'loading',
  })
  const [reloadToken, setReloadToken] = useState(0)
  const [applicationsState, setApplicationsState] =
    useState<ApplicationsState>({ status: 'loading' })
  const [applicationsReloadToken, setApplicationsReloadToken] = useState(0)

  useEffect(() => {
    let active = true

    async function loadProfile() {
      try {
        const profile = await getStudentProfile()

        if (active) {
          setProfileState({ status: 'ready', profile })
        }
      } catch (error: unknown) {
        if (active) {
          setProfileState({
            status: 'error',
            message: getApiErrorMessage(
              error,
              'Profil peminatan gagal dimuat.',
            ),
          })
        }
      }
    }

    void loadProfile()

    return () => {
      active = false
    }
  }, [reloadToken])

  useEffect(() => {
    let active = true

    async function loadApplications() {
      try {
        const applications = await listStudentApplications()

        if (active) {
          setApplicationsState({ status: 'ready', applications })
        }
      } catch (error: unknown) {
        if (active) {
          setApplicationsState({
            status: 'error',
            message: getApiErrorMessage(
              error,
              'Pengajuan magang gagal dimuat. Coba lagi.',
            ),
          })
        }
      }
    }

    void loadApplications()

    return () => {
      active = false
    }
  }, [applicationsReloadToken])

  function handleRetry() {
    setProfileState({ status: 'loading' })
    setReloadToken((token) => token + 1)
  }

  function handleApplicationsRetry() {
    setApplicationsState({ status: 'loading' })
    setApplicationsReloadToken((token) => token + 1)
  }

  async function handleLogout() {
    setLogoutLoading(true)

    try {
      await logout()
    } finally {
      setLogoutLoading(false)
    }
  }

  const latestApplication =
    applicationsState.status === 'ready'
      ? (applicationsState.applications[0] ?? null)
      : null

  return (
    <AppLayout
      user={user}
      authLoading={authLoading}
      onLogout={handleLogout}
      logoutLoading={logoutLoading}
    >
      <PageContainer>
        <PageHeader
          eyebrow="Dashboard mahasiswa"
          title={
            user ? `Selamat datang, ${user.name}` : 'Dashboard mahasiswa'
          }
          description="Ringkasan akun dan langkah yang sudah tersedia untuk proses magang Anda."
        />

        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserRound
                  className="size-5 text-primary"
                  aria-hidden="true"
                />
                <CardTitle>Identitas akun</CardTitle>
              </div>
              <CardDescription>
                Data yang tersedia dari sesi autentikasi Anda.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {authLoading ? (
                <LoadingState message="Memuat data akun..." />
              ) : user ? (
                <dl className="grid gap-1 border-t border-border-subtle">
                  <div className="grid gap-1 border-b border-border-subtle py-3 sm:grid-cols-[8rem_1fr] sm:items-center">
                    <dt className="text-sm text-muted-foreground">Nama</dt>
                    <dd className="break-words text-sm font-medium text-foreground">
                      {user.name}
                    </dd>
                  </div>

                  <div className="grid gap-1 border-b border-border-subtle py-3 sm:grid-cols-[8rem_1fr] sm:items-center">
                    <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="size-4" aria-hidden="true" />
                      Email
                    </dt>
                    <dd className="break-all text-sm text-foreground">
                      {user.email}
                    </dd>
                  </div>

                  <div className="grid gap-1 border-b border-border-subtle py-3 sm:grid-cols-[8rem_1fr] sm:items-center">
                    <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                      <IdCard className="size-4" aria-hidden="true" />
                      ID pengguna
                    </dt>
                    <dd className="font-mono text-sm text-foreground">
                      {user.id}
                    </dd>
                  </div>

                  <div className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:items-center">
                    <dt className="text-sm text-muted-foreground">Role</dt>
                    <dd>
                      <Badge variant="info">{getRoleLabel(user.role)}</Badge>
                    </dd>
                  </div>
                </dl>
              ) : (
                <EmptyState
                  title="Data akun tidak tersedia"
                  description="Sesi aktif tidak menyertakan data pengguna. Masuk kembali untuk memuat data."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <GraduationCap
                  className="size-5 text-primary"
                  aria-hidden="true"
                />
                <CardTitle>Peminatan</CardTitle>
              </div>
              <CardDescription>
                Peminatan yang tersimpan untuk akun Anda.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {profileState.status === 'loading' && (
                <LoadingState message="Memuat profil peminatan..." />
              )}

              {profileState.status === 'error' && (
                <Alert variant="danger" title="Profil peminatan gagal dimuat">
                  <div className="space-y-3">
                    <p>{profileState.message}</p>
                    <Button variant="outline" size="sm" onClick={handleRetry}>
                      Coba lagi
                    </Button>
                  </div>
                </Alert>
              )}

              {profileState.status === 'ready' &&
                (profileState.profile.options.length === 0 ? (
                  <EmptyState
                    title="Referensi peminatan kosong"
                    description="Server tidak mengirimkan label peminatan. Hubungi pengelola sistem sebelum melanjutkan."
                  />
                ) : profileState.profile.peminatan.length > 0 ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        Peminatan tersimpan
                      </p>
                      <Badge variant="success" withDot>
                        Tersimpan
                      </Badge>
                    </div>
                    <ul
                      className="flex flex-wrap gap-2"
                      aria-label="Peminatan tersimpan"
                    >
                      {profileState.profile.peminatan.map((option) => (
                        <li key={option}>
                          <Badge variant="info" className="font-mono text-sm">
                            {option}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                    {profileState.profile.selectionAvailable && (
                      <Link
                        to="/mahasiswa"
                        className={buttonClasses({
                          variant: 'outline',
                          size: 'sm',
                        })}
                      >
                        Ubah peminatan
                      </Link>
                    )}
                  </>
                ) : (
                  <EmptyState
                    title="Peminatan belum dipilih"
                    description={
                      profileState.profile.selectionAvailable
                        ? 'Lengkapi peminatan pada halaman Data Mahasiswa.'
                        : 'Penyimpanan peminatan belum diaktifkan karena aturan pemilihan belum ditetapkan.'
                    }
                    action={
                      profileState.profile.selectionAvailable ? (
                        <Link
                          to="/mahasiswa"
                          className={buttonClasses({
                            variant: 'primary',
                            size: 'sm',
                          })}
                        >
                          Pilih peminatan
                        </Link>
                      ) : undefined
                    }
                  />
                ))}

              {profileState.status === 'ready' &&
                !profileState.profile.selectionAvailable && (
                  <Alert variant="warning" title="Pemilihan belum tersedia">
                    {profileState.profile.note}
                  </Alert>
                )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText
                    className="size-5 text-primary"
                    aria-hidden="true"
                  />
                  <CardTitle>Pengajuan magang</CardTitle>
                </div>
                <CardDescription>
                  Ajukan permohonan ke mitra dan pantau status keputusan dari
                  backend.
                </CardDescription>
              </div>

              <Badge variant="info">Tersedia</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <Alert variant="info" title="Status awal pengajuan">
              Pengajuan baru selalu berstatus Menunggu hasil seleksi mitra.
              Pengajuan tidak otomatis diterima; keputusan Diterima atau
              Ditolak dicatat Admin/Prodi setelah hasil seleksi mitra
              tersedia.
            </Alert>

            {applicationsState.status === 'loading' && (
              <LoadingState message="Memuat pengajuan magang..." />
            )}

            {applicationsState.status === 'error' && (
              <Alert variant="danger" title="Pengajuan gagal dimuat">
                <div className="space-y-3">
                  <p>{applicationsState.message}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleApplicationsRetry}
                  >
                    Coba lagi
                  </Button>
                </div>
              </Alert>
            )}

            {applicationsState.status === 'ready' &&
              latestApplication === null && (
                <EmptyState
                  title="Belum ada pengajuan"
                  description="Pengajuan yang Anda kirim akan muncul di sini beserta status penerimaan, surat, dan DPM."
                />
              )}

            {latestApplication && (
              <div className="rounded-xl border border-border-subtle p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">
                      {latestApplication.partner.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Diajukan{' '}
                      {formatApplicationDate(
                        latestApplication.submittedAt,
                      )}
                    </p>
                  </div>

                  <ApplicationStatusBadge
                    status={latestApplication.status}
                  />
                </div>

                {latestApplication.reviewNote && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Catatan review: {latestApplication.reviewNote}
                  </p>
                )}

                {latestApplication.status === 'menunggu' && (
                  <Alert
                    variant="info"
                    title="Menunggu hasil seleksi mitra"
                    className="mt-3"
                  >
                    Keputusan akan tampil setelah Admin/Prodi mencatat hasil
                    seleksi mitra.
                  </Alert>
                )}

                {latestApplication.status === 'ditolak' && (
                  <Alert
                    variant="danger"
                    title="Pengajuan ditolak"
                    className="mt-3"
                  >
                    Pengajuan dinyatakan ditolak. Lihat pengajuan lain pada
                    halaman rekomendasi.
                  </Alert>
                )}

                {latestApplication.status === 'diterima' && (
                  <>
                    <AcceptanceLetterPanel
                      application={latestApplication}
                      mode="student"
                      allowUpload={false}
                    />
                    <DpmSummary
                      placement={latestApplication.dpmPlacement}
                    />
                  </>
                )}

                {applicationsState.status === 'ready' &&
                  applicationsState.applications.length > 1 && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Menampilkan pengajuan terbaru. Semua pengajuan tersedia
                      di halaman Pengajuan Magang.
                    </p>
                  )}
              </div>
            )}

            <Link
              to="/mahasiswa/pengajuan"
              className={buttonClasses({
                variant: 'primary',
                size: 'sm',
              })}
            >
              Buka pengajuan magang
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>

        <section aria-labelledby="akses-cepat" className="mt-6">
          <h2
            id="akses-cepat"
            className="mb-3 text-lg font-semibold tracking-tight text-foreground"
          >
            Akses cepat
          </h2>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <GraduationCap
                    className="size-5 text-primary"
                    aria-hidden="true"
                  />
                  <CardTitle>Data Mahasiswa</CardTitle>
                </div>
                <CardDescription>
                  Lihat identitas akun dan perbarui peminatan yang tersimpan.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Link
                  to="/mahasiswa"
                  className={buttonClasses({
                    variant: 'primary',
                    size: 'sm',
                  })}
                >
                  Buka Data Mahasiswa
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ClipboardList
                    className="size-5 text-primary"
                    aria-hidden="true"
                  />
                  <CardTitle>Nilai Akademik</CardTitle>
                </div>
                <CardDescription>
                  Catat nilai mata kuliah pada akun Anda. Status prasyarat
                  belum ditentukan sampai aturan kelulusan dikonfigurasi.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Link
                  to="/mahasiswa/nilai"
                  className={buttonClasses({
                    variant: 'outline',
                    size: 'sm',
                  })}
                >
                  Buka nilai akademik
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles
                        className="size-5 text-primary"
                        aria-hidden="true"
                      />
                      <CardTitle>Rekomendasi tempat magang</CardTitle>
                    </div>
                    <CardDescription>
                      Status dan hasil perhitungan tempat magang berdasarkan
                      kriteria serta nilai mitra yang tersimpan.
                    </CardDescription>
                  </div>

                  <Badge variant="neutral">Cek status</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <Alert variant="info" title="Rekomendasi mengikuti konfigurasi">
                  Halaman rekomendasi akan menampilkan alasan yang spesifik
                  bila peminatan, parameter K-Means, layanan algoritma, atau
                  nilai mitra belum lengkap. Tidak ada ranking yang dikarang.
                </Alert>

                <Link
                  to="/mahasiswa/rekomendasi"
                  className={buttonClasses({
                    variant: 'outline',
                    size: 'sm',
                  })}
                >
                  <Compass className="size-4" aria-hidden="true" />
                  Buka rekomendasi
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </PageContainer>
    </AppLayout>
  )
}
