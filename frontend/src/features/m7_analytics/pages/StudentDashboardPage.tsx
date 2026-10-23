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
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import {
  Award, BookOpen, Calendar, CreditCard, Home,
  CheckSquare, ArrowRight, TrendingUp, AlertTriangle, Clock
} from 'lucide-react'

const QUICK_LINKS = [
  { label: 'My Results', icon: <Award size={17} />, href: '/student/results', color: '#7C3AED' },
  { label: 'My Courses', icon: <BookOpen size={17} />, href: '/student/courses', color: '#3B4FE0' },
  { label: 'Attendance', icon: <Calendar size={17} />, href: '/student/attendance', color: '#E11D48' },
  { label: 'Fees & Dues', icon: <CreditCard size={17} />, href: '/student/fees', color: '#D97706' },
  { label: 'Exam Reg.', icon: <CheckSquare size={17} />, href: '/student/exams/registration', color: '#16A34A' },
  { label: 'Hostel', icon: <Home size={17} />, href: '/student/hostel', color: '#0D9488' },
]

export function StudentDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['studentDashboard'],
    queryFn: analyticsApi.getStudentDashboard,
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="skeleton" style={{ height: '104px', borderRadius: '20px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '16px' }}>
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '112px' }} />)}
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
  const hasDues = (data.total_outstanding_dues || 0) > 0
  const cgpa = data.current_cgpa !== undefined ? Number(data.current_cgpa).toFixed(2) : 'N/A'
  const lowAttendanceCount = data.low_attendance_courses || 0

  const cgpaTrendData = data.cgpa_trend?.map((item: any, idx: number) => ({
    term: item.term || item.term_label || `Sem ${idx + 1}`,
    gpa: Number(item.sgpa || item.gpa || item.value || 0),
  })) || []

  const todaySchedule = data.today_schedule || data.classes_today || []
  const examRegistrations = data.exam_registrations || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Greeting banner */}
      <div style={{
        background: 'linear-gradient(135deg, #e0f5f3 0%, #e8eeff 100%)',
        border: '1px solid #d5dbfb',
        borderRadius: '20px',
        padding: '28px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: '-30px', top: '-30px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(13,148,136,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-secondary)', margin: '0 0 6px', letterSpacing: '-0.3px' }}>
            {greeting} 👋
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Cumulative CGPA <strong style={{ color: 'var(--color-primary)' }}>{cgpa}</strong>
            {' · '}
            <span style={{ color: lowAttendanceCount > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
              {lowAttendanceCount > 0 ? `${lowAttendanceCount} course(s) below 75% attendance` : 'Attendance on track (all ≥ 75%)'}
            </span>
            {hasDues && (
              <>
                {' · '}
                <span style={{ color: 'var(--color-error)', fontWeight: 600 }}>
                  ₹{Number(data.total_outstanding_dues).toLocaleString()} due
                </span>
              </>
            )}
          </p>
        </div>
        <Link to={hasDues ? '/student/fees' : '/student/results'} style={{ textDecoration: 'none', flexShrink: 0 }}>
          <Button variant={hasDues ? 'danger' : 'primary'}>
            {hasDues ? 'Pay dues' : 'View results'}
          </Button>
        </Link>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '16px' }}>
        <StatCard
          label="Current CGPA"
          value={cgpa}
          icon={<Award size={20} />}
          moduleColor="academic"
          supportText="Academic standing"
          onClick={() => {}}
        />
        <StatCard
          label="Courses enrolled"
          value={data.total_enrolled_courses || 0}
          icon={<BookOpen size={20} />}
          moduleColor="people"
          supportText="Active this term"
        />
        <StatCard
          label="Low attendance"
          value={lowAttendanceCount}
          icon={<AlertTriangle size={20} />}
          moduleColor="alerts"
          supportText={lowAttendanceCount > 0 ? 'Courses below 75%' : 'All courses eligible'}
          supportColor={lowAttendanceCount > 0 ? 'error' : 'success'}
        />
        <StatCard
          label="Outstanding dues"
          value={data.total_outstanding_dues > 0 ? `₹${Number(data.total_outstanding_dues).toLocaleString()}` : '₹0'}
          icon={<CreditCard size={20} />}
          moduleColor="finance"
          supportText={data.total_outstanding_dues > 0 ? 'Payment required' : 'No dues'}
          supportColor={data.total_outstanding_dues > 0 ? 'error' : 'success'}
        />
        <StatCard
          label="Hostel status"
          value={data.hostel_status || 'Not allocated'}
          icon={<Home size={20} />}
          moduleColor="hostel"
          supportText="Campus room"
        />
      </div>

      {/* Main content row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* CGPA Trend Chart */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Academic Performance</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>Semester-wise SGPA progress</p>
            </div>
            <Link to="/student/results" style={{ fontSize: '13px', color: 'var(--color-primary)', textDecoration: 'none' }}>
              Full grade card →
            </Link>
          </div>
          {cgpaTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={cgpaTrendData} margin={{ top: 8, right: 12, bottom: 4, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="term" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: any) => [`${v}`, 'SGPA']}
                  contentStyle={{ fontSize: '13px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                />
                <Line type="monotone" dataKey="gpa" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--color-primary)' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '13px', background: 'var(--color-surface-muted)', borderRadius: '8px' }}>
              Grade history will appear here once results are published
            </div>
          )}
        </Card>

        {/* Today's Schedule */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Today's classes</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
              </p>
            </div>
            <Link to="/student/attendance" style={{ fontSize: '13px', color: 'var(--color-primary)', textDecoration: 'none' }}>
              Attendance →
            </Link>
          </div>
          {todaySchedule.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {todaySchedule.map((item: any, i: number) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 12px', borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)'
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'var(--color-chip-academic-bg)', color: 'var(--color-chip-academic-text)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <BookOpen size={15} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {item.course_title || item.course || 'Engineering Subject'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {item.slot || item.time || 'Period 1'} · {item.room || 'Room 301'}
                    </div>
                  </div>
                  <StatusPill label={item.status || 'Scheduled'} status="info" />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px', background: 'var(--color-surface-muted)', borderRadius: '8px' }}>
              No classes scheduled for today
            </div>
          )}
        </Card>
      </div>

      {/* Quick access + exam registration */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Quick links */}
        <Card>
          <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 600 }}>Quick access</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
            {QUICK_LINKS.map((ql, i) => (
              <Link key={i} to={ql.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '8px', padding: '16px 8px', borderRadius: '10px',
                  border: '1px solid var(--color-border)', textAlign: 'center',
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
                  <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: `${ql.color}18`, color: ql.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {ql.icon}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{ql.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Exam registration preview */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Exam registration</h3>
            <Link to="/student/exams/registration" style={{ fontSize: '13px', color: 'var(--color-primary)', textDecoration: 'none' }}>Open →</Link>
          </div>
          {examRegistrations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {examRegistrations.slice(0, 4).map((e: any, i: number) => {
                const isEligible = e.eligible ?? (e.status === 'REGISTERED' || e.attendance_pct >= 75)
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 10px', borderRadius: '7px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)'
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                      {e.course_code || e.course_title || e.course || 'Course'}
                    </span>
                    <StatusPill
                      label={isEligible ? 'Eligible' : 'Ineligible'}
                      status={isEligible ? 'success' : 'error'}
                    />
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              {data.pending_exams > 0 ? `${data.pending_exams} exam(s) available for registration` : 'No upcoming exam windows'}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
