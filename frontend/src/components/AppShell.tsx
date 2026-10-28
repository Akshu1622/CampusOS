import React, { useState } from 'react'
import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  Search, Bell, Menu, LayoutDashboard, Users, BookOpen, GraduationCap,
  Calendar, FileText, CreditCard, CheckSquare, ChevronDown, LogOut,
  Award, TrendingUp, Building2, BarChart3, ShieldCheck, Briefcase,
  ClipboardList, Home, PenSquare, X, ListOrdered, Shield
} from 'lucide-react'
import { Avatar, Dropdown } from '@/components/ui'

interface AppShellProps {
  role: 'Admin' | 'Faculty' | 'Student'
}

type NavItem =
  | { type: 'group'; label: string }
  | { type?: undefined; label: string; icon: React.ReactNode; href: string; badge?: number }

const adminNav: NavItem[] = [
  { type: 'group', label: 'MAIN MENU' },
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, href: '/admin' },
  { type: 'group', label: 'ACADEMICS' },
  { label: 'Students', icon: <Users size={18} />, href: '/admin/students' },
  { label: 'Course Catalog', icon: <BookOpen size={18} />, href: '/admin/academics/courses' },
  { label: 'Curriculum Mapping', icon: <FileText size={18} />, href: '/admin/academics/curriculum' },
  { label: 'Course Offerings', icon: <Calendar size={18} />, href: '/admin/academics/offerings' },
  { label: 'Enrollment', icon: <Users size={18} />, href: '/admin/academics/enrollment/records' },
  { label: 'Bulk Enrollment', icon: <CheckSquare size={18} />, href: '/admin/academics/enrollment/bulk' },
  { type: 'group', label: 'ATTENDANCE & EXAMS' },
  { label: 'Attendance Sessions', icon: <Calendar size={18} />, href: '/admin/attendance/sessions' },
  { label: 'Shortage Report', icon: <ClipboardList size={18} />, href: '/admin/attendance/shortage' },
  { label: 'Exam Management', icon: <FileText size={18} />, href: '/admin/exams/management' },
  { label: 'Exam Registrations', icon: <CheckSquare size={18} />, href: '/admin/exams/registrations' },
  { label: 'Process & Publish', icon: <Award size={18} />, href: '/admin/exams/results/process' },
  { label: 'Course Summary', icon: <TrendingUp size={18} />, href: '/admin/exams/results/summary' },
  { label: 'Grade Scale', icon: <ShieldCheck size={18} />, href: '/admin/exams/grade-scale' },
  { type: 'group', label: 'FINANCE' },
  { label: 'Fee Structures', icon: <CreditCard size={18} />, href: '/admin/finance/fee-structures' },
  { label: 'Fee Assignment', icon: <CheckSquare size={18} />, href: '/admin/finance/fee-assignment' },
  { label: 'Late Fee Rules', icon: <FileText size={18} />, href: '/admin/finance/late-fee-rules' },
  { label: 'Payment Ledger', icon: <BarChart3 size={18} />, href: '/admin/finance/ledger' },
  { label: 'Receipt History', icon: <FileText size={18} />, href: '/admin/finance/receipt-history' },
  { label: 'Defaulters', icon: <Users size={18} />, href: '/admin/finance/defaulters' },
  { label: 'Fee Audit Log', icon: <ShieldCheck size={18} />, href: '/admin/finance/audit' },
  { type: 'group', label: 'HR & PAYROLL' },
  { label: 'Employees', icon: <Briefcase size={18} />, href: '/admin/hr/employees' },
  { label: 'Designations', icon: <Award size={18} />, href: '/admin/hr/designations' },
  { label: 'Leave Types', icon: <Calendar size={18} />, href: '/admin/hr/leave-types' },
  { label: 'Leave Approvals', icon: <CheckSquare size={18} />, href: '/admin/hr/leave-approvals' },
  { label: 'Salary Structures', icon: <CreditCard size={18} />, href: '/admin/hr/salary-structures' },
  { label: 'Run Payroll', icon: <CreditCard size={18} />, href: '/admin/hr/payroll-run' },
  { label: 'Payroll Register', icon: <FileText size={18} />, href: '/admin/hr/payroll-register' },
  { type: 'group', label: 'HOSTEL' },
  { label: 'Occupancy', icon: <Home size={18} />, href: '/admin/hostel/occupancy-dashboard' },
  { label: 'Rooms', icon: <Building2 size={18} />, href: '/admin/hostel/management' },
  { label: 'Allocations', icon: <Users size={18} />, href: '/admin/hostel/room-allocation' },
  { label: 'Hostel Fees', icon: <CreditCard size={18} />, href: '/admin/hostel/fees' },
  { label: 'Requests', icon: <ClipboardList size={18} />, href: '/admin/hostel/requests' },
  { label: 'Integrity Guardian', icon: <ShieldCheck size={18} />, href: '/admin/hostel/guardian' },
  { label: 'Smart Allocation Lab', icon: <Award size={18} />, href: '/admin/hostel/smart-allocation' },
  { label: 'Capacity Simulator', icon: <BarChart3 size={18} />, href: '/admin/hostel/simulator' },
  { label: 'Change Impact Radar', icon: <TrendingUp size={18} />, href: '/admin/hostel/radar' },
  { label: 'Student Journey', icon: <Users size={18} />, href: '/admin/hostel/journey' },
  { label: 'Complaints Desk', icon: <ClipboardList size={18} />, href: '/admin/hostel/complaints' },
  { label: 'Visual Floor Map', icon: <Home size={18} />, href: '/admin/hostel/map' },
  { label: 'Waitlist Queue', icon: <ListOrdered size={18} />, href: '/admin/hostel/waitlist' },
  { label: 'Visitor Desk', icon: <Shield size={18} />, href: '/admin/hostel/visitors' },
  { type: 'group', label: 'ADMINISTRATION' },
  { label: 'Users & Access', icon: <Users size={18} />, href: '/admin/users' },
  { label: 'Roles', icon: <ShieldCheck size={18} />, href: '/admin/roles' },
  { label: 'Departments', icon: <Building2 size={18} />, href: '/admin/departments' },
  { label: 'Programs', icon: <GraduationCap size={18} />, href: '/admin/programs' },
  { label: 'Terms', icon: <Calendar size={18} />, href: '/admin/terms' },
  { type: 'group', label: 'ANALYTICS' },
  { label: 'Reports Hub', icon: <BarChart3 size={18} />, href: '/admin/analytics/reports' },
  { label: 'Audit Log', icon: <FileText size={18} />, href: '/admin/analytics/audit-logs' },
  { label: 'Integrity Status', icon: <ShieldCheck size={18} />, href: '/admin/analytics/integrity-checks' },
]

