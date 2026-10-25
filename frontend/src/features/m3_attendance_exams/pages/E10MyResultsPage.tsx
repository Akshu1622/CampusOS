import React, { useState } from 'react'
import {
  Card, Button, StatusPill, EmptyState, LoadingSkeleton, StatCard, Select
} from '@/components/ui'
import { TrendChart, DonutChart } from '@/components/ui/Charts'
import { useMyResults, useMyCgpa } from '../hooks'
import type { MySemesterResult, MyResultCourseItem } from '../api'
import {
  Award, Printer, Download, BookOpen, AlertCircle, TrendingUp, CheckCircle2
} from 'lucide-react'

export function E10MyResultsPage() {
  const [selectedTerm, setSelectedTerm] = useState<string>('all')

  const { data: resultsData, isLoading: loadingResults, error } = useMyResults()
  const semesterResults = resultsData || []

  const { data: cgpaData, isLoading: loadingCgpa } = useMyCgpa()
  const cgpa = cgpaData?.cgpa ?? 0

  // Filtered semester results
  const filteredResults = selectedTerm === 'all'
    ? semesterResults
    : semesterResults.filter(s => String(s.term_id) === selectedTerm)

  // Current latest SGPA
  const latestSgpa = semesterResults.length > 0
    ? semesterResults[semesterResults.length - 1].sgpa
    : 0

  // SGPA trend data for line chart
  const sgpaTrendData = semesterResults.map((s, idx) => ({
    term: s.term_label || `Sem ${idx + 1}`,
    sgpa: Number(s.sgpa)
  }))

  // Grade distribution data for donut
  const gradeDonutData = React.useMemo(() => {
    const counts: { [grade: string]: number } = {}
    semesterResults.forEach(term => {
      term.courses.forEach(c => {
        if (c.grade) {
          counts[c.grade] = (counts[c.grade] || 0) + 1
        }
      })
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [semesterResults])

  const getGradePillStatus = (grade: string): 'success' | 'info' | 'warning' | 'error' | 'neutral' => {
    const g = grade.toUpperCase()
    if (g === 'O' || g === 'A+' || g === 'A') return 'success'
    if (g === 'B+' || g === 'B') return 'info'
    if (g === 'C' || g === 'P') return 'warning'
    if (g === 'F' || g === 'AB') return 'error'
    return 'neutral'
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-muted)', padding: '2px 6px', borderRadius: '4px' }}>
              E-10
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>
              My Results / Grade Card
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Official published semester examination grades, SGPA, and cumulative CGPA.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" icon={<Printer size={16} />} onClick={handlePrint}>
            Print grade card
          </Button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Cumulative CGPA"
          value={loadingCgpa ? '...' : Number(cgpa).toFixed(2)}
          icon={<Award size={20} />}
          moduleColor="academic"
          supportText="Overall academic standing"
          supportColor="success"
        />
        <StatCard
          label="Latest SGPA"
          value={loadingResults ? '...' : Number(latestSgpa).toFixed(2)}
          icon={<TrendingUp size={20} />}
          moduleColor="exams"
          supportText="Recent completed term"
          supportColor="neutral"
        />
      </div>

      {/* Analytics Row: SGPA Trend Line & Grade Distribution Donut */}
      {semesterResults.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {sgpaTrendData.length > 1 && (
            <Card variant="standard" padding={20}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>
                Semester SGPA Progression
              </h3>
              <TrendChart
                data={sgpaTrendData}
                xAxisKey="term"
                lines={[
                  { key: 'sgpa', name: 'SGPA', color: 'var(--color-primary)' }
                ]}
                height={220}
              />
            </Card>
          )}

          {gradeDonutData.length > 0 && (
            <Card variant="standard" padding={20}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>
                Grade Distribution
              </h3>
              <DonutChart
                data={gradeDonutData}
                dataKey="value"
                nameKey="name"
                height={220}
              />
            </Card>
          )}
        </div>
      )}

      {/* Term Selector Filter */}
      {semesterResults.length > 1 && (
        <Card variant="compact" padding={16}>
          <div style={{ maxWidth: '280px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              Filter by Academic Term
            </label>
            <Select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              options={[
                { value: 'all', label: 'All Semesters' },
                ...semesterResults.map(s => ({
                  value: String(s.term_id),
                  label: s.term_label || `Term #${s.term_id}`
                }))
              ]}
            />
          </div>
        </Card>
      )}

      {/* Main Results Tables Grouped by Term */}
      {loadingResults ? (
        <Card variant="standard" padding={24}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <LoadingSkeleton height={120} />
            <LoadingSkeleton height={120} />
          </div>
        </Card>
      ) : error ? (
        <Card variant="standard" padding={32}>
          <div style={{ textAlign: 'center', color: 'var(--color-error)' }}>
            <AlertCircle size={32} style={{ marginBottom: '8px' }} />
            <div>Failed to load examination results.</div>
          </div>
        </Card>
      ) : filteredResults.length === 0 ? (
        <Card variant="standard" padding={48}>
          <EmptyState
            icon={<Award size={40} />}
            title="Results will appear once published"
            description="Your semester examination grades will appear here as soon as course examinations are processed and published by the administration."
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {filteredResults.map((sem, sIdx) => (
            <Card key={sem.term_id || sIdx} variant="standard" padding={0} style={{ overflow: 'hidden' }}>
              {/* Semester Header */}
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface-muted)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                    {sem.term_label || `Semester Result #${sem.term_id}`}
                  </h3>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    Total Credits Registered: {sem.total_credits} Cr
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Semester SGPA: </span>
                  <span className="tabular-nums" style={{ fontWeight: 700, fontSize: '18px', color: 'var(--color-primary)' }}>
                    {Number(sem.sgpa).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Course Rows */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  display: 'flex',
                  padding: '12px 20px',
                  borderBottom: '1px solid var(--color-border)',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-text-muted)',
                  letterSpacing: '0.02em'
                }}>
                  <div style={{ flex: '1 1 200px' }}>Course Code & Title</div>
                  <div style={{ width: '80px', textAlign: 'center' }}>Credits</div>
                  <div style={{ width: '100px', textAlign: 'center' }}>Exam Type</div>
                  <div style={{ width: '80px', textAlign: 'center' }}>Score</div>
                  <div style={{ width: '80px', textAlign: 'center' }}>Grade</div>
                  <div style={{ width: '100px', textAlign: 'right' }}>Grade Points</div>
                </div>

                {sem.courses.map((c, cIdx) => (
                  <div
                    key={cIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 20px',
                      borderBottom: cIdx < sem.courses.length - 1 ? '1px solid var(--color-border)' : 'none',
                      fontSize: '13px'
                    }}
                  >
                    <div style={{ flex: '1 1 200px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                        {c.course_code}
                      </div>
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                        {c.course_title}
                      </div>
                    </div>
                    <div style={{ width: '80px', textAlign: 'center' }}>{c.credits} Cr</div>
                    <div style={{ width: '100px', textAlign: 'center' }}>{c.exam_type}</div>
                    <div className="tabular-nums" style={{ width: '80px', textAlign: 'center', fontWeight: 600 }}>{c.marks}</div>
                    <div style={{ width: '80px', textAlign: 'center' }}>
                      <StatusPill
                        label={c.grade}
                        status={getGradePillStatus(c.grade)}
                      />
                    </div>
                    <div className="tabular-nums" style={{ width: '100px', textAlign: 'right', fontWeight: 600 }}>
                      {c.grade_points}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
