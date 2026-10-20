
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import api from '../services/api'
import { getAuthToken } from '../services/api'
import { getCurrentUser, logout, type AuthUser } from '../services/auth'

type HealthResponse = {
  success: boolean
  message: string
  service: string
}

type ApiStatus =
  | { state: 'loading'; message: string }
  | { state: 'connected'; message: string; service: string }
  | { state: 'error'; message: string }

export default function HomePage() {
  const navigate = useNavigate()

  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    state: 'loading',
    message: 'Memeriksa koneksi backend...',
  })
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function checkApi() {
      try {
        const response = await api.get<HealthResponse>('/health')

        if (!active) return

        if (response.data.success) {
          setApiStatus({
            state: 'connected',
            message: response.data.message,
            service: response.data.service,
          })
        } else {
          setApiStatus({
            state: 'error',
            message: 'Backend merespons, tetapi status API tidak sukses.',
          })
        }
      } catch (error: unknown) {
        if (!active) return

        const message = axios.isAxiosError(error)
          ? error.code === 'ECONNABORTED'
            ? 'Permintaan API melewati batas waktu.'
            : error.response
              ? `API mengembalikan HTTP ${error.response.status}.`
              : 'Tidak dapat terhubung ke backend. Pastikan Laravel berjalan.'
          : 'Terjadi kesalahan yang tidak diketahui.'

        setApiStatus({ state: 'error', message })
      }
    }

    async function loadUser() {
      try {
        if (getAuthToken()) {
          const currentUser = await getCurrentUser()
          if (active) setUser(currentUser)
        }
      } catch {
        if (active) setUser(null)
      } finally {
        if (active) setAuthLoading(false)
      }
    }

    void checkApi()
    void loadUser()

    return () => {
      active = false
    }
  }, [])

  async function handleLogout() {
    setLogoutLoading(true)

    try {
      await logout()
    } finally {
      setUser(null)
      setLogoutLoading(false)
      navigate('/login', { replace: true })
    }
  }

  return (
    <main>
      <h1>SPK Magang</h1>
      <p>Sistem Pendukung Keputusan Rekomendasi Tempat Magang.</p>

      {authLoading ? (
        <p role="status">Memeriksa sesi pengguna...</p>
      ) : user ? (
        <section aria-labelledby="user-heading">
          <h2 id="user-heading">Akun Pengguna</h2>
          <p>Nama: {user.name}</p>
          <p>Email: {user.email}</p>
          <p>Role: {user.role}</p>
          <button onClick={handleLogout} disabled={logoutLoading}>
            {logoutLoading ? 'Keluar...' : 'Logout'}
          </button>
        </section>
      ) : (
        <p>
          <Link to="/login">Login untuk melanjutkan</Link>
        </p>
      )}

      <p>
        Fondasi aplikasi berhasil disiapkan. Fitur akan dikembangkan
        berdasarkan alur BPMN dan kebutuhan sistem.
      </p>

      <section aria-labelledby="api-status-heading">
        <h2 id="api-status-heading">Status Backend API</h2>

        {apiStatus.state === 'loading' && (
          <p role="status">{apiStatus.message}</p>
        )}

        {apiStatus.state === 'connected' && (
          <div>
            <p role="status">Status: Terhubung</p>
            <p>Pesan: {apiStatus.message}</p>
            <p>Service: {apiStatus.service}</p>
          </div>
        )}

        {apiStatus.state === 'error' && (
          <p role="alert">Status: Gagal terhubung. {apiStatus.message}</p>
        )}
      </section>
    </main>
  )
}
    
