import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api'
import { StatCard } from '../../../components/ui/StatCard'
import { Card } from '../../../components/ui/Card'
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton'
import { ErrorState } from '../../../components/ui/ErrorState'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { StatusPill } from '../../../components/ui/StatusPill'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function StudentDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['studentDashboard'],
    queryFn: analyticsApi.getStudentDashboard,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Student Dashboard</h1>
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
      <div className="bg-primary-50 p-6 rounded-lg shadow-sm border border-primary-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Hello, Student</h1>
          <p className="text-primary-700 mt-1">
            You have {data.today_schedule?.length || 0} classes today.
          </p>
        </div>
        {data.total_outstanding_dues > 0 && (
          <div className="flex gap-4 items-center">
            <span className="text-danger-600 font-semibold">₹{data.total_outstanding_dues.toLocaleString()} due</span>
            <Link to="/student/pay">
              <Button variant="danger" size="sm">Pay Now</Button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Current CGPA"
          value={data.current_cgpa !== undefined ? data.current_cgpa.toFixed(2) : 'N/A'}
          icon={<div className="w-3 h-3 rounded-full bg-blue-500" />}
        />
        <StatCard
          label="Enrolled Courses"
          value={data.total_enrolled_courses}
          icon={<div className="w-3 h-3 rounded-full bg-violet-500" />}
        />
        <StatCard
          label="Hostel Room"
          value={data.hostel_status || 'Not Allocated'}
          icon={<div className="w-3 h-3 rounded-full bg-teal-500" />}
        />
        <StatCard
          label="Low Attendance"
          value={data.low_attendance_courses}
          icon={<div className={`w-3 h-3 rounded-full ${data.low_attendance_courses > 0 ? 'bg-danger-500' : 'bg-success-500'}`} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">Today's Schedule</h2>
              <Link to="/student/academics/schedule" className="text-sm text-primary-600 hover:underline">View full schedule</Link>
            </div>
            <div className="p-0">
              <ul className="divide-y">
                {data.today_schedule?.map((session: any) => (
                  <li key={session.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <div className="font-medium text-gray-900">{session.time_slot}</div>
                      <div className="text-sm text-gray-600">{session.room}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{session.course_name}</div>
                      <div className="text-xs text-gray-500 mt-1">{session.faculty_name}</div>
                    </div>
                  </li>
                ))}
                {(!data.today_schedule || data.today_schedule.length === 0) && (
                  <li className="p-8 text-center text-gray-500">No classes scheduled for today</li>
                )}
              </ul>
            </div>
          </Card>

          <Card>
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-800">Academic Progress</h2>
            </div>
            <div className="p-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.cgpa_trend || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="term" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="cgpa" name="CGPA" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="sgpa" name="SGPA" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card>
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-800">Alerts & Actions</h2>
            </div>
            <div className="p-4 space-y-4">
              {data.total_outstanding_dues > 0 && (
                <div className="flex items-start p-3 bg-danger-50 rounded-lg border border-danger-100">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-danger-800">Unpaid Fees</h3>
                    <p className="text-xs text-danger-700 mt-1">You have ₹{data.total_outstanding_dues.toLocaleString()} in unpaid fees.</p>
                  </div>
                  <Link to="/student/pay">
                    <Button variant="danger" size="sm">Pay</Button>
                  </Link>
                </div>
              )}
              
              {data.pending_exams > 0 && (
                <div className="flex items-start p-3 bg-warning-50 rounded-lg border border-warning-100">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-warning-800">Exam Registration</h3>
                    <p className="text-xs text-warning-700 mt-1">{data.pending_exams} upcoming exams require registration.</p>
                  </div>
                  <Link to="/student/academics/exams">
                    <Button variant="secondary" size="sm" className="bg-white">Register</Button>
                  </Link>
                </div>
              )}

              {data.low_attendance_courses > 0 && (
                <div className="flex items-start p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-amber-800">Low Attendance</h3>
                    <p className="text-xs text-amber-700 mt-1">You are below 75% attendance in {data.low_attendance_courses} courses.</p>
                  </div>
                  <Link to="/student/academics/attendance">
                    <Button variant="secondary" size="sm" className="bg-white">View</Button>
                  </Link>
                </div>
              )}
              
              {data.total_outstanding_dues === 0 && data.pending_exams === 0 && data.low_attendance_courses === 0 && (
                <div className="p-4 text-center">
                  <StatusPill status="success" label="All clear" />
                  <p className="text-sm text-gray-500 mt-2">You have no pending alerts.</p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-800">Quick Links</h2>
            </div>
            <div className="p-2">
              <Link to="/student/academics/courses" className="block p-3 text-sm text-gray-700 hover:bg-gray-50 rounded">My Courses</Link>
              <Link to="/student/academics/attendance" className="block p-3 text-sm text-gray-700 hover:bg-gray-50 rounded">Attendance Details</Link>
              <Link to="/student/academics/exams" className="block p-3 text-sm text-gray-700 hover:bg-gray-50 rounded">Exam Results</Link>
              <Link to="/student/pay" className="block p-3 text-sm text-gray-700 hover:bg-gray-50 rounded">Fee Payments</Link>
              <Link to="/student/hostel" className="block p-3 text-sm text-gray-700 hover:bg-gray-50 rounded">Hostel Details</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
