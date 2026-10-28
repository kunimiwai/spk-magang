import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AxiosError } from 'axios'
import { AppRoutes } from '../App'
import { AuthContext, type AuthContextValue } from '../auth/AuthContext'
import type { AuthUser } from '../services/auth'
import {
  createCriterion,
  deleteCriterion,
  getPartnerScores,
  listCriteria,
  listPartnerOptions,
  savePartnerScores,
  type Criterion,
  type PartnerScoreSheet,
} from '../services/criteria'

vi.mock('../services/criteria', () => ({
  listCriteria: vi.fn(),
  createCriterion: vi.fn(),
  updateCriterion: vi.fn(),
  deleteCriterion: vi.fn(),
  listPartnerOptions: vi.fn(),
  getPartnerScores: vi.fn(),
  savePartnerScores: vi.fn(),
}))

const mockedListCriteria = vi.mocked(listCriteria)
const mockedCreateCriterion = vi.mocked(createCriterion)
const mockedDeleteCriterion = vi.mocked(deleteCriterion)
const mockedListPartnerOptions = vi.mocked(listPartnerOptions)
const mockedGetPartnerScores = vi.mocked(getPartnerScores)
const mockedSavePartnerScores = vi.mocked(savePartnerScores)

const criterion: Criterion = {
  id: 1,
  name: 'Kriteria Uji',
  description: 'Deskripsi kriteria uji.',
  type: 'benefit',
  weight: 2.5,
  scores_count: 0,
  created_at: '2026-10-21T00:00:00.000000Z',
  updated_at: '2026-10-21T00:00:00.000000Z',
}

const partner = { id: 7, name: 'PT Uji' }

const scoreSheet: PartnerScoreSheet = {
  partner,
  criteria: [
    {
      criterion_id: criterion.id,
      name: criterion.name,
      type: criterion.type,
      weight: criterion.weight,
      score: null,
    },
  ],
}

function createAuthValue(role = 'admin'): AuthContextValue {
  const user: AuthUser = {
    id: role === 'admin' ? 1 : 2,
    name: role === 'admin' ? 'Admin Uji' : 'Prodi Uji',
    email: `${role}@example.test`,
    role,
  }

  return {
    user,
    isAuthenticated: true,
    isLoading: false,
    sessionError: null,
    login: async () => user,
    logout: async () => {},
    refreshUser: async () => user,
  }
}

function renderRoute(path: string, auth: AuthContextValue) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

beforeEach(() => {
  mockedListCriteria.mockReset()
  mockedCreateCriterion.mockReset()
  mockedDeleteCriterion.mockReset()
  mockedListPartnerOptions.mockReset()
  mockedGetPartnerScores.mockReset()
  mockedSavePartnerScores.mockReset()
})

afterEach(() => {
  cleanup()
})

