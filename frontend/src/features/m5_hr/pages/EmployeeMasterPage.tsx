import React, { useState, useMemo } from 'react'
import { Card, Table, type Column, Button, Input, StatCard, StatusPill, Drawer, Select, Avatar, EmptyState } from '@/components/ui'
import { Briefcase, Plus, Search, FileDown, Users, Award, CheckCircle2, MoreHorizontal, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Employee {
  id: string
  name: string
  email: string
  department: string
  designation: string
  type: 'Faculty' | 'Staff'
  status: 'Active' | 'On Leave' | 'Terminated'
}

const initialEmployees: Employee[] = [
  { id: 'EMP001', name: 'Dr. Aarav Sharma', email: 'aarav.sharma@campus.edu', department: 'Computer Science', designation: 'Professor', type: 'Faculty', status: 'Active' },
  { id: 'EMP002', name: 'Dr. Priya Patel', email: 'priya.patel@campus.edu', department: 'Electrical Engineering', designation: 'Associate Professor', type: 'Faculty', status: 'Active' },
  { id: 'EMP003', name: 'Prof. Rajesh Verma', email: 'rajesh.verma@campus.edu', department: 'Mechanical Engineering', designation: 'Assistant Professor', type: 'Faculty', status: 'On Leave' },
  { id: 'EMP004', name: 'Sunita Menon', email: 'sunita.menon@campus.edu', department: 'Administration', designation: 'Registrar', type: 'Staff', status: 'Active' },
  { id: 'EMP005', name: 'Vikram Joshi', email: 'vikram.joshi@campus.edu', department: 'Finance & Accounts', designation: 'Senior Accountant', type: 'Staff', status: 'Active' },
  { id: 'EMP006', name: 'Ananya Rao', email: 'ananya.rao@campus.edu', department: 'Computer Science', designation: 'Assistant Professor', type: 'Faculty', status: 'Active' }
]

export const EmployeeMasterPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [searchTerm, setSearchTerm] = useState('')
  const [deptFilter, setDeptFilter] = useState('ALL')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Computer Science',
    designation: 'Assistant Professor',
    type: 'Faculty' as 'Faculty' | 'Staff'
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Name and email are required')
      return
    }
    const newEmp: Employee = {
      id: `EMP${String(employees.length + 1).padStart(3, '0')}`,
      name: formData.name.trim(),
      email: formData.email.trim(),
      department: formData.department,
      designation: formData.designation,
      type: formData.type,
      status: 'Active'
    }
    setEmployees(prev => [newEmp, ...prev])
    setIsDrawerOpen(false)
    setFormData({ name: '', email: '', department: 'Computer Science', designation: 'Assistant Professor', type: 'Faculty' })
    toast.success('Employee created successfully!')
  }

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesDept = deptFilter === 'ALL' || e.department === deptFilter
      return matchesSearch && matchesDept
    })
  }, [employees, searchTerm, deptFilter])

  const columns: Column<Employee>[] = [
    {
      key: 'id',
      header: 'Employee ID',
      render: (r) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)', fontSize: '13px' }}>
          {r.id}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Employee',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar name={r.name} size="sm" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '13.5px' }}>{r.name}</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{r.email}</span>
          </div>
        </div>
      )
    },
    {
      key: 'department',
      header: 'Department',
      render: (r) => <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>{r.department}</span>
    },
    {
      key: 'designation',
      header: 'Designation',
      render: (r) => (
        <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: '13px' }}>
          {r.designation}
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
          background: r.type === 'Faculty' ? 'var(--color-chip-academic-bg)' : 'var(--color-chip-people-bg)',
          color: r.type === 'Faculty' ? 'var(--color-chip-academic-text)' : 'var(--color-chip-people-text)'
        }}>
          {r.type}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <StatusPill
          label={r.status}
          status={r.status === 'Active' ? 'success' : r.status === 'On Leave' ? 'warning' : 'error'}
        />
      )
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <Button variant="subtle" size="sm" onClick={() => toast.success(`Viewing profile of ${r.name}`)}>
          <MoreHorizontal size={16} />
        </Button>
      )
    }
  ]

  const facultyCount = employees.filter(e => e.type === 'Faculty').length
  const staffCount = employees.filter(e => e.type === 'Staff').length

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
              placeholder="Search name, ID, or email..."
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
              options={[
                { label: 'All Departments', value: 'ALL' },
                { label: 'Computer Science', value: 'Computer Science' },
                { label: 'Electrical Engineering', value: 'Electrical Engineering' },
                { label: 'Mechanical Engineering', value: 'Mechanical Engineering' },
                { label: 'Administration', value: 'Administration' },
                { label: 'Finance & Accounts', value: 'Finance & Accounts' }
              ]}
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
          <Input
            label="Full Name"
            placeholder="e.g. Dr. Ramesh Kumar"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Institutional Email"
            type="email"
            placeholder="ramesh.kumar@campus.edu"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Select
            label="Classification"
            value={formData.type}
            options={[
              { label: 'Academic Faculty', value: 'Faculty' },
              { label: 'Administrative Staff', value: 'Staff' }
            ]}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'Faculty' | 'Staff' })}
            required
          />

          <Select
            label="Department"
            value={formData.department}
            options={[
              { label: 'Computer Science', value: 'Computer Science' },
              { label: 'Electrical Engineering', value: 'Electrical Engineering' },
              { label: 'Mechanical Engineering', value: 'Mechanical Engineering' },
              { label: 'Administration', value: 'Administration' },
              { label: 'Finance & Accounts', value: 'Finance & Accounts' }
            ]}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            required
          />

          <Select
            label="Designation"
            value={formData.designation}
            options={[
              { label: 'Professor', value: 'Professor' },
              { label: 'Associate Professor', value: 'Associate Professor' },
              { label: 'Assistant Professor', value: 'Assistant Professor' },
              { label: 'Registrar', value: 'Registrar' },
              { label: 'Senior Accountant', value: 'Senior Accountant' },
              { label: 'Clerk / Officer', value: 'Clerk' }
            ]}
            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
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
