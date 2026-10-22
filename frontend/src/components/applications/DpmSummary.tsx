import { GraduationCap } from 'lucide-react'
import { formatApplicationDate } from '../../lib/applications'
import type { DpmPlacement } from '../../services/applications'

type DpmSummaryProps = {
  placement: DpmPlacement | null
}

export function DpmSummary({ placement }: DpmSummaryProps) {
  return (
    <section
      className="mt-3 rounded-xl border border-border-subtle p-4"
      aria-label="Dosen Pembimbing Magang"
    >
      <div className="flex items-center gap-2">
        <GraduationCap className="size-5 text-primary" aria-hidden="true" />
        <h3 className="font-semibold text-foreground">
          Dosen Pembimbing Magang (DPM)
        </h3>
      </div>

      {placement?.dpm ? (
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Nama</dt>
            <dd className="text-foreground">{placement.dpm.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="break-all text-foreground">
              {placement.dpm.email}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Ditetapkan</dt>
            <dd className="text-foreground">
              {formatApplicationDate(placement.assignedAt)}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          DPM belum ditetapkan oleh Admin/Prodi.
        </p>
      )}
    </section>
  )
}