const facultyNav: NavItem[] = [
  { type: 'group', label: 'MAIN MENU' },
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, href: '/faculty' },
  { label: 'My Teaching', icon: <BookOpen size={18} />, href: '/faculty/teaching' },
  { type: 'group', label: 'TEACHING' },
  { label: 'Mark Attendance', icon: <PenSquare size={18} />, href: '/faculty/attendance' },
  { label: 'Attendance History', icon: <ClipboardList size={18} />, href: '/faculty/attendance/history' },
  { label: 'Attendance Shortage', icon: <Users size={18} />, href: '/faculty/attendance/shortage' },
  { label: 'Marks Entry', icon: <CheckSquare size={18} />, href: '/faculty/marks' },
  { label: 'Course Summary', icon: <TrendingUp size={18} />, href: '/faculty/results/summary' },
  { type: 'group', label: 'ME' },
  { label: 'Apply Leave', icon: <Calendar size={18} />, href: '/faculty/hr/apply-leave' },
  { label: 'My Leave', icon: <FileText size={18} />, href: '/faculty/hr/my-leave' },
  { label: 'My Payslips', icon: <CreditCard size={18} />, href: '/faculty/hr/payslips' },
]

const studentNav: NavItem[] = [
  { type: 'group', label: 'MAIN MENU' },
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, href: '/student' },
  { label: 'My Courses', icon: <BookOpen size={18} />, href: '/student/courses' },
  { type: 'group', label: 'ACADEMICS' },
  { label: 'My Attendance', icon: <Calendar size={18} />, href: '/student/attendance' },
  { label: 'Exam Registration', icon: <CheckSquare size={18} />, href: '/student/exams/registration' },
  { label: 'My Results', icon: <Award size={18} />, href: '/student/results' },
  { type: 'group', label: 'FINANCE' },
  { label: 'Fees & Dues', icon: <CreditCard size={18} />, href: '/student/fees' },
  { label: 'Receipt History', icon: <FileText size={18} />, href: '/student/receipt-history' },
  { type: 'group', label: 'CAMPUS' },
  { label: 'My Hostel', icon: <Home size={18} />, href: '/student/hostel' },
  { label: 'My Hostel Requests', icon: <ClipboardList size={18} />, href: '/student/hostel/requests' },
  { type: 'group', label: 'ME' },
  { label: 'Profile', icon: <Users size={18} />, href: `/${role().toLowerCase()}/profile` },
]

