import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { AppLayout } from '../components/layout/AppLayout'
import {
  PageContainer,
  PageHeader,
} from '../components/layout/PageContainer'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/Card'
import { ErrorState, LoadingState } from '../components/ui/States'
import { getApiErrorMessage } from '../lib/apiError'
import { buttonClasses } from '../lib/buttonStyles'
import { ChecksList } from '../components/recommendation/ChecksList'
import {
  getRecommendation,
  type RecommendationCriterion,
  type RecommendationResult,
} from '../services/recommendations'

type PageState =
  | { status: 'loading' }
  | { status: 'loaded'; data: RecommendationResult }
  | { status: 'error'; message: string }

const scoreFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 6,
})

function formatScore(value: number): string {
  return scoreFormatter.format(value)
}

function criterionTypeLabel(criterion: RecommendationCriterion): string {
  return criterion.type === 'benefit' ? 'Benefit' : 'Cost'
}

function CalculationSummary({ data }: { data: RecommendationResult }) {
  if (!data.kmeans) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ringkasan perhitungan</CardTitle>
        <CardDescription>
          Informasi teknis dari proses K-Means dan SAW.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <dl className="grid gap-1 border-t border-border-subtle text-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border-subtle py-2.5">
            <dt className="text-muted-foreground">Jumlah kriteria SAW</dt>
            <dd className="font-mono text-foreground">{data.criteria.length}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-border-subtle py-2.5">
            <dt className="text-muted-foreground">Mitra dianalisis</dt>
            <dd className="font-mono text-foreground">
              {data.kmeans.partner_count}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-border-subtle py-2.5">
            <dt className="text-muted-foreground">Cluster K-Means</dt>
            <dd className="font-mono text-foreground">
              {data.kmeans.cluster_count}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-border-subtle py-2.5">
            <dt className="text-muted-foreground">Seed K-Means</dt>
            <dd className="font-mono text-foreground">
              {data.kmeans.random_seed}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-border-subtle py-2.5">
            <dt className="text-muted-foreground">Fitur K-Means (ID kriteria)</dt>
            <dd className="font-mono text-foreground">
              {data.kmeans.feature_criterion_ids.join(', ')}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-border-subtle py-2.5">
            <dt className="text-muted-foreground">Iterasi</dt>
            <dd className="font-mono text-foreground">
              {data.kmeans.iterations}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 py-2.5">
            <dt className="text-muted-foreground">Konvergen</dt>
            <dd className="text-foreground">
              {data.kmeans.converged ? 'Ya' : 'Belum'}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}

