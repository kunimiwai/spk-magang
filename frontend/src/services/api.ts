
import axios from 'axios'
import { emitUnauthorized } from './authEvents'

const TOKEN_KEY = 'spk_magang_token'

export function getAuthToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearAuthToken(): void {
  sessionStorage.removeItem(TOKEN_KEY)
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = getAuthToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const requestUrl = error.config?.url ?? ''
      const isLoginRequest = requestUrl.includes('/auth/login')

      // Login failures are handled by the login form; they must not trigger
      // a global session-expired redirect.
      if (!isLoginRequest) {
        const hadToken = Boolean(getAuthToken())

        clearAuthToken()

        // Only notify when a session actually existed. This prevents repeated
        // notifications and redirect loops when several requests fail at once.
        if (hadToken) {
          emitUnauthorized()
        }
      }
    }

    return Promise.reject(error)
  },
)

export default api

