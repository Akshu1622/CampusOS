import React, { useState, useEffect, useRef } from 'react'
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
  Calendar, Check, X, CheckCheck, XCircle, AlertCircle, Save, Info, Keyboard
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
  const [focusedIndex, setFocusedIndex] = useState<number>(0)
  const [backendError, setBackendError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Lookups
  const { data: offeringsData, isLoading: loadingOfferings } = useOfferings({ page_size: 100 })
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

  // Auto-select first offering if none selected
  useEffect(() => {
    if (!selectedOfferingId && validOfferings.length > 0) {
      setSelectedOfferingId(String(validOfferings[0].id))
    }
  }, [validOfferings, selectedOfferingId])

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
        initialMap[student.student_id] = 'PRESENT'
      })
      setAttendanceMap(initialMap)
      setSaveSuccess(false)
      setBackendError(null)
      setFocusedIndex(0)
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

  const setStudentStatus = (studentId: number, status: 'PRESENT' | 'ABSENT') => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  // Keyboard navigation: P for present, A for absent, ArrowDown / ArrowUp to move
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or select
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return
      }

      if (roster.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIndex(prev => Math.min(roster.length - 1, prev + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIndex(prev => Math.max(0, prev - 1))
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        const currentStudent = roster[focusedIndex]
        if (currentStudent) {
          setStudentStatus(currentStudent.student_id, 'PRESENT')
          setFocusedIndex(prev => Math.min(roster.length - 1, prev + 1))
        }
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        const currentStudent = roster[focusedIndex]
        if (currentStudent) {
          setStudentStatus(currentStudent.student_id, 'ABSENT')
          setFocusedIndex(prev => Math.min(roster.length - 1, prev + 1))
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [roster, focusedIndex])

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

  // Deterministic avatar color
  const getAvatarColor = (name: string) => {
    const colors = [
      'var(--color-primary)',
      'var(--color-chip-exams-text)',
      'var(--color-success)',
      'var(--color-warning)',
      'var(--color-info)'
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-muted)', padding: '2px 6px', borderRadius: '4px' }}>
            E-01
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>
            Mark Attendance
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Record lecture session attendance quickly with keyboard shortcuts (P: Present, A: Absent, ↓/↑: Navigate).
        </p>
      </div>

      {backendError && (
        <Alert variant="error" title="Attendance Error" message={backendError} />
      )}

      {matchingSession && (
        <Alert
          variant="info"
          title="Editing Existing Session"
          message={`An attendance session was already recorded for this offering on ${sessionDate} (Slot ${slot}). Saving will update the existing session records.`}
        />
      )}

      {saveSuccess && (
        <Alert
          variant="success"
          title="Attendance Recorded Successfully"
          message={`Session recorded: ${presentCount} present, ${absentCount} absent (${presentPct}% overall session attendance).`}
        />
      )}

      {/* Context Selection Bar (T-WORKSPACE Context Bar) */}
      <Card variant="standard" padding={20}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 300px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              Course Offering *
            </label>
            <Select
              value={selectedOfferingId}
              onChange={(e) => setSelectedOfferingId(e.target.value)}
              options={validOfferings.map((o: CourseOffering) => ({
                value: String(o.id),
                label: `${courseMap.get(o.course_id)} (Section ${o.section})`
              }))}
            />
          </div>

          <div style={{ width: '180px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              Session Date *
            </label>
            <Input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
            />
          </div>

          <div style={{ width: '160px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              Session Slot / Period *
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

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
            <Keyboard size={14} />
            <span>Shortcut: Press <strong>P</strong> or <strong>A</strong> then <strong>↓</strong></span>
          </div>
        </div>
      </Card>

      {/* Summary KPI Strip & Bulk Controls */}
      <Card variant="compact" padding={16}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Total Roster:</span>
              <span className="tabular-nums" style={{ fontWeight: 600, fontSize: '15px' }}>{totalCount}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-success)' }}>Present:</span>
              <span className="tabular-nums" style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-success)' }}>{presentCount}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-error)' }}>Absent:</span>
              <span className="tabular-nums" style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-error)' }}>{absentCount}</span>
            </div>
            <StatusPill
              label={`${presentPct}% Attendance`}
              status={presentPct >= 75 ? 'success' : presentPct >= 70 ? 'warning' : 'error'}
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
      <Card variant="standard" padding={0} style={{ overflow: 'hidden' }}>
        {loadingOfferings || loadingRoster ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <LoadingSkeleton height={48} />
            <LoadingSkeleton height={48} />
            <LoadingSkeleton height={48} />
          </div>
        ) : roster.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <AlertCircle size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
            <div style={{ fontSize: '14px', fontWeight: 500 }}>No enrolled students in this course offering section.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {roster.map((student: RosterStudent, idx: number) => {
              const isPresent = (attendanceMap[student.student_id] || 'PRESENT') === 'PRESENT'
              const isFocused = idx === focusedIndex
              const fullName = `${student.first_name} ${student.last_name}`
              const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase() || 'S'
              const avatarColor = getAvatarColor(fullName)

              return (
                <div
                  key={student.student_id}
                  onClick={() => setFocusedIndex(idx)}
                  tabIndex={0}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 20px',
                    borderBottom: idx < roster.length - 1 ? '1px solid var(--color-border)' : 'none',
                    backgroundColor: isFocused
                      ? 'var(--color-primary-subtle)'
                      : isPresent ? 'var(--color-surface)' : 'var(--color-error-bg)',
                    borderLeft: isFocused ? '3px solid var(--color-primary)' : '3px solid transparent',
                    transition: 'all 120ms ease',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-surface-muted)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: '12px',
                      color: avatarColor,
                      flexShrink: 0
                    }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                        {fullName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                        {student.global_student_id}
                      </div>
                    </div>
                  </div>

                  {/* Segmented Present / Absent Toggle (≥ 44px min touch target on mobile) */}
                  <div style={{
                    display: 'flex',
                    background: 'var(--color-surface-muted)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '3px',
                    gap: '2px'
                  }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setStudentStatus(student.student_id, 'PRESENT')
                        setFocusedIndex(idx)
                      }}
                      style={{
                        minHeight: '36px',
                        padding: '0 16px',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: isPresent ? 'var(--color-success)' : 'transparent',
                        color: isPresent ? '#ffffff' : 'var(--color-text-secondary)',
                        transition: 'all 120ms ease'
                      }}
                    >
                      <Check size={14} /> Present
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setStudentStatus(student.student_id, 'ABSENT')
                        setFocusedIndex(idx)
                      }}
                      style={{
                        minHeight: '36px',
                        padding: '0 16px',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: !isPresent ? 'var(--color-error)' : 'transparent',
                        color: !isPresent ? '#ffffff' : 'var(--color-text-secondary)',
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
        position: 'sticky',
        bottom: '16px',
        zIndex: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {matchingSession ? (
            <span style={{ color: 'var(--color-warning)', fontWeight: 500 }}>
              Modifying existing session on {sessionDate} (Slot {slot})
            </span>
          ) : (
            <span>Ready to submit new session for {totalCount} students</span>
          )}
        </div>
        <Button
          variant="primary"
          size="md"
          icon={<Save size={16} />}
          disabled={createMutation.isPending || updateMutation.isPending || roster.length === 0}
          onClick={handleSaveAttendance}
        >
          {createMutation.isPending || updateMutation.isPending
            ? 'Saving Session...'
            : matchingSession ? 'Update Attendance Session' : 'Save Attendance Session'}
        </Button>
      </div>
    </div>
    
  )
}
