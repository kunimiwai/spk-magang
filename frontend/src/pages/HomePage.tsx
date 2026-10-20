import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import api from '../services/api'
import { useAuth } from '../auth/useAuth'
import { AppLayout } from '../components/layout/AppLayout'
import {
  PageContainer,
  PageHeader,
} from '../components/layout/PageContainer'
import { Badge } from '../components/ui/Badge'
import { Alert } from '../components/ui/Alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/Card'
import { LoadingState } from '../components/ui/States'
import { buttonClasses } from '../lib/buttonStyles'
import { getRoleLabel } from '../lib/roleLabels'

type HealthResponse = {
  success: boolean
  message: string
  service: string
}

type ApiStatus =
  | { state: 'loading'; message: string }
  | { state: 'connected'; message: string; service: string }
  | { state: 'error'; message: string }

export default function HomePage() {
  const { user, isLoading: authLoading, logout } = useAuth()

  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    state: 'loading',
    message: 'Memeriksa koneksi backend...',
  })
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function checkApi() {
      try {
        const response = await api.get<HealthResponse>('/health')

        if (!active) return

        if (response.data.success) {
          setApiStatus({
            state: 'connected',
            message: response.data.message,
            service: response.data.service,
          })
        } else {
          setApiStatus({
            state: 'error',
            message: 'Backend merespons, tetapi status API tidak sukses.',
          })
        }
      } catch (error: unknown) {
        if (!active) return

        const message = axios.isAxiosError(error)
          ? error.code === 'ECONNABORTED'
            ? 'Permintaan API melewati batas waktu.'
            : error.response
              ? `API mengembalikan HTTP ${error.response.status}.`
              : 'Tidak dapat terhubung ke backend. Pastikan Laravel berjalan.'
          : 'Terjadi kesalahan yang tidak diketahui.'

        setApiStatus({ state: 'error', message })
      }
    }

    void checkApi()

    return () => {
      active = false
    }
  }, [])

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
          eyebrow="Ruang kerja"
          title="Ringkasan"
          description="Pantau status sesi pengguna dan koneksi layanan SPK Magang."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle>Status backend</CardTitle>
                  <CardDescription>
                    Koneksi ke REST API Laravel.
                  </CardDescription>
                </div>

                {apiStatus.state === 'loading' && (
                  <Badge variant="neutral">Memeriksa</Badge>
                )}
                {apiStatus.state === 'connected' && (
                  <Badge variant="success" withDot role="status">
                    Terhubung
                  </Badge>
                )}
                {apiStatus.state === 'error' && (
                  <Badge variant="danger" withDot role="status">
                    Gagal
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {apiStatus.state === 'loading' && (
                <LoadingState message={apiStatus.message} />
              )}

              {apiStatus.state === 'connected' && (
                <>
                  <p
                    role="status"
                    className="text-sm leading-relaxed text-muted-foreground"
                  >
                    {apiStatus.message}
                  </p>

                  <dl className="grid gap-2 text-sm sm:grid-cols-[6rem_1fr] sm:items-center">
                    <dt className="text-muted-foreground">Service</dt>
                    <dd>
                      <Badge variant="info" className="font-mono">
                        {apiStatus.service}
                      </Badge>
                    </dd>
                  </dl>
                </>
              )}

              {apiStatus.state === 'error' && (
                <Alert variant="danger" title="Gagal terhubung">
                  {apiStatus.message}
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Akun pengguna</CardTitle>
              <CardDescription>
                Informasi sesi aktif berdasarkan token Bearer.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {authLoading ? (
                <LoadingState message="Memeriksa sesi pengguna..." />
              ) : user ? (
                <dl className="grid gap-3 text-sm sm:grid-cols-[6rem_1fr]">
                  <dt className="text-muted-foreground">Nama</dt>
                  <dd className="break-words font-medium text-foreground">
                    {user.name}
                  </dd>

                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="break-words text-foreground">
                    {user.email}
                  </dd>

                  <dt className="text-muted-foreground">Role</dt>
                  <dd>
                    <Badge variant="neutral" className="font-mono">
                      {getRoleLabel(user.role)}
                    </Badge>
                  </dd>
                </dl>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Anda belum masuk. Masuk menggunakan akun yang terdaftar
                    untuk melihat informasi sesi.
                  </p>
                  <Link
                    to="/login"
                    className={buttonClasses({ size: 'sm' })}
                  >
                    Masuk
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppLayout>
  )
}
