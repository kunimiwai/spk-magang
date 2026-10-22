import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import { Link } from 'react-router-dom'
import { ListChecks, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { AppLayout } from '../components/layout/AppLayout'
import {
  PageContainer,
  PageHeader,
} from '../components/layout/PageContainer'
import { CriterionFormDialog } from '../components/criteria/CriterionFormDialog'
import { DeleteCriterionDialog } from '../components/criteria/DeleteCriterionDialog'
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
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { getApiErrorMessage } from '../lib/apiError'
import { buttonClasses } from '../lib/buttonStyles'
import {
  getPartnerScores,
  listCriteria,
  listPartnerOptions,
  savePartnerScores,
  type Criterion,
  type PartnerOption,
  type PartnerScoreSheet,
} from '../services/criteria'

const MAX_SCORE = 999999.999999
const MIN_SCORE = -999999.999999

const numberFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 6,
})

function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

function typeLabel(type: Criterion['type']): string {
  return type === 'benefit' ? 'Benefit' : 'Cost'
}

function typeBadgeVariant(type: Criterion['type']) {
  return type === 'benefit' ? 'info' : 'warning'
}

type FormState =
  | { mode: 'create' }
  | { mode: 'edit'; criterion: Criterion }
  | null

function scoreValuesFromSheet(
  sheet: PartnerScoreSheet,
): Record<number, string> {
  const values: Record<number, string> = {}

  for (const criterion of sheet.criteria) {
    values[criterion.criterion_id] =
      criterion.score === null ? '' : String(criterion.score)
  }

  return values
}

