import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext, type AuthContextValue } from '../auth/AuthContext'
import type { AuthUser } from '../services/auth'
import {
  forgotPassword,
  type PasswordResetResponse,
} from '../services/auth'
import ForgotPasswordPage from './ForgotPasswordPage'

vi.mock('../services/auth', () => ({
  forgotPassword: vi.fn(),
}))

const mockedForgotPassword = vi.mocked(forgotPassword)

function createAuthValue(): AuthContextValue {
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    sessionError: null,
    login: async () => {
      throw new Error('not used')
    },
    logout: async () => {},
    refreshUser: async () => null,
  }
}

function renderForgotPassword() {
  return render(
    <AuthContext.Provider value={createAuthValue()}>
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route
            path="/forgot-password"
            element={<ForgotPasswordPage />}
          />
          <Route path="/login" element={<p>Halaman masuk</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

beforeEach(() => {
  mockedForgotPassword.mockReset()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ForgotPasswordPage', () => {
  it('menampilkan formulir input email', () => {
    renderForgotPassword()

    expect(
      screen.getByRole('heading', { name: 'Masukkan email Anda' }),
    ).toBeTruthy()
    expect(screen.getByLabelText('Email')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Kirim tautan reset' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Kembali ke halaman masuk' }),
    ).toBeTruthy()
  })

  it('melakukan navigasi ke halaman masuk dari tautan', () => {
    renderForgotPassword()

    fireEvent.click(screen.getByRole('link', { name: 'Kembali ke halaman masuk' }))

    expect(screen.getByText('Halaman masuk')).toBeTruthy()
  })

  it('menampilkan validasi saat email dikosongkan', async () => {
    renderForgotPassword()

    fireEvent.click(screen.getByRole('button', { name: 'Kirim tautan reset' }))

    expect(await screen.findByText('Email wajib diisi.')).toBeTruthy()
  })

  it('mengirim permintaan reset password berhasil', async () => {
    const response: PasswordResetResponse = {
      success: true,
      message: 'Jika email terdaftar, tautan reset password telah dikirim.',
    }
    mockedForgotPassword.mockResolvedValue(response)

    renderForgotPassword()

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'mahasiswa@example.test' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Kirim tautan reset' }))

    await waitFor(() => {
      expect(mockedForgotPassword).toHaveBeenCalledWith({
        email: 'mahasiswa@example.test',
      })
    })

    expect(
      await screen.findByText(
        'Jika email Anda terdaftar di sistem, tautan reset password telah dikirim ke inbox email Anda.',
      ),
    ).toBeTruthy()
  })

  it('menampilkan loading state saat permintaan berlangsung', async () => {
    mockedForgotPassword.mockImplementation(() =>
      new Promise(() => {}),
    )

    renderForgotPassword()

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'mahasiswa@example.test' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Kirim tautan reset' }))

    expect(
      screen.getByRole('button', { name: 'Mengirim…' }),
    ).toBeTruthy()

    mockedForgotPassword.mockResolvedValue({
      success: true,
      message: 'Jika email terdaftar, tautan reset password telah dikirim.',
    })
  })

  it('menampilkan error state saat jaringan gagal', async () => {
    const error = new Error('Network Error') as Error & {
      response?: { status?: number }
    }
    error.response = { status: undefined }
    mockedForgotPassword.mockRejectedValue(error)

    renderForgotPassword()

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'mahasiswa@example.test' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Kirim tautan reset' }))

    expect(
      await screen.findByText(
        'Tidak dapat terhubung ke backend. Pastikan Laravel berjalan.',
      ),
    ).toBeTruthy()
  })

  it('menampilkan error rate limiting', async () => {
    const axiosError = new Error('Too Many Requests') as Error & {
      response?: { status?: number }
    }
    axiosError.response = { status: 429 }
    mockedForgotPassword.mockRejectedValue(axiosError)

    renderForgotPassword()

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'mahasiswa@example.test' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Kirim tautan reset' }))

    expect(
      await screen.findByText('Terlalu banyak permintaan reset. Coba lagi nanti.'),
    ).toBeTruthy()
  })
})
