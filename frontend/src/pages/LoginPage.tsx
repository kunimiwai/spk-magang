import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { AuthLoadingScreen } from '../components/auth/AuthLoadingScreen'
import { Brand } from '../components/layout/Brand'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
} from '../components/ui/Card'
import { Field } from '../components/ui/Field'
import { Input } from '../components/ui/Input'
import { getLoginRedirectPath } from '../lib/authRedirect'
import { isPathAllowedForRole } from '../lib/routeAccess'

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()
  const requestedPath = getLoginRedirectPath(location.state)
  // A login form can be reached after a previous account logged out. The
  // stored "from" path may belong to the previous role, so ignore it when the
  // authenticated account cannot open it.
  const redirectTo =
    user && !isPathAllowedForRole(requestedPath, user.role)
      ? '/'
      : requestedPath

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
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401 || err.response?.status === 422) {
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

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#login-content"
        className="fixed left-3 top-3 z-50 -translate-y-24 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-lg focus:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Lewati ke konten utama
      </a>

      <main
        id="login-content"
        tabIndex={-1}
        className="flex min-h-dvh flex-col justify-center px-4 py-10 focus:outline-none sm:py-12"
      >
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 flex justify-center">
            <Link
              to="/"
              className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Brand />
            </Link>
          </div>

          <Card>
            <CardHeader className="space-y-2">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Autentikasi
              </p>
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Masuk ke SPK Magang
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Gunakan akun yang terdaftar untuk melanjutkan.
              </p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <Field id="email" label="Email" required>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoFocus
                  />
                </Field>

                <Field id="password" label="Password" required>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </Field>

                {error && (
                  <Alert variant="danger" title="Login gagal">
                    {error}
                  </Alert>
                )}

                <div className="flex items-center justify-between">
                  <Button
                    type="submit"
                    className="w-full"
                    isLoading={loading}
                    loadingLabel="Memproses…"
                  >
                    Masuk
                  </Button>
                </div>

                <p className="mt-4 text-right">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    Lupa password?
                  </Link>
                </p>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Belum punya akun?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    Daftar sebagai mahasiswa
                  </Link>
                </p>

                <p className="mt-4 text-center text-sm text-muted-foreground">
                  <Link
                    to="/"
                    className="rounded font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    Kembali ke beranda
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            Sistem Pendukung Keputusan Rekomendasi Tempat Magang
          </p>
        </div>
      </main>
    </div>
  )
}
