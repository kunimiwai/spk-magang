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
import { AuthContext, type AuthContextValue } from '../auth/AuthContext'
import { AppRoutes } from '../App'
import type { StudentProfile } from '../lib/peminatan'
import type { AuthUser } from '../services/auth'
import {
  listStudentApplications,
  type InternshipApplication,
} from '../services/applications'
import {
  getStudentProfile,
  updateStudentProfile,
} from '../services/mahasiswa'
import StudentDashboardPage from './StudentDashboardPage'

vi.mock('../services/mahasiswa', () => ({
  getPeminatanReference: vi.fn(),
  getStudentProfile: vi.fn(),
  updateStudentProfile: vi.fn(),
}))

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
  getAcceptanceLetterLimit: vi.fn().mockResolvedValue({
    maxSizeKb: 5120,
    maxSizeBytes: 5242880,
    configuredMaxSizeKb: 5120,
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    replaceable: false,
  }),
  downloadStudentAcceptanceLetter: vi.fn(),
  downloadAdminAcceptanceLetter: vi.fn(),
  listDpmOptions: vi.fn(),
  assignDpm: vi.fn(),
  listDpmApplications: vi.fn(),
  getDpmApplication: vi.fn(),
}))

const mockedGetStudentProfile = vi.mocked(getStudentProfile)
const mockedListStudentApplications = vi.mocked(listStudentApplications)

const mahasiswaUser: AuthUser = {
  id: 7,
  name: 'Siti Rahma',
  email: 'siti.rahma@example.test',
  role: 'mahasiswa',
}

const savedProfile: StudentProfile = {
  peminatan: ['DTA'],
  options: ['DTA', 'PSI', 'SIA'],
  selectionMode: 'single',
  selectionAvailable: true,
  profileComplete: true,
  note: 'Pilihan peminatan disimpan sebagai satu pilihan.',
}

const incompleteProfile: StudentProfile = {
  peminatan: [],
  options: ['DTA', 'PSI', 'SIA'],
  selectionMode: null,
  selectionAvailable: false,
  profileComplete: false,
  note: 'Penyimpanan peminatan belum diaktifkan (OD-015).',
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
    description: 'Mitra magang.',
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

const rejectedApplication: InternshipApplication = {
  ...acceptedApplication,
  status: 'ditolak',
  reviewNote: 'Ditolak setelah seleksi mitra.',
  acceptanceLetter: null,
  dpmPlacement: null,
}

function createAuthValue(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    user: mahasiswaUser,
    isAuthenticated: true,
    isLoading: false,
    sessionError: null,
    login: async () => mahasiswaUser,
    logout: async () => {},
    refreshUser: async () => mahasiswaUser,
    ...overrides,
  }
}

function renderDashboard(auth: AuthContextValue = createAuthValue()) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={['/mahasiswa/dashboard']}>
        <StudentDashboardPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

function renderGuardedDashboard(auth: AuthContextValue) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={['/mahasiswa/dashboard']}>
        <AppRoutes />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
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
  mockedGetStudentProfile.mockReset()
  vi.mocked(updateStudentProfile).mockReset()
  mockedListStudentApplications.mockReset()
  mockedListStudentApplications.mockResolvedValue([])
})

afterEach(() => {
  cleanup()
})

