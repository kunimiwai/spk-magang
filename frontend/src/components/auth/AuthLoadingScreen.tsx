import { Brand } from '../layout/Brand'
import { LoadingState } from '../ui/States'

type AuthLoadingScreenProps = {
  message?: string
}

export function AuthLoadingScreen({
  message = 'Memeriksa sesi pengguna…',
}: AuthLoadingScreenProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 py-10">
      <Brand />
      <div className="w-full max-w-sm">
        <LoadingState message={message} />
      </div>
    </main>
  )
}
