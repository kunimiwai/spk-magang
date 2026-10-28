import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { AuthContext, type AuthContextValue } from '../auth/AuthContext'
import { AppRoutes } from '../App'
import type { AuthUser } from '../services/auth'
import {
  getDpmApplication,
  type InternshipApplication,
} from '../services/applications'

vi.mock('../services/applications', () => ({
  listStudentApplications: vi.fn(),
  getStudentApplication: vi.fn(),
  createStudentApplication: vi.fn(),
  listStudentPartnerOptions: vi.fn(),
  listStudentPartners: vi.fn(),
  uploadStudentAcceptanceLetter: vi.fn(),
  getAcceptanceLetterLimit: vi.fn(),
  downloadStudentAcceptanceLetter: vi.fn(),
  downloadAdminAcceptanceLetter: vi.fn(),
  listAdminApplications: vi.fn(),
  getAdminApplication: vi.fn(),
  updateAdminApplicationStatus: vi.fn(),
  listDpmOptions: vi.fn(),
  assignDpm: vi.fn(),
  listDpmApplications: vi.fn(),
  getDpmApplication: vi.fn(),
}))

const mockedGet = vi.mocked(getDpmApplication)

const dpmUser: AuthUser = {
  id: 5,
  name: 'Dr. Dosen Pembimbing',
  email: 'dosen@example.test',
  role: 'dpm',
}

const application: InternshipApplication = {
  id: 12,
  status: 'diterima',
  submittedAt: '2026-10-21T08:00:00.000000Z',
  reviewNote: 'Catatan internal Admin tidak boleh terlihat.',
  reviewedAt: '2026-10-22T09:00:00.000000Z',
  partner: {
    id: 3,
    name: 'PT Maju',
    address: 'Jl. Contoh 1',
    contact: '08123456789',
    email: 'mitra@example.test',
    description: 'Mitra magang.',
  },
  student: {
    id: 7,
    name: 'Siti Rahma',
    email: 'siti.rahma@example.test',
    role: 'mahasiswa',
  },
  reviewer: null,
  acceptanceLetter: {
    id: 21,
    originalName: 'surat-penerimaan.pdf',
    mimeType: 'application/pdf',
    size: 204800,
    uploadedAt: '2026-10-23T10:00:00.000000Z',
  },
  dpmPlacement: {
    id: 31,
    assignedAt: '2026-10-24T09:00:00.000000Z',
    dpm: {
      id: 5,
      name: 'Dr. Dosen Pembimbing',
      email: 'dosen@example.test',
      role: 'dpm',
    },
  },
}

const otherApplication: InternshipApplication = {
  ...application,
  id: 13,
  student: {
    id: 8,
    name: 'Budi Santoso',
    email: 'budi.santoso@example.test',
    role: 'mahasiswa',
  },
}

function createAuthValue(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    user: dpmUser,
    isAuthenticated: true,
    isLoading: false,
    sessionError: null,
    login: async () => dpmUser,
    logout: async () => {},
    refreshUser: async () => dpmUser,
    ...overrides,
  }
}

function RouteChanger() {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate('/dpm/bimbingan/13')}
    >
      Buka bimbingan 13
    </button>
  )
}

function renderRoute(
  path: string,
  auth: AuthContextValue = createAuthValue(),
) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

function renderNavigableRoute(
  path: string,
  auth: AuthContextValue = createAuthValue(),
) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <RouteChanger />
        <AppRoutes />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

beforeEach(() => {
  mockedGet.mockReset()
})

afterEach(() => {
  cleanup()
})

