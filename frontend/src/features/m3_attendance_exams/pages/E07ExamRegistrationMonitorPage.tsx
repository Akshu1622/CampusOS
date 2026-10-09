import React, { useState } from 'react'
import {
  Card, Button, Input, Select, Table, StatusPill, EmptyState, LoadingSkeleton
} from '@/components/ui'
import { useExamRegistrations, useExams } from '../hooks'
import { useStudents } from '../../m2_academics/hooks'
import type { Student } from '../../m2_academics/api'
import type { ExamRegistration } from '../api'
import {
  Search, Download, Users, AlertCircle, FileCheck
} from 'lucide-react'

export function E07ExamRegistrationMonitorPage() {
  const [search, setSearch] = useState('')
  const [selectedExamId, setSelectedExamId] = useState<string>('')

  const { data: examsData } = useExams({ page_size: 100 })
  const exams = examsData?.items || []

  const { data: studentsData } = useStudents({ page_size: 200 })
  const students = studentsData?.items || []

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
    page_size: 200,
  })
  const registrations = registrationsData?.items || []

  const filteredRegistrations = registrations.filter(r => {
    const stu = studentMap.get(r.student_id)
    return (
      (stu?.globalId.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (stu?.name.toLowerCase().includes(search.toLowerCase()) ?? false)
    )
  })

  const distinctStudents = new Set(registrations.map(r => r.student_id)).size

  const handleExportCSV = () => {
    const headers = ['Registration_ID', 'Student_ID', 'Student_Name', 'Exam_ID', 'Attendance_Pct_At_Reg', 'Registered_At']
    const rows = filteredRegistrations.map(r => {
      const stu = studentMap.get(r.student_id)
      return [
        r.id,
        stu?.globalId || r.student_id,
        stu?.name || 'Unknown',
        r.exam_id,
        r.attendance_pct_at_reg !== undefined ? `${r.attendance_pct_at_reg}%` : 'N/A',
        r.registered_at ? new Date(r.registered_at).toISOString() : 'N/A'
      ].join(',')
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'exam_registrations.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const columns = [
    {
      key: 'id',
      header: 'Reg ID',
      render: (row: ExamRegistration) => (
        <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>#{row.id}</span>
      )
    },
    {
      key: 'student',
      header: 'Student',
      render: (row: ExamRegistration) => {
        const stu = studentMap.get(row.student_id)
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600 }}>{stu?.name || `Student #${row.student_id}`}</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
              {stu?.globalId || ''}
            </span>
          </div>
        )
      }
    },
    {
      key: 'exam',
      header: 'Exam Event',
      render: (row: ExamRegistration) => (
        <span style={{ fontWeight: 500 }}>
          {examMap.get(row.exam_id) || `Exam #${row.exam_id}`}
        </span>
      )
    },
    {
      key: 'attendance',
      header: 'Attendance % at Registration',
      render: (row: ExamRegistration) => (
        <span style={{ fontWeight: 600 }}>
          {row.attendance_pct_at_reg !== undefined ? `${row.attendance_pct_at_reg}%` : '≥ 75%'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: () => <StatusPill label="REGISTERED" status="success" />
    },
    {
      key: 'registered_at',
      header: 'Registered Date',
      render: (row: ExamRegistration) => (
        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          {row.registered_at ? new Date(row.registered_at).toLocaleString() : 'N/A'}
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
              E-07
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Exam Registration Monitor
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Monitor student registrations, attendance checks, and active exam rosters.
          </p>
        </div>
        <Button variant="secondary" icon={<Download size={16} />} onClick={handleExportCSV}>
          Export CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Card padding={16}>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Total Registrations</div>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: 'var(--color-primary)' }}>
            {registrations.length}
          </div>
        </Card>
        <Card padding={16}>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Registered Students</div>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px' }}>
            {distinctStudents}
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card padding={16}>
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
        </div>
      </Card>

      {/* Table */}
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
            <div>Failed to load exam registrations.</div>
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <EmptyState
            icon={<FileCheck size={36} />}
            title="No registrations found"
            description={search || selectedExamId ? "No records match the active search or filter." : "No student exam registrations have been submitted yet."}
          />
        ) : (
          <Table
            columns={columns}
            data={filteredRegistrations}
          />
        )}
      </Card>
    </div>
  )
}
