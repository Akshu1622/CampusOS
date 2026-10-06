import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Table, type Column } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';

interface FeeStructure {
  id: string;
  program: string;
  term: string;
  componentsCount: number;
  total: number;
  dueDate: string;
  version: string;
  status: string;
}

export const FeeStructureManagementPage: React.FC = () => {
  const [structures] = useState<FeeStructure[]>([
    {
      id: 'FS01',
      program: 'B.Tech Computer Science',
      term: 'Fall 2026',
      componentsCount: 4,
      total: 55000,
      dueDate: '2026-08-15',
      version: 'v1',
      status: 'Active',
    }
  ]);

  const columns: Column<FeeStructure>[] = [
    { header: 'Program', key: 'program', render: (r) => <>{r.program}</> },
    { header: 'Term', key: 'term', render: (r) => <>{r.term}</> },
    { header: 'Components', key: 'componentsCount', render: (r) => <>{r.componentsCount}</> },
    { 
      header: 'Total', 
      key: 'total',
      render: (r) => <span>₹{r.total.toLocaleString()}</span>
    },
    { header: 'Due Date', key: 'dueDate', render: (r) => <>{r.dueDate}</> },
    { header: 'Version', key: 'version', render: (r) => <>{r.version}</> },
    { 
      header: 'Status', 
      key: 'status',
      render: (r) => (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${r.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {r.status}
        </span>
      )
    },
    {
      header: '',
      key: 'id',
      render: () => <Button variant="tertiary" size="sm">Edit</Button>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Fee Structures</h1>
          <p className="text-sm text-gray-500 mt-1">Manage program-wise fee structures and components.</p>
        </div>
        <Button variant="primary" icon="Plus">New Structure</Button>
      </div>

      <Alert variant="info" title="Audit Trail Active">
        Any changes made to fee amounts or structures are logged and audited automatically.
      </Alert>

      <Card padding="none">
        <Table data={structures} columns={columns} keyExtractor={(r) => r.id} />
      </Card>
    </div>
  );
};
