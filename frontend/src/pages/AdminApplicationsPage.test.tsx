import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AxiosError } from 'axios'
import { AuthContext, type AuthContextValue } from '../auth/AuthContext'
import { AppRoutes } from '../App'
import type { AuthUser } from '../services/auth'
import {
  listAdminApplications,
  type InternshipApplication,
} from '../services/applications'

vi.mock('../services/applications', () => ({
  listStudentApplications: vi.fn(),
  createStudentApplication: vi.fn(),
  listStudentPartnerOptions: vi.fn(),
  listStudentPartners: vi.fn(),
  getStudentApplication: vi.fn(),
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
  getDpmApplication: vi.fn(),
}))

const mockedListApplications = vi.mocked(listAdminApplications)

const adminUser: AuthUser = {
  id: 9,
  name: 'Admin Uji',
  email: 'admin@example.test',
  role: 'admin',
}

const pendingApplication: InternshipApplication = {
  id: 11,
  status: 'menunggu',
  submittedAt: '2026-10-21T08:00:00.000000Z',
  reviewNote: null,
  reviewedAt: null,
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
  acceptanceLetter: null,
  dpmPlacement: null,
}

const acceptedApplication: InternshipApplication = {
  ...pendingApplication,
  id: 12,
  status: 'diterima',
  reviewNote: 'Diterima setelah seleksi mitra.',
  reviewedAt: '2026-10-22T09:00:00.000000Z',
  reviewer: {
    id: 9,
    name: 'Admin Uji',
    email: 'admin@example.test',
    role: 'admin',
  },
}

function createAuthValue(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    user: adminUser,
    isAuthenticated: true,
    isLoading: false,
    sessionError: null,
    login: async () => adminUser,
    logout: async () => {},
    refreshUser: async () => adminUser,
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

describe('AdminApplicationsPage', () => {
  it('menampilkan loading state saat daftar pengajuan dimuat', () => {
    mockedListApplications.mockReturnValue(
      new Promise<InternshipApplication[]>(() => {}),
    )

    renderRoute('/admin/pengajuan')

    expect(screen.getByText('Memuat pengajuan...')).toBeTruthy()
  })

  it('menampilkan empty state ketika belum ada pengajuan', async () => {
    mockedListApplications.mockResolvedValue([])

    renderRoute('/admin/pengajuan')

    expect(await screen.findByText('Belum ada pengajuan')).toBeTruthy()
  })

  it('menampilkan daftar pengajuan dengan status dan tautan detail', async () => {
    mockedListApplications.mockResolvedValue([
      pendingApplication,
      acceptedApplication,
    ])

    renderRoute('/admin/pengajuan')

    expect((await screen.findAllByText('Siti Rahma')).length).toBe(2)
    expect(screen.getAllByText('PT Maju').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Menunggu hasil seleksi mitra')).toBeTruthy()
    expect(screen.getAllByText('Diterima')).toBeTruthy()
    expect(
      screen.getByText(/Surat: belum diunggah · DPM: belum ditetapkan/),
    ).toBeTruthy()

    const detailLinks = screen.getAllByRole('link', {
      name: /Lihat detail/,
    })

    expect(detailLinks[0].getAttribute('href')).toBe('/admin/pengajuan/11')
    expect(detailLinks[1].getAttribute('href')).toBe('/admin/pengajuan/12')
  })

  it('dapat memuat ulang daftar setelah gagal', async () => {
    mockedListApplications
      .mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'))
      .mockResolvedValueOnce([])

    renderRoute('/admin/pengajuan')

    expect(await screen.findByText('Pengajuan gagal dimuat')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))

    expect(await screen.findByText('Belum ada pengajuan')).toBeTruthy()
    expect(mockedListApplications).toHaveBeenCalledTimes(2)
  })

  it('mengizinkan role prodi membuka daftar pengajuan', async () => {
    mockedListApplications.mockResolvedValue([])

    renderRoute(
      '/admin/pengajuan',
      createAuthValue({
        user: {
          id: 10,
          name: 'Prodi Uji',
          email: 'prodi@example.test',
          role: 'prodi',
        },
      }),
    )

    expect(
      await screen.findByRole('heading', { name: 'Pengajuan magang' }),
    ).toBeTruthy()
    expect(mockedListApplications).toHaveBeenCalledTimes(1)
  })

  it('menolak role mahasiswa tanpa memuat daftar pengajuan', () => {
    renderRoute(
      '/admin/pengajuan',
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
    expect(mockedListApplications).not.toHaveBeenCalled()
  })
})
