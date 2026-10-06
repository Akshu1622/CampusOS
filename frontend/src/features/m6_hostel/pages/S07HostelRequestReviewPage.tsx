import React, { useState } from 'react'
import { Card, Table, type Column, StatusPill, Button, Modal, Input, Select } from '@/components/ui'
import { useAllRequests, useDecideRequest } from '../hooks'
import { getStudents } from '../api'
import { useQuery } from '@tanstack/react-query'
import type { HostelRequest, RequestStatus } from '../api'
import { useNavigate } from 'react-router-dom'

export function S07HostelRequestReviewPage() {
  const [activeTab, setActiveTab] = useState<RequestStatus>('PENDING')
  const { data: requests = [], isLoading: reqLoading } = useAllRequests(activeTab)
  
  const { data: students = [], isLoading: stuLoading } = useQuery({
    queryKey: ['students_all'],
    queryFn: getStudents
  })

  const decideRequest = useDecideRequest()
  const navigate = useNavigate()

  const [selectedReq, setSelectedReq] = useState<HostelRequest | null>(null)
  const [remark, setRemark] = useState('')

  const handleDecision = (status: RequestStatus) => {
    if (!selectedReq) return
    decideRequest.mutate(
      { id: selectedReq.id, data: { status, remark } },
      {
        onSuccess: () => {
          const reqType = selectedReq.request_type
          const sId = selectedReq.student_id
          setSelectedReq(null)
          setRemark('')
          
          if (status === 'APPROVED' && reqType !== 'VACATE') {
            // Suggest allocating
            if (window.confirm('Request approved. Do you want to proceed to allocate a room now?')) {
              navigate('/admin/hostel/room-allocation')
            }
          }
        }
      }
    )
  }

  const columns: Column<HostelRequest>[] = [
    { 
      header: 'Student', 
      key: 'student_id', 
      render: (r) => {
        const student = students.find((s: any) => s.id === r.student_id)
        return (
          <div>
            <div className="font-medium text-gray-900">{student?.name || `ID: ${r.student_id}`}</div>
            <div className="text-xs text-gray-500">{student?.university_id}</div>
          </div>
        )
      } 
    },
    { header: 'Type', key: 'request_type', render: (r) => <span className="capitalize">{r.request_type.replace('_', ' ')}</span> },
    { header: 'Details', key: 'details', render: (r) => <div className="max-w-xs truncate text-sm">{r.details || '-'}</div> },
    { 
      header: 'Status', 
      key: 'status', 
      render: (r) => (
        <StatusPill 
          label={r.status} 
          status={r.status === 'APPROVED' ? 'success' : r.status === 'REJECTED' ? 'error' : 'warning'} 
        />
      ) 
    },
    {
      header: 'Action',
      key: 'actions',
      render: (r) => (
        <Button variant="tertiary" size="sm" onClick={() => { setSelectedReq(r); setRemark(r.remark || '') }}>
          Review
        </Button>
      )
    }
  ]

  const isLoading = reqLoading || stuLoading
  const studentInfo = selectedReq ? students.find((s: any) => s.id === selectedReq.student_id) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Hostel Request Review</h1>
        <p className="text-sm text-gray-500 mt-1">Review and approve student accommodation requests.</p>
      </div>

      <div className="flex border-b">
        {(['PENDING', 'APPROVED', 'REJECTED'] as RequestStatus[]).map(tab => (
          <button
            key={tab}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 -mb-[1px] ${activeTab === tab ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <Card padding="none">
        <Table 
          data={requests} 
          columns={columns} 
          keyExtractor={(r) => r.id.toString()}
          isLoading={isLoading}
          emptyMessage={`No ${activeTab.toLowerCase()} requests found.`}
        />
      </Card>

      <Modal isOpen={!!selectedReq} onClose={() => setSelectedReq(null)} title="Review Request">
        {selectedReq && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg flex items-start gap-4 border">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                {studentInfo?.name?.charAt(0) || 'S'}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{studentInfo?.name || 'Unknown Student'}</h3>
                <div className="text-sm text-gray-500">{studentInfo?.university_id} • {studentInfo?.program_id}</div>
                <div className="mt-2 text-sm">
                  <span className="font-medium">Request Type: </span> 
                  {selectedReq.request_type.replace('_', ' ')}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student's Details & Reason</label>
              <div className="text-sm text-gray-600 bg-gray-50 border p-3 rounded-md min-h-[4rem]">
                {selectedReq.details || <span className="italic text-gray-400">No additional details provided.</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Remark (Required for Rejection)</label>
              <textarea 
                rows={3} 
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                placeholder="Add notes or reason for decision..."
                value={remark}
                onChange={e => setRemark(e.target.value)}
                disabled={selectedReq.status !== 'PENDING'}
              />
            </div>

            {selectedReq.status === 'PENDING' ? (
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="tertiary" onClick={() => setSelectedReq(null)}>Cancel</Button>
                <Button 
                  variant="secondary" 
                  className="!text-red-600 !border-red-200 hover:!bg-red-50"
                  disabled={!remark.trim() || decideRequest.isPending}
                  onClick={() => handleDecision('REJECTED')}
                >
                  Reject Request
                </Button>
                <Button 
                  isLoading={decideRequest.isPending}
                  onClick={() => handleDecision('APPROVED')}
                >
                  Approve
                </Button>
              </div>
            ) : (
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={() => setSelectedReq(null)}>Close</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
