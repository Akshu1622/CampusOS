import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Table, type Column } from '../../../components/ui/Table';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';

interface DefaulterRecord {
  id: string;
  student: string;
  program: string;
  outstanding: number;
  overdueDays: number;
  lateFee: number;
  lastPayment: string;
}

export const FeeDefaultersPage: React.FC = () => {
  const [defaulters] = useState<DefaulterRecord[]>([
    { id: '1', student: 'Jane Smith', program: 'B.Tech CS', outstanding: 50000, overdueDays: 12, lateFee: 600, lastPayment: 'None' }
  ]);

  const columns: Column<DefaulterRecord>[] = [
    { header: 'Student', key: 'student', render: (r) => <>{r.student}</> },
    { header: 'Program', key: 'program', render: (r) => <>{r.program}</> },
    { 
      header: 'Outstanding', 
      key: 'outstanding',
      render: (r) => <span className="font-semibold text-red-600">₹{r.outstanding.toLocaleString()}</span>
    },
    { 
      header: 'Overdue Days', 
      key: 'overdueDays',
      render: (r) => <span className="text-amber-600">{r.overdueDays} days</span>
    },
    { 
      header: 'Late Fee', 
      key: 'lateFee',
      render: (r) => <span>₹{r.lateFee}</span>
    },
    { header: 'Last Payment', key: 'lastPayment', render: (r) => <>{r.lastPayment}</> },
    {
      header: 'Actions',
      key: 'id',
      render: () => (
        <div className="flex space-x-2">
          <Button variant="tertiary" size="sm">Record</Button>
          <Button variant="secondary" size="sm">Notify</Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Fee Defaulters</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage overdue fee payments.</p>
        </div>
        <Button variant="secondary" icon="Export">Export CSV</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col items-center justify-center py-4 border-amber-200 bg-amber-50">
          <span className="text-2xl font-bold text-amber-700">45</span>
          <p className="text-sm text-amber-600">Total Defaulters</p>
        </Card>
        <Card className="flex flex-col items-center justify-center py-4">
          <span className="text-2xl font-bold text-red-600">₹12.3L</span>
          <p className="text-sm text-gray-500">Total Outstanding</p>
        </Card>
        <Card className="flex flex-col items-center justify-center py-4">
          <span className="text-2xl font-bold text-gray-900">42 Days</span>
          <p className="text-sm text-gray-500">Oldest Overdue</p>
        </Card>
      </div>

      <div className="flex space-x-4">
        <Select options={[{ value: 'f26', label: 'Fall 2026' }]} className="w-48" />
        <Select options={[{ value: 'all', label: 'All Programs' }]} className="w-48" />
      </div>

      <Card padding="none">
        <Table data={defaulters} columns={columns} keyExtractor={(r) => r.id} />
      </Card>
    </div>
  );
};
