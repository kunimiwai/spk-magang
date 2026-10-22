import api from './api'
import {
  normalizeCourse,
  normalizeCourseList,
  normalizeStudentGradeSheet,
} from '../lib/academic'

export type Course = {
  id: number
  name: string
  description: string | null
  grades_count: number
  created_at: string
  updated_at: string
}

export type CourseInput = {
  name: string
  description: string | null
}

export type GradeCourse = {
  id: number
  name: string
  description: string | null
  score: number | null
  gradeUpdatedAt: string | null
}

export type PrerequisiteEvaluationStatus =
  | 'not_configured'
  | 'configured'
  | 'invalid'

export type PrerequisiteEvaluation = {
  status: PrerequisiteEvaluationStatus
  message: string
}

export type GradeBounds = {
  min: number
  max: number
}

export type StudentGradeSheet = {
  courses: GradeCourse[]
  prerequisiteEvaluation: PrerequisiteEvaluation
  scoreBounds: GradeBounds
}

export type StudentGradeInput = {
  course_id: number
  score: number | null
}

type CourseListResponse = {
  success: boolean
  message: string
  data: unknown
}

type CourseResponse = {
  success: boolean
  message: string
  data: unknown
}

type GradeSheetResponse = {
  success: boolean
  message: string
  data: unknown
}

export async function listCourses(): Promise<Course[]> {
  const response = await api.get<CourseListResponse>('/admin/courses')

  return normalizeCourseList(response.data.data)
}

export async function createCourse(input: CourseInput): Promise<Course> {
  const response = await api.post<CourseResponse>('/admin/courses', input)

  const course = normalizeCourse(response.data.data)

  if (course === null) {
    throw new Error('Respons mata kuliah tidak valid.')
  }

  return course
}

export async function updateCourse(
  id: number,
  input: CourseInput,
): Promise<Course> {
  const response = await api.put<CourseResponse>(
    `/admin/courses/${id}`,
    input,
  )

  const course = normalizeCourse(response.data.data)

  if (course === null) {
    throw new Error('Respons mata kuliah tidak valid.')
  }

  return course
}

export async function deleteCourse(id: number): Promise<void> {
  await api.delete(`/admin/courses/${id}`)
}

export async function getStudentGrades(): Promise<StudentGradeSheet> {
  const response = await api.get<GradeSheetResponse>('/mahasiswa/grades')

  return normalizeStudentGradeSheet(response.data.data)
}

export async function saveStudentGrades(
  grades: StudentGradeInput[],
): Promise<StudentGradeSheet> {
  const response = await api.put<GradeSheetResponse>(
    '/mahasiswa/grades',
    { grades },
  )

  return normalizeStudentGradeSheet(response.data.data)
}
