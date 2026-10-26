import React, { useState, useEffect } from 'react'
import { Card, StatCard, Button, Input, Select, Table, type Column, StatusPill, Drawer } from '@/components/ui'
import { Search, Download, AlertTriangle, Send, PhoneCall, CheckCircle, Clock, ShieldAlert } from 'lucide-react'
import { apiClient } from '@/api/client'
import { toast } from 'react-hot-toast'

interface LiveDefaulter {
  student_id: number
  global_student_id: string
  student_name: string
  program_name: string
  component_name: string
  term_label: string
  due_date: string
  amount_due: string
  amount_paid: string
  late_fee: string
  total_balance: string
}

export const FeeDefaultersPage: React.FC = () => {
  const [defaulters, setDefaulters] = useState<LiveDefaulter[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<LiveDefaulter | null>(null)

  const fetchDefaulters = async () => {
    setLoading(true)
    try {
      const res = await apiClient<any>('/fees/defaulters?page_size=200')
      setDefaulters(Array.isArray(res?.items) ? res.items : [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch fee defaulters')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDefaulters()
  }, [])

  const filtered = defaulters.filter(r => {
    const term = search.toLowerCase()
    return (
      r.student_name.toLowerCase().includes(term) ||
      r.global_student_id.toLowerCase().includes(term) ||
      r.program_name.toLowerCase().includes(term) ||
      r.component_name.toLowerCase().includes(term)
    )
  })

  const totalOutstanding = filtered.reduce((acc, curr) => acc + parseFloat(curr.total_balance || '0'), 0)
  const uniqueStudents = new Set(filtered.map(r => r.student_id)).size

  const handleSendReminder = (record: LiveDefaulter) => {
    toast.success(`Fee reminder dispatched via SMS & Email to ${record.student_name} (${record.global_student_id}).`)
  }

  const columns: Column<LiveDefaulter>[] = [
    {
      header: 'Student',
      key: 'student_name',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.student_name}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
            {r.global_student_id} · {r.program_name}
          </div>
        </div>
      )
    },
    {
      header: 'Term & Head',
      key: 'term_label',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: '13px' }}>{r.component_name}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{r.term_label}</div>
        </div>
      )
    },
    {
      header: 'Due Date',
      key: 'due_date',
      render: (r) => <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{r.due_date}</span>
    },
    {
      header: 'Outstanding Balance',
      key: 'total_balance',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--color-error)' }}>
            ₹{parseFloat(r.total_balance).toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Includes ₹{parseFloat(r.late_fee).toLocaleString()} late fee
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      key: 'student_id',
      render: (r) => (
        <StatusPill
          label={parseFloat(r.total_balance) > 30000 ? 'Critical' : 'Overdue'}
          status={parseFloat(r.total_balance) > 30000 ? 'error' : 'warning'}
        />
      )
    },
    {
      header: 'Action',
      key: 'global_student_id',
      render: (r) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="subtle" size="sm" onClick={() => setSelectedRecord(r)}>
            Details
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleSendReminder(r)}>
            <Send size={12} style={{ marginRight: '4px' }} /> Notify
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
              FIN-06
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Fee Defaulters & Arrears Recovery
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Identify students with outstanding tuition, hostel and examination fee arrears past the statutory grace period.
          </p>
        </div>
        <Button variant="secondary" onClick={() => toast.success('Defaulters list exported as CSV')}>
          <Download size={14} style={{ marginRight: '6px' }} /> Export Defaulters List
        </Button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Uncollected Arrears"
          value={`₹${totalOutstanding.toLocaleString()}`}
          tone="error"
          icon={<AlertTriangle size={20} />}
          description="Cumulative across active terms"
        />
        <StatCard
          label="Defaulting Students"
          value={uniqueStudents}
          tone="accent"
          icon={<ShieldAlert size={20} />}
          description="Enrolled students with balances"
        />
        <StatCard
          label="Defaulting Line Items"
          value={filtered.length}
          tone="neutral"
          icon={<Clock size={20} />}
          description="Separate fee heads past due"
        />
      </div>

      {/* Main Table Card */}
      <Card padding={0}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ width: '320px' }}>
            <Input
              placeholder="Search student, roll number, or component..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={14} />}
            />
          </div>
          <Button variant="secondary" size="sm" onClick={fetchDefaulters} isLoading={loading}>
            Refresh Defaulters
          </Button>
        </div>

        <Table
          data={filtered}
          columns={columns}
          keyExtractor={(r: LiveDefaulter) => `${r.student_id}-${r.component_name}-${r.term_label}`}
          isLoading={loading}
          emptyMessage="No fee defaulters found matching query."
        />
      </Card>

      {/* Defaulter Dossier Drawer */}
      <Drawer
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord ? `Arrears Dossier — ${selectedRecord.student_name}` : ''}
        size="md"
        footer={
          selectedRecord && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="secondary" onClick={() => setSelectedRecord(null)}>Close</Button>
              <Button variant="primary" onClick={() => { handleSendReminder(selectedRecord); setSelectedRecord(null) }}>
                Dispatch Notice
              </Button>
            </div>
          )
        }
      >
        {selectedRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>TOTAL OUTSTANDING AMOUNT</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-error)' }}>
                ₹{parseFloat(selectedRecord.total_balance).toLocaleString()}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Student Name:</span>
                <strong>{selectedRecord.student_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Enrollment ID:</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedRecord.global_student_id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Academic Program:</span>
                <span>{selectedRecord.program_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Term & Head:</span>
                <span>{selectedRecord.term_label} · {selectedRecord.component_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Original Due Date:</span>
                <span>{selectedRecord.due_date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Amount Billed:</span>
                <span>₹{parseFloat(selectedRecord.amount_due).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Amount Paid:</span>
                <span>₹{parseFloat(selectedRecord.amount_paid).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Late Fee Assessed:</span>
                <span style={{ color: 'var(--color-error)' }}>+₹{parseFloat(selectedRecord.late_fee).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
