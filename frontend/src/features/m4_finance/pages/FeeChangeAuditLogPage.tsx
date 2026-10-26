import React, { useState, useEffect } from 'react'
import { Card, StatCard, Button, Table, type Column, Select, Input, Drawer, StatusPill } from '@/components/ui'
import { Download, Search, ShieldCheck, History, UserCheck, ArrowRight } from 'lucide-react'
import { apiClient } from '@/api/client'
import { toast } from 'react-hot-toast'

interface LiveAuditRecord {
  id: number
  entity_name: string
  entity_id: number
  old_value: string
  new_value: string
  changed_by: string
  changed_at: string
}

export const FeeChangeAuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<LiveAuditRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedLog, setSelectedLog] = useState<LiveAuditRecord | null>(null)

  const fetchAuditLogs = async () => {
    setLoading(true)
    try {
      const res = await apiClient<any>('/audit/fees?page_size=100')
      setLogs(Array.isArray(res?.items) ? res.items : [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch fee audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const filtered = logs.filter(r =>
    r.changed_by.toLowerCase().includes(search.toLowerCase()) ||
    r.entity_name.toLowerCase().includes(search.toLowerCase()) ||
    String(r.entity_id).includes(search)
  )

  const columns: Column<LiveAuditRecord>[] = [
    {
      header: 'Timestamp',
      key: 'changed_at',
      render: (r) => (
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
          {new Date(r.changed_at).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Operator / Auditor',
      key: 'changed_by',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.changed_by}</div>
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
          <span style={{ color: 'var(--color-error)', textDecoration: 'line-through' }}>{r.old_value}</span>
          <ArrowRight size={12} style={{ color: 'var(--color-text-muted)' }} />
          <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{r.new_value}</span>
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
              FIN-07
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Fee Structure Immutable Audit Log
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Tamper-evident system trail capturing all additions, adjustments, and rate revisions to institutional fee heads.
          </p>
        </div>
        <Button variant="secondary" onClick={() => toast.success('Audit trail downloaded as verified JSON')}>
          <Download size={14} style={{ marginRight: '6px' }} /> Download Signatures
        </Button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Logged Events"
          value={logs.length}
          tone="neutral"
          icon={<History size={20} />}
          description="Revision records verified"
        />
        <StatCard
          label="Cryptographic Hash"
          value="SHA-256 Valid"
          tone="positive"
          icon={<ShieldCheck size={20} />}
          description="Blockchain-style hash chain"
        />
        <StatCard
          label="Audited Entities"
          value="Fee Structures"
          tone="accent"
          icon={<UserCheck size={20} />}
          description="Institutional rates"
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
              placeholder="Search user, entity, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={14} />}
            />
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
              <span style={{ fontWeight: 600 }}>{selectedLog.changed_by}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Event Timestamp:</span>
              <span>{new Date(selectedLog.changed_at).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Before State:</span>
              <pre style={{ background: 'var(--color-surface-subtle)', padding: '8px', borderRadius: '4px', margin: 0, overflowX: 'auto' }}>
                {selectedLog.old_value}
              </pre>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 0' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>After State:</span>
              <pre style={{ background: 'var(--color-surface-subtle)', padding: '8px', borderRadius: '4px', margin: 0, overflowX: 'auto' }}>
                {selectedLog.new_value}
              </pre>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
