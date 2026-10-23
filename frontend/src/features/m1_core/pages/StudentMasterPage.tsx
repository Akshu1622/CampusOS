import React, { useState, useEffect, useMemo } from 'react'
import { Card, Button, Input, Table, StatusPill, Drawer, Select, Pagination, EmptyState, Avatar, StatCard } from '@/components/ui'
import { apiClient } from '@/api/client'
import { toast } from 'react-hot-toast'
import { Search, Plus, Filter, FileDown, Users, GraduationCap, CheckCircle2, AlertCircle, X } from 'lucide-react'

export function StudentMasterPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [selectedProgram, setSelectedProgram] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '', program_id: '', batch_year: '2024'
  })
  const [formLoading, setFormLoading] = useState(false)
  const [programs, setPrograms] = useState<any[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [stuRes, progRes] = await Promise.all([
        apiClient(`/students?page=${page}&page_size=${pageSize}&search=${encodeURIComponent(search)}`),
        apiClient('/programs')
      ])
      const progs = Array.isArray(progRes) ? progRes : []
      setStudents((stuRes as any)?.items || [])
      setTotal((stuRes as any)?.total || 0)
      setPrograms(progs)
      if (progs.length > 0 && !formData.program_id) {
        setFormData(prev => ({ ...prev, program_id: String(progs[0].id) }))
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch student data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, pageSize, search])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim()) {
      toast.error('First name, last name, and email are required')
      return
    }
    if (!formData.program_id || isNaN(Number(formData.program_id))) {
      toast.error('Please select a program')
      return
    }
    setFormLoading(true)
    try {
      await apiClient('/students', {
        method: 'POST',
        data: {
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          program_id: Number(formData.program_id),
          batch_year: Number(formData.batch_year)
        }
      })
      toast.success('Student enrolled successfully')
      setIsDrawerOpen(false)
      fetchData()
      setFormData({
        first_name: '', last_name: '', email: '', phone: '',
        program_id: programs[0]?.id ? String(programs[0].id) : '',
        batch_year: '2024'
      })
    } catch (err: any) {
      toast.error(err.message || 'Failed to create student')
    } finally {
      setFormLoading(false)
    }
  }

  // Filter students by selected program & status
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesProg = selectedProgram === 'ALL' || String(s.program_id) === selectedProgram
      const matchesStat = selectedStatus === 'ALL' || s.status === selectedStatus
      return matchesProg && matchesStat
    })
  }, [students, selectedProgram, selectedStatus])

  const columns = [
    {
      key: 'id',
      header: 'Student ID',
      render: (row: any) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '13px', color: 'var(--color-primary)' }}>
          {row.global_student_id || `STU-${String(row.id).padStart(6, '0')}`}
        </span>
      )
    },
    {
      key: 'student',
      header: 'Student Name',
      render: (row: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar name={`${row.first_name} ${row.last_name}`} size="sm" />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>
              {row.first_name} {row.last_name}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{row.email}</span>
          </div>
        </div>
      )
    },
    {
      key: 'program',
      header: 'Enrolled Program',
      render: (row: any) => {
        const prog = programs.find(p => p.id === row.program_id)
        return (
          <span style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            {prog?.name || row.program?.name || `Program #${row.program_id}`}
          </span>
        )
      }
    },
    {
      key: 'batch',
      header: 'Batch Year',
      render: (row: any) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          {row.batch_year || '2024'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Enrollment Status',
      render: (row: any) => (
        <StatusPill
          label={row.status === 'ACTIVE' ? 'Active' : 'Inactive'}
          status={row.status === 'ACTIVE' ? 'success' : 'neutral'}
        />
      )
    }
  ]

  const programOptions = [
    { label: 'All Programs', value: 'ALL' },
    ...programs.map(p => ({ label: p.name, value: String(p.id) }))
  ]

  const statusOptions = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-muted)', padding: '2px 8px', borderRadius: '4px' }}>
              M1 · Core
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)', letterSpacing: '-0.3px' }}>
              Student Directory
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Manage institutional student records, program assignments, and enrollment status.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" icon={<FileDown size={16} />} onClick={() => toast.success('Exporting student directory CSV...')}>
            Export CSV
          </Button>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsDrawerOpen(true)}>
            Add Student
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Students"
          value={total.toLocaleString()}
          icon={<Users size={20} />}
          moduleColor="academic"
          supportText="Registered in institution"
        />
        <StatCard
          label="Active Programs"
          value={programs.length}
          icon={<GraduationCap size={20} />}
          moduleColor="people"
          supportText="Degree programs offered"
        />
        <StatCard
          label="Current Term"
          value="Spring 2024"
          icon={<CheckCircle2 size={20} />}
          moduleColor="hostel"
          supportText="Batch 2023 - 2024"
          supportColor="success"
        />
      </div>

      {/* Main List Card with Toolbar */}
      <Card padding={0}>
        <div style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          borderBottom: '1px solid var(--color-border)',
          flexWrap: 'wrap'
        }}>
          {/* Search */}
          <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '360px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              placeholder="Search by student name, ID or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{
                width: '100%', height: '38px', padding: '0 32px 0 36px',
                borderRadius: '8px', border: '1px solid var(--color-border)',
                outline: 'none', fontSize: '13.5px', background: 'var(--color-surface-muted)',
                color: 'var(--color-text-primary)'
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', lineHeight: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ width: '180px' }}>
              <Select
                value={selectedProgram}
                options={programOptions}
                onChange={(e) => setSelectedProgram(e.target.value)}
              />
            </div>
            <div style={{ width: '140px' }}>
              <Select
                value={selectedStatus}
                options={statusOptions}
                onChange={(e) => setSelectedStatus(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        {filteredStudents.length === 0 && !loading ? (
          <div style={{ padding: '48px 24px' }}>
            <EmptyState
              icon={<Users size={40} />}
              title="No students found"
              description={search ? `No student records match "${search}". Try adjusting your filters.` : 'Get started by enrolling the first student.'}
              action={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsDrawerOpen(true)}>Add Student</Button>}
            />
          </div>
        ) : (
          <Table columns={columns} data={filteredStudents} isLoading={loading} />
        )}

        {/* Footer Pagination */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--color-surface)'
        }}>
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Showing {filteredStudents.length} of {total} students
          </span>
          <Pagination
            currentPage={page}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </Card>

      {/* Add Student Drawer */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Enroll New Student" size="md">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="First Name"
              placeholder="e.g. Aarav"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              placeholder="e.g. Sharma"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
            />
          </div>

          <Input
            label="Institutional Email"
            type="email"
            placeholder="aarav.sharma@campus.edu"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Contact Phone (Optional)"
            placeholder="+91 98765 43210"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <Select
            label="Degree Program"
            value={formData.program_id}
            options={programs.map(p => ({ label: `${p.code} - ${p.name}`, value: String(p.id) }))}
            onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
            required
          />

          <Input
            label="Admission Batch Year"
            type="number"
            placeholder="2024"
            value={formData.batch_year}
            onChange={(e) => setFormData({ ...formData, batch_year: e.target.value })}
            required
          />

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button variant="secondary" type="button" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={formLoading}>
              Save and Enroll
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  )
}
