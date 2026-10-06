import { createBrowserRouter, Navigate } from 'react-router-dom'
import { StyleguidePage } from '../features/m1_core/pages/StyleguidePage'
import { LoginPage } from '../features/m1_core/pages/LoginPage'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { AppShell } from '../components/AppShell'
import { NotFoundPage } from '../features/m1_core/pages/NotFoundPage'
import { ErrorPage } from '../features/m1_core/pages/ErrorPage'
import { SessionExpiredPage } from '../features/m1_core/pages/SessionExpiredPage'

// Placeholders for dashboards
const AdminDashboard = () => <div className="p-6"><h1>Admin Dashboard Placeholder</h1></div>
const FacultyDashboard = () => <div className="p-6"><h1>Faculty Dashboard Placeholder</h1></div>
const StudentDashboard = () => <div className="p-6"><h1>Student Dashboard Placeholder</h1></div>

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/session-expired',
    element: <SessionExpiredPage />,
  },
  {
    path: '/styleguide',
    element: <StyleguidePage />,
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['Admin']}>
        <AppShell role="Admin" />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <AdminDashboard /> },
    ],
  },
  {
    path: '/faculty',
    element: (
      <ProtectedRoute allowedRoles={['Faculty']}>
        <AppShell role="Faculty" />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <FacultyDashboard /> },
    ],
  },
  {
    path: '/student',
    element: (
      <ProtectedRoute allowedRoles={['Student']}>
        <AppShell role="Student" />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <StudentDashboard /> },
    ],
  },
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
