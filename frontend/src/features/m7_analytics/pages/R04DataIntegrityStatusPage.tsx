import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi, type IntegrityCheckResponse } from '../api'
import { StatCard, Card, StatusPill, Button, LoadingSkeleton } from '@/components/ui'
import { 
  ShieldCheck, AlertTriangle, XCircle, RefreshCw, 
  Database, Filter, CheckCircle2, ChevronDown, ChevronRight 
} from 'lucide-react'
import toast from 'react-hot-toast'

export function R04DataIntegrityStatusPage() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASS' | 'WARN' | 'FAIL'>('ALL')
  const [searchModule, setSearchModule] = useState('')
  const [expandedCheck, setExpandedCheck] = useState<string | null>(null)
  const [lastRunTime, setLastRunTime] = useState<string>(new Date().toLocaleTimeString())

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['integrityChecks'],
    queryFn: async () => {
      const res = await analyticsApi.getIntegrityChecks()
      setLastRunTime(new Date().toLocaleTimeString())
      return res
    },
  })

  const handleRunChecks = async () => {
    toast.loading('Running integrity verification suite...', { id: 'integrity-run' })
    try {
      await refetch()
      toast.success('Integrity diagnostics completed', { id: 'integrity-run' })
    } catch {
      toast.error('Integrity check execution failed', { id: 'integrity-run' })
    }
  }

  const checks = data || []
  const passedCount = checks.filter(c => c.status === 'PASS').length
  const warningCount = checks.filter(c => c.status === 'WARN').length
  const failedCount = checks.filter(c => c.status === 'FAIL').length

  const filteredChecks = checks.filter(c => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter
    const matchesModule = searchModule === '' || 
      c.module.toLowerCase().includes(searchModule.toLowerCase()) || 
      c.check_name.toLowerCase().includes(searchModule.toLowerCase())
    return matchesStatus && matchesModule
  })

  const grouped = filteredChecks.reduce((acc, curr) => {
    if (!acc[curr.module]) acc[curr.module] = []
    acc[curr.module].push(curr)
    return acc
  }, {} as Record<string, IntegrityCheckResponse[]>)

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
              R-04 · Data Integrity
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Data Integrity & Referential Invariant Engine
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Automated schema invariant verifications, foreign-key consistency diagnostics, and orphaned record audits across modules.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Last run: {lastRunTime}
          </span>
          <Button
            variant="primary"
            leftIcon={<RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />}
            onClick={handleRunChecks}
            isLoading={isFetching}
          >
            Run Diagnostics
          </Button>
        </div>
      </div>

      {/* StatCards Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Invariants Passed"
          value={passedCount}
          tone="positive"
          icon={<ShieldCheck size={18} />}
          description="Foreign keys & constraints intact"
        />
        <StatCard
          label="Warnings Flagged"
          value={warningCount}
          tone="warning"
          icon={<AlertTriangle size={18} />}
          description="Attention recommended"
        />
        <StatCard
          label="Critical Violations"
          value={failedCount}
          tone="critical"
          icon={<XCircle size={18} />}
          description="Foreign key or format breaches"
        />
      </div>

      {/* Filters & Search Bar */}
      <Card padding={0}>
        <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Filter by Status:
            </span>
            {(['ALL', 'PASS', 'WARN', 'FAIL'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  border: 'none',
                  background: statusFilter === st ? 'var(--color-primary)' : 'var(--color-surface-subtle)',
                  color: statusFilter === st ? '#ffffff' : 'var(--color-text-secondary)',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {st}
              </button>
            ))}
          </div>

          <div style={{ minWidth: '220px' }}>
            <input
              type="text"
              placeholder="Filter by check or module name..."
              value={searchModule}
              onChange={(e) => setSearchModule(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px',
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

      {/* Loading Skeleton */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <LoadingSkeleton height={140} />
          <LoadingSkeleton height={140} />
        </div>
      )}

      {/* Grouped Invariant Diagnostics */}
      {!isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Object.entries(grouped).map(([module, moduleChecks]) => (
            <Card key={module} padding={0}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-surface-subtle)' }}>
                <Database size={16} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {module} Invariants ({moduleChecks.length})
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {moduleChecks.map((c, i) => {
                  const isExpanded = expandedCheck === `${module}-${c.check_name}`
                  const hasDetails = c.affected_count > 0 || !!c.sample_keys

                  return (
                    <div
                      key={c.check_name}
                      style={{
                        padding: '14px 20px',
                        borderBottom: i < moduleChecks.length - 1 ? '1px solid var(--color-border)' : 'none',
                        background: c.status === 'FAIL' ? 'rgba(239, 68, 68, 0.05)' : c.status === 'WARN' ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {hasDetails && (
                            <button
                              onClick={() => setExpandedCheck(isExpanded ? null : `${module}-${c.check_name}`)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center',
                                color: 'var(--color-text-muted)'
                              }}
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                              {c.check_name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                              {c.description || (c.affected_count === 0 ? 'Verified successfully without foreign-key or format anomalies' : `${c.affected_count} records flagged with discrepancies`)}
                            </div>
                          </div>
                        </div>

                        <StatusPill
                          label={c.status}
                          status={c.status === 'PASS' ? 'success' : c.status === 'WARN' ? 'warning' : 'error'}
                        />
                      </div>

                      {/* Expandable Discrepancy Breakdown */}
                      {isExpanded && hasDetails && (
                        <div style={{
                          marginTop: '8px',
                          padding: '12px',
                          borderRadius: '6px',
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          fontSize: '12px'
                        }}>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                            Affected Record Keys:
                          </div>
                          <span style={{ fontFamily: 'monospace', color: 'var(--color-error)', wordBreak: 'break-all' }}>
                            {c.sample_keys || 'None specified'}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          ))}

          {Object.keys(grouped).length === 0 && (
            <Card padding={0}>
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
                No integrity checks matched the active filter.
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
