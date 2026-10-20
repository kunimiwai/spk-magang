import { useEffect, useRef, type RefObject } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { LayoutDashboard, UserRound, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Brand } from './Brand'

const navItems = [
  { to: '/', label: 'Beranda', icon: LayoutDashboard, end: true },
  { to: '/profil', label: 'Profil', icon: UserRound, end: false },
] as const

type SidebarNavProps = {
  onNavigate?: () => void
}

function SidebarNav({ onNavigate }: SidebarNavProps) {
  return (
    <nav aria-label="Navigasi utama" className="flex-1 space-y-1 p-3">
      <p className="px-3 pb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Menu utama
      </p>

      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              isActive
                ? 'bg-muted text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span>{label}</span>
              {isActive && (
                <span
                  className="ml-auto size-1.5 rounded-full bg-accent"
                  aria-hidden="true"
                />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

type AppSidebarProps = {
  mobileOpen: boolean
  onClose: () => void
  triggerRef: RefObject<HTMLButtonElement | null>
}

export function AppSidebar({
  mobileOpen,
  onClose,
  triggerRef,
}: AppSidebarProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!mobileOpen) return

    const previousOverflow = document.body.style.overflow
    const trigger = triggerRef.current

    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null)

      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      trigger?.focus()
    }
  }, [mobileOpen, onClose, triggerRef])

  return (
    <>
      <aside className="hidden border-r border-border-subtle bg-card lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col">
        <div className="border-b border-border-subtle p-4">
          <Link
            to="/"
            className="inline-flex rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Brand />
          </Link>
        </div>

        <SidebarNav />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            aria-hidden="true"
            onClick={onClose}
          />

          <div
            ref={panelRef}
            id="app-sidebar-mobile"
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-card shadow-xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border-subtle p-4">
              <Link
                to="/"
                onClick={onClose}
                className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Brand compact />
              </Link>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Tutup menu navigasi"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <SidebarNav onNavigate={onClose} />
          </div>
        </div>
      )}
    </>
  )
}
