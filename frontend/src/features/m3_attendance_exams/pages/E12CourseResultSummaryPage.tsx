import React, { useState } from 'react'
import {
  Card, Button, Select, Table, StatusPill, EmptyState, LoadingSkeleton
} from '@/components/ui'
import {
  useExams, useCourseResultSummary, useExamMarks
} from '../hooks'
import { useOfferings, useCourses } from '../../m2_academics/hooks'
import type { Course, CourseOffering } from '../../m2_academics/api'
import type { MarksResultItem } from '../api'
import {
  Download, Award, Users, CheckCircle2, TrendingUp, AlertCircle
} from 'lucide-react'

export function E12CourseResultSummaryPage() {
  const [selectedExamId, setSelectedExamId] = useState<string>('')

  const { data: examsData, isLoading: loadingExams } = useExams({ page_size: 100 })
  const exams = examsData?.items || []

  const { data: offeringsData } = useOfferings({ page_size: 100 })
  const offerings = offeringsData?.items || []

  const { data: coursesData } = useCourses({ page_size: 200 })
  const courses = coursesData?.items || []

  const courseMap = React.useMemo(() => {
    const m = new Map<number, string>()
    courses.forEach((c: Course) => m.set(c.id, `${c.code} - ${c.title}`))
    return m
  }, [courses])

  const offeringMap = React.useMemo(() => {
    const m = new Map<number, { courseId: number; section: string }>()
    offerings.forEach((o: CourseOffering) => m.set(o.id, { courseId: o.course_id, section: o.section }))
    return m
  }, [offerings])

  // Auto-select first exam
  React.useEffect(() => {
    if (!selectedExamId && exams.length > 0) {
      setSelectedExamId(String(exams[0].id))
    }
  }, [exams, selectedExamId])

  const { data: summary, isLoading: loadingSummary } = useCourseResultSummary(
    selectedExamId ? Number(selectedExamId) : 0
  )

  const { data: marksList, isLoading: loadingMarks } = useExamMarks(
    selectedExamId ? Number(selectedExamId) : 0
  )
  const studentsMarks = marksList || []

  const handleExportCSV = () => {
    if (!summary) return
    const headers = ['Exam_ID', 'Total_Registered', 'Total_Passed', 'Pass_Percentage', 'Average_Marks']
    const summaryRow = [
      summary.exam_id,
      summary.total_registered,
      summary.total_passed,
      `${summary.pass_percentage}%`,
      summary.average_marks
    ].join(',')

    const studentHeaders = ['Registration_ID', 'Student_ID', 'Student_Name', 'Marks', 'Grade', 'Grade_Points']
    const studentRows = studentsMarks.map(s => [
      s.registration_id,
      s.student_id,
      `"${s.first_name} ${s.last_name}"`,
      s.marks !== null ? s.marks : 'N/A',
      s.grade || 'N/A',
      s.grade_points !== null ? s.grade_points : 'N/A'
    ].join(','))

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), summaryRow, '', studentHeaders.join(','), ...studentRows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `course_result_summary_exam_${selectedExamId}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (row: MarksResultItem) => (
        <span style={{ fontWeight: 600 }}>{row.first_name} {row.last_name}</span>
      )
    },
    {
      key: 'reg_id',
      header: 'Registration ID',
      render: (row: MarksResultItem) => (
        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
          #{row.registration_id}
        </span>
      )
    },
    {
      key: 'marks',
      header: 'Marks Scored',
      render: (row: MarksResultItem) => (
        <span style={{ fontWeight: 600 }}>
          {row.marks !== null ? `${row.marks} pts` : '—'}
        </span>
      )
    },
    {
      key: 'grade',
      header: 'Assigned Grade',
      render: (row: MarksResultItem) => (
        row.grade ? (
          <StatusPill label={row.grade} status="success" />
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Pending</span>
        )
      )
    },
    {
      key: 'points',
      header: 'Grade Points',
      render: (row: MarksResultItem) => (
        <span style={{ fontWeight: 600 }}>
          {row.grade_points !== null ? row.grade_points : '—'}
        </span>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
              E-12
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Course Result Summary & Distribution
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Analytical overview of pass rates, average scores, and student grade standings.
          </p>
        </div>
        <Button variant="secondary" icon={<Download size={16} />} onClick={handleExportCSV}>
          Export Summary CSV
        </Button>
      </div>

      {/* Select Exam */}
      <Card padding={16}>
        <div style={{ maxWidth: '420px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Select Examination Event *
          </label>
          <Select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            options={exams.map(e => {
              const off = offeringMap.get(e.offering_id)
              const crs = off ? courseMap.get(off.courseId) : `Offering #${e.offering_id}`
              return {
                value: String(e.id),
                label: `Exam #${e.id}: ${crs} (${e.exam_type})`
              }
            })}
          />
        </div>
      </Card>

      {/* KPI Cards */}
      {loadingSummary ? (
        <div style={{ display: 'flex', gap: '16px' }}>
          <LoadingSkeleton height={100} />
          <LoadingSkeleton height={100} />
          <LoadingSkeleton height={100} />
        </div>
      ) : summary ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <Card padding={16}>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Pass Percentage</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: summary.pass_percentage >= 50 ? 'var(--color-success)' : 'var(--color-error)', marginTop: '4px' }}>
              {summary.pass_percentage}%
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              {summary.total_passed} passed of {summary.total_registered} registered
            </div>
          </Card>

          <Card padding={16}>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Class Average Score</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-primary)', marginTop: '4px' }}>
              {summary.average_marks} pts
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Mean across all examinees
            </div>
          </Card>

          <Card padding={16}>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Total Examinees</div>
            <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px' }}>
              {summary.total_registered}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Registered students
            </div>
          </Card>
        </div>
      ) : null}

      {/* Student Results Table */}
      <Card padding={0}>
        {loadingMarks ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <LoadingSkeleton height={44} />
            <LoadingSkeleton height={44} />
          </div>
        ) : studentsMarks.length === 0 ? (
          <EmptyState
            icon={<Award size={36} />}
            title="No examinee records"
            description="No student score records found for this exam event."
          />
        ) : (
          <Table
            columns={columns}
            data={studentsMarks}
          />
        )}
      </Card>
    </div>
  )
}
