
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

type RegisterResponse = {
  success: boolean
  message: string
}

type PasswordResetResponse = {
  success: boolean
  message: string
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

export async function register(values: {
  name: string
  email: string
  password: string
  password_confirmation: string
}): Promise<RegisterResponse> {
  const response = await api.post<RegisterResponse>('/auth/register', values)

  return response.data
}

export async function forgotPassword(email: string): Promise<PasswordResetResponse> {
  const response = await api.post<PasswordResetResponse>('/password/email', {
    email,
  })

  return response.data
}

export async function resetPassword(values: {
  email: string
  token: string
  password: string
  password_confirmation: string
}): Promise<PasswordResetResponse> {
  const response = await api.post<PasswordResetResponse>('/password/reset', values)

  return response.data
}
