import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api'
import { StatCard } from '../../../components/ui/StatCard'
import { Card } from '../../../components/ui/Card'
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton'
import { ErrorState } from '../../../components/ui/ErrorState'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { StatusPill } from '../../../components/ui/StatusPill'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts'
import {
  Users, BookOpen, CreditCard, Building2, AlertTriangle,
  ArrowRight, TrendingUp, CheckSquare, Calendar, FileText,
  RefreshCw, Clock, GraduationCap
} from 'lucide-react'

const FEE_COLORS = [
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-info)',
  'var(--color-error)'
]

const QUICK_LINKS = [
  { label: 'Add Student', icon: <Users size={18} />, href: '/admin/students', color: '#3B4FE0' },
  { label: 'Bulk Enroll', icon: <BookOpen size={18} />, href: '/admin/academics/enrollment/bulk', color: '#7C3AED' },
  { label: 'Fee Assignment', icon: <CreditCard size={18} />, href: '/admin/finance/fee-assignment', color: '#D97706' },
  { label: 'Run Payroll', icon: <TrendingUp size={18} />, href: '/admin/hr/payroll-run', color: '#16A34A' },
  { label: 'Allocate Room', icon: <Building2 size={18} />, href: '/admin/hostel/room-allocation', color: '#0D9488' },
  { label: 'Reports', icon: <FileText size={18} />, href: '/admin/analytics/reports', color: '#0EA5E9' },
]

function GreetingBanner({ pending_leaves, pending_hostel_requests }: { pending_leaves: number; pending_hostel_requests: number }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const total = (pending_leaves || 0) + (pending_hostel_requests || 0)

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--color-primary-subtle) 0%, #f0f3fe 100%)',
      border: '1px solid var(--color-primary-subtle-border)',
      borderRadius: '20px',
      padding: '28px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle background shape */}
      <div style={{
        position: 'absolute', right: '-40px', top: '-40px',
        width: '200px', height: '200px', borderRadius: '50%',
        background: 'rgba(59,79,224,0.05)', pointerEvents: 'none'
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1 style={{
          fontSize: '22px', fontWeight: 700,
          color: 'var(--color-secondary)', margin: '0 0 6px',
          letterSpacing: '-0.3px'
        }}>
          {greeting}, Administrator 👋
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          {total > 0
            ? `You have ${pending_leaves} pending leave ${pending_leaves === 1 ? 'request' : 'requests'} and ${pending_hostel_requests} hostel ${pending_hostel_requests === 1 ? 'request' : 'requests'} awaiting review.`
            : 'All caught up — no pending approvals today.'}
        </p>
      </div>
      <Link to="/admin/hr/leave-approvals" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <Button variant="primary">Review approvals</Button>
      </Link>
    </div>
  )
}

