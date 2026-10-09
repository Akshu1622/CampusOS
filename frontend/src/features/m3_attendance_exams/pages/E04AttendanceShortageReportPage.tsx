import React, { useState } from 'react'
import {
  Card, Button, Input, Table, StatusPill, EmptyState, LoadingSkeleton
} from '@/components/ui'
import { useAttendanceShortage } from '../hooks'
import type { AttendanceShortageItem } from '../api'
import {
  Search, Download, Users, AlertTriangle, AlertCircle
} from 'lucide-react'

export function E04AttendanceShortageReportPage() {
  const [search, setSearch] = useState('')

  const { data: shortageData, isLoading, error } = useAttendanceShortage({ page_size: 200 })
  const items = shortageData?.items || []

  const filteredItems = items.filter(i =>
    i.global_student_id.toLowerCase().includes(search.toLowerCase()) ||
    i.first_name.toLowerCase().includes(search.toLowerCase()) ||
    i.last_name.toLowerCase().includes(search.toLowerCase()) ||
    i.course_code.toLowerCase().includes(search.toLowerCase())
  )

  const distinctCourses = new Set(items.map(i => i.course_code)).size

  const handleExportCSV = () => {
    const headers = ['Student_ID', 'Student_Name', 'Course_Code', 'Course_Title', 'Held', 'Attended', 'Attendance_Pct', 'Shortage_Gap_To_75']
    const rows = filteredItems.map(i => {
      // Calculate gap to 75%: (0.75 * held - attended)
      const gap = Math.max(0, Math.ceil(0.75 * i.sessions_held - i.sessions_attended))
      return [
        i.global_student_id,
        `${i.first_name} ${i.last_name}`,
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
    link.setAttribute('download', 'attendance_shortage_report.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const columns = [
    {
      key: 'student_id',
      header: 'Student ID',
      render: (row: AttendanceShortageItem) => (
        <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>
          {row.global_student_id}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Student Name',
      render: (row: AttendanceShortageItem) => (
        <span style={{ fontWeight: 500 }}>
          {row.first_name} {row.last_name}
        </span>
      )
    },
    {
      key: 'course',
      header: 'Course',
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
        <span style={{ fontSize: '13px' }}>
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
      header: 'Gap to 75% Threshold',
      render: (row: AttendanceShortageItem) => {
        const gap = Math.max(0, Math.ceil(0.75 * row.sessions_held - row.sessions_attended))
        return (
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-error)' }}>
            {gap} session{gap === 1 ? '' : 's'} needed
          </span>
        )
      }
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
              E-04
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Attendance Shortage Report (&lt; 75%)
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Students with attendance below 75% who are currently blocked from exam registration.
          </p>
        </div>
        <Button variant="secondary" icon={<Download size={16} />} onClick={handleExportCSV}>
          Export Report CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Card padding={16}>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Total Students in Shortage</div>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: 'var(--color-error)' }}>
            {items.length}
          </div>
        </Card>
        <Card padding={16}>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Affected Courses</div>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px' }}>
            {distinctCourses}
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card padding={16}>
        <div style={{ maxWidth: '360px' }}>
          <Input
            placeholder="Search student ID, name, or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
      </Card>

      {/* Main Table */}
      <Card padding={0}>
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
            title="No students below 75% attendance"
            description={search ? "No shortage records match your search." : "All enrolled students currently meet the minimum 75% attendance criteria."}
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
