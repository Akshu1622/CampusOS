import React, { useState, useEffect } from 'react'
import { Card, Button, Table, StatusPill } from '@/components/ui'
import { apiClient } from '@/api/client'
import { toast } from 'react-hot-toast'
import { Shield } from 'lucide-react'

export function RoleManagementPage() {
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchRoles = async () => {
    setLoading(true)
    try {
      const res = await apiClient('/roles')
      // M1 docs say /roles returns List[RoleResponse]
      setRoles(Array.isArray(res) ? res : [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch roles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Roles & Permissions</h1>
          <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Manage system roles and administrator permissions</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {['Admin', 'Faculty', 'Student'].map((role) => (
            <Card key={role} style={{ 
              cursor: 'pointer', 
              border: role === 'Admin' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>{role}</span>
                {role !== 'Admin' && <StatusPill label="System" status="neutral" />}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                {role === 'Admin' ? 'Institution administrators with configurable scopes.' : `Standard ${role.toLowerCase()} access.`}
              </div>
            </Card>
          ))}
        </div>

        <Card title="Admin Permission Sets" padding={24}>
          <div style={{ marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Configure which admin users hold specific permission sets. Super Admin has all sets.
          </div>
          
          {loading ? (
             <div>Loading...</div>
          ) : (
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                 <thead>
                   <tr style={{ backgroundColor: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border)' }}>
                     <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--color-text-muted)' }}>Permission Set</th>
                     <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--color-text-muted)' }}>Description</th>
                     <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--color-text-muted)' }}>Active Users</th>
                   </tr>
                 </thead>
                 <tbody>
                   {[
                     { set: 'Super Admin', desc: 'Full system access including role management', count: 2 },
                     { set: 'Academic Admin', desc: 'Courses, curriculum, and enrollment', count: 5 },
                     { set: 'Exam Admin', desc: 'Exam schedules and results processing', count: 3 },
                     { set: 'Finance Admin', desc: 'Fee structures and payments', count: 4 },
                     { set: 'HR Admin', desc: 'Employee records and payroll', count: 2 },
                     { set: 'Hostel Admin', desc: 'Hostel and room allocation', count: 3 },
                   ].map((row, i) => (
                     <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                       <td style={{ padding: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <Shield size={16} color="var(--color-primary)" />
                         {row.set}
                       </td>
                       <td style={{ padding: '16px', color: 'var(--color-text-secondary)' }}>{row.desc}</td>
                       <td style={{ padding: '16px', textAlign: 'center' }}>
                         <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-surface-muted)', fontSize: '13px', fontWeight: 600 }}>
                           {row.count}
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
