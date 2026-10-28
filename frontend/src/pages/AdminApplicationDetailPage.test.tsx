import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { AuthContext, type AuthContextValue } from '../auth/AuthContext'
import { AppRoutes } from '../App'
import type { AuthUser } from '../services/auth'
import {
  assignDpm,
  downloadAdminAcceptanceLetter,
  getAdminApplication,
  listDpmOptions,
  updateAdminApplicationStatus,
  type AcceptanceLetter,
  type InternshipApplication,
} from '../services/applications'

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
  getAcceptanceLetterLimit: vi.fn(),
  downloadStudentAcceptanceLetter: vi.fn(),
  downloadAdminAcceptanceLetter: vi.fn(),
  listDpmOptions: vi.fn(),
  assignDpm: vi.fn(),
  listDpmApplications: vi.fn(),
  getDpmApplication: vi.fn(),
}))

vi.mock('../services/communications', () => ({
  listApplicationCommunications: vi.fn().mockResolvedValue([]),
  createApplicationCommunication: vi.fn(),
}))

const mockedGetApplication = vi.mocked(getAdminApplication)
const mockedUpdateStatus = vi.mocked(updateAdminApplicationStatus)
const mockedListDpmOptions = vi.mocked(listDpmOptions)
const mockedAssignDpm = vi.mocked(assignDpm)
const mockedDownloadLetter = vi.mocked(downloadAdminAcceptanceLetter)

const adminUser: AuthUser = {
  id: 9,
  name: 'Admin Uji',
  email: 'admin@example.test',
  role: 'admin',
}

const prodiUser: AuthUser = {
  id: 10,
  name: 'Prodi Uji',
  email: 'prodi@example.test',
  role: 'prodi',
}

const pendingApplication: InternshipApplication = {
  id: 11,
  status: 'menunggu',
  submittedAt: '2026-10-21T08:00:00.000000Z',
  reviewNote: null,
  reviewedAt: null,
  partner: {
    id: 3,
    name: 'PT Maju',
    address: 'Jl. Contoh 1',
    contact: '08123456789',
    email: 'mitra@example.test',
    description: 'Mitra magang.',
  },
  student: {
    id: 7,
    name: 'Siti Rahma',
    email: 'siti.rahma@example.test',
    role: 'mahasiswa',
  },
  reviewer: null,
  acceptanceLetter: null,
  dpmPlacement: null,
}

const otherApplication: InternshipApplication = {
  ...pendingApplication,
  id: 12,
  student: {
    id: 8,
    name: 'Budi Santoso',
    email: 'budi.santoso@example.test',
    role: 'mahasiswa',
  },
}

const acceptedApplication: InternshipApplication = {
  ...pendingApplication,
  status: 'diterima',
  reviewNote: 'Diterima setelah seleksi mitra.',
  reviewedAt: '2026-10-22T09:00:00.000000Z',
  reviewer: {
    id: 9,
    name: 'Admin Uji',
    email: 'admin@example.test',
    role: 'admin',
  },
}

const acceptanceLetter: AcceptanceLetter = {
  id: 21,
  originalName: 'surat-penerimaan.pdf',
  mimeType: 'application/pdf',
  size: 204800,
  uploadedAt: '2026-10-23T10:00:00.000000Z',
}

const dpmOption = {
  id: 5,
  name: 'Dr. Dosen Pembimbing',
  email: 'dosen@example.test',
}

const acceptedWithDpm: InternshipApplication = {
  ...acceptedApplication,
  acceptanceLetter,
  dpmPlacement: {
    id: 31,
    assignedAt: '2026-10-24T09:00:00.000000Z',
    dpm: {
      id: dpmOption.id,
      name: dpmOption.name,
      email: dpmOption.email,
      role: 'dpm',
    },
  },
}

function createAuthValue(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    user: adminUser,
    isAuthenticated: true,
    isLoading: false,
    sessionError: null,
    login: async () => adminUser,
    logout: async () => {},
    refreshUser: async () => adminUser,
    ...overrides,
  }
}

