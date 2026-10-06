import React, { useState, useEffect } from 'react'
import { Card, Button, Input, Table, StatusPill, Drawer, Select, Pagination } from '@/components/ui'
import { apiClient } from '@/api/client'
import { toast } from 'react-hot-toast'
import { Search, Plus, Filter, MoreHorizontal, FileDown } from 'lucide-react'

export function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  
  const [search, setSearch] = useState('')
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
      const res = await apiClient(`/users?page=${page}&page_size=${pageSize}&search=${search}`)
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
    setFormLoading(true)
    try {
      await apiClient('/users', { data: formData })
      toast.success('User created successfully')
      setIsDrawerOpen(false)
      fetchUsers()
      setFormData({ username: '', email: '', role: 'Student', password: '' })
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user')
    } finally {
      setFormLoading(false)
    }
  }

  const columns = [
    { key: 'username', header: 'User', render: (row: any) => (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 500 }}>{row.username}</span>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{row.email}</span>
      </div>
    )},
    { key: 'role', header: 'Role', render: (row: any) => (
      <div style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--color-surface-muted)', display: 'inline-block', fontSize: '12px', fontWeight: 500 }}>
        {row.role}
      </div>
    )},
    { key: 'status', header: 'Status', render: (row: any) => (
      <StatusPill label={row.status === 'ACTIVE' ? 'Active' : 'Inactive'} status={row.status === 'ACTIVE' ? 'success' : 'neutral'} />
    )},
    { key: 'actions', header: '', render: (row: any) => (
      <Button variant="subtle" size="sm"><MoreHorizontal size={16} /></Button>
    )}
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Users</h1>
          <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Manage user accounts and access</div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" icon={<FileDown size={16} />}>Export</Button>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsDrawerOpen(true)}>Add User</Button>
        </div>
      </div>

      <Card padding={0}>
        <div style={{ padding: '16px', display: 'flex', gap: '12px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ width: '300px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
            <input 
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', height: '40px', padding: '8px 12px 8px 36px',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
                outline: 'none', fontSize: '14px'
              }}
            />
          </div>
          <Button variant="secondary" icon={<Filter size={16} />}>Filters</Button>
        </div>

        <Table 
          columns={columns}
          data={users}
          isLoading={loading}
          emptyMessage="No users found"
        />

        <div style={{ padding: '16px', borderTop: '1px solid var(--color-border)' }}>
          <Pagination 
            currentPage={page}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </Card>

      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        title="Add New User"
        size="md"
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Input 
            label="Username" 
            required 
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
          />
          <Input 
            label="Email" 
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <Select 
            label="Role"
            options={[{value: 'Admin', label: 'Admin'}, {value: 'Faculty', label: 'Faculty'}, {value: 'Student', label: 'Student'}]}
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: (e as any)?.target?.value || e})}
          />
          <Input 
            label="Password" 
            type="password"
            required 
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            helperText="Provide a temporary password for the user."
          />
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={formLoading}>Create User</Button>
          </div>
        </form>
      </Drawer>
    </div>
  )
}
