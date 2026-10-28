import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AxiosError } from 'axios'
import { DeleteCriterionDialog } from './DeleteCriterionDialog'
import { deleteCriterion, type Criterion } from '../../services/criteria'

vi.mock('../../services/criteria', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/criteria')>()

  return {
    ...actual,
    deleteCriterion: vi.fn(),
  }
})

const mockedDeleteCriterion = vi.mocked(deleteCriterion)

const criterion: Criterion = {
  id: 6,
  name: 'Kualitas mitra',
  description: 'Penilaian kualitas.',
  type: 'benefit',
  weight: 0.4,
  scores_count: 3,
  created_at: '2026-10-20T08:00:00.000000Z',
  updated_at: '2026-10-20T08:00:00.000000Z',
}

beforeEach(() => {
  mockedDeleteCriterion.mockReset()
})

afterEach(() => {
  cleanup()
})

describe('DeleteCriterionDialog', () => {
  it('menampilkan alasan konflik dari backend saat kriteria masih dipakai', async () => {
    const conflict = new AxiosError('Conflict')
    conflict.response = {
      status: 409,
      data: {
        success: false,
        message:
          'Kriteria tidak dapat dihapus karena masih memiliki nilai mitra.',
      },
    } as AxiosError['response']
    mockedDeleteCriterion.mockRejectedValue(conflict)

    render(
      <DeleteCriterionDialog
        criterion={criterion}
        onClose={() => {}}
        onDeleted={() => {}}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Hapus kriteria' }))

    expect(
      await screen.findByText(
        'Kriteria tidak dapat dihapus karena masih memiliki nilai mitra.',
      ),
    ).toBeTruthy()
    expect(
      screen.queryByText('Kriteria gagal dihapus. Coba lagi.'),
    ).toBeNull()
  })
})
