import React from 'react'
import {
  Card, StatusPill, Alert, LoadingSkeleton, EmptyState, Progress
} from '@/components/ui'
import { useMyAttendance } from '../hooks'
import type { MyAttendanceItem } from '../api'
import {
  Calendar, CheckCircle2, AlertTriangle, XCircle, AlertCircle
} from 'lucide-react'

export function E03MyAttendancePage() {
  const { data: attendanceData, isLoading, error } = useMyAttendance()
  const items = attendanceData || []

  // Overall attendance calculation
  const totalHeld = items.reduce((sum, i) => sum + i.sessions_held, 0)
  const totalAttended = items.reduce((sum, i) => sum + i.sessions_attended, 0)
  const overallPct = totalHeld > 0 ? Math.round((totalAttended / totalHeld) * 100) : 0
  const isOverallEligible = overallPct >= 75

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
            E-03
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            My Course Attendance
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Track your session attendance and exam eligibility status across enrolled courses.
        </p>
      </div>

      {/* Mandatory 75% Rule Explanatory Banner */}
      <Alert
        variant="info"
        title="75% Attendance Requirement"
        message="University academic regulations require a minimum of 75.00% attendance in each enrolled course offering to be eligible for examination registration. Registrations with attendance below 75% are blocked by database rules."
      />

      {/* Top Overall Attendance KPI Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <Card padding={20}>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Overall Attendance Rate</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px', color: isOverallEligible ? 'var(--color-success)' : 'var(--color-error)' }}>
            {overallPct}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            {totalAttended} of {totalHeld} total lecture sessions attended
          </div>
        </Card>

        <Card padding={20}>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Exam Eligibility Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            {isOverallEligible ? (
              <>
                <CheckCircle2 size={24} style={{ color: 'var(--color-success)' }} />
                <span style={{ fontWeight: 600, fontSize: '16px', color: 'var(--color-success)' }}>
                  Good Standing (≥ 75%)
                </span>
              </>
            ) : (
              <>
                <AlertTriangle size={24} style={{ color: 'var(--color-error)' }} />
                <span style={{ fontWeight: 600, fontSize: '16px', color: 'var(--color-error)' }}>
                  Attendance Shortage Risk (&lt; 75%)
                </span>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Course Attendance List */}
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
            <div>Failed to load attendance records.</div>
          </div>
        </Card>
      ) : items.length === 0 ? (
        <Card padding={32}>
          <EmptyState
            icon={<Calendar size={40} />}
            title="No attendance recorded yet"
            description="Your attendance will be displayed here as course instructors mark session lectures."
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {items.map(course => {
            const isEligible = course.attendance_pct >= 75
            return (
              <Card key={course.offering_id} padding={20}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-primary)', fontSize: '15px' }}>
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
                      status={isEligible ? 'success' : 'error'}
                    />
                    <StatusPill
                      label={isEligible ? 'Eligible for Exams' : 'Blocked (< 75%)'}
                      status={isEligible ? 'success' : 'error'}
                    />
                  </div>
                </div>

                {/* Progress Bar with 75% target indication */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <Progress
                    value={course.attendance_pct}
                    max={100}
                    variant={isEligible ? 'success' : 'danger'}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    <span>0%</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Threshold: 75%</span>
                    <span>100%</span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
