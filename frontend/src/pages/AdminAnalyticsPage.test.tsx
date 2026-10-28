import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AxiosError } from 'axios'
import { AppRoutes } from '../App'
import { AuthContext, type AuthContextValue } from '../auth/AuthContext'
import type { AuthUser } from '../services/auth'
import { getAnalytics, type AnalyticsData } from '../services/analytics'

vi.mock('../services/analytics', () => ({
  getAnalytics: vi.fn(),
}))

const mockedGetAnalytics = vi.mocked(getAnalytics)

const adminUser: AuthUser = {
  id: 9,
  name: 'Admin Uji',
  email: 'admin@example.test',
  role: 'admin',
}

const notConfiguredAnalytics: AnalyticsData = {
  partners: { count: 3 },
  criteria: [
    {
      id: 1,
      name: 'Fasilitas',
      type: 'benefit',
      weight: 0.6,
      stats: { count: 2, min: 2, max: 4, average: 3 },
      missing_partner_count: 1,
    },
    {
      id: 2,
      name: 'Jarak',
      type: 'cost',
      weight: 0.4,
      stats: null,
      missing_partner_count: 3,
    },
  ],
  scores: { filled_pairs: 2, total_pairs: 6 },
  kmeans: {
    configured: false,
    message:
      'Jumlah cluster K-Means belum ditetapkan (OD-010). Atribut K-Means belum ditetapkan (OD-009).',
    iterations: null,
    converged: null,
    distribution: null,
    service_error: null,
  },
  recommendation: {
    status: 'not_ready',
    checks: [
      {
        key: 'kmeans_configuration',
        label: 'Konfigurasi K-Means (analitik)',
        category: 'analysis',
        status: 'blocked',
        message: 'Jumlah cluster K-Means belum ditetapkan (OD-010).',
      },
      {
        key: 'activation',
        label: 'Aktivasi rekomendasi',
        category: 'decision',
        status: 'blocked',
        message: 'Rekomendasi dinonaktifkan (RECOMMENDATION_ENABLED=false).',
      },
    ],
  },
  notes: [
    'Nilai mitra bersifat data kerja yang dimasukkan admin, bukan data verifikasi resmi.',
  ],
}

const configuredAnalytics: AnalyticsData = {
  ...notConfiguredAnalytics,
  kmeans: {
    configured: true,
    message: '2 cluster dan 1 fitur K-Means dikonfigurasi.',
    iterations: 3,
    converged: true,
    distribution: [
      {
        cluster_index: 0,
        partner_count: 2,
        feature_averages: [
          { criterion_id: 1, criterion_name: 'Fasilitas', average: 3.5 },
        ],
      },
      {
        cluster_index: 1,
        partner_count: 1,
        feature_averages: [
          { criterion_id: 1, criterion_name: 'Fasilitas', average: 2 },
        ],
      },
    ],
    service_error: null,
  },
}

function createAuthValue(role = 'admin'): AuthContextValue {
  const user: AuthUser = {
    ...adminUser,
    id: role === 'admin' ? 9 : 12,
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
  mockedGetAnalytics.mockReset()
})

afterEach(() => {
  cleanup()
})

describe('AdminAnalyticsPage', () => {
  it('menampilkan loading state saat analitik dimuat', () => {
    mockedGetAnalytics.mockReturnValue(new Promise<AnalyticsData>(() => {}))

    renderRoute('/admin/analitik', createAuthValue())

    expect(screen.getByText('Memuat analitik mitra...')).toBeTruthy()
  })

  it('menampilkan statistik mitra dan status K-Means belum dikonfigurasi', async () => {
    mockedGetAnalytics.mockResolvedValue(notConfiguredAnalytics)

    renderRoute('/admin/analitik', createAuthValue())

    expect(await screen.findByText('Fasilitas')).toBeTruthy()
    expect(screen.getByText('Jarak')).toBeTruthy()
    expect(screen.getByText(/2\s*\/\s*6\s*pasangan/)).toBeTruthy()
    expect(screen.getByText('1 mitra belum dinilai')).toBeTruthy()
    expect(screen.getByText('3 mitra belum dinilai')).toBeTruthy()
    expect(
      screen.getByText('Analitik klaster belum tersedia'),
    ).toBeTruthy()
    expect(
      screen.getByText(
        'Jumlah cluster K-Means belum ditetapkan (OD-010). Atribut K-Means belum ditetapkan (OD-009).',
      ),
    ).toBeTruthy()
    expect(screen.getAllByText('Analitik').length).toBeGreaterThan(0)
    expect(
      screen.getByText(
        'Nilai mitra bersifat data kerja yang dimasukkan admin, bukan data verifikasi resmi.',
      ),
    ).toBeTruthy()

    const navigation = screen.getByRole('navigation', {
      name: 'Navigasi utama',
    })

    expect(
      within(navigation).getByRole('link', { name: 'Analitik' }),
    ).toBeTruthy()
  })

  it('menampilkan distribusi cluster ketika K-Means dikonfigurasi', async () => {
    mockedGetAnalytics.mockResolvedValue(configuredAnalytics)

    renderRoute('/admin/analitik', createAuthValue())

    expect(
      await screen.findByText('Distribusi mitra per cluster K-Means'),
    ).toBeTruthy()
    expect(screen.getByText('Rerata Fasilitas')).toBeTruthy()
    expect(screen.getByText('3,5')).toBeTruthy()
    expect(screen.queryByText('Analitik klaster belum tersedia')).toBeNull()
  })

  it('tidak menghitung distribusi ketika nilai fitur mitra belum lengkap', async () => {
    mockedGetAnalytics.mockResolvedValue({
      ...configuredAnalytics,
      kmeans: {
        ...configuredAnalytics.kmeans,
        iterations: null,
        converged: null,
        distribution: null,
      },
    })

    renderRoute('/admin/analitik', createAuthValue())

    expect(
      await screen.findByText('Distribusi belum dihitung'),
    ).toBeTruthy()
    expect(screen.queryByText('Rerata Fasilitas')).toBeNull()
    expect(screen.queryByText('Analitik klaster belum tersedia')).toBeNull()
  })

  it('menampilkan error state dan dapat mencoba ulang', async () => {
    mockedGetAnalytics
      .mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'))
      .mockResolvedValueOnce(notConfiguredAnalytics)

    renderRoute('/admin/analitik', createAuthValue())

    expect(await screen.findByText('Analitik gagal dimuat')).toBeTruthy()
    expect(
      screen.getByText(
        'Tidak dapat terhubung ke backend. Periksa koneksi lalu coba lagi.',
      ),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))

    expect(await screen.findByText('Fasilitas')).toBeTruthy()
    expect(mockedGetAnalytics).toHaveBeenCalledTimes(2)
  })

  it('tidak menampilkan halaman analitik untuk peran mahasiswa', async () => {
    mockedGetAnalytics.mockResolvedValue(notConfiguredAnalytics)

    renderRoute('/admin/analitik', createAuthValue('mahasiswa'))

    expect(screen.queryByText('Analitik mitra')).toBeNull()
  })
})
