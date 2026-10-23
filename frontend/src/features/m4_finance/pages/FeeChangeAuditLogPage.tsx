import React, { useState } from 'react'
import { Card, StatCard, Button, Table, type Column, Select, Input, Drawer, StatusPill } from '@/components/ui'
import { Download, Search, ShieldCheck, History, UserCheck, ArrowRight } from 'lucide-react'

interface AuditRecord {
  id: string
  timestamp: string
  user: string
  role: string
  entity: string
  field: string
  oldValue: string
  newValue: string
  context: string
  ipAddress: string
}

const mockAuditLogs: AuditRecord[] = [
  { id: '1', timestamp: '2026-10-21 14:32:01', user: 'Finance Administrator', role: 'FINANCE_ADMIN', entity: 'Tuition Fee (Fall 26)', field: 'Amount', oldValue: '₹45,000', newValue: '₹50,000', context: 'Syndicate Council Resolution #88/B', ipAddress: '10.0.4.12' },
  { id: '2', timestamp: '2026-10-18 10:15:44', user: 'Registrar Accounts', role: 'FINANCE_OFFICER', entity: 'Late Fee Policy', field: 'GraceDays', oldValue: '3 Days', newValue: '5 Days', context: 'Extended due to festival holiday calendar', ipAddress: '10.0.4.15' },
  { id: '3', timestamp: '2026-10-15 09:00:22', user: 'System Bursar', role: 'SUPER_ADMIN', entity: 'Hostel Maintenance Head', field: 'Status', oldValue: 'INACTIVE', newValue: 'ACTIVE', context: 'Inauguration of New Diamond Hostel Block', ipAddress: '10.0.1.2' },
]

export const FeeChangeAuditLogPage: React.FC = () => {
  const [search, setSearch] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditRecord | null>(null)

  const filtered = mockAuditLogs.filter(r =>
    r.user.toLowerCase().includes(search.toLowerCase()) ||
    r.entity.toLowerCase().includes(search.toLowerCase()) ||
    r.field.toLowerCase().includes(search.toLowerCase()) ||
    r.context.toLowerCase().includes(search.toLowerCase())
  )

  const columns: Column<AuditRecord>[] = [
    {
      header: 'Timestamp',
      key: 'timestamp',
      render: (r) => (
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
          {r.timestamp}
        </span>
      )
    },
    {
      header: 'Operator',
      key: 'user',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.user}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{r.role}</div>
        </div>
      )
    },
    {
      header: 'Configuration Target',
      key: 'entity',
      render: (r) => <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{r.entity}</span>
    },
    {
      header: 'Parameter Changed',
      key: 'field',
      render: (r) => (
        <span style={{
          padding: '2px 8px',
          borderRadius: '4px',
          background: 'var(--color-surface-subtle)',
          fontSize: '12px',
          fontWeight: 600,
          border: '1px solid var(--color-border)'
        }}>
          {r.field}
        </span>
      )
    },
    {
      header: 'Delta (Before → After)',
      key: 'oldValue',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <span style={{
            textDecoration: 'line-through',
            color: 'var(--color-error)',
            background: 'var(--color-error-bg)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {r.oldValue}
          </span>
          <span style={{ color: 'var(--color-text-muted)' }}>→</span>
          <span style={{
            fontWeight: 700,
            color: 'var(--color-success)',
            background: 'var(--color-success-bg)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {r.newValue}
          </span>
        </div>
      )
    },
    {
      header: 'Justification Reason',
      key: 'context',
      render: (r) => <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{r.context}</span>
    },
    {
      header: 'Action',
      key: 'id',
      render: (r) => (
        <Button variant="subtle" size="sm" onClick={() => setSelectedLog(r)}>
          Audit Info
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
              FIN-08
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Fee Configuration Audit Trail
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Immutable, cryptographically chained audit record of all financial rate updates and regulatory alterations.
          </p>
        </div>
        <Button
          variant="secondary"
          leftIcon={<Download size={14} />}
          onClick={() => alert('Exporting full audit trail...')}
        >
          Export Compliance Log
        </Button>
      </div>

      {/* StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Logged Changes"
          value={mockAuditLogs.length}
          tone="neutral"
          icon={<History size={18} />}
          description="Across all fee heads"
        />
        <StatCard
          label="Chained Ledger Integrity"
          value="100%"
          tone="positive"
          icon={<ShieldCheck size={18} />}
          description="0 tampering events detected"
        />
        <StatCard
          label="Authorized Operators"
          value="3"
          tone="accent"
          icon={<UserCheck size={18} />}
          description="Role-gated finance admins"
        />
      </div>

      {/* Filter Toolbar */}
      <Card padding={16}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px' }}>
            <Input
              placeholder="Search audit trail by operator, parameter, or council resolution..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card padding={0}>
        <Table data={filtered} columns={columns} keyExtractor={(r) => r.id} />
      </Card>

      {/* Drawer */}
      <Drawer
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog ? `Audit Record #${selectedLog.id}` : ''}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setSelectedLog(null)}>Close</Button>
          </div>
        }
      >
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Event Timestamp</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedLog.timestamp}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Operator Name</span>
                <span style={{ fontWeight: 600 }}>{selectedLog.user}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Assigned Role</span>
                <span style={{ fontWeight: 600 }}>{selectedLog.role}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Origin IP Address</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedLog.ipAddress}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Target Entity</span>
                <span style={{ fontWeight: 600 }}>{selectedLog.entity}</span>
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                REGULATORY JUSTIFICATION NOTE
              </h4>
              <div style={{
                padding: '12px',
                borderRadius: '6px',
                background: 'var(--color-primary-subtle)',
                fontSize: '13px',
                color: 'var(--color-text-primary)'
              }}>
                {selectedLog.context}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
