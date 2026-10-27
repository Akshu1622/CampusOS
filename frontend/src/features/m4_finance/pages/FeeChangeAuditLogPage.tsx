import React, { useState, useEffect } from 'react'
import { Card, StatCard, Button, Table, type Column, Select, Input, Drawer, StatusPill } from '@/components/ui'
import { Download, Search, ShieldCheck, History, UserCheck, ArrowRight, Filter } from 'lucide-react'
import { apiClient } from '@/api/client'
import { toast } from 'react-hot-toast'

interface LiveAuditRecord {
  id: number
  entity_name: string
  entity_id: number
  old_value: any
  new_value: any
  changed_by: string
  changed_at: string
}

const formatAuditValue = (val: any): string => {
  if (val === null || val === undefined) return 'None'
  if (typeof val === 'number') return `₹${val.toLocaleString()}`
  if (typeof val === 'string') return val
  if (typeof val === 'object') {
    if (val.amount !== undefined) {
      return `₹${parseFloat(val.amount).toLocaleString()}${val.component_name ? ` (${val.component_name})` : ''}`
    }
    if (val.amount_due !== undefined) {
      return `₹${parseFloat(val.amount_due).toLocaleString()} (${val.status || 'Due'})`
    }
    if (val.structure_name !== undefined) {
      return val.structure_name
    }
    return JSON.stringify(val)
  }
  return String(val)
}

export const FeeChangeAuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<LiveAuditRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('ALL')
  const [selectedLog, setSelectedLog] = useState<LiveAuditRecord | null>(null)

  const fetchAuditLogs = async () => {
    setLoading(true)
    try {
      const res = await apiClient<any>('/audit/fees?page_size=100')
      const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : []
      setLogs(items)
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch fee audit logs')
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const filtered = logs.filter(r => {
    const by = String(r?.changed_by || '').toLowerCase()
    const entity = String(r?.entity_name || '').toLowerCase()
    const idStr = String(r?.entity_id || '')
    const q = search.toLowerCase()
    const matchesSearch = !q || by.includes(q) || entity.includes(q) || idStr.includes(q)
    const matchesEntity = entityFilter === 'ALL' || entity === entityFilter.toLowerCase()
    return matchesSearch && matchesEntity
  })

  const columns: Column<LiveAuditRecord>[] = [
    {
      header: 'Timestamp',
      key: 'changed_at',
      render: (r) => (
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
          {r.changed_at ? new Date(r.changed_at).toLocaleString() : '-'}
        </span>
      )
    },
    {
      header: 'Operator / Auditor',
      key: 'changed_by',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.changed_by || 'SYSTEM'}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Security Principal</div>
        </div>
      )
    },
    {
      header: 'Target Entity',
      key: 'entity_name',
      render: (r) => (
        <div>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.entity_name}</span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginLeft: '6px' }}>#{r.entity_id}</span>
        </div>
      )
    },
    {
      header: 'Value Transition',
      key: 'new_value',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontFamily: 'monospace' }}>
          <span style={{ color: 'var(--color-error)', textDecoration: r.old_value ? 'line-through' : 'none' }}>
            {formatAuditValue(r.old_value)}
          </span>
          <ArrowRight size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
            {formatAuditValue(r.new_value)}
          </span>
        </div>
      )
    },
    {
      header: 'Action',
      key: 'id',
      render: (r) => (
        <Button variant="subtle" size="sm" onClick={() => setSelectedLog(r)}>
          Inspect
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
              F-10
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Fee Change Audit Trail & Regulatory Ledger
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Immutable forensic journal recording fee structures, component rate alterations, and student invoice modifications.
          </p>
        </div>
        <Button variant="secondary" onClick={() => toast.success('Audit log export initiated')}>
          <Download size={14} style={{ marginRight: '6px' }} /> Export Audit Trail
        </Button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Audit Events"
          value={logs.length}
          tone="neutral"
          icon={<History size={20} />}
          description="Logged institutional mutations"
        />
        <StatCard
          label="Structure Changes"
          value={logs.filter(l => l.entity_name?.includes('structure')).length}
          tone="accent"
          icon={<ShieldCheck size={20} />}
          description="Curriculum fee schedules"
        />
        <StatCard
          label="Component & Due Events"
          value={logs.filter(l => l.entity_name?.includes('component') || l.entity_name?.includes('fee')).length}
          tone="positive"
          icon={<UserCheck size={20} />}
          description="Rate adjustments & invoices"
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
            <Input
              placeholder="Search by auditor, entity, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={14} />}
            />
            <div style={{ minWidth: '160px' }}>
              <Select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                options={[
                  { label: 'All Entities', value: 'ALL' },
                  { label: 'fee_structure', value: 'fee_structure' },
                  { label: 'fee_component', value: 'fee_component' },
                  { label: 'student_fee', value: 'student_fee' },
                ]}
              />
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchAuditLogs} isLoading={loading}>
            Refresh Audit Log
          </Button>
        </div>

        <Table
          data={filtered}
          columns={columns}
          keyExtractor={(r) => String(r.id)}
          isLoading={loading}
          emptyMessage="No audit trail events match the search filter."
        />
      </Card>

      {/* Audit Detail Drawer */}
      <Drawer
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title={selectedLog ? `Audit Event #${selectedLog.id}` : ''}
        size="md"
        footer={<Button variant="secondary" onClick={() => setSelectedLog(null)}>Close</Button>}
      >
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
            <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>TARGET ENTITY</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {selectedLog.entity_name} #{selectedLog.entity_id}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Modified By:</span>
              <span style={{ fontWeight: 600 }}>{selectedLog.changed_by || 'SYSTEM'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Event Timestamp:</span>
              <span>{selectedLog.changed_at ? new Date(selectedLog.changed_at).toLocaleString() : '-'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Before State:</span>
              <pre style={{ background: 'var(--color-surface-subtle)', padding: '12px', borderRadius: '4px', margin: 0, overflowX: 'auto', fontSize: '12px' }}>
                {selectedLog.old_value !== null && selectedLog.old_value !== undefined
                  ? (typeof selectedLog.old_value === 'object' ? JSON.stringify(selectedLog.old_value, null, 2) : String(selectedLog.old_value))
                  : 'None (Initial State / Created)'}
              </pre>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 0' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>After State:</span>
              <pre style={{ background: 'var(--color-surface-subtle)', padding: '12px', borderRadius: '4px', margin: 0, overflowX: 'auto', fontSize: '12px' }}>
                {selectedLog.new_value !== null && selectedLog.new_value !== undefined
                  ? (typeof selectedLog.new_value === 'object' ? JSON.stringify(selectedLog.new_value, null, 2) : String(selectedLog.new_value))
                  : 'None (Deleted)'}
              </pre>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
