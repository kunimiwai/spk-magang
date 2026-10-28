import {
  useId,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import type { Criterion } from '../../services/criteria'
import { createCriterion, updateCriterion } from '../../services/criteria'
import {
  criterionFormToInput,
  criterionToFormValues,
  criterionTypeOptions,
  emptyCriterionForm,
  validateCriterionForm,
  type CriterionFormErrors,
  type CriterionFormValues,
} from '../../lib/criterionForm'
import { getApiErrorMessage, getFieldErrors } from '../../lib/apiError'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'

type CriterionFormDialogProps = {
  mode: 'create' | 'edit'
  criterion?: Criterion
  onClose: () => void
  onSaved: (message: string) => void
}

export function CriterionFormDialog({
  mode,
  criterion,
  onClose,
  onSaved,
}: CriterionFormDialogProps) {
  const formId = useId()
  const [values, setValues] = useState<CriterionFormValues>(() =>
    criterion ? criterionToFormValues(criterion) : emptyCriterionForm,
  )
  const [errors, setErrors] = useState<CriterionFormErrors>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  function updateField<K extends keyof CriterionFormValues>(
    field: K,
    value: CriterionFormValues[K],
  ) {
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
      target instanceof HTMLButtonElement ||
      target instanceof HTMLSelectElement
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

    const clientErrors = validateCriterionForm(values)

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      setFormError('Periksa kembali data yang dikirim.')
      return
    }

    setErrors({})
    setFormError('')
    setSaving(true)

    try {
      const input = criterionFormToInput(values)

      if (mode === 'create') {
        await createCriterion(input)
        onSaved('Kriteria berhasil ditambahkan.')
      } else if (criterion) {
        await updateCriterion(criterion.id, input)
        onSaved('Kriteria berhasil diperbarui.')
      }
    } catch (error: unknown) {
      setErrors(getFieldErrors(error))
      setFormError(
        getApiErrorMessage(error, 'Kriteria gagal disimpan. Coba lagi.'),
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      title={mode === 'create' ? 'Tambah kriteria' : 'Ubah kriteria'}
      description={
        mode === 'create'
          ? 'Tentukan nama, tipe, dan bobot kriteria. Daftar kriteria resmi belum ditetapkan.'
          : 'Perbarui data kriteria yang dipilih.'
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
            {mode === 'create' ? 'Tambah kriteria' : 'Simpan perubahan'}
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
        <Field id="criterion-name" label="Nama kriteria" required error={errors.name}>
          <Input
            id="criterion-name"
            name="name"
            value={values.name}
            onChange={(event) => updateField('name', event.target.value)}
            maxLength={255}
            disabled={saving}
            data-autofocus
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="criterion-type"
            label="Tipe"
            hint="Benefit: makin besar makin baik. Cost: makin kecil makin baik."
            required
            error={errors.type}
          >
            <Select
              id="criterion-type"
              name="type"
              value={values.type}
              onChange={(event) =>
                updateField(
                  'type',
                  event.target.value as CriterionFormValues['type'],
                )
              }
              disabled={saving}
            >
              {criterionTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            id="criterion-weight"
            label="Bobot"
            hint="Skala bobot belum ditetapkan; masukkan angka sesuai kebijakan yang berlaku."
            required
            error={errors.weight}
          >
            <Input
              id="criterion-weight"
              name="weight"
              type="number"
              min="0"
              max="999999.999999"
              step="any"
              value={values.weight}
              onChange={(event) => updateField('weight', event.target.value)}
              disabled={saving}
            />
          </Field>
        </div>

        <Field
          id="criterion-description"
          label="Deskripsi"
          hint="Opsional. Jelaskan maksud kriteria tanpa mengisi nilai asumsi."
          error={errors.description}
        >
          <Textarea
            id="criterion-description"
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
