import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
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
import type { AuthUser } from '../services/auth'
import {
  createCourse,
  deleteCourse,
  listCourses,
  updateCourse,
  type Course,
} from '../services/academic'

vi.mock('../services/academic', () => ({
  listCourses: vi.fn(),
  createCourse: vi.fn(),
  updateCourse: vi.fn(),
  deleteCourse: vi.fn(),
}))

const mockedListCourses = vi.mocked(listCourses)
const mockedCreateCourse = vi.mocked(createCourse)
const mockedUpdateCourse = vi.mocked(updateCourse)
const mockedDeleteCourse = vi.mocked(deleteCourse)

const course: Course = {
  id: 1,
  name: 'Algoritma',
  description: 'Mata kuliah uji.',
  grades_count: 0,
  created_at: '2026-10-21T00:00:00.000000Z',
  updated_at: '2026-10-21T00:00:00.000000Z',
}

function createAuthValue(role: 'admin' | 'prodi'): AuthContextValue {
  const user: AuthUser = {
    id: role === 'admin' ? 1 : 2,
    name: role === 'admin' ? 'Admin Uji' : 'Prodi Uji',
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
  mockedListCourses.mockReset()
  mockedCreateCourse.mockReset()
  mockedUpdateCourse.mockReset()
  mockedDeleteCourse.mockReset()
})

afterEach(() => {
  cleanup()
})

describe('CoursesPage', () => {
  it('menampilkan daftar mata kuliah untuk admin', async () => {
    mockedListCourses.mockResolvedValue([course])

    renderRoute('/mata-kuliah', createAuthValue('admin'))

    expect(
      await screen.findByRole('heading', { name: 'Master mata kuliah' }),
    ).toBeTruthy()
    expect(await screen.findByText('Algoritma')).toBeTruthy()
    expect(screen.getByText('Belum dinilai')).toBeTruthy()
    expect(
      screen.getByText('Aturan prasyarat tidak diatur di sini'),
    ).toBeTruthy()
    expect(screen.queryByText('Lulus')).toBeNull()

    const navigation = screen.getByRole('navigation', {
      name: 'Navigasi utama',
    })

    expect(
      within(navigation)
        .getByRole('link', { name: 'Mata Kuliah' })
        .getAttribute('href'),
    ).toBe('/mata-kuliah')
  })

  it('menampilkan empty state dan dapat menambah mata kuliah', async () => {
    mockedListCourses.mockResolvedValue([])
    mockedCreateCourse.mockResolvedValue(course)

    renderRoute('/mata-kuliah', createAuthValue('admin'))

    expect(await screen.findByText('Belum ada mata kuliah')).toBeTruthy()

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Tambah mata kuliah' })[0],
    )

    const dialog = await screen.findByRole('dialog')

    fireEvent.change(within(dialog).getByLabelText(/Nama mata kuliah/), {
      target: { value: 'Algoritma' },
    })
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Tambah mata kuliah' }),
    )

    await waitFor(() => {
      expect(mockedCreateCourse).toHaveBeenCalledWith({
        name: 'Algoritma',
        description: null,
      })
    })

    expect(
      await screen.findByText('Mata kuliah berhasil ditambahkan.'),
    ).toBeTruthy()
    expect(mockedListCourses).toHaveBeenCalledTimes(2)
  })

  it('menampilkan error state dan dapat mencoba ulang', async () => {
    mockedListCourses
      .mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'))
      .mockResolvedValueOnce([course])

    renderRoute('/mata-kuliah', createAuthValue('prodi'))

    expect(await screen.findByText('Mata kuliah gagal dimuat')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))

    expect(await screen.findByText('Algoritma')).toBeTruthy()
    expect(mockedListCourses).toHaveBeenCalledTimes(2)
  })

  it('menonaktifkan penghapusan ketika mata kuliah memiliki nilai', async () => {
    mockedListCourses.mockResolvedValue([{ ...course, grades_count: 2 }])

    renderRoute('/mata-kuliah', createAuthValue('admin'))

    const deleteButton = await screen.findByRole('button', {
      name: 'Hapus Algoritma',
    })

    expect(deleteButton).toHaveProperty('disabled', true)
    expect(mockedDeleteCourse).not.toHaveBeenCalled()
  })

  it('mengubah mata kuliah melalui dialog', async () => {
    mockedListCourses.mockResolvedValue([course])
    mockedUpdateCourse.mockResolvedValue({
      ...course,
      name: 'Algoritma Lanjut',
    })

    renderRoute('/mata-kuliah', createAuthValue('admin'))

    fireEvent.click(await screen.findByRole('button', { name: 'Ubah Algoritma' }))
    const dialog = await screen.findByRole('dialog')

    fireEvent.change(within(dialog).getByLabelText(/Nama mata kuliah/), {
      target: { value: 'Algoritma Lanjut' },
    })
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Simpan perubahan' }),
    )

    await waitFor(() => {
      expect(mockedUpdateCourse).toHaveBeenCalledWith(1, {
        name: 'Algoritma Lanjut',
        description: 'Mata kuliah uji.',
      })
    })

    expect(
      await screen.findByText('Mata kuliah berhasil diperbarui.'),
    ).toBeTruthy()
  })

  it('menolak role selain admin dan prodi tanpa memuat data', () => {
    const mahasiswa: AuthUser = {
      id: 8,
      name: 'Siti Rahma',
      email: 'mahasiswa@example.test',
      role: 'mahasiswa',
    }

    renderRoute('/mata-kuliah', {
      ...createAuthValue('admin'),
      user: mahasiswa,
    })

    expect(
      screen.getByRole('heading', { name: 'Akses ditolak' }),
    ).toBeTruthy()
    expect(mockedListCourses).not.toHaveBeenCalled()
  })
})
