import { useEffect, useState } from 'react'
import { ChartColumn, RefreshCw } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { AppLayout } from '../components/layout/AppLayout'
import {
  PageContainer,
  PageHeader,
} from '../components/layout/PageContainer'
import { ChecksList } from '../components/recommendation/ChecksList'
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
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { getApiErrorMessage } from '../lib/apiError'
import {
  getAnalytics,
  type AnalyticsData,
  type AnalyticsKMeans,
} from '../services/analytics'

type PageState =
  | { status: 'loading' }
  | { status: 'loaded'; data: AnalyticsData }
  | { status: 'error'; message: string }

const numberFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 4,
})

function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

function KMeansCard({ kmeans }: { kmeans: AnalyticsKMeans }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analitik K-Means</CardTitle>
        <CardDescription>
          Pengelompokan karakteristik mitra untuk dashboard. Label klaster
          bukan filter wajib sebelum peringkat SAW.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!kmeans.configured && (
          <Alert variant="warning" title="Analitik klaster belum tersedia">
            {kmeans.message}
          </Alert>
        )}

        {kmeans.configured && kmeans.service_error && (
          <Alert variant="danger" title="Layanan analitik gagal dihubungi">
            {kmeans.service_error}
          </Alert>
        )}

        {kmeans.configured && !kmeans.service_error && kmeans.distribution === null && (
          <Alert variant="info" title="Distribusi belum dihitung">
            Nilai fitur K-Means untuk seluruh mitra belum lengkap. Nilai yang
            hilang tidak dianggap nol.
          </Alert>
        )}

        {kmeans.configured &&
          !kmeans.service_error &&
          kmeans.distribution !== null && (
          <>
            <div
              className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              role="region"
              aria-label="Tabel distribusi cluster K-Means, dapat digulir horizontal"
              tabIndex={0}
            >
              <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
                <caption className="sr-only">
                  Distribusi mitra per cluster K-Means
                </caption>
                <thead>
                  <tr className="border-y border-border-subtle bg-muted">
                    <th
                      scope="col"
                      className="px-4 py-3 font-semibold text-foreground"
                    >
                      Cluster
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right font-semibold text-foreground"
                    >
                      Jumlah mitra
                    </th>
                    {kmeans.distribution[0]?.feature_averages.map((feature) => (
                      <th
                        key={feature.criterion_id}
                        scope="col"
                        className="px-4 py-3 text-right font-semibold text-foreground"
                      >
                        Rerata {feature.criterion_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {kmeans.distribution.map((cluster) => (
                    <tr
                      key={cluster.cluster_index}
                      className="border-b border-border-subtle last:border-b-0"
                    >
                      <td className="px-4 py-3 font-mono text-foreground">
                        {cluster.cluster_index}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">
                        {cluster.partner_count}
                      </td>
                      {cluster.feature_averages.map((feature) => (
                        <td
                          key={feature.criterion_id}
                          className="px-4 py-3 text-right font-mono text-foreground"
                        >
                          {feature.average === null
                            ? '—'
                            : formatNumber(feature.average)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="grid gap-1 border-t border-border-subtle text-sm">
              <div className="flex items-center justify-between gap-3 border-b border-border-subtle py-2.5">
                <dt className="text-muted-foreground">Iterasi</dt>
                <dd className="font-mono text-foreground">
                  {kmeans.iterations ?? '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-muted-foreground">Konvergen</dt>
                <dd className="text-foreground">
                  {kmeans.converged === null
                    ? '—'
                    : kmeans.converged
                      ? 'Ya'
                      : 'Belum'}
                </dd>
              </div>
            </dl>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminAnalyticsPage() {
  const { user, isLoading: authLoading, logout } = useAuth()

  const [page, setPage] = useState<PageState>({ status: 'loading' })
  const [reloadToken, setReloadToken] = useState(0)
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadAnalytics() {
      try {
        const data = await getAnalytics()

        if (active) {
          setPage({ status: 'loaded', data })
        }
      } catch (error: unknown) {
        if (active) {
          setPage({
            status: 'error',
            message: getApiErrorMessage(
              error,
              'Analitik gagal dimuat. Coba lagi.',
            ),
          })
        }
      }
    }

    void loadAnalytics()

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
          eyebrow="Admin & Prodi"
          title="Analitik mitra"
          description="Ringkasan karakteristik mitra, status analitik K-Means, dan kesiapan peringkat SAW berdasarkan data yang tersimpan."
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={page.status === 'loading'}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Muat ulang
            </Button>
          }
        />

        {page.status === 'loading' && (
          <Card>
            <CardContent>
              <LoadingState message="Memuat analitik mitra..." />
            </CardContent>
          </Card>
        )}

        {page.status === 'error' && (
          <Card>
            <CardContent>
              <ErrorState
                title="Analitik gagal dimuat"
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

        {page.status === 'loaded' && (
          <div className="space-y-4">
            <div className="grid items-start gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ChartColumn
                      className="size-5 text-primary"
                      aria-hidden="true"
                    />
                    <CardTitle>Status data</CardTitle>
                  </div>
                  <CardDescription>
                    Jumlah data yang menjadi masukan analitik.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <dl className="grid gap-1 border-t border-border-subtle text-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-border-subtle py-2.5">
                      <dt className="text-muted-foreground">Mitra terdaftar</dt>
                      <dd className="font-mono text-foreground">
                        {page.data.partners.count}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-border-subtle py-2.5">
                      <dt className="text-muted-foreground">
                        Nilai mitra terisi
                      </dt>
                      <dd className="font-mono text-foreground">
                        {page.data.scores.filled_pairs} /{' '}
                        {page.data.scores.total_pairs} pasangan
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-2.5">
                      <dt className="text-muted-foreground">
                        Status kesiapan rekomendasi
                      </dt>
                      <dd>
                        <Badge
                          variant={
                            page.data.recommendation.status === 'ready'
                              ? 'success'
                              : 'warning'
                          }
                          withDot
                        >
                          {page.data.recommendation.status === 'ready'
                            ? 'Siap'
                            : 'Belum siap'}
                        </Badge>
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <KMeansCard kmeans={page.data.kmeans} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Statistik nilai mitra per kriteria</CardTitle>
                <CardDescription>
                  Dihitung dari nilai yang tersimpan. Kriteria dan bobot
                  dikelola pada menu Kriteria.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                {page.data.criteria.length === 0 ? (
                  <div className="px-6 pb-6">
                    <EmptyState
                      title="Belum ada kriteria"
                      description="Tambahkan kriteria dan nilai mitra agar statistik dapat ditampilkan."
                    />
                  </div>
                ) : (
                  <div
                    className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    role="region"
                    aria-label="Tabel statistik nilai mitra, dapat digulir horizontal"
                    tabIndex={0}
                  >
                    <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
                      <caption className="sr-only">
                        Statistik nilai mitra per kriteria
                      </caption>
                      <thead>
                        <tr className="border-y border-border-subtle bg-muted">
                          <th
                            scope="col"
                            className="px-5 py-3 font-semibold text-foreground"
                          >
                            Kriteria
                          </th>
                          <th
                            scope="col"
                            className="px-5 py-3 font-semibold text-foreground"
                          >
                            Tipe
                          </th>
                          <th
                            scope="col"
                            className="px-5 py-3 text-right font-semibold text-foreground"
                          >
                            Bobot
                          </th>
                          <th
                            scope="col"
                            className="px-5 py-3 text-right font-semibold text-foreground"
                          >
                            Terisi
                          </th>
                          <th
                            scope="col"
                            className="px-5 py-3 text-right font-semibold text-foreground"
                          >
                            Min
                          </th>
                          <th
                            scope="col"
                            className="px-5 py-3 text-right font-semibold text-foreground"
                          >
                            Maks
                          </th>
                          <th
                            scope="col"
                            className="px-5 py-3 text-right font-semibold text-foreground"
                          >
                            Rerata
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {page.data.criteria.map((criterion) => (
                          <tr
                            key={criterion.id}
                            className="border-b border-border-subtle last:border-b-0"
                          >
                            <td className="px-5 py-4">
                              <p className="font-medium text-foreground">
                                {criterion.name}
                              </p>
                              {criterion.missing_partner_count > 0 && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {criterion.missing_partner_count} mitra belum
                                  dinilai
                                </p>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <Badge
                                variant={
                                  criterion.type === 'benefit'
                                    ? 'info'
                                    : 'warning'
                                }
                              >
                                {criterion.type === 'benefit'
                                  ? 'Benefit'
                                  : 'Cost'}
                              </Badge>
                            </td>
                            <td className="px-5 py-4 text-right font-mono text-foreground">
                              {formatNumber(criterion.weight)}
                            </td>
                            <td className="px-5 py-4 text-right font-mono text-foreground">
                              {criterion.stats?.count ?? 0}
                            </td>
                            <td className="px-5 py-4 text-right font-mono text-foreground">
                              {criterion.stats
                                ? formatNumber(criterion.stats.min)
                                : '—'}
                            </td>
                            <td className="px-5 py-4 text-right font-mono text-foreground">
                              {criterion.stats
                                ? formatNumber(criterion.stats.max)
                                : '—'}
                            </td>
                            <td className="px-5 py-4 text-right font-mono text-foreground">
                              {criterion.stats
                                ? formatNumber(criterion.stats.average)
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pemeriksaan kesiapan rekomendasi</CardTitle>
                <CardDescription>
                  Sumber yang sama dengan halaman rekomendasi mahasiswa. Tabel
                  ini tidak menghitung peringkat resmi.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ChecksList checks={page.data.recommendation.checks} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Catatan data</CardTitle>
              </CardHeader>

              <CardContent>
                <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
                  {page.data.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </PageContainer>
    </AppLayout>
  )
}
