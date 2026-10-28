import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AxiosError } from 'axios'
import { DeleteCourseDialog } from './DeleteCourseDialog'
import { deleteCourse, type Course } from '../../services/academic'

vi.mock('../../services/academic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/academic')>()

  return {
    ...actual,
    deleteCourse: vi.fn(),
  }
})

const mockedDeleteCourse = vi.mocked(deleteCourse)

const course: Course = {
  id: 4,
  name: 'Basis Data',
  description: 'Mata kuliah prasyarat.',
  grades_count: 2,
  created_at: '2026-10-20T08:00:00.000000Z',
  updated_at: '2026-10-20T08:00:00.000000Z',
}

beforeEach(() => {
  mockedDeleteCourse.mockReset()
})

afterEach(() => {
  cleanup()
})

describe('DeleteCourseDialog', () => {
  it('menampilkan alasan konflik dari backend saat mata kuliah masih dipakai', async () => {
    const conflict = new AxiosError('Conflict')
    conflict.response = {
      status: 409,
      data: {
        success: false,
        message:
          'Mata kuliah tidak dapat dihapus karena masih memiliki nilai mahasiswa.',
      },
    } as AxiosError['response']
    mockedDeleteCourse.mockRejectedValue(conflict)

    render(
      <DeleteCourseDialog
        course={course}
        onClose={() => {}}
        onDeleted={() => {}}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Hapus mata kuliah' }))

    expect(
      await screen.findByText(
        'Mata kuliah tidak dapat dihapus karena masih memiliki nilai mahasiswa.',
      ),
    ).toBeTruthy()
    expect(
      screen.queryByText('Mata kuliah gagal dihapus. Coba lagi.'),
    ).toBeNull()
  })
})