function RouteChanger() {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate('/admin/pengajuan/12')}
    >
      Buka pengajuan 12
    </button>
  )
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

function renderNavigableRoute(
  path: string,
  auth: AuthContextValue = createAuthValue(),
) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <RouteChanger />
        <AppRoutes />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

beforeEach(() => {
  mockedGetApplication.mockReset()
  mockedUpdateStatus.mockReset()
  mockedListDpmOptions.mockReset()
  mockedAssignDpm.mockReset()
  mockedDownloadLetter.mockReset()
  mockedListDpmOptions.mockResolvedValue([])
})

afterEach(() => {
  cleanup()
})

describe('AdminApplicationDetailPage', () => {
  it('menampilkan loading state saat detail dimuat', () => {
    mockedGetApplication.mockReturnValue(
      new Promise<InternshipApplication>(() => {}),
    )

    renderRoute('/admin/pengajuan/11')

    expect(screen.getByText('Memuat detail pengajuan...')).toBeTruthy()
  })

  it('tidak menampilkan detail ID lama saat ID berubah tanpa unmount', async () => {
    let resolveSecond: (application: InternshipApplication) => void = () => {}

    mockedGetApplication
      .mockResolvedValueOnce(pendingApplication)
      .mockReturnValueOnce(
        new Promise<InternshipApplication>((resolve) => {
          resolveSecond = resolve
        }),
      )

    renderNavigableRoute(
      '/admin/pengajuan/11',
      createAuthValue({ user: prodiUser }),
    )

    expect(await screen.findByText('Siti Rahma')).toBeTruthy()
    fireEvent.click(
      screen.getByRole('button', { name: 'Buka pengajuan 12' }),
    )

    expect(screen.getByText('Memuat detail pengajuan...')).toBeTruthy()
    expect(screen.queryByText('Siti Rahma')).toBeNull()

    await act(async () => {
      resolveSecond(otherApplication)
    })

    expect(await screen.findByText('Budi Santoso')).toBeTruthy()
    expect(screen.queryByText('Siti Rahma')).toBeNull()
  })

  it('mengabaikan respons lama yang selesai setelah respons ID baru', async () => {
    let resolveFirst: (application: InternshipApplication) => void = () => {}
    let resolveSecond: (application: InternshipApplication) => void = () => {}

    mockedGetApplication.mockImplementation(
      (id) =>
        new Promise<InternshipApplication>((resolve) => {
          if (id === 11) {
            resolveFirst = resolve
          } else {
            resolveSecond = resolve
          }
        }),
    )

    renderNavigableRoute('/admin/pengajuan/11')

    await waitFor(() => {
      expect(mockedGetApplication).toHaveBeenCalledWith(11)
    })

    fireEvent.click(
      screen.getByRole('button', { name: 'Buka pengajuan 12' }),
    )

    await waitFor(() => {
      expect(mockedGetApplication).toHaveBeenCalledWith(12)
    })

    expect(screen.getByText('Memuat detail pengajuan...')).toBeTruthy()

    await act(async () => {
      resolveSecond(otherApplication)
    })

    expect(await screen.findByText('Budi Santoso')).toBeTruthy()

    await act(async () => {
      resolveFirst(pendingApplication)
    })

    expect(screen.getByText('Budi Santoso')).toBeTruthy()
    expect(screen.queryByText('Siti Rahma')).toBeNull()
  })

  it('menampilkan error ID baru tanpa mempertahankan detail ID lama', async () => {
    mockedGetApplication
      .mockResolvedValueOnce(pendingApplication)
      .mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'))

    renderNavigableRoute('/admin/pengajuan/11')

    expect(await screen.findByText('Siti Rahma')).toBeTruthy()
    fireEvent.click(
      screen.getByRole('button', { name: 'Buka pengajuan 12' }),
    )

    expect(
      await screen.findByText(
        'Tidak dapat terhubung ke backend. Periksa koneksi lalu coba lagi.',
      ),
    ).toBeTruthy()
    expect(screen.queryByText('Siti Rahma')).toBeNull()
  })

  it('menampilkan detail pengajuan dan form keputusan', async () => {
    mockedGetApplication.mockResolvedValue(pendingApplication)

    renderRoute('/admin/pengajuan/11')

    expect(await screen.findByText('Siti Rahma')).toBeTruthy()
    expect(screen.getByText('PT Maju')).toBeTruthy()
    expect(screen.getByText('Menunggu hasil seleksi mitra')).toBeTruthy()
    expect(await screen.findByText('Komunikasi mitra')).toBeTruthy()
    expect(screen.getByText('Catat komunikasi')).toBeTruthy()
    expect(screen.getByText('Catat keputusan')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Simpan keputusan' }),
    ).toBeTruthy()
    expect(mockedGetApplication).toHaveBeenCalledWith(11)
  })

  it('menyimpan keputusan dan menampilkan status terbaru', async () => {
    mockedGetApplication.mockResolvedValue(pendingApplication)
    mockedUpdateStatus.mockResolvedValue(acceptedApplication)

    renderRoute('/admin/pengajuan/11')

    const decision = await screen.findByRole('combobox', {
      name: /Keputusan/,
    })
    fireEvent.change(decision, { target: { value: 'diterima' } })
    fireEvent.change(screen.getByLabelText(/Catatan review/), {
      target: { value: 'Diterima setelah seleksi mitra.' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Simpan keputusan' }),
    )

    await waitFor(() => {
      expect(mockedUpdateStatus).toHaveBeenCalledWith(11, {
        status: 'diterima',
        reviewNote: 'Diterima setelah seleksi mitra.',
      })
    })

    expect(
      await screen.findByText('Keputusan pengajuan berhasil disimpan.'),
    ).toBeTruthy()
    expect(screen.getByText('Pengajuan diterima')).toBeTruthy()
    expect(screen.getByText('Penempatan DPM')).toBeTruthy()
    expect(screen.getByText('Surat penerimaan')).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: 'Simpan keputusan' }),
    ).toBeNull()
  })

  it('menolak keputusan kosong sebelum memanggil API', async () => {
    mockedGetApplication.mockResolvedValue(pendingApplication)

    renderRoute('/admin/pengajuan/11')

    await screen.findByText('Catat keputusan')
    fireEvent.click(
      screen.getByRole('button', { name: 'Simpan keputusan' }),
    )

    expect(
      await screen.findByText('Pilih keputusan pengajuan.'),
    ).toBeTruthy()
    expect(mockedUpdateStatus).not.toHaveBeenCalled()
  })

  it('menolak catatan review yang melebihi batas', async () => {
    mockedGetApplication.mockResolvedValue(pendingApplication)

    renderRoute('/admin/pengajuan/11')

    const decision = await screen.findByRole('combobox', {
      name: /Keputusan/,
    })
    fireEvent.change(decision, { target: { value: 'ditolak' } })
    fireEvent.change(screen.getByLabelText(/Catatan review/), {
      target: { value: 'a'.repeat(5001) },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Simpan keputusan' }),
    )

    expect(
      await screen.findByText('Catatan review maksimal 5000 karakter.'),
    ).toBeTruthy()
    expect(mockedUpdateStatus).not.toHaveBeenCalled()
  })

  it('menampilkan error jaringan saat keputusan gagal disimpan', async () => {
    mockedGetApplication.mockResolvedValue(pendingApplication)
    mockedUpdateStatus.mockRejectedValue(
      new AxiosError('Network Error', 'ERR_NETWORK'),
    )

    renderRoute('/admin/pengajuan/11')

    const decision = await screen.findByRole('combobox', {
      name: /Keputusan/,
    })
    fireEvent.change(decision, { target: { value: 'diterima' } })
    fireEvent.click(
      screen.getByRole('button', { name: 'Simpan keputusan' }),
    )

    expect(
      await screen.findByText(
        'Tidak dapat terhubung ke backend. Periksa koneksi lalu coba lagi.',
      ),
    ).toBeTruthy()
    expect(
      screen.getByText('Keputusan belum tersimpan'),
    ).toBeTruthy()
  })

  it('menampilkan pesan khusus ketika keputusan sudah final', async () => {
    mockedGetApplication.mockResolvedValue(pendingApplication)
    const conflict = new AxiosError('Conflict')
    conflict.response = { status: 409 } as AxiosError['response']
    mockedUpdateStatus.mockRejectedValue(conflict)

    renderRoute('/admin/pengajuan/11')

    const decision = await screen.findByRole('combobox', {
      name: /Keputusan/,
    })
    fireEvent.change(decision, { target: { value: 'ditolak' } })
    fireEvent.click(
      screen.getByRole('button', { name: 'Simpan keputusan' }),
    )

    expect(
      await screen.findByText(
        'Pengajuan ini sudah memiliki keputusan. Muat ulang detail untuk melihat status terbaru.',
      ),
    ).toBeTruthy()
  })

  it('menyembunyikan form ketika pengajuan sudah diputuskan', async () => {
    mockedGetApplication.mockResolvedValue(acceptedApplication)

    renderRoute('/admin/pengajuan/11')

    expect(await screen.findByText('Siti Rahma')).toBeTruthy()
    expect(screen.getByText('Pengajuan diterima')).toBeTruthy()
    expect(
      screen.getByText('Diterima setelah seleksi mitra.'),
    ).toBeTruthy()
    expect(
      screen.getByText(/Admin Uji \(admin@example.test\)/),
    ).toBeTruthy()
    expect(screen.queryByText('Catat keputusan')).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Simpan keputusan' }),
    ).toBeNull()
  })

  it('dapat memuat ulang detail setelah gagal', async () => {
    mockedGetApplication
      .mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'))
      .mockResolvedValueOnce(pendingApplication)

    renderRoute('/admin/pengajuan/11')

    expect(
      await screen.findByText('Detail pengajuan gagal dimuat'),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))

    expect(await screen.findByText('Siti Rahma')).toBeTruthy()
    expect(mockedGetApplication).toHaveBeenCalledTimes(2)
  })

  it('menampilkan error untuk id pengajuan yang tidak valid', () => {
    renderRoute('/admin/pengajuan/bukan-angka')

    expect(screen.getByText('Pengajuan tidak ditemukan.')).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: 'Coba lagi' }),
    ).toBeNull()
    expect(mockedGetApplication).not.toHaveBeenCalled()
  })

  it('menolak role mahasiswa tanpa memuat detail', () => {
    renderRoute(
      '/admin/pengajuan/11',
      createAuthValue({
        user: {
          id: 7,
          name: 'Siti Rahma',
          email: 'siti.rahma@example.test',
          role: 'mahasiswa',
        },
      }),
    )

    expect(
      screen.getByRole('heading', { name: 'Akses ditolak' }),
    ).toBeTruthy()
    expect(mockedGetApplication).not.toHaveBeenCalled()
  })

  it('menetapkan DPM untuk pengajuan yang diterima dan menampilkan hasilnya', async () => {
    mockedGetApplication.mockResolvedValue(acceptedApplication)
    mockedListDpmOptions.mockResolvedValue([dpmOption])
    mockedAssignDpm.mockResolvedValue(acceptedWithDpm)

    renderRoute('/admin/pengajuan/11')

    const select = await screen.findByRole('combobox', {
      name: /Dosen pembimbing magang/,
    })
    fireEvent.change(select, { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tetapkan DPM' }))

    await waitFor(() => {
      expect(mockedAssignDpm).toHaveBeenCalledWith(11, 5)
    })

    expect(
      await screen.findByText(
        'Dosen pembimbing magang berhasil ditetapkan.',
      ),
    ).toBeTruthy()
    expect(screen.getByText('Dr. Dosen Pembimbing')).toBeTruthy()
    expect(screen.getByText('dosen@example.test')).toBeTruthy()
    expect(
      screen.getByText(/Penggantian DPM belum didukung/),
    ).toBeTruthy()
  })

  it('menampilkan loading state ketika daftar DPM sedang dimuat', async () => {
    mockedGetApplication.mockResolvedValue(acceptedApplication)
    mockedListDpmOptions.mockReturnValue(
      new Promise<never>(() => {}),
    )

    renderRoute('/admin/pengajuan/11')

    expect(await screen.findByText('Memuat akun DPM...')).toBeTruthy()
  })

  it('menampilkan empty state ketika belum ada akun DPM', async () => {
    mockedGetApplication.mockResolvedValue(acceptedApplication)
    mockedListDpmOptions.mockResolvedValue([])

    renderRoute('/admin/pengajuan/11')

    expect(await screen.findByText('Belum ada akun DPM')).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: 'Tetapkan DPM' }),
    ).toBeNull()
  })

  it('dapat memuat ulang daftar DPM setelah gagal', async () => {
    mockedGetApplication.mockResolvedValue(acceptedApplication)
    mockedListDpmOptions
      .mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'))
      .mockResolvedValueOnce([dpmOption])

    renderRoute('/admin/pengajuan/11')

    expect(
      await screen.findByText('Daftar DPM gagal dimuat'),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))

    expect(
      await screen.findByRole('combobox', {
        name: /Dosen pembimbing magang/,
      }),
    ).toBeTruthy()
    expect(mockedListDpmOptions).toHaveBeenCalledTimes(2)
  })

  it('menolak penempatan DPM tanpa memilih dosen', async () => {
    mockedGetApplication.mockResolvedValue(acceptedApplication)
    mockedListDpmOptions.mockResolvedValue([dpmOption])

    renderRoute('/admin/pengajuan/11')

    await screen.findByRole('combobox', {
      name: /Dosen pembimbing magang/,
    })
    fireEvent.click(screen.getByRole('button', { name: 'Tetapkan DPM' }))

    expect(
      await screen.findByText(
        'Pilih dosen pembimbing magang terlebih dahulu.',
      ),
    ).toBeTruthy()
    expect(mockedAssignDpm).not.toHaveBeenCalled()
  })

  it('menampilkan pesan backend ketika penempatan DPM ditolak', async () => {
    mockedGetApplication.mockResolvedValue(acceptedApplication)
    mockedListDpmOptions.mockResolvedValue([dpmOption])
    const conflict = new AxiosError('Conflict')
    conflict.response = {
      status: 409,
      data: {
        success: false,
        message:
          'Pengajuan ini sudah memiliki DPM. Penggantian DPM belum didukung (OD-024).',
      },
    } as AxiosError['response']
    mockedAssignDpm.mockRejectedValue(conflict)

    renderRoute('/admin/pengajuan/11')

    const select = await screen.findByRole('combobox', {
      name: /Dosen pembimbing magang/,
    })
    fireEvent.change(select, { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tetapkan DPM' }))

    expect(
      await screen.findByText(
        'Pengajuan ini sudah memiliki DPM. Penggantian DPM belum didukung (OD-024).',
      ),
    ).toBeTruthy()
  })

  it('mengunduh surat penerimaan melalui endpoint admin yang terotorisasi', async () => {
    const createObjectUrl = vi.fn(() => 'blob:test')
    const revokeObjectUrl = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectUrl,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectUrl,
    })

    mockedGetApplication.mockResolvedValue(acceptedWithDpm)
    mockedDownloadLetter.mockResolvedValue(
      new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
    )

    renderRoute('/admin/pengajuan/11')

    expect(await screen.findByText('surat-penerimaan.pdf')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Unduh surat' }))

    await waitFor(() => {
      expect(mockedDownloadLetter).toHaveBeenCalledWith(11)
    })

    expect(
      await screen.findByText('Surat penerimaan berhasil diunduh.'),
    ).toBeTruthy()
    expect(createObjectUrl).toHaveBeenCalled()
  })

  it('tidak menampilkan panel surat atau DPM untuk pengajuan yang belum diterima', async () => {
    mockedGetApplication.mockResolvedValue(pendingApplication)

    renderRoute('/admin/pengajuan/11')

    expect(await screen.findByText('Siti Rahma')).toBeTruthy()
    expect(screen.queryByText('Penempatan DPM')).toBeNull()
    expect(screen.queryByText('Surat penerimaan')).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Tetapkan DPM' }),
    ).toBeNull()
  })
})
