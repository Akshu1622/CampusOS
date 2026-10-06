import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export const PaymentConfirmationReceiptPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 text-green-700 rounded-full p-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div>
            <h2 className="text-green-800 font-semibold">Payment Successful</h2>
            <p className="text-green-600 text-sm">Receipt REC-001 has been generated.</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" icon="Download">Download PDF</Button>
          <Button variant="secondary">Print</Button>
        </div>
      </div>

      <Card className="bg-white p-12 print-friendly">
        {/* Receipt Header */}
        <div className="flex justify-between items-start border-b pb-8 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CampusOS University</h1>
            <p className="text-gray-500 mt-1">123 Education Lane, Knowledge City</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl text-gray-300 font-bold uppercase tracking-wider">Receipt</h2>
            <p className="font-mono text-gray-900 mt-2">REC-001</p>
            <p className="text-sm text-gray-500">Date: 2026-08-16</p>
          </div>
        </div>

        {/* Student Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-sm text-gray-500 mb-1">Received From:</p>
            <p className="font-semibold text-gray-900">John Doe</p>
            <p className="text-sm text-gray-600">ID: STU2025001</p>
            <p className="text-sm text-gray-600">B.Tech Computer Science</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Payment Mode:</p>
            <p className="font-medium text-gray-900">Credit Card (**** 1234)</p>
          </div>
        </div>

        {/* Line Items */}
        <table className="w-full text-left mb-8">
          <thead>
            <tr className="border-b text-gray-500 text-sm">
              <th className="pb-3 font-medium">Description</th>
              <th className="pb-3 font-medium">Term</th>
              <th className="pb-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr className="border-b">
              <td className="py-4">Tuition Fee</td>
              <td className="py-4 text-gray-600">Fall 2026</td>
              <td className="py-4 text-right">₹50,000</td>
            </tr>
            <tr className="border-b">
              <td className="py-4">Late Fee Penalty</td>
              <td className="py-4 text-gray-600">-</td>
              <td className="py-4 text-right">₹250</td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>₹50,250</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-3">
              <span>Total Paid</span>
              <span>₹50,250</span>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t text-center text-sm text-gray-500">
          <p>This is a computer-generated receipt and does not require a signature.</p>
        </div>
      </Card>

      <div className="text-center pt-4">
        <a href="/student/fees" className="text-amber-600 hover:underline font-medium">← Back to My Fees</a>
      </div>
    </div>
  );
};
