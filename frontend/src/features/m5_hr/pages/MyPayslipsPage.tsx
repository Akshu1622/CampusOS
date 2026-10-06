import React from 'react';
import { Button } from '../../../components/ui/Button';

interface Payslip {
  month: string;
  net: number;
  gross: number;
  deductions: number;
  status: string;
}

const mockPayslips: Payslip[] = [
  { month: 'September 2026', net: 125000, gross: 150000, deductions: 25000, status: 'Finalized' },
  { month: 'August 2026', net: 125000, gross: 150000, deductions: 25000, status: 'Finalized' },
  { month: 'July 2026', net: 120000, gross: 145000, deductions: 25000, status: 'Finalized' },
];

export const MyPayslipsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Payslips</h1>
        <p className="text-sm text-gray-500 mt-1">View and download your monthly payslips</p>
      </div>

      <div className="space-y-4">
        {mockPayslips.map((slip, index) => (
          <div key={slip.month} className={`bg-white p-5 rounded-lg border ${index === 0 ? 'border-blue-300 shadow-md relative' : 'border-gray-200 shadow-sm'}`}>
            {index === 0 && (
              <div className="absolute top-0 right-0 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-bl-lg rounded-tr-lg font-medium">
                Latest
              </div>
            )}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{slip.month}</h3>
                <div className="text-sm text-gray-500 mt-1 flex gap-4">
                  <span>Gross: ₹{slip.gross.toLocaleString()}</span>
                  <span>Deductions: ₹{slip.deductions.toLocaleString()}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 mb-2">₹{slip.net.toLocaleString()}</div>
                <div className="flex gap-2 justify-end">
                  <Button variant="tertiary" size="sm" onClick={() => alert('View Payslip')}>View</Button>
                  <Button size="sm" onClick={() => alert('Download PDF')}>Download</Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
