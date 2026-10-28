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
  resetPassword,
  type PasswordResetResponse,
} from '../services/auth'
import ResetPasswordPage from './ResetPasswordPage'

vi.mock('../services/auth', () => ({
  resetPassword: vi.fn(),
}))

const mockedResetPassword = vi.mocked(resetPassword)

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

function renderResetPassword(token = 'reset-token-123') {
  return render(
    <AuthContext.Provider value={createAuthValue()}>
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/reset-password',
            search: `?token=${token}`,
          },
        ]}
      >
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/login" element={<p>Halaman masuk</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

beforeEach(() => {
  mockedResetPassword.mockReset()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ResetPasswordPage', () => {
  it('menampilkan formulir reset password dengan token', () => {
    renderResetPassword()

    expect(
      screen.getByRole('heading', { name: 'Masukkan password baru' }),
    ).toBeTruthy()
    expect(screen.getByLabelText('Email')).toBeTruthy()
    expect(screen.getByLabelText('Password baru')).toBeTruthy()
    expect(
      screen.getByLabelText('Konfirmasi password baru'),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ubah password' })).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'halaman masuk' }),
    ).toBeTruthy()
  })

  it('menampilkan error saat tidak ada token', () => {
    renderResetPassword('')

    expect(
      screen.getByRole('heading', { name: 'Token tidak valid' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Kirim tautan reset ulang' }),
    ).toBeTruthy()
  })

  it('mengirim reset password berhasil dan menampilkan pesan sukses', async () => {
    const response: PasswordResetResponse = {
      success: true,
      message: 'Password berhasil diubah. Silakan masuk kembali.',
    }
    mockedResetPassword.mockResolvedValue(response)

    renderResetPassword()

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'mahasiswa@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Password baru'), {
      target: { value: 'PasswordBaru123!' },
    })
    fireEvent.change(screen.getByLabelText('Konfirmasi password baru'), {
      target: { value: 'PasswordBaru123!' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Ubah password' }))

    await waitFor(() => {
      expect(mockedResetPassword).toHaveBeenCalledWith({
        email: 'mahasiswa@example.test',
        token: 'reset-token-123',
        password: 'PasswordBaru123!',
        password_confirmation: 'PasswordBaru123!',
      })
    })

    expect(
      await screen.findByText('Password berhasil diubah. Silakan masuk kembali.'),
    ).toBeTruthy()
  })

  it('menolak konfirmasi password yang tidak cocok', async () => {
    renderResetPassword()

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'mahasiswa@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Password baru'), {
      target: { value: 'PasswordBaru123!' },
    })
    fireEvent.change(screen.getByLabelText('Konfirmasi password baru'), {
      target: { value: 'PasswordLain!' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Ubah password' }))

    expect(mockedResetPassword).not.toHaveBeenCalled()
    expect(await screen.findByText('Periksa kembali data yang diisi.')).toBeTruthy()
  })

  it('menampilkan loading state saat permintaan berlangsung', async () => {
    mockedResetPassword.mockImplementation(() => new Promise(() => {}))

    renderResetPassword()

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'mahasiswa@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Password baru'), {
      target: { value: 'PasswordBaru123!' },
    })
    fireEvent.change(screen.getByLabelText('Konfirmasi password baru'), {
      target: { value: 'PasswordBaru123!' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Ubah password' }))

    expect(screen.getByRole('button', { name: 'Mengubah…' })).toBeTruthy()

    mockedResetPassword.mockResolvedValue({
      success: true,
      message: 'Password berhasil diubah. Silakan masuk kembali.',
    })
  })

  it('menampilkan error state saat jaringan gagal', async () => {
    const error = new Error('Network Error') as Error & {
      response?: { status?: number }
    }
    error.response = { status: undefined }
    mockedResetPassword.mockRejectedValue(error)

    renderResetPassword()

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'mahasiswa@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Password baru'), {
      target: { value: 'PasswordBaru123!' },
    })
    fireEvent.change(screen.getByLabelText('Konfirmasi password baru'), {
      target: { value: 'PasswordBaru123!' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Ubah password' }))

    expect(
      await screen.findByText(
        'Tidak dapat terhubung ke backend. Pastikan Laravel berjalan.',
      ),
    ).toBeTruthy()
  })

  it('menampilkan error validasi per field dari backend', async () => {
    const axiosError = new Error('Validation Error') as Error & {
      response?: { status?: number; data?: { errors?: Record<string, string[]> } }
    }
    axiosError.response = {
      status: 422,
      data: {
        errors: {
          token: ['Token reset tidak valid atau telah kedaluwarsa.'],
        },
      },
    }
    mockedResetPassword.mockRejectedValue(axiosError)

    renderResetPassword()

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'mahasiswa@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Password baru'), {
      target: { value: 'PasswordBaru123!' },
    })
    fireEvent.change(screen.getByLabelText('Konfirmasi password baru'), {
      target: { value: 'PasswordBaru123!' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Ubah password' }))

    expect(await screen.findByText('Periksa kembali data yang diisi.')).toBeTruthy()
  })

  it('tidak memanggil logout setelah reset password', async () => {
    const logout = vi.fn()
    const authValue = createAuthValue()
    authValue.logout = logout

    mockedResetPassword.mockResolvedValue({
      success: true,
      message: 'Password berhasil diubah. Silakan masuk kembali.',
    })

    render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter
          initialEntries={[
            { pathname: '/reset-password', search: '?token=reset-token-123' },
          ]}
        >
          <Routes>
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'mahasiswa@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Password baru'), {
      target: { value: 'PasswordBaru123!' },
    })
    fireEvent.change(screen.getByLabelText('Konfirmasi password baru'), {
      target: { value: 'PasswordBaru123!' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Ubah password' }))

    await waitFor(() => {
      expect(mockedResetPassword).toHaveBeenCalled()
    })

    expect(logout).not.toHaveBeenCalled()
  })
})
