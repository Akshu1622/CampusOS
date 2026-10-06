import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../../components/ui/Card'
import { Tabs } from '../../../components/ui/Tabs'
import { Button } from '../../../components/ui/Button'

const REPORTS = [
  { id: 'RP-1', title: 'Department-wise CGPA Ranking', description: 'Ranked table of students by CGPA.', category: 'Academic' },
  { id: 'RP-2', title: 'Top N Students', description: 'Top N students per program per term.', category: 'Academic' },
  { id: 'RP-3', title: 'Low Attendance Courses', description: 'Courses with average attendance below threshold.', category: 'Attendance' },
  { id: 'RP-4', title: 'Fee Collection Summary', description: 'Fee collection summary by program/term & defaulters.', category: 'Finance' },
  { id: 'RP-5', title: 'High Dues Students', description: 'Students whose dues exceed the average dues.', category: 'Finance' },
  { id: 'RP-6', title: 'Hostel Occupancy', description: 'Hostel occupancy by hostel.', category: 'Hostel' },
  { id: 'RP-7', title: 'Payroll Summary', description: 'Payroll summary by department/month.', category: 'HR' },
  { id: 'RP-8', title: 'Faculty Leave Utilisation', description: 'Faculty leave utilisation vs. entitlement.', category: 'HR' },
  { id: 'RP-9', title: 'Pass Percentage & Grades', description: 'Course-wise pass percentage and grade distribution.', category: 'Academic' },
  { id: 'RP-10', title: 'Exam Ineligible List', description: 'Exam registration blocked/ineligible list.', category: 'Attendance' }
]

const CATEGORIES = ['All', 'Academic', 'Attendance', 'Finance', 'HR', 'Hostel']

export function R01ReportsHubPage() {
  const [search, setSearch] = useState('')

  const renderGrid = (category: string) => {
    const filteredReports = REPORTS.filter(report => {
      const matchesSearch = report.title.toLowerCase().includes(search.toLowerCase()) || report.description.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = category === 'All' || report.category === category
      return matchesSearch && matchesCategory
    })

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {filteredReports.map(report => (
          <Card key={report.id}>
            <div className="p-5 flex flex-col h-full">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded text-gray-600">
                  {report.category}
                </span>
                <span className="text-sm text-gray-400">{report.id}</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{report.title}</h3>
              <p className="text-sm text-gray-600 mb-6 flex-grow">{report.description}</p>
              <Link to={`/admin/analytics/reports/${report.id}`}>
                <Button variant="primary" className="w-full">Open Report</Button>
              </Link>
            </div>
          </Card>
        ))}
        {filteredReports.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No reports found matching your criteria.
          </div>
        )}
      </div>
    )
  }

  const tabsData = CATEGORIES.map(cat => ({
    id: cat,
    label: cat,
    content: renderGrid(cat)
  }))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reports Hub</h1>
      </div>

      <div className="mb-4">
        <input 
          type="text" 
          placeholder="Search reports..." 
          className="border border-gray-300 rounded px-4 py-2 w-full md:w-96"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs 
        tabs={tabsData}
        defaultActive="All"
        variant="underline"
      />
    </div>
  )
}
