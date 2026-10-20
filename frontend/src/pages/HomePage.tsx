import { useEffect, useState } from 'react'
import axios from 'axios'
import api from '../services/api'

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
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    state: 'loading',
    message: 'Memeriksa koneksi backend...',
  })

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

    void checkApi()

    return () => {
      active = false
    }
  }, [])

  return (
    <main>
      <h1>SPK Magang</h1>

      <p>Sistem Pendukung Keputusan Rekomendasi Tempat Magang.</p>

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
