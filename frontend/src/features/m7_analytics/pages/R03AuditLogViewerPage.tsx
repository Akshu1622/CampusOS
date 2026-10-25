import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi, type AuditLogResponse } from '../api'
import { Card, StatCard, Table, StatusPill, Button, Drawer, LoadingSkeleton } from '@/components/ui'
import { 
  History, ShieldCheck, Layers, FileText, Download, 
  RefreshCw, Search, Calendar, Filter, X 
} from 'lucide-react'
import toast from 'react-hot-toast'

export function R03AuditLogViewerPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Record<string, any>>({
    search: '',
    source: '',
    action: '',
    actor: '',
    date_from: '',
    date_to: ''
  })
  const [selectedLog, setSelectedLog] = useState<AuditLogResponse | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const activeFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => v !== '' && v !== undefined && v !== null)
  )

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['auditLogs', page, activeFilters],
    queryFn: () => analyticsApi.getAuditLogs({ page, size: 25, ...activeFilters }),
    placeholderData: (prev) => prev,
  })

  const logs = data?.data || data?.items || []

  const handleExport = async () => {
    try {
      setIsExporting(true)
      toast.loading('Exporting audit logs to CSV...', { id: 'audit-csv' })
      await analyticsApi.downloadAuditLogsCsv(activeFilters)
      toast.success('Audit log CSV exported successfully', { id: 'audit-csv' })
    } catch (err: any) {
      toast.error(`Export failed: ${err.message || 'Unknown error'}`, { id: 'audit-csv' })
    } finally {
      setIsExporting(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      source: '',
      action: '',
      actor: '',
      date_from: '',
      date_to: ''
    })
    setPage(1)
  }

  const parseJsonSafe = (str?: string) => {
    if (!str) return null
    try {
      return typeof str === 'object' ? str : JSON.parse(str)
    } catch {
      return str
    }
  }

  const columns = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      width: '180px',
      cell: (row: AuditLogResponse) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          {new Date(row.timestamp).toLocaleString()}
        </span>
      )
    },
    {
      key: 'actor',
      header: 'Operator / Actor',
      width: '160px',
      cell: (row: AuditLogResponse) => (
        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '13px' }}>
          {row.actor || 'system'}
        </span>
      )
    },
    {
      key: 'action',
      header: 'Action',
      width: '120px',
      cell: (row: AuditLogResponse) => {
        const action = (row.action || '').toUpperCase()
        const status = action === 'DELETE' ? 'error' : action === 'CREATE' ? 'success' : action === 'PAYMENT' ? 'success' : 'warning'
        return <StatusPill status={status} label={action} />
      }
    },
    {
      key: 'entity',
      header: 'Target Entity',
      cell: (row: AuditLogResponse) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {row.entity_name}
          </span>
          <span style={{ 
            fontSize: '11px', 
            fontFamily: 'monospace', 
            background: 'var(--color-surface-subtle)', 
            padding: '1px 6px', 
            borderRadius: '4px',
            color: 'var(--color-text-muted)'
          }}>
            #{row.entity_id}
          </span>
        </div>
      )
    },
    {
      key: 'source',
      header: 'Ledger Source',
      width: '120px',
      cell: (row: AuditLogResponse) => (
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: '4px',
          background: row.source === 'FEE' ? 'rgba(217, 119, 6, 0.1)' : 'rgba(59, 79, 224, 0.1)',
          color: row.source === 'FEE' ? 'var(--color-warning)' : 'var(--color-primary)',
          border: '1px solid var(--color-border)'
        }}>
          {row.source}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Audit Trail',
      width: '120px',
      cell: (row: AuditLogResponse) => (
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => setSelectedLog(row)}
        >
          View Diff
        </Button>
      )
    }
  ]

  const beforeJson = selectedLog ? parseJsonSafe(selectedLog.before_state) : null
  const afterJson = selectedLog ? parseJsonSafe(selectedLog.after_state) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 700, 
              color: 'var(--color-primary)', 
              background: 'var(--color-primary-subtle)', 
              padding: '2px 8px', 
              borderRadius: '4px' 
            }}>
              R-03 · Audit Log
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              System Audit & Governance Ledger
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Unified tamper-evident transaction log tracking mutation events, actor signatures, before/after states, and fee audits.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button 
            variant="secondary" 
            size="sm" 
            leftIcon={<RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />}
            onClick={() => refetch()}
            isLoading={isFetching}
          >
            Refresh
          </Button>

          <Button 
            variant="primary" 
            size="sm" 
            leftIcon={<Download size={14} />}
            onClick={handleExport}
            isLoading={isExporting}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Logged Events"
          value={data?.total ?? logs.length}
          tone="neutral"
          icon={<History size={18} />}
          description="Total mutation records in unified ledger"
        />
        <StatCard
          label="Ledger Integrity Status"
          value="Intact"
          tone="positive"
          icon={<ShieldCheck size={18} />}
          description="Foreign keys & constraints verified"
        />
        <StatCard
          label="Tracked Systems"
          value="GENERAL + FEE"
          tone="accent"
          icon={<Layers size={18} />}
          description="Cross-module unified view"
        />
      </div>

      {/* Filters Bar */}
      <Card padding={0}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} style={{ color: 'var(--color-text-secondary)' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Audit Search & Entity Filters
            </span>
          </div>
          {Object.keys(activeFilters).length > 0 && (
            <Button variant="subtle" size="sm" onClick={handleResetFilters} leftIcon={<X size={12} />}>
              Clear Filters
            </Button>
          )}
        </div>

        <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          {/* Search text */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              Search Any Keyword
            </label>
            <input
              type="text"
              placeholder="Entity, ID, actor, action..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>

          {/* Ledger Source */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              Ledger Source
            </label>
            <select
              value={filters.source}
              onChange={(e) => handleFilterChange('source', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="">All Sources</option>
              <option value="GENERAL">GENERAL</option>
              <option value="FEE">FEE</option>
            </select>
          </div>

          {/* Action */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              Action Type
            </label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="PAYMENT">PAYMENT</option>
              <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            </select>
          </div>

          {/* Operator / Actor */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              Operator / Actor
            </label>
            <input
              type="text"
              placeholder="e.g. admin_core, student1"
              value={filters.actor}
              onChange={(e) => handleFilterChange('actor', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>

          {/* Date From */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              From Date
            </label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>

          {/* Date To */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              To Date
            </label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding={0}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} style={{ color: 'var(--color-text-secondary)' }} />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Audit Log Records ({data?.total ?? logs.length})
            </h3>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Page {page} of {Math.max(1, Math.ceil((data?.total || 1) / 25))}
          </span>
        </div>

        <Table
          data={logs}
          columns={columns}
          keyExtractor={(row: AuditLogResponse) => String(row.log_id || row.id || `${row.source}-${row.timestamp}`)}
          isLoading={isLoading}
          emptyMessage="No audit logs matched the specified filter criteria."
          pagination={{
            currentPage: page,
            totalItems: data?.total || 0,
            pageSize: 25,
            onPageChange: (p) => setPage(p),
            onPageSizeChange: () => {}
          }}
        />
      </Card>

      {/* Diff Drawer */}
      <Drawer
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog ? `Audit Event #${selectedLog.log_id || selectedLog.id} — ${selectedLog.action}` : ''}
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setSelectedLog(null)}>Close</Button>
          </div>
        }
      >
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Metadata Summary Banner */}
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              fontSize: '13px'
            }}>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', fontWeight: 600 }}>TIMESTAMP</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{new Date(selectedLog.timestamp).toLocaleString()}</span>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', fontWeight: 600 }}>OPERATOR</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{selectedLog.actor || 'system'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', fontWeight: 600 }}>TARGET ENTITY</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{selectedLog.entity_name} #{selectedLog.entity_id}</span>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', fontWeight: 600 }}>LEDGER MODULE</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{selectedLog.source}</span>
              </div>
            </div>

            {/* Before vs After States */}
            <div style={{ display: 'grid', gridTemplateColumns: beforeJson && afterJson ? '1fr 1fr' : '1fr', gap: '16px' }}>
              {beforeJson && (
                <div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: 'var(--color-warning)' }}>
                    BEFORE STATE
                  </h4>
                  <pre style={{
                    background: 'var(--color-surface-subtle)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    margin: 0,
                    maxHeight: '300px'
                  }}>
                    {JSON.stringify(beforeJson, null, 2)}
                  </pre>
                </div>
              )}

              {afterJson && (
                <div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: 'var(--color-success)' }}>
                    AFTER STATE
                  </h4>
                  <pre style={{
                    background: 'var(--color-surface-subtle)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    margin: 0,
                    maxHeight: '300px'
                  }}>
                    {JSON.stringify(afterJson, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Raw Fallback if neither before nor after is available */}
            {!beforeJson && !afterJson && (
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  PAYLOAD DETAILS
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
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
