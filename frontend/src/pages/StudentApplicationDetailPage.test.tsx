import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AxiosError } from 'axios'
import { AuthContext, type AuthContextValue } from '../auth/AuthContext'
import { AppRoutes } from '../App'
import type { AuthUser } from '../services/auth'
import {
  getAcceptanceLetterLimit,
  getStudentApplication,
  type InternshipApplication,
} from '../services/applications'

vi.mock('../services/applications', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../services/applications')>()

  return {
    ...actual,
    getStudentApplication: vi.fn(),
    getAcceptanceLetterLimit: vi.fn(),
  }
})

const mockedGetApplication = vi.mocked(getStudentApplication)
const mockedGetLimit = vi.mocked(getAcceptanceLetterLimit)

const student: AuthUser = {
  id: 7,
  name: 'Siti Rahma',
  email: 'siti.rahma@example.test',
  role: 'mahasiswa',
}

const acceptedApplication: InternshipApplication = {
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
    description: 'Mitra magang bidang perangkat lunak.',
  },
  student: null,
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
    user: student,
    isAuthenticated: true,
    isLoading: false,
    sessionError: null,
    login: async () => student,
    logout: async () => {},
    refreshUser: async () => student,
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
  mockedGetApplication.mockReset()
  mockedGetLimit.mockReset()
  mockedGetLimit.mockResolvedValue({
    maxSizeKb: 5120,
    maxSizeBytes: 5242880,
    configuredMaxSizeKb: 5120,
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    replaceable: false,
  })
})

afterEach(() => {
  cleanup()
})

describe('StudentApplicationDetailPage', () => {
  it('menampilkan loading state saat detail dimuat', () => {
    mockedGetApplication.mockReturnValue(
      new Promise<InternshipApplication>(() => {}),
    )

    renderRoute('/mahasiswa/pengajuan/12')

    expect(screen.getByText('Memuat detail pengajuan...')).toBeTruthy()
  })

  it('menampilkan detail, riwayat, surat, dan DPM milik mahasiswa', async () => {
    mockedGetApplication.mockResolvedValue(acceptedApplication)

    renderRoute('/mahasiswa/pengajuan/12')

    expect(
      await screen.findByRole('heading', { name: 'Detail pengajuan magang' }),
    ).toBeTruthy()
    expect(screen.getByText('PT Maju')).toBeTruthy()
    expect(screen.getByText('Diterima setelah seleksi mitra.')).toBeTruthy()
    expect(screen.getByText('Pengajuan diterima')).toBeTruthy()
    expect(screen.getByText('surat-penerimaan.pdf')).toBeTruthy()
    expect(screen.getByText('Dr. Dosen Pembimbing')).toBeTruthy()
    expect(screen.getByText('dosen@example.test')).toBeTruthy()
    expect(screen.getByText('Riwayat pengajuan')).toBeTruthy()
    expect(screen.getByText('Keputusan dicatat: Diterima')).toBeTruthy()
    expect(mockedGetApplication).toHaveBeenCalledWith(12)
  })

  it('menampilkan error dan dapat memuat ulang detail', async () => {
    mockedGetApplication
      .mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'))
      .mockResolvedValueOnce(acceptedApplication)

    renderRoute('/mahasiswa/pengajuan/12')

    expect(
      await screen.findByText('Detail pengajuan gagal dimuat'),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))

    expect(await screen.findByText('PT Maju')).toBeTruthy()
    expect(mockedGetApplication).toHaveBeenCalledTimes(2)
  })

  it('menolak ID yang tidak valid tanpa memanggil API', () => {
    renderRoute('/mahasiswa/pengajuan/bukan-angka')

    expect(
      screen.getByText('Data pengajuan tidak ditemukan.'),
    ).toBeTruthy()
    expect(mockedGetApplication).not.toHaveBeenCalled()
  })

  it('menolak role selain mahasiswa tanpa memuat detail', () => {
    renderRoute(
      '/mahasiswa/pengajuan/12',
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
    expect(mockedGetApplication).not.toHaveBeenCalled()
  })
})
