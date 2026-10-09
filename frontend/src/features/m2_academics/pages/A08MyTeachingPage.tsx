import React, { useState } from 'react'
import {
  Card, Button, Input, Table, StatusPill, EmptyState,
  LoadingSkeleton, Drawer, Progress
} from '@/components/ui'
import { useMyTeaching, useOfferingRoster } from '../hooks'
import type { MyTeaching, RosterStudent } from '../api'
import {
  BookOpen, Users, Download, Search, CheckSquare, AlertCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function A08MyTeachingPage() {
  const navigate = useNavigate()
  const [selectedOffering, setSelectedOffering] = useState<MyTeaching | null>(null)
  const [rosterSearch, setRosterSearch] = useState('')

  const { data: offerings, isLoading, error } = useMyTeaching()
  const teachingOfferings = offerings || []

  // Roster query for selected offering
  const { data: rosterData, isLoading: loadingRoster } = useOfferingRoster(
    selectedOffering?.offering_id || 0
  )
  const rosterStudents = rosterData || []

  const filteredRoster = rosterStudents.filter(s =>
    s.global_student_id.toLowerCase().includes(rosterSearch.toLowerCase()) ||
    s.first_name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
    s.last_name.toLowerCase().includes(rosterSearch.toLowerCase())
  )

  const handleExportRosterCSV = () => {
    if (!selectedOffering) return
    const headers = ['Student_ID', 'First_Name', 'Last_Name', 'Enrollment_Status', 'Enrolled_Date']
    const rows = filteredRoster.map(s => [
      s.global_student_id,
      s.first_name,
      s.last_name,
      s.enrollment_status,
      s.enrolled_date ? new Date(s.enrolled_date).toISOString().split('T')[0] : 'N/A'
    ].join(','))

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `roster_${selectedOffering.course_code}_sec${selectedOffering.section}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const rosterColumns = [
    {
      key: 'student_id',
      header: 'Student ID',
      render: (row: RosterStudent) => (
        <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>
          {row.global_student_id}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Student Name',
      render: (row: RosterStudent) => (
        <span style={{ fontWeight: 500 }}>
          {row.first_name} {row.last_name}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: RosterStudent) => (
        <StatusPill
          label={row.enrollment_status}
          status={row.enrollment_status === 'ENROLLED' ? 'success' : 'neutral'}
        />
      )
    },
    {
      key: 'enrolled_date',
      header: 'Enrolled On',
      render: (row: RosterStudent) => (
        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          {row.enrolled_date ? new Date(row.enrolled_date).toLocaleDateString() : 'N/A'}
        </span>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
            A-08
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            My Teaching & Course Roster
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Assigned teaching sections for this academic term, class rosters, attendance, and grading.
        </p>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <Card padding={24}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <LoadingSkeleton height={100} />
            <LoadingSkeleton height={100} />
          </div>
        </Card>
      ) : error ? (
        <Card padding={32}>
          <div style={{ textAlign: 'center', color: 'var(--color-error)' }}>
            <AlertCircle size={32} style={{ marginBottom: '8px' }} />
            <div>Failed to load assigned teaching offerings.</div>
          </div>
        </Card>
      ) : teachingOfferings.length === 0 ? (
        <Card padding={32}>
          <EmptyState
            icon={<BookOpen size={40} />}
            title="No teaching courses assigned"
            description="You have no active teaching sections assigned for the current academic term."
          />
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {teachingOfferings.map(item => {
            const pct = Math.min(100, Math.round((item.enrolled_count / Math.max(1, item.capacity)) * 100))
            return (
              <Card
                key={item.offering_id}
                padding={20}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-primary)', fontSize: '15px' }}>
                      {item.course_code}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '13px', padding: '2px 8px', borderRadius: '4px', background: 'var(--color-surface-subtle)' }}>
                      Section {item.section}
                    </span>
                  </div>
                  <h3 style={{ margin: '0 0 16px', fontSize: '17px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {item.course_title}
                  </h3>

                  {/* Enrollment Capacity Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Class Enrollment</span>
                      <span style={{ fontWeight: 600 }}>{item.enrolled_count} / {item.capacity} ({pct}%)</span>
                    </div>
                    <Progress value={pct} max={100} variant={pct >= 100 ? 'danger' : pct >= 90 ? 'warning' : 'primary'} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Users size={14} />}
                    style={{ flex: 1 }}
                    onClick={() => {
                      setSelectedOffering(item)
                      setRosterSearch('')
                    }}
                  >
                    View Roster
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<CheckSquare size={14} />}
                    onClick={() => navigate(`/faculty/attendance?offeringId=${item.offering_id}`)}
                    title="Mark Attendance"
                  >
                    Attendance
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Roster Drawer */}
      <Drawer
        isOpen={!!selectedOffering}
        onClose={() => setSelectedOffering(null)}
        title={selectedOffering ? `Roster: ${selectedOffering.course_code} (Section ${selectedOffering.section})` : 'Class Roster'}
        size="lg"
      >
        {selectedOffering && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ width: '280px' }}>
                <Input
                  placeholder="Search students in roster..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  leftIcon={<Search size={16} />}
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={<Download size={14} />}
                onClick={handleExportRosterCSV}
              >
                Export CSV
              </Button>
            </div>

            {loadingRoster ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <LoadingSkeleton height={40} />
                <LoadingSkeleton height={40} />
              </div>
            ) : filteredRoster.length === 0 ? (
              <EmptyState
                icon={<Users size={32} />}
                title="No students found"
                description={rosterSearch ? "No students match your search criteria." : "No students currently enrolled in this section."}
              />
            ) : (
              <div>
                <div style={{ marginBottom: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  Showing {filteredRoster.length} student{filteredRoster.length === 1 ? '' : 's'}
                </div>
                <Table
                  columns={rosterColumns}
                  data={filteredRoster}
                />
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
