import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api'
import { StatCard } from '../../../components/ui/StatCard'
import { Card } from '../../../components/ui/Card'
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton'
import { ErrorState } from '../../../components/ui/ErrorState'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { StatusPill } from '../../../components/ui/StatusPill'

export function StudentDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['studentDashboard'],
    queryFn: analyticsApi.getStudentDashboard,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Dashboard</h1>
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
          label="Current CGPA"
          icon={<div />}
          value={data.current_cgpa !== undefined ? data.current_cgpa.toFixed(2) : 'N/A'}
        />
        <StatCard
          label="Enrolled Courses"
          icon={<div />}
          value={data.total_enrolled_courses}
        />
        <StatCard
          label="Hostel Status"
          icon={<div />}
          value={data.hostel_status || 'Not Allocated'}
        />
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4">Action Items</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="p-5 flex flex-col items-center text-center">
            <h3 className="text-gray-500 font-medium">Outstanding Dues</h3>
            <div className="text-3xl font-bold my-3 text-danger-600">
              ₹{(data.total_outstanding_dues || 0).toLocaleString()}
            </div>
            {data.total_outstanding_dues > 0 ? (
              <Link to="/student/pay">
                <Button variant="primary" size="sm">Pay Now</Button>
              </Link>
            ) : (
              <StatusPill status="success" label="All clear" />
            )}
          </div>
        </Card>
        
        <Card>
          <div className="p-5 flex flex-col items-center text-center">
            <h3 className="text-gray-500 font-medium">Pending Exams</h3>
            <div className="text-3xl font-bold my-3 text-warning-600">{data.pending_exams}</div>
            {data.pending_exams > 0 ? (
              <Button variant="primary" size="sm">Register</Button>
            ) : (
              <StatusPill status="success" label="All registered" />
            )}
          </div>
        </Card>
        
        <Card>
          <div className="p-5 flex flex-col items-center text-center">
            <h3 className="text-gray-500 font-medium">Low Attendance Courses</h3>
            <div className="text-3xl font-bold my-3 text-danger-600">{data.low_attendance_courses}</div>
            {data.low_attendance_courses > 0 ? (
              <StatusPill status="error" label="At Risk" />
            ) : (
              <StatusPill status="success" label="Safe" />
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
