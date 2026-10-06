import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Table, type Column } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';

interface HistoryRecord {
  id: string;
  receiptNo: string;
  date: string;
  amount: number;
  mode: string;
  items: string;
  status: string;
}

export const ReceiptPaymentHistoryPage: React.FC = () => {
  const [history] = useState<HistoryRecord[]>([
    { id: '1', receiptNo: 'REC-001', date: '2026-08-16', amount: 50250, mode: 'Credit Card', items: 'Tuition Fee, Late Fee', status: 'Success' },
    { id: '2', receiptNo: 'REC-002', date: '2026-08-10', amount: 5000, mode: 'UPI', items: 'Library Fee', status: 'Success' },
  ]);

  const columns: Column<HistoryRecord>[] = [
    { header: 'Receipt No.', key: 'receiptNo', render: (r) => <>{r.receiptNo}</> },
    { header: 'Date', key: 'date', render: (r) => <>{r.date}</> },
    { 
      header: 'Amount', 
      key: 'amount',
      render: (r) => <span className="font-semibold">₹{r.amount.toLocaleString()}</span>
    },
    { header: 'Mode', key: 'mode', render: (r) => <>{r.mode}</> },
    { header: 'Items', key: 'items', render: (r) => <>{r.items}</> },
    { 
      header: 'Status', 
      key: 'status',
      render: (r) => (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${r.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {r.status}
        </span>
      )
    },
    {
      header: '',
      key: 'id',
      render: () => <Button variant="tertiary" size="sm" onClick={() => window.location.href='/student/receipt/REC-001'}>View Receipt</Button>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payment History</h1>
          <p className="text-sm text-gray-500 mt-1">View your past payments and download receipts.</p>
        </div>
      </div>

      <Card padding="none">
        <Table data={history} columns={columns} keyExtractor={(r) => r.id} />
      </Card>
    </div>
  );
};
