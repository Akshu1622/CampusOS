import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

interface LateFeeRule {
  id: string;
  type: string;
  amount: number;
  graceDays: number;
  cap: number;
  status: string;
}

export const LateFeeRuleConfigPage: React.FC = () => {
  const [rules] = useState<LateFeeRule[]>([
    {
      id: 'LFR01',
      type: 'Per-day',
      amount: 50,
      graceDays: 5,
      cap: 2000,
      status: 'Active',
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Late Fee Rules</h1>
          <p className="text-sm text-gray-500 mt-1">Configure penalty rules for overdue fee payments.</p>
        </div>
        <Button variant="primary" icon="Plus">New Rule</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rules.map(rule => (
          <Card key={rule.id}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{rule.type} Rule</h3>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${rule.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {rule.status}
                </span>
              </div>
              <Button variant="tertiary" size="sm">Edit</Button>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 mb-6">
              <div className="flex justify-between"><span className="text-gray-500">Amount:</span> <span>₹{rule.amount}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Grace Days:</span> <span>{rule.graceDays} days</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Max Cap:</span> <span>₹{rule.cap}</span></div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-md p-3 text-sm text-amber-800">
              <strong className="block mb-1 font-semibold">Example Calculation:</strong>
              If paid 10 days late on ₹50,000 → <strong>₹{(10 - rule.graceDays) * rule.amount} penalty</strong>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
