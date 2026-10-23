import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../../components/ui/Card'
import { Tabs } from '../../../components/ui/Tabs'
import { Button } from '../../../components/ui/Button'
import { StatCard } from '../../../components/ui/StatCard'
import { Search, BarChart3, BookOpen, Calendar, CreditCard, Users, Home, ArrowRight, X } from 'lucide-react'

const REPORTS = [
  { id: 'RP-1', title: 'Department-wise CGPA Ranking', description: 'Ranked table of students by cumulative grade point average across departments.', category: 'Academic', color: '#3B4FE0', icon: <BookOpen size={18} /> },
  { id: 'RP-2', title: 'Top N Students', description: 'Dean\'s list of top N performing students per degree program per academic term.', category: 'Academic', color: '#3B4FE0', icon: <BookOpen size={18} /> },
  { id: 'RP-3', title: 'Low Attendance Courses', description: 'Course offerings where average lecture attendance is below the 75% threshold.', category: 'Attendance', color: '#E11D48', icon: <Calendar size={18} /> },
  { id: 'RP-4', title: 'Fee Collection Summary', description: 'Institutional fee collection summary, receipts breakdown by program, and fee defaulters.', category: 'Finance', color: '#D97706', icon: <CreditCard size={18} /> },
  { id: 'RP-5', title: 'High Dues Students', description: 'Analysis of students whose pending semester dues exceed the university average.', category: 'Finance', color: '#D97706', icon: <CreditCard size={18} /> },
  { id: 'RP-6', title: 'Hostel Occupancy', description: 'Campus hostel block capacity, room-by-room bed allocation, and occupancy metrics.', category: 'Hostel', color: '#0D9488', icon: <Home size={18} /> },
  { id: 'RP-7', title: 'Payroll Summary', description: 'Monthly faculty and staff gross-to-net payroll summary by department.', category: 'HR', color: '#16A34A', icon: <Users size={18} /> },
  { id: 'RP-8', title: 'Faculty Leave Utilisation', description: 'Departmental faculty leave utilisation, quota consumption, and balance analysis.', category: 'HR', color: '#16A34A', icon: <Users size={18} /> },
  { id: 'RP-9', title: 'Pass Percentage & Grades', description: 'Course-wise final examination pass percentages and statistical grade distribution.', category: 'Academic', color: '#7C3AED', icon: <BarChart3 size={18} /> },
  { id: 'RP-10', title: 'Exam Ineligible List', description: 'Roster of students barred from final semester exams due to attendance shortage (<75%).', category: 'Attendance', color: '#E11D48', icon: <Calendar size={18} /> }
]

const CATEGORIES = ['All', 'Academic', 'Attendance', 'Finance', 'HR', 'Hostel']

export function R01ReportsHubPage() {
  const [search, setSearch] = useState('')

  const renderGrid = (category: string) => {
    const filteredReports = REPORTS.filter(report => {
      const matchesSearch = report.title.toLowerCase().includes(search.toLowerCase()) || report.description.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = category === 'All' || report.category === category
      return matchesSearch && matchesCategory
    })

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {filteredReports.map(report => (
          <Card key={report.id} padding={0}>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '9px',
                    background: `${report.color}15`, color: report.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {report.icon}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', padding: '2px 8px', borderRadius: '4px', color: 'var(--color-text-muted)' }}>
                      {report.category}
                    </span>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                      {report.id}
                    </span>
                  </div>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 6px', letterSpacing: '-0.2px' }}>
                  {report.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {report.description}
                </p>
              </div>

              <Link to={`/admin/analytics/reports/${report.id}`} style={{ textDecoration: 'none' }}>
                <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Open Report
                </Button>
              </Link>
            </div>
          </Card>
        ))}

        {filteredReports.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            No reports found matching your criteria.
          </div>
        )}
      </div>
    )
  }

  const tabsData = CATEGORIES.map(cat => ({
    id: cat,
    label: cat,
    content: renderGrid(cat)
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-muted)', padding: '2px 8px', borderRadius: '4px' }}>
              M7 · Analytics
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)', letterSpacing: '-0.3px' }}>
              Reports Hub
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Comprehensive institutional intelligence across academics, exams, payroll, finances, and campus operations.
          </p>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Available Reports"
          value={REPORTS.length}
          icon={<BarChart3 size={20} />}
          moduleColor="academic"
          supportText="Standard institutional views"
        />
        <StatCard
          label="Functional Domains"
          value="5"
          icon={<BookOpen size={20} />}
          moduleColor="exams"
          supportText="Academics, Finance, HR, Hostel"
        />
        <StatCard
          label="Data Authority"
          value="Live SQL"
          icon={<CreditCard size={20} />}
          moduleColor="finance"
          supportText="Real-time stored analytics"
          supportColor="success"
        />
      </div>

      {/* Search Toolbar */}
      <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input 
          type="text" 
          placeholder="Search reports..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%', height: '38px', padding: '0 32px 0 36px',
            borderRadius: '8px', border: '1px solid var(--color-border)',
            outline: 'none', fontSize: '13.5px', background: 'var(--color-surface)',
            color: 'var(--color-text-primary)'
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', lineHeight: 0 }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <Tabs tabs={tabsData} />
    </div>
  )
}
