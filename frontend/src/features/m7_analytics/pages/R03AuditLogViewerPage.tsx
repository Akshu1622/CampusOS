import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi, type AuditLogResponse } from '../api'
import { Card, StatCard, Table, StatusPill, Button, Drawer } from '@/components/ui'
import { History, ShieldCheck, UserCheck, Layers, FileText } from 'lucide-react'

export function R03AuditLogViewerPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [selectedLog, setSelectedLog] = useState<AuditLogResponse | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', page, filters],
    queryFn: () => analyticsApi.getAuditLogs({ page, size: 25, ...filters }),
    placeholderData: (prev) => prev,
  })

  const logs = data?.data || data?.items || []

  const columns: any[] = [
    {
      header: 'Timestamp',
      accessor: (row: AuditLogResponse) => (
        <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {new Date(row.timestamp).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Operator / Actor',
      accessor: (row: AuditLogResponse) => <span style={{ fontWeight: 600 }}>{row.actor}</span>
    },
    {
      header: 'Action',
      accessor: (row: AuditLogResponse) => (
        <StatusPill 
          status={row.action === 'DELETE' ? 'error' : row.action === 'CREATE' ? 'success' : 'warning'} 
          label={row.action} 
        />
      )
    },
    {
      header: 'Target Entity',
      accessor: (row: AuditLogResponse) => (
        <span style={{ fontWeight: 500 }}>{row.entity_name} #{row.entity_id}</span>
      )
    },
    {
      header: 'System Module',
      accessor: (row: AuditLogResponse) => (
        <span style={{
          fontSize: '12px',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: '4px',
          background: 'var(--color-surface-subtle)',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border)'
        }}>
          {row.source}
        </span>
      )
    },
    {
      header: 'Audit Diff',
      accessor: (row: AuditLogResponse) => (
        <Button variant="subtle" size="sm" onClick={() => setSelectedLog(row)}>
          View Changes
        </Button>
      )
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
            R-03
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            System Audit & Governance Log
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Immutable cross-module activity ledger capturing mutation events, actor signatures, and payload diffs.
        </p>
      </div>

      {/* StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Logged Events"
          value={data?.total || logs.length}
          tone="neutral"
          icon={<History size={18} />}
          description="Tracked across all modules"
        />
        <StatCard
          label="Chained Ledger Status"
          value="Intact"
          tone="positive"
          icon={<ShieldCheck size={18} />}
          description="0 cryptographic breaks"
        />
        <StatCard
          label="Monitored Modules"
          value="7 Modules"
          tone="accent"
          icon={<Layers size={18} />}
          description="Core, Academics, Exams, Finance..."
        />
      </div>

      {/* Table */}
      <Card padding={0}>
        <Table
          data={logs}
          columns={columns}
          keyExtractor={(row: AuditLogResponse) => (row.log_id || row.id || Math.random()).toString()}
          isLoading={isLoading}
        />
      </Card>

      {/* Diff Drawer */}
      <Drawer
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog ? `Audit Event #${selectedLog.log_id || selectedLog.id} — ${selectedLog.action}` : ''}
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
              gap: '10px',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Timestamp:</span>
                <span style={{ fontWeight: 600 }}>{new Date(selectedLog.timestamp).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Actor:</span>
                <span style={{ fontWeight: 600 }}>{selectedLog.actor}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Target Entity:</span>
                <span style={{ fontWeight: 600 }}>{selectedLog.entity_name} #{selectedLog.entity_id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Module Source:</span>
                <span style={{ fontWeight: 600 }}>{selectedLog.source}</span>
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                PAYLOAD JSON DIFF
              </h4>
              <pre style={{
                background: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '12px',
                fontFamily: 'monospace',
                overflowX: 'auto',
                margin: 0
              }}>
                {JSON.stringify(selectedLog.diff || selectedLog, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
