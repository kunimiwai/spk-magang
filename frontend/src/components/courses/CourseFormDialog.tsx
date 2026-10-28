import {
  useId,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import type { Course } from '../../services/academic'
import { createCourse, updateCourse } from '../../services/academic'
import {
  courseFormToInput,
  courseToFormValues,
  emptyCourseForm,
  validateCourseForm,
  type CourseFormErrors,
  type CourseFormValues,
} from '../../lib/academic'
import { getApiErrorMessage, getFieldErrors } from '../../lib/apiError'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Field } from '../ui/Field'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'

type CourseFormDialogProps = {
  mode: 'create' | 'edit'
  course?: Course
  onClose: () => void
  onSaved: (message: string) => void
}

export function CourseFormDialog({
  mode,
  course,
  onClose,
  onSaved,
}: CourseFormDialogProps) {
  const formId = useId()
  const [values, setValues] = useState<CourseFormValues>(() =>
    course ? courseToFormValues(course) : emptyCourseForm,
  )
  const [errors, setErrors] = useState<CourseFormErrors>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  function updateField<K extends keyof CourseFormValues>(
    field: K,
    value: CourseFormValues[K],
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
      target instanceof HTMLButtonElement
    ) {
      return
    }

    event.preventDefault()
    event.currentTarget.requestSubmit()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (saving) return

    const clientErrors = validateCourseForm(values)

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      setFormError('Periksa kembali data yang dikirim.')
      return
    }

    setErrors({})
    setFormError('')
    setSaving(true)

    try {
      const input = courseFormToInput(values)

      if (mode === 'create') {
        await createCourse(input)
        onSaved('Mata kuliah berhasil ditambahkan.')
      } else if (course) {
        await updateCourse(course.id, input)
        onSaved('Mata kuliah berhasil diperbarui.')
      }
    } catch (error: unknown) {
      setErrors(getFieldErrors(error))
      setFormError(
        getApiErrorMessage(error, 'Mata kuliah gagal disimpan. Coba lagi.'),
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      title={mode === 'create' ? 'Tambah mata kuliah' : 'Ubah mata kuliah'}
      description="Nama dan deskripsi mata kuliah. Daftar mata kuliah prasyarat dan ambang nilai tidak ditentukan di sini."
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
            {mode === 'create' ? 'Tambah mata kuliah' : 'Simpan perubahan'}
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
        <Field
          id="course-name"
          label="Nama mata kuliah"
          required
          error={errors.name}
        >
          <Input
            id="course-name"
            name="name"
            value={values.name}
            onChange={(event) => updateField('name', event.target.value)}
            maxLength={255}
            disabled={saving}
            data-autofocus
          />
        </Field>

        <Field
          id="course-description"
          label="Deskripsi"
          hint="Opsional. Jangan menuliskan ambang kelulusan yang belum ditetapkan."
          error={errors.description}
        >
          <Textarea
            id="course-description"
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
