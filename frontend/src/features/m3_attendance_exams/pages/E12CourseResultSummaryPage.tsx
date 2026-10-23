import React, { useState } from 'react'
import {
  Card, Button, Select, Table, StatusPill, EmptyState, LoadingSkeleton, StatCard
} from '@/components/ui'
import { GroupedBarChart } from '@/components/ui/Charts'
import {
  useExams, useCourseResultSummary, useExamMarks
} from '../hooks'
import { useOfferings, useCourses } from '../../m2_academics/hooks'
import type { Course, CourseOffering } from '../../m2_academics/api'
import type { MarksResultItem } from '../api'
import {
  Download, Award, Users, CheckCircle2, TrendingUp, AlertCircle, ArrowDown, ArrowUp, BarChart3
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
    courses
      .filter((c: Course) => !c.code.startsWith('CS0') && !c.title.toLowerCase().startsWith('course '))
      .forEach((c: Course) => m.set(c.id, `${c.code} - ${c.title}`))
    return m
  }, [courses])

  const offeringMap = React.useMemo(() => {
    const m = new Map<number, { courseId: number; section: string }>()
    offerings.forEach((o: CourseOffering) => m.set(o.id, { courseId: o.course_id, section: o.section }))
    return m
  }, [offerings])

  const validExams = React.useMemo(() => {
    return exams.filter(e => {
      const off = offeringMap.get(e.offering_id)
      return off && courseMap.has(off.courseId)
    })
  }, [exams, offeringMap, courseMap])

  // Auto-select first exam if none selected
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

  // Rank students descending by marks scored
  const rankedStudents = React.useMemo(() => {
    const sorted = [...studentsMarks].sort((a, b) => (b.marks ?? -1) - (a.marks ?? -1))
    return sorted.map((s, idx) => ({
      ...s,
      rank: idx + 1
    }))
  }, [studentsMarks])

  // Compute highest & lowest marks
  const validMarks = studentsMarks.map(s => s.marks).filter((m): m is number => m !== null)
  const highestScore = validMarks.length > 0 ? Math.max(...validMarks) : 0
  const lowestScore = validMarks.length > 0 ? Math.min(...validMarks) : 0
  const averageScore = summary?.average_marks ?? (validMarks.length > 0 ? Math.round(validMarks.reduce((a, b) => a + b, 0) / validMarks.length) : 0)

  // Grade distribution bar chart data
  const gradeDistributionData = React.useMemo(() => {
    const grades = ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F']
    const counts: { [grade: string]: number } = {}
    grades.forEach(g => { counts[g] = 0 })

    studentsMarks.forEach(s => {
      if (s.grade) {
        counts[s.grade] = (counts[s.grade] || 0) + 1
      }
    })

    return grades.map(grade => ({
      grade,
      count: counts[grade] || 0
    }))
  }, [studentsMarks])

  const getGradePillStatus = (grade: string | null): 'success' | 'info' | 'warning' | 'error' | 'neutral' => {
    if (!grade) return 'neutral'
    const g = grade.toUpperCase()
    if (g === 'O' || g === 'A+' || g === 'A') return 'success'
    if (g === 'B+' || g === 'B') return 'info'
    if (g === 'C' || g === 'P') return 'warning'
    if (g === 'F') return 'error'
    return 'neutral'
  }

  const handleExportCSV = () => {
    if (!summary && rankedStudents.length === 0) return
    const headers = ['Rank', 'Student_ID', 'Student_Name', 'Marks_Scored', 'Assigned_Grade', 'Grade_Points']
    const rows = rankedStudents.map(s => [
      s.rank,
      s.student_id,
      `"${s.first_name} ${s.last_name}"`,
      s.marks !== null ? s.marks : 'N/A',
      s.grade || 'N/A',
      s.grade_points !== null ? s.grade_points : 'N/A'
    ].join(','))

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n')
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
      key: 'rank',
      header: 'Rank',
      width: '80px',
      render: (row: any) => (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: row.rank === 1 ? 'var(--color-chip-finance-bg)' : 'var(--color-surface-muted)',
          color: row.rank === 1 ? 'var(--color-warning)' : 'var(--color-text-secondary)',
          fontWeight: 700,
          fontSize: '12px'
        }}>
          #{row.rank}
        </span>
      )
    },
    {
      key: 'student',
      header: 'Student',
      render: (row: MarksResultItem) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600 }}>{row.first_name} {row.last_name}</span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
            ID #{row.student_id} • Reg #{row.registration_id}
          </span>
        </div>
      )
    },
    {
      key: 'marks',
      header: 'Marks Scored',
      render: (row: MarksResultItem) => (
        <span className="tabular-nums" style={{ fontWeight: 600, fontSize: '14px' }}>
          {row.marks !== null ? `${row.marks} pts` : '—'}
        </span>
      )
    },
    {
      key: 'grade',
      header: 'Assigned Grade',
      render: (row: MarksResultItem) => (
        row.grade ? (
          <StatusPill
            label={row.grade}
            status={getGradePillStatus(row.grade)}
          />
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Pending</span>
        )
      )
    },
    {
      key: 'points',
      header: 'Grade Points',
      render: (row: MarksResultItem) => (
        <span className="tabular-nums" style={{ fontWeight: 600 }}>
          {row.grade_points !== null ? row.grade_points : '—'}
        </span>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header (T-REPORT Header) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-muted)', padding: '2px 6px', borderRadius: '4px' }}>
              E-12
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>
              Course Result Summary
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Analytical overview of class pass rates, score distribution, and student rank standings.
          </p>
        </div>
        <Button variant="secondary" icon={<Download size={16} />} onClick={handleExportCSV}>
          Export Summary CSV
        </Button>
      </div>

      {/* Select Exam Bar */}
      <Card variant="compact" padding={16}>
        <div style={{ maxWidth: '440px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
            Select Course Examination Event *
          </label>
          <Select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            options={validExams.map(e => {
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

      {/* 4 KPIs: Pass %, Average, Highest, Lowest (StatCards with Violet chips) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Pass Percentage"
          value={summary ? `${summary.pass_percentage}%` : `${rankedStudents.length > 0 ? Math.round((rankedStudents.filter(s => s.grade && s.grade !== 'F').length / rankedStudents.length) * 100) : 0}%`}
          icon={<CheckCircle2 size={20} />}
          moduleColor="exams"
          supportText={summary ? `${summary.total_passed} of ${summary.total_registered} passed` : 'Qualifying examinees'}
          supportColor="success"
        />

        <StatCard
          label="Class Average Score"
          value={`${averageScore} pts`}
          icon={<TrendingUp size={20} />}
          moduleColor="exams"
          supportText="Arithmetic mean across all examinees"
          supportColor="neutral"
        />

        <StatCard
          label="Highest Score"
          value={`${highestScore} pts`}
          icon={<ArrowUp size={20} />}
          moduleColor="exams"
          supportText="Top ranking student mark"
          supportColor="success"
        />

        <StatCard
          label="Lowest Score"
          value={`${lowestScore} pts`}
          icon={<ArrowDown size={20} />}
          moduleColor="exams"
          supportText="Minimum recorded score"
          supportColor="error"
        />
      </div>

      {/* Grade Distribution Bar Chart */}
      {gradeDistributionData.length > 0 && (
        <Card variant="standard" padding={20}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>
            Grade Distribution Across Examinees
          </h3>
          <GroupedBarChart
            data={gradeDistributionData}
            xAxisKey="grade"
            bars={[
              { key: 'count', name: 'Student Count', color: 'var(--color-primary)' }
            ]}
            height={220}
          />
        </Card>
      )}

      {/* Student Rank List Table */}
      <Card variant="standard" padding={0}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-muted)' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
            Student Merit & Rank Standing
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Rank ordered by marks scored in examination event #{selectedExamId}
          </p>
        </div>

        {loadingMarks ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <LoadingSkeleton height={44} />
            <LoadingSkeleton height={44} />
            <LoadingSkeleton height={44} />
          </div>
        ) : rankedStudents.length === 0 ? (
          <EmptyState
            icon={<Award size={36} />}
            title="No examinee records"
            description="No student score records found for this examination event."
          />
        ) : (
          <Table
            columns={columns}
            data={rankedStudents}
          />
        )}
      </Card>
    </div>
  )
}
