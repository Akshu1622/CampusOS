import React, { useState, useEffect } from 'react'
import { Card, Button, Input, Table, StatusPill, Drawer, Select, EmptyState } from '@/components/ui'
import { apiClient } from '@/api/client'
import { toast } from 'react-hot-toast'
import { Plus, Filter, MoreHorizontal, GraduationCap } from 'lucide-react'

export function ProgramManagementPage() {
  const [programs, setPrograms] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', department_id: '', duration_years: '', total_credits: '' })
  const [formLoading, setFormLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [progRes, depRes] = await Promise.all([
        apiClient('/programs'),
        apiClient('/departments')
      ])
      const progs = Array.isArray(progRes) ? progRes : []
      const depts = Array.isArray(depRes) ? depRes : []
      setPrograms(progs)
      setDepartments(depts)
      if (depts.length > 0) {
        setFormData(prev => ({ ...prev, department_id: prev.department_id || String(depts[0].id) }))
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.department_id || isNaN(Number(formData.department_id))) {
      toast.error('Please select a department')
      return
    }
    setFormLoading(true)
    try {
      await apiClient('/programs', { 
        method: 'POST',
        data: {
          name: formData.name.trim(),
          department_id: Number(formData.department_id),
          duration_years: Number(formData.duration_years || 4),
          total_credits: Number(formData.total_credits || 160)
        }
      })
      toast.success('Program created successfully')
      setIsDrawerOpen(false)
      fetchData()
      setFormData({ name: '', department_id: departments[0]?.id ? String(departments[0].id) : '', duration_years: '', total_credits: '' })
    } catch (err: any) {
      toast.error(err.message || 'Failed to create program')
    } finally {
      setFormLoading(false)
    }
  }

  const columns = [
    { key: 'name', header: 'Program', render: (row: any) => <span style={{ fontWeight: 500 }}>{row.name}</span> },
    { key: 'department', header: 'Department', render: (row: any) => <span style={{ color: 'var(--color-text-secondary)' }}>{row.department?.name || row.department_id || 'N/A'}</span> },
    { key: 'duration', header: 'Duration', render: (row: any) => <span>{row.duration_years} Years</span> },
    { key: 'credits', header: 'Credits Req.', render: (row: any) => <span style={{ fontFamily: 'monospace' }}>{row.total_credits}</span> },
    { key: 'students', header: 'Students', render: (row: any) => <span>{row.students_count || 0}</span> },
    { key: 'status', header: 'Status', render: (row: any) => (
      <StatusPill label={row.status === 'ACTIVE' ? 'Active' : 'Inactive'} status={row.status === 'ACTIVE' ? 'success' : 'neutral'} />
    )},
    { key: 'actions', header: '', render: () => <Button variant="subtle" size="sm"><MoreHorizontal size={16} /></Button> }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Programs</h1>
          <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Manage degrees and academic programs</div>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsDrawerOpen(true)}>Add Program</Button>
      </div>

      <Card padding={0}>
        <div style={{ padding: '16px', display: 'flex', gap: '12px', borderBottom: '1px solid var(--color-border)' }}>
          <Button variant="secondary" icon={<Filter size={16} />}>Department</Button>
          <Button variant="secondary" icon={<Filter size={16} />}>Status</Button>
        </div>

        {programs.length === 0 && !loading ? (
          <EmptyState 
            icon={<GraduationCap size={32} />}
            title="No programs yet"
            description="Add programs to allow student enrollment."
            action={<Button variant="primary" onClick={() => setIsDrawerOpen(true) }>Add Program</Button>}
          />
        ) : (
          <Table columns={columns} data={programs} isLoading={loading} />
        )}
      </Card>

      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Add Program">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input label="Program Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. B.Tech Computer Science" />
          <Select 
            label="Department" 
            required 
            options={departments.map(d => ({ value: String(d.id), label: `${d.code} - ${d.name}` }))} 
            value={formData.department_id} 
            onChange={(e) => setFormData({...formData, department_id: (e as any)?.target?.value || e})} 
          />
          <Input label="Duration (Years)" type="number" required value={formData.duration_years} onChange={(e) => setFormData({...formData, duration_years: e.target.value})} placeholder="e.g. 4" />
          <Input label="Total Credits Required" type="number" required value={formData.total_credits} onChange={(e) => setFormData({...formData, total_credits: e.target.value})} placeholder="e.g. 160" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={formLoading}>Save</Button>
          </div>
        </form>
      </Drawer>
    </div>
  )
}
