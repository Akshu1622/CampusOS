import React from 'react';
import { Table, type Column } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

interface PayrollRecord {
  id: string;
  employee: string;
  department: string;
  gross: number;
  deductions: number;
  net: number;
}

const mockRecords: PayrollRecord[] = [
  { id: '1', employee: 'Alice Smith', department: 'Computer Science', gross: 150000, deductions: 25000, net: 125000 },
  { id: '2', employee: 'Bob Jones', department: 'Mathematics', gross: 120000, deductions: 18000, net: 102000 },
  { id: '3', employee: 'Charlie Davis', department: 'Admin', gross: 80000, deductions: 10000, net: 70000 },
];

export const PayrollRegisterPage: React.FC = () => {
  const columns: Column<PayrollRecord>[] = [
    { key: 'employee', header: 'Employee', render: (row) => row.employee },
    { key: 'department', header: 'Department', render: (row) => row.department },
    { key: 'gross', header: 'Gross Pay', render: (row) => `₹${row.gross.toLocaleString()}` },
    { key: 'deductions', header: 'Deductions', render: (row) => `₹${row.deductions.toLocaleString()}` },
    { key: 'net', header: 'Net Pay', render: (row) => <span className="font-medium">₹{row.net.toLocaleString()}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payroll Register</h1>
          <p className="text-sm text-gray-500 mt-1">View finalized payroll reports</p>
        </div>
        <div>
          <Button variant="tertiary">Export CSV</Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-4 mb-6">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Month</label>
            <Input type="month" defaultValue="2026-09" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Department</label>
            <select className="rounded-md border border-gray-300 p-2 h-[42px] min-w-[150px]">
              <option>All Departments</option>
              <option>Computer Science</option>
              <option>Mathematics</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button>Apply</Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="border-l-4 border-blue-500 pl-3">
            <div className="text-sm text-gray-500">Net Payout</div>
            <div className="text-xl font-bold">₹297,000</div>
          </div>
          <div className="border-l-4 border-gray-300 pl-3">
            <div className="text-sm text-gray-500">Gross Pay</div>
            <div className="text-xl font-bold">₹350,000</div>
          </div>
          <div className="border-l-4 border-gray-300 pl-3">
            <div className="text-sm text-gray-500">Deductions</div>
            <div className="text-xl font-bold">₹53,000</div>
          </div>
          <div className="border-l-4 border-gray-300 pl-3">
            <div className="text-sm text-gray-500">Headcount</div>
            <div className="text-xl font-bold">3</div>
          </div>
        </div>

        <Table columns={columns} data={mockRecords} keyExtractor={(row) => row.id} />
      </div>
    </div>
  );
};
