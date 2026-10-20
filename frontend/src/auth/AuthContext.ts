import { createContext } from 'react'
import type { AuthUser } from '../services/auth'

export type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  sessionError: string | null
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
  refreshUser: () => Promise<AuthUser | null>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
