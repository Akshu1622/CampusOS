import React, { useState } from 'react'
import { Card, StatCard, Button, Input, Select, Table, type Column, StatusPill, Drawer } from '@/components/ui'
import { Search, Download, AlertTriangle, Send, PhoneCall, CheckCircle, Clock, ShieldAlert } from 'lucide-react'

interface DefaulterRecord {
  id: string
  rollNumber: string
  student: string
  program: string
  term: string
  outstanding: number
  overdueDays: number
  lateFee: number
  lastContact: string
  status: 'Critical' | 'Warning' | 'Notice Sent'
}

const mockDefaulters: DefaulterRecord[] = [
  { id: '1', rollNumber: 'CS2023-042', student: 'Aarav Sharma', program: 'B.Tech CS', term: 'Fall 2026', outstanding: 52500, overdueDays: 34, lateFee: 1700, lastContact: '2026-10-18', status: 'Critical' },
  { id: '2', rollNumber: 'EE2023-018', student: 'Priya Patel', program: 'B.Tech EE', term: 'Fall 2026', outstanding: 45000, overdueDays: 22, lateFee: 1100, lastContact: '2026-10-19', status: 'Warning' },
  { id: '3', rollNumber: 'ME2024-009', student: 'Rohan Mehta', program: 'B.Tech ME', term: 'Fall 2026', outstanding: 60000, overdueDays: 45, lateFee: 2000, lastContact: '2026-10-15', status: 'Critical' },
  { id: '4', rollNumber: 'CE2024-031', student: 'Ananya Verma', program: 'B.Tech CE', term: 'Fall 2026', outstanding: 28000, overdueDays: 14, lateFee: 700, lastContact: '2026-10-21', status: 'Notice Sent' },
  { id: '5', rollNumber: 'CS2024-112', student: 'Kabir Das', program: 'B.Tech CS', term: 'Fall 2026', outstanding: 55000, overdueDays: 19, lateFee: 950, lastContact: '2026-10-20', status: 'Warning' },
]

