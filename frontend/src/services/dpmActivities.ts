import api from './api'

export type DpmActivity = {
  id: number
  dpm_placement_id: number
  dpm_id: number
  activity_type: string
  description: string | null
  occurred_at: string | null
  created_at: string | null
  updated_at: string | null
  dpm: {
    id: number
    name: string
    email: string
    role: string
  } | null
  placement: {
    id: number
    application: {
      id: number
      student: {
        id: number
        name: string
        email: string
      }
      partner: {
        id: number
        name: string
      } | null
    }
  } | null
}

type DpmActivityListResponse = {
  success: boolean
  message: string
  data: DpmActivity[]
  meta: {
    current_page: number
    per_page: number
    last_page: number
    total: number
  }
}

type DpmActivityResponse = {
  success: boolean
  message: string
  data: DpmActivity
}

export async function listDpmActivities(
  params?: {
    page?: number
    per_page?: number
  },
): Promise<{
  activities: DpmActivity[]
  meta: DpmActivityListResponse['meta']
}> {
  const response = await api.get<DpmActivityListResponse>(
    '/dpm/activities',
    { params },
  )

  return {
    activities: response.data.data,
    meta: response.data.meta,
  }
}

export async function getDpmActivity(
  id: number,
): Promise<DpmActivity> {
  const response = await api.get<DpmActivityResponse>(
    `/dpm/activities/${id}`,
  )

  return response.data.data
}

export async function createDpmActivity(
  placementId: number,
  input: {
    activity_type: string
    description?: string | null
    occurred_at?: string | null
  },
): Promise<DpmActivity> {
  const response = await api.post<DpmActivityResponse>(
    `/dpm/placements/${placementId}/activities`,
    input,
  )

  return response.data.data
}

export async function updateDpmActivity(
  id: number,
  input: {
    activity_type: string
    description?: string | null
    occurred_at?: string | null
  },
): Promise<DpmActivity> {
  const response = await api.put<DpmActivityResponse>(
    `/dpm/activities/${id}`,
    input,
  )

  return response.data.data
}

export async function deleteDpmActivity(id: number): Promise<void> {
  await api.delete(`/dpm/activities/${id}`)
}
