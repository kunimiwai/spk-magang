import type {
  Course,
  CourseInput,
  GradeBounds,
  GradeCourse,
  PrerequisiteEvaluation,
  StudentGradeInput,
  StudentGradeSheet,
} from '../services/academic'

export type CourseFormValues = {
  name: string
  description: string
}

export type CourseFormErrors = Partial<Record<keyof CourseFormValues, string>>

export const emptyCourseForm: CourseFormValues = {
  name: '',
  description: '',
}

export function courseToFormValues(course: Course): CourseFormValues {
  return {
    name: course.name,
    description: course.description ?? '',
  }
}

export function validateCourseForm(
  values: CourseFormValues,
): CourseFormErrors {
  const errors: CourseFormErrors = {}
  const name = values.name.trim()
  const description = values.description.trim()

  if (!name) {
    errors.name = 'Nama mata kuliah wajib diisi.'
  } else if (name.length > 255) {
    errors.name = 'Nama mata kuliah maksimal 255 karakter.'
  }

  if (description.length > 5000) {
    errors.description = 'Deskripsi maksimal 5000 karakter.'
  }

  return errors
}

export function courseFormToInput(
  values: CourseFormValues,
): CourseInput {
  const description = values.description.trim()

  return {
    name: values.name.trim(),
    description: description === '' ? null : description,
  }
}

export function gradeValuesFromSheet(
  courses: GradeCourse[],
): Record<number, string> {
  const values: Record<number, string> = {}

  for (const course of courses) {
    values[course.id] = course.score === null ? '' : String(course.score)
  }

  return values
}

export function validateGradeValues(
  values: Record<number, string>,
  bounds: GradeBounds,
): Record<number, string> {
  const errors: Record<number, string> = {}

  for (const [rawCourseId, value] of Object.entries(values)) {
    const courseId = Number(rawCourseId)
    const rawValue = value.trim()

    if (rawValue === '') {
      continue
    }

    const score = Number(rawValue)

    if (!Number.isFinite(score)) {
      errors[courseId] = 'Nilai harus berupa angka.'
    } else if (score < bounds.min || score > bounds.max) {
      errors[courseId] = 'Nilai melebihi batas penyimpanan.'
    }
  }

  return errors
}

/**
 * Empty inputs are submitted as null, which removes the stored grade.
 * They are never converted to zero.
 */
export function gradeInputFromValues(
  courses: GradeCourse[],
  values: Record<number, string>,
): StudentGradeInput[] {
  return courses.map((course) => {
    const rawValue = (values[course.id] ?? '').trim()

    return {
      course_id: course.id,
      score: rawValue === '' ? null : Number(rawValue),
    }
  })
}

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

function finiteNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  return value
}

function positiveInteger(value: unknown): number | null {
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    value > 0
    ? value
    : null
}

export function normalizeCourseList(payload: unknown): Course[] {
  if (!Array.isArray(payload)) {
    return []
  }

  const courses: Course[] = []
  const seen = new Set<number>()

  for (const entry of payload) {
    const course = normalizeCourse(entry)

    if (course === null || seen.has(course.id)) {
      continue
    }

    seen.add(course.id)
    courses.push(course)
  }

  return courses
}

export function normalizeCourse(payload: unknown): Course | null {
  const data = asRecord(payload)
  const id = positiveInteger(data.id)
  const name = text(data.name)

  if (id === null || name === '') {
    return null
  }

  const gradesCount = finiteNumber(data.grades_count)

  return {
    id,
    name,
    description: nullableText(data.description),
    grades_count:
      gradesCount !== null && gradesCount >= 0 ? gradesCount : 0,
    created_at: text(data.created_at),
    updated_at: text(data.updated_at),
  }
}

export function normalizeStudentGradeSheet(
  payload: unknown,
): StudentGradeSheet {
  const data = asRecord(payload)
  const courses: GradeCourse[] = []
  const seen = new Set<number>()

  if (Array.isArray(data.courses)) {
    for (const entry of data.courses) {
      const course = normalizeGradeCourse(entry)

      if (course === null || seen.has(course.id)) {
        continue
      }

      seen.add(course.id)
      courses.push(course)
    }
  }

  return {
    courses,
    prerequisiteEvaluation: normalizePrerequisiteEvaluation(
      data.prerequisite_evaluation,
    ),
    scoreBounds: normalizeGradeBounds(data.score_bounds),
  }
}

function normalizeGradeCourse(entry: unknown): GradeCourse | null {
  const data = asRecord(entry)
  const id = positiveInteger(data.id)
  const name = text(data.name)

  if (id === null || name === '') {
    return null
  }

  return {
    id,
    name,
    description: nullableText(data.description),
    score: finiteNumber(data.score),
    gradeUpdatedAt: nullableText(data.grade_updated_at),
  }
}

function normalizePrerequisiteEvaluation(
  payload: unknown,
): PrerequisiteEvaluation {
  const data = asRecord(payload)
  const status = data.status

  return {
    status:
      status === 'configured' || status === 'invalid'
        ? status
        : 'not_configured',
    message:
      nullableText(data.message) ??
      'Status aturan prasyarat tidak tersedia dari server.',
  }
}

function normalizeGradeBounds(payload: unknown): GradeBounds {
  const data = asRecord(payload)
  const min = finiteNumber(data.min)
  const max = finiteNumber(data.max)

  if (min !== null && max !== null && min <= max) {
    return { min, max }
  }

  return { min: -999999.999999, max: 999999.999999 }
}
