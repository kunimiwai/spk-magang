import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AxiosError } from 'axios'
import { DeletePartnerDialog } from './DeletePartnerDialog'
import { deletePartner, type Partner } from '../../services/partners'

vi.mock('../../services/partners', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/partners')>()

  return {
    ...actual,
    deletePartner: vi.fn(),
  }
})

const mockedDeletePartner = vi.mocked(deletePartner)

const partner: Partner = {
  id: 3,
  name: 'PT Maju',
  address: 'Jl. Contoh 1',
  contact: '08123456789',
  email: 'mitra@example.test',
  description: 'Mitra magang.',
  created_at: '2026-10-20T08:00:00.000000Z',
  updated_at: '2026-10-20T08:00:00.000000Z',
}

beforeEach(() => {
  mockedDeletePartner.mockReset()
})

afterEach(() => {
  cleanup()
})

describe('DeletePartnerDialog', () => {
  it('menampilkan alasan konflik dari backend saat mitra masih dipakai', async () => {
    const conflict = new AxiosError('Conflict')
    conflict.response = {
      status: 409,
      data: {
        success: false,
        message:
          'Mitra magang tidak dapat dihapus karena masih memiliki pengajuan mahasiswa.',
      },
    } as AxiosError['response']
    mockedDeletePartner.mockRejectedValue(conflict)

    render(
      <DeletePartnerDialog
        partner={partner}
        onClose={() => {}}
        onDeleted={() => {}}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Hapus mitra' }))

    expect(
      await screen.findByText(
        'Mitra magang tidak dapat dihapus karena masih memiliki pengajuan mahasiswa.',
      ),
    ).toBeTruthy()
    expect(
      screen.queryByText('Mitra magang gagal dihapus. Coba lagi.'),
    ).toBeNull()
  })

  it('memanggil callback setelah mitra berhasil dihapus', async () => {
    const onDeleted = vi.fn()
    mockedDeletePartner.mockResolvedValue()

    render(
      <DeletePartnerDialog
        partner={partner}
        onClose={() => {}}
        onDeleted={onDeleted}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Hapus mitra' }))

    await waitFor(() => {
      expect(mockedDeletePartner).toHaveBeenCalledWith(3)
      expect(onDeleted).toHaveBeenCalledWith('Mitra magang berhasil dihapus.')
    })
  })
})
