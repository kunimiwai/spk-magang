import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import { resetPassword } from '../services/auth'
import { getApiErrorMessage, getFieldErrors } from '../lib/apiError'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
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
      await resetPassword({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      })
      setSuccess(
        'Password berhasil diubah. Silakan masuk dengan password baru Anda.',
      )
      setEmail('')
      setPassword('')
      setPasswordConfirmation('')
    } catch (err: unknown) {
      setSuccess('')
      if (err instanceof Error) {
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
          setError('Terlalu banyak percobaan reset password. Coba lagi nanti.')
          return
        }
        if (!axiosErr.response) {
          setError('Tidak dapat terhubung ke backend. Pastikan Laravel berjalan.')
          return
        }
      }
      setError(getApiErrorMessage(err, 'Gagal mengubah password. Silakan coba lagi.'))
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-dvh bg-background">
        <main className="flex min-h-dvh flex-col justify-center px-4 py-10 sm:py-12">
          <div className="mx-auto w-full max-w-md">
            <Card>
              <CardContent className="text-center p-8">
                <Alert variant="danger" title="Token tidak valid">
                  Token reset password tidak ditemukan dalam URL. Silakan
                  mintakan tautan reset ulang melalui halaman lupa password.
                </Alert>
                <p className="mt-4 text-center">
                  <Link
                    to="/forgot-password"
                    className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    Kirim tautan reset ulang
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#reset-password-content"
        className="fixed left-3 top-3 z-50 -translate-y-24 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-lg focus:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Lewati ke konten utama
      </a>

      <main
        id="reset-password-content"
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
                Atur ulang password
              </p>
              <CardTitle>Masukkan password baru</CardTitle>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Masukkan password baru untuk akun Anda.
              </p>
            </CardHeader>

            <CardContent>
              {success && (
                <Alert variant="success" title="Password berhasil diubah">
                  {success}
                </Alert>
              )}

              {error && (
                <Alert variant="danger" title="Gagal mengubah password">
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Field id="reset-email" label="Email" required>
                  <Input
                    id="reset-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoFocus
                  />
                </Field>

                <Field id="reset-password" label="Password baru" required error={fieldErrors.password}>
                  <Input
                    id="reset-password"
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
                  id="reset-password-confirmation"
                  label="Konfirmasi password baru"
                  required
                  error={fieldErrors.password_confirmation}
                >
                  <Input
                    id="reset-password-confirmation"
                    name="password_confirmation"
                    type="password"
                    autoComplete="new-password"
                    value={passwordConfirmation}
                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                    required
                    aria-invalid={fieldErrors.password_confirmation ? true : undefined}
                  />
                </Field>

                <input type="hidden" name="token" value={token} />

                {error && (
                  <Alert variant="danger" title="Gagal mengubah password">
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  isLoading={loading}
                  loadingLabel="Mengubah…"
                >
                  Ubah password
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Kembali ke{' '}
                <Link
                  to="/login"
                  className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  halaman masuk
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
