import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export type BadgeVariant =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-muted text-foreground',
  info: 'bg-info-surface text-info-foreground',
  success: 'bg-success-surface text-success-foreground',
  warning: 'bg-warning-surface text-warning-foreground',
  danger: 'bg-danger-surface text-danger-foreground',
}

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant
  withDot?: boolean
}

export function Badge({
  variant = 'neutral',
  withDot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {withDot && (
        <span
          className="size-1.5 rounded-full bg-current"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
