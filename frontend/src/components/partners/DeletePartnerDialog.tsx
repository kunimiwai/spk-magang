import { useState } from 'react'
import type { Partner } from '../../services/partners'
import { deletePartner } from '../../services/partners'
import {
  getApiErrorMessage,
  getApiResponseMessage,
} from '../../lib/apiError'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

type DeletePartnerDialogProps = {
  partner: Partner
  onClose: () => void
  onDeleted: (message: string) => void
}

export function DeletePartnerDialog({
  partner,
  onClose,
  onDeleted,
}: DeletePartnerDialogProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setError('')
    setDeleting(true)

    try {
      await deletePartner(partner.id)
      onDeleted('Mitra magang berhasil dihapus.')
    } catch (err: unknown) {
      setError(
        getApiResponseMessage(err) ??
          getApiErrorMessage(
            err,
            'Mitra magang gagal dihapus. Coba lagi.',
          ),
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog
      title="Hapus mitra magang?"
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
            Hapus mitra
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Data mitra <strong className="text-foreground">{partner.name}</strong>{' '}
          akan dihapus dari sistem.
        </p>

        {error && (
          <Alert variant="danger" title="Data belum dapat dihapus">
            {error}
          </Alert>
        )}
      </div>
    </Dialog>
  )
}
