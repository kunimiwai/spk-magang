import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { AuthLoadingScreen } from '../components/auth/AuthLoadingScreen'

/**
 * The shared "/" entry point sends each authenticated role to the dashboard
 * that actually reads data from the backend. No generic status page is shown
 * in place of a role dashboard.
 */
export default function HomePage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  switch (user.role) {
    case 'admin':
    case 'prodi':
      return <Navigate to="/admin" replace />
    case 'mahasiswa':
      return <Navigate to="/mahasiswa/dashboard" replace />
    case 'dpm':
      return <Navigate to="/dpm" replace />
    default:
      return <Navigate to="/profil" replace />
  }
}
