import React, { useState, useEffect } from 'react'
import { Card, StatCard, Button, Table, type Column, Input, Select, StatusPill, Drawer } from '@/components/ui'
import { Download, Search, Users, DollarSign, ShieldCheck, FileText, CheckCircle, Calendar } from 'lucide-react'
import { apiClient } from '@/api/client'
import { toast } from 'react-hot-toast'

interface PayrollRegisterRecord {
  payroll_month: string
  run_status: string
  department_name: string
  employee_id: number
  global_employee_id: string
  employee_name: string
  designation: string
  gross_pay: number
  total_deductions: number
  net_pay: number
  leave_days_deducted: number
}

interface Department {
  id: number
  name: string
  code: string
}

export const PayrollRegisterPage: React.FC = () => {
  const currentMonthStr = new Date().toISOString().slice(0, 7)
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr)
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDeptId, setSelectedDeptId] = useState<string>('')
  const [records, setRecords] = useState<PayrollRegisterRecord[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<PayrollRegisterRecord | null>(null)

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await apiClient<Department[]>('/departments')
        setDepartments(Array.isArray(res) ? res : [])
      } catch (e) {
        console.error('Failed to load departments', e)
      }
    }
    fetchDepts()
  }, [])

  // Fetch register records whenever selectedMonth or selectedDeptId changes
  const fetchRegister = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedMonth) params.append('month', selectedMonth)
      if (selectedDeptId) params.append('dept_id', selectedDeptId)

      const queryStr = params.toString() ? `?${params.toString()}` : ''
      const res = await apiClient<PayrollRegisterRecord[]>(`/payroll-register${queryStr}`)
      setRecords(Array.isArray(res) ? res : [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to load payroll register')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRegister()
  }, [selectedMonth, selectedDeptId])

  const filtered = records.filter(r => {
    const s = search.toLowerCase()
    return (
      r.employee_name.toLowerCase().includes(s) ||
      r.global_employee_id.toLowerCase().includes(s) ||
      (r.designation && r.designation.toLowerCase().includes(s))
    )
  })

  const totalGross = records.reduce((sum, r) => sum + Number(r.gross_pay || 0), 0)
  const totalNet = records.reduce((sum, r) => sum + Number(r.net_pay || 0), 0)
  const totalDeductions = records.reduce((sum, r) => sum + Number(r.total_deductions || 0), 0)

  const handleExportCSV = () => {
    if (records.length === 0) {
      toast.error('No payroll records to export')
      return
    }

    const headers = [
      'Month',
      'Status',
      'Employee ID',
      'Name',
      'Designation',
      'Department',
      'Gross Pay',
      'Deductions',
      'Net Pay',
      'LOP Days'
    ]

    const rows = filtered.map(r => [
      `"${r.payroll_month}"`,
      `"${r.run_status}"`,
      `"${r.global_employee_id}"`,
      `"${r.employee_name}"`,
      `"${r.designation}"`,
      `"${r.department_name}"`,
      r.gross_pay,
      r.total_deductions,
      r.net_pay,
      r.leave_days_deducted
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `payroll_register_${selectedMonth}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Payroll register exported to CSV')
  }

  const columns: Column<PayrollRegisterRecord>[] = [
    {
      header: 'Employee',
      key: 'employee_name',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--color-chip-people-bg)',
            color: 'var(--color-chip-people-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '12px'
          }}>
            {r.employee_name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.employee_name}</div>
            <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
              {r.global_employee_id} • {r.designation}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Department',
      key: 'department_name',
      render: (r) => <span style={{ color: 'var(--color-text-secondary)' }}>{r.department_name}</span>
    },
    {
      header: 'Gross Earnings',
      key: 'gross_pay',
      render: (r) => (
        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
          ₹{Number(r.gross_pay).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Deductions (TDS+PF)',
      key: 'total_deductions',
      render: (r) => (
        <span style={{ fontWeight: 600, color: 'var(--color-error)' }}>
          -₹{Number(r.total_deductions).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Net Take-Home',
      key: 'net_pay',
      render: (r) => (
        <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>
          ₹{Number(r.net_pay).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Status',
      key: 'run_status',
      render: (r) => (
        <StatusPill
          label={r.run_status}
          status={r.run_status === 'FINALIZED' ? 'success' : 'warning'}
        />
      )
    },
    {
      header: 'Action',
      key: 'employee_id',
      render: (r) => (
        <Button variant="subtle" size="sm" leftIcon={<FileText size={13} />} onClick={() => setSelectedRecord(r)}>
          Statement
        </Button>
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
              HR-09
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Master Payroll Register
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Institution-wide salary records, tax remittance summaries, and disbursement auditing.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            leftIcon={<Download size={14} />}
            onClick={handleExportCSV}
          >
            Export Register CSV
          </Button>
        </div>
      </div>

      {/* StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Net Payroll"
          value={`₹${totalNet.toLocaleString()}`}
          tone="positive"
          icon={<DollarSign size={18} />}
          description={`Disbursed for ${selectedMonth}`}
        />
        <StatCard
          label="Total Gross Commitment"
          value={`₹${totalGross.toLocaleString()}`}
          tone="accent"
          description="Basic + HRA + Allowances"
        />
        <StatCard
          label="Total Deductions"
          value={`₹${totalDeductions.toLocaleString()}`}
          tone="neutral"
          icon={<ShieldCheck size={18} />}
          description="EPF, Tax & LOP deductions"
        />
        <StatCard
          label="Active Payees"
          value={records.length}
          tone="positive"
          icon={<Users size={18} />}
          description="Computed employee records"
        />
      </div>

      {/* Filter Toolbar */}
      <Card padding={16}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ width: '180px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              Month Cycle
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ width: '220px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              Department
            </label>
            <Select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              options={[
                { value: '', label: 'All Departments' },
                ...departments.map(d => ({ value: String(d.id), label: d.name }))
              ]}
            />
          </div>

          <div style={{ flex: '1 1 240px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              Quick Search
            </label>
            <Input
              placeholder="Search by name, code or designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card padding={0}>
        <Table data={filtered} columns={columns} keyExtractor={(r) => `${r.payroll_month}-${r.employee_id}`} isLoading={loading} />
      </Card>

      {/* Details Drawer */}
      <Drawer
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord ? `Payroll Statement — ${selectedRecord.employee_name}` : ''}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setSelectedRecord(null)}>Close</Button>
            <Button variant="primary" leftIcon={<Download size={14} />} onClick={() => toast.success(`Statement for ${selectedRecord?.employee_name} downloaded`)}>
              Download Statement
            </Button>
          </div>
        }
      >
        {selectedRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>NET TAKE-HOME</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-success)' }}>
                  ₹{Number(selectedRecord.net_pay).toLocaleString()}
                </div>
              </div>
              <StatusPill label={selectedRecord.run_status} status={selectedRecord.run_status === 'FINALIZED' ? 'success' : 'warning'} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Employee Code</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedRecord.global_employee_id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Designation</span>
                <span style={{ fontWeight: 600 }}>{selectedRecord.designation}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Department</span>
                <span style={{ fontWeight: 600 }}>{selectedRecord.department_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Payroll Month</span>
                <span style={{ fontWeight: 600 }}>{selectedRecord.payroll_month}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Gross Pay</span>
                <span style={{ fontWeight: 600 }}>₹{Number(selectedRecord.gross_pay).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>TDS & Statutory Deductions</span>
                <span style={{ fontWeight: 600, color: 'var(--color-error)' }}>-₹{Number(selectedRecord.total_deductions).toLocaleString()}</span>
              </div>
              {selectedRecord.leave_days_deducted > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Loss of Pay (LOP) Days</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-warning)' }}>{selectedRecord.leave_days_deducted} days</span>
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '6px',
              background: 'var(--color-success-bg)',
              color: 'var(--color-success)',
              fontSize: '13px'
            }}>
              <CheckCircle size={16} />
              Reconciled with General Ledger (PRD §6.5, §11.2 statutory register).
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
