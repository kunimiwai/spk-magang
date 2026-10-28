import {
  useEffect,
  useState,
  type FormEvent,
  type SVGProps,
} from 'react'
import {
  BarChart3,
  Cpu,
  GraduationCap,
  LayoutList,
  Plus,
  Settings,
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
import { Input } from '../components/ui/Input'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { Textarea } from '../components/ui/Textarea'
import { getApiErrorMessage, getFieldErrors } from '../lib/apiError'
import { buttonClasses } from '../lib/buttonStyles'
import {
  createSystemSetting,
  deleteSystemSetting,
  listSystemSettings,
  type SystemSetting,
  updateSystemSetting,
} from '../services/systemSettings'

type SectionKey =
  | 'peminatan'
  | 'kmeans'
  | 'ranking'
  | 'academic'
  | 'general'

const SECTIONS: Record<
  SectionKey,
  { label: string; icon: React.ComponentType<SVGProps<SVGSVGElement>> }
> = {
  peminatan: {
    label: 'Peminatan Mahasiswa',
    icon: GraduationCap,
  },
  kmeans: {
    label: 'Konfigurasi K-Means',
    icon: Cpu,
  },
  ranking: {
    label: 'Perankingan & Rekomendasi',
    icon: BarChart3,
  },
  academic: {
    label: 'Aturan Nilai Prasyarat',
    icon: LayoutList,
  },
  general: {
    label: 'Umum',
    icon: Settings,
  },
}

type FormState = null | {
  mode: 'create'
  section: SectionKey
} | {
  mode: 'edit'
  setting: SystemSetting
  section: SectionKey
}

export default function SystemSettingsPage() {
  const { user, isLoading: authLoading, logout } = useAuth()

  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [activeSection, setActiveSection] = useState<SectionKey>('general')
  const [formState, setFormState] = useState<FormState>(null)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<SystemSetting | null>(null)
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadSettings() {
      try {
        const data = await listSystemSettings()

        if (active) {
          setSettings(data)
          setError('')
        }
      } catch (err: unknown) {
        if (active) {
          setError(
            getApiErrorMessage(
              err,
              'Pengaturan sistem gagal dimuat. Coba lagi.',
            ),
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadSettings()

    return () => {
      active = false
    }
  }, [reloadKey])

  function retry() {
    setLoading(true)
    setError('')
    setReloadKey((key) => key + 1)
  }

  function openCreate(section: SectionKey) {
    setSuccessMessage('')
    setFormState({ mode: 'create', section })
  }

  function openEdit(setting: SystemSetting, section: SectionKey) {
    setSuccessMessage('')
    setFormState({ mode: 'edit', setting, section })
  }

  function closeForm() {
    setFormState(null)
  }

  async function handleSave(values: {
    key: string
    value: string
    group: string | null
    description: string | null
  }) {
    setSuccessMessage('')
    setSaving(true)

    try {
      if (formState?.mode === 'create') {
        await createSystemSetting(values)
        setSuccessMessage('Pengaturan sistem berhasil ditambahkan.')
      } else if (formState?.mode === 'edit' && formState.setting) {
        await updateSystemSetting(formState.setting.id, values)
        setSuccessMessage('Pengaturan sistem berhasil diperbarui.')
      }

      setFormState(null)
      setReloadKey((key) => key + 1)
    } catch (err: unknown) {
      const fieldErrors = getFieldErrors(err)

      if (Object.keys(fieldErrors).length === 0) {
        setError(
          getApiErrorMessage(
            err,
            'Pengaturan sistem gagal disimpan. Coba lagi.',
          ),
        )
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return

    setSaving(true)

    try {
      await deleteSystemSetting(deleteTarget.id)
      setSuccessMessage('Pengaturan sistem berhasil dihapus.')
      setDeleteTarget(null)
      setReloadKey((key) => key + 1)
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          'Pengaturan sistem gagal dihapus. Coba lagi.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  function getSectionSettings(section: SectionKey): SystemSetting[] {
    const group = sectionToGroup(section)
    if (group === null) return []

    return settings.filter((s) => s.group === group)
  }

  function sectionToGroup(section: SectionKey): string | null {
    switch (section) {
      case 'peminatan':
        return 'student.peminatan'
      case 'kmeans':
        return 'recommendation.kmeans'
      case 'ranking':
        return 'recommendation.ranking'
      case 'academic':
        return 'academic.prerequisites'
      case 'general':
        return 'general'
      default:
        return null
    }
  }

  function formatValue(value: string | null): string {
    if (value === null || value === '') return '(kosong)'
    return value
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
          eyebrow="Administrasi Sistem"
          title="Pengaturan Sistem"
          description="Kelola konfigurasi aplikasi SPK Magang melalui antarmuka. Perubahan akan berlaku segera untuk semua pengguna."
          actions={
            <Button
              onClick={() => openCreate('general')}
              leftIcon={<Plus className="size-4" aria-hidden="true" />}
            >
              Tambah pengaturan
            </Button>
          }
        />

        {successMessage && (
          <Alert variant="success" title="Berhasil" className="mb-4">
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" title="Kesalahan" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="grid gap-4 lg:grid-cols-12">
          {/* Navigation sidebar */}
          <div className="lg:col-span-3 space-y-2">
            <div className="rounded-lg border border-border-subtle bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Kategori konfigurasi
              </h3>
              <div className="space-y-1">
                {Object.entries(SECTIONS).map(([key, section]) => {
                  const group = sectionToGroup(key as SectionKey)
                  const count = group
                    ? settings.filter((s) => s.group === group).length
                    : 0

                  return (
                    <Button
                      key={key}
                      onClick={() => setActiveSection(key as SectionKey)}
                      variant="ghost"
                      className={buttonClasses({
                        variant: 'ghost',
                        size: 'sm',
                      }) + ' w-full justify-between text-left'}
                    >
                      <section.icon
                        className="size-4 shrink-0"
                        aria-hidden="true"
                      />
                      {section.label}
                      <Badge variant="neutral">{count}</Badge>
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-9">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle>
                      {SECTIONS[activeSection].label}
                    </CardTitle>
                    <CardDescription>
                      Kelola pengaturan sistem untuk kategori ini.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => openCreate(activeSection)}
                    disabled={loading || saving}
                    leftIcon={<Plus className="size-4" aria-hidden="true" />}
                  >
                    Tambah
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {loading ? (
                  <LoadingState message="Memuat pengaturan sistem..." />
                ) : error ? (
                  <ErrorState
                    title="Pengaturan gagal dimuat"
                    message={error}
                    action={
                      <Button variant="outline" size="sm" onClick={retry}>
                        Coba lagi
                      </Button>
                    }
                  />
                ) : (
                  <div>
                    {getSectionSettings(activeSection).length === 0 ? (
                      <EmptyState
                        title="Belum ada pengaturan"
                        description={
                          'Tambahkan pengaturan sistem baru untuk kategori ini melalui tombol di atas.'
                        }
                        action={
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCreate(activeSection)}
                          >
                            Tambah pengaturan
                          </Button>
                        }
                      />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-border-subtle bg-muted">
                              <th className="px-4 py-3 font-semibold text-foreground">
                                Kunci
                              </th>
                              <th className="px-4 py-3 font-semibold text-foreground">
                                Nilai
                              </th>
                              <th className="px-4 py-3 font-semibold text-foreground">
                                Deskripsi
                              </th>
                              <th className="px-4 py-3 font-semibold text-foreground text-right">
                                Aksi
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {getSectionSettings(activeSection).map(
                              (setting) => (
                                <tr
                                  key={setting.id}
                                  className="border-b border-border-subtle last:border-b-0"
                                >
                                  <td className="px-4 py-3 font-mono text-sm text-foreground">
                                    {setting.key}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-foreground">
                                    {formatValue(setting.value)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-muted-foreground">
                                    {setting.description ?? '—'}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center gap-2 justify-end">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openEdit(setting, activeSection)}
                                        disabled={saving}
                                      >
                                        Ubah
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDeleteTarget(setting)}
                                        disabled={saving}
                                        className="text-destructive hover:bg-danger-surface"
                                      >
                                        Hapus
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {formState && (
          <SystemSettingForm
            key={
              formState.mode === 'edit'
                ? `edit-${formState.setting.id}`
                : 'create'
            }
            mode={formState.mode}
            section={formState.section}
            setting={
              formState.mode === 'edit' ? formState.setting : undefined
            }
            onClose={closeForm}
            onSaved={handleSave}
            saving={saving}
          />
        )}

        {deleteTarget && (
          <DeleteSystemSettingDialog
            setting={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onDelete={handleDelete}
            deleting={saving}
          />
        )}
      </PageContainer>
    </AppLayout>
  )
}

type SystemSettingFormProps = {
  mode: 'create' | 'edit'
  section: SectionKey
  setting?: SystemSetting
  onClose: () => void
  onSaved: (values: {
    key: string
    value: string
    group: string | null
    description: string | null
  }) => void
  saving: boolean
}

function SystemSettingForm({
  mode,
  setting,
  onClose,
  onSaved,
  saving,
}: SystemSettingFormProps) {
  const [values, setValues] = useState({
    key: setting?.key ?? '',
    value: setting?.value ?? '',
    group: setting?.group ?? '',
    description: setting?.description ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')

  function validate() {
    const next: Record<string, string> = {}

    if (!values.key.trim()) {
      next.key = 'Kunci pengaturan wajib diisi.'
    }

    if (!values.value.trim()) {
      next.value = 'Nilai pengaturan wajib diisi.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!validate()) return

    setFormError('')
    await onSaved({
      key: values.key.trim(),
      value: values.value.trim(),
      group: values.group ?? null,
      description: values.description.trim() ?? null,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      />
      <div className="relative w-full max-w-lg m-4 rounded-lg border border-border-subtle bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            {mode === 'create' ? 'Tambah Pengaturan' : 'Ubah Pengaturan'}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Tutup"
          >
            ×
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field
            id="setting-key"
            label="Kunci pengaturan"
            hint="Contoh: recommendation.kmeans.cluster_count"
            required
            error={errors.key}
          >
            <Input
              id="setting-key"
              name="key"
              value={values.key}
              onChange={(e) => {
                setValues({ ...values, key: e.target.value })
                setErrors((prev) => {
                  const next = { ...prev }
                  delete next.key
                  return next
                })
              }}
              disabled={saving || mode === 'edit'}
            />
          </Field>

          <Field
            id="setting-value"
            label="Nilai"
            hint="Masukkan nilai untuk pengaturan ini."
            required
            error={errors.value}
          >
            <Input
              id="setting-value"
              name="value"
              value={values.value}
              onChange={(e) => {
                setValues({ ...values, value: e.target.value })
                setErrors((prev) => {
                  const next = { ...prev }
                  delete next.value
                  return next
                })
              }}
              disabled={saving}
            />
          </Field>

          <Field
            id="setting-group"
            label="Grup"
            hint="Grup untuk mengelompokkan pengaturan terkait."
          >
            <Input
              id="setting-group"
              name="group"
              value={values.group ?? ''}
              onChange={(e) => {
                setValues({ ...values, group: e.target.value })
                setErrors((prev) => {
                  const next = { ...prev }
                  delete next.group
                  return next
                })
              }}
              disabled={saving}
            />
          </Field>

          <Field
            id="setting-description"
            label="Deskripsi"
            hint="Opsional. Jelaskan maksud pengaturan ini."
          >
            <Textarea
              id="setting-description"
              name="description"
              value={values.description}
              onChange={(e) => {
                setValues({ ...values, description: e.target.value })
                setErrors((prev) => {
                  const next = { ...prev }
                  delete next.description
                  return next
                })
              }}
              rows={3}
              disabled={saving}
            />
          </Field>

          {formError && (
            <Alert variant="danger" title="Pengaturan gagal disimpan">
              {formError}
            </Alert>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={saving}
              isLoading={saving}
              loadingLabel="Menyimpan…"
            >
              {mode === 'create' ? 'Tambah' : 'Simpan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

type DeleteSystemSettingDialogProps = {
  setting: SystemSetting
  onClose: () => void
  onDelete: () => void
  deleting: boolean
}

function DeleteSystemSettingDialog({
  setting,
  onClose,
  onDelete,
  deleting,
}: DeleteSystemSettingDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      />
      <div className="relative w-full max-w-md m-4 rounded-lg border border-border-subtle bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Hapus Pengaturan
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Tutup"
          >
            ×
          </Button>
        </div>

        <p className="mb-4">
          Yakin ingin menghapus pengaturan{' '}
          <span className="font-mono">{setting.key}</span>?
        </p>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleting}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
            disabled={deleting}
            isLoading={deleting}
            loadingLabel="Menghapus…"
          >
            Hapus
          </Button>
        </div>
      </div>
    </div>
  )
}
