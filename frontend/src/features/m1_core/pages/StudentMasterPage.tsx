import React, { useState, useEffect } from 'react'
import { Card, Button, Input, Table, StatusPill, Drawer, Select, Pagination, EmptyState, Avatar } from '@/components/ui'
import { apiClient } from '@/api/client'
import { toast } from 'react-hot-toast'
import { Search, Plus, Filter, MoreHorizontal, FileDown, Users } from 'lucide-react'

export function StudentMasterPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '', program_id: '', batch_year: ''
  })
  const [formLoading, setFormLoading] = useState(false)
  const [programs, setPrograms] = useState<any[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [stuRes, progRes] = await Promise.all([
        apiClient(`/students?page=${page}&page_size=${pageSize}&search=${search}`),
        apiClient('/programs')
      ])
      const progs = Array.isArray(progRes) ? progRes : []
      setStudents((stuRes as any)?.items || [])
      setTotal((stuRes as any)?.total || 0)
      setPrograms(progs)
      if (progs.length > 0) {
        setFormData(prev => ({ ...prev, program_id: prev.program_id || String(progs[0].id) }))
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, pageSize, search])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.program_id || isNaN(Number(formData.program_id))) {
      toast.error('Please select a program')
      return
    }
    if (!formData.batch_year || isNaN(Number(formData.batch_year))) {
      toast.error('Please enter a valid batch year (e.g. 2025)')
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
      toast.success('Student created successfully')
      setIsDrawerOpen(false)
      fetchData()
      setFormData({ first_name: '', last_name: '', email: '', phone: '', program_id: programs[0]?.id ? String(programs[0].id) : '', batch_year: '' })
    } catch (err: any) {
      toast.error(err.message || 'Failed to create student')
    } finally {
      setFormLoading(false)
    }
  }

  const columns = [
    { key: 'id', header: 'ID', render: (row: any) => <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{row.global_student_id || row.student_id}</span> },
    { key: 'student', header: 'Student', render: (row: any) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Avatar name={`${row.first_name} ${row.last_name}`} size="sm" />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 500 }}>{row.first_name} {row.last_name}</span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{row.email}</span>
        </div>
      </div>
    )},
    { key: 'program', header: 'Program', render: (row: any) => {
      const prog = programs.find(p => p.id === row.program_id);
      return <span style={{ color: 'var(--color-text-secondary)' }}>{prog?.name || row.program?.name || 'N/A'}</span>
    }},
    { key: 'batch', header: 'Batch', render: (row: any) => <span>{row.batch_year}</span> },
    { key: 'status', header: 'Status', render: (row: any) => (
      <StatusPill label={row.status === 'ACTIVE' ? 'Active' : 'Inactive'} status={row.status === 'ACTIVE' ? 'success' : 'neutral'} />
    )},
    { key: 'actions', header: '', render: () => <Button variant="subtle" size="sm"><MoreHorizontal size={16} /></Button> }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Students</h1>
          <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Total: {total.toLocaleString()}</div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" icon={<FileDown size={16} />}>Export</Button>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsDrawerOpen(true)}>Add Student</Button>
        </div>
      </div>

      <Card padding={0}>
        <div style={{ padding: '16px', display: 'flex', gap: '12px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ width: '300px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
            <input 
              placeholder="Search name, ID, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', height: '40px', padding: '8px 12px 8px 36px',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
                outline: 'none', fontSize: '14px'
              }}
            />
          </div>
          <Button variant="secondary" icon={<Filter size={16} />}>Program</Button>
          <Button variant="secondary" icon={<Filter size={16} />}>Batch/Year</Button>
          <Button variant="secondary" icon={<Filter size={16} />}>Status</Button>
        </div>

        {students.length === 0 && !loading ? (
          <EmptyState 
            icon={<Users size={32} />}
            title="No students found"
            description="Add a student or check your filters."
            action={<Button variant="primary" onClick={() => setIsDrawerOpen(true) }>Add Student</Button>}
          />
        ) : (
          <Table columns={columns} data={students} isLoading={loading} />
        )}

        <div style={{ padding: '16px', borderTop: '1px solid var(--color-border)' }}>
          <Pagination 
            currentPage={page}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </Card>

      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Add Student" size="md">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Identity</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input label="First Name" required value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
              <Input label="Last Name" required value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
            </div>
          </div>
          
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Contact</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input label="Email" type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              <Input label="Phone Number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Academic</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Select 
                label="Program" 
                required 
                options={programs.map(p => ({ value: String(p.id), label: `${p.code ? p.code + ' - ' : ''}${p.name}` }))}
                value={formData.program_id}
                onChange={(e) => setFormData({...formData, program_id: (e as any)?.target?.value || e})}
              />
              <Input label="Batch Year" type="number" required value={formData.batch_year} onChange={(e) => setFormData({...formData, batch_year: e.target.value})} placeholder="e.g. 2025" />
            </div>
            <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
              A global Student ID will be automatically generated.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={formLoading}>Create Student</Button>
          </div>
        </form>
      </Drawer>
    </div>
  )
}
