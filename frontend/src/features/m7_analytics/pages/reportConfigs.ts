export interface ReportFilter {
  name: string
  label: string
  type: 'text' | 'number' | 'select'
  defaultValue?: string | number
  options?: { label: string; value: string }[]
}

export interface ReportColumn {
  header: string
  accessor: string
  key?: string
  width?: string
  align?: 'left' | 'center' | 'right'
  cell?: (row: any) => React.ReactNode
}

export interface ReportKPI {
  title: string
  value: string | number
}

export interface ReportChartConfig {
  type: 'bar' | 'donut'
  layout?: 'horizontal' | 'vertical'
  xAxisKey: string
  dataKeys?: { key: string; color: string; name?: string }[]
  nameKey?: string
  dataKey?: string
}

export interface ReportConfig {
  title: string
  description: string
  category: 'Academic' | 'Attendance' | 'Finance' | 'HR' | 'Hostel'
  filters: ReportFilter[]
  kpis: (data: any) => ReportKPI[]
  chart: ReportChartConfig | null
  columns: ReportColumn[]
}

export const reportConfigs: Record<string, ReportConfig> = {
  'RP-1': {
    title: 'Department-wise CGPA Ranking',
    description: 'Ranked roster of students partitioned by academic department and evaluated on CGPA (RANK window function).',
    category: 'Academic',
    filters: [
      { name: 'department_name', label: 'Department', type: 'text' },
      { name: 'program_name', label: 'Program', type: 'text' },
      { name: 'search', label: 'Search Student', type: 'text' }
    ],
    kpis: (data: any) => {
      const rows = data?.data || []
      const cgpas = rows.map((r: any) => Number(r.cgpa || 0)).filter((n: number) => n > 0)
      const avg = cgpas.length ? (cgpas.reduce((a: number, b: number) => a + b, 0) / cgpas.length).toFixed(2) : '0.00'
      const top = cgpas.length ? Math.max(...cgpas).toFixed(2) : '0.00'
      return [
        { title: 'Total Ranked Students', value: data?.total || rows.length },
        { title: 'Average Department CGPA', value: avg },
        { title: 'Highest CGPA', value: top }
      ]
    },
    chart: {
      type: 'bar',
      xAxisKey: 'student_name',
      dataKeys: [{ key: 'cgpa', color: 'var(--color-primary)', name: 'Cumulative GPA' }]
    },
    columns: [
      { header: 'Dept Rank', accessor: 'dept_rank', width: '90px' },
      { header: 'Student ID', accessor: 'student_id', width: '100px' },
      { header: 'Student Name', accessor: 'student_name' },
      { header: 'Department', accessor: 'department_name' },
      { header: 'Program', accessor: 'program_name' },
      { header: 'CGPA', accessor: 'cgpa', width: '90px' }
    ]
  },

  'RP-2': {
    title: 'Top N Students per Program & Term',
    description: "Dean's honor roll filtering the top N highest-achieving students across degree programs per term.",
    category: 'Academic',
    filters: [
      { name: 'limit', label: 'Top N Count', type: 'number', defaultValue: 10 },
      { name: 'program_name', label: 'Program', type: 'text' },
      { name: 'term_label', label: 'Term', type: 'text' },
      { name: 'search', label: 'Search Scholar', type: 'text' }
    ],
    kpis: (data: any) => {
      const rows = data?.data || []
      const cgpas = rows.map((r: any) => Number(r.cgpa || 0)).filter((n: number) => n > 0)
      const avg = cgpas.length ? (cgpas.reduce((a: number, b: number) => a + b, 0) / cgpas.length).toFixed(2) : '0.00'
      const top = cgpas.length ? Math.max(...cgpas).toFixed(2) : '0.00'
      return [
        { title: 'Top Scholars Listed', value: data?.total || rows.length },
        { title: 'Scholars Avg CGPA', value: avg },
        { title: 'Program Top Score', value: top }
      ]
    },
    chart: {
      type: 'bar',
      layout: 'vertical',
      xAxisKey: 'student_name',
      dataKeys: [{ key: 'cgpa', color: 'var(--color-primary)', name: 'CGPA' }]
    },
    columns: [
      { header: 'Term Rank', accessor: 'prog_term_rank', width: '100px' },
      { header: 'Student ID', accessor: 'student_id', width: '100px' },
      { header: 'Student Name', accessor: 'student_name' },
      { header: 'Program', accessor: 'program_name' },
      { header: 'Academic Term', accessor: 'term_label' },
      { header: 'CGPA', accessor: 'cgpa', width: '90px' }
    ]
  },

  'RP-3': {
    title: 'Courses with Attendance Below Threshold',
    description: 'Course offerings where class average attendance falls below institutional minimums (75% statutory requirement).',
    category: 'Attendance',
    filters: [
      { name: 'threshold', label: 'Shortage Threshold % (≤)', type: 'number', defaultValue: 75 },
      { name: 'term_label', label: 'Academic Term', type: 'text' },
      { name: 'course_code', label: 'Course Code', type: 'text' },
      { name: 'search', label: 'Search Course/Instructor', type: 'text' }
    ],
    kpis: (data: any) => {
      const rows = data?.data || []
      const totalEnrollments = rows.reduce((acc: number, r: any) => acc + Number(r.total_enrollments || 0), 0)
      const pcts = rows.map((r: any) => Number(r.avg_attendance_pct || 0))
      const lowest = pcts.length ? Math.min(...pcts).toFixed(1) : '0.0'
      return [
        { title: 'Shortage Offerings', value: data?.total || rows.length },
        { title: 'Students Impacted', value: totalEnrollments },
        { title: 'Lowest Average Recorded', value: `${lowest}%` }
      ]
    },
    chart: {
      type: 'bar',
      xAxisKey: 'course_code',
      dataKeys: [{ key: 'avg_attendance_pct', color: 'var(--color-warning)', name: 'Average Attendance %' }]
    },
    columns: [
      { header: 'Course Code', accessor: 'course_code', width: '120px' },
      { header: 'Course Title', accessor: 'course_title' },
      { header: 'Term', accessor: 'term_label', width: '120px' },
      { header: 'Lead Instructor', accessor: 'faculty_name' },
      { header: 'Enrollments', accessor: 'total_enrollments', width: '110px' },
      { header: 'Sessions', accessor: 'total_sessions', width: '90px' },
      { header: 'Average Attendance', accessor: 'avg_attendance_pct', width: '160px' }
    ]
  },

  'RP-4': {
    title: 'Fee Collection Summary & Defaulters',
    description: 'Aggregated semester dues, fee receipt collections, outstanding balances, and defaulter tallies across programs.',
    category: 'Finance',
    filters: [
      { name: 'defaulter_threshold', label: 'Defaulter Threshold (₹)', type: 'number', defaultValue: 1000 },
      { name: 'program_name', label: 'Program', type: 'text' },
      { name: 'term_label', label: 'Term', type: 'text' }
    ],
    kpis: (data: any) => {
      const rows = data?.data || []
      const totalDue = rows.reduce((sum: number, r: any) => sum + Number(r.total_due || 0), 0)
      const totalPaid = rows.reduce((sum: number, r: any) => sum + Number(r.total_paid || 0), 0)
      const totalBalance = rows.reduce((sum: number, r: any) => sum + Number(r.total_balance || 0), 0)
      const defaulters = rows.reduce((sum: number, r: any) => sum + Number(r.defaulters_count || 0), 0)
      return [
        { title: 'Total Due (₹)', value: `₹${totalDue.toLocaleString()}` },
        { title: 'Total Collected (₹)', value: `₹${totalPaid.toLocaleString()}` },
        { title: 'Outstanding Arrears (₹)', value: `₹${totalBalance.toLocaleString()}` },
        { title: 'Total Defaulters', value: defaulters }
      ]
    },
    chart: {
      type: 'bar',
      xAxisKey: 'program_name',
      dataKeys: [
        { key: 'total_paid', color: 'var(--color-success)', name: 'Collected Amount' },
        { key: 'total_balance', color: 'var(--color-error)', name: 'Outstanding Balance' }
      ]
    },
    columns: [
      { header: 'Academic Program', accessor: 'program_name' },
      { header: 'Term', accessor: 'term_label', width: '130px' },
      { header: 'Total Due', accessor: 'total_due' },
      { header: 'Total Collected', accessor: 'total_paid' },
      { header: 'Balance Outstanding', accessor: 'total_balance' },
      { header: 'Defaulters', accessor: 'defaulters_count', width: '100px' }
    ]
  },

  'RP-5': {
    title: 'Students with Dues Exceeding Campus Average',
    description: 'Subquery analytics identifying students carrying outstanding fee dues higher than the institutional average.',
    category: 'Finance',
    filters: [
      { name: 'program_name', label: 'Program', type: 'text' },
      { name: 'search', label: 'Search Student/ID', type: 'text' }
    ],
    kpis: (data: any) => {
      const rows = data?.data || []
      const avg = rows.length > 0 ? Number(rows[0].average_dues || 0).toLocaleString() : '0'
      const highest = rows.length > 0 ? Math.max(...rows.map((r: any) => Number(r.total_dues || 0))).toLocaleString() : '0'
      return [
        { title: 'High-Dues Cohort Size', value: data?.total || rows.length },
        { title: 'University Average Dues', value: `₹${avg}` },
        { title: 'Highest Individual Dues', value: `₹${highest}` }
      ]
    },
    chart: {
      type: 'bar',
      xAxisKey: 'student_name',
      dataKeys: [{ key: 'total_dues', color: 'var(--color-error)', name: 'Total Outstanding Dues' }]
    },
    columns: [
      { header: 'Student ID', accessor: 'global_student_id', width: '140px' },
      { header: 'Student Name', accessor: 'student_name' },
      { header: 'Program', accessor: 'program_name' },
      { header: 'Student Dues', accessor: 'total_dues' },
      { header: 'University Average', accessor: 'average_dues' }
    ]
  },

  'RP-6': {
    title: 'Hostel Block Capacity & Occupancy',
    description: 'Detailed analysis of university residential blocks, bed capacities, resident allotments, and occupancy rates.',
    category: 'Hostel',
    filters: [
      { name: 'gender_block', label: 'Gender Block', type: 'text' },
      { name: 'search', label: 'Search Hostel', type: 'text' }
    ],
    kpis: (data: any) => {
      const rows = data?.data || []
      const totalCap = rows.reduce((sum: number, r: any) => sum + Number(r.total_capacity || 0), 0)
      const occupied = rows.reduce((sum: number, r: any) => sum + Number(r.occupied_beds || 0), 0)
      const available = rows.reduce((sum: number, r: any) => sum + Number(r.available_beds || 0), 0)
      const overallPct = totalCap > 0 ? ((occupied / totalCap) * 100).toFixed(1) : '0.0'
      return [
        { title: 'Hostels Monitored', value: data?.total || rows.length },
        { title: 'Total Bed Capacity', value: totalCap },
        { title: 'Occupied Beds', value: occupied },
        { title: 'Campus Occupancy Rate', value: `${overallPct}%` }
      ]
    },
    chart: {
      type: 'bar',
      xAxisKey: 'hostel_name',
      dataKeys: [
        { key: 'occupied_beds', color: 'var(--color-primary)', name: 'Occupied Beds' },
        { key: 'available_beds', color: 'var(--color-success)', name: 'Available Beds' }
      ]
    },
    columns: [
      { header: 'Hostel Name', accessor: 'hostel_name' },
      { header: 'Block Type', accessor: 'gender_block', width: '120px' },
      { header: 'Total Beds', accessor: 'total_capacity', width: '110px' },
      { header: 'Occupied', accessor: 'occupied_beds', width: '100px' },
      { header: 'Available', accessor: 'available_beds', width: '100px' },
      { header: 'Occupancy Rate', accessor: 'occupancy_pct', width: '140px' }
    ]
  },

  'RP-7': {
    title: 'Departmental Monthly Payroll Summary',
    description: 'Monthly institutional payroll disbursements, statutory tax deductions, and net payouts aggregated by department.',
    category: 'HR',
    filters: [
      { name: 'payroll_month', label: 'Payroll Month (YYYY-MM)', type: 'text' },
      { name: 'department_name', label: 'Department', type: 'text' },
      { name: 'search', label: 'Search Department', type: 'text' }
    ],
    kpis: (data: any) => {
      const rows = data?.data || []
      const gross = rows.reduce((sum: number, r: any) => sum + Number(r.total_gross_pay || 0), 0)
      const net = rows.reduce((sum: number, r: any) => sum + Number(r.total_net_pay || 0), 0)
      const deductions = rows.reduce((sum: number, r: any) => sum + Number(r.total_deductions || 0), 0)
      return [
        { title: 'Total Gross Payroll', value: `₹${gross.toLocaleString()}` },
        { title: 'Total Deductions', value: `₹${deductions.toLocaleString()}` },
        { title: 'Net Disbursed', value: `₹${net.toLocaleString()}` }
      ]
    },
    chart: {
      type: 'bar',
      xAxisKey: 'department_name',
      dataKeys: [
        { key: 'total_net_pay', color: 'var(--color-success)', name: 'Net Pay' },
        { key: 'total_deductions', color: 'var(--color-warning)', name: 'Deductions' }
      ]
    },
    columns: [
      { header: 'Period', accessor: 'payroll_month', width: '110px' },
      { header: 'Department', accessor: 'department_name' },
      { header: 'Headcount', accessor: 'employee_count', width: '100px' },
      { header: 'Gross Pay', accessor: 'total_gross_pay' },
      { header: 'Deductions', accessor: 'total_deductions' },
      { header: 'Net Payout', accessor: 'total_net_pay' }
    ]
  },

  'RP-8': {
    title: 'Faculty Leave Utilisation vs Entitlement',
    description: 'Faculty leave consumption, statutory annual quotas, approved leave utilization, and remaining balances.',
    category: 'HR',
    filters: [
      { name: 'department_name', label: 'Department', type: 'text' },
      { name: 'leave_type_name', label: 'Leave Type', type: 'text' },
      { name: 'search', label: 'Search Faculty', type: 'text' }
    ],
    kpis: (data: any) => {
      const rows = data?.data || []
      const used = rows.reduce((sum: number, r: any) => sum + Number(r.used_leave || 0), 0)
      const balance = rows.reduce((sum: number, r: any) => sum + Number(r.available_balance || 0), 0)
      return [
        { title: 'Leave Allocations Tracked', value: data?.total || rows.length },
        { title: 'Total Days Utilized', value: used.toFixed(1) },
        { title: 'Total Balance Remaining', value: balance.toFixed(1) }
      ]
    },
    chart: {
      type: 'bar',
      xAxisKey: 'employee_name',
      dataKeys: [
        { key: 'used_leave', color: 'var(--color-warning)', name: 'Days Used' },
        { key: 'available_balance', color: 'var(--color-primary)', name: 'Days Balance' }
      ]
    },
    columns: [
      { header: 'Faculty Member', accessor: 'employee_name' },
      { header: 'Department', accessor: 'department_name' },
      { header: 'Leave Category', accessor: 'leave_type_name' },
      { header: 'Annual Quota', accessor: 'annual_quota', width: '110px' },
      { header: 'Days Used', accessor: 'used_leave', width: '100px' },
      { header: 'Available Balance', accessor: 'available_balance', width: '130px' }
    ]
  },

  'RP-9': {
    title: 'Course Examination Pass % & Grade Distribution',
    description: 'Statistical review of student examination outcomes, pass percentages, and distribution across letter grades (A/B/C/F).',
    category: 'Academic',
    filters: [
      { name: 'term_label', label: 'Academic Term', type: 'text' },
      { name: 'course_code', label: 'Course Code', type: 'text' },
      { name: 'search', label: 'Search Course/Instructor', type: 'text' }
    ],
    kpis: (data: any) => {
      const rows = data?.data || []
      const passed = rows.reduce((sum: number, r: any) => sum + Number(r.passed_count || 0), 0)
      const total = rows.reduce((sum: number, r: any) => sum + Number(r.total_results || 0), 0)
      const avgPass = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0'
      const aGrades = rows.reduce((sum: number, r: any) => sum + Number(r.grade_a_count || 0), 0)
      return [
        { title: 'Overall Pass Rate', value: `${avgPass}%` },
        { title: 'Total Evaluated Results', value: total },
        { title: 'Honors (A Grades) Awarded', value: aGrades }
      ]
    },
    chart: {
      type: 'bar',
      xAxisKey: 'course_code',
      dataKeys: [{ key: 'pass_pct', color: 'var(--color-primary)', name: 'Pass %' }]
    },
    columns: [
      { header: 'Course Code', accessor: 'course_code', width: '110px' },
      { header: 'Course Title', accessor: 'course_title' },
      { header: 'Term', accessor: 'term_label', width: '110px' },
      { header: 'Instructor', accessor: 'faculty_name' },
      { header: 'Graded', accessor: 'total_results', width: '80px' },
      { header: 'Passed', accessor: 'passed_count', width: '80px' },
      { header: 'Failed', accessor: 'failed_count', width: '80px' },
      { header: 'Pass %', accessor: 'pass_pct', width: '90px' },
      { header: 'A Grades', accessor: 'grade_a_count', width: '90px' },
      { header: 'B Grades', accessor: 'grade_b_count', width: '90px' },
      { header: 'C Grades', accessor: 'grade_c_count', width: '90px' },
      { header: 'F Grades', accessor: 'grade_f_count', width: '90px' }
    ]
  },

  'RP-10': {
    title: 'Exam Ineligible / Attendance Barred Roster',
    description: 'Statutory roster of students barred from semester final examinations due to critical lecture attendance shortage (<75%).',
    category: 'Attendance',
    filters: [
      { name: 'term_label', label: 'Academic Term', type: 'text' },
      { name: 'course_code', label: 'Course Code', type: 'text' },
      { name: 'search', label: 'Search Student/Course', type: 'text' }
    ],
    kpis: (data: any) => {
      const rows = data?.data || []
      const pcts = rows.map((r: any) => Number(r.attendance_pct || 0))
      const avg = pcts.length ? (pcts.reduce((a: number, b: number) => a + b, 0) / pcts.length).toFixed(1) : '0.0'
      const distinctStudents = new Set(rows.map((r: any) => r.student_id)).size
      return [
        { title: 'Total Barred Registrations', value: data?.total || rows.length },
        { title: 'Distinct Students Barred', value: distinctStudents },
        { title: 'Average Barred Attendance', value: `${avg}%` }
      ]
    },
    chart: null,
    columns: [
      { header: 'Student ID', accessor: 'global_student_id', width: '140px' },
      { header: 'Student Name', accessor: 'student_name' },
      { header: 'Academic Term', accessor: 'term_label', width: '120px' },
      { header: 'Course Code', accessor: 'course_code', width: '110px' },
      { header: 'Course Title', accessor: 'course_title' },
      { header: 'Recorded Attendance', accessor: 'attendance_pct', width: '150px' },
      { header: 'Eligibility Status', accessor: 'eligibility_status', width: '140px' }
    ]
  }
}
