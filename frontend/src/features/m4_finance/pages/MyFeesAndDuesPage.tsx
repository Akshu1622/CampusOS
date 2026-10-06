import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Table, type Column } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';

interface DueRecord {
  id: string;
  component: string;
  term: string;
  amount: number;
  dueDate: string;
  lateFee: number;
  paid: number;
  balance: number;
  status: string;
}

export const MyFeesAndDuesPage: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dues] = useState<DueRecord[]>([
    { id: 'D1', component: 'Tuition Fee', term: 'Fall 2026', amount: 50000, dueDate: '2026-08-15', lateFee: 250, paid: 0, balance: 50250, status: 'Overdue' },
    { id: 'D2', component: 'Library Fee', term: 'Fall 2026', amount: 5000, dueDate: '2026-08-15', lateFee: 0, paid: 5000, balance: 0, status: 'Paid' },
  ]);

  const selectedTotal = dues
    .filter(d => selectedIds.includes(d.id))
    .reduce((sum, d) => sum + d.balance, 0);

  const columns: Column<DueRecord>[] = [
    { header: 'Component', key: 'component', render: (r) => <>{r.component}</> },
    { header: 'Term', key: 'term', render: (r) => <>{r.term}</> },
    { 
      header: 'Amount', 
      key: 'amount',
      render: (r) => <span>₹{r.amount.toLocaleString()}</span>
    },
    { header: 'Due Date', key: 'dueDate', render: (r) => <>{r.dueDate}</> },
    { 
      header: 'Late Fee', 
      key: 'lateFee',
      render: (r) => <span className={r.lateFee > 0 ? 'text-red-600' : ''}>₹{r.lateFee}</span>
    },
    { 
      header: 'Balance', 
      key: 'balance',
      render: (r) => <span className="font-semibold">₹{r.balance.toLocaleString()}</span>
    },
    { 
      header: 'Status', 
      key: 'status',
      render: (r) => (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${r.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {r.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Fees & Dues</h1>
          <p className="text-sm text-gray-500 mt-1">View and pay your outstanding fees.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="flex flex-col items-center justify-center py-4">
          <span className="text-2xl font-bold text-gray-900">₹55,000</span>
          <p className="text-sm text-gray-500">Total Payable</p>
        </Card>
        <Card className="flex flex-col items-center justify-center py-4">
          <span className="text-2xl font-bold text-green-600">₹5,000</span>
          <p className="text-sm text-gray-500">Paid</p>
        </Card>
        <Card className="flex flex-col items-center justify-center py-4">
          <span className="text-2xl font-bold text-amber-600">₹50,250</span>
          <p className="text-sm text-gray-500">Outstanding</p>
        </Card>
        <Card className="flex flex-col items-center justify-center py-4">
          <span className="text-2xl font-bold text-red-600">₹250</span>
          <p className="text-sm text-gray-500">Late Fee Accrued</p>
        </Card>
      </div>

      {dues.some(d => d.status === 'Overdue') && (
        <Alert variant="error" title="Overdue Payment">
          You have overdue payments. A total late fee of ₹250 has been accrued.
        </Alert>
      )}

      <Card padding="none">
        <Table 
          data={dues} 
          columns={columns} 
          keyExtractor={(r) => r.id} 
          selectedIds={selectedIds}
          onSelect={setSelectedIds}
        />
      </Card>

      {/* Docked Payment Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50 flex justify-between items-center px-8" style={{ marginLeft: '248px' }}>
        <div className="text-lg">
          Selected Total: <span className="font-bold text-2xl text-amber-700 ml-2">₹{selectedTotal.toLocaleString()}</span>
        </div>
        <Button variant="primary" disabled={selectedTotal === 0} onClick={() => window.location.href='/student/pay'}>
          Pay Selected
        </Button>
      </div>
    </div>
  );
};
