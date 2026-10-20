import type { RefObject } from 'react'
import { Link } from 'react-router-dom'
import { LogOut, Menu } from 'lucide-react'
import { Button } from '../ui/Button'
import { buttonClasses } from '../../lib/buttonStyles'
import { Brand } from './Brand'

export type HeaderUser = {
  name: string
  role: string
}

type AppHeaderProps = {
  onOpenNav: () => void
  menuButtonRef: RefObject<HTMLButtonElement | null>
  navOpen: boolean
  user: HeaderUser | null
  authLoading: boolean
  onLogout?: () => void
  logoutLoading?: boolean
}

export function AppHeader({
  onOpenNav,
  menuButtonRef,
  navOpen,
  user,
  authLoading,
  onLogout,
  logoutLoading = false,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-card/95 backdrop-blur">
      <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={onOpenNav}
          aria-label="Buka menu navigasi"
          aria-expanded={navOpen}
          aria-controls="app-sidebar-mobile"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>

        <Link
          to="/"
          className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:hidden"
        >
          <Brand compact />
        </Link>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {authLoading ? (
            <span
              role="status"
              className="text-sm text-muted-foreground"
            >
              Memeriksa sesi…
            </span>
          ) : user ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="max-w-48 truncate text-sm font-medium text-foreground">
                  {user.name}
                </p>
                <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                  {user.role}
                </p>
              </div>

              {onLogout && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  isLoading={logoutLoading}
                  loadingLabel="Keluar…"
                  leftIcon={<LogOut className="size-4" aria-hidden="true" />}
                  aria-label={`Logout dari akun ${user.name}`}
                >
                  Logout
                </Button>
              )}
            </>
          ) : (
            <Link to="/login" className={buttonClasses({ size: 'sm' })}>
              Masuk
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
