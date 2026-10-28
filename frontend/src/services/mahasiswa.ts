import api from './api'
import {
  normalizePeminatanReference,
  normalizeStudentProfile,
  type PeminatanReference,
  type StudentProfile,
} from '../lib/peminatan'

type PeminatanResponse = {
  success: boolean
  message: string
  data: unknown
}

type StudentProfileResponse = PeminatanResponse

export async function getPeminatanReference(): Promise<PeminatanReference> {
  const response = await api.get<PeminatanResponse>('/mahasiswa/peminatan')

  return normalizePeminatanReference(response.data.data)
}

export async function getStudentProfile(): Promise<StudentProfile> {
  const response = await api.get<StudentProfileResponse>('/mahasiswa/profile')

  return normalizeStudentProfile(response.data.data)
}

export async function updateStudentProfile(
  peminatan: string[],
): Promise<StudentProfile> {
  const response = await api.put<StudentProfileResponse>(
    '/mahasiswa/profile',
    { peminatan },
  )

  return normalizeStudentProfile(response.data.data)
}
