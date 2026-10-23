import React, { useState } from 'react'
import {
  Card, Button, StatusPill, EmptyState, LoadingSkeleton, Drawer
} from '@/components/ui'
import { useMyCourses, useEmployees } from '../hooks'
import type { MyCourse } from '../api'
import { BookOpen, LayoutGrid, List, User, Award, AlertCircle } from 'lucide-react'

export function A07MyCoursesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCourse, setSelectedCourse] = useState<MyCourse | null>(null)

  const { data: courses, isLoading, error } = useMyCourses()
  const { data: employeesData } = useEmployees({ page_size: 100 })
  const employees = employeesData?.items || []

  const facultyMap = React.useMemo(() => {
    const m = new Map<number, string>()
    employees.forEach(e => m.set(e.id, `${e.first_name} ${e.last_name}`))
    return m
  }, [employees])

  const myCourses = (courses || []).filter(c => !c.course_code.startsWith('CS0') && !c.course_title.toLowerCase().startsWith('course '))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
              A-07
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              My Courses
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            View your enrolled courses, assigned sections, and academic instructors for this term.
          </p>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', background: 'var(--color-surface-subtle)', borderRadius: '6px', padding: '2px' }}>
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'subtle'}
            size="sm"
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <LayoutGrid size={16} />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'subtle'}
            size="sm"
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <List size={16} />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <Card padding={24}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <LoadingSkeleton height={80} />
            <LoadingSkeleton height={80} />
          </div>
        </Card>
      ) : error ? (
        <Card padding={32}>
          <div style={{ textAlign: 'center', color: 'var(--color-error)' }}>
            <AlertCircle size={32} style={{ marginBottom: '8px' }} />
            <div>Failed to load your enrolled courses.</div>
          </div>
        </Card>
      ) : myCourses.length === 0 ? (
        <Card padding={32}>
          <EmptyState
            icon={<BookOpen size={40} />}
            title="You're not enrolled in any courses this term"
            description="Once course registration opens and your curriculum enrollments are processed, your courses will appear here."
          />
        </Card>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {myCourses.map(course => {
            const facultyName = facultyMap.get(course.faculty_id) || 'Faculty Assigned'
            return (
              <Card
                key={course.enrollment_id}
                padding={20}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'transform 150ms ease, box-shadow 150ms ease'
                }}
                onClick={() => setSelectedCourse(course)}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-primary)', fontSize: '15px' }}>
                      {course.course_code}
                    </span>
                    <StatusPill
                      label={course.status}
                      status={course.status === 'ENROLLED' ? 'success' : 'neutral'}
                    />
                  </div>
                  <h3 style={{ margin: '0 0 12px', fontSize: '17px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {course.course_title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                    <User size={15} style={{ color: 'var(--color-text-muted)' }} />
                    <span>{facultyName}</span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--color-border)',
                  fontSize: '13px',
                  color: 'var(--color-text-muted)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={14} />
                    <span>{course.credits} Credits</span>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Sec {course.section}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card padding={0}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {myCourses.map((course, idx) => {
              const facultyName = facultyMap.get(course.faculty_id) || 'Faculty Assigned'
              return (
                <div
                  key={course.enrollment_id}
                  onClick={() => setSelectedCourse(course)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: idx < myCourses.length - 1 ? '1px solid var(--color-border)' : 'none',
                    cursor: 'pointer',
                    background: 'var(--color-surface)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-primary)', width: '90px' }}>
                      {course.course_code}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{course.course_title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Instructor: {facultyName}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Section {course.section}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{course.credits} Cr</span>
                    <StatusPill
                      label={course.status}
                      status={course.status === 'ENROLLED' ? 'success' : 'neutral'}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Course Detail Drawer */}
      <Drawer
        isOpen={!!selectedCourse}
        onClose={() => setSelectedCourse(null)}
        title={selectedCourse ? `${selectedCourse.course_code} - ${selectedCourse.course_title}` : 'Course Details'}
        size="md"
      >
        {selectedCourse && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-primary)' }}>
                {selectedCourse.course_code}
              </span>
              <StatusPill
                label={selectedCourse.status}
                status={selectedCourse.status === 'ENROLLED' ? 'success' : 'neutral'}
              />
            </div>

            <Card padding={16}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Course Title:</span>
                  <span style={{ fontWeight: 600 }}>{selectedCourse.course_title}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Assigned Section:</span>
                  <span style={{ fontWeight: 600 }}>Section {selectedCourse.section}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Credits:</span>
                  <span style={{ fontWeight: 600 }}>{selectedCourse.credits} Credits</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Instructor:</span>
                  <span style={{ fontWeight: 600 }}>
                    {facultyMap.get(selectedCourse.faculty_id) || `Faculty #${selectedCourse.faculty_id}`}
                  </span>
                </div>
              </div>
            </Card>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setSelectedCourse(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
