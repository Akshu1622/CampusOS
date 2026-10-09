import React, { useState } from 'react'
import {
  Card, Button, Input, Table, StatusPill, Drawer, EmptyState,
  LoadingSkeleton, ConfirmationDialog, Select
} from '@/components/ui'
import {
  useCourses, useCreateCourse, useUpdateCourse, useDeleteCourse,
  useDepartments
} from '../hooks'
import type { Course, CourseCreate } from '../api'
import { Search, Plus, BookOpen, Trash2, Edit2, AlertCircle } from 'lucide-react'

export function A01CourseCatalogPage() {
  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [page, setPage] = useState(1)

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [formData, setFormData] = useState<CourseCreate>({
    code: '',
    title: '',
    credits: 3,
    department_id: 1,
  })
  const [formError, setFormError] = useState<string | null>(null)

  // Delete dialog state
  const [deleteCourseTarget, setDeleteCourseTarget] = useState<Course | null>(null)

  const { data: deptData } = useDepartments()
  const departments = deptData || []

  const { data, isLoading, error } = useCourses({
    page,
    page_size: 50,
    department_id: selectedDept ? Number(selectedDept) : undefined
  })

  const createMutation = useCreateCourse()
  const updateMutation = useUpdateCourse()
  const deleteMutation = useDeleteCourse()

  const courses = data?.items || []

  const filteredCourses = courses.filter(c => {
    const matchesSearch =
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = selectedStatus ? c.status === selectedStatus : true
    return matchesSearch && matchesStatus
  })

  const handleOpenAdd = () => {
    setEditingCourse(null)
    setFormData({
      code: '',
      title: '',
      credits: 3,
      department_id: departments[0]?.id || 1,
    })
    setFormError(null)
    setIsDrawerOpen(true)
  }

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      code: course.code,
      title: course.title,
      credits: course.credits,
      department_id: course.department_id,
    })
    setFormError(null)
    setIsDrawerOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.code.trim() || !formData.title.trim()) {
      setFormError('Course code and title are required.')
      return
    }

    try {
      if (editingCourse) {
        await updateMutation.mutateAsync({
          id: editingCourse.id,
          data: {
            title: formData.title.trim(),
            credits: Number(formData.credits),
            department_id: Number(formData.department_id),
          }
        })
      } else {
        await createMutation.mutateAsync({
          code: formData.code.trim().toUpperCase(),
          title: formData.title.trim(),
          credits: Number(formData.credits),
          department_id: Number(formData.department_id),
        })
      }
      setIsDrawerOpen(false)
    } catch (err: any) {
      setFormError(err.message || 'Operation failed. Please check inputs.')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteCourseTarget) return
    try {
      await deleteMutation.mutateAsync(deleteCourseTarget.id)
      setDeleteCourseTarget(null)
    } catch (err) {
      // toast shown in mutation
    }
  }

  const deptMap = React.useMemo(() => {
    const m = new Map<number, string>()
    departments.forEach(d => m.set(d.id, `${d.code} - ${d.name}`))
    return m
  }, [departments])

  const columns = [
    {
      key: 'code',
      header: 'Course Code',
      render: (row: Course) => (
        <span style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--color-primary)' }}>
          {row.code}
        </span>
      )
    },
    {
      key: 'title',
      header: 'Title',
      render: (row: Course) => <span style={{ fontWeight: 500 }}>{row.title}</span>
    },
    {
      key: 'department',
      header: 'Department',
      render: (row: Course) => (
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
          {deptMap.get(row.department_id) || `Dept #${row.department_id}`}
        </span>
      )
    },
    {
      key: 'credits',
      header: 'Credits',
      render: (row: Course) => (
        <span style={{ fontWeight: 500, padding: '2px 8px', borderRadius: '4px', background: 'var(--color-surface-subtle)' }}>
          {row.credits} Cr
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Course) => (
        <StatusPill
          label={row.status}
          status={row.status === 'ACTIVE' ? 'success' : 'neutral'}
        />
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Course) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => handleOpenEdit(row)}
            title="Edit Course"
          >
            <Edit2 size={14} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteCourseTarget(row)}
            title="Delete / Retire Course"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
              A-01
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Course Catalog
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Manage academic course offerings, credit allocations, and departments.
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenAdd}>
          Add Course
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card padding={16}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
            <Input
              placeholder="Search by course code or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
          <div style={{ width: '220px' }}>
            <Select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              options={[
                { value: '', label: 'All Departments' },
                ...departments.map(d => ({ value: String(d.id), label: `${d.code} - ${d.name}` }))
              ]}
            />
          </div>
          <div style={{ width: '160px' }}>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'RETIRED', label: 'Retired' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Main Table Content */}
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
            <div>Failed to load courses. Please try again.</div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={36} />}
            title="No courses found"
            description={search || selectedDept ? "No courses match the active search or filters." : "Start by creating your first course in the catalog."}
            action={!search && !selectedDept ? (
              <Button variant="primary" onClick={handleOpenAdd}>Add Course</Button>
            ) : undefined}
          />
        ) : (
          <Table
            columns={columns}
            data={filteredCourses}
          />
        )}
      </Card>

      {/* Add / Edit Course Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingCourse ? `Edit Course: ${editingCourse.code}` : 'Add New Course'}
        size="md"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && (
            <div style={{ padding: '12px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)', fontSize: '14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Course Code *
            </label>
            <Input
              placeholder="e.g. CS101, MATH201"
              value={formData.code}
              disabled={!!editingCourse}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
            />
            {editingCourse && (
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Course codes are unique identifiers and cannot be altered once created.
              </span>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Course Title *
            </label>
            <Input
              placeholder="e.g. Introduction to Computer Science"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Department *
            </label>
            <Select
              value={String(formData.department_id)}
              onChange={(e) => setFormData({ ...formData, department_id: Number(e.target.value) })}
              options={departments.map(d => ({ value: String(d.id), label: `${d.code} - ${d.name}` }))}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Credits *
            </label>
            <Input
              type="number"
              min={1}
              max={10}
              value={String(formData.credits)}
              onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
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
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : editingCourse ? 'Save Changes' : 'Create Course'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Delete / Retire Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deleteCourseTarget}
        title="Delete Course"
        message={`Are you sure you want to delete course ${deleteCourseTarget?.code} (${deleteCourseTarget?.title})? This action cannot be undone if offerings or enrollments depend on it.`}
        confirmLabel="Delete Course"
        isDanger={true}
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteCourseTarget(null)}
      />
    </div>
  )
}
