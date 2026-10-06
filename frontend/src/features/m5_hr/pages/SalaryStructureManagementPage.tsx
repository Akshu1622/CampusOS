import React from 'react';
import { Table, type Column } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';

interface SalaryStructure {
  id: string;
  name: string;
  earnings: number;
  deductions: number;
  gross: number;
  status: 'Active' | 'Inactive';
}

const mockStructures: SalaryStructure[] = [
  { id: '1', name: 'Professor Base Level 1', earnings: 150000, deductions: 25000, gross: 150000, status: 'Active' },
  { id: '2', name: 'Associate Professor Base Level 1', earnings: 120000, deductions: 18000, gross: 120000, status: 'Active' },
  { id: '3', name: 'Assistant Professor Base Level 1', earnings: 80000, deductions: 10000, gross: 80000, status: 'Active' },
];

export const SalaryStructureManagementPage: React.FC = () => {
  const columns: Column<SalaryStructure>[] = [
    { key: 'name', header: 'Structure Name', render: (row) => row.name },
    { key: 'earnings', header: 'Total Earnings', render: (row) => `₹${row.earnings.toLocaleString()}` },
    { key: 'deductions', header: 'Total Deductions', render: (row) => `₹${row.deductions.toLocaleString()}` },
    { key: 'gross', header: 'Gross Salary', render: (row) => `₹${row.gross.toLocaleString()}` },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
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
          <h1 className="text-2xl font-semibold text-gray-900">Salary Structure Management</h1>
          <p className="text-sm text-gray-500 mt-1">Define and manage payroll structures</p>
        </div>
        <div>
          <Button>Create Structure</Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <Table columns={columns} data={mockStructures} keyExtractor={(row) => row.id} />
      </div>
    </div>
  );
};
