import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi, type AuditLogResponse } from '../api'
import { Table } from '../../../components/ui/Table'
import { Filters } from '../../../components/ui/Filters'
import { Drawer } from '../../../components/ui/Drawer'
import { StatusPill } from '../../../components/ui/StatusPill'
import { Button } from '../../../components/ui/Button'

export function R03AuditLogViewerPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [selectedLog, setSelectedLog] = useState<AuditLogResponse | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', page, filters],
    queryFn: () => analyticsApi.getAuditLogs({ page, size: 20, ...filters }),
    placeholderData: (prev) => prev,
  })

  const filterConfig: any[] = [
    { id: 'source', label: 'Module', type: 'select', options: [
      { label: 'All', value: '' },
      { label: 'Finance', value: 'FINANCE' },
      { label: 'Core', value: 'CORE' },
      { label: 'HR', value: 'HR' },
      { label: 'Hostel', value: 'HOSTEL' }
    ]},
    { id: 'action', label: 'Action', type: 'select', options: [
      { label: 'All', value: '' },
      { label: 'CREATE', value: 'CREATE' },
      { label: 'UPDATE', value: 'UPDATE' },
      { label: 'DELETE', value: 'DELETE' }
    ]},
    { id: 'actor', label: 'Actor', type: 'text' },
    { id: 'start_date', label: 'Start Date', type: 'date' },
    { id: 'end_date', label: 'End Date', type: 'date' },
  ]

  const columns: any[] = [
    { header: 'Timestamp', accessor: (row: AuditLogResponse) => new Date(row.timestamp).toLocaleString() },
    { header: 'Actor', accessor: 'actor' },
    { header: 'Action', accessor: (row: AuditLogResponse) => (
      <StatusPill 
        status={row.action === 'DELETE' ? 'error' : row.action === 'CREATE' ? 'success' : 'warning'} 
        label={row.action} 
      />
    )},
    { header: 'Entity', accessor: (row: AuditLogResponse) => `${row.entity_name} (${row.entity_id})` },
    { header: 'Module', accessor: 'source' },
    { header: 'Details', accessor: (row: AuditLogResponse) => (
        <Button variant="secondary" size="sm" onClick={() => setSelectedLog(row)}>View Diff</Button>
      ) 
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">System Audit Log</h1>
        <Button variant="secondary" onClick={() => {
          /* In a real app we'd download CSV here */
        }}>Export CSV</Button>
      </div>

      <Filters 
        filters={filterConfig}
        values={filters}
        onChange={(newFilters) => { setFilters(newFilters); setPage(1); }}
      />

      <Table
        data={data?.data || []}
        columns={columns}
        keyExtractor={(row) => row.log_id.toString()}
        isLoading={isLoading}
        pagination={{
          currentPage: page,
          totalItems: data?.total || 0,
          pageSize: 20,
          onPageChange: setPage,
          onPageSizeChange: () => {},
        }}
      />

      <Drawer
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-semibold">Timestamp:</span> {new Date(selectedLog.timestamp).toLocaleString()}</div>
              <div><span className="font-semibold">Actor:</span> {selectedLog.actor}</div>
              <div><span className="font-semibold">Action:</span> {selectedLog.action}</div>
              <div><span className="font-semibold">Entity:</span> {selectedLog.entity_name} ({selectedLog.entity_id})</div>
              <div><span className="font-semibold">Module:</span> {selectedLog.source}</div>
            </div>
            
            <div className="mt-4 border-t pt-4">
              <h3 className="font-semibold mb-2">Before State</h3>
              <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto">
                {selectedLog.before_state ? JSON.stringify(JSON.parse(selectedLog.before_state), null, 2) : 'None'}
              </pre>
            </div>
            
            <div className="mt-4 border-t pt-4">
              <h3 className="font-semibold mb-2">After State</h3>
              <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto">
                {selectedLog.after_state ? JSON.stringify(JSON.parse(selectedLog.after_state), null, 2) : 'None'}
              </pre>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
