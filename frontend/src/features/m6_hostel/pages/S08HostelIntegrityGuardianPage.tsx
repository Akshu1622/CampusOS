import React from 'react'
import { Card, StatCard, Table, type Column, StatusPill, Button, Alert } from '@/components/ui'
import { useIntegrityGuardian } from '../hooks'
import { ShieldCheck, ShieldAlert, AlertTriangle, RefreshCw, CheckCircle2, Download, ExternalLink } from 'lucide-react'
import type { IntegrityFinding } from '../api'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

export function S08HostelIntegrityGuardianPage() {
  const { data: report, isLoading, refetch, isFetching } = useIntegrityGuardian()
  const navigate = useNavigate()

  const handleExport = () => {
    if (!report) return
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `hostel-integrity-guardian-${new Date().toISOString().split('T')[0]}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    toast.success('Integrity scan report exported.')
  }

  const columns: Column<IntegrityFinding>[] = [
    {
      header: 'Severity',
      key: 'severity',
      render: (f) => (
        <StatusPill
          label={f.severity}
          status={f.severity === 'CRITICAL' ? 'error' : f.severity === 'HIGH' ? 'warning' : 'neutral'}
        />
      )
    },
    {
      header: 'Diagnostic Code',
      key: 'code',
      render: (f) => (
        <div>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)' }}>
            {f.code}
          </span>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Entity: {f.entity} {f.reference_key ? `(${f.reference_key})` : ''}
          </div>
        </div>
      )
    },
    {
      header: 'Anomaly Findings',
      key: 'description',
      render: (f) => (
        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', maxWidth: '380px' }}>
          {f.description}
        </div>
      )
    },
    {
      header: 'Recommended Remediation',
      key: 'recommended_action',
      render: (f) => (
        <div style={{ fontSize: '12px', color: 'var(--color-primary, #0D9488)', fontWeight: 600 }}>
          {f.recommended_action}
        </div>
      )
    }
  ]

  const isHealthy = report?.status === 'HEALTHY'
  const hasCritical = (report?.critical_count || 0) > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0D9488', background: '#E0F5F3', padding: '2px 8px', borderRadius: '4px' }}>
              FLAGSHIP A
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Hostel Data Integrity Guardian
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Automated background diagnostic engine detecting bed desyncs, demographic mismatches, and over-capacity allocations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" size="sm" leftIcon={<Download size={14} />} onClick={handleExport} disabled={!report}>
            Export Scan Report
          </Button>
          <Button variant="primary" size="sm" leftIcon={<RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />} onClick={() => refetch()}>
            Run Diagnostic Scan
          </Button>
        </div>
      </div>

      {/* System Health Status Banner */}
      <Card padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: isHealthy ? '#DCFCE7' : hasCritical ? '#FEE2E2' : '#FEF3C7',
              color: isHealthy ? '#166534' : hasCritical ? '#991B1B' : '#92400E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {isHealthy ? <CheckCircle2 size={28} /> : hasCritical ? <ShieldAlert size={28} /> : <AlertTriangle size={28} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  System Health: {report?.status || 'SCANNING'}
                </h3>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                {isHealthy
                  ? 'All room inventories, bed counters, gender block segregation, and active allocations are 100% synchronized.'
                  : `Integrity Guardian detected ${report?.findings.length || 0} anomaly condition(s) requiring warden attention.`}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="subtle" size="sm" onClick={() => navigate('/admin/hostel/room-allocation')}>
              Resolve in Allocations
            </Button>
          </div>
        </div>
      </Card>

      {/* StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Automated Checks Executed"
          value={report?.total_checks_run || 5}
          tone="neutral"
          icon={<ShieldCheck size={18} />}
          description="Continuous verification algorithms"
        />
        <StatCard
          label="Critical Violations"
          value={report?.critical_count || 0}
          tone={report?.critical_count ? 'error' : 'positive'}
          icon={<ShieldAlert size={18} />}
          description="Requires immediate correction"
        />
        <StatCard
          label="High Risk Anomalies"
          value={report?.high_count || 0}
          tone={report?.high_count ? 'warning' : 'positive'}
          icon={<AlertTriangle size={18} />}
          description="Demographic or block policy warnings"
        />
        <StatCard
          label="Medium Warnings"
          value={report?.medium_count || 0}
          tone="neutral"
          icon={<RefreshCw size={18} />}
          description="Optimization opportunities"
        />
      </div>

      {/* Findings Table */}
      <Card padding={0}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Diagnostic Scan Findings & Explainable Actions
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Detailed breakdown of discrepancies found across room counters and allocations
            </span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
            {report?.findings.length || 0} items identified
          </span>
        </div>

        <Table
          data={report?.findings || []}
          columns={columns}
          keyExtractor={(f: IntegrityFinding) => `${f.code}-${f.entity}-${f.reference_key || ''}-${f.description}`}
          isLoading={isLoading}
          emptyMessage="No anomalies found. Campus hostel database integrity is completely pristine!"
        />
      </Card>
    </div>
  )
}
