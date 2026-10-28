import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AxiosError } from 'axios'
import { AuthContext, type AuthContextValue } from '../auth/AuthContext'
import { AppRoutes } from '../App'
import type { AuthUser } from '../services/auth'
import {
  getStudentGrades,
  saveStudentGrades,
  type StudentGradeSheet,
} from '../services/academic'
import StudentGradesPage from './StudentGradesPage'

vi.mock('../services/academic', () => ({
  getStudentGrades: vi.fn(),
  saveStudentGrades: vi.fn(),
}))

const mockedGetStudentGrades = vi.mocked(getStudentGrades)
const mockedSaveStudentGrades = vi.mocked(saveStudentGrades)

const mahasiswaUser: AuthUser = {
  id: 7,
  name: 'Siti Rahma',
  email: 'siti.rahma@example.test',
  role: 'mahasiswa',
}

const emptySheet: StudentGradeSheet = {
  courses: [],
  prerequisiteEvaluation: {
    status: 'not_configured',
    message:
      'Aturan mata kuliah prasyarat dan ambang kelulusan belum dikonfigurasi (OD-007/OD-008).',
  },
  scoreBounds: { min: 0, max: 100 },
}

const gradeSheet: StudentGradeSheet = {
  ...emptySheet,
  courses: [
    {
      id: 1,
      name: 'Algoritma',
      description: 'Mata kuliah uji.',
      score: null,
      gradeUpdatedAt: null,
    },
    {
      id: 2,
      name: 'Basis Data',
      description: null,
      score: 0,
      gradeUpdatedAt: '2026-10-21T00:00:00.000000Z',
    },
  ],
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

function renderPage(auth: AuthContextValue = createAuthValue()) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={['/mahasiswa/nilai']}>
        <StudentGradesPage />
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
  mockedGetStudentGrades.mockReset()
  mockedSaveStudentGrades.mockReset()
})

afterEach(() => {
  cleanup()
})

describe('StudentGradesPage', () => {
  it('menampilkan loading state saat nilai dimuat', () => {
    mockedGetStudentGrades.mockReturnValue(
      new Promise<StudentGradeSheet>(() => {}),
    )

    renderPage()

    expect(screen.getByText('Memuat nilai akademik...')).toBeTruthy()
  })

  it('menampilkan empty state ketika master mata kuliah kosong', async () => {
    mockedGetStudentGrades.mockResolvedValue(emptySheet)

    renderPage()

    expect(await screen.findByText('Belum ada mata kuliah')).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: 'Simpan nilai' }),
    ).toBeNull()
  })

  it('menampilkan status aturan prasyarat yang belum dikonfigurasi', async () => {
    mockedGetStudentGrades.mockResolvedValue(emptySheet)

    renderPage()

    expect(
      await screen.findByText('Aturan prasyarat belum dikonfigurasi'),
    ).toBeTruthy()
    expect(
      screen.getByText(
        /Aturan mata kuliah prasyarat dan ambang kelulusan belum dikonfigurasi \(OD-007\/OD-008\)\./,
      ),
    ).toBeTruthy()
    expect(
      screen.getByText(/aplikasi belum dapat menyatakan/i),
    ).toBeTruthy()
    expect(screen.queryByText('Lulus')).toBeNull()
    expect(screen.queryByText('Tidak Lulus')).toBeNull()
  })

  it('menampilkan nilai tersimpan tanpa mengubah nilai nol', async () => {
    mockedGetStudentGrades.mockResolvedValue(gradeSheet)

    renderPage()

    expect(await screen.findByText('Algoritma')).toBeTruthy()
    expect(screen.getByText('Basis Data')).toBeTruthy()
    expect(screen.getAllByLabelText('Nilai')[0]).toHaveProperty('value', '')
    expect(
      screen.getByText('Belum ada nilai tersimpan.'),
    ).toBeTruthy()
    expect(
      screen.getByText('Nilai tersimpan. Ubah atau kosongkan.'),
    ).toBeTruthy()
  })

  it('menyimpan semua nilai, termasuk nilai nol dan nilai kosong sebagai null', async () => {
    mockedGetStudentGrades.mockResolvedValue(gradeSheet)
    mockedSaveStudentGrades.mockResolvedValue({
      ...gradeSheet,
      courses: [
        { ...gradeSheet.courses[0], score: 80 },
        gradeSheet.courses[1],
      ],
    })

    renderPage()

    const inputs = await screen.findAllByLabelText('Nilai')
    fireEvent.change(inputs[0], { target: { value: '80' } })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan nilai' }))

    await waitFor(() => {
      expect(mockedSaveStudentGrades).toHaveBeenCalledWith([
        { course_id: 1, score: 80 },
        { course_id: 2, score: 0 },
      ])
    })

    expect(
      await screen.findByText('Nilai akademik berhasil disimpan.'),
    ).toBeTruthy()
    expect(screen.getAllByLabelText('Nilai')[0]).toHaveProperty('value', '80')
  })

  it('menolak nilai tidak valid sebelum memanggil API', async () => {
    mockedGetStudentGrades.mockResolvedValue(gradeSheet)

    renderPage()

    const inputs = await screen.findAllByLabelText('Nilai')
    fireEvent.change(inputs[0], { target: { value: '101' } })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan nilai' }))

    expect(
      await screen.findByText('Nilai melebihi batas penyimpanan.'),
    ).toBeTruthy()
    expect(mockedSaveStudentGrades).not.toHaveBeenCalled()
  })

  it('menampilkan error jaringan saat penyimpanan gagal', async () => {
    mockedGetStudentGrades.mockResolvedValue(gradeSheet)
    mockedSaveStudentGrades.mockRejectedValue(
      new AxiosError('Network Error', 'ERR_NETWORK'),
    )

    renderPage()

    await screen.findAllByLabelText('Nilai')
    fireEvent.click(screen.getByRole('button', { name: 'Simpan nilai' }))

    expect(
      await screen.findByText('Tidak dapat terhubung ke backend. Periksa koneksi lalu coba lagi.'),
    ).toBeTruthy()
    expect(
      screen.getByText('Nilai belum dapat disimpan'),
    ).toBeTruthy()
    expect(
      screen.queryByText('Nilai akademik berhasil disimpan.'),
    ).toBeNull()
  })

  it('dapat memuat ulang setelah gagal memuat data', async () => {
    mockedGetStudentGrades
      .mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'))
      .mockResolvedValueOnce(emptySheet)

    renderPage()

    expect(await screen.findByText('Nilai akademik gagal dimuat')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))

    expect(await screen.findByText('Belum ada mata kuliah')).toBeTruthy()
    expect(mockedGetStudentGrades).toHaveBeenCalledTimes(2)
  })

  it('menolak role selain mahasiswa tanpa memuat nilai', () => {
    renderRoute(
      '/mahasiswa/nilai',
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
    expect(mockedGetStudentGrades).not.toHaveBeenCalled()
  })
})
