import React, { useState, useEffect } from 'react'
import { Card, Button, Input, Table, StatusPill, Drawer, EmptyState, StatCard } from '@/components/ui'
import { apiClient } from '@/api/client'
import { toast } from 'react-hot-toast'
import { Search, Plus, MoreHorizontal, Building2, BookOpen, Layers, CheckCircle2, X } from 'lucide-react'

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
    const code = formData.code.trim().toUpperCase()
    const name = formData.name.trim()
    if (!code || !name) {
      toast.error('Department code and name are required')
      return
    }
    if (code.length > 10) {
      toast.error('Department code must not exceed 10 characters')
      return
    }
    setFormLoading(true)
    try {
      await apiClient('/departments', {
        method: 'POST',
        data: {
          code,
          name,
          head: formData.head.trim() || undefined
        }
      })
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
    {
      key: 'code',
      header: 'Department Code',
      render: (row: any) => (
        <span style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--color-primary)', fontSize: '13px' }}>
          {row.code}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Department Name',
      render: (row: any) => (
        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '14px' }}>
          {row.name}
        </span>
      )
    },
    {
      key: 'head',
      header: 'Head of Department',
      render: (row: any) => (
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
          {row.head || 'Not assigned'}
        </span>
      )
    },
    {
      key: 'stats',
      header: 'Academic Load',
      render: (row: any) => (
        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {row.programs_count || 0} Programs · {row.courses_count || 0} Courses
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: any) => (
        <StatusPill label={row.status === 'INACTIVE' ? 'Inactive' : 'Active'} status={row.status === 'INACTIVE' ? 'neutral' : 'success'} />
      )
    },
    {
      key: 'actions',
      header: '',
      render: () => (
        <Button variant="subtle" size="sm" onClick={() => toast.success('Viewing department details')}>
          <MoreHorizontal size={16} />
        </Button>
      )
    }
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
              Academic Departments
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Configure degree-granting academic faculties, divisions, and appointed department heads.
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsDrawerOpen(true)}>
          Add Department
        </Button>
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Departments"
          value={departments.length}
          icon={<Building2 size={20} />}
          moduleColor="academic"
          supportText="Active faculties"
        />
        <StatCard
          label="Assigned Heads"
          value={departments.filter(d => d.head).length}
          icon={<CheckCircle2 size={20} />}
          moduleColor="people"
          supportText="With active HODs"
          supportColor="success"
        />
        <StatCard
          label="Engineering Divisions"
          value="4"
          icon={<Layers size={20} />}
          moduleColor="hostel"
          supportText="CS, EE, ME, CE"
        />
      </div>

      {/* Main Table Card */}
      <Card padding={0}>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input 
              placeholder="Search by code or department name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
        </div>

        {filteredData.length === 0 && !loading ? (
          <div style={{ padding: '48px 24px' }}>
            <EmptyState
              icon={<Building2 size={40} />}
              title="No departments found"
              description="Create the first department or check your search term."
              action={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsDrawerOpen(true)}>Add Department</Button>}
            />
          </div>
        ) : (
          <Table columns={columns} data={filteredData} isLoading={loading} />
        )}
      </Card>

      {/* Add Department Drawer */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Create Department" size="md">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input 
            label="Department Code" 
            placeholder="e.g. CS or EE" 
            value={formData.code} 
            onChange={(e) => setFormData({ ...formData, code: e.target.value })} 
            required 
          />
          <Input 
            label="Department Name" 
            placeholder="e.g. Computer Science & Engineering" 
            value={formData.name} 
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
            required 
          />
          <Input 
            label="Appointed Head of Department (HOD)" 
            placeholder="e.g. EMP-2020-0001 or faculty name (Optional)" 
            value={formData.head} 
            onChange={(e) => setFormData({ ...formData, head: e.target.value })} 
          />
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button variant="secondary" type="button" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={formLoading}>Create Department</Button>
          </div>
        </form>
      </Drawer>
    </div>
  )
}
