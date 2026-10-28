import { useEffect, useState, type FormEvent } from 'react'
import { ClipboardList, Save } from 'lucide-react'
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
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { Input } from '../components/ui/Input'
import { getApiErrorMessage, getFieldErrors } from '../lib/apiError'
import {
  gradeInputFromValues,
  gradeValuesFromSheet,
  validateGradeValues,
} from '../lib/academic'
import {
  getStudentGrades,
  saveStudentGrades,
  type StudentGradeSheet,
} from '../services/academic'

type SheetState =
  | { status: 'loading' }
  | { status: 'ready'; sheet: StudentGradeSheet }
  | { status: 'error'; message: string }

export default function StudentGradesPage() {
  const { user, isLoading: authLoading, logout } = useAuth()

  const [sheetState, setSheetState] = useState<SheetState>({
    status: 'loading',
  })
  const [values, setValues] = useState<Record<number, string>>({})
  const [errors, setErrors] = useState<Record<number, string>>({})
  const [saveError, setSaveError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadSheet() {
      try {
        const sheet = await getStudentGrades()

        if (active) {
          setSheetState({ status: 'ready', sheet })
          setValues(gradeValuesFromSheet(sheet.courses))
          setErrors({})
          setSaveError('')
        }
      } catch (error: unknown) {
        if (active) {
          setSheetState({
            status: 'error',
            message: getApiErrorMessage(
              error,
              'Nilai akademik gagal dimuat. Coba lagi.',
            ),
          })
        }
      }
    }

    void loadSheet()

    return () => {
      active = false
    }
  }, [reloadKey])

  function retry() {
    setSheetState({ status: 'loading' })
    setErrors({})
    setSaveError('')
    setSuccessMessage('')
    setReloadKey((current) => current + 1)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (sheetState.status !== 'ready' || saving) return

    setSuccessMessage('')
    setSaveError('')

    const nextErrors = validateGradeValues(
      values,
      sheetState.sheet.scoreBounds,
    )

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setSaveError('Periksa kembali nilai yang diisi.')
      return
    }

    setErrors({})
    setSaving(true)

    try {
      const updated = await saveStudentGrades(
        gradeInputFromValues(sheetState.sheet.courses, values),
      )
      setSheetState({ status: 'ready', sheet: updated })
      setValues(gradeValuesFromSheet(updated.courses))
      setSuccessMessage('Nilai akademik berhasil disimpan.')
    } catch (error: unknown) {
      const fieldErrors = getFieldErrors(error)
      const nextFieldErrors: Record<number, string> = {}
      let remainingMessage = ''

      for (const [field, message] of Object.entries(fieldErrors)) {
        const match = field.match(/^grades\.(\d+)\.score$/)
        const index = match ? Number(match[1]) : null
        const course =
          index === null ? undefined : sheetState.sheet.courses[index]

        if (course) {
          nextFieldErrors[course.id] = message
        } else if (remainingMessage === '') {
          remainingMessage = message
        }
      }

      if (Object.keys(nextFieldErrors).length > 0) {
        setErrors(nextFieldErrors)
        setSaveError('Periksa kembali nilai yang diisi.')
      } else {
        setSaveError(
          getApiErrorMessage(
            error,
            'Nilai akademik gagal disimpan. Coba lagi.',
          ),
        )
      }

      if (remainingMessage !== '' && Object.keys(nextFieldErrors).length === 0) {
        setSaveError(remainingMessage)
      }
    } finally {
      setSaving(false)
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
          title="Nilai akademik"
          description="Catat nilai mata kuliah yang tersedia pada akun Anda. Nilai kosong tidak dianggap nol."
        />

        {sheetState.status === 'loading' && (
          <Card>
            <CardContent>
              <LoadingState message="Memuat nilai akademik..." />
            </CardContent>
          </Card>
        )}

        {sheetState.status === 'error' && (
          <Card>
            <CardContent>
              <ErrorState
                title="Nilai akademik gagal dimuat"
                message={sheetState.message}
                action={
                  <Button variant="outline" size="sm" onClick={retry}>
                    Coba lagi
                  </Button>
                }
              />
            </CardContent>
          </Card>
        )}

        {sheetState.status === 'ready' && (
          <div className="space-y-4">
            <PrerequisiteStatus
              status={sheetState.sheet.prerequisiteEvaluation.status}
              message={sheetState.sheet.prerequisiteEvaluation.message}
            />

            {successMessage && (
              <Alert variant="success" title="Nilai tersimpan">
                {successMessage}
              </Alert>
            )}

            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ClipboardList
                        className="size-5 text-primary"
                        aria-hidden="true"
                      />
                      <CardTitle>Mata kuliah dan nilai</CardTitle>
                    </div>
                    <CardDescription>
                      Isi nilai sesuai data yang sah. Skala resmi dan ambang
                      kelulusan belum ditetapkan, sehingga halaman ini tidak
                      menampilkan status lulus atau tidak lulus.
                    </CardDescription>
                  </div>

                  {sheetState.sheet.courses.length > 0 && (
                    <Badge variant="neutral">
                      {sheetState.sheet.courses.length} mata kuliah
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {sheetState.sheet.courses.length === 0 ? (
                  <EmptyState
                    title="Belum ada mata kuliah"
                    description="Master mata kuliah belum berisi data. Hubungi Admin atau Prodi sebelum mengisi nilai akademik."
                  />
                ) : (
                  <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                    <Alert variant="info" title="Nilai kosong">
                      Kosongkan kolom nilai lalu simpan untuk menghapus nilai
                      mata kuliah tersebut. Nilai kosong tidak disimpan sebagai
                      angka nol.
                    </Alert>

                    <div className="divide-y divide-border-subtle border-y border-border-subtle">
                      {sheetState.sheet.courses.map((course) => {
                        const inputId = `grade-${course.id}`
                        const error = errors[course.id]

                        return (
                          <div
                            key={course.id}
                            className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-start"
                          >
                            <div className="space-y-1">
                              <p className="font-semibold text-foreground">
                                {course.name}
                              </p>
                              {course.description && (
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                  {course.description}
                                </p>
                              )}
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
                                min={sheetState.sheet.scoreBounds.min}
                                max={sheetState.sheet.scoreBounds.max}
                                value={values[course.id] ?? ''}
                                onChange={(event) => {
                                  const value = event.target.value

                                  setSaveError('')
                                  setSuccessMessage('')
                                  setValues((current) => ({
                                    ...current,
                                    [course.id]: value,
                                  }))
                                  setErrors((current) => {
                                    if (!current[course.id]) {
                                      return current
                                    }

                                    const next = { ...current }
                                    delete next[course.id]

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
                                  {course.score === null
                                    ? 'Belum ada nilai tersimpan.'
                                    : 'Nilai tersimpan. Ubah atau kosongkan.'}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {saveError && (
                      <Alert variant="danger" title="Nilai belum dapat disimpan">
                        {saveError}
                      </Alert>
                    )}

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        isLoading={saving}
                        loadingLabel="Menyimpan…"
                        leftIcon={<Save className="size-4" aria-hidden="true" />}
                      >
                        Simpan nilai
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </PageContainer>
    </AppLayout>
  )
}

type PrerequisiteStatusProps = {
  status: StudentGradeSheet['prerequisiteEvaluation']['status']
  message: string
}

function PrerequisiteStatus({ status, message }: PrerequisiteStatusProps) {
  if (status === 'invalid') {
    return (
      <Alert variant="danger" title="Konfigurasi prasyarat tidak valid">
        {message} Nilai tetap dapat dicatat, tetapi status prasyarat tidak dapat
        dievaluasi.
      </Alert>
    )
  }

  if (status === 'configured') {
    return (
      <Alert variant="info" title="Aturan prasyarat tersedia">
        {message} Status kelulusan tidak ditampilkan di halaman ini.
      </Alert>
    )
  }

  return (
    <Alert variant="warning" title="Aturan prasyarat belum dikonfigurasi">
      {message} Nilai dapat dicatat, tetapi aplikasi belum dapat menyatakan
      mahasiswa memenuhi prasyarat.
    </Alert>
  )
}
