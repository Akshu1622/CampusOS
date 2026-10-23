import React, { useState } from 'react'
import { Card, StatCard, Button, Table, type Column, StatusPill, Drawer } from '@/components/ui'
import { Check, X, AlertTriangle, Clock, Calendar, CheckCircle, ShieldAlert, User, FileText } from 'lucide-react'

interface ApprovalRequest {
  id: string
  employee: string
  department: string
  type: string
  dates: string
  days: number
  overlap: boolean
  overlapDetails?: string
  submitted: string
  reason: string
  status: 'Pending' | 'Approved' | 'Rejected'
}

const mockRequests: ApprovalRequest[] = [
  { id: 'LR-101', employee: 'Dr. Ramesh Kumar', department: 'Computer Science', type: 'Casual Leave', dates: '26 Oct 2026 - 28 Oct 2026', days: 3, overlap: false, submitted: '2026-10-21', reason: 'Attending IEEE international conference as keynote chair.', status: 'Pending' },
  { id: 'LR-102', employee: 'Prof. Sunita Rao', department: 'Electrical Engineering', type: 'Sick Leave', dates: '25 Oct 2026 - 26 Oct 2026', days: 2, overlap: true, overlapDetails: 'Conflicts with Mid-Term invigilation duty slot #3', submitted: '2026-10-22', reason: 'Medical recovery following acute fever.', status: 'Pending' },
  { id: 'LR-103', employee: 'Vikram Joshi', department: 'Mechanical Engineering', type: 'Earned Leave', dates: '10 Nov 2026 - 15 Nov 2026', days: 5, overlap: false, submitted: '2026-10-18', reason: 'Family commitment and personal travel.', status: 'Approved' },
  { id: 'LR-104', employee: 'Neha Gupta', department: 'Civil Engineering', type: 'Casual Leave', dates: '14 Oct 2026 - 15 Oct 2026', days: 2, overlap: false, submitted: '2026-10-10', reason: 'Personal work at hometown.', status: 'Rejected' },
]

