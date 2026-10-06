import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export const ApplyLeavePage: React.FC = () => {
  const [leaveType, setLeaveType] = useState('casual');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');

  const getBalance = (type: string) => {
    switch(type) {
      case 'casual': return 8;
      case 'sick': return 5;
      case 'earned': return 15;
      default: return 0;
    }
  };

  const calculateDays = () => {
    if (!fromDate || !toDate) return 0;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const days = calculateDays();
  const balance = getBalance(leaveType);
  const sufficientBalance = balance >= days;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Apply for Leave</h1>
        <p className="text-sm text-gray-500 mt-1">Submit a new leave request</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Leave Type <span className="text-red-500">*</span>
          </label>
          <select 
            className="w-full rounded-md border border-gray-300 p-2"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
          >
            <option value="casual">Casual Leave (Balance: 8)</option>
            <option value="sick">Sick Leave (Balance: 5)</option>
            <option value="earned">Earned Leave (Balance: 15)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date <span className="text-red-500">*</span>
            </label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date <span className="text-red-500">*</span>
            </label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea 
            className="w-full rounded-md border border-gray-300 p-2" 
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {days > 0 && (
          <div className={`p-4 rounded-lg text-sm ${sufficientBalance ? 'bg-blue-50 text-blue-800' : 'bg-red-50 text-red-800'}`}>
            <p><strong>Impact:</strong> You are requesting {days} days of {leaveType} leave.</p>
            <p>Balance before: {balance} → Balance after: {balance - days}</p>
            {!sufficientBalance && (
              <p className="mt-2 font-bold flex items-center">
                Insufficient leave balance for this request!
              </p>
            )}
          </div>
        )}

        <div className="flex gap-4 justify-end pt-4">
          <Button variant="tertiary">Cancel</Button>
          <Button disabled={!sufficientBalance || days <= 0 || !reason} onClick={() => alert('Leave submitted')}>Submit Request</Button>
        </div>
      </div>
    </div>
  );
};
