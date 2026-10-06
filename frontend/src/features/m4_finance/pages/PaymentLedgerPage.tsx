import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Table, type Column } from '../../../components/ui/Table';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';

interface LedgerRecord {
  id: string;
  receiptNo: string;
  student: string;
  program: string;
  amount: number;
  mode: string;
  date: string;
  recordedBy: string;
  status: string;
}

export const PaymentLedgerPage: React.FC = () => {
  const [ledger] = useState<LedgerRecord[]>([
    { id: '1', receiptNo: 'REC-001', student: 'John Doe', program: 'B.Tech CS', amount: 50250, mode: 'Credit Card', date: '2026-08-16', recordedBy: 'System', status: 'Success' }
  ]);

  const columns: Column<LedgerRecord>[] = [
    { header: 'Receipt', key: 'receiptNo', render: (r) => <>{r.receiptNo}</> },
    { header: 'Student', key: 'student', render: (r) => <>{r.student}</> },
    { header: 'Program', key: 'program', render: (r) => <>{r.program}</> },
    { 
      header: 'Amount', 
      key: 'amount',
      render: (r) => <span className="font-semibold">₹{r.amount.toLocaleString()}</span>
    },
    { header: 'Mode', key: 'mode', render: (r) => <>{r.mode}</> },
    { header: 'Date', key: 'date', render: (r) => <>{r.date}</> },
    { header: 'Recorded By', key: 'recordedBy', render: (r) => <>{r.recordedBy}</> },
    { 
      header: 'Status', 
      key: 'status',
      render: (r) => (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${r.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {r.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payment Ledger</h1>
          <p className="text-sm text-gray-500 mt-1">Master view of all received payments and reversals.</p>
        </div>
        <Button variant="secondary" icon="Export">Export CSV</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="flex flex-col items-center justify-center py-4">
          <span className="text-2xl font-bold text-gray-900">₹1.2L</span>
          <p className="text-sm text-gray-500">Collected Today</p>
        </Card>
        <Card className="flex flex-col items-center justify-center py-4">
          <span className="text-2xl font-bold text-green-600">₹45.5L</span>
          <p className="text-sm text-gray-500">This Month</p>
        </Card>
        <Card className="flex flex-col items-center justify-center py-4">
          <span className="text-2xl font-bold text-amber-600">₹12.3L</span>
          <p className="text-sm text-gray-500">Outstanding</p>
        </Card>
        <Card className="flex flex-col items-center justify-center py-4">
          <span className="text-2xl font-bold text-red-600">₹0</span>
          <p className="text-sm text-gray-500">Reversals</p>
        </Card>
      </div>

      <div className="flex space-x-4">
        <Select options={[{ value: 'all', label: 'All Programs' }]} className="w-48" />
        <Select options={[{ value: 'f26', label: 'Fall 2026' }]} className="w-48" />
      </div>

      <Card padding="none">
        <Table data={ledger} columns={columns} keyExtractor={(r) => r.id} />
      </Card>
    </div>
  );
};
