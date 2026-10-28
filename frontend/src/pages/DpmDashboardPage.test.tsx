import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AxiosError } from 'axios'
import { AuthContext, type AuthContextValue } from '../auth/AuthContext'
import { AppRoutes } from '../App'
import type { AuthUser } from '../services/auth'
import {
  listDpmApplications,
  type InternshipApplication,
} from '../services/applications'

vi.mock('../services/applications', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../services/applications')>()

  return {
    ...actual,
    listDpmApplications: vi.fn(),
  }
})

const mockedListApplications = vi.mocked(listDpmApplications)

const dpm: AuthUser = {
  id: 5,
  name: 'Dr. Dosen Pembimbing',
  email: 'dosen@example.test',
  role: 'dpm',
}

const application: InternshipApplication = {
  id: 12,
  status: 'diterima',
  submittedAt: '2026-10-21T08:00:00.000000Z',
  reviewNote: 'Diterima setelah seleksi mitra.',
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

function createAuthValue(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    user: dpm,
    isAuthenticated: true,
    isLoading: false,
    sessionError: null,
    login: async () => dpm,
    logout: async () => {},
    refreshUser: async () => dpm,
    ...overrides,
  }
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

beforeEach(() => {
  mockedListApplications.mockReset()
})

afterEach(() => {
  cleanup()
})

describe('DpmDashboardPage', () => {
  it('menampilkan loading state saat ringkasan dimuat', () => {
    mockedListApplications.mockReturnValue(
      new Promise<InternshipApplication[]>(() => {}),
    )

    renderRoute('/dpm')

    expect(screen.getByText('Memuat ringkasan bimbingan...')).toBeTruthy()
  })

  it('menampilkan ringkasan mahasiswa dan surat dari backend', async () => {
    mockedListApplications.mockResolvedValue([application])

    renderRoute('/dpm')

    expect(
      await screen.findByRole('heading', {
        name: /Selamat datang, Dr. Dosen Pembimbing/,
      }),
    ).toBeTruthy()
    expect(screen.getByText('Siti Rahma')).toBeTruthy()
    expect(screen.getByText('PT Maju')).toBeTruthy()
    expect(screen.getByText('Surat: surat-penerimaan.pdf')).toBeTruthy()
    expect(screen.getByText('Mahasiswa bimbingan')).toBeTruthy()
    expect(screen.getByText('Surat tersedia')).toBeTruthy()
    expect(screen.getByText('Surat belum ada')).toBeTruthy()
  })

  it('menampilkan empty state ketika belum ada penugasan', async () => {
    mockedListApplications.mockResolvedValue([])

    renderRoute('/dpm')

    expect(
      await screen.findByText('Belum ada mahasiswa bimbingan'),
    ).toBeTruthy()
  })

  it('menampilkan error dan dapat memuat ulang', async () => {
    mockedListApplications
      .mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'))
      .mockResolvedValueOnce([application])

    renderRoute('/dpm')

    expect(
      await screen.findByText('Ringkasan bimbingan gagal dimuat'),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))

    expect(await screen.findByText('Siti Rahma')).toBeTruthy()
    expect(mockedListApplications).toHaveBeenCalledTimes(2)
  })

  it('menolak role selain DPM tanpa memuat data', () => {
    renderRoute(
      '/dpm',
      createAuthValue({
        user: {
          id: 9,
          name: 'Admin Uji',
          email: 'admin@example.test',
          role: 'admin',
        },
      }),
    )

    expect(
      screen.getByRole('heading', { name: 'Akses ditolak' }),
    ).toBeTruthy()
    expect(mockedListApplications).not.toHaveBeenCalled()
  })
})
