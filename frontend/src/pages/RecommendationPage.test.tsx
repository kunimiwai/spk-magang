import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  act,
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
  getRecommendation,
  type RecommendationResult,
} from '../services/recommendations'

vi.mock('../services/recommendations', () => ({
  getRecommendation: vi.fn(),
}))

const mockedGetRecommendation = vi.mocked(getRecommendation)

const mahasiswaUser: AuthUser = {
  id: 7,
  name: 'Siti Rahma',
  email: 'siti.rahma@example.test',
  role: 'mahasiswa',
}

const notReadyResult: RecommendationResult = {
  status: 'not_ready',
  message:
    'Rekomendasi belum dapat dihitung karena pemeriksaan berikut belum terpenuhi.',
  checks: [
    {
      key: 'peminatan',
      label: 'Peminatan mahasiswa',
      category: 'data',
      status: 'blocked',
      message: 'Peminatan mahasiswa belum tersimpan di backend.',
    },
    {
      key: 'kmeans_configuration',
      label: 'Konfigurasi K-Means (analitik)',
      category: 'analysis',
      status: 'blocked',
      message:
        'Jumlah cluster K-Means belum ditetapkan (OD-010). Label cluster tidak dipakai untuk menyaring ranking SAW.',
    },
    {
      key: 'scores',
      label: 'Kelengkapan nilai mitra',
      category: 'data',
      status: 'ok',
      message: 'Semua mitra memiliki nilai lengkap.',
    },
  ],
  criteria: [],
  ranking: [],
  kmeans: null,
  explanation: null,
  disclaimer: null,
}

const readyResult: RecommendationResult = {
  status: 'ready',
  message: 'Perhitungan rekomendasi selesai.',
  checks: [],
  criteria: [
    { id: 1, name: 'Kualitas mentor', type: 'benefit', weight: 0.6 },
    { id: 2, name: 'Jarak lokasi', type: 'cost', weight: 0.4 },
  ],
  ranking: [
    {
      rank: 1,
      partner_id: 10,
      partner_name: 'PT Maju',
      score: 0.9,
      cluster_index: 0,
    },
    {
      rank: 2,
      partner_id: 11,
      partner_name: 'PT Sejahtera',
      score: 0.75,
      cluster_index: 0,
    },
  ],
  kmeans: {
    cluster_count: 2,
    random_seed: 42,
    feature_criterion_ids: [1],
    iterations: 3,
    converged: true,
    partner_count: 2,
  },
  explanation:
    'Peringkat SAW dihitung dari seluruh mitra dengan nilai lengkap. K-Means berjalan sebagai analitik dan label klaster tidak dipakai untuk menyaring.',
  disclaimer:
    'Hasil ini adalah keluaran perhitungan berdasarkan konfigurasi yang tersimpan, bukan jaminan penerimaan magang.',
}

const readyWithoutKMeans: RecommendationResult = {
  ...readyResult,
  ranking: readyResult.ranking.map((entry) => ({
    ...entry,
    cluster_index: null,
  })),
  kmeans: null,
  explanation:
    'Peringkat SAW dihitung dari seluruh mitra dengan nilai lengkap; analitik K-Means belum dikonfigurasi.',
}

function createAuthValue(role = 'mahasiswa'): AuthContextValue {
  const user: AuthUser = {
    ...mahasiswaUser,
    id: role === 'mahasiswa' ? 7 : 9,
    name: role === 'mahasiswa' ? 'Siti Rahma' : 'Admin Uji',
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
  mockedGetRecommendation.mockReset()
})

afterEach(() => {
  cleanup()
})

