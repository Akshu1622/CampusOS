import React, { useState } from 'react'
import {
  Card, Button, Select, StatusPill, Drawer, EmptyState,
  LoadingSkeleton, ConfirmationDialog, Alert, Input
} from '@/components/ui'
import {
  usePrograms, useCourses, useCurriculum,
  useCreateCurriculum, useDeleteCurriculum
} from '../hooks'
import type { Curriculum } from '../api'
import { Plus, Trash2, BookOpen } from 'lucide-react'

export function A02CurriculumMappingPage() {
  const { data: programsData, isLoading: loadingPrograms } = usePrograms()
  const programs = programsData || []

  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null)

  // Default to first program when loaded
  React.useEffect(() => {
    if (!selectedProgramId && programs.length > 0) {
      setSelectedProgramId(programs[0].id)
    }
  }, [programs, selectedProgramId])

  const selectedProgram = programs.find(p => p.id === selectedProgramId)

  // Fetch all curriculum for the selected program
  const { data: curriculumData, isLoading: loadingCurriculum } = useCurriculum({
    program_id: selectedProgramId || undefined,
    page_size: 200,
  })

  const { data: coursesData } = useCourses({ page_size: 200 })
  const courses = coursesData?.items || []

  const courseMap = React.useMemo(() => {
    const map = new Map<number, { code: string; title: string; credits: number }>()
    courses.forEach(c => map.set(c.id, { code: c.code, title: c.title, credits: c.credits }))
    return map
  }, [courses])

  const createCurriculumMutation = useCreateCurriculum()
  const deleteCurriculumMutation = useDeleteCurriculum()

  // Drawer state for adding course to semester
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [targetSemester, setTargetSemester] = useState<number>(1)
  const [addCourseId, setAddCourseId] = useState<number | ''>('')
  const [addType, setAddType] = useState<'CORE' | 'ELECTIVE'>('CORE')
  const [addError, setAddError] = useState<string | null>(null)

  // Delete target
  const [deleteTarget, setDeleteTarget] = useState<Curriculum | null>(null)

  const items = curriculumData?.items || []

  // Group items by semester
  const numSemesters = (selectedProgram?.duration_years || 4) * 2
  const semestersArray = Array.from({ length: numSemesters }, (_, i) => i + 1)

  const semesterGroups = React.useMemo(() => {
    const groups: { [key: number]: Curriculum[] } = {}
    semestersArray.forEach(sem => { groups[sem] = [] })
    items.forEach(item => {
      if (!groups[item.semester]) {
        groups[item.semester] = []
      }
      groups[item.semester].push(item)
    })
    return groups
  }, [items, semestersArray])

  // Total credits calculated across program
  const totalAllocatedCredits = React.useMemo(() => {
    return items.reduce((acc, curr) => {
      const c = courseMap.get(curr.course_id)
      return acc + (c?.credits || 0)
    }, 0)
  }, [items, courseMap])

  const creditsRequired = selectedProgram?.credits_required || 0
  const isCreditMismatch = selectedProgram && totalAllocatedCredits !== creditsRequired

  const handleOpenAddForSemester = (sem: number) => {
    setTargetSemester(sem)
    setAddCourseId(courses[0]?.id || '')
    setAddType('CORE')
    setAddError(null)
    setIsAddDrawerOpen(true)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError(null)
    if (!selectedProgramId || !addCourseId) {
      setAddError('Please select a valid course.')
      return
    }

    // Check duplicate in same program/semester
    const existingInSem = semesterGroups[targetSemester]?.some(i => i.course_id === Number(addCourseId))
    if (existingInSem) {
      setAddError('This course is already mapped to Semester ' + targetSemester)
      return
    }

    try {
      await createCurriculumMutation.mutateAsync({
        program_id: selectedProgramId,
        semester: targetSemester,
        course_id: Number(addCourseId),
        type: addType,
      })
      setIsAddDrawerOpen(false)
    } catch (err: any) {
      setAddError(err.message || 'Failed to add course to curriculum.')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deleteCurriculumMutation.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err) {
      // toast shown in mutation
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
              A-02
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Curriculum Mapping
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Map required and elective courses across semesters for academic programs.
          </p>
        </div>
      </div>

      {/* Program Selector & Stats */}
      <Card padding={16}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 300px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Select Program:
            </label>
            <div style={{ width: '320px' }}>
              <Select
                value={selectedProgramId ? String(selectedProgramId) : ''}
                onChange={(e) => setSelectedProgramId(Number(e.target.value))}
                options={programs.map(p => ({
                  value: String(p.id),
                  label: `${p.code} - ${p.name} (${p.duration_years} yrs)`
                }))}
              />
            </div>
          </div>

          {selectedProgram && (
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Curriculum Credits</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: isCreditMismatch ? 'var(--color-warning)' : 'var(--color-success)' }}>
                  {totalAllocatedCredits} / {creditsRequired} Cr
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mismatch Alert */}
        {isCreditMismatch && (
          <div style={{ marginTop: '16px' }}>
            <Alert
              variant="warning"
              title="Credits Mismatch"
              message={`Allocated credits (${totalAllocatedCredits}) do not match required degree credits (${creditsRequired}) for ${selectedProgram.name}.`}
            />
          </div>
        )}
      </Card>

      {/* Semester Columns / Cards Grid */}
      {loadingPrograms || loadingCurriculum ? (
        <Card padding={24}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <LoadingSkeleton height={50} />
            <LoadingSkeleton height={50} />
            <LoadingSkeleton height={50} />
          </div>
        </Card>
      ) : !selectedProgram ? (
        <Card padding={32}>
          <EmptyState
            icon={<BookOpen size={36} />}
            title="No Program Selected"
            description="Please choose an academic program to view and configure its curriculum."
          />
        </Card>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px'
        }}>
          {semestersArray.map(sem => {
            const semCourses = semesterGroups[sem] || []
            const semCredits = semCourses.reduce((sum, item) => {
              const c = courseMap.get(item.course_id)
              return sum + (c?.credits || 0)
            }, 0)

            return (
              <Card key={sem} padding={0} style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Semester Header */}
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--color-surface-subtle)'
                }}>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>
                    Semester {sem}
                  </div>
                  <Button
                    variant="subtle"
                    size="sm"
                    icon={<Plus size={14} />}
                    onClick={() => handleOpenAddForSemester(sem)}
                  >
                    Add Course
                  </Button>
                </div>

                {/* Course List inside Semester */}
                <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '120px' }}>
                  {semCourses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                      No courses mapped to this semester.
                    </div>
                  ) : (
                    semCourses.map(item => {
                      const c = courseMap.get(item.course_id)
                      return (
                        <div
                          key={item.id}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'var(--color-surface)'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '13px' }}>
                                {c?.code || `ID #${item.course_id}`}
                              </span>
                              <StatusPill
                                label={item.type}
                                status={item.type === 'CORE' ? 'info' : 'neutral'}
                              />
                            </div>
                            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c?.title || 'Unknown Course'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                              {c?.credits || 0} Cr
                            </span>
                            <Button
                              variant="subtle"
                              size="sm"
                              onClick={() => setDeleteTarget(item)}
                              title="Remove Course from Semester"
                            >
                              <Trash2 size={13} style={{ color: 'var(--color-error)' }} />
                            </Button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Semester Footer with Total Credits */}
                <div style={{
                  padding: '8px 16px',
                  borderTop: '1px solid var(--color-border)',
                  background: 'var(--color-surface-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: 'var(--color-text-muted)'
                }}>
                  <span>Total Courses: {semCourses.length}</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Total Credits: {semCredits} Cr
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Course to Semester Drawer */}
      <Drawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        title={`Add Course to Semester ${targetSemester}`}
        size="sm"
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {addError && (
            <div style={{ padding: '10px 12px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)', fontSize: '13px' }}>
              {addError}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Target Semester
            </label>
            <Input
              type="number"
              value={String(targetSemester)}
              disabled
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Course *
            </label>
            <Select
              value={String(addCourseId)}
              onChange={(e) => setAddCourseId(Number(e.target.value))}
              options={courses.map(c => ({
                value: String(c.id),
                label: `${c.code} - ${c.title} (${c.credits} Cr)`
              }))}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Course Type *
            </label>
            <Select
              value={addType}
              onChange={(e) => setAddType(e.target.value as 'CORE' | 'ELECTIVE')}
              options={[
                { value: 'CORE', label: 'CORE (Required)' },
                { value: 'ELECTIVE', label: 'ELECTIVE (Optional)' }
              ]}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <Button variant="secondary" onClick={() => setIsAddDrawerOpen(false)} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={createCurriculumMutation.isPending}
            >
              {createCurriculumMutation.isPending ? 'Adding...' : 'Add Course'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Delete / Remove Mapping Confirmation */}
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        title="Remove Course from Curriculum"
        message="Are you sure you want to remove this course from the semester curriculum? Active student enrollments will not be automatically dropped."
        confirmLabel="Remove"
        isDanger={true}
        isLoading={deleteCurriculumMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