export default function CriteriaPage() {
  const { user, isLoading: authLoading, logout } = useAuth()

  const [criteria, setCriteria] = useState<Criterion[]>([])
  const [criteriaLoading, setCriteriaLoading] = useState(true)
  const [criteriaError, setCriteriaError] = useState('')
  const [criteriaReloadKey, setCriteriaReloadKey] = useState(0)

  const [partnerOptions, setPartnerOptions] = useState<PartnerOption[]>([])
  const [partnerOptionsLoading, setPartnerOptionsLoading] = useState(true)
  const [partnerOptionsError, setPartnerOptionsError] = useState('')
  const [partnerOptionsReloadKey, setPartnerOptionsReloadKey] = useState(0)

  const [selectedPartnerId, setSelectedPartnerId] = useState('')
  const [sheet, setSheet] = useState<PartnerScoreSheet | null>(null)
  const [sheetLoading, setSheetLoading] = useState(false)
  const [sheetError, setSheetError] = useState('')
  const [sheetReloadKey, setSheetReloadKey] = useState(0)
  const [scoreValues, setScoreValues] = useState<Record<number, string>>({})
  const [scoreErrors, setScoreErrors] = useState<Record<number, string>>({})
  const [scoreSaveError, setScoreSaveError] = useState('')
  const [savingScores, setSavingScores] = useState(false)

  const [formState, setFormState] = useState<FormState>(null)
  const [deleteTarget, setDeleteTarget] = useState<Criterion | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadCriteria() {
      try {
        const data = await listCriteria()

        if (active) {
          setCriteria(data)
          setCriteriaError('')
        }
      } catch (error: unknown) {
        if (active) {
          setCriteria([])
          setCriteriaError(
            getApiErrorMessage(error, 'Kriteria gagal dimuat. Coba lagi.'),
          )
        }
      } finally {
        if (active) {
          setCriteriaLoading(false)
        }
      }
    }

    void loadCriteria()

    return () => {
      active = false
    }
  }, [criteriaReloadKey])

  useEffect(() => {
    let active = true

    async function loadPartnerOptions() {
      try {
        const data = await listPartnerOptions()

        if (active) {
          setPartnerOptions(data)
          setPartnerOptionsError('')
        }
      } catch (error: unknown) {
        if (active) {
          setPartnerOptions([])
          setPartnerOptionsError(
            getApiErrorMessage(
              error,
              'Daftar mitra gagal dimuat. Coba lagi.',
            ),
          )
        }
      } finally {
        if (active) {
          setPartnerOptionsLoading(false)
        }
      }
    }

    void loadPartnerOptions()

    return () => {
      active = false
    }
  }, [partnerOptionsReloadKey])

  useEffect(() => {
    if (!selectedPartnerId) return

    let active = true

    async function loadScoreSheet() {
      try {
        const data = await getPartnerScores(Number(selectedPartnerId))

        if (active) {
          setSheet(data)
          setScoreValues(scoreValuesFromSheet(data))
          setScoreErrors({})
          setSheetError('')
        }
      } catch (error: unknown) {
        if (active) {
          setSheet(null)
          setScoreValues({})
          setSheetError(
            getApiErrorMessage(
              error,
              'Nilai kriteria mitra gagal dimuat. Coba lagi.',
            ),
          )
        }
      } finally {
        if (active) {
          setSheetLoading(false)
        }
      }
    }

    void loadScoreSheet()

    return () => {
      active = false
    }
  }, [selectedPartnerId, sheetReloadKey, criteriaReloadKey])

  const openCreate = useCallback(() => {
    setSuccessMessage('')
    setFormState({ mode: 'create' })
  }, [])

  const openEdit = useCallback((criterion: Criterion) => {
    setSuccessMessage('')
    setFormState({ mode: 'edit', criterion })
  }, [])

  const closeForm = useCallback(() => setFormState(null), [])
  const closeDelete = useCallback(() => setDeleteTarget(null), [])

  const refreshAfterCriteriaChange = useCallback(() => {
    setCriteriaLoading(true)

    if (selectedPartnerId) {
      setSheetLoading(true)
    }

    setCriteriaReloadKey((current) => current + 1)
  }, [selectedPartnerId])

  const handleSaved = useCallback(
    (message: string) => {
      setFormState(null)
      setSuccessMessage(message)
      refreshAfterCriteriaChange()
    },
    [refreshAfterCriteriaChange],
  )

  const handleDeleted = useCallback(
    (message: string) => {
      setDeleteTarget(null)
      setSuccessMessage(message)
      refreshAfterCriteriaChange()
    },
    [refreshAfterCriteriaChange],
  )

  function handlePartnerChange(value: string) {
    setSelectedPartnerId(value)
    setSheet(null)
    setScoreValues({})
    setScoreErrors({})
    setSheetError('')
    setScoreSaveError('')
    setSuccessMessage('')
    setSheetLoading(value !== '')
  }

  function retryCriteria() {
    setCriteriaError('')
    setCriteriaLoading(true)
    setCriteriaReloadKey((current) => current + 1)
  }

  function retryPartnerOptions() {
    setPartnerOptionsError('')
    setPartnerOptionsLoading(true)
    setPartnerOptionsReloadKey((current) => current + 1)
  }

  function retryScoreSheet() {
    setSheetError('')
    setSheetLoading(true)
    setSheetReloadKey((current) => current + 1)
  }

  async function handleScoreSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!sheet || savingScores) return

    const nextErrors: Record<number, string> = {}
    const payload = sheet.criteria.map((criterion) => {
      const rawValue = (scoreValues[criterion.criterion_id] ?? '').trim()

      if (rawValue === '') {
        return { criterion_id: criterion.criterion_id, score: null }
      }

      const value = Number(rawValue)

      if (!Number.isFinite(value)) {
        nextErrors[criterion.criterion_id] = 'Nilai harus berupa angka.'
      } else if (value < MIN_SCORE || value > MAX_SCORE) {
        nextErrors[criterion.criterion_id] =
          'Nilai melebihi batas penyimpanan.'
      }

      return { criterion_id: criterion.criterion_id, score: value }
    })

    if (Object.keys(nextErrors).length > 0) {
      setScoreErrors(nextErrors)
      setScoreSaveError('Periksa kembali nilai yang diisi.')
      return
    }

    setScoreErrors({})
    setScoreSaveError('')
    setSavingScores(true)

    try {
      const updatedSheet = await savePartnerScores(
        Number(selectedPartnerId),
        payload,
      )
      setSheet(updatedSheet)
      setScoreValues(scoreValuesFromSheet(updatedSheet))
      setSuccessMessage('Nilai kriteria mitra berhasil disimpan.')
    } catch (error: unknown) {
      setScoreSaveError(
        getApiErrorMessage(
          error,
          'Nilai kriteria mitra gagal disimpan. Coba lagi.',
        ),
      )
    } finally {
      setSavingScores(false)
    }
  }

  async function handleLogout() {
    setLogoutLoading(true)

    try {
      await logout()
    } finally {
      setLogoutLoading(false)
    }
  }

  const totalCriteriaLabel =
    criteria.length === 1 ? '1 kriteria' : `${criteria.length} kriteria`

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
          title="Kriteria & penilaian mitra"
          description="Kelola master kriteria dan isi nilai setiap mitra. Daftar kriteria resmi, skala nilai, dan total bobot belum ditetapkan."
          actions={
            <Button
              onClick={openCreate}
              leftIcon={<Plus className="size-4" aria-hidden="true" />}
            >
              Tambah kriteria
            </Button>
          }
        />

        {successMessage && (
          <Alert variant="success" title="Berhasil" className="mb-4">
            {successMessage}
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ListChecks
                    className="size-5 text-primary"
                    aria-hidden="true"
                  />
                  <CardTitle>Master kriteria</CardTitle>
                </div>
                <CardDescription>
                  Kriteria dan bobot yang tersimpan. Total bobot tidak
                  divalidasi karena aturan normalisasi belum ditetapkan.
                  Kriteria yang sudah memiliki nilai mitra tidak dapat dihapus.
                </CardDescription>
              </div>

              {!criteriaLoading && !criteriaError && (
                <Badge variant="neutral">{totalCriteriaLabel}</Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {criteriaLoading ? (
              <div className="px-5 pb-5">
                <LoadingState message="Memuat kriteria penilaian..." />
              </div>
            ) : criteriaError ? (
              <div className="px-5 pb-5">
                <ErrorState
                  title="Kriteria gagal dimuat"
                  message={criteriaError}
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={retryCriteria}
                    >
                      Coba lagi
                    </Button>
                  }
                />
              </div>
            ) : criteria.length === 0 ? (
              <div className="px-5 pb-5">
                <EmptyState
                  title="Belum ada kriteria"
                  description="Tambahkan kriteria pertama. Isi daftar kriteria sesuai keputusan pemilik produk; aplikasi tidak menyediakan kriteria bawaan."
                  action={
                    <Button variant="outline" size="sm" onClick={openCreate}>
                      Tambah kriteria
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
                  aria-label="Tabel daftar kriteria, dapat digulir horizontal"
                  tabIndex={0}
                >
                  <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
                    <caption className="sr-only">
                      Daftar kriteria penilaian
                    </caption>
                    <thead>
                      <tr className="border-y border-border-subtle bg-muted">
                        <th
                          scope="col"
                          className="px-5 py-3 font-semibold text-foreground"
                        >
                          Nama kriteria
                        </th>
                        <th
                          scope="col"
                          className="px-5 py-3 font-semibold text-foreground"
                        >
                          Tipe
                        </th>
                        <th
                          scope="col"
                          className="px-5 py-3 font-semibold text-foreground"
                        >
                          Bobot
                        </th>
                        <th
                          scope="col"
                          className="px-5 py-3 font-semibold text-foreground"
                        >
                          Nilai mitra
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
                      {criteria.map((criterion) => (
                        <tr
                          key={criterion.id}
                          className="border-b border-border-subtle align-top last:border-b-0"
                        >
                          <td className="max-w-80 px-5 py-4">
                            <p className="font-semibold text-foreground">
                              {criterion.name}
                            </p>
                            {criterion.description && (
                              <p
                                className="mt-1 line-clamp-2 text-muted-foreground"
                                title={criterion.description}
                              >
                                {criterion.description}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant={typeBadgeVariant(criterion.type)}>
                              {typeLabel(criterion.type)}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 font-mono text-foreground">
                            {formatNumber(criterion.weight)}
                          </td>
                          <td className="px-5 py-4 text-foreground">
                            {criterion.scores_count > 0
                              ? `${criterion.scores_count} nilai`
                              : 'Belum dinilai'}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(criterion)}
                                leftIcon={
                                  <Pencil
                                    className="size-4"
                                    aria-hidden="true"
                                  />
                                }
                                aria-label={`Ubah ${criterion.name}`}
                              >
                                Ubah
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget(criterion)}
                                disabled={criterion.scores_count > 0}
                                title={
                                  criterion.scores_count > 0
                                    ? 'Hapus nilai mitra terlebih dahulu sebelum menghapus kriteria.'
                                    : undefined
                                }
                                leftIcon={
                                  <Trash2
                                    className="size-4"
                                    aria-hidden="true"
                                  />
                                }
                                aria-label={`Hapus ${criterion.name}`}
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
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Penilaian mitra</CardTitle>
            <CardDescription>
              Pilih mitra lalu isi nilai untuk setiap kriteria. Skala nilai
              belum ditetapkan, sehingga aplikasi tidak membatasi rentang
              selain batas penyimpanan teknis.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {partnerOptionsLoading ? (
              <LoadingState message="Memuat daftar mitra..." />
            ) : partnerOptionsError ? (
              <ErrorState
                title="Daftar mitra gagal dimuat"
                message={partnerOptionsError}
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={retryPartnerOptions}
                  >
                    Coba lagi
                  </Button>
                }
              />
            ) : partnerOptions.length === 0 ? (
              <EmptyState
                title="Belum ada mitra magang"
                description="Nilai kriteria hanya dapat diisi setelah ada mitra. Tambahkan mitra terlebih dahulu melalui pengelolaan mitra."
                action={
                  user?.role === 'admin' ? (
                    <Link
                      to="/mitra"
                      className={buttonClasses({
                        variant: 'outline',
                        size: 'sm',
                      })}
                    >
                      Kelola mitra
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              <>
                <div className="max-w-md">
                  <label
                    htmlFor="score-partner"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Mitra
                  </label>
                  <Select
                    id="score-partner"
                    value={selectedPartnerId}
                    onChange={(event) =>
                      handlePartnerChange(event.target.value)
                    }
                  >
                    <option value="">Pilih mitra</option>
                    {partnerOptions.map((partner) => (
                      <option key={partner.id} value={partner.id}>
                        {partner.name}
                      </option>
                    ))}
                  </Select>
                </div>

                {!selectedPartnerId ? (
                  <EmptyState
                    title="Pilih mitra untuk dinilai"
                    description="Setelah mitra dipilih, semua kriteria akan ditampilkan beserta nilai yang sudah tersimpan."
                  />
                ) : sheetLoading ? (
                  <LoadingState message="Memuat nilai kriteria mitra..." />
                ) : sheetError ? (
                  <ErrorState
                    title="Nilai kriteria gagal dimuat"
                    message={sheetError}
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={retryScoreSheet}
                      >
                        Coba lagi
                      </Button>
                    }
                  />
                ) : sheet && sheet.criteria.length === 0 ? (
                  <EmptyState
                    title="Belum ada kriteria untuk dinilai"
                    description="Tambahkan kriteria terlebih dahulu, lalu kembali ke bagian penilaian mitra."
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openCreate}
                      >
                        Tambah kriteria
                      </Button>
                    }
                  />
                ) : sheet ? (
                  <form onSubmit={handleScoreSubmit} className="space-y-4">
                    <Alert variant="info" title="Nilai dinilai per mitra">
                      Nilai yang dikosongkan lalu disimpan akan dihapus.
                      Perubahan disimpan sekaligus untuk semua kriteria.
                    </Alert>

                    <div className="divide-y divide-border-subtle border-y border-border-subtle">
                      {sheet.criteria.map((criterion) => {
                        const inputId = `score-${criterion.criterion_id}`
                        const error = scoreErrors[criterion.criterion_id]

                        return (
                          <div
                            key={criterion.criterion_id}
                            className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-start"
                          >
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-foreground">
                                  {criterion.name}
                                </p>
                                <Badge
                                  variant={typeBadgeVariant(criterion.type)}
                                >
                                  {typeLabel(criterion.type)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Bobot: {formatNumber(criterion.weight)}
                              </p>
                            </div>

                            <div className="space-y-1.5">
                              <label
                                htmlFor={inputId}
                                className="block text-sm font-medium text-foreground"
                              >
                                Nilai
                              </label>
                              <Input
                                id={inputId}
                                type="number"
                                step="any"
                                inputMode="decimal"
                                value={
                                  scoreValues[criterion.criterion_id] ?? ''
                                }
                                onChange={(event) => {
                                  const value = event.target.value

                                  setScoreSaveError('')
                                  setScoreValues((current) => ({
                                    ...current,
                                    [criterion.criterion_id]: value,
                                  }))
                                  setScoreErrors((current) => {
                                    if (!current[criterion.criterion_id]) {
                                      return current
                                    }

                                    const next = { ...current }
                                    delete next[criterion.criterion_id]

                                    return next
                                  })
                                }}
                                aria-invalid={error ? true : undefined}
                                aria-describedby={
                                  error ? `${inputId}-error` : undefined
                                }
                              />
                              {error ? (
                                <p
                                  id={`${inputId}-error`}
                                  className="text-sm font-medium text-destructive"
                                >
                                  {error}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  Kosongkan untuk menghapus nilai.
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {scoreSaveError && (
                      <Alert variant="danger" title="Nilai belum dapat disimpan">
                        {scoreSaveError}
                      </Alert>
                    )}

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        isLoading={savingScores}
                        loadingLabel="Menyimpan…"
                      >
                        Simpan nilai
                      </Button>
                    </div>
                  </form>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </PageContainer>

      {formState && (
        <CriterionFormDialog
          key={
            formState.mode === 'edit'
              ? `edit-${formState.criterion.id}`
              : 'create'
          }
          mode={formState.mode}
          criterion={
            formState.mode === 'edit' ? formState.criterion : undefined
          }
          onClose={closeForm}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <DeleteCriterionDialog
          criterion={deleteTarget}
          onClose={closeDelete}
          onDeleted={handleDeleted}
        />
      )}
    </AppLayout>
  )
}