describe('CriteriaPage', () => {
  it('menampilkan daftar kriteria dan pilihan mitra untuk admin', async () => {
    mockedListCriteria.mockResolvedValue([criterion])
    mockedListPartnerOptions.mockResolvedValue([partner])

    renderRoute('/kriteria', createAuthValue('admin'))

    expect(
      screen.getByRole('heading', { name: 'Kriteria & penilaian mitra' }),
    ).toBeTruthy()
    expect(await screen.findByText('Kriteria Uji')).toBeTruthy()
    expect(screen.getByText('Benefit')).toBeTruthy()
    expect(screen.getByText('2,5')).toBeTruthy()
    expect(screen.getByText('Belum dinilai')).toBeTruthy()
    expect(
      await screen.findByRole('option', { name: 'PT Uji' }),
    ).toBeTruthy()
    expect(mockedGetPartnerScores).not.toHaveBeenCalled()

    const navigation = screen.getByRole('navigation', {
      name: 'Navigasi utama',
    })

    expect(
      within(navigation)
        .getByRole('link', { name: 'Kriteria' })
        .getAttribute('href'),
    ).toBe('/kriteria')
  })

  it('menampilkan empty state kriteria dan mitra untuk role prodi', async () => {
    mockedListCriteria.mockResolvedValue([])
    mockedListPartnerOptions.mockResolvedValue([])

    renderRoute('/kriteria', createAuthValue('prodi'))

    expect(await screen.findByText('Belum ada kriteria')).toBeTruthy()
    expect(await screen.findByText('Belum ada mitra magang')).toBeTruthy()
    expect(
      screen.queryByRole('heading', { name: 'Akses ditolak' }),
    ).toBeNull()
  })

  it('menampilkan error state ketika API kriteria dan mitra gagal dimuat', async () => {
    mockedListCriteria.mockRejectedValue(
      new AxiosError('Network Error', 'ERR_NETWORK'),
    )
    mockedListPartnerOptions.mockRejectedValue(
      new AxiosError('Network Error', 'ERR_NETWORK'),
    )

    renderRoute('/kriteria', createAuthValue('admin'))

    expect(await screen.findByText('Kriteria gagal dimuat')).toBeTruthy()
    expect(await screen.findByText('Daftar mitra gagal dimuat')).toBeTruthy()
    expect(
      screen.getAllByRole('button', { name: 'Coba lagi' }),
    ).toHaveLength(2)
    expect(
      screen.getByRole('heading', { name: 'Kriteria & penilaian mitra' }),
    ).toBeTruthy()
  })

  it('memuat dan menyimpan nilai kriteria untuk mitra yang dipilih', async () => {
    mockedListCriteria.mockResolvedValue([criterion])
    mockedListPartnerOptions.mockResolvedValue([partner])
    mockedGetPartnerScores.mockResolvedValue(scoreSheet)
    mockedSavePartnerScores.mockResolvedValue({
      ...scoreSheet,
      criteria: [{ ...scoreSheet.criteria[0], score: 4.5 }],
    })

    renderRoute('/kriteria', createAuthValue('admin'))

    const select = await screen.findByLabelText('Mitra')
    fireEvent.change(select, { target: { value: String(partner.id) } })

    const scoreInput = await screen.findByLabelText('Nilai')
    fireEvent.change(scoreInput, { target: { value: '4.5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan nilai' }))

    await waitFor(() => {
      expect(mockedSavePartnerScores).toHaveBeenCalledWith(partner.id, [
        { criterion_id: criterion.id, score: 4.5 },
      ])
    })
    expect(
      await screen.findByText('Nilai kriteria mitra berhasil disimpan.'),
    ).toBeTruthy()
    expect(mockedGetPartnerScores).toHaveBeenCalledWith(partner.id)
  })

  it('menampilkan error state ketika nilai mitra gagal dimuat', async () => {
    mockedListCriteria.mockResolvedValue([criterion])
    mockedListPartnerOptions.mockResolvedValue([partner])
    mockedGetPartnerScores.mockRejectedValue(
      new AxiosError('Network Error', 'ERR_NETWORK'),
    )

    renderRoute('/kriteria', createAuthValue('admin'))

    fireEvent.change(await screen.findByLabelText('Mitra'), {
      target: { value: String(partner.id) },
    })

    expect(
      await screen.findByText('Nilai kriteria gagal dimuat'),
    ).toBeTruthy()
    expect(
      screen.getByText(
        'Tidak dapat terhubung ke backend. Periksa koneksi lalu coba lagi.',
      ),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Coba lagi' }),
    ).toBeTruthy()
  })

  it('memvalidasi form dan membuat kriteria dengan data yang diisi', async () => {
    mockedListCriteria.mockResolvedValue([])
    mockedListPartnerOptions.mockResolvedValue([])
    mockedCreateCriterion.mockResolvedValue(criterion)

    renderRoute('/kriteria', createAuthValue('admin'))

    fireEvent.click(
      (await screen.findAllByRole('button', { name: 'Tambah kriteria' }))[0],
    )

    const dialog = screen.getByRole('dialog', { name: 'Tambah kriteria' })
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Tambah kriteria' }),
    )

    expect(
      await within(dialog).findByText('Nama kriteria wajib diisi.'),
    ).toBeTruthy()
    expect(
      within(dialog).getByText('Bobot kriteria wajib diisi.'),
    ).toBeTruthy()

    fireEvent.change(within(dialog).getByLabelText(/Nama kriteria/), {
      target: { value: 'Kriteria Uji' },
    })
    fireEvent.change(within(dialog).getByLabelText(/Tipe/), {
      target: { value: 'cost' },
    })
    fireEvent.change(within(dialog).getByLabelText(/Bobot/), {
      target: { value: '2.5' },
    })
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Tambah kriteria' }),
    )

    await waitFor(() => {
      expect(mockedCreateCriterion).toHaveBeenCalledWith({
        name: 'Kriteria Uji',
        description: null,
        type: 'cost',
        weight: 2.5,
      })
    })
    expect(
      await screen.findByText('Kriteria berhasil ditambahkan.'),
    ).toBeTruthy()
  })

  it('meminta konfirmasi sebelum menghapus kriteria', async () => {
    mockedListCriteria.mockResolvedValue([criterion])
    mockedListPartnerOptions.mockResolvedValue([])
    mockedDeleteCriterion.mockResolvedValue()

    renderRoute('/kriteria', createAuthValue('admin'))

    fireEvent.click(
      await screen.findByRole('button', { name: 'Hapus Kriteria Uji' }),
    )

    const dialog = screen.getByRole('dialog', { name: 'Hapus kriteria?' })
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Hapus kriteria' }),
    )

    await waitFor(() => {
      expect(mockedDeleteCriterion).toHaveBeenCalledWith(criterion.id)
    })
    expect(await screen.findByText('Kriteria berhasil dihapus.')).toBeTruthy()
  })

  it('menolak role mahasiswa tanpa memuat data kriteria', () => {
    renderRoute('/kriteria', createAuthValue('mahasiswa'))

    expect(
      screen.getByRole('heading', { name: 'Akses ditolak' }),
    ).toBeTruthy()
    expect(
      screen.queryByRole('heading', { name: 'Kriteria & penilaian mitra' }),
    ).toBeNull()
    expect(mockedListCriteria).not.toHaveBeenCalled()
  })
})
