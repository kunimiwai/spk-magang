import { useState } from 'react'
import type { Course } from '../../services/academic'
import { deleteCourse } from '../../services/academic'
import { getApiErrorMessage } from '../../lib/apiError'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

type DeleteCourseDialogProps = {
  course: Course
  onClose: () => void
  onDeleted: (message: string) => void
}

export function DeleteCourseDialog({
  course,
  onClose,
  onDeleted,
}: DeleteCourseDialogProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setError('')
    setDeleting(true)

    try {
      await deleteCourse(course.id)
      onDeleted('Mata kuliah berhasil dihapus.')
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(err, 'Mata kuliah gagal dihapus. Coba lagi.'),
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog
      title="Hapus mata kuliah?"
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
            Hapus mata kuliah
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Mata kuliah{' '}
          <strong className="text-foreground">{course.name}</strong> akan
          dihapus. Mata kuliah yang sudah memiliki nilai mahasiswa tidak dapat
          dihapus.
        </p>

        {error && (
          <Alert variant="danger" title="Mata kuliah belum dapat dihapus">
            {error}
          </Alert>
        )}
      </div>
    </Dialog>
  )
}
