import React from 'react';
import { Table, type Column } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';

interface Designation {
  id: string;
  title: string;
  level: string;
  employees: number;
  status: 'Active' | 'Inactive';
}

const mockDesignations: Designation[] = [
  { id: '1', title: 'Professor', level: 'L1', employees: 12, status: 'Active' },
  { id: '2', title: 'Associate Professor', level: 'L2', employees: 25, status: 'Active' },
  { id: '3', title: 'Assistant Professor', level: 'L3', employees: 40, status: 'Active' },
  { id: '4', title: 'HR Manager', level: 'M1', employees: 2, status: 'Active' },
];

export const DesignationManagementPage: React.FC = () => {
  const columns: Column<Designation>[] = [
    { key: 'title', header: 'Title', render: (row) => row.title },
    { key: 'level', header: 'Level', render: (row) => row.level },
    { key: 'employees', header: '# Employees', render: (row) => row.employees.toString() },
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
        <Button variant="tertiary" size="sm" onClick={() => alert(`Edit ${row.title}`)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Designation Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage job titles and levels</p>
        </div>
        <div>
          <Button>Add Designation</Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <Table columns={columns} data={mockDesignations} keyExtractor={(row) => row.id} />
      </div>
    </div>
  );
};