// helper needed because studentNav references role()
function role() { return 'student' }

const navMap = {
  Admin: adminNav,
  Faculty: facultyNav,
  Student: studentNav,
}

const roleColors: Record<string, string> = {
  Admin: '#3B4FE0',
  Faculty: '#7C3AED',
  Student: '#0D9488',
}

export function AppShell({ role }: AppShellProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [searchValue, setSearchValue] = useState('')

  const currentNav = navMap[role]
  const roleColor = roleColors[role]

  const profileMenuItems = [
    { id: 'profile', label: 'View profile', onClick: () => navigate(`/${role.toLowerCase()}/profile`) },
    { id: 'pwd', label: 'Change password', onClick: () => {} },
    { id: 'shortcuts', label: 'Keyboard shortcuts', dividerBefore: true, onClick: () => {} },
    { id: 'logout', label: 'Log out', icon: <LogOut size={16} />, danger: true, dividerBefore: true, onClick: logout }
  ]

  const isActive = (href: string) => {
    if (href === `/${role.toLowerCase()}`) return location.pathname === href
    return location.pathname.startsWith(href)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>

      {/* ─── Sidebar ─── */}
      <aside style={{
        width: isSidebarOpen ? '248px' : '72px',
        backgroundColor: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 200ms ease',
        position: 'fixed',
        top: 0, bottom: 0, left: 0,
        zIndex: 100,
        overflowX: 'hidden',
      }}>

        {/* Logo row */}
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          padding: isSidebarOpen ? '0 20px' : '0',
          justifyContent: isSidebarOpen ? 'flex-start' : 'center',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
          gap: '10px'
        }}>
          <div style={{
            width: '34px', height: '34px',
            backgroundColor: 'var(--color-primary)',
            borderRadius: '9px',
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <GraduationCap size={18} color="white" />
          </div>
          {isSidebarOpen && (
            <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.2px', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
              CampusOS
            </span>
          )}
        </div>

        {/* Term chip */}
        {isSidebarOpen && (
          <div style={{ padding: '12px 16px 0' }}>
            <div style={{
              padding: '8px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--color-surface-muted)',
              cursor: 'default'
            }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Term 2025-26</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Spring · Semester 5</div>
              </div>
              <ChevronDown size={13} color="var(--color-text-muted)" />
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}
          aria-label="Main navigation"
        >
          {currentNav.map((item, index) => {
            if ('type' in item && item.type === 'group') {
              return isSidebarOpen ? (
                <div
                  key={index}
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginTop: index === 0 ? '8px' : '20px',
                    marginBottom: '4px',
                    paddingLeft: '8px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.label}
                </div>
              ) : (
                <div key={index} style={{ height: '12px' }} />
              )
            }

            const active = isActive(item.href)
            return (
              <NavLink
                key={index}
                to={item.href}
                title={!isSidebarOpen ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: isSidebarOpen ? '8px 10px' : '10px',
                  borderRadius: '7px',
                  backgroundColor: active ? 'var(--color-primary)' : 'transparent',
                  color: active ? 'white' : 'var(--color-text-secondary)',
                  textDecoration: 'none',
                  justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                  transition: 'background-color 120ms, color 120ms',
                  gap: '10px',
                  position: 'relative',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-muted)'
                    e.currentTarget.style.color = 'var(--color-text-primary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'var(--color-text-secondary)'
                  }
                }}
              >
                <span style={{ flexShrink: 0, lineHeight: 0 }}>{item.icon}</span>
                {isSidebarOpen && (
                  <span style={{ fontSize: '13.5px', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.label}
                  </span>
                )}
                {isSidebarOpen && 'badge' in item && item.badge ? (
                  <span style={{
                    fontSize: '11px', fontWeight: 600,
                    background: active ? 'rgba(255,255,255,0.25)' : 'var(--color-warning-bg)',
                    color: active ? 'white' : 'var(--color-warning)',
                    padding: '1px 7px', borderRadius: '99px', flexShrink: 0
                  }}>
                    {item.badge}
                  </span>
                ) : null}
              </NavLink>
            )
          })}
        </nav>

        {/* Profile block */}
        <div style={{
          borderTop: '1px solid var(--color-border)',
          padding: isSidebarOpen ? '12px 14px' : '12px 10px',
          flexShrink: 0
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            justifyContent: isSidebarOpen ? 'flex-start' : 'center',
          }}>
            <Avatar name={user?.username || 'User'} size="sm" />
            {isSidebarOpen && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.username || 'User'}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: 'white',
                  background: roleColor,
                  display: 'inline-block',
                  padding: '1px 7px',
                  borderRadius: '99px',
                  fontWeight: 600,
                  marginTop: '2px'
                }}>
                  {role}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ─── Main content ─── */}
      <main style={{
        flex: 1,
        marginLeft: isSidebarOpen ? '248px' : '72px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'margin-left 200ms ease',
        minWidth: 0,
        minHeight: '100vh'
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
          zIndex: 90,
          gap: '16px'
        }}>
          {/* Left: toggle + search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Toggle sidebar"
              style={{
                color: 'var(--color-text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px', borderRadius: '8px',
                border: '1px solid var(--color-border)',
                transition: 'background 120ms, color 120ms',
                flexShrink: 0
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-muted)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
            >
              <Menu size={17} />
            </button>

            {/* Search */}
            <div style={{ position: 'relative', width: '280px', maxWidth: '400px' }}>
              <Search size={15} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
              <input
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                placeholder="Search students, courses, receipts…"
                aria-label="Global search"
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 56px 0 34px',
                  borderRadius: '99px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-muted)',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'border-color 120ms',
                  color: 'var(--color-text-primary)'
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-primary-subtle)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              {searchValue ? (
                <button
                  onClick={() => setSearchValue('')}
                  aria-label="Clear search"
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', lineHeight: 0 }}
                >
                  <X size={14} />
                </button>
              ) : (
                <kbd style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '10px', color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)', padding: '2px 5px',
                  borderRadius: '4px', lineHeight: 1, fontFamily: 'inherit'
                }}>⌘K</kbd>
              )}
            </div>
          </div>

          {/* Right: bell + profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              aria-label="Notifications"
              style={{
                position: 'relative', color: 'var(--color-text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px', borderRadius: '8px',
                border: '1px solid var(--color-border)',
                transition: 'background 120ms, color 120ms'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-muted)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
            >
              <Bell size={17} />
              <span style={{
                position: 'absolute', top: '6px', right: '6px',
                width: '7px', height: '7px',
                backgroundColor: 'var(--color-error)',
                borderRadius: '50%',
                border: '1.5px solid white'
              }} />
            </button>

            <div style={{ width: '1px', height: '20px', background: 'var(--color-border)', margin: '0 4px' }} />

            <Dropdown
              align="right"
              trigger={
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  cursor: 'pointer', padding: '4px 8px 4px 4px',
                  borderRadius: '8px', border: '1px solid var(--color-border)',
                  transition: 'background 120ms',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-muted)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
                >
                  <Avatar name={user?.username || 'User'} size="sm" />
                  <div style={{ lineHeight: 1.3 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {user?.username || 'User'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{role}</div>
                  </div>
                  <ChevronDown size={13} color="var(--color-text-muted)" />
                </div>
              }
              items={profileMenuItems}
            />
          </div>
        </header>

        {/* Page canvas */}
        <div
          className="page-enter"
          style={{ padding: '24px', flex: 1 }}
          key={location.pathname}
        >
          <Outlet />
        </div>
      </main>
    </div>
  )
}