describe('RecommendationPage', () => {
  it('menampilkan loading state saat status rekomendasi dimuat', () => {
    mockedGetRecommendation.mockReturnValue(
      new Promise<RecommendationResult>(() => {}),
    )

    renderRoute('/mahasiswa/rekomendasi', createAuthValue())

    expect(screen.getByText('Memuat status rekomendasi...')).toBeTruthy()
  })

  it('menampilkan alasan konfigurasi belum lengkap tanpa ranking', async () => {
    mockedGetRecommendation.mockResolvedValue(notReadyResult)

    renderRoute('/mahasiswa/rekomendasi', createAuthValue())

    expect(
      await screen.findByText('Rekomendasi belum dapat dihitung'),
    ).toBeTruthy()
    expect(
      screen.getByText('Peminatan mahasiswa belum tersimpan di backend.'),
    ).toBeTruthy()
    expect(
      screen.getByText(
        'Jumlah cluster K-Means belum ditetapkan (OD-010). Label cluster tidak dipakai untuk menyaring ranking SAW.',
      ),
    ).toBeTruthy()
    expect(screen.getByText('Analitik')).toBeTruthy()
    expect(screen.getAllByText('Data').length).toBeGreaterThan(0)
    expect(screen.queryByText('Peringkat mitra')).toBeNull()

    const navigation = screen.getByRole('navigation', {
      name: 'Navigasi utama',
    })

    expect(
      within(navigation)
        .getByRole('link', { name: 'Rekomendasi' })
        .getAttribute('href'),
    ).toBe('/mahasiswa/rekomendasi')
  })

  it('menampilkan ranking dan keterangan perhitungan ketika pipeline siap', async () => {
    mockedGetRecommendation.mockResolvedValue(readyResult)

    renderRoute('/mahasiswa/rekomendasi', createAuthValue())

    expect(await screen.findByText('PT Maju')).toBeTruthy()
    expect(screen.getByText('PT Sejahtera')).toBeTruthy()
    expect(screen.getByText('Peringkat mitra')).toBeTruthy()
    expect(screen.getByText('0,9')).toBeTruthy()
    expect(screen.getByText('0,75')).toBeTruthy()
    expect(screen.getAllByText('Cluster generik 0')).toHaveLength(2)
    expect(
      screen.getByText('Keterangan perhitungan', { exact: false }),
    ).toBeTruthy()
    expect(
      screen.getByText(
        'Hasil ini adalah keluaran perhitungan berdasarkan konfigurasi yang tersimpan, bukan jaminan penerimaan magang.',
      ),
    ).toBeTruthy()
    expect(screen.getByText('Kualitas mentor')).toBeTruthy()
    expect(screen.getByText('Jarak lokasi')).toBeTruthy()
  })

  it('tetap menampilkan ranking ketika analitik K-Means belum dikonfigurasi', async () => {
    mockedGetRecommendation.mockResolvedValue(readyWithoutKMeans)

    renderRoute('/mahasiswa/rekomendasi', createAuthValue())

    expect(await screen.findByText('PT Maju')).toBeTruthy()
    expect(screen.getByText('Peringkat mitra')).toBeTruthy()
    expect(
      screen.getAllByText('Tanpa label klaster (analitik tidak tersedia)'),
    ).toHaveLength(2)
    expect(screen.queryByText('Ringkasan perhitungan')).toBeNull()
  })

  it('menampilkan error state dan dapat mencoba ulang', async () => {
    mockedGetRecommendation
      .mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'))
      .mockResolvedValueOnce(notReadyResult)

    renderRoute('/mahasiswa/rekomendasi', createAuthValue())

    expect(await screen.findByText('Rekomendasi gagal dimuat')).toBeTruthy()
    expect(
      screen.getByText(
        'Tidak dapat terhubung ke backend. Periksa koneksi lalu coba lagi.',
      ),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))

    await waitFor(() => {
      expect(screen.getByText('Rekomendasi belum dapat dihitung')).toBeTruthy()
    })
    expect(mockedGetRecommendation).toHaveBeenCalledTimes(2)
  })

  it('menampilkan hasil setelah pemuatan selesai', async () => {
    let resolveRecommendation: (result: RecommendationResult) => void = () => {}

    mockedGetRecommendation.mockReturnValue(
      new Promise<RecommendationResult>((resolve) => {
        resolveRecommendation = resolve
      }),
    )

    renderRoute('/mahasiswa/rekomendasi', createAuthValue())

    expect(screen.getByText('Memuat status rekomendasi...')).toBeTruthy()

    await act(async () => {
      resolveRecommendation(notReadyResult)
    })

    await waitFor(() => {
      expect(screen.getByText('Rekomendasi belum dapat dihitung')).toBeTruthy()
    })
  })

  it('menolak role selain mahasiswa tanpa memuat rekomendasi', () => {
    renderRoute('/mahasiswa/rekomendasi', createAuthValue('admin'))

    expect(
      screen.getByRole('heading', { name: 'Akses ditolak' }),
    ).toBeTruthy()
    expect(
      screen.queryByRole('heading', { name: 'Rekomendasi tempat magang' }),
    ).toBeNull()
    expect(mockedGetRecommendation).not.toHaveBeenCalled()
  })
})
