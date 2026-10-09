const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));
const fs = require('fs');

const BASE_URL = 'http://localhost:5173';

const pages = [
  // Public
  { id: 'PUB-01', route: '/login', role: 'Public', title: 'Login' },
  { id: 'PUB-02', route: '/styleguide', role: 'Public', title: 'Styleguide' },
  { id: 'PUB-03', route: '/session-expired', role: 'Public', title: 'Session Expired' },

  // Admin
  { id: 'M1-01', route: '/admin', role: 'Admin', title: 'Admin Dashboard' },
  { id: 'M1-02', route: '/admin/profile', role: 'Admin', title: 'Admin Profile' },
  { id: 'M1-03', route: '/admin/users', role: 'Admin', title: 'User Management' },
  { id: 'M1-04', route: '/admin/roles', role: 'Admin', title: 'Role Management' },
  { id: 'M1-05', route: '/admin/departments', role: 'Admin', title: 'Department Management' },
  { id: 'M1-06', route: '/admin/programs', role: 'Admin', title: 'Program Management' },
  { id: 'M1-07', route: '/admin/terms', role: 'Admin', title: 'Academic Terms' },
  { id: 'M1-08', route: '/admin/students', role: 'Admin', title: 'Student Master' },
  { id: 'A-01', route: '/admin/academics/courses', role: 'Admin', title: 'Course Catalog' },
  { id: 'A-01b', route: '/admin/courses', role: 'Admin', title: 'Course Catalog (Alias)' },
  { id: 'A-02', route: '/admin/academics/curriculum', role: 'Admin', title: 'Curriculum Mapping' },
  { id: 'A-03', route: '/admin/academics/offerings', role: 'Admin', title: 'Course Offerings' },
  { id: 'A-04', route: '/admin/academics/enrollment/individual', role: 'Admin', title: 'Individual Enrollment' },
  { id: 'A-05', route: '/admin/academics/enrollment/bulk', role: 'Admin', title: 'Bulk Enrollment' },
  { id: 'A-06', route: '/admin/academics/enrollment/records', role: 'Admin', title: 'Enrollment Records' },
  { id: 'A-06b', route: '/admin/enrollments/records', role: 'Admin', title: 'Enrollment Records (Alias)' },
  { id: 'E-01', route: '/admin/attendance/mark', role: 'Admin', title: 'Mark Attendance' },
  { id: 'E-02', route: '/admin/attendance/sessions', role: 'Admin', title: 'Attendance Sessions' },
  { id: 'E-02b', route: '/admin/attendance', role: 'Admin', title: 'Attendance (Alias)' },
  { id: 'E-04', route: '/admin/attendance/shortage', role: 'Admin', title: 'Attendance Shortage Report' },
  { id: 'E-05', route: '/admin/exams/management', role: 'Admin', title: 'Exam Management' },
  { id: 'E-05b', route: '/admin/exams', role: 'Admin', title: 'Exams (Alias)' },
  { id: 'E-07', route: '/admin/exams/registrations', role: 'Admin', title: 'Exam Registration Monitor' },
  { id: 'E-08', route: '/admin/exams/marks', role: 'Admin', title: 'Marks Entry' },
  { id: 'E-09', route: '/admin/exams/results/process', role: 'Admin', title: 'Result Processing' },
  { id: 'E-11', route: '/admin/exams/grade-scale', role: 'Admin', title: 'Grade Scale Config' },
  { id: 'E-12', route: '/admin/exams/results/summary', role: 'Admin', title: 'Course Result Summary' },
  { id: 'M4-01', route: '/admin/finance/fee-structures', role: 'Admin', title: 'Fee Structures' },
  { id: 'M4-02', route: '/admin/finance/fee-assignment', role: 'Admin', title: 'Fee Assignment Wizard' },
  { id: 'M4-03', route: '/admin/finance/late-fee-rules', role: 'Admin', title: 'Late Fee Rules' },
  { id: 'M4-04', route: '/admin/finance/receipt-history', role: 'Admin', title: 'Receipt History' },
  { id: 'M4-05', route: '/admin/finance/ledger', role: 'Admin', title: 'Payment Ledger' },
  { id: 'M4-06', role: 'Admin', route: '/admin/finance/defaulters', title: 'Fee Defaulters' },
  { id: 'M4-07', role: 'Admin', route: '/admin/finance/audit', title: 'Fee Audit Trail' },
  { id: 'M5-01', role: 'Admin', route: '/admin/hr/employees', title: 'Employee Master' },
  { id: 'M5-02', role: 'Admin', route: '/admin/hr/designations', title: 'Designation Management' },
  { id: 'M5-03', role: 'Admin', route: '/admin/hr/leave-types', title: 'Leave Type Policies' },
  { id: 'M5-04', role: 'Admin', route: '/admin/hr/leave-approvals', title: 'Leave Approvals' },
  { id: 'M5-05', role: 'Admin', route: '/admin/hr/salary-structures', title: 'Salary Structures' },
  { id: 'M5-06', role: 'Admin', route: '/admin/hr/payroll-run', title: 'Payroll Run' },
  { id: 'M5-07', role: 'Admin', route: '/admin/hr/payroll-register', title: 'Payroll Register' },
  { id: 'S-01', role: 'Admin', route: '/admin/hostel/management', title: 'Hostel & Room Management' },
  { id: 'S-02', role: 'Admin', route: '/admin/hostel/room-allocation', title: 'Room Allocation' },
  { id: 'S-03', role: 'Admin', route: '/admin/hostel/occupancy-dashboard', title: 'Hostel Occupancy Dashboard' },
  { id: 'S-07', role: 'Admin', route: '/admin/hostel/requests', title: 'Hostel Request Review' },
  { id: 'R-01', role: 'Admin', route: '/admin/analytics/reports', title: 'Analytics Reports Hub' },
  { id: 'R-02', role: 'Admin', route: '/admin/analytics/reports/attendance-shortage', title: 'Report Viewer' },
  { id: 'R-03', role: 'Admin', route: '/admin/analytics/audit-logs', title: 'Audit Log Viewer' },
  { id: 'R-04', role: 'Admin', route: '/admin/analytics/integrity-checks', title: 'Data Integrity Status' },

  // Faculty
  { id: 'F-01', role: 'Faculty', route: '/faculty', title: 'Faculty Dashboard' },
  { id: 'F-02', role: 'Faculty', route: '/faculty/profile', title: 'Faculty Profile' },
  { id: 'A-08', role: 'Faculty', route: '/faculty/courses', title: 'My Teaching Courses' },
  { id: 'A-08b', role: 'Faculty', route: '/faculty/teaching', title: 'My Teaching (Alias)' },
  { id: 'E-01f', role: 'Faculty', route: '/faculty/attendance', title: 'Faculty Mark Attendance' },
  { id: 'E-02f', role: 'Faculty', route: '/faculty/attendance/history', title: 'Faculty Attendance History' },
  { id: 'E-04f', role: 'Faculty', route: '/faculty/attendance/shortage', title: 'Faculty Shortage Report' },
  { id: 'E-08f', role: 'Faculty', route: '/faculty/marks', title: 'Faculty Marks Entry' },
  { id: 'E-12f', role: 'Faculty', route: '/faculty/results/summary', title: 'Faculty Results Summary' },
  { id: 'M5-08', role: 'Faculty', route: '/faculty/hr/apply-leave', title: 'Apply Leave' },
  { id: 'M5-09', role: 'Faculty', route: '/faculty/hr/my-leave', title: 'My Leaves' },
  { id: 'M5-10', role: 'Faculty', role: 'Faculty', route: '/faculty/hr/payslips', title: 'My Payslips' },

  // Student
  { id: 'ST-01', role: 'Student', route: '/student', title: 'Student Dashboard' },
  { id: 'ST-02', role: 'Student', route: '/student/profile', title: 'Student Profile' },
  { id: 'A-07', role: 'Student', route: '/student/courses', title: 'My Enrolled Courses' },
  { id: 'E-03', role: 'Student', route: '/student/attendance', title: 'My Attendance' },
  { id: 'E-06', role: 'Student', route: '/student/exams', title: 'Student Exam Registration' },
  { id: 'E-06b', role: 'Student', route: '/student/exams/registration', title: 'Exam Registration (Alias)' },
  { id: 'E-10', role: 'Student', route: '/student/results', title: 'My Results & Grades' },
  { id: 'M4-08', role: 'Student', route: '/student/fees', title: 'My Fees & Dues' },
  { id: 'M4-09', role: 'Student', route: '/student/pay', title: 'Pay Fee Wizard' },
  { id: 'M4-10', role: 'Student', route: '/student/receipt/REC-001', title: 'Payment Receipt' },
  { id: 'M4-11', role: 'Student', route: '/student/receipt-history', title: 'Student Receipt History' },
  { id: 'S-04', role: 'Student', route: '/student/hostel', title: 'My Hostel' },
  { id: 'S-05', role: 'Student', route: '/student/hostel/new-request', title: 'New Hostel Request' },
  { id: 'S-06', role: 'Student', route: '/student/hostel/requests', title: 'My Hostel Requests' },
];

