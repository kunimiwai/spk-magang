import {
  useId,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import type { Partner } from '../../services/partners'
import { createPartner, updatePartner } from '../../services/partners'
import {
  emptyPartnerForm,
  partnerFormToInput,
  partnerToFormValues,
  validatePartnerForm,
  type PartnerFormErrors,
  type PartnerFormValues,
} from '../../lib/partnerForm'
import { getApiErrorMessage, getFieldErrors } from '../../lib/apiError'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'

type PartnerFormDialogProps = {
  mode: 'create' | 'edit'
  partner?: Partner
  onClose: () => void
  onSaved: (message: string) => void
}

export function PartnerFormDialog({
  mode,
  partner,
  onClose,
  onSaved,
}: PartnerFormDialogProps) {
  const formId = useId()
  const [values, setValues] = useState<PartnerFormValues>(() =>
    partner ? partnerToFormValues(partner) : emptyPartnerForm,
  )
  const [errors, setErrors] = useState<PartnerFormErrors>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  function updateField(field: keyof PartnerFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field]) return current

      const next = { ...current }
      delete next[field]

      return next
    })
  }

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
      target instanceof HTMLButtonElement
    ) {
      return
    }

    // The visible submit button lives in the dialog footer, outside this form.
    event.preventDefault()
    event.currentTarget.requestSubmit()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (saving) return

    setFormError('')

    const clientErrors = validatePartnerForm(values)

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      setFormError('Periksa kembali data yang dikirim.')
      return
    }

    setErrors({})
    setSaving(true)

    try {
      const input = partnerFormToInput(values)

      if (mode === 'create') {
        await createPartner(input)
        onSaved('Mitra magang berhasil ditambahkan.')
      } else if (partner) {
        await updatePartner(partner.id, input)
        onSaved('Mitra magang berhasil diperbarui.')
      }
    } catch (error: unknown) {
      setErrors(getFieldErrors(error))
      setFormError(
        getApiErrorMessage(error, 'Mitra magang gagal disimpan. Coba lagi.'),
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      title={mode === 'create' ? 'Tambah mitra magang' : 'Ubah mitra magang'}
      description={
        mode === 'create'
          ? 'Lengkapi data mitra. Hanya nama instansi yang wajib diisi.'
          : 'Perbarui data mitra yang dipilih.'
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
            {mode === 'create' ? 'Tambah mitra' : 'Simpan perubahan'}
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
        <Field id="partner-name" label="Nama instansi" required error={errors.name}>
          <Input
            id="partner-name"
            name="name"
            value={values.name}
            onChange={(event) => updateField('name', event.target.value)}
            maxLength={255}
            disabled={saving}
            data-autofocus
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="partner-email" label="Email" error={errors.email}>
            <Input
              id="partner-email"
              name="email"
              type="email"
              value={values.email}
              onChange={(event) => updateField('email', event.target.value)}
              maxLength={255}
              disabled={saving}
            />
          </Field>

          <Field id="partner-contact" label="Kontak" error={errors.contact}>
            <Input
              id="partner-contact"
              name="contact"
              value={values.contact}
              onChange={(event) => updateField('contact', event.target.value)}
              maxLength={255}
              disabled={saving}
            />
          </Field>
        </div>

        <Field id="partner-address" label="Alamat" error={errors.address}>
          <Textarea
            id="partner-address"
            name="address"
            value={values.address}
            onChange={(event) => updateField('address', event.target.value)}
            maxLength={2000}
            disabled={saving}
            rows={3}
          />
        </Field>

        <Field
          id="partner-description"
          label="Deskripsi"
          error={errors.description}
        >
          <Textarea
            id="partner-description"
            name="description"
            value={values.description}
            onChange={(event) =>
              updateField('description', event.target.value)
            }
            maxLength={5000}
            disabled={saving}
            rows={4}
          />
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
