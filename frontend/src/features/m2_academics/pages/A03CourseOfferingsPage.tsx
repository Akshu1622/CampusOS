import React, { useState } from 'react'
import {
  Card, Button, Input, Table, StatusPill, Drawer, EmptyState,
  LoadingSkeleton, ConfirmationDialog, Select, Progress
} from '@/components/ui'
import {
  useOfferings, useCreateOffering, useUpdateOffering, useDeleteOffering,
  useOfferingRoster, useCourses, useTerms, useEmployees
} from '../hooks'
import type { CourseOffering, OfferingCreate, RosterStudent } from '../api'
import { Search, Plus, Calendar, Users, Trash2, Edit2, AlertCircle, Eye } from 'lucide-react'

export function A03CourseOfferingsPage() {
  const [search, setSearch] = useState('')
  const [selectedTermId, setSelectedTermId] = useState<string>('')
  const [selectedFillLevel, setSelectedFillLevel] = useState<string>('')

  // Drawer state for add/edit
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingOffering, setEditingOffering] = useState<CourseOffering | null>(null)
  const [formData, setFormData] = useState<OfferingCreate>({
    course_id: 1,
    term_id: 1,
    faculty_id: 1,
    section: 'A',
    capacity: 30,
  })
  const [formError, setFormError] = useState<string | null>(null)

  // Roster drawer state
  const [rosterOfferingId, setRosterOfferingId] = useState<number | null>(null)

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<CourseOffering | null>(null)

  // Lookups
  const { data: termsData } = useTerms()
  const terms = termsData || []

  // Auto-select current term if available
  React.useEffect(() => {
    if (!selectedTermId && terms.length > 0) {
      const current = terms.find(t => t.is_current === 1 || t.is_current === true)
      if (current) {
        setSelectedTermId(String(current.id))
      } else {
        setSelectedTermId(String(terms[0].id))
      }
    }
  }, [terms, selectedTermId])

  const { data: coursesData } = useCourses({ page_size: 200 })
  const courses = coursesData?.items || []

  const { data: employeesData } = useEmployees({ page_size: 200 })
  const employees = employeesData?.items || []

  // Offerings list query
  const { data: offeringsData, isLoading, error } = useOfferings({
    term_id: selectedTermId ? Number(selectedTermId) : undefined,
    page_size: 100,
  })

  const offerings = offeringsData?.items || []

  // Roster query for the selected offering
  const { data: rosterData, isLoading: loadingRoster } = useOfferingRoster(rosterOfferingId || 0)
  const rosterStudents = rosterData || []

  const createMutation = useCreateOffering()
  const updateMutation = useUpdateOffering()
  const deleteMutation = useDeleteOffering()

  // Mappings
  const courseMap = React.useMemo(() => {
    const m = new Map<number, { code: string; title: string }>()
    courses.forEach(c => m.set(c.id, { code: c.code, title: c.title }))
    return m
  }, [courses])

  const facultyMap = React.useMemo(() => {
    const m = new Map<number, string>()
    employees.forEach(e => m.set(e.id, `${e.first_name} ${e.last_name}`))
    return m
  }, [employees])

  const termMap = React.useMemo(() => {
    const m = new Map<number, string>()
    terms.forEach(t => m.set(t.id, t.term_label || t.term_identifier))
    return m
  }, [terms])

  // Filter offerings
  const filteredOfferings = offerings.filter(o => {
    const course = courseMap.get(o.course_id)
    const facultyName = facultyMap.get(o.faculty_id) || ''
    const matchSearch =
      (course?.code.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (course?.title.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      facultyName.toLowerCase().includes(search.toLowerCase()) ||
      o.section.toLowerCase().includes(search.toLowerCase())

    let matchFill = true
    if (selectedFillLevel === 'FULL') {
      matchFill = o.enrolled_count >= o.capacity
    } else if (selectedFillLevel === 'AVAILABLE') {
      matchFill = o.enrolled_count < o.capacity
    }

    return matchSearch && matchFill
  })

  const handleOpenAdd = () => {
    setEditingOffering(null)
    setFormData({
      course_id: courses[0]?.id || 1,
      term_id: selectedTermId ? Number(selectedTermId) : (terms[0]?.id || 1),
      faculty_id: employees[0]?.id || 1,
      section: 'A',
      capacity: 30,
    })
    setFormError(null)
    setIsDrawerOpen(true)
  }

  const handleOpenEdit = (offering: CourseOffering) => {
    setEditingOffering(offering)
    setFormData({
      course_id: offering.course_id,
      term_id: offering.term_id,
      faculty_id: offering.faculty_id,
      section: offering.section,
      capacity: offering.capacity,
    })
    setFormError(null)
    setIsDrawerOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (formData.capacity <= 0) {
      setFormError('Capacity must be greater than zero.')
      return
    }

    try {
      if (editingOffering) {
        await updateMutation.mutateAsync({
          id: editingOffering.id,
          data: {
            faculty_id: Number(formData.faculty_id),
            capacity: Number(formData.capacity),
          }
        })
      } else {
        await createMutation.mutateAsync({
          course_id: Number(formData.course_id),
          term_id: Number(formData.term_id),
          faculty_id: Number(formData.faculty_id),
          section: formData.section.trim().toUpperCase(),
          capacity: Number(formData.capacity),
        })
      }
      setIsDrawerOpen(false)
    } catch (err: any) {
      setFormError(err.message || 'Failed to save course offering.')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err) {
      // toast shown in hook
    }
  }

  const columns = [
    {
      key: 'course',
      header: 'Course',
      render: (row: CourseOffering) => {
        const c = courseMap.get(row.course_id)
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--color-primary)' }}>
              {c?.code || `ID #${row.course_id}`}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              {c?.title || ''}
            </span>
          </div>
        )
      }
    },
    {
      key: 'term',
      header: 'Term',
      render: (row: CourseOffering) => (
        <span style={{ fontSize: '13px' }}>
          {termMap.get(row.term_id) || `Term #${row.term_id}`}
        </span>
      )
    },
    {
      key: 'section',
      header: 'Section',
      render: (row: CourseOffering) => (
        <span style={{ fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: 'var(--color-surface-subtle)' }}>
          Sec {row.section}
        </span>
      )
    },
    {
      key: 'faculty',
      header: 'Faculty',
      render: (row: CourseOffering) => (
        <span style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
          {facultyMap.get(row.faculty_id) || `Faculty #${row.faculty_id}`}
        </span>
      )
    },
    {
      key: 'capacity',
      header: 'Capacity & Enrollment',
      render: (row: CourseOffering) => {
        const percent = Math.min(100, Math.round((row.enrolled_count / Math.max(1, row.capacity)) * 100))
        const statusType = percent >= 100 ? 'error' : percent >= 90 ? 'warning' : 'success'
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '160px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 500 }}>
              <span>{row.enrolled_count} / {row.capacity} enrolled</span>
              <StatusPill
                label={`${percent}%`}
                status={statusType as any}
              />
            </div>
            <Progress
              value={percent}
              max={100}
              variant={percent >= 100 ? 'danger' : percent >= 90 ? 'warning' : 'primary'}
            />
          </div>
        )
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: CourseOffering) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => setRosterOfferingId(row.id)}
            title="View Enrolled Students Roster"
          >
            <Eye size={14} />
          </Button>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => handleOpenEdit(row)}
            title="Edit Offering"
          >
            <Edit2 size={14} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteTarget(row)}
            title="Delete Offering"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      )
    }
  ]

  const rosterColumns = [
    {
      key: 'global_student_id',
      header: 'Student ID',
      render: (row: RosterStudent) => (
        <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>
          {row.global_student_id}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Name',
      render: (row: RosterStudent) => (
        <span>{row.first_name} {row.last_name}</span>
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
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          {row.enrolled_date ? new Date(row.enrolled_date).toLocaleDateString() : 'N/A'}
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
              A-03
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Course Offerings
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Schedule course sections per term, assign faculty instructors, and track class capacity limits.
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenAdd}>
          Add Offering
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card padding={16}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
            <Input
              placeholder="Search course code, title, faculty, or section..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
          <div style={{ width: '220px' }}>
            <Select
              value={selectedTermId}
              onChange={(e) => setSelectedTermId(e.target.value)}
              options={[
                { value: '', label: 'All Terms' },
                ...terms.map(t => ({ value: String(t.id), label: t.term_label || t.term_identifier }))
              ]}
            />
          </div>
          <div style={{ width: '180px' }}>
            <Select
              value={selectedFillLevel}
              onChange={(e) => setSelectedFillLevel(e.target.value)}
              options={[
                { value: '', label: 'All Fill Levels' },
                { value: 'AVAILABLE', label: 'Seats Available' },
                { value: 'FULL', label: 'Full / At Capacity' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card padding={0}>
        {isLoading ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <LoadingSkeleton height={40} />
            <LoadingSkeleton height={40} />
            <LoadingSkeleton height={40} />
          </div>
        ) : error ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-error)' }}>
            <AlertCircle size={32} style={{ marginBottom: '8px' }} />
            <div>Failed to load course offerings.</div>
          </div>
        ) : filteredOfferings.length === 0 ? (
          <EmptyState
            icon={<Calendar size={36} />}
            title="No course offerings found"
            description={search || selectedFillLevel ? "No offerings match the active search or filters." : "Create offerings for this term to allow student enrollment."}
            action={!search && !selectedFillLevel ? (
              <Button variant="primary" onClick={handleOpenAdd}>Add Offering</Button>
            ) : undefined}
          />
        ) : (
          <Table
            columns={columns}
            data={filteredOfferings}
          />
        )}
      </Card>

      {/* Add / Edit Offering Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingOffering ? `Edit Offering # ${editingOffering.id}` : 'Create Course Offering'}
        size="md"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && (
            <div style={{ padding: '12px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)', fontSize: '13px' }}>
              {formError}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Course *
            </label>
            <Select
              value={String(formData.course_id)}
              disabled={!!editingOffering}
              onChange={(e) => setFormData({ ...formData, course_id: Number(e.target.value) })}
              options={courses.map(c => ({ value: String(c.id), label: `${c.code} - ${c.title}` }))}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Academic Term *
            </label>
            <Select
              value={String(formData.term_id)}
              disabled={!!editingOffering}
              onChange={(e) => setFormData({ ...formData, term_id: Number(e.target.value) })}
              options={terms.map(t => ({ value: String(t.id), label: t.term_label || t.term_identifier }))}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Assigned Faculty *
            </label>
            <Select
              value={String(formData.faculty_id)}
              onChange={(e) => setFormData({ ...formData, faculty_id: Number(e.target.value) })}
              options={employees.map(e => ({ value: String(e.id), label: `${e.first_name} ${e.last_name}` }))}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Section *
            </label>
            <Input
              placeholder="e.g. A, B, C"
              value={formData.section}
              disabled={!!editingOffering}
              onChange={(e) => setFormData({ ...formData, section: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Seat Capacity *
            </label>
            <Input
              type="number"
              min={1}
              max={500}
              value={String(formData.capacity)}
              onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <Button variant="secondary" onClick={() => setIsDrawerOpen(false)} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingOffering ? 'Update Offering' : 'Create Offering'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Roster Drawer */}
      <Drawer
        isOpen={!!rosterOfferingId}
        onClose={() => setRosterOfferingId(null)}
        title="Class Roster - Enrolled Students"
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loadingRoster ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <LoadingSkeleton height={40} />
              <LoadingSkeleton height={40} />
            </div>
          ) : rosterStudents.length === 0 ? (
            <EmptyState
              icon={<Users size={32} />}
              title="No enrolled students"
              description="No students are currently enrolled in this course offering section."
            />
          ) : (
            <div>
              <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Total enrolled students: <strong>{rosterStudents.length}</strong>
              </div>
              <Table
                columns={rosterColumns}
                data={rosterStudents}
              />
            </div>
          )}
        </div>
      </Drawer>

      {/* Delete Offering Confirmation */}
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        title="Delete Course Offering"
        message="Are you sure you want to delete this course offering? Offerings with existing student enrollments cannot be deleted."
        confirmLabel="Delete"
        isDanger={true}
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
