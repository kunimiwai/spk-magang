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
  createStudentApplication,
  downloadStudentAcceptanceLetter,
  listStudentApplications,
  listStudentPartnerOptions,
  uploadStudentAcceptanceLetter,
  type AcceptanceLetter,
  type InternshipApplication,
  type PartnerOption,
} from '../services/applications'

vi.mock('../services/applications', () => ({
  listStudentApplications: vi.fn(),
  createStudentApplication: vi.fn(),
  listStudentPartnerOptions: vi.fn(),
  listAdminApplications: vi.fn(),
  getAdminApplication: vi.fn(),
  updateAdminApplicationStatus: vi.fn(),
  uploadStudentAcceptanceLetter: vi.fn(),
  getAcceptanceLetterLimit: vi.fn().mockResolvedValue({
    maxSizeKb: 5120,
    maxSizeBytes: 5242880,
    configuredMaxSizeKb: 5120,
    allowedMimeTypes: ['application/pdf'],
    replaceable: false,
  }),
  downloadStudentAcceptanceLetter: vi.fn(),
  downloadAdminAcceptanceLetter: vi.fn(),
  listDpmOptions: vi.fn(),
  assignDpm: vi.fn(),
  listDpmApplications: vi.fn(),
}))

const mockedListApplications = vi.mocked(listStudentApplications)
const mockedCreateApplication = vi.mocked(createStudentApplication)
const mockedListPartnerOptions = vi.mocked(listStudentPartnerOptions)
const mockedUploadLetter = vi.mocked(uploadStudentAcceptanceLetter)
const mockedDownloadLetter = vi.mocked(downloadStudentAcceptanceLetter)

const mahasiswaUser: AuthUser = {
  id: 7,
  name: 'Siti Rahma',
  email: 'siti.rahma@example.test',
  role: 'mahasiswa',
}

const partner: PartnerOption = { id: 3, name: 'PT Maju' }

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
    description: 'Mitra magang bidang perangkat lunak.',
  },
  student: null,
  reviewer: null,
  acceptanceLetter: null,
  dpmPlacement: null,
}

const acceptedApplication: InternshipApplication = {
  ...pendingApplication,
  id: 12,
  status: 'diterima',
  reviewNote: 'Diterima setelah seleksi mitra.',
  reviewedAt: '2026-10-22T09:00:00.000000Z',
}

const acceptanceLetter: AcceptanceLetter = {
  id: 21,
  originalName: 'surat-penerimaan.pdf',
  mimeType: 'application/pdf',
  size: 204800,
  uploadedAt: '2026-10-23T10:00:00.000000Z',
}

const acceptedApplicationWithDpm: InternshipApplication = {
  ...acceptedApplication,
  acceptanceLetter,
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
  mockedListApplications.mockReset()
  mockedCreateApplication.mockReset()
  mockedListPartnerOptions.mockReset()
  mockedUploadLetter.mockReset()
  mockedDownloadLetter.mockReset()
})

afterEach(() => {
  cleanup()
})