export function AdminDashboardPage() {
  const navigate = useNavigate()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: analyticsApi.getAdminDashboard,
  })

  const { data: auditLogs } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => analyticsApi.getAuditLogs({ size: 5 })
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Greeting skeleton */}
        <div className="skeleton" style={{ height: '104px', borderRadius: '20px' }} />
        {/* KPI skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '16px' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '112px' }} />
          ))}
        </div>
        {/* Charts skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="skeleton" style={{ height: '280px' }} />
          <div className="skeleton" style={{ height: '280px' }} />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return <ErrorState message="Failed to load dashboard data" onRetry={refetch} />
  }

  const donutData = data.fee_collection_donut ? [
    { name: 'Paid', value: data.fee_collection_donut.paid || 0 },
    { name: 'Partial', value: data.fee_collection_donut.partial || 0 },
    { name: 'Due', value: data.fee_collection_donut.due || 0 },
    { name: 'Overdue', value: data.fee_collection_donut.overdue || 0 }
  ] : []

  const totalCollected = (data.fee_collection_donut?.paid || 0) + (data.fee_collection_donut?.partial || 0)
  const totalAll = totalCollected + (data.fee_collection_donut?.due || 0) + (data.fee_collection_donut?.overdue || 0)
  const collectionPct = totalAll > 0 ? Math.round(totalCollected * 100 / totalAll) : 0

  const collectionTrend = data.collection_trend?.map((row: any) => ({
    month: row.month || row.period,
    'This Term': row.current || row.amount || 0,
    'Last Term': row.previous || 0,
  })) || []

  const enrollmentByDept = data.enrollment_by_department?.map((row: any) => ({
    name: (row.department || row.name || 'Dept').substring(0, 14),
    students: row.count || row.students || 0,
  })).sort((a: any, b: any) => b.students - a.students) || []

  const recentActivity = auditLogs?.data || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Greeting banner */}
      <GreetingBanner
        pending_leaves={data.pending_leaves || 0}
        pending_hostel_requests={data.pending_hostel_requests || 0}
      />

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '16px' }}>
        <StatCard
          label="Active students"
          value={data.total_students?.toLocaleString() || '—'}
          icon={<Users size={20} />}
          moduleColor="academic"
          supportText="This academic term"
          onClick={() => navigate('/admin/students')}
        />
        <StatCard
          label="Active enrollments"
          value={data.active_enrollments?.toLocaleString() || '—'}
          icon={<BookOpen size={20} />}
          moduleColor="exams"
          supportText="Across all offerings"
          onClick={() => navigate('/admin/academics/enrollment/records')}
        />
        <StatCard
          label="Fees collected"
          value={`${collectionPct}%`}
          icon={<CreditCard size={20} />}
          moduleColor="finance"
          supportText={`₹${(totalCollected / 1000).toFixed(0)}K of ₹${(totalAll / 1000).toFixed(0)}K`}
          supportColor={collectionPct >= 80 ? 'success' : collectionPct >= 60 ? 'neutral' : 'error'}
          onClick={() => navigate('/admin/finance/ledger')}
        />
        <StatCard
          label="Hostel beds free"
          value={data.beds_available?.toLocaleString() || '—'}
          icon={<Building2 size={20} />}
          moduleColor="hostel"
          supportText="Available right now"
          onClick={() => navigate('/admin/hostel/occupancy-dashboard')}
        />
        <StatCard
          label="Below 75% attendance"
          value={data.students_low_attendance?.toLocaleString() || '0'}
          icon={<AlertTriangle size={20} />}
          moduleColor="alerts"
          supportText={data.students_low_attendance > 0 ? 'Exam registration blocked' : 'All students eligible'}
          supportColor={data.students_low_attendance > 0 ? 'error' : 'success'}
          onClick={() => navigate('/admin/attendance/shortage')}
        />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Fee collection donut */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Fee collection status</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>Breakdown by payment status</p>
            </div>
            <Link to="/admin/finance/ledger" style={{ fontSize: '13px', color: 'var(--color-primary)', textDecoration: 'none' }}>
              View ledger →
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <PieChart width={160} height={160}>
              <Pie data={donutData} dataKey="value" cx={75} cy={75} innerRadius={50} outerRadius={72} paddingAngle={2}>
                {donutData.map((_: any, index: number) => (
                  <Cell key={index} fill={FEE_COLORS[index % FEE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString()}`} />
            </PieChart>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{collectionPct}%</span>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Collected</div>
              </div>
              {donutData.map((d: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: FEE_COLORS[i], flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', flex: 1 }}>{d.name}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    ₹{Number(d.value).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Enrollment by dept */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Enrollment by department</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>Active students per dept</p>
            </div>
          </div>
          {enrollmentByDept.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={enrollmentByDept} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '13px', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
                <Bar dataKey="students" fill="var(--color-primary)" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              No enrollment data available
            </div>
          )}
        </Card>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
        {/* Recent activity */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Recent activity</h3>
            <Link to="/admin/analytics/audit-logs" style={{ fontSize: '13px', color: 'var(--color-primary)', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {recentActivity.length > 0 ? recentActivity.map((log: any, i: number) => (
              <div key={i} style={{
                display: 'flex', gap: '12px', alignItems: 'flex-start',
                padding: '10px 0', borderBottom: i < recentActivity.length - 1 ? '1px solid var(--color-border)' : 'none'
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                  background: 'var(--color-primary-subtle)', color: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <RefreshCw size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.action || log.event}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {log.actor_username || log.user} · {log.created_at ? new Date(log.created_at).toLocaleDateString() : 'Recently'}
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                No recent activity
              </div>
            )}
          </div>
        </Card>

        {/* Needs attention */}
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Needs attention</h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>Pending reviews & actions</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              {
                label: 'Leave requests',
                value: data.pending_leaves || 0,
                color: 'var(--color-warning)',
                bg: 'var(--color-warning-bg)',
                icon: <Calendar size={16} />,
                href: '/admin/hr/leave-approvals'
              },
              {
                label: 'Hostel requests',
                value: data.pending_hostel_requests || 0,
                color: 'var(--color-info)',
                bg: 'var(--color-info-bg)',
                icon: <Building2 size={16} />,
                href: '/admin/hostel/requests'
              },
              {
                label: 'Low attendance students',
                value: data.students_low_attendance || 0,
                color: 'var(--color-error)',
                bg: 'var(--color-error-bg)',
                icon: <AlertTriangle size={16} />,
                href: '/admin/attendance/shortage'
              },
            ].map((item, i) => (
              <Link key={i} to={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 12px', borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  transition: 'background 120ms',
                  cursor: 'pointer'
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-muted)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = ''}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', flex: 1 }}>{item.label}</span>
                  <span style={{
                    fontSize: '15px', fontWeight: 700, color: item.value > 0 ? item.color : 'var(--color-text-muted)',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    {item.value}
                  </span>
                  <ArrowRight size={14} color="var(--color-text-muted)" />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Quick links */}
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Quick links</h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>Common tasks</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {QUICK_LINKS.map((ql, i) => (
              <Link key={i} to={ql.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '8px', padding: '14px 8px', borderRadius: '10px',
                  border: '1px solid var(--color-border)',
                  textAlign: 'center',
                  transition: 'all 120ms',
                  cursor: 'pointer'
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = ql.color
                    ;(e.currentTarget as HTMLDivElement).style.background = `${ql.color}10`
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)'
                    ;(e.currentTarget as HTMLDivElement).style.background = ''
                  }}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '9px',
                    background: `${ql.color}18`,
                    color: ql.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {ql.icon}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)', lineHeight: 1.3 }}>
                    {ql.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
