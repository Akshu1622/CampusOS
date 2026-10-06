import { createBrowserRouter, Navigate } from 'react-router-dom'
import { StyleguidePage } from '../features/m1_core/pages/StyleguidePage'
import { LoginPage } from '../features/m1_core/pages/LoginPage'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { AppShell } from '../components/AppShell'
import { NotFoundPage } from '../features/m1_core/pages/NotFoundPage'
import { ErrorPage } from '../features/m1_core/pages/ErrorPage'
import { SessionExpiredPage } from '../features/m1_core/pages/SessionExpiredPage'

import { ProfilePage } from '../features/m1_core/pages/ProfilePage'
import { UserManagementPage } from '../features/m1_core/pages/UserManagementPage'
import { RoleManagementPage } from '../features/m1_core/pages/RoleManagementPage'
import { DepartmentManagementPage } from '../features/m1_core/pages/DepartmentManagementPage'
import { ProgramManagementPage } from '../features/m1_core/pages/ProgramManagementPage'
import { TermManagementPage } from '../features/m1_core/pages/TermManagementPage'
import { StudentMasterPage } from '../features/m1_core/pages/StudentMasterPage'
import {
  FeeStructureManagementPage,
  FeeAssignmentWizardPage,
  LateFeeRuleConfigPage,
  MyFeesAndDuesPage,
  PayFeeWizardPage,
  PaymentConfirmationReceiptPage,
  ReceiptPaymentHistoryPage,
  PaymentLedgerPage,
  FeeDefaultersPage,
  FeeChangeAuditLogPage,
} from '../features/m4_finance/pages'

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
      { path: 'profile', element: <ProfilePage /> },
      { path: 'users', element: <UserManagementPage /> },
      { path: 'roles', element: <RoleManagementPage /> },
      { path: 'departments', element: <DepartmentManagementPage /> },
      { path: 'programs', element: <ProgramManagementPage /> },
      { path: 'terms', element: <TermManagementPage /> },
      { path: 'students', element: <StudentMasterPage /> },
      { path: 'finance/fee-structures', element: <FeeStructureManagementPage /> },
      { path: 'finance/fee-assignment', element: <FeeAssignmentWizardPage /> },
      { path: 'finance/late-fee-rules', element: <LateFeeRuleConfigPage /> },
      { path: 'finance/receipt-history', element: <ReceiptPaymentHistoryPage /> },
      { path: 'finance/ledger', element: <PaymentLedgerPage /> },
      { path: 'finance/defaulters', element: <FeeDefaultersPage /> },
      { path: 'finance/audit', element: <FeeChangeAuditLogPage /> },
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
      { path: 'profile', element: <ProfilePage /> },
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
      { path: 'profile', element: <ProfilePage /> },
      { path: 'fees', element: <MyFeesAndDuesPage /> },
      { path: 'pay', element: <PayFeeWizardPage /> },
      { path: 'receipt/:id', element: <PaymentConfirmationReceiptPage /> },
      { path: 'receipt-history', element: <ReceiptPaymentHistoryPage /> },
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
