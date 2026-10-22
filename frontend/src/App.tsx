import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { RoleRoute } from './components/auth/RoleRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import AdminAnalyticsPage from './pages/AdminAnalyticsPage'
import AdminApplicationDetailPage from './pages/AdminApplicationDetailPage'
import AdminApplicationsPage from './pages/AdminApplicationsPage'
import CoursesPage from './pages/CoursesPage'
import CriteriaPage from './pages/CriteriaPage'
import DpmAssignmentsPage from './pages/DpmAssignmentsPage'
import PartnersPage from './pages/PartnersPage'
import ProfilePage from './pages/ProfilePage'
import RecommendationPage from './pages/RecommendationPage'
import StudentApplicationsPage from './pages/StudentApplicationsPage'
import StudentDashboardPage from './pages/StudentDashboardPage'
import StudentDataPage from './pages/StudentDataPage'
import StudentGradesPage from './pages/StudentGradesPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/mitra"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <PartnersPage />
            </RoleRoute>
          }
        />
        <Route
          path="/kriteria"
          element={
            <RoleRoute allowedRoles={['admin', 'prodi']}>
              <CriteriaPage />
            </RoleRoute>
          }
        />
        <Route
          path="/mata-kuliah"
          element={
            <RoleRoute allowedRoles={['admin', 'prodi']}>
              <CoursesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/pengajuan"
          element={
            <RoleRoute allowedRoles={['admin', 'prodi']}>
              <AdminApplicationsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/analitik"
          element={
            <RoleRoute allowedRoles={['admin', 'prodi']}>
              <AdminAnalyticsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/pengajuan/:id"
          element={
            <RoleRoute allowedRoles={['admin', 'prodi']}>
              <AdminApplicationDetailPage />
            </RoleRoute>
          }
        />
        <Route
          path="/mahasiswa/dashboard"
          element={
            <RoleRoute allowedRoles={['mahasiswa']}>
              <StudentDashboardPage />
            </RoleRoute>
          }
        />
        <Route
          path="/mahasiswa/pengajuan"
          element={
            <RoleRoute allowedRoles={['mahasiswa']}>
              <StudentApplicationsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/mahasiswa/rekomendasi"
          element={
            <RoleRoute allowedRoles={['mahasiswa']}>
              <RecommendationPage />
            </RoleRoute>
          }
        />
        <Route
          path="/mahasiswa"
          element={
            <RoleRoute allowedRoles={['mahasiswa']}>
              <StudentDataPage />
            </RoleRoute>
          }
        />
        <Route
          path="/mahasiswa/nilai"
          element={
            <RoleRoute allowedRoles={['mahasiswa']}>
              <StudentGradesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/profil"
          element={<ProfilePage />}
        />
        <Route
          path="/dpm/bimbingan"
          element={
            <RoleRoute allowedRoles={['dpm']}>
              <DpmAssignmentsPage />
            </RoleRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
