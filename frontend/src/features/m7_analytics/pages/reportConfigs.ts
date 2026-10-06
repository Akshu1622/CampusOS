export const reportConfigs: Record<string, any> = {
  'RP-1': {
    title: 'Department-wise CGPA Ranking',
    filters: [{ name: 'department_id', label: 'Department', type: 'text' }],
    kpis: (data: any) => [
      { title: 'Total Students', value: data?.total_students || 0 },
      { title: 'Average CGPA', value: data?.avg_cgpa?.toFixed(2) || '0.00' }
    ],
    chart: { type: 'bar', xAxisKey: 'name', dataKeys: [{ key: 'cgpa', color: 'var(--color-primary)' }] },
    columns: [
      { header: 'Rank', accessor: 'rank' },
      { header: 'Student ID', accessor: 'student_id' },
      { header: 'Name', accessor: 'name' },
      { header: 'CGPA', accessor: 'cgpa' }
    ]
  },
  'RP-2': {
    title: 'Top N Students',
    filters: [
      { name: 'program_id', label: 'Program', type: 'text' },
      { name: 'term_id', label: 'Term', type: 'text' },
      { name: 'limit', label: 'Top N', type: 'number', defaultValue: 10 }
    ],
    chart: { type: 'bar', layout: 'vertical', xAxisKey: 'name', dataKeys: [{ key: 'cgpa', color: 'var(--color-primary)' }] },
    columns: [
      { header: 'Rank', accessor: 'rank' },
      { header: 'Student ID', accessor: 'student_id' },
      { header: 'Name', accessor: 'name' },
      { header: 'Program', accessor: 'program' },
      { header: 'CGPA', accessor: 'cgpa' }
    ]
  },
  'RP-3': {
    title: 'Low Attendance Courses',
    filters: [
      { name: 'term_id', label: 'Term', type: 'text' },
      { name: 'threshold', label: 'Threshold %', type: 'number', defaultValue: 75 }
    ],
    chart: { type: 'bar', xAxisKey: 'course_code', dataKeys: [{ key: 'avg_attendance', color: 'var(--color-warning-500)' }] },
    columns: [
      { header: 'Course Code', accessor: 'course_code' },
      { header: 'Course Title', accessor: 'course_title' },
      { header: 'Avg Attendance %', accessor: 'avg_attendance' }
    ]
  },
  'RP-4': {
    title: 'Fee Collection Summary & Defaulters',
    filters: [
      { name: 'term_id', label: 'Term', type: 'text' },
      { name: 'defaulter_threshold', label: 'Threshold Amount', type: 'number', defaultValue: 1000 }
    ],
    chart: { type: 'donut', nameKey: 'status', dataKey: 'amount' },
    columns: [
      { header: 'Program', accessor: 'program' },
      { header: 'Total Due', accessor: 'total_due' },
      { header: 'Total Collected', accessor: 'total_collected' },
      { header: 'Defaulters', accessor: 'defaulters_count' }
    ]
  },
  'RP-5': {
    title: 'High Dues Students',
    filters: [
      { name: 'term_id', label: 'Term', type: 'text' }
    ],
    chart: null,
    columns: [
      { header: 'Student ID', accessor: 'student_id' },
      { header: 'Name', accessor: 'name' },
      { header: 'Dues', accessor: 'dues' },
      { header: 'Avg Dues', accessor: 'avg_dues' }
    ]
  },
  'RP-6': {
    title: 'Hostel Occupancy',
    filters: [
      { name: 'hostel_id', label: 'Hostel', type: 'text' }
    ],
    chart: { type: 'bar', xAxisKey: 'hostel', dataKeys: [{ key: 'occupied', color: 'var(--color-primary)' }, { key: 'available', color: 'var(--color-gray-300)' }] },
    columns: [
      { header: 'Hostel', accessor: 'hostel' },
      { header: 'Room', accessor: 'room' },
      { header: 'Total Beds', accessor: 'total_beds' },
      { header: 'Occupied', accessor: 'occupied' },
      { header: 'Available', accessor: 'available' }
    ]
  },
  'RP-7': {
    title: 'Payroll Summary',
    filters: [
      { name: 'month', label: 'Month', type: 'text' },
      { name: 'year', label: 'Year', type: 'number' }
    ],
    chart: { type: 'bar', xAxisKey: 'department', dataKeys: [{ key: 'total_net', color: 'var(--color-success-500)' }] },
    columns: [
      { header: 'Department', accessor: 'department' },
      { header: 'Total Gross', accessor: 'total_gross' },
      { header: 'Total Deductions', accessor: 'total_deductions' },
      { header: 'Total Net', accessor: 'total_net' }
    ]
  },
  'RP-8': {
    title: 'Faculty Leave Utilisation',
    filters: [
      { name: 'department_id', label: 'Department', type: 'text' }
    ],
    chart: null,
    columns: [
      { header: 'Employee ID', accessor: 'employee_id' },
      { header: 'Name', accessor: 'name' },
      { header: 'Entitlement', accessor: 'entitlement' },
      { header: 'Used', accessor: 'used' },
      { header: 'Balance', accessor: 'balance' }
    ]
  },
  'RP-9': {
    title: 'Pass Percentage & Grades',
    filters: [
      { name: 'term_id', label: 'Term', type: 'text' }
    ],
    chart: { type: 'bar', xAxisKey: 'course_code', dataKeys: [{ key: 'pass_percentage', color: 'var(--color-primary)' }] },
    columns: [
      { header: 'Course Code', accessor: 'course_code' },
      { header: 'Total Students', accessor: 'total_students' },
      { header: 'Passed', accessor: 'passed' },
      { header: 'Pass Percentage', accessor: 'pass_percentage' }
    ]
  },
  'RP-10': {
    title: 'Exam Ineligible List',
    filters: [
      { name: 'term_id', label: 'Term', type: 'text' },
      { name: 'exam_id', label: 'Exam', type: 'text' }
    ],
    chart: null,
    columns: [
      { header: 'Student ID', accessor: 'student_id' },
      { header: 'Name', accessor: 'name' },
      { header: 'Course', accessor: 'course_code' },
      { header: 'Attendance %', accessor: 'attendance_percentage' },
      { header: 'Reason', accessor: 'reason' }
    ]
  }
}
