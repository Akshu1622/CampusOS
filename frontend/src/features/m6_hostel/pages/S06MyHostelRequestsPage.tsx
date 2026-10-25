import React, { useState } from 'react'
import { Card, StatCard, Select, StatusPill, Button, EmptyState } from '@/components/ui'
import { useMyRequests } from '../hooks'
import { Link, useNavigate } from 'react-router-dom'
import type { RequestStatus } from '../api'
import { Plus, Home, Clock, CheckCircle, AlertTriangle } from 'lucide-react'

export function S06MyHostelRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<RequestStatus | ''>('')
  const { data: requests = [], isLoading } = useMyRequests(statusFilter || undefined)
  const navigate = useNavigate()

  const pendingCount = requests.filter(r => r.status === 'PENDING').length
  const approvedCount = requests.filter(r => r.status === 'APPROVED').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '880px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
              HOS-06
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              My Accommodation Requests
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Track the status of your room allocation, transfer, and vacation applications.
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => navigate('/student/hostel/new-request')}>
          New Request
        </Button>
      </div>

      {/* StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Applications"
          value={requests.length}
          tone="neutral"
          icon={<Home size={18} />}
          description="Submitted this academic year"
        />
        <StatCard
          label="Pending Review"
          value={pendingCount}
          tone="accent"
          icon={<Clock size={18} />}
          description="Awaiting Chief Warden queue"
        />
        <StatCard
          label="Approved Requests"
          value={approvedCount}
          tone="positive"
          icon={<CheckCircle size={18} />}
          description="Processed and room assigned"
        />
      </div>

      {/* Filter Toolbar */}
      <Card padding={16}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ width: '220px' }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              options={[
                { label: 'All Application Statuses', value: '' },
                { label: 'Pending Review', value: 'PENDING' },
                { label: 'Approved', value: 'APPROVED' },
                { label: 'Rejected', value: 'REJECTED' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Requests List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {isLoading ? (
          <div>Loading your requests...</div>
        ) : requests.length === 0 ? (
          <Card padding={32}>
            <EmptyState
              title="No Requests Found"
              description="You have not submitted any accommodation requests yet. You can apply for a room or request a transfer at any time."
              actionLabel="Submit First Request"
              onAction={() => navigate('/student/hostel/new-request')}
            />
          </Card>
        ) : (
          requests.map(req => (
            <Card key={req.id} padding={20}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {req.request_type.replace('_', ' ')}
                    </h3>
                    <StatusPill
                      label={req.status}
                      status={req.status === 'APPROVED' ? 'success' : req.status === 'PENDING' ? 'warning' : 'error'}
                    />
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Application #{req.id} • Submitted {req.created_at ? 'on ' + new Date(req.created_at).toLocaleDateString() : 'recently'}
                  </div>
                  {req.details && (
                    <div style={{
                      marginTop: '10px',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      background: 'var(--color-surface-subtle)',
                      border: '1px solid var(--color-border)',
                      fontSize: '13px',
                      color: 'var(--color-text-secondary)',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {req.details}
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
