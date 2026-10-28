import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { AxiosError } from 'axios'
import { CommunicationLogPanel } from './CommunicationLogPanel'
import type { ApplicationCommunication } from '../../lib/communications'
import {
  createApplicationCommunication,
  listApplicationCommunications,
} from '../../services/communications'

vi.mock('../../services/communications', () => ({
  listApplicationCommunications: vi.fn(),
  createApplicationCommunication: vi.fn(),
}))

const mockedList = vi.mocked(listApplicationCommunications)
const mockedCreate = vi.mocked(createApplicationCommunication)

const existingCommunication: ApplicationCommunication = {
  id: 4,
  direction: 'outbound',
  channel: 'email',
  occurredAt: '2026-10-22T08:00:00.000000Z',
  summary: 'Berkas dikirim ke email resmi mitra.',
  recorder: {
    id: 9,
    name: 'Admin Uji',
    email: 'admin@example.test',
    role: 'admin',
  },
}

const olderCommunication: ApplicationCommunication = {
  ...existingCommunication,
  id: 3,
  occurredAt: '2026-10-21T07:00:00.000000Z',
  summary: 'Surat pengantar dikirim lebih awal.',
}

beforeEach(() => {
  mockedList.mockReset()
  mockedCreate.mockReset()
})

afterEach(() => {
  cleanup()
})

describe('CommunicationLogPanel', () => {
  it('menampilkan riwayat komunikasi dari API', async () => {
    mockedList.mockResolvedValue([existingCommunication])

    render(<CommunicationLogPanel applicationId={11} />)

    expect(
      await screen.findByText('Berkas dikirim ke email resmi mitra.'),
    ).toBeTruthy()
    expect(screen.getAllByText('Dikirim ke mitra').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Email').length).toBeGreaterThan(0)
    expect(screen.getByText(/Admin Uji/)).toBeTruthy()
    expect(mockedList).toHaveBeenCalledWith(11)
  })

  it('menampilkan empty state ketika belum ada catatan', async () => {
    mockedList.mockResolvedValue([])

    render(<CommunicationLogPanel applicationId={11} />)

    expect(
      await screen.findByText('Belum ada catatan komunikasi'),
    ).toBeTruthy()
  })

  it('menolak form kosong sebelum memanggil API', async () => {
    mockedList.mockResolvedValue([])

    render(<CommunicationLogPanel applicationId={11} />)

    await screen.findByText('Belum ada catatan komunikasi')
    fireEvent.change(screen.getByLabelText(/Ringkasan/), {
      target: { value: '   ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan catatan' }))

    expect(
      await screen.findByText('Ringkasan komunikasi wajib diisi.'),
    ).toBeTruthy()
    expect(mockedCreate).not.toHaveBeenCalled()
  })

  it('mengirim catatan dan menampilkannya tanpa mengubah status', async () => {
    mockedList.mockResolvedValue([])
    mockedCreate.mockResolvedValue(existingCommunication)

    render(<CommunicationLogPanel applicationId={11} />)

    await screen.findByText('Belum ada catatan komunikasi')
    fireEvent.change(screen.getByLabelText(/Arah/), {
      target: { value: 'outbound' },
    })
    fireEvent.change(screen.getByLabelText(/Kanal/), {
      target: { value: 'email' },
    })
    fireEvent.change(screen.getByLabelText(/Ringkasan/), {
      target: { value: 'Berkas dikirim ke email resmi mitra.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan catatan' }))

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalledWith(11, {
        direction: 'outbound',
        channel: 'email',
        occurredAt: expect.any(String),
        summary: 'Berkas dikirim ke email resmi mitra.',
      })
    })

    expect(
      await screen.findByText('Komunikasi mitra berhasil dicatat.'),
    ).toBeTruthy()
    expect(screen.getByText('Berkas dikirim ke email resmi mitra.')).toBeTruthy()
  })

  it('menempatkan catatan baru sesuai waktu komunikasi, bukan urutan input', async () => {
    mockedList.mockResolvedValue([existingCommunication])
    mockedCreate.mockResolvedValue(olderCommunication)

    render(<CommunicationLogPanel applicationId={11} />)

    await screen.findByText('Berkas dikirim ke email resmi mitra.')
    fireEvent.change(screen.getByLabelText(/Waktu komunikasi/), {
      target: { value: '2026-10-21T07:00' },
    })
    fireEvent.change(screen.getByLabelText(/Ringkasan/), {
      target: { value: olderCommunication.summary },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan catatan' }))

    expect(
      await screen.findByText('Komunikasi mitra berhasil dicatat.'),
    ).toBeTruthy()

    const items = screen.getAllByRole('listitem')

    expect(items).toHaveLength(2)
    expect(items[0].textContent).toContain(
      'Berkas dikirim ke email resmi mitra.',
    )
    expect(items[1].textContent).toContain(
      'Surat pengantar dikirim lebih awal.',
    )
  })

  it('menampilkan error jaringan dan dapat memuat ulang riwayat', async () => {
    mockedList
      .mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'))
      .mockResolvedValueOnce([])

    render(<CommunicationLogPanel applicationId={11} />)

    expect(
      await screen.findByText(
        'Tidak dapat terhubung ke backend. Periksa koneksi lalu coba lagi.',
      ),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))

    expect(
      await screen.findByText('Belum ada catatan komunikasi'),
    ).toBeTruthy()
    expect(mockedList).toHaveBeenCalledTimes(2)
  })
})
