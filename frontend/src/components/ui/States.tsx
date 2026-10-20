import type { ReactNode } from 'react'
import { Inbox, LoaderCircle } from 'lucide-react'
import { cn } from '../../lib/cn'

type SpinnerProps = {
  className?: string
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <LoaderCircle
      className={cn('size-4 animate-spin', className)}
      aria-hidden="true"
    />
  )
}

type LoadingStateProps = {
  message?: string
  className?: string
}

export function LoadingState({
  message = 'Memuat…',
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center gap-3 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground',
        className,
      )}
    >
      <Spinner />
      <span>{message}</span>
    </div>
  )
}

type ErrorStateProps = {
  title?: string
  message: string
  action?: ReactNode
  className?: string
}

export function ErrorState({
  title = 'Terjadi kesalahan',
  message,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border border-danger-foreground/25 bg-danger-surface p-4 text-danger-foreground',
        className,
      )}
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-relaxed">{message}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

type EmptyStateProps = {
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-lg border border-dashed border-border-subtle px-6 py-10 text-center',
        className,
      )}
    >
      <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-3 font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
