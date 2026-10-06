import React, { useState, useEffect } from 'react'
import { Card, Button, Input, Table, StatusPill, Drawer, EmptyState } from '@/components/ui'
import { apiClient } from '@/api/client'
import { toast } from 'react-hot-toast'
import { Search, Plus, Filter, MoreHorizontal, Building2 } from 'lucide-react'

export function DepartmentManagementPage() {
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [formData, setFormData] = useState({ code: '', name: '', head: '' })
  const [formLoading, setFormLoading] = useState(false)

  const fetchDepartments = async () => {
    setLoading(true)
    try {
      const res = await apiClient(`/departments`)
      setDepartments(Array.isArray(res) ? res : [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch departments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      // Assuming endpoint is POST /departments
      await apiClient('/departments', { data: formData })
      toast.success('Department created successfully')
      setIsDrawerOpen(false)
      fetchDepartments()
      setFormData({ code: '', name: '', head: '' })
    } catch (err: any) {
      toast.error(err.message || 'Failed to create department')
    } finally {
      setFormLoading(false)
    }
  }

  const filteredData = departments.filter(d => 
    d.name?.toLowerCase().includes(search.toLowerCase()) || 
    d.code?.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { key: 'code', header: 'Code', render: (row: any) => <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{row.code}</span> },
    { key: 'name', header: 'Name', render: (row: any) => <span style={{ fontWeight: 500 }}>{row.name}</span> },
    { key: 'head', header: 'Head', render: (row: any) => <span style={{ color: 'var(--color-text-secondary)' }}>{row.head || 'Not assigned'}</span> },
    { key: 'stats', header: 'Programs / Courses', render: (row: any) => (
      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{row.programs_count || 0} / {row.courses_count || 0}</span>
    )},
    { key: 'status', header: 'Status', render: (row: any) => (
      <StatusPill label={row.status === 'ACTIVE' ? 'Active' : 'Inactive'} status={row.status === 'ACTIVE' ? 'success' : 'neutral'} />
    )},
    { key: 'actions', header: '', render: () => <Button variant="subtle" size="sm"><MoreHorizontal size={16} /></Button> }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Departments</h1>
          <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Manage academic departments and heads</div>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsDrawerOpen(true)}>Add Department</Button>
      </div>

      <Card padding={0}>
        <div style={{ padding: '16px', display: 'flex', gap: '12px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ width: '300px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
            <input 
              placeholder="Search by code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', height: '40px', padding: '8px 12px 8px 36px',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
                outline: 'none', fontSize: '14px'
              }}
            />
          </div>
          <Button variant="secondary" icon={<Filter size={16} />}>Status</Button>
        </div>

        {departments.length === 0 && !loading ? (
          <EmptyState 
            icon={<Building2 size={32} />}
            title="No departments yet"
            description="Create one to start organising programs."
            action={<Button variant="primary" onClick={() => setIsDrawerOpen(true) }>Add Department</Button>}
          />
        ) : (
          <Table columns={columns} data={filteredData} isLoading={loading} />
        )}
      </Card>

      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Add Department">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input label="Department Code" required value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} placeholder="e.g. CS" />
          <Input label="Department Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Computer Science" />
          <Input label="Head (Employee ID)" value={formData.head} onChange={(e) => setFormData({...formData, head: e.target.value})} placeholder="Optional" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={formLoading}>Save</Button>
          </div>
        </form>
      </Drawer>
    </div>
  )
}
