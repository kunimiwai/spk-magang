import { useCallback, useEffect, useState } from 'react'
import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { AppLayout } from '../components/layout/AppLayout'
import {
  PageContainer,
  PageHeader,
} from '../components/layout/PageContainer'
import { CourseFormDialog } from '../components/courses/CourseFormDialog'
import { DeleteCourseDialog } from '../components/courses/DeleteCourseDialog'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/Card'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { getApiErrorMessage } from '../lib/apiError'
import { listCourses, type Course } from '../services/academic'

type FormState =
  | { mode: 'create' }
  | { mode: 'edit'; course: Course }
  | null

export default function CoursesPage() {
  const { user, isLoading: authLoading, logout } = useAuth()

  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [formState, setFormState] = useState<FormState>(null)
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadCourses() {
      try {
        const data = await listCourses()

        if (active) {
          setCourses(data)
          setError('')
        }
      } catch (err: unknown) {
        if (active) {
          setCourses([])
          setError(
            getApiErrorMessage(err, 'Mata kuliah gagal dimuat. Coba lagi.'),
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadCourses()

    return () => {
      active = false
    }
  }, [reloadKey])

  const refresh = useCallback(() => {
    setLoading(true)
    setReloadKey((current) => current + 1)
  }, [])

  const openCreate = useCallback(() => {
    setSuccessMessage('')
    setFormState({ mode: 'create' })
  }, [])

  const openEdit = useCallback((course: Course) => {
    setSuccessMessage('')
    setFormState({ mode: 'edit', course })
  }, [])

  const closeForm = useCallback(() => setFormState(null), [])
  const closeDelete = useCallback(() => setDeleteTarget(null), [])

  const handleSaved = useCallback(
    (message: string) => {
      setFormState(null)
      setSuccessMessage(message)
      refresh()
    },
    [refresh],
  )

  const handleDeleted = useCallback(
    (message: string) => {
      setDeleteTarget(null)
      setSuccessMessage(message)
      refresh()
    },
    [refresh],
  )

  function retry() {
    setError('')
    setLoading(true)
    setReloadKey((current) => current + 1)
  }

  async function handleLogout() {
    setLogoutLoading(true)

    try {
      await logout()
    } finally {
      setLogoutLoading(false)
    }
  }

  const totalLabel =
    courses.length === 1 ? '1 mata kuliah' : `${courses.length} mata kuliah`

  return (
    <AppLayout
      user={user}
      authLoading={authLoading}
      onLogout={handleLogout}
      logoutLoading={logoutLoading}
    >
      <PageContainer>
        <PageHeader
          eyebrow="Administrasi"
          title="Master mata kuliah"
          description="Kelola daftar mata kuliah yang tersedia untuk pencatatan nilai akademik mahasiswa."
          actions={
            <Button
              onClick={openCreate}
              leftIcon={<Plus className="size-4" aria-hidden="true" />}
            >
              Tambah mata kuliah
            </Button>
          }
        />

        <Alert variant="info" title="Aturan prasyarat tidak diatur di sini" className="mb-4">
          Daftar mata kuliah prasyarat, skala nilai, dan ambang kelulusan tidak
          ditentukan pada master ini. Status aturan prasyarat aktual ditampilkan
          pada halaman nilai mahasiswa dan mengikuti keputusan OD-007/OD-008.
        </Alert>

        {successMessage && (
          <Alert variant="success" title="Berhasil" className="mb-4">
            {successMessage}
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-5 text-primary" aria-hidden="true" />
                  <CardTitle>Daftar mata kuliah</CardTitle>
                </div>
                <CardDescription>
                  Mata kuliah yang sudah memiliki nilai mahasiswa tidak dapat
                  dihapus agar data nilai tetap utuh.
                </CardDescription>
              </div>

              {!loading && !error && (
                <Badge variant="neutral">{totalLabel}</Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="px-5 pb-5">
                <LoadingState message="Memuat mata kuliah..." />
              </div>
            ) : error ? (
              <div className="px-5 pb-5">
                <ErrorState
                  title="Mata kuliah gagal dimuat"
                  message={error}
                  action={
                    <Button variant="outline" size="sm" onClick={retry}>
                      Coba lagi
                    </Button>
                  }
                />
              </div>
            ) : courses.length === 0 ? (
              <div className="px-5 pb-5">
                <EmptyState
                  title="Belum ada mata kuliah"
                  description="Tambahkan mata kuliah sesuai daftar resmi dari pemilik produk. Aplikasi tidak menyediakan daftar mata kuliah bawaan."
                  action={
                    <Button variant="outline" size="sm" onClick={openCreate}>
                      Tambah mata kuliah
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                <p className="px-5 pt-3 text-xs leading-relaxed text-muted-foreground xl:hidden">
                  Geser tabel ke samping untuk melihat semua kolom.
                </p>

                <div
                  className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  role="region"
                  aria-label="Tabel daftar mata kuliah, dapat digulir horizontal"
                  tabIndex={0}
                >
                  <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
                    <caption className="sr-only">
                      Daftar master mata kuliah
                    </caption>
                    <thead>
                      <tr className="border-y border-border-subtle bg-muted">
                        <th
                          scope="col"
                          className="px-5 py-3 font-semibold text-foreground"
                        >
                          Nama mata kuliah
                        </th>
                        <th
                          scope="col"
                          className="px-5 py-3 font-semibold text-foreground"
                        >
                          Nilai tersimpan
                        </th>
                        <th
                          scope="col"
                          className="px-5 py-3 text-right font-semibold text-foreground"
                        >
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course) => (
                        <tr
                          key={course.id}
                          className="border-b border-border-subtle align-top last:border-b-0"
                        >
                          <td className="max-w-80 px-5 py-4">
                            <p className="font-semibold text-foreground">
                              {course.name}
                            </p>
                            {course.description && (
                              <p
                                className="mt-1 line-clamp-2 text-muted-foreground"
                                title={course.description}
                              >
                                {course.description}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-4 text-foreground">
                            {course.grades_count > 0
                              ? `${course.grades_count} nilai`
                              : 'Belum dinilai'}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(course)}
                                leftIcon={
                                  <Pencil className="size-4" aria-hidden="true" />
                                }
                                aria-label={`Ubah ${course.name}`}
                              >
                                Ubah
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget(course)}
                                disabled={course.grades_count > 0}
                                title={
                                  course.grades_count > 0
                                    ? 'Nilai mahasiswa harus dihapus sebelum mata kuliah dapat dihapus.'
                                    : undefined
                                }
                                leftIcon={
                                  <Trash2 className="size-4" aria-hidden="true" />
                                }
                                aria-label={`Hapus ${course.name}`}
                                className="text-destructive hover:bg-danger-surface"
                              >
                                Hapus
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </PageContainer>

      {formState && (
        <CourseFormDialog
          key={
            formState.mode === 'edit'
              ? `edit-${formState.course.id}`
              : 'create'
          }
          mode={formState.mode}
          course={formState.mode === 'edit' ? formState.course : undefined}
          onClose={closeForm}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <DeleteCourseDialog
          course={deleteTarget}
          onClose={closeDelete}
          onDeleted={handleDeleted}
        />
      )}
    </AppLayout>
  )
}
