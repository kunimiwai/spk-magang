import {
  useCallback,
  useId,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import type { UserAccount, UserFormInput, UserRole } from '../../services/users'
import { createUser, updateUser } from '../../services/users'
import { getApiErrorMessage, getFieldErrors } from '../../lib/apiError'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'prodi', label: 'Prodi' },
  { value: 'dpm', label: 'DPM (Dosen Pembimbing Magang)' },
  { value: 'mahasiswa', label: 'Mahasiswa' },
]

type UserFormDialogProps = {
  mode: 'create' | 'edit'
  user?: UserAccount
  onClose: () => void
  onSaved: (message: string) => void
}

export function UserFormDialog({
  mode,
  user,
  onClose,
  onSaved,
}: UserFormDialogProps) {
  const formId = useId()
  const [values, setValues] = useState<UserFormInput>({
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    role: user?.role ?? 'mahasiswa',
    is_active: user?.is_active ?? true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const updateField = useCallback(
    (field: keyof UserFormInput, value: string | boolean) => {
      setValues((current) => ({ ...current, [field]: value }))
      setErrors((current) => {
        if (!current[field]) return current
        const next = { ...current }
        delete next[field]
        return next
      })
    },
    [],
  )

  function handleFormKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (
      event.key !== 'Enter' ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return
    }

    const target = event.target

    if (
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLButtonElement ||
      target instanceof HTMLSelectElement
    ) {
      return
    }

    event.preventDefault()
    event.currentTarget.requestSubmit()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (saving) return

    const nextErrors: Record<string, string> = {}

    if (!values.name.trim()) {
      nextErrors.name = 'Nama lengkap wajib diisi.'
    }

    if (!values.email.trim()) {
      nextErrors.email = 'Email wajib diisi.'
    }

    if (mode === 'create' && !values.password) {
      nextErrors.password = 'Password wajib diisi.'
    }

    if (!ROLE_OPTIONS.some((option) => option.value === values.role)) {
      nextErrors.role = 'Role tidak valid.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setFormError('Periksa kembali data yang dikirim.')
      return
    }

    setErrors({})
    setFormError('')
    setSaving(true)

    try {
      const input: UserFormInput = {
        name: values.name.trim(),
        email: values.email.trim(),
        role: values.role,
        is_active: values.is_active,
      }

      if (values.password && values.password.trim() !== '') {
        input.password = values.password
      }

      if (mode === 'create') {
        await createUser(input)
        onSaved('Akun pengguna berhasil ditambahkan.')
      } else if (user) {
        await updateUser(user.id, input)
        onSaved('Akun pengguna berhasil diperbarui.')
      }
    } catch (error: unknown) {
      setErrors(getFieldErrors(error))
      setFormError(
        getApiErrorMessage(error, 'Akun pengguna gagal disimpan. Coba lagi.'),
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      title={mode === 'create' ? 'Tambah Pengguna' : 'Ubah Pengguna'}
      description={
        mode === 'create'
          ? 'Buat akun pengguna baru. Password akan disimpan dengan aman dan tidak akan ditampilkan kembali.'
          : 'Perbarui data pengguna yang dipilih.'
      }
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
            form={formId}
            isLoading={saving}
            loadingLabel="Menyimpan…"
          >
            {mode === 'create' ? 'Buat akun' : 'Simpan perubahan'}
          </Button>
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={handleSubmit}
        onKeyDown={handleFormKeyDown}
        className="space-y-4"
        noValidate
      >
        <Field id="user-name" label="Nama lengkap" required error={errors.name}>
          <Input
            id="user-name"
            name="name"
            value={values.name}
            onChange={(event) => updateField('name', event.target.value)}
            maxLength={255}
            disabled={saving}
            data-autofocus
          />
        </Field>

        <Field id="user-email" label="Email" required error={errors.email}>
          <Input
            id="user-email"
            name="email"
            type="email"
            value={values.email}
            onChange={(event) => updateField('email', event.target.value)}
            maxLength={255}
            disabled={saving}
          />
        </Field>

        {(mode === 'create' || !!values.password) && (
          <Field
            id="user-password"
            label="Password"
            hint={
              mode === 'create'
                ? 'Minimal 8 karakter.'
                : 'Kosongkan untuk tidak mengubah password.'
            }
            required={mode === 'create'}
            error={errors.password}
          >
            <Input
              id="user-password"
              name="password"
              type="password"
              value={values.password}
              onChange={(event) => updateField('password', event.target.value)}
              minLength={8}
              maxLength={255}
              disabled={saving}
            />
          </Field>
        )}

        <Field id="user-role" label="Role" required error={errors.role}>
          <Select
            id="user-role"
            name="role"
            value={values.role}
            onChange={(event) =>
              updateField('role', event.target.value as UserRole)
            }
            disabled={saving}
          >
            <option value="">Pilih role</option>
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="user-active" label="Status akun">
          <select
            id="user-active"
            name="is_active"
            value={String(values.is_active)}
            onChange={(event) =>
              updateField('is_active', event.target.value === 'true')
            }
            disabled={saving}
            className="block min-h-11 w-full rounded-lg border border-border bg-card px-3 py-2 text-base text-foreground shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          >
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Akun nonaktif tidak dapat masuk ke sistem.
          </p>
        </Field>

        {formError && (
          <Alert variant="danger" title="Data belum dapat disimpan">
            {formError}
          </Alert>
        )}
      </form>
    </Dialog>
  )
}