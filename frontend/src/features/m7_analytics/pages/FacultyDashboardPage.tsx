import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api'
import { StatCard } from '../../../components/ui/StatCard'
import { Card } from '../../../components/ui/Card'
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton'
import { ErrorState } from '../../../components/ui/ErrorState'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { StatusPill } from '../../../components/ui/StatusPill'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import {
  BookOpen, Users, PenSquare, CreditCard,
  Calendar, CheckSquare, ArrowRight, AlertTriangle, TrendingUp
} from 'lucide-react'

const QUICK_LINKS = [
  { label: 'Mark Attendance', icon: <PenSquare size={18} />, href: '/faculty/attendance', color: '#E11D48' },
  { label: 'Marks Entry', icon: <CheckSquare size={18} />, href: '/faculty/marks', color: '#7C3AED' },
  { label: 'Apply Leave', icon: <Calendar size={18} />, href: '/faculty/hr/apply-leave', color: '#16A34A' },
  { label: 'Course Results', icon: <TrendingUp size={18} />, href: '/faculty/results/summary', color: '#0EA5E9' },
]

export function FacultyDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['facultyDashboard'],
    queryFn: analyticsApi.getFacultyDashboard,
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="skeleton" style={{ height: '104px', borderRadius: '20px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '112px' }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="skeleton" style={{ height: '260px' }} />
          <div className="skeleton" style={{ height: '260px' }} />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return <ErrorState message="Failed to load dashboard data" onRetry={refetch} />
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const todaySessions = data.today_sessions?.length || 0
  const pendingMarks = data.pending_marks_entry || 0

  const attendanceChart = data.attendance_by_offering?.map((r: any) => ({
    name: (r.course_title || r.offering || 'Course').substring(0, 14),
    avg: Math.round(r.avg_attendance_pct || r.average || 0),
  })) || []

  const atRiskStudents = data.students_below_75 || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Greeting banner */}
      <div style={{
        background: 'linear-gradient(135deg, #f0eafe 0%, #e8eeff 100%)',
        border: '1px solid #d5dbfb',
        borderRadius: '20px',
        padding: '28px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-secondary)', margin: '0 0 6px', letterSpacing: '-0.3px' }}>
            {greeting}, Professor 👋
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            {todaySessions > 0
              ? `You have ${todaySessions} session${todaySessions > 1 ? 's' : ''} to mark today${pendingMarks > 0 ? ` and ${pendingMarks} marks entry task${pendingMarks > 1 ? 's' : ''} pending` : ''}.`
              : pendingMarks > 0
                ? `${pendingMarks} marks entry task${pendingMarks > 1 ? 's' : ''} pending review.`
                : 'No sessions to mark today — all marks up to date.'}
          </p>
        </div>
        <Link to="/faculty/attendance" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <Button variant="primary">Mark attendance</Button>
        </Link>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
        <StatCard
          label="My offerings"
          value={data.assigned_offerings || '—'}
          icon={<BookOpen size={20} />}
          moduleColor="academic"
          supportText="This semester"
        />
        <StatCard
          label="Sessions to mark"
          value={data.sessions_to_mark ?? (data.today_sessions?.length || 0)}
          icon={<Users size={20} />}
          moduleColor="people"
          supportText="Scheduled for today"
        />
        <StatCard
          label="Pending marks entry"
          value={pendingMarks}
          icon={<PenSquare size={20} />}
          moduleColor="exams"
          supportText={pendingMarks > 0 ? 'Action required' : 'All up to date'}
          supportColor={pendingMarks > 0 ? 'error' : 'success'}
        />
        <StatCard
          label="Leave balance"
          value={`${data.total_leave_balance || 0} days`}
          icon={<Calendar size={20} />}
          moduleColor="people"
          supportText="Remaining this year"
          supportColor="success"
        />
      </div>

      {/* Today's sessions */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Today — sessions to mark</h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Link to="/faculty/attendance/history" style={{ fontSize: '13px', color: 'var(--color-primary)', textDecoration: 'none' }}>
            View history →
          </Link>
        </div>
        {data.today_sessions && data.today_sessions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.today_sessions.map((s: any, i: number) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)'
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  background: 'var(--color-chip-exams-bg)', color: 'var(--color-chip-exams-text)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <BookOpen size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {s.course_title || s.course || 'Course'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {s.section || 'Section A'} · {s.time || 'Today'}
                  </div>
                </div>
                <StatusPill label={s.marked ? 'Marked' : 'Pending'} status={s.marked ? 'success' : 'warning'} />
                {!s.marked && (
                  <Link to="/faculty/attendance" style={{ textDecoration: 'none' }}>
                    <Button variant="primary" size="sm">Mark</Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px', background: 'var(--color-surface-muted)', borderRadius: '8px' }}>
            No sessions scheduled for today
          </div>
        )}
      </Card>

      {/* Charts + at-risk row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Attendance chart */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Attendance by offering</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>Average % vs 75% threshold</p>
            </div>
          </div>
          {attendanceChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={attendanceChart} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip
                  formatter={(v: any) => [`${v}%`, 'Avg attendance']}
                  contentStyle={{ fontSize: '13px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                />
                <ReferenceLine y={75} stroke="var(--color-error)" strokeDasharray="4 4" label={{ value: '75%', position: 'insideTopRight', fontSize: 10, fill: 'var(--color-error)' }} />
                <Bar dataKey="avg" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '13px', background: 'var(--color-surface-muted)', borderRadius: '8px' }}>
              No attendance data yet
            </div>
          )}
        </Card>

        {/* At-risk students */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Students below 75%</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>Across your offerings</p>
            </div>
            <Link to="/faculty/attendance/shortage" style={{ fontSize: '13px', color: 'var(--color-primary)', textDecoration: 'none' }}>View all →</Link>
          </div>
          {atRiskStudents.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {atRiskStudents.slice(0, 5).map((s: any, i: number) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 0',
                  borderBottom: i < Math.min(atRiskStudents.length, 5) - 1 ? '1px solid var(--color-border)' : 'none'
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: 'var(--color-error-bg)', color: 'var(--color-error)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700
                  }}>
                    {(s.student_name || s.name || 'S')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.student_name || s.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {s.course_title || s.course}
                    </div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-error)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                    {Math.round(s.attendance_pct || s.percentage || 0)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-success)', fontSize: '13px', background: 'var(--color-success-bg)', borderRadius: '8px' }}>
              ✓ All students above 75% attendance
            </div>
          )}
        </Card>
      </div>

      {/* Quick links */}
      <Card>
        <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 600 }}>Quick links</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {QUICK_LINKS.map((ql, i) => (
            <Link key={i} to={ql.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 16px', borderRadius: '8px',
                border: '1px solid var(--color-border)',
                transition: 'all 120ms', cursor: 'pointer'
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
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: `${ql.color}18`, color: ql.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {ql.icon}
                </div>
                <span style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                  {ql.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
