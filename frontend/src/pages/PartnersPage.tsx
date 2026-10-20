import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { AppLayout } from '../components/layout/AppLayout'
import {
  PageContainer,
  PageHeader,
} from '../components/layout/PageContainer'
import { DeletePartnerDialog } from '../components/partners/DeletePartnerDialog'
import { PartnerFormDialog } from '../components/partners/PartnerFormDialog'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/Card'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { getApiErrorMessage } from '../lib/apiError'
import {
  listPartners,
  type PaginationMeta,
  type Partner,
} from '../services/partners'

const PAGE_SIZE = 10

const initialMeta: PaginationMeta = {
  current_page: 1,
  per_page: PAGE_SIZE,
  last_page: 1,
  total: 0,
}

type FormState =
  | { mode: 'create' }
  | { mode: 'edit'; partner: Partner }
  | null

function EmptyValue() {
  return (
    <span className="text-muted-foreground" aria-label="Tidak diisi">
      —
    </span>
  )
}

export default function PartnersPage() {
  const { user, isLoading: authLoading, logout } = useAuth()

  const [partners, setPartners] = useState<Partner[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(initialMeta)
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [formState, setFormState] = useState<FormState>(null)
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null)
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadPartners() {
      try {
        const result = await listPartners({ page, perPage: PAGE_SIZE })

        if (!active) return

        setPartners(result.partners)
        setMeta(result.meta)
        setListError('')
      } catch (error: unknown) {
        if (!active) return

        setPartners([])
        setListError(
          getApiErrorMessage(error, 'Data mitra gagal dimuat. Coba lagi.'),
        )
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadPartners()

    return () => {
      active = false
    }
  }, [page, reloadKey])

  const reload = useCallback(() => {
    setIsLoading(true)
    setReloadKey((current) => current + 1)
  }, [])

  const handleSaved = useCallback((message: string) => {
    setFormState(null)
    setSuccessMessage(message)
    setIsLoading(true)
    setReloadKey((current) => current + 1)
  }, [])

  const handleDeleted = useCallback(
    (message: string) => {
      setDeleteTarget(null)
      setSuccessMessage(message)
      setIsLoading(true)

      if (partners.length === 1 && page > 1) {
        setPage((current) => Math.max(1, current - 1))
      } else {
        setReloadKey((current) => current + 1)
      }
    },
    [page, partners.length],
  )

  const closeForm = useCallback(() => setFormState(null), [])
  const closeDelete = useCallback(() => setDeleteTarget(null), [])

  function openCreate() {
    setSuccessMessage('')
    setFormState({ mode: 'create' })
  }

  function openEdit(partner: Partner) {
    setSuccessMessage('')
    setFormState({ mode: 'edit', partner })
  }

  function goToPage(nextPage: number) {
    setSuccessMessage('')
    setListError('')
    setIsLoading(true)
    setPage(nextPage)
  }

  function retry() {
    setListError('')
    reload()
  }

  async function handleLogout() {
    setLogoutLoading(true)

    try {
      await logout()
    } finally {
      setLogoutLoading(false)
    }
  }

  const hasPreviousPage = meta.current_page > 1
  const hasNextPage = meta.current_page < meta.last_page

  return (
    <AppLayout
      user={user}
      authLoading={authLoading}
      onLogout={handleLogout}
      logoutLoading={logoutLoading}
    >
      <PageContainer>
        <PageHeader
          eyebrow="Administrasi"
          title="Mitra magang"
          description="Kelola nama instansi, kontak, email, alamat, dan deskripsi mitra magang."
          actions={
            <Button
              onClick={openCreate}
              leftIcon={<Plus className="size-4" aria-hidden="true" />}
            >
              Tambah mitra
            </Button>
          }
        />

        {successMessage && (
          <Alert
            variant="success"
            title="Berhasil"
            className="mb-4"
          >
            {successMessage}
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle>Daftar mitra</CardTitle>
                <CardDescription>
                  Data mitra yang tersimpan di backend. Daftar dimuat per
                  halaman.
                </CardDescription>
              </div>

              {!isLoading && !listError && (
                <Badge variant="neutral">{meta.total} mitra</Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="px-5 pb-5">
                <LoadingState message="Memuat data mitra magang..." />
              </div>
            ) : listError ? (
              <div className="px-5 pb-5">
                <ErrorState
                  title="Data mitra gagal dimuat"
                  message={listError}
                  action={
                    <Button variant="outline" size="sm" onClick={retry}>
                      Coba lagi
                    </Button>
                  }
                />
              </div>
            ) : partners.length === 0 ? (
              <div className="px-5 pb-5">
                <EmptyState
                  title="Belum ada mitra magang"
                  description="Tambahkan mitra pertama untuk mulai mengelola data instansi magang."
                  action={
                    <Button variant="outline" size="sm" onClick={openCreate}>
                      Tambah mitra
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                <p className="px-5 pt-3 text-xs leading-relaxed text-muted-foreground xl:hidden">
                  Geser tabel ke samping untuk melihat semua kolom.
                </p>

                <div
                  className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  role="region"
                  aria-label="Tabel daftar mitra magang, dapat digulir horizontal"
                  tabIndex={0}
                >
                  <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
                    <caption className="sr-only">Daftar mitra magang</caption>
                    <thead>
                      <tr className="border-y border-border-subtle bg-muted">
                        <th
                          scope="col"
                          className="px-5 py-3 font-semibold text-foreground"
                        >
                          Nama instansi
                        </th>
                        <th
                          scope="col"
                          className="px-5 py-3 font-semibold text-foreground"
                        >
                          Kontak
                        </th>
                        <th
                          scope="col"
                          className="px-5 py-3 font-semibold text-foreground"
                        >
                          Email
                        </th>
                        <th
                          scope="col"
                          className="px-5 py-3 font-semibold text-foreground"
                        >
                          Alamat
                        </th>
                        <th
                          scope="col"
                          className="px-5 py-3 text-right font-semibold text-foreground"
                        >
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {partners.map((partner) => (
                        <tr
                          key={partner.id}
                          className="border-b border-border-subtle align-top last:border-b-0"
                        >
                          <td className="max-w-72 px-5 py-4">
                            <p className="font-semibold text-foreground">
                              {partner.name}
                            </p>
                            {partner.description && (
                              <p
                                className="mt-1 line-clamp-2 text-muted-foreground"
                                title={partner.description}
                              >
                                {partner.description}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-4 text-foreground">
                            {partner.contact || <EmptyValue />}
                          </td>
                          <td className="px-5 py-4">
                            {partner.email ? (
                              <a
                                href={`mailto:${partner.email}`}
                                className="break-all text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                              >
                                {partner.email}
                              </a>
                            ) : (
                              <EmptyValue />
                            )}
                          </td>
                          <td className="max-w-72 px-5 py-4 text-foreground">
                            {partner.address ? (
                              <span
                                className="line-clamp-2"
                                title={partner.address}
                              >
                                {partner.address}
                              </span>
                            ) : (
                              <EmptyValue />
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(partner)}
                                leftIcon={
                                  <Pencil className="size-4" aria-hidden="true" />
                                }
                                aria-label={`Ubah ${partner.name}`}
                              >
                                Ubah
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget(partner)}
                                leftIcon={
                                  <Trash2 className="size-4" aria-hidden="true" />
                                }
                                aria-label={`Hapus ${partner.name}`}
                                className="text-destructive hover:bg-danger-surface"
                              >
                                Hapus
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>

          {!isLoading && !listError && partners.length > 0 && (
            <CardFooter className="justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Menampilkan {partners.length} dari {meta.total} mitra
              </p>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(meta.current_page - 1)}
                  disabled={!hasPreviousPage}
                  leftIcon={
                    <ChevronLeft className="size-4" aria-hidden="true" />
                  }
                >
                  Sebelumnya
                </Button>

                <span className="px-1 text-sm text-muted-foreground">
                  Halaman {meta.current_page} dari {Math.max(meta.last_page, 1)}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(meta.current_page + 1)}
                  disabled={!hasNextPage}
                >
                  Berikutnya
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </PageContainer>

      {formState && (
        <PartnerFormDialog
          key={
            formState.mode === 'edit'
              ? `edit-${formState.partner.id}`
              : 'create'
          }
          mode={formState.mode}
          partner={formState.mode === 'edit' ? formState.partner : undefined}
          onClose={closeForm}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <DeletePartnerDialog
          partner={deleteTarget}
          onClose={closeDelete}
          onDeleted={handleDeleted}
        />
      )}
    </AppLayout>
  )
}
