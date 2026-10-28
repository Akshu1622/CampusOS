import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api'
import { reportConfigs } from './reportConfigs'
import { Card, StatCard, Button, Table, ErrorState, LoadingSkeleton, StatusPill } from '@/components/ui'
import { GroupedBarChart, DonutChart } from '@/components/ui/Charts'
import { Filters } from '@/components/ui/Filters'
import { 
  ArrowLeft, Download, RefreshCw, Printer, FileText, 
  BarChart3, CheckCircle2, AlertTriangle 
} from 'lucide-react'
import toast from 'react-hot-toast'

export function R02ReportPage() {
  const { reportKey } = useParams<{ reportKey: string }>()
  const navigate = useNavigate()
  const config = reportKey ? reportConfigs[reportKey] : null

  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [exporting, setExporting] = useState(false)

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['reportData', reportKey, page, filters],
    queryFn: () => analyticsApi.getReportData(reportKey!, { page, size: 20, ...filters }),
    enabled: !!reportKey && !!config,
    placeholderData: (prev) => prev,
  })

  if (!config) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto' }}>
        <ErrorState 
          title="Report Specification Not Found" 
          message={`The report key "${reportKey}" is not registered in the system.`} 
          onRetry={() => navigate('/admin/analytics/reports')}
        />
      </div>
    )
  }

  const handleExport = async () => {
    if (!reportKey) return
    try {
      setExporting(true)
      toast.loading('Generating CSV export...', { id: 'csv-export' })
      await analyticsApi.downloadReportCsv(reportKey, filters)
      toast.success(`${reportKey} CSV exported successfully`, { id: 'csv-export' })
    } catch (err: any) {
      toast.error(`Export failed: ${err.message || 'Unknown error'}`, { id: 'csv-export' })
    } finally {
      setExporting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // Pre-process rows for consistent presentation
  const rawRows = data?.data || []
  const processedData = rawRows.map((r: any, idx: number) => {
    const studentName = r.student_name || (r.first_name && r.last_name ? `${r.first_name} ${r.last_name}` : r.first_name || `Student #${r.student_id || idx + 1}`)
    const employeeName = r.employee_name || (r.first_name && r.last_name ? `${r.first_name} ${r.last_name}` : r.first_name || `Staff #${r.employee_id || idx + 1}`)
    const isBarred = r.attendance_pct !== undefined && Number(r.attendance_pct) < 75

    return {
      ...r,
      _rowId: String(r.id || r.student_id || r.offering_id || r.hostel_id || r.employee_id || `${reportKey}-${idx}`),
      student_name: studentName,
      employee_name: employeeName,
      cgpa_display: r.cgpa !== null && r.cgpa !== undefined ? Number(r.cgpa).toFixed(2) : '—',
      eligibility_status: isBarred ? 'Blocked (<75%)' : 'Eligible',
      avg_attendance_num: Number(r.avg_attendance_pct || 0),
      total_paid_num: Number(r.total_paid || 0),
      total_balance_num: Number(r.total_balance || 0),
      total_dues_num: Number(r.total_dues || 0),
      occupied_beds_num: Number(r.occupied_beds || 0),
      available_beds_num: Number(r.available_beds || 0),
      total_net_num: Number(r.total_net_pay || 0),
      used_leave_num: Number(r.used_leave || 0),
      available_balance_num: Number(r.available_balance || 0),
      pass_pct_num: Number(r.pass_pct || 0)
    }
  })

  // Prepare table columns with guaranteed formatting
  const tableColumns = config.columns.map((col) => ({
    key: col.accessor,
    header: col.header,
    width: col.width,
    align: col.align || 'left',
    cell: (row: any) => {
      if (col.cell) return col.cell(row)

      const val = row[col.accessor]

      // Special presentation handlers
      if (col.accessor === 'eligibility_status') {
        return (
          <StatusPill 
            label={val} 
            status={val.includes('Blocked') ? 'error' : 'success'} 
          />
        )
      }

      if (col.accessor === 'dept_rank' || col.accessor === 'prog_term_rank') {
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '24px',
            height: '24px',
            padding: '0 6px',
            borderRadius: '12px',
            background: Number(val) <= 3 ? 'var(--color-primary-subtle)' : 'var(--color-surface-subtle)',
            color: Number(val) <= 3 ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 700,
            fontSize: '12px'
          }}>
            #{val}
          </span>
        )
      }

      if (col.accessor.includes('due') || col.accessor.includes('paid') || col.accessor.includes('balance') || col.accessor.includes('gross') || col.accessor.includes('net') || col.accessor.includes('deduction') || col.accessor.includes('dues')) {
        return <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>₹{Number(val || 0).toLocaleString()}</span>
      }

      if (col.accessor.includes('pct') || col.accessor.includes('attendance')) {
        const num = Number(val || 0)
        return (
          <span style={{ 
            fontWeight: 600, 
            color: num < 75 ? 'var(--color-error)' : 'var(--color-text-primary)' 
          }}>
            {num.toFixed(1)}%
          </span>
        )
      }

      if (val === undefined || val === null || val === '') {
        return <span style={{ color: 'var(--color-text-muted)' }}>—</span>
      }

      return String(val)
    }
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Navigation & Title Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Link 
              to="/admin/analytics/reports" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px', 
                fontSize: '13px', 
                color: 'var(--color-primary)', 
                textDecoration: 'none',
                fontWeight: 500
              }}
            >
              <ArrowLeft size={14} /> Back to Reports Hub
            </Link>
            <span style={{ color: 'var(--color-border)' }}>·</span>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 700, 
              padding: '2px 8px', 
              borderRadius: '4px', 
              background: 'var(--color-surface-subtle)', 
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)'
            }}>
              {reportKey}
            </span>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            {config.title}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)', maxWidth: '700px' }}>
            {config.description}
          </p>
        </div>

        {/* Action Buttons */}
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
            variant="secondary" 
            size="sm" 
            leftIcon={<Printer size={14} />}
            onClick={handlePrint}
          >
            Print
          </Button>

          <Button 
            variant="primary" 
            size="sm" 
            leftIcon={<Download size={14} />}
            onClick={handleExport}
            isLoading={exporting}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card padding={0}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            Report Query Parameters & Thresholds
          </span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Last generated at {new Date().toLocaleTimeString()}
          </span>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <Filters 
            filters={config.filters as any}
            values={filters} 
            onChange={(newVals) => { setFilters(newVals); setPage(1); }} 
          />
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <ErrorState 
          title="Query Execution Error" 
          message="Failed to retrieve report records with the specified parameters. Please review your filters and retry." 
          onRetry={refetch} 
        />
      )}

      {/* KPI Cards Strip */}
      {!error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <LoadingSkeleton key={i} height={100} />
            ))
          ) : (
            config.kpis(data).map((kpi, idx) => (
              <StatCard 
                key={idx} 
                label={kpi.title} 
                value={kpi.value}
                tone={idx === 0 ? 'accent' : idx === 1 ? 'neutral' : 'positive'}
                icon={<BarChart3 size={18} />}
              />
            ))
          )}
        </div>
      )}

      {/* Primary Chart Visual */}
      {!error && !isLoading && config.chart && processedData.length > 0 && (
        <Card padding={0}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={16} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Analytical Visualization ({reportKey})
            </h3>
          </div>
          <div style={{ padding: '24px 20px', minHeight: '320px' }}>
            {config.chart.type === 'bar' ? (
              <GroupedBarChart 
                data={processedData} 
                bars={(config.chart.dataKeys || []) as any}
                xAxisKey={config.chart.xAxisKey} 
                layout={config.chart.layout || 'horizontal'} 
              />
            ) : config.chart.type === 'donut' ? (
              <DonutChart 
                data={processedData} 
                dataKey={config.chart.dataKey || 'value'} 
                nameKey={config.chart.nameKey || 'name'} 
              />
            ) : null}
          </div>
        </Card>
      )}

      {/* Data Table */}
      {!error && (
        <Card padding={0}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} style={{ color: 'var(--color-text-secondary)' }} />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Detailed Records ({data?.total ?? processedData.length})
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Page {page} of {Math.max(1, Math.ceil((data?.total || 1) / 20))}
            </span>
          </div>

          <Table
            data={processedData}
            columns={tableColumns}
            keyExtractor={(row) => row._rowId}
            isLoading={isLoading}
            emptyMessage="No records matched the selected parameters."
            pagination={{
              currentPage: page,
              totalItems: data?.total || 0,
              pageSize: 20,
              onPageChange: (p) => setPage(p),
              onPageSizeChange: () => {}
            }}
          />
        </Card>
      )}
    </div>
  )
}
