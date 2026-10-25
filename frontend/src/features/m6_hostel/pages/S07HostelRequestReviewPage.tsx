import React, { useState } from 'react'
import { Card, StatCard, Table, type Column, StatusPill, Button, Drawer, Input } from '@/components/ui'
import { useAllRequests, useDecideRequest } from '../hooks'
import { getStudents } from '../api'
import { useQuery } from '@tanstack/react-query'
import type { HostelRequest, RequestStatus } from '../api'
import { useNavigate } from 'react-router-dom'
import { Home, Clock, CheckCircle, X, Check, ShieldAlert, User, FileText } from 'lucide-react'

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
          setSelectedReq(null)
          setRemark('')
          
          if (status === 'APPROVED' && reqType !== 'VACATE') {
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--color-chip-people-bg)',
              color: 'var(--color-chip-people-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '11px'
            }}>
              {(student?.name || 'S').charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{student?.name || `Student #${r.student_id}`}</div>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{student?.university_id}</div>
            </div>
          </div>
        )
      } 
    },
    {
      header: 'Request Nature',
      key: 'request_type',
      render: (r) => (
        <span style={{ fontWeight: 600 }}>{r.request_type.replace('_', ' ')}</span>
      )
    },
    {
      header: 'Submission Date',
      key: 'created_at',
      render: (r) => <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</span>
    },
    {
      header: 'Applicant Remarks',
      key: 'details',
      render: (r) => (
        <div style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--color-text-muted)' }}>
          {r.details || '—'}
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (r) => (
        <StatusPill
          label={r.status}
          status={r.status === 'APPROVED' ? 'success' : r.status === 'PENDING' ? 'warning' : 'error'}
        />
      )
    },
    {
      header: 'Actions',
      key: 'id',
      render: (r) => (
        <Button variant="subtle" size="sm" onClick={() => { setSelectedReq(r); setRemark(r.reviewer_notes || r.remark || '') }}>
          Review
        </Button>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
            HOS-07
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            Hostel Application Review Desk
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Warden office console to sanction room allocation, transfer, and vacate requests.
        </p>
      </div>

      {/* StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Pending Sanction"
          value={activeTab === 'PENDING' ? requests.length : '—'}
          tone="accent"
          icon={<Clock size={18} />}
          description="In warden queue"
        />
        <StatCard
          label="Current Review Filter"
          value={activeTab}
          tone="neutral"
          icon={<Home size={18} />}
          description="Click tabs below to switch"
        />
        <StatCard
          label="SLA Compliance"
          value="< 48 Hrs"
          tone="positive"
          icon={<CheckCircle size={18} />}
          description="Average decision turnaround"
        />
      </div>

      {/* Tabs & Table */}
      <Card padding={0}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border)',
          padding: '0 16px',
          background: 'var(--color-surface)'
        }}>
          {(['PENDING', 'APPROVED', 'REJECTED'] as RequestStatus[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '14px 20px',
                border: 'none',
                background: 'transparent',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <Table
          data={requests}
          columns={columns}
          keyExtractor={(r) => r.id.toString()}
          isLoading={reqLoading || stuLoading}
          emptyMessage="No requests found in this review queue."
        />
      </Card>

      {/* Review Drawer */}
      <Drawer
        isOpen={!!selectedReq}
        onClose={() => setSelectedReq(null)}
        title={selectedReq ? `Review Application #${selectedReq.id}` : ''}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setSelectedReq(null)}>Close</Button>
            {selectedReq?.status === 'PENDING' && (
              <>
                <Button variant="danger" onClick={() => handleDecision('REJECTED')}>
                  Reject Request
                </Button>
                <Button variant="primary" onClick={() => handleDecision('APPROVED')}>
                  Approve & Allot
                </Button>
              </>
            )}
          </div>
        }
      >
        {selectedReq && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>APPLICATION TYPE</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {selectedReq.request_type.replace('_', ' ')}
                </div>
              </div>
              <StatusPill label={selectedReq.status} status={selectedReq.status === 'APPROVED' ? 'success' : selectedReq.status === 'PENDING' ? 'warning' : 'error'} />
            </div>

            <div>
              <h4 style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                APPLICANT NOTES
              </h4>
              <div style={{
                padding: '12px',
                borderRadius: '6px',
                background: 'var(--color-surface-subtle)',
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.5
              }}>
                {selectedReq.details || 'No additional remarks submitted.'}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
                Warden Office Endorsement Notes
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={3}
                placeholder="Optional notes or condition of allotment..."
                style={{
                  width: '100%',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  padding: '10px 12px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  color: 'var(--color-text-primary)',
                  background: 'var(--color-surface)',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
