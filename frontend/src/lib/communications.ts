export type CommunicationDirection = 'outbound' | 'inbound'
export type CommunicationChannel = 'email' | 'surat'

export type CommunicationRecorder = {
  id: number
  name: string
  email: string
  role: string
}

export type ApplicationCommunication = {
  id: number
  direction: CommunicationDirection
  channel: CommunicationChannel
  occurredAt: string
  summary: string
  recorder: CommunicationRecorder | null
}

export type CommunicationFormValues = {
  direction: string
  channel: string
  occurredAt: string
  summary: string
}

export type CommunicationFormErrors = Partial<
  Record<keyof CommunicationFormValues, string>
>

export const communicationDirections: CommunicationDirection[] = [
  'outbound',
  'inbound',
]

export const communicationChannels: CommunicationChannel[] = [
  'email',
  'surat',
]

export function isCommunicationDirection(
  value: unknown,
): value is CommunicationDirection {
  return (
    typeof value === 'string' &&
    communicationDirections.includes(value as CommunicationDirection)
  )
}

export function isCommunicationChannel(
  value: unknown,
): value is CommunicationChannel {
  return (
    typeof value === 'string' &&
    communicationChannels.includes(value as CommunicationChannel)
  )
}

export function communicationDirectionLabel(
  direction: CommunicationDirection,
): string {
  return direction === 'outbound' ? 'Dikirim ke mitra' : 'Balasan mitra'
}

export function communicationChannelLabel(
  channel: CommunicationChannel,
): string {
  return channel === 'email' ? 'Email' : 'Surat'
}

export function nowForDateTimeLocal(date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60_000

  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function dateTimeLocalToIso(value: string): string | null {
  if (value.trim() === '') {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function validateCommunicationForm(
  values: CommunicationFormValues,
): CommunicationFormErrors {
  const errors: CommunicationFormErrors = {}

  if (!isCommunicationDirection(values.direction)) {
    errors.direction = 'Pilih arah komunikasi.'
  }

  if (!isCommunicationChannel(values.channel)) {
    errors.channel = 'Pilih kanal komunikasi.'
  }

  if (dateTimeLocalToIso(values.occurredAt) === null) {
    errors.occurredAt = 'Waktu komunikasi wajib diisi dengan format yang valid.'
  }

  const summary = values.summary.trim()

  if (summary === '') {
    errors.summary = 'Ringkasan komunikasi wajib diisi.'
  } else if (summary.length > 2000) {
    errors.summary = 'Ringkasan komunikasi maksimal 2000 karakter.'
  }

  return errors
}

export function communicationInputFromForm(
  values: CommunicationFormValues,
): {
  direction: CommunicationDirection
  channel: CommunicationChannel
  occurredAt: string
  summary: string
} {
  const occurredAt = dateTimeLocalToIso(values.occurredAt)

  if (
    occurredAt === null ||
    !isCommunicationDirection(values.direction) ||
    !isCommunicationChannel(values.channel)
  ) {
    throw new Error('Form komunikasi belum valid.')
  }

  return {
    direction: values.direction,
    channel: values.channel,
    occurredAt,
    summary: values.summary.trim(),
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : {}
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function positiveInteger(value: unknown): number | null {
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    value > 0
    ? value
    : null
}

function normalizeRecorder(payload: unknown): CommunicationRecorder | null {
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

export function normalizeCommunication(
  payload: unknown,
): ApplicationCommunication | null {
  const data = asRecord(payload)
  const id = positiveInteger(data.id)
  const occurredAt = text(data.occurred_at)
  const summary = text(data.summary)

  if (
    id === null ||
    !isCommunicationDirection(data.direction) ||
    !isCommunicationChannel(data.channel) ||
    occurredAt === '' ||
    summary === ''
  ) {
    return null
  }

  return {
    id,
    direction: data.direction,
    channel: data.channel,
    occurredAt,
    summary,
    recorder: normalizeRecorder(data.recorder),
  }
}

export function sortCommunicationsNewestFirst(
  communications: ApplicationCommunication[],
): ApplicationCommunication[] {
  return [...communications].sort((left, right) => {
    const leftTime = Date.parse(left.occurredAt)
    const rightTime = Date.parse(right.occurredAt)
    const timeDelta = rightTime - leftTime

    if (Number.isFinite(timeDelta) && timeDelta !== 0) {
      return timeDelta
    }

    return right.id - left.id
  })
}

export function normalizeCommunicationList(
  payload: unknown,
): ApplicationCommunication[] {
  if (!Array.isArray(payload)) {
    return []
  }

  const communications: ApplicationCommunication[] = []
  const seen = new Set<number>()

  for (const entry of payload) {
    const communication = normalizeCommunication(entry)

    if (communication === null || seen.has(communication.id)) {
      continue
    }

    seen.add(communication.id)
    communications.push(communication)
  }

  return sortCommunicationsNewestFirst(communications)
}
