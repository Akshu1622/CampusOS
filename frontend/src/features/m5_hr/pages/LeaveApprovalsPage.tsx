import React, { useState, useEffect } from 'react'
import { Card, StatCard, Button, Table, type Column, StatusPill, Drawer } from '@/components/ui'
import { Check, X, AlertTriangle, Clock, Calendar, CheckCircle, ShieldAlert, User, FileText } from 'lucide-react'
import { apiClient } from '@/api/client'
import { toast } from 'react-hot-toast'

interface LiveLeaveRequest {
  id: number
  employee_id: number
  leave_type_id: number
  start_date: string
  end_date: string
  days: number
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  decision_by?: number | null
  decision_date?: string | null
}

export const LeaveApprovalsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [requests, setRequests] = useState<LiveLeaveRequest[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [leaveTypes, setLeaveTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LiveLeaveRequest | null>(null)
  const [decisionLoading, setDecisionLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [leavesRes, empsRes, typesRes] = await Promise.all([
        apiClient<LiveLeaveRequest[]>('/leaves'),
        apiClient<any[]>('/employees?limit=200'),
        apiClient<any[]>('/leave-types')
      ])
      setRequests(Array.isArray(leavesRes) ? leavesRes : [])
      setEmployees(Array.isArray(empsRes) ? empsRes : [])
      setLeaveTypes(Array.isArray(typesRes) ? typesRes : [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch leave applications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDecision = async (id: number, newStatus: 'APPROVED' | 'REJECTED') => {
    setDecisionLoading(true)
    try {
      await apiClient(`/leaves/${id}/decision`, {
        method: 'PATCH',
        data: { status: newStatus }
      })
      toast.success(`Leave application #${id} marked as ${newStatus}`)
      setSelectedRequest(null)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || `Failed to update leave #${id}`)
    } finally {
      setDecisionLoading(false)
    }
  }

  const getEmployeeName = (empId: number) => {
    const emp = employees.find(e => e.id === empId || e.employee_id === String(empId))
    return emp ? `${emp.first_name} ${emp.last_name}` : `Staff #${empId}`
  }

  const getLeaveTypeName = (typeId: number) => {
    const lt = leaveTypes.find(t => t.id === typeId)
    return lt ? lt.name : `Leave Type #${typeId}`
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDING')
  const approvedRequests = requests.filter(r => r.status === 'APPROVED')
  const rejectedRequests = requests.filter(r => r.status === 'REJECTED')

  const filtered = requests.filter(r => {
    if (activeTab === 'ALL') return true
    return r.status === activeTab
  })

  const columns: Column<LiveLeaveRequest>[] = [
    {
      header: 'Applicant',
      key: 'employee_id',
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
            <User size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {getEmployeeName(r.employee_id)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Emp ID: {r.employee_id}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Leave Type',
      key: 'leave_type_id',
      render: (r) => (
        <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '13px' }}>
          {getLeaveTypeName(r.leave_type_id)}
        </span>
      )
    },
    {
      header: 'Schedule & Duration',
      key: 'start_date',
      render: (r) => (
        <div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
            {r.start_date} → {r.end_date}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            {r.days} working {r.days === 1 ? 'day' : 'days'}
          </div>
        </div>
      )
    },
    {
      header: 'Reason',
      key: 'reason',
      render: (r) => (
        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', maxWidth: '240px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {r.reason || '—'}
        </span>
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button variant="subtle" size="sm" onClick={() => setSelectedRequest(r)}>
            Review
          </Button>
          {r.status === 'PENDING' && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDecision(r.id, 'APPROVED')}
                isLoading={decisionLoading}
              >
                Approve
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDecision(r.id, 'REJECTED')}
                isLoading={decisionLoading}
              >
                Reject
              </Button>
            </>
          )}
        </div>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
            HR-07
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            Leave Applications & HOD Approval Queue
          </h1>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Review statutory and special leave petitions submitted by university academic and administrative staff.
        </p>
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Pending Applications"
          value={pendingRequests.length}
          tone="accent"
          icon={<Clock size={20} />}
          description="Awaiting decision"
        />
        <StatCard
          label="Approved This Term"
          value={approvedRequests.length}
          tone="positive"
          icon={<CheckCircle size={20} />}
          description="Sanctioned leaves"
        />
        <StatCard
          label="Rejected / Cancelled"
          value={rejectedRequests.length}
          tone="neutral"
          icon={<ShieldAlert size={20} />}
          description="Non-sanctioned requests"
        />
        <StatCard
          label="Total Submissions"
          value={requests.length}
          tone="neutral"
          icon={<FileText size={20} />}
          description="Institutional records"
        />
      </div>

      {/* Main Table Card */}
      <Card padding={0}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === tab ? 'var(--color-primary)' : 'var(--color-surface-subtle)',
                  color: activeTab === tab ? '#FFFFFF' : 'var(--color-text-secondary)',
                  transition: 'all 150ms'
                }}
              >
                {tab === 'ALL' ? 'All Requests' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                {tab === 'PENDING' && pendingRequests.length > 0 && ` (${pendingRequests.length})`}
              </button>
            ))}
          </div>

          <Button variant="secondary" size="sm" onClick={fetchData} isLoading={loading}>
            Refresh Queue
          </Button>
        </div>

        <Table
          data={filtered}
          columns={columns}
          keyExtractor={(r) => String(r.id)}
          isLoading={loading}
          emptyMessage="No leave applications match the selected filter."
        />
      </Card>

      {/* Application Review Drawer */}
      <Drawer
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        title="Leave Application Dossier"
        size="md"
        footer={
          selectedRequest && selectedRequest.status === 'PENDING' ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button
                variant="secondary"
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </Button>
              <Button
                variant="danger"
                isLoading={decisionLoading}
                onClick={() => handleDecision(selectedRequest.id, 'REJECTED')}
              >
                Reject Request
              </Button>
              <Button
                variant="primary"
                isLoading={decisionLoading}
                onClick={() => handleDecision(selectedRequest.id, 'APPROVED')}
              >
                Approve Request
              </Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setSelectedRequest(null)}>
              Close
            </Button>
          )
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
                  LEAVE-REQ-#{selectedRequest.id}
                </div>
              </div>
              <StatusPill
                label={selectedRequest.status}
                status={selectedRequest.status === 'APPROVED' ? 'success' : selectedRequest.status === 'PENDING' ? 'warning' : 'error'}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Applicant Staff:</span>
                <span style={{ fontWeight: 600 }}>{getEmployeeName(selectedRequest.employee_id)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Leave Type:</span>
                <span style={{ fontWeight: 600 }}>{getLeaveTypeName(selectedRequest.leave_type_id)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Calendar Window:</span>
                <span style={{ fontWeight: 600 }}>{selectedRequest.start_date} → {selectedRequest.end_date} ({selectedRequest.days} days)</span>
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
                "{selectedRequest.reason || 'No statement provided.'}"
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
