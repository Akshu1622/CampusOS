import React, { useState } from 'react'
import { Card, StatCard, Button, Table, type Column, Input, Select, StatusPill, Drawer } from '@/components/ui'
import { Download, Search, Users, DollarSign, ShieldCheck, FileText, CheckCircle } from 'lucide-react'

interface PayrollRecord {
  id: string
  employee: string
  code: string
  department: string
  gross: number
  deductions: number
  net: number
  status: 'Finalized' | 'Pending Bank Release'
}

const mockRecords: PayrollRecord[] = [
  { id: '1', employee: 'Dr. Ramesh Kumar', code: 'EMP-1001', department: 'Computer Science', gross: 175000, deductions: 28000, net: 147000, status: 'Finalized' },
  { id: '2', employee: 'Prof. Sunita Rao', code: 'EMP-1002', department: 'Electrical Engineering', gross: 160000, deductions: 25000, net: 135000, status: 'Finalized' },
  { id: '3', employee: 'Dr. Vikram Joshi', code: 'EMP-1003', department: 'Mechanical Engineering', gross: 155000, deductions: 24000, net: 131000, status: 'Finalized' },
  { id: '4', employee: 'Neha Gupta', code: 'EMP-1004', department: 'Civil Engineering', gross: 120000, deductions: 18000, net: 102000, status: 'Finalized' },
  { id: '5', employee: 'Alok Nath', code: 'EMP-1005', department: 'Administration', gross: 85000, deductions: 11000, net: 74000, status: 'Finalized' },
]

export const PayrollRegisterPage: React.FC = () => {
  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null)

  const filtered = mockRecords.filter(r => {
    const matchSearch = r.employee.toLowerCase().includes(search.toLowerCase()) ||
                        r.code.toLowerCase().includes(search.toLowerCase())
    const matchDept = selectedDept ? r.department.includes(selectedDept) : true
    return matchSearch && matchDept
  })

  const totalGross = mockRecords.reduce((sum, r) => sum + r.gross, 0)
  const totalNet = mockRecords.reduce((sum, r) => sum + r.net, 0)
  const totalDeductions = mockRecords.reduce((sum, r) => sum + r.deductions, 0)

  const columns: Column<PayrollRecord>[] = [
    {
      header: 'Employee',
      key: 'employee',
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
            {r.employee.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.employee}</div>
            <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{r.code}</div>
          </div>
        </div>
      )
    },
    { header: 'Department', key: 'department', render: (r) => <span style={{ color: 'var(--color-text-secondary)' }}>{r.department}</span> },
    {
      header: 'Gross Earnings',
      key: 'gross',
      render: (r) => (
        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
          ₹{r.gross.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Deductions (TDS+PF)',
      key: 'deductions',
      render: (r) => (
        <span style={{ fontWeight: 600, color: 'var(--color-error)' }}>
          ₹{r.deductions.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Net Take-Home',
      key: 'net',
      render: (r) => (
        <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>
          ₹{r.net.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (r) => (
        <StatusPill
          label={r.status}
          status={r.status === 'Finalized' ? 'success' : 'warning'}
        />
      )
    },
    {
      header: 'Action',
      key: 'id',
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
            onClick={() => alert('Exporting Master Payroll Register to Excel...')}
          >
            Export Register
          </Button>
        </div>
      </div>

      {/* StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Net Payroll"
          value={`₹${(totalNet / 100000).toFixed(2)}L`}
          tone="positive"
          icon={<DollarSign size={18} />}
          description="Disbursed to staff bank accounts"
        />
        <StatCard
          label="Total Gross Commitment"
          value={`₹${(totalGross / 100000).toFixed(2)}L`}
          tone="accent"
          description="Basic + HRA + Allowances"
        />
        <StatCard
          label="Total Statutory Remittance"
          value={`₹${(totalDeductions / 100000).toFixed(2)}L`}
          tone="neutral"
          icon={<ShieldCheck size={18} />}
          description="EPF & IT department tax"
        />
        <StatCard
          label="Active Payees"
          
          value={mockRecords.length}
          tone="positive"
          icon={<Users size={18} />}
          description="100% direct deposit success"
        />
      </div>

      {/* Filter Toolbar */}
      <Card padding={16}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px' }}>
            <Input
              placeholder="Search by employee name or code..."
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
                { value: 'Computer Science', label: 'Computer Science' },
                { value: 'Electrical Engineering', label: 'Electrical Engineering' },
                { value: 'Mechanical Engineering', label: 'Mechanical Engineering' },
                { value: 'Civil Engineering', label: 'Civil Engineering' },
                { value: 'Administration', label: 'Administration' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card padding={0}>
        <Table data={filtered} columns={columns} keyExtractor={(r) => r.id} />
      </Card>

      {/* Details Drawer */}
      <Drawer
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord ? `Payroll Statement — ${selectedRecord.employee}` : ''}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setSelectedRecord(null)}>Close</Button>
            <Button variant="primary" leftIcon={<Download size={14} />} onClick={() => alert('Downloading PDF')}>
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
                  ₹{selectedRecord.net.toLocaleString()}
                </div>
              </div>
              <StatusPill label={selectedRecord.status} status="success" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Employee Code</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedRecord.code}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Department</span>
                <span style={{ fontWeight: 600 }}>{selectedRecord.department}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Gross Pay</span>
                <span style={{ fontWeight: 600 }}>₹{selectedRecord.gross.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>TDS & Provident Fund</span>
                <span style={{ fontWeight: 600, color: 'var(--color-error)' }}>₹{selectedRecord.deductions.toLocaleString()}</span>
              </div>
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
              Reconciled with General Ledger Account #GL-4011 (Faculty Compensation).
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
