import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';

export const PayrollRunPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [month, setMonth] = useState('2026-10');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Payroll Run</h1>
        <p className="text-sm text-gray-500 mt-1">Process and finalize monthly payroll</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-8">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex flex-col items-center flex-1 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {s}
              </div>
              <div className="text-xs mt-2 text-gray-600 text-center">
                {s === 1 ? 'Select Month' : s === 2 ? 'Pre-checks' : s === 3 ? 'Review' : 'Finalize'}
              </div>
              {s < 4 && <div className={`absolute top-4 left-1/2 w-full h-0.5 -z-10 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`}></div>}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">1. Select Month</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payroll Month</label>
              <input 
                type="month" 
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="rounded-md border border-gray-300 p-2 w-64"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">2. Pre-checks</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded">
                <span>✅</span> 45 Employees included
              </div>
              <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded">
                <span>✅</span> Leave adjustments synced
              </div>
              <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-3 rounded">
                <span>⚠️</span> 1 Employee missing salary structure (Ignored in run)
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">3. Run & Review</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 p-4 rounded text-center">
                <div className="text-sm text-gray-500">Total Gross</div>
                <div className="text-xl font-bold">₹4,250,000</div>
              </div>
              <div className="bg-gray-50 p-4 rounded text-center">
                <div className="text-sm text-gray-500">Total Deductions</div>
                <div className="text-xl font-bold">₹540,000</div>
              </div>
              <div className="bg-gray-50 p-4 rounded text-center">
                <div className="text-sm text-gray-500">Net Payout</div>
                <div className="text-xl font-bold text-blue-600">₹3,710,000</div>
              </div>
            </div>
            <div className="text-sm text-gray-500 text-center">
              (Preview table of 45 employees would be here)
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 text-center">
            <h3 className="text-lg font-medium">4. Finalize Payroll</h3>
            <div className="bg-red-50 text-red-700 p-4 rounded-md mx-auto max-w-md">
              <p className="font-bold mb-2">Warning: Irreversible Action</p>
              <p className="text-sm">Finalizing payroll for {month} will lock the records and generate payslips for all included employees. This cannot be undone.</p>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8 pt-4 border-t border-gray-200">
          <Button variant="tertiary" disabled={step === 1} onClick={() => setStep(step - 1)}>Back</Button>
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)}>Next Step</Button>
          ) : (
            <Button onClick={() => alert('Payroll Finalized!')}>Finalize Payroll</Button>
          )}
        </div>
      </div>
    </div>
  );
};
