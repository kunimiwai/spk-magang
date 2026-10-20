import { useCallback, useRef, useState, type ReactNode } from 'react'
import { AppHeader, type HeaderUser } from './AppHeader'
import { AppSidebar } from './AppSidebar'

type AppLayoutProps = {
  children: ReactNode
  user: HeaderUser | null
  authLoading?: boolean
  onLogout?: () => void
  logoutLoading?: boolean
}

export function AppLayout({
  children,
  user,
  authLoading = false,
  onLogout,
  logoutLoading = false,
}: AppLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const openMobileNav = useCallback(() => setMobileNavOpen(true), [])
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), [])

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-50 -translate-y-24 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-lg focus:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Lewati ke konten utama
      </a>

      <div className="lg:flex">
        <AppSidebar
          mobileOpen={mobileNavOpen}
          onClose={closeMobileNav}
          triggerRef={menuButtonRef}
          role={user?.role}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader
            onOpenNav={openMobileNav}
            menuButtonRef={menuButtonRef}
            navOpen={mobileNavOpen}
            user={user}
            authLoading={authLoading}
            onLogout={onLogout}
            logoutLoading={logoutLoading}
          />

          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 focus:outline-none"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
