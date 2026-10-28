import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/Card'
import { Field } from '../components/ui/Field'
import { Input } from '../components/ui/Input'
import { register } from '../services/auth'
import { getApiErrorMessage, getFieldErrors } from '../lib/apiError'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    setSuccess('')
    setLoading(true)

    try {
      await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      })
      setSuccess(
        'Akun mahasiswa berhasil dibuat. Silakan masuk dengan email dan password Anda.',
      )
      setName('')
      setEmail('')
      setPassword('')
      setPasswordConfirmation('')
    } catch (err: unknown) {
      setSuccess('')
      if (err instanceof Error) {
        // AxiosError
        const axiosErr = err as { response?: { status?: number; data?: unknown } }
        if (axiosErr.response?.status === 422) {
          const nextFieldErrors = getFieldErrors(axiosErr)
          setFieldErrors(nextFieldErrors)
          if (Object.keys(nextFieldErrors).length > 0) {
            setError('Periksa kembali data yang diisi.')
          } else {
            setError('Periksa kembali data yang diisi.')
          }
          return
        }
        if (axiosErr.response?.status === 429) {
          setError('Terlalu banyak percobaan pendaftaran. Coba lagi nanti.')
          return
        }
        if (!axiosErr.response) {
          setError('Tidak dapat terhubung ke backend. Pastikan Laravel berjalan.')
          return
        }
      }
      setError(getApiErrorMessage(err, 'Pendaftaran gagal. Silakan coba lagi.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#register-content"
        className="fixed left-3 top-3 z-50 -translate-y-24 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-lg focus:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Lewati ke konten utama
      </a>

      <main
        id="register-content"
        tabIndex={-1}
        className="flex min-h-dvh flex-col justify-center px-4 py-10 focus:outline-none sm:py-12"
      >
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 flex justify-center">
            <Link
              to="/"
              className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="text-xl">SPK Magang</span>
            </Link>
          </div>

          <Card>
            <CardHeader className="space-y-2">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Pendaftaran
              </p>
              <CardTitle>Daftar sebagai mahasiswa</CardTitle>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Buat akun baru untuk mengakses sistem SPK Magang.
              </p>
            </CardHeader>

            <CardContent>
              {success && (
                <Alert variant="success" title="Berhasil mendaftar">
                  {success}
                </Alert>
              )}

              {error && (
                <Alert variant="danger" title="Pendaftaran gagal">
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Field id="name" label="Nama lengkap" required error={fieldErrors.name}>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    autoFocus
                    aria-invalid={fieldErrors.name ? true : undefined}
                  />
                </Field>

                <Field id="register-email" label="Email" required error={fieldErrors.email}>
                  <Input
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    aria-invalid={fieldErrors.email ? true : undefined}
                  />
                </Field>

                <Field id="register-password" label="Password" required error={fieldErrors.password}>
                  <Input
                    id="register-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    aria-invalid={fieldErrors.password ? true : undefined}
                  />
                </Field>

                <Field
                  id="register-password-confirmation"
                  label="Konfirmasi password"
                  required
                  error={fieldErrors.password_confirmation}
                >
                  <Input
                    id="register-password-confirmation"
                    name="password_confirmation"
                    type="password"
                    autoComplete="new-password"
                    value={passwordConfirmation}
                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                    required
                    aria-invalid={fieldErrors.password_confirmation ? true : undefined}
                  />
                </Field>

                {error && (
                  <Alert variant="danger" title="Pendaftaran gagal">
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  isLoading={loading}
                  loadingLabel="Mendaftar…"
                >
                  Daftar
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Sudah punya akun?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  Masuk
                </Link>
              </p>

              <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
                Sistem Pendukung Keputusan Rekomendasi Tempat Magang
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
