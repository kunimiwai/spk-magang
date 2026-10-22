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

vi.mock('../services/applications', () => ({
  listStudentApplications: vi.fn(),
  createStudentApplication: vi.fn(),
  listStudentPartnerOptions: vi.fn(),
  listAdminApplications: vi.fn(),
  getAdminApplication: vi.fn(),
  updateAdminApplicationStatus: vi.fn(),
  uploadStudentAcceptanceLetter: vi.fn(),
  getAcceptanceLetterLimit: vi.fn(),
  downloadStudentAcceptanceLetter: vi.fn(),
  downloadAdminAcceptanceLetter: vi.fn(),
  listDpmOptions: vi.fn(),
  assignDpm: vi.fn(),
  listDpmApplications: vi.fn(),
}))

const mockedListAssignments = vi.mocked(listDpmApplications)

const dpmUser: AuthUser = {
  id: 5,
  name: 'Dr. Dosen Pembimbing',
  email: 'dosen@example.test',
  role: 'dpm',
}

const assignment: InternshipApplication = {
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
  mockedListAssignments.mockReset()
})

afterEach(() => {
  cleanup()
})

describe('DpmAssignmentsPage', () => {
  it('menampilkan loading state saat data bimbingan dimuat', () => {
    mockedListAssignments.mockReturnValue(
      new Promise<InternshipApplication[]>(() => {}),
    )

    renderRoute('/dpm/bimbingan')

    expect(screen.getByText('Memuat mahasiswa bimbingan...')).toBeTruthy()
  })

  it('menampilkan empty state ketika belum ada penempatan', async () => {
    mockedListAssignments.mockResolvedValue([])

    renderRoute('/dpm/bimbingan')

    expect(
      await screen.findByText('Belum ada mahasiswa bimbingan'),
    ).toBeTruthy()
  })

  it('menampilkan mahasiswa yang ditugaskan beserta mitra dan surat', async () => {
    mockedListAssignments.mockResolvedValue([assignment])

    renderRoute('/dpm/bimbingan')

    expect(await screen.findByText('Siti Rahma')).toBeTruthy()
    expect(screen.getByText('siti.rahma@example.test')).toBeTruthy()
    expect(screen.getByText('PT Maju')).toBeTruthy()
    expect(screen.getAllByText('Diterima').length).toBeGreaterThan(0)
    expect(
      screen.getByText(/surat-penerimaan\.pdf/),
    ).toBeTruthy()
    expect(screen.getByText(/Ditetapkan/)).toBeTruthy()
    expect(mockedListAssignments).toHaveBeenCalledTimes(1)
  })

  it('dapat memuat ulang data setelah gagal', async () => {
    mockedListAssignments
      .mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'))
      .mockResolvedValueOnce([])

    renderRoute('/dpm/bimbingan')

    expect(
      await screen.findByText('Mahasiswa bimbingan gagal dimuat'),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))

    expect(
      await screen.findByText('Belum ada mahasiswa bimbingan'),
    ).toBeTruthy()
    expect(mockedListAssignments).toHaveBeenCalledTimes(2)
  })

  it('menolak role mahasiswa tanpa memuat data DPM', () => {
    renderRoute(
      '/dpm/bimbingan',
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
    expect(mockedListAssignments).not.toHaveBeenCalled()
  })
})
