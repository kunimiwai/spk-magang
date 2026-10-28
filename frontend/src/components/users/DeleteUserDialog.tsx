import { useState } from 'react'
import type { UserAccount } from '../../services/users'
import { deleteUser } from '../../services/users'
import { getApiErrorMessage } from '../../lib/apiError'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

type DeleteUserDialogProps = {
  user: UserAccount
  onClose: () => void
  onDeleted: (message: string) => void
}

export function DeleteUserDialog({
  user,
  onClose,
  onDeleted,
}: DeleteUserDialogProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setError('')
    setDeleting(true)

    try {
      await deleteUser(user.id)
      onDeleted(`Akun ${user.name} berhasil dihapus.`)
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(err, 'Akun pengguna gagal dihapus. Coba lagi.'),
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog
      title="Hapus akun pengguna?"
      description="Tindakan ini tidak dapat dibatalkan."
      onClose={onClose}
      size="md"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleting}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              void handleDelete()
            }}
            isLoading={deleting}
            loadingLabel="Menghapus…"
          >
            Hapus akun
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Akun <strong className="text-foreground">{user.name}</strong> ({user.email}) dengan role {user.role} akan dihapus dari sistem.
        </p>

        {error && (
          <Alert variant="danger" title="Akun belum dapat dihapus">
            {error}
          </Alert>
        )}
      </div>
    </Dialog>
  )
}
