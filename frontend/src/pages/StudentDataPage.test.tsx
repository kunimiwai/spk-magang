import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AxiosError } from 'axios'
import { AuthContext, type AuthContextValue } from '../auth/AuthContext'
import type { StudentProfile } from '../lib/peminatan'
import type { AuthUser } from '../services/auth'
import {
  getStudentProfile,
  updateStudentProfile,
} from '../services/mahasiswa'
import StudentDataPage from './StudentDataPage'

vi.mock('../services/mahasiswa', () => ({
  getPeminatanReference: vi.fn(),
  getStudentProfile: vi.fn(),
  updateStudentProfile: vi.fn(),
}))

const mockedGetStudentProfile = vi.mocked(getStudentProfile)
const mockedUpdateStudentProfile = vi.mocked(updateStudentProfile)

const mahasiswaUser: AuthUser = {
  id: 7,
  name: 'Siti Rahma',
  email: 'siti.rahma@example.test',
  role: 'mahasiswa',
}

const savedSingleProfile: StudentProfile = {
  peminatan: ['DTA'],
  options: ['DTA', 'PSI', 'SIA'],
  selectionMode: 'single',
  selectionAvailable: true,
  profileComplete: true,
  note: 'Pilihan peminatan disimpan sebagai satu pilihan.',
}

const incompleteSingleProfile: StudentProfile = {
  ...savedSingleProfile,
  peminatan: [],
  profileComplete: false,
}

const incompleteMultipleProfile: StudentProfile = {
  ...savedSingleProfile,
  peminatan: [],
  selectionMode: 'multiple',
  profileComplete: false,
  note: 'Pilihan peminatan dapat terdiri dari satu atau lebih pilihan.',
}

const blockedProfile: StudentProfile = {
  peminatan: [],
  options: ['DTA', 'PSI', 'SIA'],
  selectionMode: null,
  selectionAvailable: false,
  profileComplete: false,
  note: 'Penyimpanan peminatan belum diaktifkan karena keputusan satu atau lebih peminatan belum ditetapkan (OD-015).',
}

function createAuthValue(): AuthContextValue {
  return {
    user: mahasiswaUser,
    isAuthenticated: true,
    isLoading: false,
    sessionError: null,
    login: async () => mahasiswaUser,
    logout: async () => {},
    refreshUser: async () => mahasiswaUser,
  }
}

function renderPage() {
  return render(
    <AuthContext.Provider value={createAuthValue()}>
      <MemoryRouter initialEntries={['/mahasiswa']}>
        <StudentDataPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

beforeEach(() => {
  mockedGetStudentProfile.mockReset()
  mockedUpdateStudentProfile.mockReset()
})

afterEach(() => {
  cleanup()
})

describe('StudentDataPage', () => {
  it('menampilkan loading state saat profil dimuat', async () => {
    let resolveProfile: (profile: StudentProfile) => void = () => {}

    mockedGetStudentProfile.mockReturnValue(
      new Promise<StudentProfile>((resolve) => {
        resolveProfile = resolve
      }),
    )

    renderPage()

    expect(screen.getByText('Memuat profil peminatan...')).toBeTruthy()

    await act(async () => {
      resolveProfile(savedSingleProfile)
    })

    await waitFor(() => {
      expect(screen.getByText('Tersimpan')).toBeTruthy()
    })
  })

  it('menampilkan empty state dan konflik kardinalitas tanpa form', async () => {
    mockedGetStudentProfile.mockResolvedValue(blockedProfile)

    renderPage()

    expect(await screen.findByText('Peminatan belum dipilih')).toBeTruthy()
    expect(screen.getByText(blockedProfile.note)).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: 'Simpan peminatan' }),
    ).toBeNull()
    expect(screen.queryByLabelText('Peminatan')).toBeNull()
  })

  it('menyimpan pilihan tunggal dari form', async () => {
    mockedGetStudentProfile.mockResolvedValue(savedSingleProfile)
    mockedUpdateStudentProfile.mockResolvedValue({
      ...savedSingleProfile,
      peminatan: ['PSI'],
    })

    renderPage()

    const select = await screen.findByRole('combobox', {
      name: /Peminatan/,
    })
    fireEvent.change(select, { target: { value: 'PSI' } })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan peminatan' }))

    expect(
      await screen.findByText('Peminatan berhasil disimpan.'),
    ).toBeTruthy()
    expect(mockedUpdateStudentProfile).toHaveBeenCalledTimes(1)
    expect(mockedUpdateStudentProfile).toHaveBeenCalledWith(['PSI'])
  })

  it('menolak submit tanpa peminatan dan tidak memanggil API', async () => {
    mockedGetStudentProfile.mockResolvedValue(incompleteSingleProfile)

    renderPage()

    await screen.findByRole('button', { name: 'Simpan peminatan' })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan peminatan' }))

    expect(
      await screen.findByText('Pilih minimal satu peminatan terlebih dahulu.'),
    ).toBeTruthy()
    expect(mockedUpdateStudentProfile).not.toHaveBeenCalled()
  })

  it('menyimpan beberapa pilihan ketika mode multiple aktif', async () => {
    mockedGetStudentProfile.mockResolvedValue(incompleteMultipleProfile)
    mockedUpdateStudentProfile.mockResolvedValue({
      ...incompleteMultipleProfile,
      peminatan: ['DTA', 'PSI'],
      profileComplete: true,
    })

    renderPage()

    await screen.findByRole('checkbox', { name: 'DTA' })
    fireEvent.click(screen.getByRole('checkbox', { name: 'DTA' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'PSI' }))
    fireEvent.click(screen.getByRole('button', { name: 'Simpan peminatan' }))

    expect(
      await screen.findByText('Peminatan berhasil disimpan.'),
    ).toBeTruthy()
    expect(mockedUpdateStudentProfile).toHaveBeenCalledWith(['DTA', 'PSI'])
  })

  it('menampilkan error jaringan saat penyimpanan gagal', async () => {
    mockedGetStudentProfile.mockResolvedValue(savedSingleProfile)
    mockedUpdateStudentProfile.mockRejectedValue(
      new AxiosError('Network Error', 'ERR_NETWORK'),
    )

    renderPage()

    await screen.findByRole('combobox', { name: /Peminatan/ })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan peminatan' }))

    expect(
      await screen.findByText(
        'Tidak dapat terhubung ke backend. Periksa koneksi lalu coba lagi.',
      ),
    ).toBeTruthy()
    expect(screen.getByText('Peminatan gagal disimpan')).toBeTruthy()
    expect(
      screen.queryByText('Peminatan berhasil disimpan.'),
    ).toBeNull()
  })

  it('menampilkan error validasi server pada field peminatan', async () => {
    mockedGetStudentProfile.mockResolvedValue(savedSingleProfile)
    mockedUpdateStudentProfile.mockRejectedValue(
      new AxiosError(
        'Unprocessable Content',
        'ERR_BAD_REQUEST',
        undefined,
        undefined,
        {
          data: {
            message: 'Periksa kembali data yang dikirim.',
            errors: {
              peminatan: ['Hanya satu peminatan yang dapat dipilih.'],
            },
          },
          status: 422,
          statusText: 'Unprocessable Content',
          headers: {},
          config: {} as never,
        },
      ),
    )

    renderPage()

    await screen.findByRole('combobox', { name: /Peminatan/ })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan peminatan' }))

    expect(
      await screen.findByText('Hanya satu peminatan yang dapat dipilih.'),
    ).toBeTruthy()
    expect(
      screen.queryByText('Peminatan berhasil disimpan.'),
    ).toBeNull()
  })
})
