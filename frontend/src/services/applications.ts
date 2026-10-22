import api from './api'
import {
  normalizeApplication,
  normalizeApplicationList,
  normalizeDpmOptionList,
  normalizePartnerOptionList,
} from '../lib/applications'

export type ApplicationStatus = 'menunggu' | 'diterima' | 'ditolak'

export type ApplicationDecision = 'diterima' | 'ditolak'

export type ApplicationPerson = {
  id: number
  name: string
  email: string
  role: string
}

export type ApplicationPartner = {
  id: number
  name: string
  address: string | null
  contact: string | null
  email: string | null
  description: string | null
}

export type PartnerOption = {
  id: number
  name: string
}

export type AcceptanceLetter = {
  id: number
  originalName: string
  mimeType: string
  size: number
  uploadedAt: string | null
}

export type DpmPlacement = {
  id: number
  assignedAt: string
  dpm: ApplicationPerson | null
}

export type DpmOption = {
  id: number
  name: string
  email: string
}

export type InternshipApplication = {
  id: number
  status: ApplicationStatus
  submittedAt: string
  reviewNote: string | null
  reviewedAt: string | null
  partner: ApplicationPartner
  student: ApplicationPerson | null
  reviewer: ApplicationPerson | null
  acceptanceLetter: AcceptanceLetter | null
  dpmPlacement: DpmPlacement | null
}

export type UpdateApplicationStatusInput = {
  status: ApplicationDecision
  reviewNote: string | null
}

type ApiEnvelope = {
  success: boolean
  message?: string
  data: unknown
}

function unwrap(response: { data: ApiEnvelope }): unknown {
  if (response.data?.success !== true) {
    throw new Error('Respons server tidak valid.')
  }

  return response.data.data
}

function requireApplication(payload: unknown): InternshipApplication {
  const application = normalizeApplication(payload)

  if (application === null) {
    throw new Error('Respons pengajuan tidak valid.')
  }

  return application
}

export async function listStudentApplications(): Promise<
  InternshipApplication[]
> {
  const response =
    await api.get<ApiEnvelope>('/mahasiswa/applications')

  return normalizeApplicationList(unwrap(response))
}

export async function getStudentApplication(
  id: number,
): Promise<InternshipApplication> {
  const response = await api.get<ApiEnvelope>(
    `/mahasiswa/applications/${id}`,
  )

  return requireApplication(unwrap(response))
}

export async function createStudentApplication(
  partnerId: number,
): Promise<InternshipApplication> {
  const response = await api.post<ApiEnvelope>(
    '/mahasiswa/applications',
    { partner_id: partnerId },
  )

  return requireApplication(unwrap(response))
}

export async function listStudentPartnerOptions(): Promise<PartnerOption[]> {
  const response = await api.get<ApiEnvelope>(
    '/mahasiswa/partner-options',
  )

  return normalizePartnerOptionList(unwrap(response))
}

export async function uploadStudentAcceptanceLetter(
  applicationId: number,
  file: File,
): Promise<InternshipApplication> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post<ApiEnvelope>(
    `/mahasiswa/applications/${applicationId}/acceptance-letter`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )

  return requireApplication(unwrap(response))
}

export type AcceptanceLetterLimit = {
  maxSizeKb: number
  maxSizeBytes: number
  configuredMaxSizeKb: number
  allowedMimeTypes: string[]
  replaceable: boolean
}

/**
 * Effective limit from the backend. The runtime can enforce a smaller limit
 * than the application configuration (PHP upload_max_filesize/post_max_size),
 * so the client uses this value instead of assuming the configured size.
 */
export async function getAcceptanceLetterLimit(): Promise<AcceptanceLetterLimit> {
  const response = await api.get<ApiEnvelope>(
    '/mahasiswa/acceptance-letter/limit',
  )
  const payload = unwrap(response)

  if (typeof payload !== 'object' || payload === null) {
    throw new Error('Respons batas unggah tidak valid.')
  }

  const data = payload as Record<string, unknown>
  const maxSizeKb = data.max_size_kb

  if (
    typeof maxSizeKb !== 'number' ||
    !Number.isFinite(maxSizeKb) ||
    maxSizeKb <= 0
  ) {
    throw new Error('Respons batas unggah tidak valid.')
  }

  return {
    maxSizeKb,
    maxSizeBytes: maxSizeKb * 1024,
    configuredMaxSizeKb:
      typeof data.configured_max_size_kb === 'number'
        ? data.configured_max_size_kb
        : maxSizeKb,
    allowedMimeTypes: Array.isArray(data.allowed_mime_types)
      ? data.allowed_mime_types.filter(
          (item): item is string => typeof item === 'string',
        )
      : [],
    replaceable: data.replaceable === true,
  }
}

export async function downloadStudentAcceptanceLetter(
  applicationId: number,
): Promise<Blob> {
  const response = await api.get<Blob>(
    `/mahasiswa/applications/${applicationId}/acceptance-letter`,
    { responseType: 'blob' },
  )

  if (!(response.data instanceof Blob)) {
    throw new Error('Berkas surat penerimaan tidak valid.')
  }

  return response.data
}

export async function downloadAdminAcceptanceLetter(
  applicationId: number,
): Promise<Blob> {
  const response = await api.get<Blob>(
    `/admin/applications/${applicationId}/acceptance-letter`,
    { responseType: 'blob' },
  )

  if (!(response.data instanceof Blob)) {
    throw new Error('Berkas surat penerimaan tidak valid.')
  }

  return response.data
}

export async function listAdminApplications(): Promise<
  InternshipApplication[]
> {
  const response = await api.get<ApiEnvelope>('/admin/applications')

  return normalizeApplicationList(unwrap(response))
}

export async function getAdminApplication(
  id: number,
): Promise<InternshipApplication> {
  const response = await api.get<ApiEnvelope>(
    `/admin/applications/${id}`,
  )

  return requireApplication(unwrap(response))
}

export async function updateAdminApplicationStatus(
  id: number,
  input: UpdateApplicationStatusInput,
): Promise<InternshipApplication> {
  const response = await api.patch<ApiEnvelope>(
    `/admin/applications/${id}/status`,
    {
      status: input.status,
      review_note: input.reviewNote,
    },
  )

  return requireApplication(unwrap(response))
}

export async function listDpmOptions(): Promise<DpmOption[]> {
  const response = await api.get<ApiEnvelope>('/admin/dpm-options')

  return normalizeDpmOptionList(unwrap(response))
}

export async function assignDpm(
  applicationId: number,
  dpmId: number,
): Promise<InternshipApplication> {
  const response = await api.put<ApiEnvelope>(
    `/admin/applications/${applicationId}/dpm`,
    { dpm_id: dpmId },
  )

  return requireApplication(unwrap(response))
}

/**
 * Daftar mahasiswa yang ditugaskan kepada DPM yang sedang login.
 * Endpoint backend membatasi hasil pada penempatan milik pengguna aktif.
 */
export async function listDpmApplications(): Promise<
  InternshipApplication[]
> {
  const response = await api.get<ApiEnvelope>('/dpm/applications')

  return normalizeApplicationList(unwrap(response))
}