async function loginUser(page, username, password) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button:has-text("Sign in")');
  await page.waitForTimeout(1000);
}

async function run() {
  console.log('Starting page crawler across 78 routes...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const results = [];
  let currentRole = null;

  for (const item of pages) {
    const consoleErrors = [];
    const networkErrors = [];

    const onConsole = (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('Failed to load resource') && !text.includes('favicon')) {
          consoleErrors.push(text.slice(0, 100));
        }
      }
    };

    const onResponse = (resp) => {
      const status = resp.status();
      const url = resp.url();
      if (status >= 400 && !url.includes('favicon') && !url.includes('/auth/refresh')) {
        // tolerate 404 for receipt detail if not found, or 403 on admin_core for hr
        networkErrors.push(`${status} ${path.basename(url.split('?')[0])}`);
      }
    };

    page.on('console', onConsole);
    page.on('response', onResponse);

    // Switch user if role changed
    if (item.role !== currentRole) {
      currentRole = item.role;
      if (item.role === 'Admin') {
        await loginUser(page, 'admin_core', 'password123');
      } else if (item.role === 'Faculty') {
        await loginUser(page, 'faculty1', 'password123');
      } else if (item.role === 'Student') {
        await loginUser(page, 'student1', 'password123');
      }
    }

    try {
      await page.goto(`${BASE_URL}${item.route}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(600);

      // Check if Error Boundary is displayed
      const errorBoundary = await page.locator('text=Something went wrong').count();
      const notFound = await page.locator('text=Page Not Found').count();

      let status = 'OK';
      let notes = 'Renders cleanly';

      if (errorBoundary > 0) {
        status = 'broken';
        notes = 'Error boundary rendered';
      } else if (notFound > 0 && !item.route.includes('404')) {
        status = 'broken';
        notes = '404 Not Found';
      } else if (consoleErrors.length > 0) {
        notes = `Console warnings/errors: ${consoleErrors[0]}`;
      } else if (networkErrors.length > 0) {
        notes = `Network: ${networkErrors.slice(0, 2).join(', ')}`;
      }

      console.log(`[${status}] ${item.id.padEnd(7)} | ${item.role.padEnd(8)} | ${item.route.padEnd(40)} | ${notes}`);
      results.push({
        id: item.id,
        route: item.route,
        role: item.role,
        title: item.title,
        status,
        notes
      });
    } catch (err) {
      console.log(`[broken] ${item.id.padEnd(7)} | ${item.role.padEnd(8)} | ${item.route.padEnd(40)} | Error: ${err.message}`);
      results.push({
        id: item.id,
        route: item.route,
        role: item.role,
        title: item.title,
        status: 'broken',
        notes: `Load failed: ${err.message}`
      });
    } finally {
      page.off('console', onConsole);
      page.off('response', onResponse);
    }
  }

  await browser.close();

  // Generate docs/PAGE_HEALTH.md
  let md = '# Page Health Status Report\n\n';
  md += `*Generated: ${new Date().toISOString()}*\n\n`;
  md += `Total Pages Tested: **${results.length}**\n`;
  const okCount = results.filter(r => r.status === 'OK').length;
  const brokenCount = results.filter(r => r.status === 'broken').length;
  md += `Passing: **${okCount}** | Broken: **${brokenCount}**\n\n`;
  md += '| Page ID | Route | Role | Status | Notes |\n';
  md += '|---------|-------|------|--------|-------|\n';

  for (const r of results) {
    const statusBadge = r.status === 'OK' ? '✅ OK' : '❌ Broken';
    md += `| \`${r.id}\` | \`${r.route}\` | ${r.role} | ${statusBadge} | ${r.notes.replace(/\|/g, '\\|')} |\n`;
  }

  const docPath = path.resolve(__dirname, '..', 'docs', 'PAGE_HEALTH.md');
  fs.writeFileSync(docPath, md, 'utf-8');
  console.log(`\nSuccessfully wrote report to ${docPath}`);
}

run().catch(console.error);
