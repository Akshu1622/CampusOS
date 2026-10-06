import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Table, type Column } from '../../../components/ui/Table';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';

interface AuditRecord {
  id: string;
  timestamp: string;
  user: string;
  entity: string;
  field: string;
  oldValue: string;
  newValue: string;
  context: string;
}

export const FeeChangeAuditLogPage: React.FC = () => {
  const [auditLogs] = useState<AuditRecord[]>([
    { id: '1', timestamp: '2026-08-10 14:32:01', user: 'Admin Finance', entity: 'Tuition Fee (Fall 26)', field: 'Amount', oldValue: '45000', newValue: '50000', context: 'Board approved hike' }
  ]);

  const columns: Column<AuditRecord>[] = [
    { header: 'Timestamp', key: 'timestamp', render: (r) => <>{r.timestamp}</> },
    { header: 'Changed By', key: 'user', render: (r) => <>{r.user}</> },
    { header: 'Entity', key: 'entity', render: (r) => <>{r.entity}</> },
    { header: 'Field', key: 'field', render: (r) => <>{r.field}</> },
    { 
      header: 'Change', 
      key: 'oldValue',
      render: (r) => (
        <div className="flex items-center space-x-2 text-xs">
          <span className="line-through text-red-500 bg-red-50 px-1 rounded">{r.oldValue}</span>
          <span className="text-gray-400">→</span>
          <span className="text-green-600 bg-green-50 px-1 rounded font-medium">{r.newValue}</span>
        </div>
      )
    },
    { header: 'Reason / Context', key: 'context', render: (r) => <>{r.context}</> },
    {
      header: '',
      key: 'id',
      render: () => <Button variant="tertiary" size="sm">View</Button>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Fee Change Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1">Immutable read-only record of all financial configuration changes.</p>
        </div>
        <Button variant="secondary" icon="Export">Export CSV</Button>
      </div>

      <div className="flex space-x-4">
        <Select options={[{ value: '7d', label: 'Last 7 Days' }]} className="w-48" />
        <Select options={[{ value: 'all', label: 'All Entities' }]} className="w-48" />
      </div>

      <Card padding="none">
        <Table data={auditLogs} columns={columns} keyExtractor={(r) => r.id} />
      </Card>
    </div>
  );
};
