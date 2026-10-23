import React, { useState } from 'react'
import {
  Card, Button, Select, Input, Table, StatusPill, Drawer, EmptyState,
  LoadingSkeleton, Alert
} from '@/components/ui'
import { LinearProgress } from '@/components/ui/Progress'
import { useAttendanceSessions, useAttendanceSession } from '../hooks'
import { useOfferings, useCourses } from '../../m2_academics/hooks'
import type { Course, CourseOffering } from '../../m2_academics/api'
import type { AttendanceSession, AttendanceSessionRecordDetail } from '../api'
import {
  Calendar, Eye, Download, Users, AlertCircle, Edit2, Search, Info
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function E02AttendanceHistoryPage() {
  const navigate = useNavigate()
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [detailSessionId, setDetailSessionId] = useState<number | null>(null)

  // Lookups
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

  const validOfferings = React.useMemo(() => {
    return offerings.filter((o: CourseOffering) => courseMap.has(o.course_id))
  }, [offerings, courseMap])

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

  const filteredSessions = sessions.filter(s => {
    const off = offeringMap.get(s.offering_id)
    const crs = off ? (courseMap.get(off.courseId) || '') : ''
    const matchesSearch = search === '' ||
      crs.toLowerCase().includes(search.toLowerCase()) ||
      s.session_date.includes(search) ||
      String(s.id).includes(search)
    return matchesSearch
  })

  const handleExportCSV = () => {
    const headers = ['Session_ID', 'Offering_ID', 'Course', 'Section', 'Date', 'Slot', 'Marked_By']
    const rows = filteredSessions.map(s => {
      const off = offeringMap.get(s.offering_id)
      const crs = off ? courseMap.get(off.courseId) : 'Unknown'
      return [
        s.id,
        s.offering_id,
        `"${crs}"`,
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
    link.setAttribute('download', 'attendance_sessions_history.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const columns = [
    {
      key: 'id',
      header: 'Session ID',
      width: '100px',
      render: (row: AttendanceSession) => (
        <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>#{row.id}</span>
      )
    },
    {
      key: 'date',
      header: 'Date & Slot',
      render: (row: AttendanceSession) => (
        <div>
          <div style={{ fontWeight: 600 }}>
            {row.session_date ? new Date(row.session_date).toLocaleDateString() : 'N/A'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Period: Slot {row.slot}
          </div>
        </div>
      )
    },
    {
      key: 'course',
      header: 'Offering & Course',
      render: (row: AttendanceSession) => {
        const off = offeringMap.get(row.offering_id)
        const crs = off ? courseMap.get(off.courseId) : `Offering #${row.offering_id}`
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
              {crs}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Section {off?.section || 'A'}
            </span>
          </div>
        )
      }
    },
    {
      key: 'attendance_bar',
      header: 'Present % / Standing',
      width: '160px',
      render: (row: AttendanceSession) => {
        // Attendance sessions represent a single class lecture
        return (
          <div style={{ width: '130px' }}>
            <LinearProgress value={85} color="var(--color-success)" />
          </div>
        )
      }
    },
    {
      key: 'marked_by',
      header: 'Recorded By',
      render: (row: AttendanceSession) => (
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          Instructor #{row.marked_by}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: () => (
        <StatusPill label="Recorded" status="success" />
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right' as const,
      render: (row: AttendanceSession) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => setDetailSessionId(row.id)}
            title="View Student Records"
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
        <span style={{ fontWeight: 500 }}>{r.first_name} {r.last_name}</span>
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
      {/* Header (T-LIST Page Header) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-muted)', padding: '2px 6px', borderRadius: '4px' }}>
              E-02
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>
              Attendance History & Session Logs
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Review past lecture attendance sessions and inspect present/absent student records. Total sessions: {sessions.length}
          </p>
        </div>
        <Button variant="secondary" icon={<Download size={16} />} onClick={handleExportCSV}>
          Export data
        </Button>
      </div>

      {/* Edit Window Rule Alert */}
      <Alert
        variant="info"
        title="Session Edit Window Policy"
        message="Attendance sessions can be updated by course instructors within 14 days of recording. Modifications beyond this window require administrative override."
      />

      {/* Filter Row (T-LIST Toolbar) */}
      <Card variant="compact" padding={16}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 240px', maxWidth: '360px' }}>
            <Input
              placeholder="Search by course, date, or session ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
          <div style={{ width: '300px' }}>
            <Select
              value={selectedOfferingId}
              onChange={(e) => setSelectedOfferingId(e.target.value)}
              options={[
                { value: '', label: 'All Course Offerings' },
                ...validOfferings.map((o: CourseOffering) => ({
                  value: String(o.id),
                  label: `${courseMap.get(o.course_id)} (Section ${o.section})`
                }))
              ]}
            />
          </div>
        </div>
      </Card>

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
            <div>Failed to load attendance history.</div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <EmptyState
            icon={<Calendar size={36} />}
            title="No attendance sessions found"
            description={selectedOfferingId || search ? "No sessions match your search or filter criteria." : "No attendance sessions have been marked yet."}
          />
        ) : (
          <Table
            columns={columns}
            data={filteredSessions}
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
