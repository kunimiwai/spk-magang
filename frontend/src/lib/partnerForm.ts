import type { Partner, PartnerInput } from '../services/partners'

export type PartnerFormValues = {
  name: string
  address: string
  contact: string
  email: string
  description: string
}

export type PartnerFormErrors = Partial<
  Record<keyof PartnerFormValues, string>
>

export const emptyPartnerForm: PartnerFormValues = {
  name: '',
  address: '',
  contact: '',
  email: '',
  description: '',
}

export function partnerToFormValues(partner: Partner): PartnerFormValues {
  return {
    name: partner.name,
    address: partner.address ?? '',
    contact: partner.contact ?? '',
    email: partner.email ?? '',
    description: partner.description ?? '',
  }
}

export function validatePartnerForm(
  values: PartnerFormValues,
): PartnerFormErrors {
  const errors: PartnerFormErrors = {}
  const name = values.name.trim()
  const address = values.address.trim()
  const contact = values.contact.trim()
  const email = values.email.trim()
  const description = values.description.trim()

  if (!name) {
    errors.name = 'Nama instansi wajib diisi.'
  } else if (name.length > 255) {
    errors.name = 'Nama instansi maksimal 255 karakter.'
  }

  if (address.length > 2000) {
    errors.address = 'Alamat maksimal 2000 karakter.'
  }

  if (contact.length > 255) {
    errors.contact = 'Kontak maksimal 255 karakter.'
  }

  if (email.length > 255) {
    errors.email = 'Email maksimal 255 karakter.'
  } else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Format email tidak valid.'
  }

  if (description.length > 5000) {
    errors.description = 'Deskripsi maksimal 5000 karakter.'
  }

  return errors
}

function optionalValue(value: string): string | null {
  const trimmed = value.trim()

  return trimmed === '' ? null : trimmed
}

export function partnerFormToInput(
  values: PartnerFormValues,
): PartnerInput {
  return {
    name: values.name.trim(),
    address: optionalValue(values.address),
    contact: optionalValue(values.contact),
    email: optionalValue(values.email),
    description: optionalValue(values.description),
  }
}
