import type {
  Criterion,
  CriterionInput,
  CriterionType,
} from '../services/criteria'

export const criterionTypeOptions: Array<{
  value: CriterionType
  label: string
}> = [
  { value: 'benefit', label: 'Benefit' },
  { value: 'cost', label: 'Cost' },
]

export type CriterionFormValues = {
  name: string
  description: string
  type: CriterionType
  weight: string
}

export type CriterionFormErrors = Partial<
  Record<keyof CriterionFormValues, string>
>

export const emptyCriterionForm: CriterionFormValues = {
  name: '',
  description: '',
  type: 'benefit',
  weight: '',
}

export function criterionToFormValues(
  criterion: Criterion,
): CriterionFormValues {
  return {
    name: criterion.name,
    description: criterion.description ?? '',
    type: criterion.type,
    weight: String(criterion.weight),
  }
}

export function validateCriterionForm(
  values: CriterionFormValues,
): CriterionFormErrors {
  const errors: CriterionFormErrors = {}
  const name = values.name.trim()
  const description = values.description.trim()
  const weightText = values.weight.trim()

  if (!name) {
    errors.name = 'Nama kriteria wajib diisi.'
  } else if (name.length > 255) {
    errors.name = 'Nama kriteria maksimal 255 karakter.'
  }

  if (description.length > 5000) {
    errors.description = 'Deskripsi maksimal 5000 karakter.'
  }

  if (!criterionTypeOptions.some((option) => option.value === values.type)) {
    errors.type = 'Tipe kriteria harus benefit atau cost.'
  }

  if (!weightText) {
    errors.weight = 'Bobot kriteria wajib diisi.'
  } else {
    const weight = Number(weightText)

    if (!Number.isFinite(weight)) {
      errors.weight = 'Bobot kriteria harus berupa angka.'
    } else if (weight < 0) {
      errors.weight = 'Bobot kriteria tidak boleh negatif.'
    } else if (weight > 999999.999999) {
      errors.weight = 'Bobot kriteria melebihi batas penyimpanan.'
    }
  }

  return errors
}

export function criterionFormToInput(
  values: CriterionFormValues,
): CriterionInput {
  const description = values.description.trim()

  return {
    name: values.name.trim(),
    description: description === '' ? null : description,
    type: values.type,
    weight: Number(values.weight.trim()),
  }
}
