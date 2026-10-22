import { statusBadgeVariant, statusLabel } from '../../lib/applications'
import type { ApplicationStatus } from '../../services/applications'
import { Badge } from '../ui/Badge'

type ApplicationStatusBadgeProps = {
  status: ApplicationStatus
  className?: string
}

export function ApplicationStatusBadge({
  status,
  className,
}: ApplicationStatusBadgeProps) {
  return (
    <Badge
      variant={statusBadgeVariant(status)}
      withDot
      className={className}
    >
      {statusLabel(status)}
    </Badge>
  )
}
