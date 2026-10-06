import React, { useState } from 'react';
import { Table, type Column } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';

interface ApprovalRequest {
  id: string;
  employee: string;
  type: string;
  dates: string;
  days: number;
  overlap: boolean;
  submitted: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

const mockRequests: ApprovalRequest[] = [
  { id: 'LR-1', employee: 'Alice Smith', type: 'Casual Leave', dates: '10 Oct 2026 - 11 Oct 2026', days: 2, overlap: false, submitted: '01 Oct 2026', status: 'Pending' },
  { id: 'LR-3', employee: 'Bob Jones', type: 'Sick Leave', dates: '05 Oct 2026 - 07 Oct 2026', days: 3, overlap: true, submitted: '04 Oct 2026', status: 'Pending' },
  { id: 'LR-2', employee: 'Charlie Davis', type: 'Earned Leave', dates: '01 Sep 2026 - 02 Sep 2026', days: 2, overlap: false, submitted: '15 Aug 2026', status: 'Approved' },
];

export const LeaveApprovalsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');

  const columns: Column<ApprovalRequest>[] = [
    { key: 'employee', header: 'Employee', render: (row) => row.employee },
    { key: 'type', header: 'Leave Type', render: (row) => row.type },
    { key: 'dates', header: 'Dates', render: (row) => row.dates },
    { key: 'days', header: 'Days', render: (row) => row.days.toString() },
    { 
      key: 'overlap', 
      header: 'Overlap Flag', 
      render: (row) => row.overlap ? <span className="text-amber-600 font-medium">⚠️ Overlap</span> : '-' 
    },
    { key: 'submitted', header: 'Submitted', render: (row) => row.submitted },
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
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {row.status === 'Pending' && (
            <>
              <Button size="sm" variant="tertiary" onClick={() => alert('Approved')}>Approve</Button>
              <Button size="sm" variant="tertiary" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => alert('Rejected')}>Reject</Button>
            </>
          )}
          <Button size="sm" variant="subtle" onClick={() => alert('View Details')}>View</Button>
        </div>
      ),
    },
  ];

  const filtered = mockRequests.filter(r => r.status === activeTab);
  const pendingCount = mockRequests.filter(r => r.status === 'Pending').length;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Leave Approvals</h1>
        <p className="text-sm text-gray-500 mt-1">Review and manage employee leave requests</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200 mb-4">
          {(['Pending', 'Approved', 'Rejected'] as const).map(tab => (
            <button
              key={tab}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === tab 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab} {tab === 'Pending' && <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{pendingCount}</span>}
            </button>
          ))}
        </div>

        <Table columns={columns} data={filtered} keyExtractor={(row) => row.id} />
      </div>
    </div>
  );
};