export const LeaveApprovalsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending')
  const [requests, setRequests] = useState<ApprovalRequest[]>(mockRequests)
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  const handleDecision = (id: string, newStatus: 'Approved' | 'Rejected') => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
    setNotification(`Leave request ${id} marked as ${newStatus}.`)
    setSelectedRequest(null)
    setTimeout(() => setNotification(null), 3500)
  }

  const pendingRequests = requests.filter(r => r.status === 'Pending')
  const approvedRequests = requests.filter(r => r.status === 'Approved')
  const rejectedRequests = requests.filter(r => r.status === 'Rejected')
  const overlappingCount = requests.filter(r => r.overlap && r.status === 'Pending').length

  const filtered = requests.filter(r => r.status === activeTab)

  const columns: Column<ApprovalRequest>[] = [
    {
      header: 'Employee',
      key: 'employee',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--color-chip-people-bg)',
            color: 'var(--color-chip-people-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '12px'
          }}>
            {r.employee.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.employee}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{r.department}</div>
          </div>
        </div>
      )
    },
    { header: 'Leave Category', key: 'type', render: (r) => <span style={{ fontWeight: 500 }}>{r.type}</span> },
    {
      header: 'Duration & Dates',
      key: 'dates',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.dates}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{r.days} Working {r.days === 1 ? 'Day' : 'Days'}</div>
        </div>
      )
    },
    {
      header: 'Duty Conflicts',
      key: 'overlap',
      render: (r) => (
        r.overlap ? (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--color-error)',
            background: 'var(--color-error-bg)',
            padding: '2px 8px',
            borderRadius: '12px'
          }}>
            <AlertTriangle size={12} /> Duty Overlap
          </span>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>None</span>
        )
      )
    },
    {
      header: 'Submitted',
      key: 'submitted',
      render: (r) => <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{r.submitted}</span>
    },
    {
      header: 'Status',
      key: 'status',
      render: (r) => (
        <StatusPill
          label={r.status}
          status={r.status === 'Approved' ? 'success' : r.status === 'Pending' ? 'warning' : 'error'}
        />
      )
    },
    {
      header: 'Actions',
      key: 'id',
      render: (r) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          {r.status === 'Pending' && (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleDecision(r.id, 'Approved')}
                title="Approve Leave"
              >
                <Check size={13} />
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleDecision(r.id, 'Rejected')}
                title="Reject Leave"
              >
                <X size={13} />
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="subtle"
            onClick={() => setSelectedRequest(r)}
          >
            Review
          </Button>
        </div>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
              HR-04
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Faculty & Staff Leave Approvals
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Supervise leave applications, inspect academic schedule overlaps, and sanction requests.
          </p>
        </div>
      </div>

      {notification && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '6px',
          background: 'var(--color-success-bg)',
          color: 'var(--color-success)',
          border: '1px solid var(--color-success)',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={16} />
          {notification}
        </div>
      )}

      {/* StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Pending Applications"
          value={pendingRequests.length}
          tone="accent"
          icon={<Clock size={18} />}
          description="Requiring HOD sanction"
        />
        <StatCard
          label="Schedule Collisions"
          value={overlappingCount}
          tone="critical"
          icon={<ShieldAlert size={18} />}
          description="Invigilation or lecture overlap"
        />
        <StatCard
          label="Approved This Month"
          value={approvedRequests.length}
          tone="positive"
          icon={<CheckCircle size={18} />}
          description="Substitutes assigned"
        />
        <StatCard
          label="Rejected Applications"
          value={rejectedRequests.length}
          tone="neutral"
          description="Recorded in audit log"
        />
      </div>

      {/* Filter Tabs */}
      <Card padding={0}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border)',
          padding: '0 16px',
          background: 'var(--color-surface)'
        }}>
          {[
            { id: 'Pending' as const, count: pendingRequests.length },
            { id: 'Approved' as const, count: approvedRequests.length },
            { id: 'Rejected' as const, count: rejectedRequests.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '14px 20px',
                border: 'none',
                background: 'transparent',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {tab.id}
              <span style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: activeTab === tab.id ? 'var(--color-primary-subtle)' : 'var(--color-surface-subtle)',
                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)'
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <Table data={filtered} columns={columns} keyExtractor={(r) => r.id} />
      </Card>

      {/* Review Drawer */}
      <Drawer
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title={selectedRequest ? `Leave Request — ${selectedRequest.employee}` : ''}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setSelectedRequest(null)}>Close</Button>
            {selectedRequest?.status === 'Pending' && (
              <>
                <Button variant="danger" onClick={() => handleDecision(selectedRequest.id, 'Rejected')}>
                  Reject Request
                </Button>
                <Button variant="primary" onClick={() => handleDecision(selectedRequest.id, 'Approved')}>
                  Sanction & Approve
                </Button>
              </>
            )}
          </div>
        }
      >
        {selectedRequest && (
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
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>APPLICATION NUMBER</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'monospace' }}>
                  {selectedRequest.id}
                </div>
              </div>
              <StatusPill label={selectedRequest.status} status={selectedRequest.status === 'Approved' ? 'success' : selectedRequest.status === 'Pending' ? 'warning' : 'error'} />
            </div>

            {selectedRequest.overlap && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '6px',
                background: 'var(--color-error-bg)',
                color: 'var(--color-error)',
                border: '1px solid var(--color-error)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Institutional Schedule Collision Detected:</strong>
                  <div>{selectedRequest.overlapDetails}</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Staff Name:</span>
                <span style={{ fontWeight: 600 }}>{selectedRequest.employee}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Department:</span>
                <span style={{ fontWeight: 600 }}>{selectedRequest.department}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Leave Type:</span>
                <span style={{ fontWeight: 600 }}>{selectedRequest.type}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Calendar Window:</span>
                <span style={{ fontWeight: 600 }}>{selectedRequest.dates} ({selectedRequest.days} days)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Submission Date:</span>
                <span style={{ fontWeight: 600 }}>{selectedRequest.submitted}</span>
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                APPLICANT STATEMENT OF REASON
              </h4>
              <div style={{
                padding: '12px',
                borderRadius: '6px',
                background: 'var(--color-surface-subtle)',
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.5
              }}>
                "{selectedRequest.reason}"
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
