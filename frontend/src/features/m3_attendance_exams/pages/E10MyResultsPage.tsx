import React from 'react'
import {
  Card, Button, StatusPill, EmptyState, LoadingSkeleton
} from '@/components/ui'
import { useMyResults, useMyCgpa } from '../hooks'
import type { MySemesterResult, MyResultCourseItem } from '../api'
import {
  Award, Printer, Download, BookOpen, AlertCircle
} from 'lucide-react'

export function E10MyResultsPage() {
  const { data: resultsData, isLoading: loadingResults, error } = useMyResults()
  const semesterResults = resultsData || []

  const { data: cgpaData, isLoading: loadingCgpa } = useMyCgpa()
  const cgpa = cgpaData?.cgpa ?? 0

  // Total credits across all published results
  const totalCreditsEarned = semesterResults.reduce((sum, term) => sum + term.total_credits, 0)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
              E-10
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              My Examination Results & Grade Card
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Official published semester examination grades, SGPA, and cumulative CGPA.
          </p>
        </div>

        <Button variant="secondary" icon={<Printer size={16} />} onClick={handlePrint}>
          Print Grade Card
        </Button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Card padding={20}>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Cumulative CGPA</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>
            {loadingCgpa ? '...' : Number(cgpa).toFixed(2)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Computed via official academic grade point formula
          </div>
        </Card>

        <Card padding={20}>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Total Credits Earned</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-success)', marginTop: '4px' }}>
            {totalCreditsEarned} Cr
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Across all completed semesters
          </div>
        </Card>
      </div>

      {/* Main Results Content */}
      {loadingResults ? (
        <Card padding={24}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <LoadingSkeleton height={120} />
            <LoadingSkeleton height={120} />
          </div>
        </Card>
      ) : error ? (
        <Card padding={32}>
          <div style={{ textAlign: 'center', color: 'var(--color-error)' }}>
            <AlertCircle size={32} style={{ marginBottom: '8px' }} />
            <div>Failed to load examination results.</div>
          </div>
        </Card>
      ) : semesterResults.length === 0 ? (
        <Card padding={32}>
          <EmptyState
            icon={<Award size={40} />}
            title="Results will appear once published"
            description="Your semester examination grades will appear here as soon as course examinations are processed and published by the administration."
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {semesterResults.map((sem, sIdx) => (
            <Card key={sem.term_id || sIdx} padding={0}>
              {/* Semester Header */}
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-surface-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                    {sem.term_label || `Term #${sem.term_id}`}
                  </h3>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    {sem.total_credits} credits registered
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Semester SGPA: </span>
                  <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-primary)' }}>
                    {Number(sem.sgpa).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Course Rows */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  display: 'flex',
                  padding: '10px 20px',
                  borderBottom: '1px solid var(--color-border)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)'
                }}>
                  <div style={{ flex: '1 1 200px' }}>Course</div>
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
                    <div style={{ width: '80px', textAlign: 'center', fontWeight: 600 }}>{c.marks}</div>
                    <div style={{ width: '80px', textAlign: 'center' }}>
                      <StatusPill label={c.grade} status="success" />
                    </div>
                    <div style={{ width: '100px', textAlign: 'right', fontWeight: 600 }}>
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
