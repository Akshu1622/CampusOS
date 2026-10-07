import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api'
import { StatCard } from '../../../components/ui/StatCard'
import { Card } from '../../../components/ui/Card'
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton'
import { ErrorState } from '../../../components/ui/ErrorState'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function FacultyDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['facultyDashboard'],
    queryFn: analyticsApi.getFacultyDashboard,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Faculty Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <LoadingSkeleton key={i} height={120} />)}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return <ErrorState message="Failed to load dashboard data" onRetry={refetch} />
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-text-primary">My Dashboard</h2>
      <div className="bg-primary-50 p-6 rounded-lg shadow-sm border border-primary-100">
        <h1 className="text-2xl font-bold text-primary-900">Welcome back, Professor</h1>
        <p className="text-primary-700 mt-1">
          You have {data.today_sessions?.length || 0} sessions today and {data.pending_marks_entry} pending marks entries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Assigned Offerings"
          value={data.assigned_offerings}
          icon={<div className="w-3 h-3 rounded-full bg-blue-500" />}
        />
        <StatCard
          label="Pending marks"
          value={data.pending_marks_entry}
          icon={<div className="w-3 h-3 rounded-full bg-amber-500" />}
        />
        <StatCard
          label="Leave balance"
          value={data.total_leave_balance}
          icon={<div className="w-3 h-3 rounded-full bg-teal-500" />}
        />
        <StatCard
          label="Latest payslip"
          value={data.latest_payslip_net !== undefined ? `₹${(data.latest_payslip_net || 0).toLocaleString()}` : 'N/A'}
          icon={<div className="w-3 h-3 rounded-full bg-violet-500" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">Today's Schedule</h2>
              <Link to="/faculty/academics/my-courses" className="text-sm text-primary-600 hover:underline">View full schedule</Link>
            </div>
            <div className="p-0">
              <ul className="divide-y">
                {data.today_sessions?.map((session: any) => (
                  <li key={session.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <div className="font-medium text-gray-900">{session.time_slot}</div>
                      <div className="text-sm text-gray-600">{session.room}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{session.course_name}</div>
                      <Link to="/faculty/academics/attendance" className="text-xs text-primary-600 border border-primary-600 rounded px-2 py-1 mt-1 inline-block hover:bg-primary-50">
                        Mark Attendance
                      </Link>
                    </div>
                  </li>
                ))}
                {(!data.today_sessions || data.today_sessions.length === 0) && (
                  <li className="p-8 text-center text-gray-500">No sessions scheduled for today</li>
                )}
              </ul>
            </div>
          </Card>

          <Card>
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-800">Result Snapshot (Current Term)</h2>
            </div>
            <div className="p-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.result_snapshot || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="grade" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card>
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-800">Needs Attention</h2>
            </div>
            <div className="p-4 space-y-4">
              {data.pending_marks_entry > 0 && (
                <div className="flex items-start p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-amber-800">Pending Marks</h3>
                    <p className="text-xs text-amber-700 mt-1">You have {data.pending_marks_entry} exams awaiting marks entry.</p>
                  </div>
                  <Link to="/faculty/academics/marks">
                    <Button variant="secondary" size="sm" className="bg-white">Update</Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-800">Quick Links</h2>
            </div>
            <div className="p-2">
              <Link to="/faculty/academics/my-courses" className="block p-3 text-sm text-gray-700 hover:bg-gray-50 rounded">My Courses</Link>
              <Link to="/faculty/academics/attendance" className="block p-3 text-sm text-gray-700 hover:bg-gray-50 rounded">Record Attendance</Link>
              <Link to="/faculty/academics/marks" className="block p-3 text-sm text-gray-700 hover:bg-gray-50 rounded">Marks Entry</Link>
              <Link to="/faculty/hr/leave" className="block p-3 text-sm text-gray-700 hover:bg-gray-50 rounded">Leave Application</Link>
              <Link to="/faculty/hr/payslips" className="block p-3 text-sm text-gray-700 hover:bg-gray-50 rounded">Payslips</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
