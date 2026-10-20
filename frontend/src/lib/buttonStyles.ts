import { cn } from './cn'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'accent'
  | 'destructive'

export type ButtonSize = 'sm' | 'md' | 'lg'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'bg-secondary text-on-secondary hover:bg-secondary-hover',
  outline: 'border border-border bg-card text-primary hover:bg-muted',
  ghost: 'text-foreground hover:bg-muted',
  accent: 'bg-accent text-on-accent hover:bg-accent-hover',
  destructive:
    'bg-destructive text-on-destructive hover:bg-destructive-hover',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-3 text-sm sm:min-h-9',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-base',
}

type ButtonClassOptions = {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  className,
}: ButtonClassOptions = {}): string {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
    'disabled:pointer-events-none disabled:opacity-60',
    variantClasses[variant],
    sizeClasses[size],
    className,
  )
}
