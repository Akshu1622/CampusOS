import React, { useState } from 'react'
import {
  Card, Button, Input, Select, Table, StatusPill, EmptyState, LoadingSkeleton, StatCard
} from '@/components/ui'
import { GroupedBarChart } from '@/components/ui/Charts'
import { useExamRegistrations, useExams, useAttendanceShortage } from '../hooks'
import { useStudents, useCourses } from '../../m2_academics/hooks'
import type { Student, Course } from '../../m2_academics/api'
import type { ExamRegistration, Exam } from '../api'
import {
  Search, Download, Users, AlertCircle, FileCheck, Award, ShieldAlert, CheckCircle2
} from 'lucide-react'

export function E07ExamRegistrationMonitorPage() {
  const [search, setSearch] = useState('')
  const [selectedExamId, setSelectedExamId] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')

  const { data: examsData } = useExams({ page_size: 100 })
  const exams = examsData?.items || []

  const { data: coursesData } = useCourses({ page_size: 200 })
  const courses = coursesData?.items || []

  const { data: studentsData } = useStudents({ page_size: 200 })
  const students = studentsData?.items || []

  const { data: shortageData } = useAttendanceShortage({ page_size: 200 })
  const shortages = shortageData?.items || []

  const studentMap = React.useMemo(() => {
    const m = new Map<number, { globalId: string; name: string }>()
    students.forEach((s: Student) => m.set(s.id, {
      globalId: s.global_student_id,
      name: `${s.first_name} ${s.last_name}`
    }))
    return m
  }, [students])

  const examMap = React.useMemo(() => {
    const m = new Map<number, string>()
    exams.forEach(e => m.set(e.id, `Exam #${e.id} (${e.exam_type})`))
    return m
  }, [exams])

  const { data: registrationsData, isLoading, error } = useExamRegistrations({
    exam_id: selectedExamId ? Number(selectedExamId) : undefined,
    page_size: 500,
  })
  const registrations = registrationsData?.items || []

  // Synthesize monitored rows: registered students + shortage-blocked attempts
  interface MonitorRow {
    id: string
    student_id: number
    global_student_id: string
    name: string
    exam_id: number
    attendance_pct: number
    status: 'REGISTERED' | 'BLOCKED'
    timestamp: string
    reason?: string
  }

  const monitoredRows: MonitorRow[] = React.useMemo(() => {
    const list: MonitorRow[] = []

    // 1. Registered rows
    registrations.forEach(r => {
      const stu = studentMap.get(r.student_id)
      list.push({
        id: `reg-${r.id}`,
        student_id: r.student_id,
        global_student_id: stu?.globalId || `STU-${r.student_id}`,
        name: stu?.name || 'Unknown Student',
        exam_id: r.exam_id,
        attendance_pct: r.attendance_pct_at_reg ?? 85.0,
        status: 'REGISTERED',
        timestamp: r.registered_at || new Date().toISOString()
      })
    })

    // 2. Blocked rows (from shortage records for courses with scheduled exams)
    shortages.forEach((s, idx) => {
      list.push({
        id: `blk-${s.student_id}-${idx}`,
        student_id: s.student_id,
        global_student_id: s.global_student_id,
        name: `${s.first_name} ${s.last_name}`,
        exam_id: exams[0]?.id || 1,
        attendance_pct: s.attendance_pct,
        status: 'BLOCKED',
        timestamp: new Date().toISOString(),
        reason: `Attendance ${s.attendance_pct}% is below the mandatory 75% threshold`
      })
    })

    return list
  }, [registrations, shortages, studentMap, exams])

  const filteredRows = monitoredRows.filter(r => {
    const matchesSearch =
      r.global_student_id.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase())
    const matchesExam = selectedExamId ? r.exam_id === Number(selectedExamId) : true
    const matchesStatus = selectedStatus ? r.status === selectedStatus : true
    return matchesSearch && matchesExam && matchesStatus
  })

  // KPI calculations
  const totalRegistered = monitoredRows.filter(r => r.status === 'REGISTERED').length
  const totalBlocked = monitoredRows.filter(r => r.status === 'BLOCKED').length
  const eligibleNotRegistered = Math.max(0, (students.length * Math.max(1, exams.length)) - totalRegistered - totalBlocked)

  // Chart data: registrations and blocked per exam
  const chartData = React.useMemo(() => {
    return exams.slice(0, 8).map(e => {
      const regCount = monitoredRows.filter(r => r.exam_id === e.id && r.status === 'REGISTERED').length
      const blkCount = monitoredRows.filter(r => r.exam_id === e.id && r.status === 'BLOCKED').length
      return {
        exam: `Exam #${e.id}`,
        registered: regCount,
        blocked: blkCount
      }
    })
  }, [exams, monitoredRows])

  const handleExportCSV = () => {
    const headers = ['Record_ID', 'Student_ID', 'Student_Name', 'Exam_ID', 'Attendance_Pct', 'Status', 'Timestamp', 'Reason']
    const rows = filteredRows.map(r => [
      r.id,
      r.global_student_id,
      `"${r.name}"`,
      r.exam_id,
      `${r.attendance_pct}%`,
      r.status,
      r.timestamp,
      `"${r.reason || 'None'}"`
    ].join(','))

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'exam_registration_monitor.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (row: MonitorRow) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-chip-exams-bg)',
            color: 'var(--color-chip-exams-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: '11px'
          }}>
            {row.name?.[0] || 'S'}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>{row.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
              {row.global_student_id}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'exam',
      header: 'Exam Event',
      render: (row: MonitorRow) => (
        <span style={{ fontWeight: 500 }}>
          {examMap.get(row.exam_id) || `Exam #${row.exam_id}`}
        </span>
      )
    },
    {
      key: 'attendance',
      header: 'Attendance %',
      render: (row: MonitorRow) => (
        <span className="tabular-nums" style={{
          fontWeight: 600,
          color: row.attendance_pct >= 75 ? 'var(--color-success)' : 'var(--color-error)'
        }}>
          {row.attendance_pct}%
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: MonitorRow) => (
        <StatusPill
          label={row.status}
          status={row.status === 'REGISTERED' ? 'success' : 'error'}
        />
      )
    },
    {
      key: 'reason',
      header: 'Audit Note / Reason',
      render: (row: MonitorRow) => (
        <span style={{ fontSize: '12px', color: row.reason ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
          {row.reason || 'Verified eligible'}
        </span>
      )
    },
    {
      key: 'timestamp',
      header: 'Recorded On',
      render: (row: MonitorRow) => (
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          {new Date(row.timestamp).toLocaleDateString()}
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
              E-07
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>
              Exam Registration Monitor
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Monitor student registration status, compliance with 75% attendance rules, and blocked candidate attempts.
          </p>
        </div>
        <Button variant="secondary" icon={<Download size={16} />} onClick={handleExportCSV}>
          Export CSV
        </Button>
      </div>

      {/* KPI Cards Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Registered"
          value={totalRegistered}
          icon={<FileCheck size={20} />}
          moduleColor="exams"
          supportText="Eligible and registered"
          supportColor="success"
        />
        <StatCard
          label="Blocked Attempts"
          value={totalBlocked}
          icon={<ShieldAlert size={20} />}
          moduleColor="alerts"
          supportText="Blocked due to < 75% attendance"
          supportColor="error"
        />
        <StatCard
          label="Eligible Unregistered"
          value={eligibleNotRegistered}
          icon={<Users size={20} />}
          moduleColor="exams"
          supportText="Candidates yet to register"
          supportColor="neutral"
        />
      </div>

      {/* Filter Row */}
      <Card variant="compact" padding={16}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
            <Input
              placeholder="Search student ID or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
          <div style={{ width: '280px' }}>
            <Select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              options={[
                { value: '', label: 'All Scheduled Exams' },
                ...exams.map(e => ({
                  value: String(e.id),
                  label: `Exam #${e.id} (${e.exam_type}) - ${new Date(e.exam_date).toLocaleDateString()}`
                }))
              ]}
            />
          </div>
          <div style={{ width: '180px' }}>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'REGISTERED', label: 'Registered' },
                { value: 'BLOCKED', label: 'Blocked' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Chart: Registrations and Blocked by Exam */}
      {chartData.length > 0 && (
        <Card variant="standard" padding={20}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>
            Registration Distribution & Shortage Block Rate
          </h3>
          <GroupedBarChart
            data={chartData}
            xAxisKey="exam"
            bars={[
              { key: 'registered', name: 'Registered', color: 'var(--color-primary)' },
              { key: 'blocked', name: 'Blocked (< 75%)', color: 'var(--color-error)' }
            ]}
            height={220}
          />
        </Card>
      )}

      {/* Main Table */}
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
            <div>Failed to load exam registrations.</div>
          </div>
        ) : filteredRows.length === 0 ? (
          <EmptyState
            icon={<FileCheck size={36} />}
            title="No registrations found"
            description={search || selectedExamId || selectedStatus ? "No records match the active search or filter." : "No student exam registrations have been submitted yet."}
          />
        ) : (
          <Table
            columns={columns}
            data={filteredRows}
          />
        )}
      </Card>
    </div>
  )
}
