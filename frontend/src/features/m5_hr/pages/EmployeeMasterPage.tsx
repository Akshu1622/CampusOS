import React, { useState, useEffect, useMemo } from 'react'
import { Card, Table, type Column, Button, Input, StatCard, StatusPill, Drawer, Select, Avatar, EmptyState } from '@/components/ui'
import { Briefcase, Plus, Search, FileDown, Users, Award, X } from 'lucide-react'
import { apiClient } from '@/api/client'
import { toast } from 'react-hot-toast'

interface EmployeeRow {
  id: number
  employee_id: string
  first_name: string
  last_name: string
  department_id: number
  designation_id: number
  joining_date: string
  emp_type: 'FACULTY' | 'STAFF'
  status: 'ACTIVE' | 'INACTIVE'
  department_name?: string
  designation_title?: string
}

export const EmployeeMasterPage: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeRow[]>([])
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([])
  const [designations, setDesignations] = useState<{ id: number; title: string }[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [deptFilter, setDeptFilter] = useState('ALL')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    departmentId: '',
    designationId: '',
    joiningDate: new Date().toISOString().split('T')[0],
    empType: 'FACULTY' as 'FACULTY' | 'STAFF'
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [empRes, deptRes, desigRes] = await Promise.all([
        apiClient<any[]>('/employees?limit=200'),
        apiClient<any[]>('/departments'),
        apiClient<any[]>('/designations')
      ])

      const depts = Array.isArray(deptRes) ? deptRes : []
      const desigs = Array.isArray(desigRes) ? desigRes : []
      setDepartments(depts)
      setDesignations(desigs)

      const deptMap = Object.fromEntries(depts.map(d => [d.id, d.name]))
      const desigMap = Object.fromEntries(desigs.map(d => [d.id, d.title]))

      const empList: EmployeeRow[] = (Array.isArray(empRes) ? empRes : []).map(e => ({
        ...e,
        department_name: deptMap[e.department_id] || `Dept #${e.department_id}`,
        designation_title: desigMap[e.designation_id] || `Desig #${e.designation_id}`
      }))
      setEmployees(empList)

      if (depts.length > 0 && !formData.departmentId) {
        setFormData(prev => ({
          ...prev,
          departmentId: String(depts[0].id),
          designationId: desigs.length > 0 ? String(desigs[0].id) : ''
        }))
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load employee records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First and last name are required')
      return
    }
    if (!formData.departmentId || !formData.designationId) {
      toast.error('Department and designation must be selected')
      return
    }

    try {
      const created = await apiClient<any>('/employees', {
        method: 'POST',
        data: {
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          department_id: Number(formData.departmentId),
          designation_id: Number(formData.designationId),
          joining_date: formData.joiningDate,
          emp_type: formData.empType,
          status: 'ACTIVE'
        }
      })
      toast.success(`Employee created! ID: ${created.employee_id || created.id}`)
      setIsDrawerOpen(false)
      setFormData({
        firstName: '',
        lastName: '',
        departmentId: departments[0] ? String(departments[0].id) : '',
        designationId: designations[0] ? String(designations[0].id) : '',
        joiningDate: new Date().toISOString().split('T')[0],
        empType: 'FACULTY'
      })
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create employee')
    }
  }

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const fullName = `${e.first_name} ${e.last_name}`.toLowerCase()
      const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
        e.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesDept = deptFilter === 'ALL' || String(e.department_id) === deptFilter
      return matchesSearch && matchesDept
    })
  }, [employees, searchTerm, deptFilter])

  const columns: Column<EmployeeRow>[] = [
    {
      key: 'employee_id',
      header: 'Employee ID',
      render: (r) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)', fontSize: '13px' }}>
          {r.employee_id}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Employee',
      render: (r) => {
        const fullName = `${r.first_name} ${r.last_name}`
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar name={fullName} size="sm" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '13.5px' }}>{fullName}</span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Joined: {r.joining_date}</span>
            </div>
          </div>
        )
      }
    },
    {
      key: 'department',
      header: 'Department',
      render: (r) => <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>{r.department_name}</span>
    },
    {
      key: 'designation',
      header: 'Designation',
      render: (r) => (
        <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: '13px' }}>
          {r.designation_title}
        </span>
      )
    },
    {
      key: 'type',
      header: 'Classification',
      render: (r) => (
        <span style={{
          fontSize: '11.5px',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: '4px',
          background: r.emp_type === 'FACULTY' ? 'var(--color-chip-academic-bg)' : 'var(--color-chip-people-bg)',
          color: r.emp_type === 'FACULTY' ? 'var(--color-chip-academic-text)' : 'var(--color-chip-people-text)'
        }}>
          {r.emp_type}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <StatusPill
          label={r.status}
          status={r.status === 'ACTIVE' ? 'success' : 'neutral'}
        />
      )
    }
  ]

  const facultyCount = employees.filter(e => e.emp_type === 'FACULTY').length
  const staffCount = employees.filter(e => e.emp_type === 'STAFF').length

  const deptOptions = useMemo(() => {
    return [
      { label: 'All Departments', value: 'ALL' },
      ...departments.map(d => ({ label: d.name, value: String(d.id) }))
    ]
  }, [departments])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-muted)', padding: '2px 8px', borderRadius: '4px' }}>
              M5 · HR
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)', letterSpacing: '-0.3px' }}>
              Employee Directory
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Manage university academic faculty and administrative staff employment records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" icon={<FileDown size={16} />} onClick={() => toast.success('Exporting employee directory...')}>
            Export
          </Button>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsDrawerOpen(true)}>
            Add Employee
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Employees"
          value={employees.length}
          icon={<Users size={20} />}
          moduleColor="people"
          supportText="Active appointments"
        />
        <StatCard
          label="Teaching Faculty"
          value={facultyCount}
          icon={<Award size={20} />}
          moduleColor="academic"
          supportText="Professors & Lecturers"
        />
        <StatCard
          label="Administrative Staff"
          value={staffCount}
          icon={<Briefcase size={20} />}
          moduleColor="finance"
          supportText="Support & Operations"
        />
      </div>

      {/* Main Table with Toolbar */}
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
              placeholder="Search name or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', height: '38px', padding: '0 32px 0 36px',
                borderRadius: '8px', border: '1px solid var(--color-border)',
                outline: 'none', fontSize: '13.5px', background: 'var(--color-surface-muted)',
                color: 'var(--color-text-primary)'
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', lineHeight: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ width: '220px' }}>
            <Select
              value={deptFilter}
              options={deptOptions}
              onChange={(e) => setDeptFilter(e.target.value)}
            />
          </div>
        </div>

        {filteredEmployees.length === 0 ? (
          <div style={{ padding: '48px 24px' }}>
            <EmptyState
              icon={<Users size={40} />}
              title="No employees found"
              description="No employee records match your search criteria."
              action={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsDrawerOpen(true)}>Add Employee</Button>}
            />
          </div>
        ) : (
          <Table columns={columns} data={filteredEmployees} />
        )}
      </Card>

      {/* Add Employee Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Add New Employee"
        size="md"
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="First Name"
              placeholder="e.g. Ramesh"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              placeholder="e.g. Kumar"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>

          <Select
            label="Classification"
            value={formData.empType}
            options={[
              { label: 'Academic Faculty', value: 'FACULTY' },
              { label: 'Administrative Staff', value: 'STAFF' }
            ]}
            onChange={(e) => setFormData({ ...formData, empType: e.target.value as 'FACULTY' | 'STAFF' })}
            required
          />

          <Select
            label="Department"
            value={formData.departmentId}
            options={departments.map(d => ({ label: d.name, value: String(d.id) }))}
            onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
            required
          />

          <Select
            label="Designation"
            value={formData.designationId}
            options={designations.map(d => ({ label: d.title, value: String(d.id) }))}
            onChange={(e) => setFormData({ ...formData, designationId: e.target.value })}
            required
          />

          <Input
            label="Joining Date"
            type="date"
            value={formData.joiningDate}
            onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
            required
          />

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button variant="secondary" type="button" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Employee
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  )
}
