import { useState } from 'react'
import type { Criterion } from '../../services/criteria'
import { deleteCriterion } from '../../services/criteria'
import {
  getApiErrorMessage,
  getApiResponseMessage,
} from '../../lib/apiError'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

type DeleteCriterionDialogProps = {
  criterion: Criterion
  onClose: () => void
  onDeleted: (message: string) => void
}

export function DeleteCriterionDialog({
  criterion,
  onClose,
  onDeleted,
}: DeleteCriterionDialogProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setError('')
    setDeleting(true)

    try {
      await deleteCriterion(criterion.id)
      onDeleted('Kriteria berhasil dihapus.')
    } catch (err: unknown) {
      setError(
        getApiResponseMessage(err) ??
          getApiErrorMessage(err, 'Kriteria gagal dihapus. Coba lagi.'),
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog
      title="Hapus kriteria?"
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
            Hapus kriteria
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Kriteria{' '}
          <strong className="text-foreground">{criterion.name}</strong> akan
          dihapus dari sistem. Kriteria yang sudah memiliki nilai penilaian
          mitra tidak dapat dihapus.
        </p>

        {error && (
          <Alert variant="danger" title="Kriteria belum dapat dihapus">
            {error}
          </Alert>
        )}
      </div>
    </Dialog>
  )
}
