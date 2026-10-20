import { cn } from '../../lib/cn'

type BrandProps = {
  compact?: boolean
  className?: string
}

export function Brand({ compact = false, className }: BrandProps) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span
        className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary font-mono text-xs font-bold tracking-tight text-on-primary"
        aria-hidden="true"
      >
        SPK
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-foreground">
          SPK Magang
        </span>
        {!compact && (
          <span className="block truncate text-xs text-muted-foreground">
            Sistem Pendukung Keputusan
          </span>
        )}
      </span>
    </span>
  )
}
