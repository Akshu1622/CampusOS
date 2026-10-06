import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Alert } from '../../../components/ui/Alert';

export const FeeAssignmentWizardPage: React.FC = () => {
  const [step, setStep] = useState(1);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Fee Assignment Wizard</h1>
          <p className="text-sm text-gray-500 mt-1">Generate invoices for students based on fee structures.</p>
        </div>
      </div>

      <div className="flex space-x-2 mb-6">
        <div className={`h-2 flex-1 rounded ${step >= 1 ? 'bg-amber-600' : 'bg-gray-200'}`}></div>
        <div className={`h-2 flex-1 rounded ${step >= 2 ? 'bg-amber-600' : 'bg-gray-200'}`}></div>
        <div className={`h-2 flex-1 rounded ${step >= 3 ? 'bg-amber-600' : 'bg-gray-200'}`}></div>
      </div>

      <Card>
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Step 1: Select Scope</h2>
            <div className="grid grid-cols-2 gap-4">
              <Select options={[{ value: 'cs', label: 'B.Tech Computer Science' }]} label="Program" />
              <Select options={[{ value: 'f26', label: 'Fall 2026' }]} label="Term" />
            </div>
            <div className="pt-4 flex justify-end">
              <Button variant="primary" onClick={() => setStep(2)}>Next: Preview</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Step 2: Preview Assignment</h2>
            <Alert variant="warning" title="Duplicate Assignments Skipped">
              2 students already have this fee assigned and will be skipped.
            </Alert>
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="bg-gray-50 p-4 rounded text-center">
                <div className="text-2xl font-bold text-gray-900">128</div>
                <div className="text-sm text-gray-500">Students Included</div>
              </div>
              <div className="bg-gray-50 p-4 rounded text-center">
                <div className="text-2xl font-bold text-gray-900">₹55,000</div>
                <div className="text-sm text-gray-500">Amount Per Student</div>
              </div>
              <div className="bg-amber-50 p-4 rounded text-center border border-amber-100">
                <div className="text-2xl font-bold text-amber-700">₹70.4L</div>
                <div className="text-sm text-amber-600">Total Invoice Value</div>
              </div>
            </div>
            <div className="pt-4 flex justify-between">
              <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
              <Button variant="primary" onClick={() => setStep(3)}>Generate Invoices</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-center py-8">
            <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 className="text-xl font-medium">Assignment Complete</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Successfully generated 128 invoices for B.Tech Computer Science (Fall 2026).
            </p>
            <div className="pt-6">
              <Button variant="secondary" onClick={() => setStep(1)}>New Assignment</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
