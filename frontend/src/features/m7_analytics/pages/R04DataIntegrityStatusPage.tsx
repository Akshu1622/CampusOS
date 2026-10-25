import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi, type IntegrityCheckResponse } from '../api'
import { StatCard, Card, StatusPill, Button, LoadingSkeleton } from '@/components/ui'
import { ShieldCheck, AlertTriangle, XCircle, RefreshCw, CheckCircle, Database } from 'lucide-react'

export function R04DataIntegrityStatusPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['integrityChecks'],
    queryFn: analyticsApi.getIntegrityChecks,
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <LoadingSkeleton height={40} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <LoadingSkeleton height={112} />
          <LoadingSkeleton height={112} />
          <LoadingSkeleton height={112} />
        </div>
      </div>
    )
  }

  const checks = data || []
  const passedCount = checks.filter(c => c.status === 'PASS').length
  const warningCount = checks.filter(c => c.status === 'WARN').length
  const failedCount = checks.filter(c => c.status === 'FAIL').length

  const grouped = checks.reduce((acc, curr) => {
    if (!acc[curr.module]) acc[curr.module] = []
    acc[curr.module].push(curr)
    return acc
  }, {} as Record<string, IntegrityCheckResponse[]>)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
              R-04
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Data Integrity & Cross-Module Invariant Checks
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Automated schema invariant verifications, referential integrity diagnostics, and orphaned record audits.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />}
          onClick={() => refetch()}
          isLoading={isFetching}
        >
          Run Integrity Diagnostics
        </Button>
      </div>

      {/* StatCards */}
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
          description="Blocking errors"
        />
      </div>

      {/* Grouped Invariant Diagnostics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {Object.entries(grouped).map(([module, moduleChecks]) => (
          <Card key={module} padding={0}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={16} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {module} Invariants
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {moduleChecks.map((c, i) => (
                <div
                  key={c.check_name}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 20px',
                    borderBottom: i < moduleChecks.length - 1 ? '1px solid var(--color-border)' : 'none',
                    background: c.status === 'FAIL' ? 'var(--color-error-bg)' : 'transparent'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                      {c.check_name}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {c.description || (c.affected_count > 0 ? `${c.affected_count} affected records (${c.sample_keys || 'none'})` : 'Check passed without anomalies')}
                    </div>
                  </div>
                  <StatusPill
                    label={c.status}
                    status={c.status === 'PASS' ? 'success' : c.status === 'WARN' ? 'warning' : 'error'}
                  />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
