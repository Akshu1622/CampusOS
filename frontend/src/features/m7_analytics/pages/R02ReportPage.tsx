import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api'
import { reportConfigs } from './reportConfigs'
import { Filters } from '../../../components/ui/Filters'
import { Table } from '../../../components/ui/Table'
import { StatCard } from '../../../components/ui/StatCard'
import { GroupedBarChart, DonutChart } from '../../../components/ui/Charts'
import { Button } from '../../../components/ui/Button'
import { IconButton } from '../../../components/ui/IconButton'
import { ErrorState } from '../../../components/ui/ErrorState'

export function R02ReportPage() {
  const { reportKey } = useParams<{ reportKey: string }>()
  const navigate = useNavigate()
  const config = reportKey ? reportConfigs[reportKey] : null

  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Record<string, any>>({})

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['reportData', reportKey, page, filters],
    queryFn: () => analyticsApi.getReportData(reportKey!, { page, size: 20, ...filters }),
    enabled: !!reportKey && !!config,
    placeholderData: (prev) => prev,
  })

  if (!config) {
    return (
      <ErrorState 
        title="Report Not Found" 
        message={`The report ${reportKey} does not exist or is unavailable.`} 
        onRetry={() => navigate('/admin/analytics/reports')}
      />
    )
  }

  const handleExport = () => {
    if (reportKey) {
      analyticsApi.downloadReportCsv(reportKey, filters)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{config.title}</h1>
          <p className="text-sm text-gray-500">
            Last generated at {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => refetch()} isLoading={isFetching}>
            Refresh
          </Button>
          <Button variant="secondary" onClick={handleExport}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow-sm border border-gray-200">
        <Filters 
          filters={config.filters} 
          values={filters} 
          onChange={(newVals) => { setFilters(newVals); setPage(1); }} 
        />
      </div>

      {error ? (
        <ErrorState message="Failed to load report data" onRetry={refetch} />
      ) : (
        <>
          {config.kpis && data && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {config.kpis(data).map((kpi: any, idx: number) => (
                <StatCard key={idx} label={kpi.title} icon={<div/>} value={kpi.value} />
              ))}
            </div>
          )}

          {config.chart && data?.data && data.data.length > 0 && (
            <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Visualization</h3>
              {config.chart.type === 'bar' ? (
                <GroupedBarChart 
                  data={data.data} 
                  bars={config.chart.dataKeys} 
                  xAxisKey={config.chart.xAxisKey} 
                  layout={config.chart.layout || 'horizontal'} 
                />
              ) : config.chart.type === 'donut' ? (
                <DonutChart 
                  data={data.data} 
                  dataKey={config.chart.dataKey} 
                  nameKey={config.chart.nameKey} 
                />
              ) : null}
            </div>
          )}

          <div className="bg-white rounded shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Data</h3>
            </div>
            <Table
              data={data?.data || []}
              columns={config.columns.map((col: any) => ({ ...col, key: col.accessor }))}
              keyExtractor={(_item) => Math.random().toString()}
              isLoading={isLoading}
              pagination={{
                currentPage: page,
                totalItems: data?.total || 0,
                pageSize: 20,
                onPageChange: setPage,
                onPageSizeChange: () => {}
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
