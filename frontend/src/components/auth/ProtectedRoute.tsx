import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { buttonClasses } from '../../lib/buttonStyles'
import { Brand } from '../layout/Brand'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/Card'
import { AuthLoadingScreen } from './AuthLoadingScreen'

type SessionErrorScreenProps = {
  message: string
  onRetry: () => void
}

function SessionErrorScreen({ message, onRetry }: SessionErrorScreenProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Brand />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sesi belum dapat diverifikasi</CardTitle>
            <CardDescription>
              Pemeriksaan sesi gagal karena masalah koneksi atau server, bukan
              karena kredensial Anda ditolak.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert variant="warning" title="Koneksi bermasalah">
              {message}
            </Alert>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={onRetry} className="w-full sm:w-auto">
                Coba lagi
              </Button>

              <Link
                to="/login"
                className={buttonClasses({
                  variant: 'outline',
                  className: 'w-full sm:w-auto',
                })}
              >
                Ke halaman masuk
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, sessionError, refreshUser } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  if (sessionError) {
    return (
      <SessionErrorScreen
        message={sessionError}
        onRetry={() => {
          void refreshUser()
        }}
      />
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
