import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api'
import { StatCard } from '../../../components/ui/StatCard'
import { Card } from '../../../components/ui/Card'
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton'
import { ErrorState } from '../../../components/ui/ErrorState'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444']

export function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: analyticsApi.getAdminDashboard,
  })

  // Also fetch hostel occupancy and audit logs
  const { data: occupancy } = useQuery({
    queryKey: ['report', 'RP-6'],
    queryFn: () => analyticsApi.getReportData('RP-6', {})
  })

  const { data: auditLogs } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => analyticsApi.getAuditLogs({ size: 5 })
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <LoadingSkeleton key={i} height={120} />)}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return <ErrorState message="Failed to load dashboard data" onRetry={refetch} />
  }

  const donutData = data.fee_collection_donut ? [
    { name: 'Paid', value: data.fee_collection_donut.paid || 0 },
    { name: 'Partial', value: data.fee_collection_donut.partial || 0 },
    { name: 'Due', value: data.fee_collection_donut.due || 0 },
    { name: 'Overdue', value: data.fee_collection_donut.overdue || 0 }
  ] : []

  const totalCollected = (data.fee_collection_donut?.paid || 0) + (data.fee_collection_donut?.partial || 0)
  const totalDues = (data.fee_collection_donut?.due || 0) + (data.fee_collection_donut?.overdue || 0)
  const collectionPct = totalCollected + totalDues > 0 ? (totalCollected * 100 / (totalCollected + totalDues)).toFixed(1) : 0

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-text-primary">Admin Dashboard</h2>
      <div className="bg-primary-50 p-6 rounded-lg shadow-sm border border-primary-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Good morning, Administrator</h1>
          <p className="text-primary-700 mt-1">
            You have {data.pending_leaves} pending leave requests and {data.pending_hostel_requests} hostel requests.
          </p>
        </div>
        <Link to="/admin/hr/leave-approvals">
          <Button variant="primary">Review approvals</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard label="Total Students" value={data.total_students} icon={<div className="w-3 h-3 rounded-full bg-blue-500" />} />
        <StatCard label="Active enrollments" value={data.active_enrollments} icon={<div className="w-3 h-3 rounded-full bg-violet-500" />} />
        <StatCard label="Fees collected" value={`${collectionPct}%`} supportText="vs due" icon={<div className="w-3 h-3 rounded-full bg-amber-500" />} />
        <StatCard label="Hostel beds available" value={data.beds_available} icon={<div className="w-3 h-3 rounded-full bg-teal-500" />} />
        <StatCard label="Below 75% attendance" value={data.students_low_attendance} icon={<div className={`w-3 h-3 rounded-full ${data.students_low_attendance > 50 ? 'bg-red-500' : 'bg-rose-500'}`} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card className="h-full">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-800">Needs attention</h2>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-warning-600 mb-1">{data.pending_leaves}</div>
                <div className="text-sm text-gray-600 mb-3">Pending leaves</div>
                <Link to="/admin/hr/leave-approvals" className="text-primary-600 text-sm font-medium hover:underline">Review &rarr;</Link>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-warning-600 mb-1">{data.pending_hostel_requests}</div>
                <div className="text-sm text-gray-600 mb-3">Hostel requests</div>
                <Link to="/admin/hostel/requests" className="text-primary-600 text-sm font-medium hover:underline">Review &rarr;</Link>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-danger-600 mb-1">{data.blocked_exams_today || 0}</div>
                <div className="text-sm text-gray-600 mb-3">Blocked exams</div>
                <Link to="/admin/analytics/reports/RP-10" className="text-primary-600 text-sm font-medium hover:underline">Review &rarr;</Link>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-danger-600 mb-1">{data.overdue_fees_today || 0}</div>
                <div className="text-sm text-gray-600 mb-3">Overdue accounts</div>
                <Link to="/admin/analytics/reports/RP-5" className="text-primary-600 text-sm font-medium hover:underline">Review &rarr;</Link>
              </div>
            </div>
          </Card>
        </div>
        <div className="lg:col-span-4">
          <Card className="h-full">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-800">Fee collection</h2>
            </div>
            <div className="p-4 h-64 flex flex-col items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => `₹${Number(value || 0).toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                <span className="text-2xl font-bold">{collectionPct}%</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-800">Collection trend</h2>
          </div>
          <div className="p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.collection_trend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip formatter={(value: any) => `₹${Number(value || 0).toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="current_term" name="Current Term" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="previous_term" name="Previous Term" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-800">Enrollment by department</h2>
          </div>
          <div className="p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.enrollment_by_department || []} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="department" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-800">Recent activity</h2>
          </div>
          <div className="p-0">
            <ul className="divide-y">
              {auditLogs?.data?.map((log: any) => (
                <li key={log.log_id} className="p-4 text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-gray-900">{log.action}</span>
                    <span className="text-gray-500 text-xs">{new Date(log.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="text-gray-600">{log.entity_name} #{log.entity_id}</div>
                </li>
              ))}
              {(!auditLogs?.data || auditLogs.data.length === 0) && (
                <li className="p-4 text-sm text-gray-500 text-center">No recent activity</li>
              )}
            </ul>
          </div>
        </Card>
        
        <Card className="lg:col-span-1">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-800">Hostel occupancy</h2>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancy?.data || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hostel_name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="occupied_beds" name="Occupied" stackId="a" fill="#10B981" />
                <Bar dataKey="available_beds" name="Available" stackId="a" fill="#E5E7EB" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-800">Quick links</h2>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <Link to="/admin/core/students/new" className="p-3 border rounded-lg text-center hover:bg-gray-50 text-sm font-medium text-gray-700">Add Student</Link>
            <Link to="/admin/academics/enrollment" className="p-3 border rounded-lg text-center hover:bg-gray-50 text-sm font-medium text-gray-700">Bulk Enrollment</Link>
            <Link to="/admin/finance/fee-assignment" className="p-3 border rounded-lg text-center hover:bg-gray-50 text-sm font-medium text-gray-700">Fee Assignment</Link>
            <Link to="/admin/hr/payroll" className="p-3 border rounded-lg text-center hover:bg-gray-50 text-sm font-medium text-gray-700">Run Payroll</Link>
            <Link to="/admin/hostel/allocation" className="p-3 border rounded-lg text-center hover:bg-gray-50 text-sm font-medium text-gray-700">Allocate Room</Link>
            <Link to="/admin/analytics/reports" className="p-3 border rounded-lg text-center hover:bg-gray-50 text-sm font-medium text-gray-700">Reports</Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

