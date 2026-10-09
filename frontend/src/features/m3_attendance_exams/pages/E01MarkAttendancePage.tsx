import React, { useState, useEffect } from 'react'
import {
  Card, Button, Select, Input, StatusPill, Alert, LoadingSkeleton
} from '@/components/ui'
import {
  useCreateAttendanceSession, useAttendanceSessions, useUpdateAttendanceSession
} from '../hooks'
import { useOfferings, useOfferingRoster, useCourses } from '../../m2_academics/hooks'
import type { Course, CourseOffering, RosterStudent } from '../../m2_academics/api'
import type { AttendanceRecordItem } from '../api'
import {
  Calendar, Check, X, CheckCheck, XCircle, AlertCircle, Save
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

export function E01MarkAttendancePage() {
  const [searchParams] = useSearchParams()
  const initialOfferingId = searchParams.get('offeringId')

  const todayStr = new Date().toISOString().split('T')[0]
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>(initialOfferingId || '')
  const [sessionDate, setSessionDate] = useState<string>(todayStr)
  const [slot, setSlot] = useState<number>(1)
  const [attendanceMap, setAttendanceMap] = useState<{ [enrollmentId: number]: 'PRESENT' | 'ABSENT' }>({})
  const [backendError, setBackendError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Lookups
  const { data: offeringsData, isLoading: loadingOfferings } = useOfferings({ page_size: 100 })
  const offerings = offeringsData?.items || []

  const { data: coursesData } = useCourses({ page_size: 200 })
  const courses = coursesData?.items || []

  const courseMap = React.useMemo(() => {
    const m = new Map<number, string>()
    courses.forEach((c: Course) => m.set(c.id, `${c.code} - ${c.title}`))
    return m
  }, [courses])

  // Auto-select first offering if none selected
  useEffect(() => {
    if (!selectedOfferingId && offerings.length > 0) {
      setSelectedOfferingId(String(offerings[0].id))
    }
  }, [offerings, selectedOfferingId])

  // Roster query
  const { data: rosterData, isLoading: loadingRoster } = useOfferingRoster(
    selectedOfferingId ? Number(selectedOfferingId) : 0
  )
  const roster = rosterData || []

  // Check if session already exists for this date/slot
  const { data: sessionsData } = useAttendanceSessions({
    offering_id: selectedOfferingId ? Number(selectedOfferingId) : undefined,
    page_size: 100
  })
  const existingSessions = sessionsData?.items || []
  const matchingSession = existingSessions.find(
    s => s.session_date.startsWith(sessionDate) && s.slot === slot
  )

  // Default all students to PRESENT when roster loads or changes
  useEffect(() => {
    if (roster.length > 0) {
      const initialMap: { [enrollmentId: number]: 'PRESENT' | 'ABSENT' } = {}
      roster.forEach((student: RosterStudent) => {
        // Here student has student_id; we map by student_id or enrollment_id
        initialMap[student.student_id] = 'PRESENT'
      })
      setAttendanceMap(initialMap)
      setSaveSuccess(false)
      setBackendError(null)
    }
  }, [roster, selectedOfferingId])

  const createMutation = useCreateAttendanceSession()
  const updateMutation = useUpdateAttendanceSession()

  // Calculate live stats
  const totalCount = roster.length
  const presentCount = Object.values(attendanceMap).filter(v => v === 'PRESENT').length
  const absentCount = totalCount - presentCount
  const presentPct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT') => {
    const nextMap: { [id: number]: 'PRESENT' | 'ABSENT' } = {}
    roster.forEach((s: RosterStudent) => { nextMap[s.student_id] = status })
    setAttendanceMap(nextMap)
  }

  const toggleStudent = (studentId: number) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'PRESENT' ? 'ABSENT' : 'PRESENT'
    }))
  }

  const handleSaveAttendance = async () => {
    setBackendError(null)
    setSaveSuccess(false)
    if (!selectedOfferingId) return

    const records: AttendanceRecordItem[] = roster.map((s: RosterStudent) => ({
      enrollment_id: s.student_id,
      status: attendanceMap[s.student_id] || 'PRESENT'
    }))

    try {
      if (matchingSession) {
        await updateMutation.mutateAsync({
          id: matchingSession.id,
          data: { records }
        })
      } else {
        await createMutation.mutateAsync({
          offering_id: Number(selectedOfferingId),
          session_date: sessionDate,
          slot,
          records
        })
      }
      setSaveSuccess(true)
    } catch (err: any) {
      setBackendError(err.message || 'Failed to submit attendance.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
            E-01
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            Mark Class Attendance
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Record present and absent students for lecture sessions.
        </p>
      </div>

      {backendError && (
        <Alert variant="error" title="Attendance Error" message={backendError} />
      )}

      {matchingSession && (
        <Alert
          variant="info"
          title="Existing Session Detected"
          message={`A recorded attendance session already exists for this offering on ${sessionDate} (Slot ${slot}). Saving will update existing records.`}
        />
      )}

      {saveSuccess && (
        <Alert
          variant="success"
          title="Attendance Saved"
          message={`Successfully saved attendance: ${presentCount} present, ${absentCount} absent (${presentPct}%).`}
        />
      )}

      {/* Context Selection Bar */}
      <Card padding={16}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 280px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Course Offering Section *
            </label>
            <Select
              value={selectedOfferingId}
              onChange={(e) => setSelectedOfferingId(e.target.value)}
              options={offerings.map((o: CourseOffering) => ({
                value: String(o.id),
                label: `${courseMap.get(o.course_id) || `Course #${o.course_id}`} (Sec ${o.section})`
              }))}
            />
          </div>

          <div style={{ width: '180px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Session Date *
            </label>
            <Input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
            />
          </div>

          <div style={{ width: '140px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Slot / Period *
            </label>
            <Select
              value={String(slot)}
              onChange={(e) => setSlot(Number(e.target.value))}
              options={[
                { value: '1', label: 'Slot 1 (Morning)' },
                { value: '2', label: 'Slot 2 (Mid-Day)' },
                { value: '3', label: 'Slot 3 (Afternoon)' },
                { value: '4', label: 'Slot 4 (Evening)' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Summary KPI Strip & Bulk Controls */}
      <Card padding={16}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Total Students:</span>
              <span style={{ fontWeight: 700, fontSize: '16px' }}>{totalCount}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-success)' }}>Present:</span>
              <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-success)' }}>{presentCount}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-error)' }}>Absent:</span>
              <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-error)' }}>{absentCount}</span>
            </div>
            <StatusPill
              label={`${presentPct}% Attendance`}
              status={presentPct >= 75 ? 'success' : 'warning'}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="subtle"
              size="sm"
              icon={<CheckCheck size={14} />}
              onClick={() => handleMarkAll('PRESENT')}
            >
              Mark All Present
            </Button>
            <Button
              variant="subtle"
              size="sm"
              icon={<XCircle size={14} />}
              onClick={() => handleMarkAll('ABSENT')}
            >
              Mark All Absent
            </Button>
          </div>
        </div>
      </Card>

      {/* Roster Attendance Grid */}
      <Card padding={0}>
        {loadingOfferings || loadingRoster ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <LoadingSkeleton height={44} />
            <LoadingSkeleton height={44} />
            <LoadingSkeleton height={44} />
          </div>
        ) : roster.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <AlertCircle size={36} style={{ marginBottom: '8px' }} />
            <div>No enrolled students found in this offering section.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {roster.map((student: RosterStudent, idx: number) => {
              const isPresent = (attendanceMap[student.student_id] || 'PRESENT') === 'PRESENT'
              return (
                <div
                  key={student.student_id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 20px',
                    borderBottom: idx < roster.length - 1 ? '1px solid var(--color-border)' : 'none',
                    background: isPresent ? 'var(--color-surface)' : 'rgba(239, 68, 68, 0.03)',
                    transition: 'background-color 150ms ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--color-surface-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: '13px',
                      color: 'var(--color-text-secondary)'
                    }}>
                      {student.first_name?.[0] || 'S'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>
                        {student.first_name} {student.last_name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                        {student.global_student_id}
                      </div>
                    </div>
                  </div>

                  {/* Segmented Present / Absent Toggle */}
                  <div style={{ display: 'flex', background: 'var(--color-surface-subtle)', borderRadius: '6px', padding: '3px' }}>
                    <button
                      type="button"
                      onClick={() => toggleStudent(student.student_id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: isPresent ? 'var(--color-success)' : 'transparent',
                        color: isPresent ? '#fff' : 'var(--color-text-muted)',
                        transition: 'all 120ms ease'
                      }}
                    >
                      <Check size={14} /> Present
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleStudent(student.student_id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: !isPresent ? 'var(--color-error)' : 'transparent',
                        color: !isPresent ? '#fff' : 'var(--color-text-muted)',
                        transition: 'all 120ms ease'
                      }}
                    >
                      <X size={14} /> Absent
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Sticky Save Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '16px 20px',
        background: 'var(--color-surface)',
        borderRadius: '8px',
        border: '1px solid var(--color-border)'
      }}>
        <Button
          variant="primary"
          size="md"
          icon={<Save size={16} />}
          disabled={createMutation.isPending || updateMutation.isPending || roster.length === 0}
          onClick={handleSaveAttendance}
        >
          {createMutation.isPending || updateMutation.isPending
            ? 'Saving Attendance...'
            : matchingSession ? 'Update Attendance Session' : 'Save Attendance Session'}
        </Button>
      </div>
    </div>
  )
}
