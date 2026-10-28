import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AxiosError } from 'axios'
import { AuthContext, type AuthContextValue } from '../auth/AuthContext'
import { AppRoutes } from '../App'
import type { AuthUser } from '../services/auth'
import {
  listStudentPartners,
  type ApplicationPartner,
} from '../services/applications'

vi.mock('../services/applications', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../services/applications')>()

  return {
    ...actual,
    listStudentPartners: vi.fn(),
  }
})

const mockedListPartners = vi.mocked(listStudentPartners)

const student: AuthUser = {
  id: 7,
  name: 'Siti Rahma',
  email: 'siti.rahma@example.test',
  role: 'mahasiswa',
}

const partner: ApplicationPartner = {
  id: 3,
  name: 'PT Maju',
  address: 'Jl. Contoh 1',
  contact: '08123456789',
  email: 'mitra@example.test',
  description: 'Mitra magang bidang perangkat lunak.',
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
  mockedListPartners.mockReset()
})

afterEach(() => {
  cleanup()
})

describe('StudentPartnersPage', () => {
  it('menampilkan loading state saat katalog dimuat', () => {
    mockedListPartners.mockReturnValue(
      new Promise<ApplicationPartner[]>(() => {}),
    )

    renderRoute('/mahasiswa/mitra')

    expect(screen.getByText('Memuat mitra magang...')).toBeTruthy()
  })

  it('menampilkan detail mitra dan tautan pengajuan dengan mitra terpilih', async () => {
    mockedListPartners.mockResolvedValue([partner])

    renderRoute('/mahasiswa/mitra')

    expect(await screen.findByRole('heading', { name: 'PT Maju' })).toBeTruthy()
    expect(
      screen.getByText('Mitra magang bidang perangkat lunak.'),
    ).toBeTruthy()
    expect(screen.getByText('mitra@example.test')).toBeTruthy()
    expect(screen.getByText('08123456789')).toBeTruthy()
    expect(screen.getByText('Jl. Contoh 1')).toBeTruthy()

    const applyLink = screen.getByRole('link', { name: /Ajukan magang/ })
    expect(applyLink.getAttribute('href')).toBe(
      '/mahasiswa/pengajuan?partner=3',
    )
  })

  it('menampilkan empty state ketika belum ada mitra', async () => {
    mockedListPartners.mockResolvedValue([])

    renderRoute('/mahasiswa/mitra')

    expect(await screen.findByText('Belum ada mitra magang')).toBeTruthy()
  })

  it('menampilkan error dan dapat memuat ulang katalog', async () => {
    mockedListPartners
      .mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'))
      .mockResolvedValueOnce([partner])

    renderRoute('/mahasiswa/mitra')

    expect(
      await screen.findByText('Daftar mitra gagal dimuat'),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))

    expect(await screen.findByRole('heading', { name: 'PT Maju' })).toBeTruthy()
    expect(mockedListPartners).toHaveBeenCalledTimes(2)
  })

  it('menolak role selain mahasiswa tanpa memuat katalog', () => {
    renderRoute(
      '/mahasiswa/mitra',
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
    expect(mockedListPartners).not.toHaveBeenCalled()
  })
})
