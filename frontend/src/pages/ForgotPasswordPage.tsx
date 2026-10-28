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
import { forgotPassword } from '../services/auth'
import { getApiErrorMessage } from '../lib/apiError'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await forgotPassword(email)
      setEmail('')
      setSuccess(
        'Jika email Anda terdaftar di sistem, tautan reset password telah dikirim ke inbox email Anda.',
      )
    } catch (err: unknown) {
      setSuccess('')
      if (err instanceof Error) {
        const axiosErr = err as { response?: { status?: number } }
        if (axiosErr.response?.status === 429) {
          setError('Terlalu banyak permintaan reset. Coba lagi nanti.')
          setLoading(false)
          return
        }
        if (!axiosErr.response) {
          setError('Tidak dapat terhubung ke backend. Pastikan Laravel berjalan.')
          setLoading(false)
          return
        }
      }
      setError(getApiErrorMessage(err, 'Gagal mengirim tautan reset. Silakan coba lagi.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#forgot-password-content"
        className="fixed left-3 top-3 z-50 -translate-y-24 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-lg focus:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Lewati ke konten utama
      </a>

      <main
        id="forgot-password-content"
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
                Lupa password
              </p>
              <CardTitle>Masukkan email Anda</CardTitle>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Kami akan mengirimkan tautan untuk mengatur ulang password Anda.
              </p>
            </CardHeader>

            <CardContent>
              {success && (
                <Alert variant="success" title="Instruksi telah dikirim">
                  {success}
                </Alert>
              )}

              {error && (
                <Alert variant="danger" title="Gagal mengirim tautan">
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Field id="forgot-email" label="Email" required>
                  <Input
                    id="forgot-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoFocus
                  />
                </Field>

                <Button
                  type="submit"
                  className="w-full"
                  isLoading={loading}
                  loadingLabel="Mengirim…"
                >
                  Kirim tautan reset
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Sudah punya token reset?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  Kembali ke halaman masuk
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
