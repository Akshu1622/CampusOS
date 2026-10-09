import React, { useState } from 'react'
import {
  Card, Button, Select, Table, StatusPill, Drawer, EmptyState,
  LoadingSkeleton
} from '@/components/ui'
import { useAttendanceSessions, useAttendanceSession } from '../hooks'
import { useOfferings, useCourses } from '../../m2_academics/hooks'
import type { Course, CourseOffering } from '../../m2_academics/api'
import type { AttendanceSession, AttendanceSessionRecordDetail } from '../api'
import {
  Calendar, Eye, Download, Users, AlertCircle, Edit2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function E02AttendanceHistoryPage() {
  const navigate = useNavigate()
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>('')
  const [detailSessionId, setDetailSessionId] = useState<number | null>(null)

  // Lookups
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

  // Sessions query
  const { data: sessionsData, isLoading, error } = useAttendanceSessions({
    offering_id: selectedOfferingId ? Number(selectedOfferingId) : undefined,
    page_size: 100,
  })
  const sessions = sessionsData?.items || []

  // Selected session detail query
  const { data: sessionDetail, isLoading: loadingDetail } = useAttendanceSession(
    detailSessionId || 0
  )
  const detailRecords = sessionDetail?.records || []

  const handleExportCSV = () => {
    const headers = ['Session_ID', 'Offering_ID', 'Course', 'Section', 'Date', 'Slot', 'Marked_By']
    const rows = sessions.map(s => {
      const off = offeringMap.get(s.offering_id)
      const crs = off ? courseMap.get(off.courseId) : 'Unknown'
      return [
        s.id,
        s.offering_id,
        crs,
        off?.section || 'N/A',
        s.session_date,
        `Slot ${s.slot}`,
        `Employee #${s.marked_by}`
      ].join(',')
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'attendance_history.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const columns = [
    {
      key: 'id',
      header: 'Session ID',
      render: (row: AttendanceSession) => (
        <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>#{row.id}</span>
      )
    },
    {
      key: 'date',
      header: 'Session Date',
      render: (row: AttendanceSession) => (
        <span style={{ fontWeight: 500 }}>
          {row.session_date ? new Date(row.session_date).toLocaleDateString() : 'N/A'}
        </span>
      )
    },
    {
      key: 'course',
      header: 'Course & Section',
      render: (row: AttendanceSession) => {
        const off = offeringMap.get(row.offering_id)
        const crs = off ? courseMap.get(off.courseId) : `Offering #${row.offering_id}`
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
              {crs}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Section {off?.section || 'N/A'}
            </span>
          </div>
        )
      }
    },
    {
      key: 'slot',
      header: 'Period / Slot',
      render: (row: AttendanceSession) => (
        <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--color-surface-subtle)', fontSize: '13px' }}>
          Slot {row.slot}
        </span>
      )
    },
    {
      key: 'marked_by',
      header: 'Marked By',
      render: (row: AttendanceSession) => (
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          Instructor #{row.marked_by}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: AttendanceSession) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => setDetailSessionId(row.id)}
            title="View Attendance Records"
          >
            <Eye size={14} />
          </Button>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => navigate(`/faculty/attendance?offeringId=${row.offering_id}`)}
            title="Edit Attendance"
          >
            <Edit2 size={14} />
          </Button>
        </div>
      )
    }
  ]

  const recordColumns = [
    {
      key: 'student_id',
      header: 'Student ID',
      render: (r: AttendanceSessionRecordDetail) => (
        <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>
          {r.global_student_id || `#${r.student_id}`}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Student Name',
      render: (r: AttendanceSessionRecordDetail) => (
        <span>{r.first_name} {r.last_name}</span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (r: AttendanceSessionRecordDetail) => (
        <StatusPill
          label={r.status}
          status={r.status === 'PRESENT' ? 'success' : 'error'}
        />
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
              E-02
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Attendance History & Session Logs
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Review past lecture attendance sessions and inspect present/absent student records.
          </p>
        </div>
        <Button variant="secondary" icon={<Download size={16} />} onClick={handleExportCSV}>
          Export CSV
        </Button>
      </div>

      {/* Filter Bar */}
      <Card padding={16}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: '320px' }}>
            <Select
              value={selectedOfferingId}
              onChange={(e) => setSelectedOfferingId(e.target.value)}
              options={[
                { value: '', label: 'All Course Offerings' },
                ...offerings.map((o: CourseOffering) => ({
                  value: String(o.id),
                  label: `${courseMap.get(o.course_id) || `Offering #${o.id}`} (Sec ${o.section})`
                }))
              ]}
            />
          </div>
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
            <div>Failed to load attendance history.</div>
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={<Calendar size={36} />}
            title="No attendance sessions found"
            description={selectedOfferingId ? "No sessions recorded for this course offering." : "No attendance sessions have been marked yet."}
          />
        ) : (
          <Table
            columns={columns}
            data={sessions}
          />
        )}
      </Card>

      {/* Detail Session Drawer */}
      <Drawer
        isOpen={!!detailSessionId}
        onClose={() => setDetailSessionId(null)}
        title={sessionDetail ? `Session Records: ${sessionDetail.session_date} (Slot ${sessionDetail.slot})` : 'Session Detail'}
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loadingDetail ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <LoadingSkeleton height={40} />
              <LoadingSkeleton height={40} />
            </div>
          ) : detailRecords.length === 0 ? (
            <EmptyState
              icon={<Users size={32} />}
              title="No records in this session"
              description="No individual student attendance records found."
            />
          ) : (
            <div>
              <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Total students recorded: <strong>{detailRecords.length}</strong>
              </div>
              <Table
                columns={recordColumns}
                data={detailRecords}
              />
            </div>
          )}
        </div>
      </Drawer>
    </div>
  )
}
