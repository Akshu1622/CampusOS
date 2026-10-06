import React from 'react';
import { Table, type Column } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';

interface LeaveType {
  id: string;
  name: string;
  entitlement: number;
  carryForward: string;
  applicability: string;
}

const mockLeaveTypes: LeaveType[] = [
  { id: '1', name: 'Casual Leave', entitlement: 12, carryForward: 'No', applicability: 'All' },
  { id: '2', name: 'Sick Leave', entitlement: 10, carryForward: 'Up to 5', applicability: 'All' },
  { id: '3', name: 'Earned Leave', entitlement: 15, carryForward: 'Yes', applicability: 'Faculty' },
  { id: '4', name: 'Maternity Leave', entitlement: 180, carryForward: 'No', applicability: 'Female Employees' },
];

export const LeaveTypePolicyPage: React.FC = () => {
  const columns: Column<LeaveType>[] = [
    { key: 'name', header: 'Leave Name', render: (row) => row.name },
    { key: 'entitlement', header: 'Annual Entitlement', render: (row) => row.entitlement.toString() },
    { key: 'carryForward', header: 'Carry Forward', render: (row) => row.carryForward },
    { key: 'applicability', header: 'Applicability', render: (row) => row.applicability },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button variant="tertiary" size="sm" onClick={() => alert(`Edit ${row.name}`)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Leave Types & Policy</h1>
          <p className="text-sm text-gray-500 mt-1">Configure leave types, entitlements, and rules</p>
        </div>
        <div>
          <Button>Add Leave Type</Button>
        </div>
      </div>
      <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-4">
        Info: Balances are calculated from entitlement minus approved leave.
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <Table columns={columns} data={mockLeaveTypes} keyExtractor={(row) => row.id} />
      </div>
    </div>
  );
};
