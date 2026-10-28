export type PeminatanReference = {
  options: string[]
  selectionAvailable: boolean
  note: string
}

/**
 * The peminatan labels are confirmed by the BPMN. Reference metadata tells the
 * UI whether persistence is enabled; it never supplies a saved selection.
 * This normalizer keeps the page safe if that response is malformed.
 */
export function normalizePeminatanReference(
  payload: unknown,
): PeminatanReference {
  const data =
    typeof payload === 'object' && payload !== null
      ? (payload as Record<string, unknown>)
      : {}

  return {
    options: normalizeOptions(data.options),
    selectionAvailable: data.selection_available === true,
    note: normalizeNote(data.note),
  }
}

function normalizeOptions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  const options: string[] = []
  const seen = new Set<string>()

  for (const entry of value) {
    if (typeof entry !== 'string') continue

    const code = entry.trim()

    if (code === '' || seen.has(code)) continue

    seen.add(code)
    options.push(code)
  }

  return options
}

function normalizeNote(value: unknown): string {
  if (typeof value === 'string' && value.trim() !== '') {
    return value.trim()
  }

  return 'Keterangan pemilihan peminatan tidak tersedia dari server.'
}

export type PeminatanSelectionMode = 'single' | 'multiple'

export type StudentProfile = {
  peminatan: string[]
  options: string[]
  selectionMode: PeminatanSelectionMode | null
  selectionAvailable: boolean
  profileComplete: boolean
  note: string
}

/**
 * Normalize the profile response defensively. Saved peminatan is only shown
 * when the API returns it; the UI never substitutes a default selection.
 */
export function normalizeStudentProfile(payload: unknown): StudentProfile {
  const data =
    typeof payload === 'object' && payload !== null
      ? (payload as Record<string, unknown>)
      : {}

  const peminatan = normalizeOptions(data.peminatan)
  const selectionMode = normalizeSelectionMode(data.selection_mode)

  return {
    peminatan,
    options: normalizeOptions(data.peminatan_options),
    selectionMode,
    selectionAvailable:
      data.selection_available === true && selectionMode !== null,
    profileComplete: data.profile_complete === true || peminatan.length > 0,
    note: normalizeNote(data.selection_note),
  }
}

function normalizeSelectionMode(
  value: unknown,
): PeminatanSelectionMode | null {
  if (value === 'single' || value === 'multiple') {
    return value
  }

  return null
}
