import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api'
import { StatCard } from '../../../components/ui/StatCard'
import { Card } from '../../../components/ui/Card'
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton'
import { ErrorState } from '../../../components/ui/ErrorState'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'

export function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: analyticsApi.getAdminDashboard,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LoadingSkeleton height={120} />
          <LoadingSkeleton height={120} />
          <LoadingSkeleton height={120} />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return <ErrorState message="Failed to load dashboard data" onRetry={refetch} />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Total Students"
          icon={<div/>}
          value={data.total_students}
        />
        <StatCard
          label="Total Faculty"
          icon={<div/>}
          value={data.total_faculty}
        />
        <StatCard
          label="Active Enrollments"
          icon={<div/>}
          value={data.active_enrollments}
        />
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4">Approvals & Exceptions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="p-4 flex flex-col items-center text-center">
            <h3 className="text-gray-500 text-sm font-medium">Pending Leaves</h3>
            <div className="text-3xl font-bold my-2 text-warning-600">{data.pending_leaves}</div>
            <Link to="/admin/hr/leave-approvals">
              <Button variant="secondary" size="sm">Review Leaves</Button>
            </Link>
          </div>
        </Card>
        <Card>
          <div className="p-4 flex flex-col items-center text-center">
            <h3 className="text-gray-500 text-sm font-medium">Hostel Requests</h3>
            <div className="text-3xl font-bold my-2 text-warning-600">{data.pending_hostel_requests}</div>
            <Link to="/admin/hostel/requests">
              <Button variant="secondary" size="sm">Review Requests</Button>
            </Link>
          </div>
        </Card>
        <Card>
          <div className="p-4 flex flex-col items-center text-center">
            <h3 className="text-gray-500 text-sm font-medium">Low Attendance</h3>
            <div className="text-3xl font-bold my-2 text-danger-600">{data.students_low_attendance}</div>
            <Link to="/admin/analytics/reports/RP-3">
              <Button variant="secondary" size="sm">View Report</Button>
            </Link>
          </div>
        </Card>
        <Card>
          <div className="p-4 flex flex-col items-center text-center">
            <h3 className="text-gray-500 text-sm font-medium">Overdue Fees</h3>
            <div className="text-3xl font-bold my-2 text-danger-600">
              ₹{(data.fees_due_current || 0).toLocaleString()}
            </div>
            <Link to="/admin/finance/defaulters">
              <Button variant="secondary" size="sm">View Defaulters</Button>
            </Link>
          </div>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4">Operations Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          label="Fees Collected (Current)"
          icon={<div/>}
          value={`₹${(data.fees_collected_current || 0).toLocaleString()}`}
        />
        <StatCard
          label="Beds Available"
          icon={<div/>}
          value={data.beds_available}
        />
      </div>
    </div>
  )
}
