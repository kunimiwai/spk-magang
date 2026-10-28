import api from './api'

export type UserRole = 'admin' | 'prodi' | 'dpm' | 'mahasiswa'

export type UserAccount = {
  id: number
  name: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string | null
  updated_at: string | null
}

type UserListResponse = {
  success: boolean
  message: string
  data: UserAccount[]
}

type UserResponse = {
  success: boolean
  message: string
  data: UserAccount
}

export type UserFormInput = {
  name: string
  email: string
  password?: string
  role: UserRole
  is_active?: boolean
}

export async function listUsers(): Promise<UserAccount[]> {
  const response = await api.get<UserListResponse>('/admin/users')

  return response.data.data
}

export async function getUser(id: number): Promise<UserAccount> {
  const response = await api.get<UserResponse>(`/admin/users/${id}`)

  return response.data.data
}

export async function createUser(input: UserFormInput): Promise<UserAccount> {
  const response = await api.post<UserResponse>('/admin/users', input)

  return response.data.data
}

export async function updateUser(
  id: number,
  input: UserFormInput,
): Promise<UserAccount> {
  const response = await api.put<UserResponse>(`/admin/users/${id}`, input)

  return response.data.data
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/admin/users/${id}`)
}
