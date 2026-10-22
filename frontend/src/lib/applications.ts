import type {
  AcceptanceLetter,
  ApplicationDecision,
  ApplicationPartner,
  ApplicationPerson,
  ApplicationStatus,
  DpmOption,
  DpmPlacement,
  InternshipApplication,
  PartnerOption,
} from '../services/applications'

export const applicationStatuses: ApplicationStatus[] = [
  'menunggu',
  'diterima',
  'ditolak',
]

export type ReviewFormValues = {
  status: string
  reviewNote: string
}

export type ReviewFormErrors = Partial<
  Record<keyof ReviewFormValues, string>
>

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : {}
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function nullableText(value: unknown): string | null {
  const valueText = text(value)

  return valueText === '' ? null : valueText
}

function positiveInteger(value: unknown): number | null {
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    value > 0
    ? value
    : null
}

function nonNegativeInteger(value: unknown): number | null {
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0
    ? value
    : null
}

export function isApplicationStatus(
  value: unknown,
): value is ApplicationStatus {
  return (
    typeof value === 'string' &&
    applicationStatuses.includes(value as ApplicationStatus)
  )
}

export function statusLabel(status: ApplicationStatus): string {
  switch (status) {
    case 'menunggu':
      return 'Menunggu hasil seleksi mitra'
    case 'diterima':
      return 'Diterima'
    case 'ditolak':
      return 'Ditolak'
  }
}

export function statusBadgeVariant(
  status: ApplicationStatus,
): 'warning' | 'success' | 'danger' {
  switch (status) {
    case 'menunggu':
      return 'warning'
    case 'diterima':
      return 'success'
    case 'ditolak':
      return 'danger'
  }
}

export function formatApplicationDate(value: string | null): string {
  if (!value) return '—'

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? '—'
    : dateTimeFormatter.format(date)
}

function normalizePartner(payload: unknown): ApplicationPartner | null {
  const data = asRecord(payload)
  const id = positiveInteger(data.id)
  const name = text(data.name)

  if (id === null || name === '') {
    return null
  }

  return {
    id,
    name,
    address: nullableText(data.address),
    contact: nullableText(data.contact),
    email: nullableText(data.email),
    description: nullableText(data.description),
  }
}

function normalizePerson(payload: unknown): ApplicationPerson | null {
  const data = asRecord(payload)
  const id = positiveInteger(data.id)
  const name = text(data.name)

  if (id === null || name === '') {
    return null
  }

  return {
    id,
    name,
    email: text(data.email),
    role: text(data.role),
  }
}

function normalizeAcceptanceLetter(
  payload: unknown,
): AcceptanceLetter | null {
  const data = asRecord(payload)
  const id = positiveInteger(data.id)
  const originalName = text(data.original_name)
  const mimeType = text(data.mime_type)
  const size = nonNegativeInteger(data.size)

  if (id === null || originalName === '' || mimeType === '' || size === null) {
    return null
  }

  return {
    id,
    originalName,
    mimeType,
    size,
    uploadedAt: nullableText(data.created_at),
  }
}

function normalizeDpmPlacement(payload: unknown): DpmPlacement | null {
  const data = asRecord(payload)
  const id = positiveInteger(data.id)
  const assignedAt = text(data.assigned_at)
  const dpm = normalizePerson(data.dpm)

  if (id === null || assignedAt === '' || dpm === null) {
    return null
  }

  return { id, assignedAt, dpm }
}

export function normalizeApplication(
  payload: unknown,
): InternshipApplication | null {
  const data = asRecord(payload)
  const id = positiveInteger(data.id)
  const status = data.status
  const partner = normalizePartner(data.partner)
  const submittedAt = text(data.submitted_at)

  if (
    id === null ||
    !isApplicationStatus(status) ||
    partner === null ||
    submittedAt === ''
  ) {
    return null
  }

  return {
    id,
    status,
    submittedAt,
    reviewNote: nullableText(data.review_note),
    reviewedAt: nullableText(data.reviewed_at),
    partner,
    student: normalizePerson(data.student),
    reviewer: normalizePerson(data.reviewer),
    acceptanceLetter: normalizeAcceptanceLetter(data.acceptance_letter),
    dpmPlacement: normalizeDpmPlacement(data.dpm_placement),
  }
}

export function normalizeApplicationList(
  payload: unknown,
): InternshipApplication[] {
  if (!Array.isArray(payload)) {
    return []
  }

  const applications: InternshipApplication[] = []
  const seen = new Set<number>()

  for (const entry of payload) {
    const application = normalizeApplication(entry)

    if (application === null || seen.has(application.id)) {
      continue
    }

    seen.add(application.id)
    applications.push(application)
  }

  return applications
}

export function normalizePartnerOptionList(
  payload: unknown,
): PartnerOption[] {
  if (!Array.isArray(payload)) {
    return []
  }

  const partners: PartnerOption[] = []
  const seen = new Set<number>()

  for (const entry of payload) {
    const data = asRecord(entry)
    const id = positiveInteger(data.id)
    const name = text(data.name)

    if (id === null || name === '' || seen.has(id)) {
      continue
    }

    seen.add(id)
    partners.push({ id, name })
  }

  return partners
}

export function normalizeDpmOptionList(payload: unknown): DpmOption[] {
  if (!Array.isArray(payload)) {
    return []
  }

  const options: DpmOption[] = []
  const seen = new Set<number>()

  for (const entry of payload) {
    const data = asRecord(entry)
    const id = positiveInteger(data.id)
    const name = text(data.name)
    const email = text(data.email)

    if (id === null || name === '' || seen.has(id)) {
      continue
    }

    seen.add(id)
    options.push({ id, name, email })
  }

  return options
}

export function validateReviewForm(
  values: ReviewFormValues,
): ReviewFormErrors {
  const errors: ReviewFormErrors = {}

  if (values.status !== 'diterima' && values.status !== 'ditolak') {
    errors.status = 'Pilih keputusan pengajuan.'
  }

  if (values.reviewNote.trim().length > 5000) {
    errors.reviewNote = 'Catatan review maksimal 5000 karakter.'
  }

  return errors
}

export function reviewInputFromForm(values: ReviewFormValues): {
  status: ApplicationDecision
  reviewNote: string | null
} {
  const reviewNote = values.reviewNote.trim()

  return {
    status: values.status as ApplicationDecision,
    reviewNote: reviewNote === '' ? null : reviewNote,
  }
}
