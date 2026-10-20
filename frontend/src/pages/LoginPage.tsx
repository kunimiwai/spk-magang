
import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 422) {
          setError('Email atau password tidak valid.')
        } else if (err.response?.status === 429) {
          setError('Terlalu banyak percobaan login. Coba lagi nanti.')
        } else if (!err.response) {
          setError('Tidak dapat terhubung ke backend. Pastikan Laravel berjalan.')
        } else {
          setError('Login gagal. Silakan coba lagi.')
        }
      } else {
        setError('Terjadi kesalahan yang tidak diketahui.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <h1>Login SPK Magang</h1>
      <p>Masuk menggunakan akun yang terdaftar.</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Memproses...' : 'Masuk'}
        </button>
      </form>
    </main>
  )
}
