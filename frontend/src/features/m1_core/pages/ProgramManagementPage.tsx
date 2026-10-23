import React, { useState, useEffect, useMemo } from 'react'
import { Card, Button, Input, Table, StatusPill, Drawer, Select, EmptyState, StatCard } from '@/components/ui'
import { apiClient } from '@/api/client'
import { toast } from 'react-hot-toast'
import { Plus, Search, MoreHorizontal, GraduationCap, Award, BookOpen, Layers, X } from 'lucide-react'

export function ProgramManagementPage() {
  const [programs, setPrograms] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState('ALL')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', department_id: '', duration_years: '4', total_credits: '160' })
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
      if (depts.length > 0 && !formData.department_id) {
        setFormData(prev => ({ ...prev, department_id: String(depts[0].id) }))
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch academic program data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Program name is required')
      return
    }
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
      toast.success('Degree program created successfully')
      setIsDrawerOpen(false)
      fetchData()
      setFormData({ name: '', department_id: departments[0]?.id ? String(departments[0].id) : '', duration_years: '4', total_credits: '160' })
    } catch (err: any) {
      toast.error(err.message || 'Failed to create program')
    } finally {
      setFormLoading(false)
    }
  }

  const deptMap = useMemo(() => {
    const m = new Map<number, string>()
    departments.forEach(d => m.set(d.id, d.name))
    return m
  }, [departments])

  const filteredPrograms = useMemo(() => {
    return programs.filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.code?.toLowerCase().includes(search.toLowerCase())
      const matchesDept = selectedDept === 'ALL' || String(p.department_id) === selectedDept
      return matchesSearch && matchesDept
    })
  }, [programs, search, selectedDept])

  const columns = [
    {
      key: 'code',
      header: 'Program Code',
      render: (row: any) => (
        <span style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--color-primary)', fontSize: '13px' }}>
          {row.code || `PRG-${row.id}`}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Degree Program',
      render: (row: any) => (
        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '14px' }}>
          {row.name}
        </span>
      )
    },
    {
      key: 'department',
      header: 'Department',
      render: (row: any) => (
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px', fontWeight: 500 }}>
          {deptMap.get(row.department_id) || row.department?.name || `Dept #${row.department_id}`}
        </span>
      )
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (row: any) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
          {row.duration_years || 4} Years
        </span>
      )
    },
    {
      key: 'credits',
      header: 'Total Credits',
      render: (row: any) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {row.credits_required || row.total_credits || 120} Cr
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: any) => (
        <StatusPill
          label={row.status === 'ACTIVE' || !row.status ? 'Active' : 'Inactive'}
          status={row.status === 'ACTIVE' || !row.status ? 'success' : 'neutral'}
        />
      )
    },
    {
      key: 'actions',
      header: '',
      render: () => (
        <Button variant="subtle" size="sm" onClick={() => toast.success('Viewing program curriculum')}>
          <MoreHorizontal size={16} />
        </Button>
      )
    }
  ]

  const deptOptions = [
    { label: 'All Departments', value: 'ALL' },
    ...departments.map(d => ({ label: d.name, value: String(d.id) }))
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
              Degree Programs
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Configure undergraduate and postgraduate degree programs, duration, and credit graduation criteria.
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsDrawerOpen(true)}>
          Add Program
        </Button>
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Degree Programs"
          value={programs.length}
          icon={<GraduationCap size={20} />}
          moduleColor="academic"
          supportText="Undergraduate & Postgraduate"
        />
        <StatCard
          label="Affiliated Departments"
          value={departments.length}
          icon={<Layers size={20} />}
          moduleColor="people"
          supportText="Active faculties"
        />
        <StatCard
          label="Standard Duration"
          value="4 Years"
          icon={<Award size={20} />}
          moduleColor="finance"
          supportText="120 - 160 credits average"
        />
      </div>

      {/* Main Table Card */}
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
          <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '360px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input 
              placeholder="Search programs by title or code..."
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

          <div style={{ width: '220px' }}>
            <Select
              value={selectedDept}
              options={deptOptions}
              onChange={(e) => setSelectedDept(e.target.value)}
            />
          </div>
        </div>

        {filteredPrograms.length === 0 && !loading ? (
          <div style={{ padding: '48px 24px' }}>
            <EmptyState
              icon={<GraduationCap size={40} />}
              title="No programs found"
              description="Create the first degree program or adjust your department filter."
              action={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsDrawerOpen(true)}>Add Program</Button>}
            />
          </div>
        ) : (
          <Table columns={columns} data={filteredPrograms} isLoading={loading} />
        )}
      </Card>

      {/* Add Program Drawer */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Create Degree Program" size="md">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input 
            label="Program Title" 
            placeholder="e.g. Bachelors in Computer Science" 
            value={formData.name} 
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
            required 
          />

          <Select
            label="Department"
            value={formData.department_id}
            options={departments.map(d => ({ label: `${d.code} - ${d.name}`, value: String(d.id) }))}
            onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input 
              label="Duration (Years)" 
              type="number" 
              placeholder="4" 
              value={formData.duration_years} 
              onChange={(e) => setFormData({ ...formData, duration_years: e.target.value })} 
              required 
            />
            <Input 
              label="Credits Required" 
              type="number" 
              placeholder="120" 
              value={formData.total_credits} 
              onChange={(e) => setFormData({ ...formData, total_credits: e.target.value })} 
              required 
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button variant="secondary" type="button" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={formLoading}>Create Program</Button>
          </div>
        </form>
      </Drawer>
    </div>
  )
}
