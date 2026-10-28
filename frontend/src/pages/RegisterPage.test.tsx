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
  register,
  type RegisterResponse,
} from '../services/auth'
import RegisterPage from './RegisterPage'

vi.mock('../services/auth', () => ({
  register: vi.fn(),
}))

const mockedRegister = vi.mocked(register)

const studentUser: AuthUser = {
  id: 1,
  name: 'Mahasiswa Uji',
  email: 'mahasiswa@example.test',
  role: 'mahasiswa',
}

function createAuthValue(): AuthContextValue {
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    sessionError: null,
    login: async () => studentUser,
    logout: async () => {},
    refreshUser: async () => null,
  }
}

function renderRegister() {
  return render(
    <AuthContext.Provider value={createAuthValue()}>
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<p>Halaman masuk</p>} />
          <Route path="/" element={<p>Beranda</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

beforeEach(() => {
  mockedRegister.mockReset()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('RegisterPage', () => {
  it('menampilkan formulir pendaftaran mahasiswa', () => {
    renderRegister()

    expect(
      screen.getByRole('heading', { name: 'Daftar sebagai mahasiswa' }),
    ).toBeTruthy()
    expect(screen.getByRole('textbox', { name: /^nama lengkap$/i })).toBeTruthy()
    expect(screen.getByRole('textbox', { name: /^email$/i })).toBeTruthy()
    expect(screen.getByRole('textbox', { name: /^password$/i })).toBeTruthy()
    expect(
      screen.getByRole('textbox', { name: /konfirmasi password/i }),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Daftar' })).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Masuk' }),
    ).toBeTruthy()
  })

  it('melakukan navigasi ke halaman masuk dari tautan', () => {
    renderRegister()

    fireEvent.click(screen.getByRole('link', { name: 'Masuk' }))

    expect(
      screen.getByRole('heading', { name: 'Halaman masuk' }),
    ).toBeTruthy()
  })

  it('menampilkan validasi saat form dikosongkan', async () => {
    renderRegister()

    fireEvent.click(screen.getByRole('button', { name: 'Daftar' }))

    expect(await screen.findByText('Nama lengkap wajib diisi.')).toBeTruthy()
    expect(await screen.findByText('Email wajib diisi.')).toBeTruthy()
    expect(await screen.findByText('Password wajib diisi.')).toBeTruthy()
  })

  it('menolak konfirmasi password yang tidak cocok', async () => {
    renderRegister()

    fireEvent.change(screen.getByLabelText('Nama lengkap'), {
      target: { value: 'Mahasiswa Baru' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'baru@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Password123!' },
    })
    fireEvent.change(screen.getByLabelText('Konfirmasi password'), {
      target: { value: 'PasswordLain!' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Daftar' }))

    expect(mockedRegister).not.toHaveBeenCalled()
    expect(await screen.findByText('Periksa kembali data yang diisi.'))
      .toBeTruthy()
  })

  it('mengirim pendaftaran berhasil dan menampilkan pesan sukses', async () => {
    const response: RegisterResponse = {
      success: true,
      message: 'Akun mahasiswa berhasil dibuat. Silakan masuk.',
    }
    mockedRegister.mockResolvedValue(response)

    renderRegister()

    fireEvent.change(screen.getByLabelText('Nama lengkap'), {
      target: { value: 'Mahasiswa Baru' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'baru@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Password123!' },
    })
    fireEvent.change(screen.getByLabelText('Konfirmasi password'), {
      target: { value: 'Password123!' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Daftar' }))

    await waitFor(() => {
      expect(mockedRegister).toHaveBeenCalledWith({
        name: 'Mahasiswa Baru',
        email: 'baru@example.test',
        password: 'Password123!',
        password_confirmation: 'Password123!',
      })
    })

    expect(
      await screen.findByText('Akun mahasiswa berhasil dibuat. Silakan masuk.'),
    ).toBeTruthy()
  })

  it('menampilkan loading state saat permintaan berlangsung', async () => {
    mockedRegister.mockImplementation(() =>
      new Promise(() => {}),
    )

    renderRegister()

    fireEvent.change(screen.getByLabelText('Nama lengkap'), {
      target: { value: 'Mahasiswa Baru' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'baru@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Password123!' },
    })
    fireEvent.change(screen.getByLabelText('Konfirmasi password'), {
      target: { value: 'Password123!' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Daftar' }))

    expect(
      screen.getByRole('button', { name: 'Mendaftar…' }),
    ).toBeTruthy()

    mockedRegister.mockResolvedValue({
      success: true,
      message: 'Akun mahasiswa berhasil dibuat. Silakan masuk.',
    })
  })

  it('menampilkan error state saat API gagal', async () => {
    const error = new Error('Network Error') as Error & {
      response?: { status?: number; data?: unknown }
    }
    error.response = { status: undefined }
    mockedRegister.mockRejectedValue(error)

    renderRegister()

    fireEvent.change(screen.getByLabelText('Nama lengkap'), {
      target: { value: 'Mahasiswa Baru' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'baru@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Password123!' },
    })
    fireEvent.change(screen.getByLabelText('Konfirmasi password'), {
      target: { value: 'Password123!' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Daftar' }))

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
          email: ['Email sudah terdaftar.'],
        },
      },
    }
    mockedRegister.mockRejectedValue(axiosError)

    renderRegister()

    fireEvent.change(screen.getByLabelText('Nama lengkap'), {
      target: { value: 'Mahasiswa Baru' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'baru@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Password123!' },
    })
    fireEvent.change(screen.getByLabelText('Konfirmasi password'), {
      target: { value: 'Password123!' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Daftar' }))

    expect(await screen.findByText('Periksa kembali data yang diisi.')).toBeTruthy()
  })

  it('tidak memanggil logout setelah registrasi', async () => {
    const logout = vi.fn()
    const authValue = createAuthValue()
    authValue.logout = logout

    const response: RegisterResponse = {
      success: true,
      message: 'Akun mahasiswa berhasil dibuat. Silakan masuk.',
    }
    mockedRegister.mockResolvedValue(response)

    render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    fireEvent.change(screen.getByLabelText('Nama lengkap'), {
      target: { value: 'Mahasiswa Baru' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'baru@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Password123!' },
    })
    fireEvent.change(screen.getByLabelText('Konfirmasi password'), {
      target: { value: 'Password123!' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Daftar' }))

    await waitFor(() => {
      expect(mockedRegister).toHaveBeenCalled()
    })

    expect(logout).not.toHaveBeenCalled()
  })
})
