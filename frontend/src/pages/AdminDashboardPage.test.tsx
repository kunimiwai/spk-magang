import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AxiosError } from 'axios'
import { AuthContext, type AuthContextValue } from '../auth/AuthContext'
import { AppRoutes } from '../App'
import type { AuthUser } from '../services/auth'
import type { AnalyticsData } from '../services/analytics'
import {
  listAdminApplications,
  type InternshipApplication,
} from '../services/applications'
import { getAnalytics } from '../services/analytics'

vi.mock('../services/applications', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../services/applications')>()

  return {
    ...actual,
    listAdminApplications: vi.fn(),
  }
})

vi.mock('../services/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/analytics')>()

  return {
    ...actual,
    getAnalytics: vi.fn(),
  }
})

const mockedListApplications = vi.mocked(listAdminApplications)
const mockedGetAnalytics = vi.mocked(getAnalytics)

const admin: AuthUser = {
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

const applications: InternshipApplication[] = [
  pendingApplication,
  {
    ...pendingApplication,
    id: 12,
    status: 'menunggu',
    student: {
      id: 8,
      name: 'Budi Santoso',
      email: 'budi@example.test',
      role: 'mahasiswa',
    },
  },
  {
    ...pendingApplication,
    id: 13,
    status: 'diterima',
    reviewedAt: '2026-10-22T09:00:00.000000Z',
  },
  {
    ...pendingApplication,
    id: 14,
    status: 'ditolak',
    reviewedAt: '2026-10-22T10:00:00.000000Z',
  },
]

const analytics: AnalyticsData = {
  partners: { count: 3 },
  criteria: [
    {
      id: 1,
      name: 'Kualitas',
      type: 'benefit',
      weight: 1,
      stats: { count: 3, min: 1, max: 5, average: 3 },
      missing_partner_count: 0,
    },
  ],
  scores: { filled_pairs: 3, total_pairs: 3 },
  kmeans: {
    configured: false,
    message: 'Jumlah cluster belum ditetapkan.',
    iterations: null,
    converged: null,
    distribution: null,
    service_error: null,
  },
  recommendation: {
    status: 'not_ready',
    checks: [],
  },
  notes: [],
}

function createAuthValue(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    user: admin,
    isAuthenticated: true,
    isLoading: false,
    sessionError: null,
    login: async () => admin,
    logout: async () => {},
    refreshUser: async () => admin,
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
  mockedGetAnalytics.mockReset()
})

afterEach(() => {
  cleanup()
})

describe('AdminDashboardPage', () => {
  it('menampilkan loading state untuk ringkasan pengajuan', () => {
    mockedListApplications.mockReturnValue(
      new Promise<InternshipApplication[]>(() => {}),
    )
    mockedGetAnalytics.mockReturnValue(new Promise<AnalyticsData>(() => {}))

    renderRoute('/admin')

    expect(screen.getByText('Memuat ringkasan pengajuan...')).toBeTruthy()
  })

  it('menampilkan notifikasi pengajuan menunggu dan data backend', async () => {
    mockedListApplications.mockResolvedValue(applications)
    mockedGetAnalytics.mockResolvedValue(analytics)

    renderRoute('/admin')

    expect(
      await screen.findByText('2 pengajuan perlu ditinjau'),
    ).toBeTruthy()
    expect(screen.getByText('Siti Rahma')).toBeTruthy()
    expect(screen.getByText('Budi Santoso')).toBeTruthy()
    expect(screen.getByText('Kesiapan data')).toBeTruthy()
    expect(screen.getByText('3 / 3')).toBeTruthy()
    expect(screen.getByText('Belum siap')).toBeTruthy()
    expect(screen.getByText('Mitra magang')).toBeTruthy()
  })

  it('tetap menampilkan pengajuan saat data pendukung gagal dimuat', async () => {
    mockedListApplications.mockResolvedValue(applications)
    mockedGetAnalytics.mockRejectedValue(
      new AxiosError('Network Error', 'ERR_NETWORK'),
    )

    renderRoute('/admin')

    expect(
      await screen.findByText('2 pengajuan perlu ditinjau'),
    ).toBeTruthy()
    expect(
      await screen.findByText('Data pendukung gagal dimuat'),
    ).toBeTruthy()
  })

  it('dapat memuat ulang ringkasan pengajuan setelah gagal', async () => {
    mockedListApplications
      .mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'))
      .mockResolvedValueOnce([])
    mockedGetAnalytics.mockResolvedValue(analytics)

    renderRoute('/admin')

    expect(
      await screen.findByText('Ringkasan pengajuan gagal dimuat'),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))

    expect(
      await screen.findByText(
        'Semua pengajuan yang tercatat sudah memiliki keputusan.',
      ),
    ).toBeTruthy()
    expect(mockedListApplications).toHaveBeenCalledTimes(2)
  })

  it('mengizinkan prodi membuka dashboard tanpa menu mitra admin-only', async () => {
    mockedListApplications.mockResolvedValue([])
    mockedGetAnalytics.mockResolvedValue(analytics)

    renderRoute(
      '/admin',
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
      await screen.findByRole('heading', { name: /Selamat datang, Prodi Uji/ }),
    ).toBeTruthy()
    expect(
      screen.queryByRole('link', { name: /Buka mitra/ }),
    ).toBeNull()
    expect(screen.getByRole('link', { name: /Buka analitik/ })).toBeTruthy()
  })

  it('menolak role mahasiswa tanpa memuat data', () => {
    renderRoute(
      '/admin',
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
    expect(mockedGetAnalytics).not.toHaveBeenCalled()
  })
})
