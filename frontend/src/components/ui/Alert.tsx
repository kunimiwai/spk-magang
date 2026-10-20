import type { HTMLAttributes, ReactNode } from 'react'
import {
  CheckCircle2,
  CircleAlert,
  Info,
  TriangleAlert,
} from 'lucide-react'
import { cn } from '../../lib/cn'

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger'

const variantClasses: Record<AlertVariant, string> = {
  info: 'border-info-foreground/25 bg-info-surface text-info-foreground',
  success:
    'border-success-foreground/25 bg-success-surface text-success-foreground',
  warning:
    'border-warning-foreground/25 bg-warning-surface text-warning-foreground',
  danger:
    'border-danger-foreground/25 bg-danger-surface text-danger-foreground',
}

const icons: Record<AlertVariant, ReactNode> = {
  info: <Info className="size-5" aria-hidden="true" />,
  success: <CheckCircle2 className="size-5" aria-hidden="true" />,
  warning: <TriangleAlert className="size-5" aria-hidden="true" />,
  danger: <CircleAlert className="size-5" aria-hidden="true" />,
}

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant
  title?: string
}

export function Alert({
  variant = 'info',
  title,
  className,
  children,
  role,
  ...props
}: AlertProps) {
  return (
    <div
      role={role ?? (variant === 'danger' ? 'alert' : 'status')}
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 text-sm',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      <span className="mt-0.5 shrink-0">{icons[variant]}</span>
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  )
}
