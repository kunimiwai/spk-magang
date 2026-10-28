import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext, type AuthContextValue } from '../auth/AuthContext'
import type { AuthUser } from '../services/auth'
import LoginPage from './LoginPage'

const adminUser: AuthUser = {
  id: 1,
  name: 'Admin Uji',
  email: 'admin@example.test',
  role: 'admin',
}

const studentUser: AuthUser = {
  id: 2,
  name: 'Mahasiswa Uji',
  email: 'mahasiswa@example.test',
  role: 'mahasiswa',
}

function createAuthValue(
  user: AuthUser | null,
): AuthContextValue {
  return {
    user,
    isAuthenticated: Boolean(user),
    isLoading: false,
    sessionError: null,
    login: async () => user ?? adminUser,
    logout: async () => {},
    refreshUser: async () => user,
  }
}

function renderLogin(
  user: AuthUser,
  from: { pathname: string },
) {
  render(
    <AuthContext.Provider value={createAuthValue(user)}>
      <MemoryRouter initialEntries={[{ pathname: '/login', state: { from } }]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<p>Beranda bersama</p>} />
          <Route
            path="/mahasiswa/pengajuan"
            element={<p>Halaman pengajuan mahasiswa</p>}
          />
          <Route path="/admin/pengajuan" element={<p>Halaman pengajuan admin</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('LoginPage role-aware redirect', () => {
  it('ignores a stored student route when an admin is authenticated', async () => {
    renderLogin(adminUser, { pathname: '/mahasiswa/pengajuan' })

    expect(await screen.findByText('Beranda bersama')).toBeTruthy()
    expect(screen.queryByText('Halaman pengajuan mahasiswa')).toBeNull()
  })

  it('preserves a stored route that the authenticated role may open', async () => {
    renderLogin(adminUser, { pathname: '/admin/pengajuan' })

    expect(await screen.findByText('Halaman pengajuan admin')).toBeTruthy()
    expect(screen.queryByText('Beranda bersama')).toBeNull()
  })

  it('preserves the student deep link for a student account', async () => {
    renderLogin(studentUser, { pathname: '/mahasiswa/pengajuan' })

    expect(await screen.findByText('Halaman pengajuan mahasiswa')).toBeTruthy()
  })
})
