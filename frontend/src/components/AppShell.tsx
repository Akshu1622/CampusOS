import React, { useState } from 'react'
import { Outlet, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  Search, Bell, Menu, LayoutDashboard, Users, BookOpen, GraduationCap,
  Calendar, FileText, CreditCard, Clock, CheckSquare, XCircle, ChevronDown, LogOut
} from 'lucide-react'
import { Avatar, Dropdown } from '@/components/ui'

interface AppShellProps {
  role: 'Admin' | 'Faculty' | 'Student'
}

export function AppShell({ role }: AppShellProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const adminNav = [
    { label: 'MAIN MENU', type: 'group' },
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/admin' },
    { label: 'USERS & ACCESS', type: 'group' },
    { label: 'Users', icon: <Users size={20} />, href: '/admin/users' },
    { label: 'Roles & Permissions', icon: <CheckSquare size={20} />, href: '/admin/roles' },
    { label: 'MASTER DATA', type: 'group' },
    { label: 'Departments', icon: <FileText size={20} />, href: '/admin/departments' },
    { label: 'Programs', icon: <GraduationCap size={20} />, href: '/admin/programs' },
    { label: 'Terms', icon: <Calendar size={20} />, href: '/admin/terms' },
    { label: 'Students', icon: <Users size={20} />, href: '/admin/students' },
    // { label: 'ACADEMICS', type: 'group' },
    // { label: 'Courses', icon: <BookOpen size={20} />, href: '/admin/courses' },
    // { label: 'ATTENDANCE & EXAMS', type: 'group' },
    // { label: 'Attendance', icon: <Calendar size={20} />, href: '/admin/attendance' },
    // { label: 'Exams', icon: <FileText size={20} />, href: '/admin/exams' },
    { label: 'FINANCE & FEES', type: 'group' },
    { label: 'Fee Structures', icon: <CreditCard size={20} />, href: '/admin/finance/fee-structures' },
    { label: 'Fee Assignment', icon: <CheckSquare size={20} />, href: '/admin/finance/fee-assignment' },
    { label: 'Late Fee Rules', icon: <FileText size={20} />, href: '/admin/finance/late-fee-rules' },
    { label: 'Receipt History', icon: <FileText size={20} />, href: '/admin/finance/receipt-history' },
    { label: 'Payment Ledger', icon: <FileText size={20} />, href: '/admin/finance/ledger' },
    { label: 'Fee Defaulters', icon: <Users size={20} />, href: '/admin/finance/defaulters' },
    { label: 'Audit Log', icon: <CheckSquare size={20} />, href: '/admin/finance/audit' },
    { label: 'HR & PAYROLL', type: 'group' },
    { label: 'Employees', icon: <Users size={20} />, href: '/admin/hr/employees' },
    { label: 'Designations', icon: <CheckSquare size={20} />, href: '/admin/hr/designations' },
    { label: 'Leave Types', icon: <FileText size={20} />, href: '/admin/hr/leave-types' },
    { label: 'Leave Approvals', icon: <CheckSquare size={20} />, href: '/admin/hr/leave-approvals' },
    { label: 'Salary Structures', icon: <CreditCard size={20} />, href: '/admin/hr/salary-structures' },
    { label: 'Payroll Run', icon: <CreditCard size={20} />, href: '/admin/hr/payroll-run' },
    { label: 'Payroll Register', icon: <FileText size={20} />, href: '/admin/hr/payroll-register' },
    { label: 'HOSTEL & ACCOMMODATION', type: 'group' },
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/admin/hostel/occupancy-dashboard' },
    { label: 'Management', icon: <CheckSquare size={20} />, href: '/admin/hostel/management' },
    { label: 'Room Allocation', icon: <Users size={20} />, href: '/admin/hostel/room-allocation' },
    { label: 'Hostel Requests', icon: <FileText size={20} />, href: '/admin/hostel/requests' },
    { label: 'ANALYTICS & REPORTS', type: 'group' },
    { label: 'Reports Hub', icon: <FileText size={20} />, href: '/admin/analytics/reports' },
    { label: 'Audit Log', icon: <CheckSquare size={20} />, href: '/admin/analytics/audit-logs' },
    { label: 'Integrity Status', icon: <CheckSquare size={20} />, href: '/admin/analytics/integrity-checks' },
  ]

  const facultyNav = [
    { label: 'MAIN MENU', type: 'group' },
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/faculty' },
    // { label: 'My Courses', icon: <BookOpen size={20} />, href: '/faculty/courses' },
    // { label: 'TEACHING', type: 'group' },
    // { label: 'Attendance', icon: <Calendar size={20} />, href: '/faculty/attendance' },
    { label: 'HR & LEAVE', type: 'group' },
    { label: 'Apply Leave', icon: <Calendar size={20} />, href: '/faculty/hr/apply-leave' },
    { label: 'My Leave', icon: <FileText size={20} />, href: '/faculty/hr/my-leave' },
    { label: 'Payslips', icon: <CreditCard size={20} />, href: '/faculty/hr/payslips' },
  ]

  const studentNav = [
    { label: 'MAIN MENU', type: 'group' },
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/student' },
    // { label: 'My Courses', icon: <BookOpen size={20} />, href: '/student/courses' },
    // { label: 'ACADEMICS', type: 'group' },
    // { label: 'Attendance', icon: <Calendar size={20} />, href: '/student/attendance' },
    { label: 'FINANCE', type: 'group' },
    { label: 'My Fees & Dues', icon: <CreditCard size={20} />, href: '/student/fees' },
    { label: 'Receipt History', icon: <FileText size={20} />, href: '/student/receipt-history' },
    { label: 'HOSTEL', type: 'group' },
    { label: 'My Hostel', icon: <CheckSquare size={20} />, href: '/student/hostel' },
    { label: 'My Requests', icon: <FileText size={20} />, href: '/student/hostel/requests' },
  ]

  const navMap = {
    Admin: adminNav,
    Faculty: facultyNav,
    Student: studentNav
  }

  const currentNav = navMap[role]

  const profileMenuItems = [
    { id: 'profile', label: 'View profile', onClick: () => navigate(`/${role.toLowerCase()}/profile`) },
    { id: 'pwd', label: 'Change password', onClick: () => {} },
    { id: 'shortcuts', label: 'Keyboard shortcuts', dividerBefore: true, onClick: () => {} },
    { id: 'logout', label: 'Log out', icon: <LogOut size={16} />, danger: true, dividerBefore: true, onClick: logout }
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: isSidebarOpen ? '248px' : '72px',
        backgroundColor: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 200ms ease',
        position: 'fixed',
        top: 0, bottom: 0, left: 0,
        zIndex: 100
      }}>
        <div style={{ height: '64px', display: 'flex', alignItems: 'center', padding: isSidebarOpen ? '0 24px' : '0 16px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--color-primary)', borderRadius: '8px', flexShrink: 0 }} />
          {isSidebarOpen && (
            <span style={{ marginLeft: '12px', fontWeight: 700, fontSize: '16px' }}>CampusOS</span>
          )}
        </div>
        
        {isSidebarOpen && (
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Term 2025-26</span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Sem 5</span>
              </div>
              <ChevronDown size={14} color="var(--color-text-muted)" />
            </div>
          </div>
        )}

        <nav style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {currentNav.map((item, index) => {
            if (item.type === 'group') {
              return isSidebarOpen ? (
                <div key={index} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.04em', marginTop: '16px', marginBottom: '8px', paddingLeft: '8px' }}>
                  {item.label}
                </div>
              ) : (
                <div key={index} style={{ height: '16px' }} />
              )
            }
            
            const isActive = location.pathname === item.href
            return (
              <Link
                key={index}
                to={item.href || '#'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                  color: isActive ? 'white' : 'var(--color-text-secondary)',
                  textDecoration: 'none',
                  justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                  transition: 'background-color 150ms'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-muted)'
                    e.currentTarget.style.color = 'var(--color-text-primary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'var(--color-text-secondary)'
                  }
                }}
              >
                {item.icon}
                {isSidebarOpen && <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: 500 }}>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        marginLeft: isSidebarOpen ? '248px' : '72px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'margin-left 200ms ease',
        minWidth: 0 // Prevent flex children from overflowing
      }}>
        {/* Header */}
        <header style={{
          height: '64px',
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 90
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ color: 'var(--color-text-secondary)' }}>
              <Menu size={20} />
            </button>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--color-text-muted)' }} />
              <input
                placeholder="Search students, courses..."
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '8px 12px 8px 36px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-muted)',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <div style={{ position: 'absolute', right: '12px', top: '9px', fontSize: '10px', border: '1px solid var(--color-border-strong)', padding: '2px 4px', borderRadius: '4px', color: 'var(--color-text-muted)' }}>⌘K</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button style={{ position: 'relative', color: 'var(--color-text-secondary)' }}>
              <Bell size={20} />
              <span style={{ position: 'absolute', top: -2, right: -2, width: '8px', height: '8px', backgroundColor: 'var(--color-error)', borderRadius: '50%' }} />
            </button>
            
            <Dropdown
              align="right"
              trigger={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <Avatar name={user?.username || 'User'} size="sm" />
                </div>
              }
              items={profileMenuItems}
            />
          </div>
        </header>

        {/* Canvas */}
        <div style={{ padding: '24px', flex: 1 }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