export const FeeDefaultersPage: React.FC = () => {
  const [search, setSearch] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<DefaulterRecord | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  const filtered = mockDefaulters.filter(r => {
    const matchSearch = r.student.toLowerCase().includes(search.toLowerCase()) ||
                        r.rollNumber.toLowerCase().includes(search.toLowerCase())
    const matchProg = selectedProgram ? r.program.includes(selectedProgram) : true
    return matchSearch && matchProg
  })

  const totalOutstanding = mockDefaulters.reduce((acc, curr) => acc + curr.outstanding + curr.lateFee, 0)
  const criticalCount = mockDefaulters.filter(r => r.status === 'Critical').length
  const maxOverdue = Math.max(...mockDefaulters.map(r => r.overdueDays))

  const handleSendReminder = (record: DefaulterRecord) => {
    setActionNotice(`Fee reminder notification sent via SMS & Email to ${record.student} (${record.rollNumber}).`)
    setTimeout(() => setActionNotice(null), 4000)
  }

  const columns: Column<DefaulterRecord>[] = [
    {
      header: 'Student',
      key: 'student',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--color-chip-alerts-bg)',
            color: 'var(--color-chip-alerts-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '12px'
          }}>
            {r.student.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.student}</div>
            <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{r.rollNumber}</div>
          </div>
        </div>
      )
    },
    { header: 'Program', key: 'program', render: (r) => <span style={{ color: 'var(--color-text-secondary)' }}>{r.program}</span> },
    {
      header: 'Outstanding Dues',
      key: 'outstanding',
      render: (r) => (
        <div>
          <span style={{ fontWeight: 700, color: 'var(--color-error)' }}>
            ₹{(r.outstanding + r.lateFee).toLocaleString()}
          </span>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Base: ₹{r.outstanding.toLocaleString()} + Late: ₹{r.lateFee}
          </div>
        </div>
      )
    },
    {
      header: 'Overdue Days',
      key: 'overdueDays',
      render: (r) => (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: 600,
          color: r.overdueDays >= 30 ? 'var(--color-error)' : 'var(--color-warning)'
        }}>
          <Clock size={13} />
          {r.overdueDays} days
        </span>
      )
    },
    {
      header: 'Category',
      key: 'status',
      render: (r) => (
        <StatusPill
          label={r.status}
          status={r.status === 'Critical' ? 'error' : r.status === 'Warning' ? 'warning' : 'neutral'}
        />
      )
    },
    {
      header: 'Actions',
      key: 'id',
      render: (r) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleSendReminder(r)}
            leftIcon={<Send size={13} />}
          >
            Remind
          </Button>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => setSelectedRecord(r)}
          >
            Details
          </Button>
        </div>
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
              FIN-03
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Fee Defaulters & Overdue Tracking
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Real-time ledger of students with overdue fee invoices, automated late penalty tally, and notice dispatch.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            leftIcon={<Download size={14} />}
            onClick={() => alert('Exporting Defaulter Roster to CSV...')}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {actionNotice && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '6px',
          background: 'var(--color-success-bg)',
          color: 'var(--color-success)',
          border: '1px solid var(--color-success)',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={16} />
          {actionNotice}
        </div>
      )}

      {/* StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Defaulters"
          value={mockDefaulters.length}
          tone="critical"
          icon={<AlertTriangle size={18} />}
          description="Requires active follow-up"
        />
        <StatCard
          label="Total Overdue Amount"
          value={`₹${(totalOutstanding / 100000).toFixed(2)}L`}
          tone="critical"
          description="Principal + accrued late fees"
        />
        <StatCard
          label="Critical Cases (>30d)"
          value={criticalCount}
          tone="warning"
          icon={<ShieldAlert size={18} />}
          description="Eligible for exam debarment"
        />
        <StatCard
          label="Oldest Overdue"
          value={`${maxOverdue} Days`}
          tone="neutral"
          description="Academic Fall 2026 cycle"
        />
      </div>

      {/* Filter & Search Bar */}
      <Card padding={16}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px' }}>
            <Input
              placeholder="Search by student name or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
          <div style={{ width: '220px' }}>
            <Select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              options={[
                { value: '', label: 'All Programs' },
                { value: 'CS', label: 'B.Tech Computer Science' },
                { value: 'EE', label: 'B.Tech Electrical Engineering' },
                { value: 'ME', label: 'B.Tech Mechanical Engineering' },
                { value: 'CE', label: 'B.Tech Civil Engineering' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card padding={0}>
        <Table data={filtered} columns={columns} keyExtractor={(r) => r.id} />
      </Card>

      {/* Student Overdue Details Drawer */}
      <Drawer
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord ? `Defaulter Details — ${selectedRecord.student}` : ''}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setSelectedRecord(null)}>Close</Button>
            {selectedRecord && (
              <Button
                variant="primary"
                leftIcon={<Send size={14} />}
                onClick={() => {
                  handleSendReminder(selectedRecord)
                  setSelectedRecord(null)
                }}
              >
                Send Formal Demand Letter
              </Button>
            )}
          </div>
        }
      >
        {selectedRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'var(--color-error-bg)',
              border: '1px solid var(--color-error)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-error)', fontWeight: 600 }}>OUTSTANDING BALANCE</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-error)' }}>
                  ₹{(selectedRecord.outstanding + selectedRecord.lateFee).toLocaleString()}
                </div>
              </div>
              <StatusPill label={selectedRecord.status} status={selectedRecord.status === 'Critical' ? 'error' : 'warning'} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Breakdown</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Base Tuition & Amenities</span>
                <span style={{ fontWeight: 600 }}>₹{selectedRecord.outstanding.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Accumulated Late Surcharge</span>
                <span style={{ fontWeight: 600, color: 'var(--color-error)' }}>₹{selectedRecord.lateFee.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Days Overdue</span>
                <span style={{ fontWeight: 600 }}>{selectedRecord.overdueDays} Days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Last Contact Logged</span>
                <span style={{ fontWeight: 600 }}>{selectedRecord.lastContact}</span>
              </div>
            </div>

            <div style={{
              background: 'var(--color-surface-subtle)',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '13px',
              color: 'var(--color-text-secondary)'
            }}>
              <strong>Regulatory Policy Note:</strong> As per Academic Regulations Section 4.2, students with outstanding dues past 30 days are automatically placed on registration hold for subsequent term semester examinations.
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
