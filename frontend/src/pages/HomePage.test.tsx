import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext, type AuthContextValue } from '../auth/AuthContext'
import type { AuthUser } from '../services/auth'
import HomePage from './HomePage'

const baseUser: AuthUser = {
  id: 1,
  name: 'Pengguna Uji',
  email: 'pengguna@example.test',
  role: 'admin',
}

function createAuthValue(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    user: baseUser,
    isAuthenticated: true,
    isLoading: false,
    sessionError: null,
    login: async () => baseUser,
    logout: async () => {},
    refreshUser: async () => baseUser,
    ...overrides,
  }
}

function renderHome(auth: AuthContextValue) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<p>Dashboard admin tujuan</p>} />
          <Route
            path="/mahasiswa/dashboard"
            element={<p>Dashboard mahasiswa tujuan</p>}
          />
          <Route path="/dpm" element={<p>Dashboard DPM tujuan</p>} />
          <Route path="/profil" element={<p>Profil tujuan</p>} />
          <Route path="/login" element={<p>Login tujuan</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

afterEach(() => {
  cleanup()
})

describe('HomePage', () => {
  it.each([
    ['admin', 'Dashboard admin tujuan'],
    ['prodi', 'Dashboard admin tujuan'],
    ['mahasiswa', 'Dashboard mahasiswa tujuan'],
    ['dpm', 'Dashboard DPM tujuan'],
  ])('mengarahkan role %s ke dashboard yang sesuai', (role, expected) => {
    renderHome(
      createAuthValue({
        user: { ...baseUser, role },
      }),
    )

    expect(screen.getByText(expected)).toBeTruthy()
  })

  it('mengarahkan role tidak dikenal ke profil alih-alih dashboard role lain', () => {
    renderHome(
      createAuthValue({
        user: { ...baseUser, role: 'koordinator' },
      }),
    )

    expect(screen.getByText('Profil tujuan')).toBeTruthy()
  })

  it('menampilkan status pemeriksaan sesi selama autentikasi dimuat', () => {
    renderHome(
      createAuthValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
      }),
    )

    expect(screen.getByText('Memeriksa sesi pengguna…')).toBeTruthy()
  })

  it('mengarahkan pengguna tanpa sesi ke halaman login', () => {
    renderHome(
      createAuthValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      }),
    )

    expect(screen.getByText('Login tujuan')).toBeTruthy()
  })
})
