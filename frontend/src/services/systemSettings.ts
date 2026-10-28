import api from './api'

export type SystemSetting = {
  id: number
  key: string
  value: string
  group: string | null
  description: string | null
  created_at: string | null
  updated_at: string | null
}

export type SystemSettingGrouped = Record<string, SystemSettingSettingEntry[]>

export type SystemSettingSettingEntry = {
  key: string
  value: string
  description: string | null
}

type SystemSettingListResponse = {
  success: boolean
  message: string
  data: SystemSetting[]
}

type SystemSettingGroupedResponse = {
  success: boolean
  message: string
  data: SystemSettingGrouped
}

type SystemSettingResponse = {
  success: boolean
  message: string
  data: SystemSetting
}

export async function listSystemSettings(): Promise<SystemSetting[]> {
  const response = await api.get<SystemSettingListResponse>(
    '/admin/system-settings',
  )

  return response.data.data
}

export async function listSystemSettingsGrouped(): Promise<
  SystemSettingGrouped
> {
  const response = await api.get<SystemSettingGroupedResponse>(
    '/admin/system-settings/grouped',
  )

  return response.data.data
}

export async function createSystemSetting(input: {
  key: string
  value: string
  group?: string | null
  description?: string | null
}): Promise<SystemSetting> {
  const response = await api.post<SystemSettingResponse>(
    '/admin/system-settings',
    input,
  )

  return response.data.data
}

export async function updateSystemSetting(
  id: number,
  input: {
    key?: string
    value?: string
    group?: string | null
    description?: string | null
  },
): Promise<SystemSetting> {
  const response = await api.put<SystemSettingResponse>(
    `/admin/system-settings/${id}`,
    input,
  )

  return response.data.data
}

export async function deleteSystemSetting(id: number): Promise<void> {
  await api.delete(`/admin/system-settings/${id}`)
}