describe('StudentDashboardPage', () => {
  it('menampilkan sapaan, identitas, peminatan tersimpan, dan tautan', async () => {
    mockedGetStudentProfile.mockResolvedValue(savedProfile)

    renderRoute('/mahasiswa/dashboard', createAuthValue())

    expect(
      screen.getByRole('heading', {
        name: 'Selamat datang, Siti Rahma',
      }),
    ).toBeTruthy()
    expect(screen.getByText('siti.rahma@example.test')).toBeTruthy()
    expect(await screen.findByText('DTA')).toBeTruthy()
    expect(screen.getByText('Tersimpan')).toBeTruthy()
    expect(
      screen.getByRole('heading', { name: 'Pengajuan magang' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('link', { name: /Buka pengajuan magang/ }),
    ).toBeTruthy()

    const navigation = screen.getByRole('navigation', {
      name: 'Navigasi utama',
    })

    expect(
      within(navigation)
        .getByRole('link', { name: 'Dashboard' })
        .getAttribute('href'),
    ).toBe('/mahasiswa/dashboard')
    expect(
      within(navigation)
        .getByRole('link', { name: 'Rekomendasi' })
        .getAttribute('href'),
    ).toBe('/mahasiswa/rekomendasi')
    expect(
      within(navigation)
        .getByRole('link', { name: 'Data Mahasiswa' })
        .getAttribute('href'),
    ).toBe('/mahasiswa')
    expect(
      within(navigation)
        .getByRole('link', { name: 'Nilai Akademik' })
        .getAttribute('href'),
    ).toBe('/mahasiswa/nilai')
    expect(
      screen
        .getByRole('link', { name: 'Ubah peminatan' })
        .getAttribute('href'),
    ).toBe('/mahasiswa')
    expect(
      screen
        .getByRole('link', { name: 'Buka Data Mahasiswa' })
        .getAttribute('href'),
    ).toBe('/mahasiswa')
    expect(
      screen
        .getByRole('link', { name: 'Buka rekomendasi' })
        .getAttribute('href'),
    ).toBe('/mahasiswa/rekomendasi')
    expect(
      screen
        .getByRole('link', { name: 'Buka nilai akademik' })
        .getAttribute('href'),
    ).toBe('/mahasiswa/nilai')
  })

  it('menampilkan loading state saat profil peminatan dimuat', async () => {
    let resolveProfile: (profile: StudentProfile) => void = () => {}

    mockedGetStudentProfile.mockReturnValue(
      new Promise<StudentProfile>((resolve) => {
        resolveProfile = resolve
      }),
    )

    renderDashboard()

    expect(screen.getByText('Memuat profil peminatan...')).toBeTruthy()

    await act(async () => {
      resolveProfile(savedProfile)
    })

    await waitFor(() => {
      expect(screen.getByText('DTA')).toBeTruthy()
    })
  })

  it('menampilkan error jaringan tanpa mengakhiri sesi pengguna', async () => {
    const logout = vi.fn(async () => {})
    mockedGetStudentProfile.mockRejectedValue(
      new AxiosError('Network Error', 'ERR_NETWORK'),
    )

    renderDashboard(createAuthValue({ logout }))

    expect(
      await screen.findByText(
        'Tidak dapat terhubung ke backend. Periksa koneksi lalu coba lagi.',
      ),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeTruthy()
    expect(
      screen.getByRole('heading', {
        name: 'Selamat datang, Siti Rahma',
      }),
    ).toBeTruthy()
    expect(logout).not.toHaveBeenCalled()
  })

  it('menampilkan empty state ketika referensi peminatan kosong', async () => {
    mockedGetStudentProfile.mockResolvedValue({
      ...incompleteProfile,
      options: [],
      note: 'Tidak ada referensi.',
    })

    renderDashboard()

    expect(await screen.findByText('Referensi peminatan kosong')).toBeTruthy()
    expect(screen.getByText('Status awal pengajuan')).toBeTruthy()
    expect(
      screen.getByText('Rekomendasi mengikuti konfigurasi'),
    ).toBeTruthy()
  })

  it('menampilkan empty state profil ketika peminatan belum tersimpan', async () => {
    mockedGetStudentProfile.mockResolvedValue(incompleteProfile)

    renderDashboard()

    expect(await screen.findByText('Peminatan belum dipilih')).toBeTruthy()
    expect(screen.getByText('Penyimpanan peminatan belum diaktifkan (OD-015).')).toBeTruthy()
    expect(
      screen.queryByRole('link', { name: 'Pilih peminatan' }),
    ).toBeNull()
  })

  it('menyediakan tautan pemilihan ketika penyimpanan peminatan aktif', async () => {
    mockedGetStudentProfile.mockResolvedValue({
      ...savedProfile,
      peminatan: [],
      profileComplete: false,
    })

    renderDashboard()

    expect(await screen.findByText('Peminatan belum dipilih')).toBeTruthy()

    const link = screen.getByRole('link', { name: 'Pilih peminatan' })
    expect(link.getAttribute('href')).toBe('/mahasiswa')
  })

  it('tetap menyediakan halaman Data Mahasiswa pada rute yang terpisah', async () => {
    mockedGetStudentProfile.mockResolvedValue(savedProfile)

    renderRoute('/mahasiswa', createAuthValue())

    expect(
      await screen.findByRole('heading', {
        name: 'Data mahasiswa & peminatan',
      }),
    ).toBeTruthy()
    expect(
      screen.queryByRole('heading', { name: /selamat datang/i }),
    ).toBeNull()
  })

  it('menolak role selain mahasiswa tanpa memuat profil peminatan', async () => {
    mockedGetStudentProfile.mockResolvedValue(savedProfile)

    renderGuardedDashboard(
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
    expect(
      screen.queryByRole('heading', { name: /selamat datang/i }),
    ).toBeNull()
    expect(mockedGetStudentProfile).not.toHaveBeenCalled()
  })

  it('menampilkan loading state pengajuan magang', async () => {
    mockedGetStudentProfile.mockResolvedValue(savedProfile)
    mockedListStudentApplications.mockReturnValue(
      new Promise<InternshipApplication[]>(() => {}),
    )

    renderDashboard()

    expect(
      screen.getByText('Memuat pengajuan magang...'),
    ).toBeTruthy()
  })

  it('menampilkan empty state ketika belum ada pengajuan', async () => {
    mockedGetStudentProfile.mockResolvedValue(savedProfile)

    renderDashboard()

    expect(await screen.findByText('Belum ada pengajuan')).toBeTruthy()
  })

  it('menampilkan error dan dapat memuat ulang pengajuan', async () => {
    mockedGetStudentProfile.mockResolvedValue(savedProfile)
    mockedListStudentApplications
      .mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'))
      .mockResolvedValueOnce([acceptedApplication])

    renderDashboard()

    expect(
      await screen.findByText('Pengajuan gagal dimuat'),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))

    expect(await screen.findByText('PT Maju')).toBeTruthy()
    expect(mockedListStudentApplications).toHaveBeenCalledTimes(2)
  })

  it('menampilkan status penerimaan, surat, dan DPM terbaru', async () => {
    mockedGetStudentProfile.mockResolvedValue(savedProfile)
    mockedListStudentApplications.mockResolvedValue([acceptedApplication])

    renderDashboard()

    expect(await screen.findByText('PT Maju')).toBeTruthy()
    expect(screen.getAllByText('Diterima').length).toBeGreaterThan(0)
    expect(screen.getByText('surat-penerimaan.pdf')).toBeTruthy()
    expect(screen.getByText('Dr. Dosen Pembimbing')).toBeTruthy()
    expect(screen.getByText('dosen@example.test')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: /Buka pengajuan magang/ }),
    ).toBeTruthy()
  })

  it('mengarahkan pengajuan ditolak ke rekomendasi alternatif tanpa menyebut pengajuan ada di sana', async () => {
    mockedGetStudentProfile.mockResolvedValue(savedProfile)
    mockedListStudentApplications.mockResolvedValue([rejectedApplication])

    renderDashboard()

    expect(
      await screen.findByText(
        /Lihat rekomendasi alternatif, lalu buat pengajuan baru dari halaman Pengajuan Magang/,
      ),
    ).toBeTruthy()
    expect(
      screen.queryByText(/Lihat pengajuan lain pada halaman rekomendasi/),
    ).toBeNull()
  })
})
