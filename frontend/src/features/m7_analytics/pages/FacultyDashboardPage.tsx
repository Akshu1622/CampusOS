import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api'
import { StatCard } from '../../../components/ui/StatCard'
import { Card } from '../../../components/ui/Card'
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton'
import { ErrorState } from '../../../components/ui/ErrorState'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'

export function FacultyDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['facultyDashboard'],
    queryFn: analyticsApi.getFacultyDashboard,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Faculty Dashboard</h1>
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
        <h1 className="text-2xl font-bold">My Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Assigned Offerings"
          icon={<div/>}
          value={data.assigned_offerings}
        />
        <StatCard
          label="Leave Balance"
          icon={<div/>}
          value={data.total_leave_balance}
        />
        <StatCard
          label="Latest Net Pay"
          icon={<div/>}
          value={data.latest_payslip_net !== undefined ? `₹${(data.latest_payslip_net || 0).toLocaleString()}` : 'N/A'}
        />
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4">Today's Tasks</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="p-6 flex flex-col items-center text-center">
            <h3 className="text-gray-500 font-medium">Pending Marks Entry</h3>
            <div className="text-4xl font-bold my-4 text-warning-600">{data.pending_marks_entry}</div>
            <p className="text-sm text-gray-600 mb-4">Courses require your attention for marks entry.</p>
            {/* The routes for faculty are /faculty/academics/marks or similar. The prompt says "Navigation: compact (My Courses, Attendance, Marks Entry, Course Results, Leave, Payslips)" */}
            <Button variant="primary">Go to Marks Entry</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
