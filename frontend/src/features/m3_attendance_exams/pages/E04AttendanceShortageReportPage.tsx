import React, { useState } from 'react'
import {
  Card, Button, Input, Select, Table, StatusPill, EmptyState, LoadingSkeleton, StatCard
} from '@/components/ui'
import { useAttendanceShortage } from '../hooks'
import { useCourses, useDepartments } from '../../m2_academics/hooks'
import { calculateGapTo75 } from '../utils'
import type { AttendanceShortageItem } from '../api'
import type { Course } from '../../m2_academics/api'
import {
  Search, Download, Users, AlertTriangle, AlertCircle, BookOpen, Layers
} from 'lucide-react'

export function E04AttendanceShortageReportPage() {
  const [search, setSearch] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [selectedDept, setSelectedDept] = useState<string>('')
  const [threshold, setThreshold] = useState<number>(75)

  const { data: shortageData, isLoading, error } = useAttendanceShortage({ page_size: 200 })
  const items = shortageData?.items || []

  const { data: coursesData } = useCourses({ page_size: 200 })
  const courses = coursesData?.items || []

  const { data: deptsData } = useDepartments()
  const departments = deptsData || []

  const filteredItems = items.filter(i => {
    const matchesSearch =
      i.global_student_id.toLowerCase().includes(search.toLowerCase()) ||
      i.first_name.toLowerCase().includes(search.toLowerCase()) ||
      i.last_name.toLowerCase().includes(search.toLowerCase()) ||
      i.course_code.toLowerCase().includes(search.toLowerCase())

    const matchesCourse = selectedCourse ? i.course_code === selectedCourse : true
    const matchesThreshold = i.attendance_pct < threshold

    return matchesSearch && matchesCourse && matchesThreshold
  })

  const distinctCourses = new Set(filteredItems.map(i => i.course_code)).size

  const handleExportCSV = () => {
    const headers = ['Student_ID', 'Student_Name', 'Course_Code', 'Course_Title', 'Held', 'Attended', 'Attendance_Pct', 'Shortage_Gap_Sessions_Needed']
    const rows = filteredItems.map(i => {
      const gap = calculateGapTo75(i.sessions_attended, i.sessions_held, threshold)
      return [
        i.global_student_id,
        `"${i.first_name} ${i.last_name}"`,
        i.course_code,
        `"${i.course_title}"`,
        i.sessions_held,
        i.sessions_attended,
        `${i.attendance_pct}%`,
        gap
      ].join(',')
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `attendance_shortage_report_threshold_${threshold}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (row: AttendanceShortageItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-chip-alerts-bg)',
            color: 'var(--color-chip-alerts-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: '11px'
          }}>
            {row.first_name?.[0] || 'S'}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>
              {row.first_name} {row.last_name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
              {row.global_student_id}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'course',
      header: 'Course Offering',
      render: (row: AttendanceShortageItem) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
            {row.course_code}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {row.course_title}
          </span>
        </div>
      )
    },
    {
      key: 'attendance',
      header: 'Held / Attended',
      render: (row: AttendanceShortageItem) => (
        <span className="tabular-nums" style={{ fontSize: '13px' }}>
          {row.sessions_attended} / {row.sessions_held} sessions
        </span>
      )
    },
    {
      key: 'pct',
      header: 'Attendance %',
      render: (row: AttendanceShortageItem) => (
        <StatusPill
          label={`${row.attendance_pct}%`}
          status="error"
        />
      )
    },
    {
      key: 'gap',
      header: `Gap to ${threshold}%`,
      render: (row: AttendanceShortageItem) => {
        const gap = calculateGapTo75(row.sessions_attended, row.sessions_held, threshold)
        return (
          <span className="tabular-nums" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-error)' }}>
            {gap} session{gap === 1 ? '' : 's'} needed
          </span>
        )
      }
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header (T-REPORT Header) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-muted)', padding: '2px 6px', borderRadius: '4px' }}>
              E-04
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>
              Attendance Shortage Report
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Identifies students below the 75% attendance threshold who are blocked from examination registration.
          </p>
        </div>
        <Button variant="secondary" icon={<Download size={16} />} onClick={handleExportCSV}>
          Export CSV
        </Button>
      </div>

      {/* Parameters Bar (T-REPORT Parameters Bar) */}
      <Card variant="compact" padding={16}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
            <Input
              placeholder="Search student ID, name, course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>

          <div style={{ width: '220px' }}>
            <Select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              options={[
                { value: '', label: 'All Courses' },
                ...courses.map((c: Course) => ({
                  value: c.code,
                  label: `${c.code} - ${c.title}`
                }))
              ]}
            />
          </div>

          <div style={{ width: '160px' }}>
            <Select
              value={String(threshold)}
              onChange={(e) => setThreshold(Number(e.target.value))}
              options={[
                { value: '75', label: 'Threshold: < 75%' },
                { value: '80', label: 'Threshold: < 80%' },
                { value: '70', label: 'Threshold: < 70%' },
                { value: '60', label: 'Threshold: < 60%' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* KPI Cards Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Students in Shortage"
          value={filteredItems.length}
          icon={<AlertTriangle size={20} />}
          moduleColor="alerts"
          supportText={`Below ${threshold}% attendance`}
          supportColor="error"
        />
        <StatCard
          label="Courses Affected"
          value={distinctCourses}
          icon={<BookOpen size={20} />}
          moduleColor="alerts"
          supportText="Active course offerings"
          supportColor="neutral"
        />
      </div>

      {/* Main Table Card */}
      <Card variant="standard" padding={0}>
        {isLoading ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <LoadingSkeleton height={44} />
            <LoadingSkeleton height={44} />
            <LoadingSkeleton height={44} />
          </div>
        ) : error ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-error)' }}>
            <AlertCircle size={32} style={{ marginBottom: '8px' }} />
            <div>Failed to load attendance shortage report.</div>
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={<Users size={36} />}
            title={`No students below ${threshold}% attendance`}
            description={search || selectedCourse ? "No records match your filters." : `All enrolled students meet the ${threshold}% attendance requirement.`}
          />
        ) : (
          <Table
            columns={columns}
            data={filteredItems}
          />
        )}
      </Card>
    </div>
  )
}
