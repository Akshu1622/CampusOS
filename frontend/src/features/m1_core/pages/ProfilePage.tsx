import React, { useState } from 'react'
import { Card, Button, Input, Tabs, Avatar, StatusPill, Alert } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'
import { apiClient } from '@/api/client'

export function ProfilePage() {
  const { user } = useAuth()
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }
    
    setIsLoading(true)
    try {
      await apiClient('/me/change-password', {
        method: 'PUT',
        data: {
          old_password: currentPassword,
          new_password: newPassword
        }
      })
      toast.success('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setError(err.message || 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  const overviewContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Card title="Personal Details">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Username</label>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>{user?.username}</div>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Role</label>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>{user?.role}</div>
          </div>
        </div>
      </Card>
      
      <Card title="Contact Information">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Email</label>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>{user?.email || 'N/A'}</div>
          </div>
        </div>
      </Card>
    </div>
  )

  const securityContent = (
    <Card title="Change Password">
      {error && <Alert variant="error" title="Error" style={{ marginBottom: '16px' }}>{error}</Alert>}
      <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
        <Input 
          type="password"
          label="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <Input 
          type="password"
          label="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <Input 
          type="password"
          label="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <div style={{ marginTop: '8px' }}>
          <Button variant="primary" type="submit" isLoading={isLoading}>Update Password</Button>
        </div>
      </form>
    </Card>
  )

  const tabs = [
    { id: 'Overview', label: 'Overview', content: overviewContent },
    { id: 'Security', label: 'Security', content: securityContent }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1024px', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Profile</h1>
      </div>

      <Card style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <Avatar name={user?.username || 'User'} size="lg" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>{user?.username}</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>ID: {user?.id}</span>
            <StatusPill label="Active" status="success" />
            <div style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--color-surface-muted)', fontSize: '12px', fontWeight: 500 }}>
              {user?.role}
            </div>
          </div>
        </div>
      </Card>

      <Tabs tabs={tabs} />
    </div>
  )
}