function CriteriaSummary({ data }: { data: RecommendationResult }) {
  if (data.criteria.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kriteria dan bobot</CardTitle>
        <CardDescription>
          Parameter yang dipakai pada perhitungan SAW.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ul className="divide-y divide-border-subtle border-y border-border-subtle">
          {data.criteria.map((criterion) => (
            <li
              key={criterion.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {criterion.name}
                </p>
                <Badge
                  variant={criterion.type === 'benefit' ? 'info' : 'warning'}
                >
                  {criterionTypeLabel(criterion)}
                </Badge>
              </div>
              <p className="font-mono text-sm text-foreground">
                {formatScore(criterion.weight)}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export default function RecommendationPage() {
  const { user, isLoading: authLoading, logout } = useAuth()

  const [page, setPage] = useState<PageState>({ status: 'loading' })
  const [reloadToken, setReloadToken] = useState(0)
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadRecommendation() {
      try {
        const data = await getRecommendation()

        if (active) {
          setPage({ status: 'loaded', data })
        }
      } catch (error: unknown) {
        if (active) {
          setPage({
            status: 'error',
            message: getApiErrorMessage(
              error,
              'Rekomendasi gagal dimuat. Coba lagi.',
            ),
          })
        }
      }
    }

    void loadRecommendation()

    return () => {
      active = false
    }
  }, [reloadToken])

  function handleRetry() {
    setPage({ status: 'loading' })
    setReloadToken((token) => token + 1)
  }

  async function handleLogout() {
    setLogoutLoading(true)

    try {
      await logout()
    } finally {
      setLogoutLoading(false)
    }
  }

  return (
    <AppLayout
      user={user}
      authLoading={authLoading}
      onLogout={handleLogout}
      logoutLoading={logoutLoading}
    >
      <PageContainer>
        <PageHeader
          eyebrow="Mahasiswa"
          title="Rekomendasi tempat magang"
          description="Status dan hasil perhitungan rekomendasi berdasarkan kriteria, bobot, dan nilai mitra yang tersimpan."
          actions={
            <Link
              to="/mahasiswa/dashboard"
              className={buttonClasses({
                variant: 'outline',
                size: 'sm',
              })}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Kembali ke dashboard
            </Link>
          }
        />

        {page.status === 'loading' && (
          <Card>
            <CardContent>
              <LoadingState message="Memuat status rekomendasi..." />
            </CardContent>
          </Card>
        )}

        {page.status === 'error' && (
          <Card>
            <CardContent>
              <ErrorState
                title="Rekomendasi gagal dimuat"
                message={page.message}
                action={
                  <Button variant="outline" size="sm" onClick={handleRetry}>
                    Coba lagi
                  </Button>
                }
              />
            </CardContent>
          </Card>
        )}

        {page.status === 'loaded' && page.data.status === 'not_ready' && (
          <div className="space-y-4">
            <Alert variant="warning" title="Rekomendasi belum dapat dihitung">
              {page.data.message}
            </Alert>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles
                    className="size-5 text-primary"
                    aria-hidden="true"
                  />
                  <CardTitle>Status konfigurasi dan data</CardTitle>
                </div>
                <CardDescription>
                  Rincian pemeriksaan yang menentukan apakah ranking aman
                  dibuat. Tidak ada nilai asumsi yang dipakai.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ChecksList checks={page.data.checks} />
              </CardContent>
            </Card>
          </div>
        )}

        {page.status === 'loaded' && page.data.status === 'ready' && (
          <div className="space-y-4">
            <Alert variant="success" title="Perhitungan rekomendasi selesai">
              {page.data.disclaimer ??
                'Hasil ini bukan jaminan penerimaan magang.'}
            </Alert>

            {page.data.explanation && (
              <Alert variant="info" title="Keterangan perhitungan">
                {page.data.explanation}
              </Alert>
            )}

            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
              <Card>
                <CardHeader>
                  <CardTitle>Peringkat mitra</CardTitle>
                  <CardDescription>
                    Diurutkan berdasarkan skor SAW dari data yang tersimpan.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-0">
                  <div
                    className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    role="region"
                    aria-label="Tabel peringkat rekomendasi, dapat digulir horizontal"
                    tabIndex={0}
                  >
                    <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
                      <caption className="sr-only">
                        Peringkat rekomendasi tempat magang
                      </caption>
                      <thead>
                        <tr className="border-y border-border-subtle bg-muted">
                          <th
                            scope="col"
                            className="px-5 py-3 font-semibold text-foreground"
                          >
                            Peringkat
                          </th>
                          <th
                            scope="col"
                            className="px-5 py-3 font-semibold text-foreground"
                          >
                            Mitra
                          </th>
                          <th
                            scope="col"
                            className="px-5 py-3 text-right font-semibold text-foreground"
                          >
                            Skor SAW
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {page.data.ranking.map((entry) => (
                          <tr
                            key={entry.partner_id}
                            className="border-b border-border-subtle last:border-b-0"
                          >
                            <td className="px-5 py-4 font-mono text-foreground">
                              {entry.rank}
                            </td>
                            <td className="px-5 py-4">
                              <p className="font-semibold text-foreground">
                                {entry.partner_name}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {entry.cluster_index === null
                                  ? 'Tanpa label klaster (analitik tidak tersedia)'
                                  : `Cluster generik ${entry.cluster_index}`}
                              </p>
                            </td>
                            <td className="px-5 py-4 text-right font-mono text-foreground">
                              {formatScore(entry.score)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <CalculationSummary data={page.data} />
                <CriteriaSummary data={page.data} />
              </div>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Label cluster tidak dipetakan menjadi DTA, PSI, atau SIA pada
              tampilan ini. Indeks cluster hanya ditampilkan sebagai keluaran
              generik K-Means.
            </p>
          </div>
        )}
      </PageContainer>
    </AppLayout>
  )
}
