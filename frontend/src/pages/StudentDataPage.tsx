import { useEffect, useState, type FormEvent } from 'react'
import {
  GraduationCap,
  IdCard,
  Mail,
  Save,
  UserRound,
} from 'lucide-react'
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
import { Field } from '../components/ui/Field'
import { Select } from '../components/ui/Select'
import { EmptyState, LoadingState } from '../components/ui/States'
import { getApiErrorMessage, getFieldErrors } from '../lib/apiError'
import type {
  PeminatanSelectionMode,
  StudentProfile,
} from '../lib/peminatan'
import { getRoleLabel } from '../lib/roleLabels'
import { getStudentProfile, updateStudentProfile } from '../services/mahasiswa'

type ProfileState =
  | { status: 'loading' }
  | { status: 'ready'; profile: StudentProfile }
  | { status: 'error'; message: string }

export default function StudentDataPage() {
  const { user, isLoading: authLoading, logout } = useAuth()

  const [logoutLoading, setLogoutLoading] = useState(false)
  const [profileState, setProfileState] = useState<ProfileState>({
    status: 'loading',
  })
  const [selectedPeminatan, setSelectedPeminatan] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let active = true

    async function loadProfile() {
      try {
        const profile = await getStudentProfile()

        if (active) {
          setProfileState({ status: 'ready', profile })
          setSelectedPeminatan(profile.peminatan)
        }
      } catch (error: unknown) {
        if (active) {
          setProfileState({
            status: 'error',
            message: getApiErrorMessage(
              error,
              'Profil peminatan gagal dimuat.',
            ),
          })
        }
      }
    }

    void loadProfile()

    return () => {
      active = false
    }
  }, [reloadToken])

  function handleRetry() {
    setProfileState({ status: 'loading' })
    setFieldError(null)
    setSaveError(null)
    setSaveSuccess(null)
    setReloadToken((token) => token + 1)
  }

  function handleSelect(option: string, mode: PeminatanSelectionMode) {
    setFieldError(null)
    setSaveError(null)
    setSaveSuccess(null)

    if (mode === 'single') {
      setSelectedPeminatan([option])
      return
    }

    setSelectedPeminatan((current) =>
      current.includes(option)
        ? current.filter((value) => value !== option)
        : [...current, option],
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFieldError(null)
    setSaveError(null)
    setSaveSuccess(null)

    if (selectedPeminatan.length === 0) {
      setFieldError('Pilih minimal satu peminatan terlebih dahulu.')
      return
    }

    setSaving(true)

    try {
      const updated = await updateStudentProfile(selectedPeminatan)
      setProfileState({ status: 'ready', profile: updated })
      setSelectedPeminatan(updated.peminatan)
      setSaveSuccess('Peminatan berhasil disimpan.')
    } catch (error: unknown) {
      const fieldErrors = getFieldErrors(error)
      const message =
        fieldErrors.peminatan ??
        fieldErrors['peminatan.0'] ??
        Object.values(fieldErrors)[0] ??
        null

      if (message) {
        setFieldError(message)
      } else {
        setSaveError(
          getApiErrorMessage(error, 'Peminatan gagal disimpan. Coba lagi.'),
        )
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
          title="Data mahasiswa & peminatan"
          description="Data akun yang tersedia dan peminatan yang tersimpan untuk akun Anda."
        />

        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserRound
                  className="size-5 text-primary"
                  aria-hidden="true"
                />
                <CardTitle>Data mahasiswa</CardTitle>
              </div>
              <CardDescription>
                Data akun yang tersedia dari sesi aktif Anda.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {authLoading ? (
                <LoadingState message="Memuat data akun..." />
              ) : user ? (
                <dl className="grid gap-1 border-t border-border-subtle">
                  <div className="grid gap-1 border-b border-border-subtle py-3 sm:grid-cols-[8rem_1fr] sm:items-center">
                    <dt className="text-sm text-muted-foreground">Nama</dt>
                    <dd className="break-words text-sm font-medium text-foreground">
                      {user.name}
                    </dd>
                  </div>

                  <div className="grid gap-1 border-b border-border-subtle py-3 sm:grid-cols-[8rem_1fr] sm:items-center">
                    <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="size-4" aria-hidden="true" />
                      Email
                    </dt>
                    <dd className="break-all text-sm text-foreground">
                      {user.email}
                    </dd>
                  </div>

                  <div className="grid gap-1 border-b border-border-subtle py-3 sm:grid-cols-[8rem_1fr] sm:items-center">
                    <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                      <IdCard className="size-4" aria-hidden="true" />
                      ID pengguna
                    </dt>
                    <dd className="font-mono text-sm text-foreground">
                      {user.id}
                    </dd>
                  </div>

                  <div className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:items-center">
                    <dt className="text-sm text-muted-foreground">Role</dt>
                    <dd>
                      <Badge variant="info">{getRoleLabel(user.role)}</Badge>
                    </dd>
                  </div>
                </dl>
              ) : (
                <EmptyState
                  title="Data akun tidak tersedia"
                  description="Sesi aktif tidak menyertakan data pengguna. Masuk kembali untuk memuat data."
                />
              )}

              <Alert variant="info" title="Data profil belum lengkap">
                NIM, program studi, fakultas, angkatan, dan kontak belum
                ditetapkan sebagai data wajib, sehingga tidak ditampilkan atau
                disimpan.
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <GraduationCap
                  className="size-5 text-primary"
                  aria-hidden="true"
                />
                <CardTitle>Peminatan</CardTitle>
              </div>
              <CardDescription>
                Pilihan peminatan yang tersimpan pada akun mahasiswa.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {profileState.status === 'loading' && (
                <LoadingState message="Memuat profil peminatan..." />
              )}

              {profileState.status === 'error' && (
                <Alert variant="danger" title="Profil peminatan gagal dimuat">
                  <div className="space-y-3">
                    <p>{profileState.message}</p>
                    <Button variant="outline" size="sm" onClick={handleRetry}>
                      Coba lagi
                    </Button>
                  </div>
                </Alert>
              )}

              {profileState.status === 'ready' &&
                (profileState.profile.options.length === 0 ? (
                  <EmptyState
                    title="Referensi peminatan kosong"
                    description="Server tidak mengirimkan label peminatan. Hubungi pengelola sistem sebelum melanjutkan."
                  />
                ) : (
                  <PeminatanForm
                    profile={profileState.profile}
                    selected={selectedPeminatan}
                    saving={saving}
                    fieldError={fieldError}
                    saveError={saveError}
                    saveSuccess={saveSuccess}
                    onSelect={handleSelect}
                    onSubmit={handleSubmit}
                  />
                ))}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppLayout>
  )
}

type PeminatanFormProps = {
  profile: StudentProfile
  selected: string[]
  saving: boolean
  fieldError: string | null
  saveError: string | null
  saveSuccess: string | null
  onSelect: (option: string, mode: PeminatanSelectionMode) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

function PeminatanForm({
  profile,
  selected,
  saving,
  fieldError,
  saveError,
  saveSuccess,
  onSelect,
  onSubmit,
}: PeminatanFormProps) {
  return (
    <>
      {profile.profileComplete ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">
              Peminatan tersimpan
            </p>
            <Badge variant="success" withDot>
              Tersimpan
            </Badge>
          </div>
          <ul className="flex flex-wrap gap-2" aria-label="Peminatan tersimpan">
            {profile.peminatan.map((option) => (
              <li key={option}>
                <Badge variant="info" className="font-mono text-sm">
                  {option}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <EmptyState
          title="Peminatan belum dipilih"
          description={
            profile.selectionAvailable
              ? 'Pilih peminatan pada formulir di bawah, lalu simpan untuk melengkapi profil.'
              : 'Belum ada peminatan yang tersimpan. Penyimpanan menunggu keputusan aturan pemilihan.'
          }
        />
      )}

      {!profile.selectionAvailable || profile.selectionMode === null ? (
        <Alert variant="warning" title="Pemilihan belum dapat disimpan">
          {profile.note}
        </Alert>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <fieldset className="space-y-2" disabled={saving}>
            <legend className="text-sm font-medium text-foreground">
              {profile.selectionMode === 'single'
                ? 'Pilih satu peminatan'
                : 'Pilih peminatan'}
            </legend>

            {profile.selectionMode === 'single' ? (
              <Field
                id="peminatan"
                label="Peminatan"
                hint="Satu peminatan dapat disimpan untuk akun ini."
                error={fieldError ?? undefined}
                required
              >
                <Select
                  id="peminatan"
                  value={selected[0] ?? ''}
                  onChange={(event) => {
                    if (profile.selectionMode === 'single') {
                      onSelect(event.target.value, profile.selectionMode)
                    }
                  }}
                >
                  <option value="" disabled>
                    Pilih peminatan
                  </option>
                  {profile.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <div className="space-y-2">
                {profile.options.map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border-subtle px-3 py-2 text-sm text-foreground"
                  >
                    <input
                      type="checkbox"
                      name="peminatan"
                      value={option}
                      checked={selected.includes(option)}
                      onChange={() => onSelect(option, 'multiple')}
                      className="size-4 accent-primary"
                    />
                    <span className="font-mono font-medium">{option}</span>
                  </label>
                ))}
                <p className="text-xs text-muted-foreground">
                  Pilih satu atau lebih peminatan sesuai keputusan yang berlaku.
                </p>
                {fieldError && (
                  <p role="alert" className="text-sm text-destructive">
                    {fieldError}
                  </p>
                )}
              </div>
            )}
          </fieldset>

          {saveError && (
            <Alert variant="danger" title="Peminatan gagal disimpan">
              {saveError}
            </Alert>
          )}

          {saveSuccess && (
            <Alert variant="success" title="Peminatan tersimpan">
              {saveSuccess}
            </Alert>
          )}

          <Button
            type="submit"
            isLoading={saving}
            loadingLabel="Menyimpan..."
            leftIcon={<Save className="size-4" aria-hidden="true" />}
          >
            Simpan peminatan
          </Button>
        </form>
      )}
    </>
  )
}
