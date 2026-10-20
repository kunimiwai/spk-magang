import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import axios from 'axios'
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  type AuthUser,
} from '../services/auth'
import { getAuthToken } from '../services/api'
import { onUnauthorized } from '../services/authEvents'
import { AuthContext } from './AuthContext'

type AuthProviderProps = {
  children: ReactNode
}

type RefreshOptions = {
  showLoading?: boolean
}

const SESSION_CHECK_ERROR =
  'Tidak dapat memverifikasi sesi karena masalah jaringan atau server. ' +
  'Sesi Anda tidak dihapus. Periksa koneksi lalu coba lagi.'

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(() => Boolean(getAuthToken()))
  const [sessionError, setSessionError] = useState<string | null>(null)

  const inFlightRef = useRef<Promise<AuthUser | null> | null>(null)
  const epochRef = useRef(0)

  const refreshUser = useCallback(
    async (options: RefreshOptions = {}): Promise<AuthUser | null> => {
      const { showLoading = true } = options

      if (!getAuthToken()) {
        setUser(null)
        setSessionError(null)
        setIsLoading(false)
        return null
      }

      if (inFlightRef.current) {
        return inFlightRef.current
      }

      const epoch = epochRef.current

      if (showLoading) {
        setIsLoading(true)
        setSessionError(null)
      }

      const request = (async () => {
        try {
          const currentUser = await getCurrentUser()

          if (epochRef.current === epoch) {
            setUser(currentUser)
          }

          return currentUser
        } catch (error: unknown) {
          if (epochRef.current === epoch) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
              // The Axios interceptor has already cleared the token.
              setUser(null)
              setSessionError(null)
            } else {
              // Network/5xx failures are not proof that the session ended.
              setUser(null)
              setSessionError(SESSION_CHECK_ERROR)
            }
          }

          return null
        } finally {
          if (epochRef.current === epoch) {
            inFlightRef.current = null
            setIsLoading(false)
          }
        }
      })()

      inFlightRef.current = request

      return request
    },
    [],
  )

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      epochRef.current += 1
      const epoch = epochRef.current

      // Invalidate any older /auth/me request still in flight.
      inFlightRef.current = null

      const currentUser = await loginRequest(email, password)

      if (epochRef.current === epoch) {
        setUser(currentUser)
        setSessionError(null)
        setIsLoading(false)
      }

      return currentUser
    },
    [],
  )

  const logout = useCallback(async (): Promise<void> => {
    epochRef.current += 1

    try {
      await logoutRequest()
    } catch {
      // Local session state must still be cleared if the API call fails.
    } finally {
      inFlightRef.current = null
      setUser(null)
      setSessionError(null)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!getAuthToken()) {
      return
    }

    // Initial bootstrap: isLoading already starts as true when a token exists.
    // The state updates are the intended result of validating the stored session.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshUser({ showLoading: false })
  }, [refreshUser])

  useEffect(
    () =>
      onUnauthorized(() => {
        epochRef.current += 1
        inFlightRef.current = null
        setUser(null)
        setSessionError(null)
        setIsLoading(false)
      }),
    [],
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        sessionError,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
