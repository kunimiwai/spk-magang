
import api, { clearAuthToken, setAuthToken } from './api'

export type AuthUser = {
  id: number
  name: string
  email: string
  role: string
}

type LoginResponse = {
  success: boolean
  message: string
  data: {
    user: AuthUser
    token: string
    token_type: 'Bearer'
  }
}

type MeResponse = {
  success: boolean
  data: {
    user: AuthUser
  }
}

export async function login(
  email: string,
  password: string,
): Promise<AuthUser> {
  const response = await api.post<LoginResponse>('/auth/login', {
    email,
    password,
  })

  const { token, user } = response.data.data

  setAuthToken(token)

  return user
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await api.get<MeResponse>('/auth/me')

  return response.data.data.user
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout')
  } finally {
    clearAuthToken()
  }
}
