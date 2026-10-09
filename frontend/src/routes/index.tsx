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
  A01CourseCatalogPage,
  A02CurriculumMappingPage,
  A03CourseOfferingsPage,
  A04IndividualEnrollmentPage,
  A05BulkEnrollmentPage,
  A06EnrollmentRecordsPage,
  A07MyCoursesPage,
  A08MyTeachingPage,
} from '../features/m2_academics/pages'
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
import {
  EmployeeMasterPage,
  DesignationManagementPage,
  LeaveTypePolicyPage,
  ApplyLeavePage,
  MyLeavePage,
  LeaveApprovalsPage,
  SalaryStructureManagementPage,
  PayrollRunPage,
  PayrollRegisterPage,
  MyPayslipsPage,
} from '../features/m5_hr/pages'
import {
  S01HostelRoomManagementPage,
  S02RoomAllocationPage,
  S03HostelOccupancyDashboardPage,
  S04MyHostelPage,
  S05NewHostelRequestPage,
  S06MyHostelRequestsPage,
  S07HostelRequestReviewPage,
} from '../features/m6_hostel/pages'

import {
  AdminDashboardPage,
  FacultyDashboardPage,
  StudentDashboardPage,
  R01ReportsHubPage,
  R02ReportPage,
  R03AuditLogViewerPage,
  R04DataIntegrityStatusPage,
} from '../features/m7_analytics/pages'

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
      { index: true, element: <AdminDashboardPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'users', element: <UserManagementPage /> },
      { path: 'roles', element: <RoleManagementPage /> },
      { path: 'departments', element: <DepartmentManagementPage /> },
      { path: 'programs', element: <ProgramManagementPage /> },
      { path: 'terms', element: <TermManagementPage /> },
      { path: 'students', element: <StudentMasterPage /> },
      { path: 'academics/courses', element: <A01CourseCatalogPage /> },
      { path: 'courses', element: <A01CourseCatalogPage /> },
      { path: 'academics/curriculum', element: <A02CurriculumMappingPage /> },
      { path: 'academics/offerings', element: <A03CourseOfferingsPage /> },
      { path: 'academics/enrollment/individual', element: <A04IndividualEnrollmentPage /> },
      { path: 'academics/enrollment/bulk', element: <A05BulkEnrollmentPage /> },
      { path: 'academics/enrollment/records', element: <A06EnrollmentRecordsPage /> },
      { path: 'enrollments/records', element: <A06EnrollmentRecordsPage /> },
      { path: 'finance/fee-structures', element: <FeeStructureManagementPage /> },
      { path: 'finance/fee-assignment', element: <FeeAssignmentWizardPage /> },
      { path: 'finance/late-fee-rules', element: <LateFeeRuleConfigPage /> },
      { path: 'finance/receipt-history', element: <ReceiptPaymentHistoryPage /> },
      { path: 'finance/ledger', element: <PaymentLedgerPage /> },
      { path: 'finance/defaulters', element: <FeeDefaultersPage /> },
      { path: 'finance/audit', element: <FeeChangeAuditLogPage /> },
      { path: 'hr/employees', element: <EmployeeMasterPage /> },
      { path: 'hr/designations', element: <DesignationManagementPage /> },
      { path: 'hr/leave-types', element: <LeaveTypePolicyPage /> },
      { path: 'hr/leave-approvals', element: <LeaveApprovalsPage /> },
      { path: 'hr/salary-structures', element: <SalaryStructureManagementPage /> },
      { path: 'hr/payroll-run', element: <PayrollRunPage /> },
      { path: 'hr/payroll-register', element: <PayrollRegisterPage /> },
      { path: 'hostel/management', element: <S01HostelRoomManagementPage /> },
      { path: 'hostel/room-allocation', element: <S02RoomAllocationPage /> },
      { path: 'hostel/occupancy-dashboard', element: <S03HostelOccupancyDashboardPage /> },
      { path: 'hostel/requests', element: <S07HostelRequestReviewPage /> },
      { path: 'analytics/reports', element: <R01ReportsHubPage /> },
      { path: 'analytics/reports/:reportKey', element: <R02ReportPage /> },
      { path: 'analytics/audit-logs', element: <R03AuditLogViewerPage /> },
      { path: 'analytics/integrity-checks', element: <R04DataIntegrityStatusPage /> },
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
      { index: true, element: <FacultyDashboardPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'courses', element: <A08MyTeachingPage /> },
      { path: 'teaching', element: <A08MyTeachingPage /> },
      { path: 'hr/apply-leave', element: <ApplyLeavePage /> },
      { path: 'hr/my-leave', element: <MyLeavePage /> },
      { path: 'hr/payslips', element: <MyPayslipsPage /> },
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
      { index: true, element: <StudentDashboardPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'courses', element: <A07MyCoursesPage /> },
      { path: 'fees', element: <MyFeesAndDuesPage /> },
      { path: 'pay', element: <PayFeeWizardPage /> },
      { path: 'receipt/:id', element: <PaymentConfirmationReceiptPage /> },
      { path: 'receipt-history', element: <ReceiptPaymentHistoryPage /> },
      { path: 'hostel', element: <S04MyHostelPage /> },
      { path: 'hostel/new-request', element: <S05NewHostelRequestPage /> },
      { path: 'hostel/requests', element: <S06MyHostelRequestsPage /> },
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
