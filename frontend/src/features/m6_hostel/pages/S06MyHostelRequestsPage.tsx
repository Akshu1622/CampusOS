import React, { useState } from 'react'
import { Card, Select, StatusPill, Button } from '@/components/ui'
import { useMyRequests } from '../hooks'
import { Link } from 'react-router-dom'
import type { RequestStatus } from '../api'

export function S06MyHostelRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<RequestStatus | ''>('')
  const { data: requests = [], isLoading } = useMyRequests(statusFilter || undefined)

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'APPROVED': return 'success'
      case 'REJECTED': return 'error'
      case 'PENDING': return 'warning'
      default: return 'neutral'
    }
  }

  const formatType = (type: string) => {
    return type.replace('_', ' ')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Hostel Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Track the status of your accommodation requests.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as any)}
            options={[
              { label: 'All Requests', value: '' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Approved', value: 'APPROVED' },
              { label: 'Rejected', value: 'REJECTED' }
            ]}
          />
          <Link to="/student/hostel/new-request">
            <Button>New Request</Button>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2].map(i => <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>)}
          </div>
        ) : requests.length === 0 ? (
          <Card className="text-center py-12">
            <h3 className="text-gray-900 font-medium">No requests found</h3>
            <p className="text-gray-500 text-sm mt-1">You haven't submitted any hostel requests yet.</p>
          </Card>
        ) : (
          requests.map(req => (
            <Card key={req.id}>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-4 flex-1">
                  <div className="flex items-start justify-between sm:justify-start gap-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Request Type</div>
                      <div className="text-lg font-semibold text-gray-900 capitalize">{formatType(req.request_type)}</div>
                    </div>
                    <div className="sm:hidden">
                      <StatusPill label={req.status} status={getStatusColor(req.status)} />
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Details & Reason</div>
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md min-h-[3rem]">
                      {req.details || <span className="italic text-gray-400">No additional details provided.</span>}
                    </div>
                  </div>

                  {req.remark && (
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                      <div className="text-xs font-medium text-blue-800 mb-1">Admin Remark</div>
                      <div className="text-sm text-blue-900">{req.remark}</div>
                    </div>
                  )}
                </div>

                <div className="hidden sm:flex flex-col items-end justify-between min-w-[150px] border-l pl-4">
                  <StatusPill label={req.status} status={getStatusColor(req.status)} />
                  
                  {req.status === 'PENDING' && (
                    <div className="text-xs text-gray-400 mt-auto">
                      Under Review
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
