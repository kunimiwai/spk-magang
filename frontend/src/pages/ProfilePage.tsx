import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IdCard, Mail, UserRound } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { AppLayout } from '../components/layout/AppLayout'
import {
  PageContainer,
  PageHeader,
} from '../components/layout/PageContainer'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/Card'
import { EmptyState, LoadingState } from '../components/ui/States'
import { buttonClasses } from '../lib/buttonStyles'
import { getRoleLabel } from '../lib/roleLabels'

function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  return initials || '?'
}

export default function ProfilePage() {
  const { user, isLoading, sessionError, logout } = useAuth()
  const [logoutLoading, setLogoutLoading] = useState(false)

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
      authLoading={isLoading}
      onLogout={handleLogout}
      logoutLoading={logoutLoading}
    >
      <PageContainer>
        <PageHeader
          eyebrow="Akun"
          title="Profil pengguna"
          description="Informasi akun yang tersedia dari sesi aktif Anda."
        />

        {isLoading ? (
          <LoadingState message="Memuat profil pengguna..." />
        ) : sessionError ? (
          <Alert variant="danger" title="Profil tidak dapat dimuat">
            {sessionError}
          </Alert>
        ) : !user ? (
          <EmptyState
            title="Data profil tidak tersedia"
            description="Sesi aktif tidak menyertakan data pengguna. Masuk kembali untuk memuat profil."
            action={
              <Link
                to="/login"
                className={buttonClasses({ variant: 'outline', size: 'sm' })}
              >
                Ke halaman masuk
              </Link>
            }
          />
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <Card>
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <span
                    aria-hidden="true"
                    className="grid size-16 shrink-0 place-items-center rounded-full bg-info-surface font-mono text-xl font-semibold text-info-foreground"
                  >
                    {getInitials(user.name)}
                  </span>

                  <div className="min-w-0 space-y-1.5">
                    <h2 className="break-words text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                      {user.name}
                    </h2>
                    <Badge variant="info">{getRoleLabel(user.role)}</Badge>
                  </div>
                </div>

                <dl className="mt-6 border-t border-border-subtle">
                  <div className="grid gap-1 border-b border-border-subtle py-4 sm:grid-cols-[10rem_1fr] sm:items-center">
                    <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="size-4" aria-hidden="true" />
                      Email
                    </dt>
                    <dd className="break-all text-sm font-medium text-foreground">
                      {user.email}
                    </dd>
                  </div>

                  <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:items-center">
                    <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                      <IdCard className="size-4" aria-hidden="true" />
                      ID pengguna
                    </dt>
                    <dd className="font-mono text-sm text-foreground">
                      {user.id}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserRound
                    className="size-5 text-primary"
                    aria-hidden="true"
                  />
                  <CardTitle>Keterbatasan data</CardTitle>
                </div>
                <CardDescription>
                  Profil mengikuti data yang benar-benar tersedia dari API.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Alert variant="info" title="Data profil masih terbatas">
                  Saat ini profil hanya memuat nama, email, ID, dan peran. NIM,
                  program studi, fakultas, nomor telepon, dan alamat belum
                  tersedia, sehingga tidak ditampilkan.
                </Alert>
              </CardContent>
            </Card>
          </div>
        )}
      </PageContainer>
    </AppLayout>
  )
}
