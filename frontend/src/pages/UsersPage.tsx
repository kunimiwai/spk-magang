import {
  useEffect,
  useState,
} from 'react'
import { Plus } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { AppLayout } from '../components/layout/AppLayout'
import {
  PageContainer,
  PageHeader,
} from '../components/layout/PageContainer'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import {
  Card,
  CardContent,
} from '../components/ui/Card'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { getApiErrorMessage } from '../lib/apiError'
import { getRoleLabel } from '../lib/roleLabels'
import {
  deleteUser,
  listUsers,
  type UserAccount,
} from '../services/users'
import { UserFormDialog } from '../components/users/UserFormDialog'
import { DeleteUserDialog } from '../components/users/DeleteUserDialog'

type UserState =
  | { status: 'loading' }
  | { status: 'ready'; users: UserAccount[] }
  | { status: 'error'; message: string }

export default function UsersPage() {
  const { user, isLoading: authLoading, logout } = useAuth()

  const [userState, setUserState] = useState<UserState>({
    status: 'loading',
  })
  const [reloadKey, setReloadKey] = useState(0)
  const [formState, setFormState] = useState<
    | null
    | { mode: 'create' }
    | { mode: 'edit'; user: UserAccount }
  >(null)
  const [deleteTarget, setDeleteTarget] = useState<UserAccount | null>(null)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadUsers() {
      try {
        const users = await listUsers()

        if (active) {
          setUserState({ status: 'ready', users })
          setError('')
        }
      } catch (err: unknown) {
        if (active) {
          setUserState({
            status: 'error',
            message: getApiErrorMessage(
              err,
              'Daftar pengguna gagal dimuat. Coba lagi.',
            ),
          })
        }
      }
    }

    void loadUsers()

    return () => {
      active = false
    }
  }, [reloadKey])

  function retry() {
    setUserState({ status: 'loading' })
    setError('')
    setReloadKey((key) => key + 1)
  }

  function openCreate() {
    setError('')
    setSuccessMessage('')
    setFormState({ mode: 'create' })
  }

  function openEdit(target: UserAccount) {
    setError('')
    setSuccessMessage('')
    setFormState({ mode: 'edit', user: target })
  }

  function closeForm() {
    setFormState(null)
  }

  async function handleSave(message: string) {
    setSuccessMessage(message)
    setError('')
    setFormState(null)
    setReloadKey((key) => key + 1)
  }

  async function handleDelete() {
    if (!deleteTarget) return

    setSaving(true)

    try {
      await deleteUser(deleteTarget.id)
      setSuccessMessage(`Akun ${deleteTarget.name} berhasil dihapus.`)
      setDeleteTarget(null)
      setReloadKey((key) => key + 1)
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          'Akun pengguna gagal dihapus. Coba lagi.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    setLogoutLoading(true)

    try {
      await logout()
    } finally {
      setLogoutLoading(false)
    }
  }

  const isAdmin = user?.role === 'admin'

  const users = userState.status === 'ready' ? userState.users : []

  return (
    <AppLayout
      user={user}
      authLoading={authLoading}
      onLogout={handleLogout}
      logoutLoading={logoutLoading}
    >
      <PageContainer>
        <PageHeader
          eyebrow="Administrasi Sistem"
          title="Manajemen Pengguna"
          description={
            'Kelola akun pengguna sistem. Admin dapat membuat, mengubah, dan menghapus akun untuk semua role.'
          }
          actions={
            <Button
              disabled={!isAdmin || saving}
              onClick={openCreate}
              leftIcon={<Plus className="size-4" aria-hidden="true" />}
            >
              Tambah pengguna
            </Button>
          }
        />

        {successMessage && (
          <Alert variant="success" title="Berhasil" className="mb-4">
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" title="Kesalahan" className="mb-4">
            {error}
          </Alert>
        )}

        {userState.status === 'loading' && (
          <Card>
            <CardContent>
              <LoadingState message="Memuat daftar pengguna..." />
            </CardContent>
          </Card>
        )}

        {userState.status === 'error' && (
          <Card>
            <CardContent>
              <ErrorState
                title="Pengguna gagal dimuat"
                message={userState.message}
                action={
                  <Button variant="outline" size="sm" onClick={retry}>
                    Coba lagi
                  </Button>
                }
              />
            </CardContent>
          </Card>
        )}

        {userState.status === 'ready' && (
          <div>
            {users.length === 0 ? (
              <EmptyState
                title="Belum ada pengguna"
                description="Buat akun pengguna baru melalui tombol di atas."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openCreate}
                    disabled={!isAdmin}
                  >
                    Tambah pengguna
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle bg-muted">
                      <th className="px-4 py-3 font-semibold text-foreground">
                        Nama
                      </th>
                      <th className="px-4 py-3 font-semibold text-foreground">
                        Email
                      </th>
                      <th className="px-4 py-3 font-semibold text-foreground">
                        Role
                      </th>
                      <th className="px-4 py-3 font-semibold text-foreground text-right">
                        Status
                      </th>
                      <th className="px-4 py-3 font-semibold text-foreground text-right">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((account) => (
                      <tr
                        key={account.id}
                        className="border-b border-border-subtle last:border-b-0"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-foreground">
                          {account.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {account.email}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          <Badge variant="info">
                            {getRoleLabel(account.role)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <Badge
                            variant={
                              account.is_active ? 'success' : 'danger'
                            }
                          >
                            {account.is_active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(account)}
                              disabled={saving}
                            >
                              Ubah
                            </Button>
                            {isAdmin && account.id !== user?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget(account)}
                                disabled={saving}
                                className="text-destructive hover:bg-danger-surface"
                              >
                                Hapus
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {formState && (
          <UserFormDialog
            mode={formState.mode}
            user={formState.mode === 'edit' ? formState.user : undefined}
            onClose={closeForm}
            onSaved={handleSave}
          />
        )}

        {deleteTarget && (
          <DeleteUserDialog
            user={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onDeleted={handleDelete}
          />
        )}
      </PageContainer>
    </AppLayout>
  )
}
