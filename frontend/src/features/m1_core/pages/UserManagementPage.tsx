import React, { useState, useEffect, useMemo } from 'react'
import { Card, Button, Input, Table, StatusPill, Drawer, Select, Pagination, Avatar, StatCard, EmptyState } from '@/components/ui'
import { apiClient } from '@/api/client'
import { toast } from 'react-hot-toast'
import { Search, Plus, FileDown, MoreHorizontal, Users, Shield, BookOpen, GraduationCap, X } from 'lucide-react'

export function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'Student',
    password: ''
  })
  const [formLoading, setFormLoading] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await apiClient(`/users?page=${page}&page_size=${pageSize}&search=${encodeURIComponent(search)}`)
      setUsers((res as any)?.items || [])
      setTotal((res as any)?.total || 0)
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, pageSize, search])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.username.trim()) {
      toast.error('Username is required')
      return
    }
    if (!formData.password || formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }
    setFormLoading(true)
    try {
      await apiClient('/users', {
        method: 'POST',
        data: {
          username: formData.username.trim(),
          password: formData.password,
          roles: [formData.role || 'Student'],
        }
      })
      toast.success('User account created successfully')
      setIsDrawerOpen(false)
      fetchUsers()
      setFormData({ username: '', email: '', role: 'Student', password: '' })
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user')
    } finally {
      setFormLoading(false)
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const rolesList = u.roles || [u.role] || []
      const matchesRole = roleFilter === 'ALL' || rolesList.includes(roleFilter)
      return matchesRole
    })
  }, [users, roleFilter])

  const columns = [
    {
      key: 'username',
      header: 'User Account',
      render: (row: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar name={row.username} size="sm" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '13.5px' }}>{row.username}</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              {row.email || `${row.username}@campus.edu`}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Assigned Role',
      render: (row: any) => {
        const role = row.roles?.[0] || row.role || 'Student'
        const color = role === 'Admin' ? 'var(--color-primary)' : role === 'Faculty' ? 'var(--color-chip-exams-text)' : 'var(--color-chip-hostel-text)'
        const bg = role === 'Admin' ? 'var(--color-primary-subtle)' : role === 'Faculty' ? 'var(--color-chip-exams-bg)' : 'var(--color-chip-hostel-bg)'
        return (
          <span style={{
            fontSize: '12px', fontWeight: 600, padding: '3px 10px',
            borderRadius: '99px', background: bg, color: color
          }}>
            {role}
          </span>
        )
      }
    },
    {
      key: 'status',
      header: 'Account Status',
      render: (row: any) => (
        <StatusPill
          label={row.status === 'ACTIVE' || !row.status ? 'Active' : 'Inactive'}
          status={row.status === 'ACTIVE' || !row.status ? 'success' : 'neutral'}
        />
      )
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      render: (row: any) => (
        <span style={{ fontSize: '12.5px', color: 'var(--color-text-muted)' }}>
          {row.last_login ? new Date(row.last_login).toLocaleDateString() : 'Never'}
        </span>
      )
    },
    {
      key: 'actions',
      header: '',
      render: () => (
        <Button variant="subtle" size="sm" onClick={() => toast.success('Account options')}>
          <MoreHorizontal size={16} />
        </Button>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-muted)', padding: '2px 8px', borderRadius: '4px' }}>
              M1 · Core
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)', letterSpacing: '-0.3px' }}>
              Users & Authentication
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Manage campus user logins, assign role access levels, and audit account security.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" icon={<FileDown size={16} />} onClick={() => toast.success('Exporting users list...')}>
            Export
          </Button>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsDrawerOpen(true)}>
            Add User
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Registered Users"
          value={total.toLocaleString()}
          icon={<Users size={20} />}
          moduleColor="academic"
          supportText="Active system accounts"
        />
        <StatCard
          label="Admin Accounts"
          value="4"
          icon={<Shield size={20} />}
          moduleColor="exams"
          supportText="Core, Finance, HR, Hostel"
        />
        <StatCard
          label="Security Standard"
          value="Argon2id"
          icon={<Shield size={20} />}
          moduleColor="people"
          supportText="Encrypted password hashes"
          supportColor="success"
        />
      </div>

      {/* Main Table Card */}
      <Card padding={0}>
        <div style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          borderBottom: '1px solid var(--color-border)',
          flexWrap: 'wrap'
        }}>
          <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '360px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input 
              placeholder="Search by username or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', height: '38px', padding: '0 32px 0 36px',
                borderRadius: '8px', border: '1px solid var(--color-border)',
                outline: 'none', fontSize: '13.5px', background: 'var(--color-surface-muted)',
                color: 'var(--color-text-primary)'
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', lineHeight: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ width: '180px' }}>
            <Select
              value={roleFilter}
              options={[
                { label: 'All Roles', value: 'ALL' },
                { label: 'Admin', value: 'Admin' },
                { label: 'Faculty', value: 'Faculty' },
                { label: 'Student', value: 'Student' }
              ]}
              onChange={(e) => setRoleFilter(e.target.value)}
            />
          </div>
        </div>

        {filteredUsers.length === 0 && !loading ? (
          <div style={{ padding: '48px 24px' }}>
            <EmptyState
              icon={<Users size={40} />}
              title="No users found"
              description="No user records match your criteria."
              action={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsDrawerOpen(true)}>Add User</Button>}
            />
          </div>
        ) : (
          <Table columns={columns} data={filteredUsers} isLoading={loading} />
        )}

        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--color-surface)'
        }}>
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Showing {filteredUsers.length} of {total} accounts
          </span>
          <Pagination 
            currentPage={page}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </Card>

      {/* Add User Drawer */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Create User Account" size="md">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input 
            label="Username" 
            placeholder="e.g. j.doe or student2024" 
            value={formData.username} 
            onChange={(e) => setFormData({ ...formData, username: e.target.value })} 
            required 
          />

          <Select
            label="System Role"
            value={formData.role}
            options={[
              { label: 'Student', value: 'Student' },
              { label: 'Faculty', value: 'Faculty' },
              { label: 'Administrator', value: 'Admin' }
            ]}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            required
          />

          <Input 
            label="Initial Password" 
            type="password" 
            placeholder="Minimum 8 characters" 
            value={formData.password} 
            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
            required 
          />

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button variant="secondary" type="button" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={formLoading}>Create Account</Button>
          </div>
        </form>
      </Drawer>
    </div>
  )
}
