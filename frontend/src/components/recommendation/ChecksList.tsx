import { Badge } from '../ui/Badge'
import type {
  RecommendationCheck,
  RecommendationCheckCategory,
} from '../../services/recommendations'

function checkCategoryLabel(category: RecommendationCheckCategory): string {
  switch (category) {
    case 'decision':
      return 'Keputusan bisnis'
    case 'analysis':
      return 'Analitik'
    case 'technical':
      return 'Teknis'
    default:
      return 'Data'
  }
}

export function ChecksList({ checks }: { checks: RecommendationCheck[] }) {
  return (
    <ul className="divide-y divide-border-subtle border-y border-border-subtle">
      {checks.map((check) => (
        <li
          key={check.key}
          className="grid gap-2 py-3 sm:grid-cols-[14rem_1fr] sm:items-start"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {check.label}
            </span>
            <Badge
              variant={check.status === 'ok' ? 'success' : 'warning'}
              withDot
            >
              {check.status === 'ok' ? 'Siap' : 'Belum'}
            </Badge>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {checkCategoryLabel(check.category)}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {check.message}
          </p>
        </li>
      ))}
    </ul>
  )
}
