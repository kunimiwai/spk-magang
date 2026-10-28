import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'
import { getRoleLabel } from '../../lib/roleLabels'
import { buttonClasses } from '../../lib/buttonStyles'
import { Brand } from '../layout/Brand'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/Card'
import { AuthLoadingScreen } from './AuthLoadingScreen'

type RoleRouteProps = {
  allowedRoles: readonly string[]
  children: ReactNode
}

export function RoleRoute({ allowedRoles, children }: RoleRouteProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!allowedRoles.includes(user.role)) {
    const allowedLabels = allowedRoles.map(getRoleLabel).join(', ')

    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center">
            <Brand />
          </div>

          <Card>
            <CardHeader>
              <span className="mb-2 grid size-11 place-items-center rounded-full bg-warning-surface text-warning-foreground">
                <ShieldX className="size-5" aria-hidden="true" />
              </span>
              <CardTitle>Akses ditolak</CardTitle>
              <CardDescription>
                Halaman ini hanya dapat diakses oleh role {allowedLabels}.
                Akun Anda tercatat sebagai {getRoleLabel(user.role)}.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Link
                to="/"
                className={buttonClasses({
                  variant: 'outline',
                  className: 'w-full',
                })}
              >
                Kembali ke beranda
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return <>{children}</>
}
