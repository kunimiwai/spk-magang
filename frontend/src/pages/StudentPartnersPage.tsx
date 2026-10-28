import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { AppLayout } from '../components/layout/AppLayout'
import {
  PageContainer,
  PageHeader,
} from '../components/layout/PageContainer'
import { Alert } from '../components/ui/Alert'
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
import { buttonClasses } from '../lib/buttonStyles'
import {
  listStudentPartners,
  type ApplicationPartner,
} from '../services/applications'

type PartnerListState =
  | { status: 'loading' }
  | { status: 'ready'; partners: ApplicationPartner[] }
  | { status: 'error'; message: string }

function EmptyValue() {
  return (
    <span className="text-muted-foreground" aria-label="Tidak diisi">
      —
    </span>
  )
}

export default function StudentPartnersPage() {
  const { user, isLoading: authLoading, logout } = useAuth()

  const [listState, setListState] = useState<PartnerListState>({
    status: 'loading',
  })
  const [reloadKey, setReloadKey] = useState(0)
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadPartners() {
      try {
        const partners = await listStudentPartners()

        if (active) {
          setListState({ status: 'ready', partners })
        }
      } catch (error: unknown) {
        if (active) {
          setListState({
            status: 'error',
            message: getApiErrorMessage(
              error,
              'Daftar mitra magang gagal dimuat. Coba lagi.',
            ),
          })
        }
      }
    }

    void loadPartners()

    return () => {
      active = false
    }
  }, [reloadKey])

  function retry() {
    setListState({ status: 'loading' })
    setReloadKey((current) => current + 1)
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
          title="Mitra magang"
          description="Lihat informasi mitra sebelum memilih tempat magang dan mengirim pengajuan."
        />

        <div className="space-y-4">
          <Alert variant="info" title="Sumber data">
            Katalog ini berasal dari master data mitra. Urutan rekomendasi
            K-Means/SAW ditampilkan terpisah pada halaman Rekomendasi setelah
            seluruh konfigurasi dan data dinyatakan siap.
          </Alert>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2
                      className="size-5 text-primary"
                      aria-hidden="true"
                    />
                    <CardTitle>Daftar mitra</CardTitle>
                  </div>
                  <CardDescription>
                    Nama instansi, deskripsi, dan kontak resmi yang tersimpan
                    di backend.
                  </CardDescription>
                </div>

                {listState.status === 'ready' && (
                  <span className="text-sm text-muted-foreground">
                    {listState.partners.length} mitra
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {listState.status === 'loading' && (
                <LoadingState message="Memuat mitra magang..." />
              )}

              {listState.status === 'error' && (
                <ErrorState
                  title="Daftar mitra gagal dimuat"
                  message={listState.message}
                  action={
                    <Button variant="outline" size="sm" onClick={retry}>
                      Coba lagi
                    </Button>
                  }
                />
              )}

              {listState.status === 'ready' &&
                (listState.partners.length === 0 ? (
                  <EmptyState
                    title="Belum ada mitra magang"
                    description="Admin belum menambahkan data mitra. Pengajuan belum dapat dikirim sampai katalog mitra tersedia."
                  />
                ) : (
                  <ul
                    className="grid gap-4 lg:grid-cols-2"
                    aria-label="Katalog mitra magang"
                  >
                    {listState.partners.map((partner) => (
                      <li key={partner.id}>
                        <article className="flex h-full flex-col rounded-xl border border-border-subtle p-4">
                          <div className="flex-1 space-y-3">
                            <div className="space-y-1">
                              <h2 className="text-base font-semibold text-foreground">
                                {partner.name}
                              </h2>
                              <p className="text-sm leading-relaxed text-muted-foreground">
                                {partner.description ?? (
                                  <span className="italic">
                                    Deskripsi mitra belum diisi.
                                  </span>
                                )}
                              </p>
                            </div>

                            <dl className="space-y-2 text-sm">
                              <div className="flex items-start gap-2">
                                <dt className="sr-only">Email</dt>
                                <Mail
                                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                                  aria-hidden="true"
                                />
                                <dd className="min-w-0 break-all text-foreground">
                                  {partner.email ? (
                                    <a
                                      href={`mailto:${partner.email}`}
                                      className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                    >
                                      {partner.email}
                                    </a>
                                  ) : (
                                    <EmptyValue />
                                  )}
                                </dd>
                              </div>

                              <div className="flex items-start gap-2">
                                <dt className="sr-only">Kontak</dt>
                                <Phone
                                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                                  aria-hidden="true"
                                />
                                <dd className="break-words text-foreground">
                                  {partner.contact ?? <EmptyValue />}
                                </dd>
                              </div>

                              <div className="flex items-start gap-2">
                                <dt className="sr-only">Alamat</dt>
                                <MapPin
                                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                                  aria-hidden="true"
                                />
                                <dd className="break-words text-foreground">
                                  {partner.address ?? <EmptyValue />}
                                </dd>
                              </div>
                            </dl>
                          </div>

                          <div className="mt-4 border-t border-border-subtle pt-3">
                            <Link
                              to={`/mahasiswa/pengajuan?partner=${partner.id}`}
                              className={buttonClasses({
                                variant: 'primary',
                                size: 'sm',
                              })}
                            >
                              Ajukan magang
                              <ArrowRight
                                className="size-4"
                                aria-hidden="true"
                              />
                            </Link>
                          </div>
                        </article>
                      </li>
                    ))}
                  </ul>
                ))}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppLayout>
  )
}