describe('DpmAssignmentDetailPage', () => {
  it('memuat detail hanya untuk pengajuan yang ditugaskan', async () => {
    mockedGet.mockResolvedValue(application)

    renderRoute('/dpm/bimbingan/12')

    expect(await screen.findByText('Siti Rahma')).toBeTruthy()
    expect(screen.getByText('siti.rahma@example.test')).toBeTruthy()
    expect(screen.getByText('PT Maju')).toBeTruthy()
    expect(screen.getByText('mitra@example.test')).toBeTruthy()
    expect(screen.getByText('surat-penerimaan.pdf')).toBeTruthy()
    expect(screen.getByText('200 KB')).toBeTruthy()
    expect(
      screen.getByText(/Surat penerimaan hanya tampil sebagai metadata/),
    ).toBeTruthy()
    expect(
      screen.queryByText('Catatan internal Admin tidak boleh terlihat.'),
    ).toBeNull()
    expect(
      screen.queryByRole('button', { name: /Unduh/ }),
    ).toBeNull()
    expect(mockedGet).toHaveBeenCalledWith(12)
  })

  it('tidak menampilkan detail ID lama saat ID berubah tanpa unmount', async () => {
    let resolveSecond: (application: InternshipApplication) => void = () => {}

    mockedGet
      .mockResolvedValueOnce(application)
      .mockReturnValueOnce(
        new Promise<InternshipApplication>((resolve) => {
          resolveSecond = resolve
        }),
      )

    renderNavigableRoute('/dpm/bimbingan/12')

    expect(await screen.findByText('Siti Rahma')).toBeTruthy()
    fireEvent.click(
      screen.getByRole('button', { name: 'Buka bimbingan 13' }),
    )

    expect(
      screen.getByText('Memuat detail mahasiswa bimbingan...'),
    ).toBeTruthy()
    expect(screen.queryByText('Siti Rahma')).toBeNull()

    await act(async () => {
      resolveSecond(otherApplication)
    })

    expect(await screen.findByText('Budi Santoso')).toBeTruthy()
    expect(screen.queryByText('Siti Rahma')).toBeNull()
  })

  it('mengabaikan respons lama yang selesai setelah respons ID baru', async () => {
    let resolveFirst: (application: InternshipApplication) => void = () => {}
    let resolveSecond: (application: InternshipApplication) => void = () => {}

    mockedGet.mockImplementation(
      (id) =>
        new Promise<InternshipApplication>((resolve) => {
          if (id === 12) {
            resolveFirst = resolve
          } else {
            resolveSecond = resolve
          }
        }),
    )

    renderNavigableRoute('/dpm/bimbingan/12')

    await waitFor(() => {
      expect(mockedGet).toHaveBeenCalledWith(12)
    })

    fireEvent.click(
      screen.getByRole('button', { name: 'Buka bimbingan 13' }),
    )

    await waitFor(() => {
      expect(mockedGet).toHaveBeenCalledWith(13)
    })

    expect(
      screen.getByText('Memuat detail mahasiswa bimbingan...'),
    ).toBeTruthy()

    await act(async () => {
      resolveSecond(otherApplication)
    })

    expect(await screen.findByText('Budi Santoso')).toBeTruthy()

    await act(async () => {
      resolveFirst(application)
    })

    expect(screen.getByText('Budi Santoso')).toBeTruthy()
    expect(screen.queryByText('Siti Rahma')).toBeNull()
  })

  it('menampilkan error jaringan dan dapat memuat ulang', async () => {
    mockedGet
      .mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'))
      .mockResolvedValueOnce(application)

    renderRoute('/dpm/bimbingan/12')

    expect(
      await screen.findByText(
        'Tidak dapat terhubung ke backend. Periksa koneksi lalu coba lagi.',
      ),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))

    expect(await screen.findByText('Siti Rahma')).toBeTruthy()
    expect(mockedGet).toHaveBeenCalledTimes(2)
  })

  it('menampilkan error untuk id yang tidak valid tanpa memanggil API', () => {
    renderRoute('/dpm/bimbingan/bukan-angka')

    expect(
      screen.getByText('Data mahasiswa bimbingan tidak ditemukan.'),
    ).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: 'Coba lagi' }),
    ).toBeNull()
    expect(mockedGet).not.toHaveBeenCalled()
  })

  it('menolak role mahasiswa tanpa memuat detail', () => {
    renderRoute(
      '/dpm/bimbingan/12',
      createAuthValue({
        user: {
          id: 7,
          name: 'Siti Rahma',
          email: 'siti.rahma@example.test',
          role: 'mahasiswa',
        },
      }),
    )

    expect(
      screen.getByRole('heading', { name: 'Akses ditolak' }),
    ).toBeTruthy()
    expect(mockedGet).not.toHaveBeenCalled()
  })
})
