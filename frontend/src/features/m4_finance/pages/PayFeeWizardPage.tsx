import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export const PayFeeWizardPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      window.location.href = '/student/receipt/REC-001';
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Make Payment</h1>
          <p className="text-sm text-gray-500 mt-1">Complete your fee payment securely.</p>
        </div>
      </div>

      <div className="flex space-x-2 mb-6">
        <div className={`h-2 flex-1 rounded ${step >= 1 ? 'bg-amber-600' : 'bg-gray-200'}`}></div>
        <div className={`h-2 flex-1 rounded ${step >= 2 ? 'bg-amber-600' : 'bg-gray-200'}`}></div>
      </div>

      <Card>
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium border-b pb-2">Step 1: Payment Mode & Review</h2>
            
            <div className="bg-gray-50 p-4 rounded-md space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Base Amount</span>
                <span>₹50,000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Late Fee</span>
                <span className="text-red-600">₹250</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                <span>Total Payable</span>
                <span>₹50,250</span>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-sm mb-3">Select Payment Mode</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-amber-500 bg-amber-50 p-4 rounded cursor-pointer flex items-center justify-center font-medium">
                  Credit / Debit Card
                </div>
                <div className="border border-gray-200 p-4 rounded cursor-pointer flex items-center justify-center font-medium hover:bg-gray-50">
                  Net Banking
                </div>
                <div className="border border-gray-200 p-4 rounded cursor-pointer flex items-center justify-center font-medium hover:bg-gray-50">
                  UPI
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button variant="primary" onClick={() => setStep(2)}>Next: Confirm</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 text-center py-4">
            <h2 className="text-lg font-medium">Confirm Payment</h2>
            
            <div className="text-4xl font-bold text-gray-900 my-6">₹50,250</div>
            
            <p className="text-sm text-gray-500 mb-8">
              By clicking pay, you authorize this transaction via Credit Card.
            </p>

            <div className="flex justify-center space-x-4">
              <Button variant="secondary" onClick={() => setStep(1)} disabled={isProcessing}>Back</Button>
              <Button variant="primary" onClick={handlePay} disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Pay ₹50,250'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