describe('StudentApplicationsPage', () => {
  it('menampilkan loading state untuk daftar pengajuan dan mitra', () => {
    mockedListApplications.mockReturnValue(
      new Promise<InternshipApplication[]>(() => {}),
    )
    mockedListPartnerOptions.mockReturnValue(
      new Promise<PartnerOption[]>(() => {}),
    )

    renderRoute('/mahasiswa/pengajuan')

    expect(screen.getByText('Memuat daftar mitra...')).toBeTruthy()
    expect(screen.getByText('Memuat pengajuan...')).toBeTruthy()
  })

  it('menampilkan empty state ketika belum ada mitra dan pengajuan', async () => {
    mockedListApplications.mockResolvedValue([])
    mockedListPartnerOptions.mockResolvedValue([])

    renderRoute('/mahasiswa/pengajuan')

    expect(await screen.findByText('Belum ada mitra')).toBeTruthy()
    expect(screen.getByText('Belum ada pengajuan')).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: 'Kirim pengajuan' }),
    ).toBeNull()
  })

  it('menampilkan pengajuan milik mahasiswa beserta status backend', async () => {
    mockedListApplications.mockResolvedValue([
      pendingApplication,
      acceptedApplication,
    ])
    mockedListPartnerOptions.mockResolvedValue([partner])

    renderRoute('/mahasiswa/pengajuan')

    expect(await screen.findAllByText('Menunggu hasil seleksi mitra')).toBeTruthy()
    expect(screen.getAllByText('Diterima')).toBeTruthy()
    expect(
      screen.getByText('Diterima setelah seleksi mitra.'),
    ).toBeTruthy()
    expect(screen.getAllByText('Jl. Contoh 1')).toBeTruthy()
    expect(
      screen.getByText(/Hanya pengajuan milik akun yang sedang login/),
    ).toBeTruthy()
  })

  it('mengirim pengajuan ke mitra yang dipilih dan memperbarui daftar', async () => {
    mockedListApplications
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    mockedListPartnerOptions.mockResolvedValue([partner])
    mockedCreateApplication.mockResolvedValue(pendingApplication)

    renderRoute('/mahasiswa/pengajuan')

    const select = await screen.findByRole('combobox', {
      name: /Mitra magang/,
    })
    fireEvent.change(select, { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: 'Kirim pengajuan' }))

    await waitFor(() => {
      expect(mockedCreateApplication).toHaveBeenCalledWith(3)
    })

    expect(
      await screen.findByText(
        'Pengajuan berhasil dikirim dengan status Menunggu hasil seleksi mitra.',
      ),
    ).toBeTruthy()
    expect(screen.getAllByText('PT Maju').length).toBeGreaterThan(0)
  })

  it('mencegah pengiriman ganda selama request berlangsung', async () => {
    mockedListApplications.mockResolvedValue([])
    mockedListPartnerOptions.mockResolvedValue([partner])
    mockedCreateApplication.mockReturnValue(
      new Promise<InternshipApplication>(() => {}),
    )

    renderRoute('/mahasiswa/pengajuan')

    const select = await screen.findByRole('combobox', {
      name: /Mitra magang/,
    })
    fireEvent.change(select, { target: { value: '3' } })

    const submit = screen.getByRole('button', { name: 'Kirim pengajuan' })
    fireEvent.click(submit)
    fireEvent.click(submit)

    await waitFor(() => {
      expect(mockedCreateApplication).toHaveBeenCalledTimes(1)
    })

    expect(
      screen.getByRole('button', { name: 'Mengirim…' }),
    ).toHaveProperty('disabled', true)
  })

  it('menolak pengiriman tanpa memilih mitra', async () => {
    mockedListApplications.mockResolvedValue([])
    mockedListPartnerOptions.mockResolvedValue([partner])

    renderRoute('/mahasiswa/pengajuan')

    await screen.findByRole('combobox', { name: /Mitra magang/ })
    fireEvent.click(screen.getByRole('button', { name: 'Kirim pengajuan' }))

    expect(
      await screen.findByText('Pilih mitra magang terlebih dahulu.'),
    ).toBeTruthy()
    expect(mockedCreateApplication).not.toHaveBeenCalled()
  })

  it('menampilkan error jaringan saat pengajuan gagal dikirim', async () => {
    mockedListApplications.mockResolvedValue([])
    mockedListPartnerOptions.mockResolvedValue([partner])
    mockedCreateApplication.mockRejectedValue(
      new AxiosError('Network Error', 'ERR_NETWORK'),
    )

    renderRoute('/mahasiswa/pengajuan')

    const select = await screen.findByRole('combobox', {
      name: /Mitra magang/,
    })
    fireEvent.change(select, { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: 'Kirim pengajuan' }))

    expect(
      await screen.findByText(
        'Tidak dapat terhubung ke backend. Periksa koneksi lalu coba lagi.',
      ),
    ).toBeTruthy()
    expect(
      screen.getByText('Pengajuan belum terkirim'),
    ).toBeTruthy()
    expect(
      screen.queryByText(
        /Pengajuan berhasil dikirim dengan status/,
      ),
    ).toBeNull()
  })

  it('dapat memuat ulang daftar pengajuan setelah gagal', async () => {
    mockedListApplications
      .mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'))
      .mockResolvedValueOnce([])
    mockedListPartnerOptions.mockResolvedValue([partner])

    renderRoute('/mahasiswa/pengajuan')

    expect(
      await screen.findByText('Pengajuan gagal dimuat'),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))

    expect(await screen.findByText('Belum ada pengajuan')).toBeTruthy()
    expect(mockedListApplications).toHaveBeenCalledTimes(2)
  })

  it('menolak role selain mahasiswa tanpa memuat pengajuan', () => {
    renderRoute(
      '/mahasiswa/pengajuan',
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
    expect(mockedListApplications).not.toHaveBeenCalled()
    expect(mockedListPartnerOptions).not.toHaveBeenCalled()
  })

  it('mengunggah surat penerimaan untuk pengajuan yang diterima', async () => {
    mockedListApplications.mockResolvedValue([acceptedApplication])
    mockedListPartnerOptions.mockResolvedValue([partner])
    mockedUploadLetter.mockResolvedValue(acceptedApplicationWithDpm)

    renderRoute('/mahasiswa/pengajuan')

    const input = await screen.findByLabelText(/Berkas surat penerimaan/)
    const file = new File(['%PDF-1.4'], 'surat-penerimaan.pdf', {
      type: 'application/pdf',
    })

    fireEvent.change(input, { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: 'Unggah surat' }))

    await waitFor(() => {
      expect(mockedUploadLetter).toHaveBeenCalledWith(12, file)
    })

    expect(
      await screen.findByText('Surat penerimaan berhasil diunggah.'),
    ).toBeTruthy()
    expect(screen.getByText('surat-penerimaan.pdf')).toBeTruthy()
  })

  it('menolak berkas surat penerimaan yang tidak valid sebelum memanggil API', async () => {
    mockedListApplications.mockResolvedValue([acceptedApplication])
    mockedListPartnerOptions.mockResolvedValue([partner])

    renderRoute('/mahasiswa/pengajuan')

    const input = await screen.findByLabelText(/Berkas surat penerimaan/)
    const file = new File(['bukan pdf'], 'surat.txt', {
      type: 'text/plain',
    })

    fireEvent.change(input, { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: 'Unggah surat' }))

    expect(
      await screen.findByText(
        'Format surat penerimaan harus PDF, JPG, atau PNG.',
      ),
    ).toBeTruthy()
    expect(mockedUploadLetter).not.toHaveBeenCalled()
  })

  it('menampilkan pesan backend ketika unggahan surat ditolak', async () => {
    mockedListApplications.mockResolvedValue([acceptedApplication])
    mockedListPartnerOptions.mockResolvedValue([partner])
    const conflict = new AxiosError('Conflict')
    conflict.response = {
      status: 409,
      data: {
        success: false,
        message:
          'Surat penerimaan sudah diunggah. Penggantian dokumen belum didukung (OD-017).',
      },
    } as AxiosError['response']
    mockedUploadLetter.mockRejectedValue(conflict)

    renderRoute('/mahasiswa/pengajuan')

    const input = await screen.findByLabelText(/Berkas surat penerimaan/)
    fireEvent.change(input, {
      target: {
        files: [
          new File(['%PDF-1.4'], 'surat.pdf', {
            type: 'application/pdf',
          }),
        ],
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Unggah surat' }))

    expect(
      await screen.findByText(
        'Surat penerimaan sudah diunggah. Penggantian dokumen belum didukung (OD-017).',
      ),
    ).toBeTruthy()
  })

  it('mengunduh surat melalui endpoint terotorisasi dan menampilkan status DPM', async () => {
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

    mockedListApplications.mockResolvedValue([acceptedApplicationWithDpm])
    mockedListPartnerOptions.mockResolvedValue([partner])
    mockedDownloadLetter.mockResolvedValue(
      new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
    )

    renderRoute('/mahasiswa/pengajuan')

    expect(
      await screen.findByText('Dr. Dosen Pembimbing'),
    ).toBeTruthy()
    expect(screen.getByText('dosen@example.test')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Unduh surat' }))

    await waitFor(() => {
      expect(mockedDownloadLetter).toHaveBeenCalledWith(12)
    })

    expect(
      await screen.findByText('Surat penerimaan berhasil diunduh.'),
    ).toBeTruthy()
    expect(createObjectUrl).toHaveBeenCalled()
  })

  it('menampilkan panel surat hanya untuk pengajuan diterima dan status DPM belum ditetapkan', async () => {
    mockedListApplications.mockResolvedValue([
      pendingApplication,
      acceptedApplication,
    ])
    mockedListPartnerOptions.mockResolvedValue([partner])

    renderRoute('/mahasiswa/pengajuan')

    expect(
      await screen.findByText('DPM belum ditetapkan oleh Admin/Prodi.'),
    ).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: 'Unggah surat' }),
    ).toBeTruthy()

    // Pengajuan menunggu tidak memiliki panel surat penerimaan.
    expect(screen.getAllByText('Surat penerimaan').length).toBe(1)
  })

  it('mencegah unggahan surat ganda selama request berlangsung', async () => {
    mockedListApplications.mockResolvedValue([acceptedApplication])
    mockedListPartnerOptions.mockResolvedValue([partner])
    mockedUploadLetter.mockReturnValue(
      new Promise<InternshipApplication>(() => {}),
    )

    renderRoute('/mahasiswa/pengajuan')

    const input = await screen.findByLabelText(/Berkas surat penerimaan/)
    fireEvent.change(input, {
      target: {
        files: [
          new File(['%PDF-1.4'], 'surat.pdf', {
            type: 'application/pdf',
          }),
        ],
      },
    })

    const submit = screen.getByRole('button', { name: 'Unggah surat' })
    fireEvent.click(submit)
    fireEvent.click(submit)

    await waitFor(() => {
      expect(mockedUploadLetter).toHaveBeenCalledTimes(1)
    })

    expect(
      screen.getByRole('button', { name: 'Mengunggah…' }),
    ).toHaveProperty('disabled', true)
  })
})
