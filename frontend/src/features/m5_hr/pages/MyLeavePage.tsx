import React from 'react';
import { Table, type Column } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';

interface LeaveRequest {
  id: string;
  type: string;
  dates: string;
  days: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  remark: string;
}

const mockLeaveRequests: LeaveRequest[] = [
  { id: 'LR-1', type: 'Casual Leave', dates: '10 Oct 2026 - 11 Oct 2026', days: 2, status: 'Pending', remark: '-' },
  { id: 'LR-2', type: 'Sick Leave', dates: '01 Sep 2026 - 02 Sep 2026', days: 2, status: 'Approved', remark: 'Approved by HR' },
];

export const MyLeavePage: React.FC = () => {
  const columns: Column<LeaveRequest>[] = [
    { key: 'type', header: 'Leave Type', render: (row) => row.type },
    { key: 'dates', header: 'Dates', render: (row) => row.dates },
    { key: 'days', header: 'Days', render: (row) => row.days.toString() },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.status === 'Approved'
              ? 'bg-green-100 text-green-800'
              : row.status === 'Pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    { key: 'remark', header: 'Decision Remark', render: (row) => row.remark },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button 
          variant="tertiary" 
          size="sm" 
          disabled={row.status !== 'Pending'}
          onClick={() => {
            if (confirm('Cancel this pending request?')) {
              alert('Cancelled');
            }
          }}
        >
          Cancel
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Leave</h1>
          <p className="text-sm text-gray-500 mt-1">View leave balances and history</p>
        </div>
        <div>
          <Button>Apply Leave</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500 mb-1">Casual Leave Balance</div>
          <div className="text-2xl font-semibold">8 <span className="text-sm font-normal text-gray-500">/ 12</span></div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500 mb-1">Sick Leave Balance</div>
          <div className="text-2xl font-semibold">5 <span className="text-sm font-normal text-gray-500">/ 10</span></div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500 mb-1">Earned Leave Balance</div>
          <div className="text-2xl font-semibold">15 <span className="text-sm font-normal text-gray-500">/ 15</span></div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Leave History</h3>
        <Table columns={columns} data={mockLeaveRequests} keyExtractor={(row) => row.id} />
      </div>
    </div>
  );
};
