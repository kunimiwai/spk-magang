import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { RoleRoute } from './components/auth/RoleRoute'
import { ROUTE_ROLE_GROUPS } from './lib/routeAccess'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AdminAnalyticsPage from './pages/AdminAnalyticsPage'
import AdminApplicationDetailPage from './pages/AdminApplicationDetailPage'
import AdminApplicationsPage from './pages/AdminApplicationsPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import CoursesPage from './pages/CoursesPage'
import CriteriaPage from './pages/CriteriaPage'
import DpmAssignmentsPage from './pages/DpmAssignmentsPage'
import DpmAssignmentDetailPage from './pages/DpmAssignmentDetailPage'
import DpmDashboardPage from './pages/DpmDashboardPage'
import PartnersPage from './pages/PartnersPage'
import ProfilePage from './pages/ProfilePage'
import RecommendationPage from './pages/RecommendationPage'
import StudentApplicationDetailPage from './pages/StudentApplicationDetailPage'
import StudentApplicationsPage from './pages/StudentApplicationsPage'
import StudentDashboardPage from './pages/StudentDashboardPage'
import StudentDataPage from './pages/StudentDataPage'
import StudentGradesPage from './pages/StudentGradesPage'
import StudentPartnersPage from './pages/StudentPartnersPage'
import SystemSettingsPage from './pages/SystemSettingsPage'
import UsersPage from './pages/UsersPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage />}
      />
      <Route
        path="/reset-password"
        element={<ResetPasswordPage />}
      />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/mitra"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLE_GROUPS.adminOnly}>
              <PartnersPage />
            </RoleRoute>
          }
        />
        <Route
          path="/kriteria"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLE_GROUPS.adminProdi}>
              <CriteriaPage />
            </RoleRoute>
          }
        />
        <Route
          path="/mata-kuliah"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLE_GROUPS.adminProdi}>
              <CoursesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLE_GROUPS.adminProdi}>
              <AdminDashboardPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/pengajuan"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLE_GROUPS.adminProdi}>
              <AdminApplicationsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/analitik"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLE_GROUPS.adminProdi}>
              <AdminAnalyticsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/pengaturan"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLE_GROUPS.adminProdi}>
              <SystemSettingsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/pengguna"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLE_GROUPS.adminOnly}>
              <UsersPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/pengajuan/:id"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLE_GROUPS.adminProdi}>
              <AdminApplicationDetailPage />
            </RoleRoute>
          }
        />
        <Route
          path="/mahasiswa/dashboard"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLE_GROUPS.mahasiswaOnly}>
              <StudentDashboardPage />
            </RoleRoute>
          }
        />
        <Route
          path="/mahasiswa/pengajuan"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLE_GROUPS.mahasiswaOnly}>
              <StudentApplicationsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/mahasiswa/pengajuan/:id"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLE_GROUPS.mahasiswaOnly}>
              <StudentApplicationDetailPage />
            </RoleRoute>
          }
        />
        <Route
          path="/mahasiswa/mitra"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLE_GROUPS.mahasiswaOnly}>
              <StudentPartnersPage />
            </RoleRoute>
          }
        />
        <Route
          path="/mahasiswa/rekomendasi"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLE_GROUPS.mahasiswaOnly}>
              <RecommendationPage />
            </RoleRoute>
          }
        />
        <Route
          path="/mahasiswa"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLE_GROUPS.mahasiswaOnly}>
              <StudentDataPage />
            </RoleRoute>
          }
        />
        <Route
          path="/mahasiswa/nilai"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLE_GROUPS.mahasiswaOnly}>
              <StudentGradesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/profil"
          element={<ProfilePage />}
        />
        <Route
          path="/dpm"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLE_GROUPS.dpmOnly}>
              <DpmDashboardPage />
            </RoleRoute>
          }
        />
        <Route
          path="/dpm/bimbingan"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLE_GROUPS.dpmOnly}>
              <DpmAssignmentsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/dpm/bimbingan/:id"
          element={
            <RoleRoute allowedRoles={ROUTE_ROLE_GROUPS.dpmOnly}>
              <DpmAssignmentDetailPage />
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
