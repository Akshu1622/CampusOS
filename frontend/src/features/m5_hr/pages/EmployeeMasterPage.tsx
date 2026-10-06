import React, { useState } from 'react';
import { Table, type Column } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

interface Employee {
  id: string;
  name: string;
  department: string;
  designation: string;
  type: string;
  status: 'Active' | 'On Leave' | 'Terminated';
}

const mockEmployees: Employee[] = [
  { id: 'EMP001', name: 'Alice Smith', department: 'Computer Science', designation: 'Professor', type: 'Faculty', status: 'Active' },
  { id: 'EMP002', name: 'Bob Jones', department: 'Mathematics', designation: 'Associate Professor', type: 'Faculty', status: 'On Leave' },
  { id: 'EMP003', name: 'Charlie Davis', department: 'Admin', designation: 'HR Manager', type: 'Staff', status: 'Active' }
];

export const EmployeeMasterPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const columns: Column<Employee>[] = [
    { key: 'id', header: 'ID', render: (row) => row.id },
    { key: 'name', header: 'Name', render: (row) => row.name },
    { key: 'department', header: 'Department', render: (row) => row.department },
    { key: 'designation', header: 'Designation', render: (row) => row.designation },
    { key: 'type', header: 'Type', render: (row) => row.type },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.status === 'Active'
              ? 'bg-green-100 text-green-800'
              : row.status === 'On Leave'
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
        <Button variant="tertiary" size="sm" onClick={() => alert(`View ${row.id}`)}>
          View
        </Button>
      ),
    },
  ];

  const filtered = mockEmployees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.id.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Employee Master</h1>
          <p className="text-sm text-gray-500 mt-1">Manage faculty and staff records</p>
        </div>
        <div>
          <Button>Add Employee</Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-4 mb-4">
          <Input
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-80"
          />
        </div>
        <Table columns={columns} data={filtered} keyExtractor={(row) => row.id} />
      </div>
    </div>
  );
};
