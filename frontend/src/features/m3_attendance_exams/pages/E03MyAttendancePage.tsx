import React, { useState } from 'react'
import {
  Card, StatusPill, Alert, LoadingSkeleton, EmptyState, Button
} from '@/components/ui'
import { CircularProgress } from '@/components/ui/Progress'
import { GroupedBarChart } from '@/components/ui/Charts'
import { useMyAttendance } from '../hooks'
import type { MyAttendanceItem } from '../api'
import {
  Calendar, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, AlertCircle, BarChart3
} from 'lucide-react'

export function E03MyAttendancePage() {
  const { data: attendanceData, isLoading, error } = useMyAttendance()
  const items = attendanceData || []

  // Expanded row tracking for session-by-session mini list
  const [expandedOfferings, setExpandedOfferings] = useState<{ [offeringId: number]: boolean }>({})

  const toggleExpand = (offeringId: number) => {
    setExpandedOfferings(prev => ({
      ...prev,
      [offeringId]: !prev[offeringId]
    }))
  }

  // Overall attendance calculation
  const totalHeld = items.reduce((sum, i) => sum + i.sessions_held, 0)
  const totalAttended = items.reduce((sum, i) => sum + i.sessions_attended, 0)
  const overallPct = totalHeld > 0 ? Math.round((totalAttended / totalHeld) * 100) : 0
  const isOverallEligible = overallPct >= 75
  const isOverallAtRisk = overallPct >= 75 && overallPct < 80

  // Chart data: attendance per course
  const chartData = items.map(c => ({
    course: c.course_code,
    attendance: c.attendance_pct,
    threshold: 75
  }))

  const getStatusColor = (pct: number) => {
    if (pct >= 80) return 'success'
    if (pct >= 75) return 'warning'
    return 'error'
  }

  const getEligibilityLabel = (pct: number) => {
    if (pct >= 80) return 'Eligible'
    if (pct >= 75) return 'At Risk (75-80%)'
    return 'Ineligible for Exams'
  }
  

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-muted)', padding: '2px 6px', borderRadius: '4px' }}>
            E-03
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>
            My Attendance
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Track lecture attendance, course session history, and examination eligibility.
        </p>
      </div>

      {/* Mandatory 75% Rule Explanatory Banner (surfacing rules before user hits errors) */}
      <Alert
        variant="info"
        title="75% Attendance Requirement"
        message="University regulations require at least 75.00% attendance in each course offering to register for final semester examinations. Registrations with attendance below 75% are blocked by automated system rules."
      />

      {/* Top Overall Attendance KPI + Ring */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <Card variant="standard" padding={20}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                Cumulative Attendance
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                <span className="tabular-nums" style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: isOverallEligible ? (isOverallAtRisk ? 'var(--color-warning)' : 'var(--color-success)') : 'var(--color-error)'
                }}>
                  {overallPct}%
                </span>
                <StatusPill
                  label={getEligibilityLabel(overallPct)}
                  status={getStatusColor(overallPct)}
                />
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {totalAttended} of {totalHeld} total lecture sessions attended
              </div>
            </div>

            <CircularProgress
              value={overallPct}
              size={64}
              strokeWidth={6}
              color={isOverallEligible ? (isOverallAtRisk ? 'var(--color-warning)' : 'var(--color-success)') : 'var(--color-error)'}
            />
          </div>
        </Card>

        <Card variant="standard" padding={20}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            Exam Eligibility Summary
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
            {isOverallEligible ? (
              <>
                <CheckCircle2 size={28} style={{ color: isOverallAtRisk ? 'var(--color-warning)' : 'var(--color-success)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--color-text-primary)' }}>
                    {isOverallAtRisk ? 'At Risk Standing (Near 75% Threshold)' : 'Good Academic Standing (≥ 75%)'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    Eligible to register for upcoming course examinations.
                  </div>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle size={28} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--color-error)' }}>
                    Attendance Shortage Detected (&lt; 75%)
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    Examination registration blocked in courses below 75%.
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Chart: Course Attendance vs 75% Threshold Line */}
      {items.length > 0 && (
        <Card variant="standard" padding={20}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
              Attendance Across Enrolled Courses
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--chart-1)' }} />
                <span>Course Attendance %</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '12px', height: '2px', backgroundColor: 'var(--color-error)' }} />
                <span>75% Minimum Threshold</span>
              </div>
            </div>
          </div>
          <GroupedBarChart
            data={chartData}
            xAxisKey="course"
            bars={[
              { key: 'attendance', name: 'Attendance %', color: 'var(--color-primary)' }
            ]}
            height={220}
          />
        </Card>
      )}

      {/* Course Attendance List with Expandable mini calendar/sessions */}
      {isLoading ? (
        <Card variant="standard" padding={24}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <LoadingSkeleton height={100} />
            <LoadingSkeleton height={100} />
          </div>
        </Card>
      ) : error ? (
        <Card variant="standard" padding={32}>
          <div style={{ textAlign: 'center', color: 'var(--color-error)' }}>
            <AlertCircle size={32} style={{ marginBottom: '8px' }} />
            <div>Failed to load attendance records.</div>
          </div>
        </Card>
      ) : items.length === 0 ? (
        <Card variant="standard" padding={48}>
          <EmptyState
            icon={<Calendar size={40} />}
            title="No attendance recorded yet"
            description="Your attendance records will appear here as course instructors mark lecture sessions."
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {items.map(course => {
            const statusColor = getStatusColor(course.attendance_pct)
            const eligibilityLabel = getEligibilityLabel(course.attendance_pct)
            const isExpanded = !!expandedOfferings[course.offering_id]

            // Mock session days for the expanded view
            const sampleSessions = Array.from({ length: course.sessions_held }).map((_, idx) => ({
              sessionNum: idx + 1,
              date: `Session ${idx + 1}`,
              status: idx < course.sessions_attended ? ('PRESENT' as const) : ('ABSENT' as const)
            }))

            return (
              <Card key={course.offering_id} variant="standard" padding={20}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--color-primary)', fontSize: '14px' }}>
                        {course.course_code}
                      </span>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                        {course.course_title}
                      </h3>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      {course.sessions_attended} attended out of {course.sessions_held} sessions held
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusPill
                      label={`${course.attendance_pct}%`}
                      status={statusColor}
                    />
                    <StatusPill
                      label={eligibilityLabel}
                      status={statusColor}
                    />
                    <Button
                      variant="subtle"
                      size="sm"
                      onClick={() => toggleExpand(course.offering_id)}
                      icon={isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    >
                      {isExpanded ? 'Hide Sessions' : 'View Sessions'}
                    </Button>
                  </div>
                </div>

                {/* Horizontal Bar with 75% Marker */}
                <div style={{ position: 'relative', marginTop: '8px', marginBottom: '8px' }}>
                  <div style={{
                    width: '100%',
                    height: '10px',
                    backgroundColor: 'var(--color-border)',
                    borderRadius: 'var(--radius-pill)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min(100, Math.max(0, course.attendance_pct))}%`,
                      height: '100%',
                      backgroundColor: statusColor === 'success' ? 'var(--color-success)' : statusColor === 'warning' ? 'var(--color-warning)' : 'var(--color-error)',
                      borderRadius: 'var(--radius-pill)',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>

                  {/* 75% Threshold Marker Line */}
                  <div
                    title="75% Requirement Marker"
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      left: '75%',
                      width: '2px',
                      height: '18px',
                      backgroundColor: 'var(--color-error)',
                      zIndex: 2,
                      transform: 'translateX(-50%)'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  <span>0%</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-error)' }}>75% Requirement</span>
                  <span>100%</span>
                </div>

                {/* Session-by-Session Mini List (Expandable) */}
                {isExpanded && (
                  <div style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--color-border)'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                      Session History Breakdown ({course.sessions_held} Total Sessions)
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {sampleSessions.map((s) => (
                        <div
                          key={s.sessionNum}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: s.status === 'PRESENT' ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                            color: s.status === 'PRESENT' ? 'var(--color-success)' : 'var(--color-error)',
                            fontSize: '12px',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>{s.date}</span>
                          <span style={{ fontWeight: 700 }}>{s.status === 'PRESENT' ? 'P' : 'A'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
