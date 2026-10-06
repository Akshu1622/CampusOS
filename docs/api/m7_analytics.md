# M7 Analytics and Audit API

## Endpoints

### 1. Get Report Data
**GET /api/v1/analytics/reports/{report_key}**
- **Summary**: Returns data for reports RP-1 to RP-10.
- **Roles Allowed**: Admin
- **Query Parameters**:
  - `page` (int, default=1): Page number.
  - `size` (int, default=20): Items per page.
  - `export_csv` (bool, default=false): If true, returns the result as a CSV file attachment.
  - `defaulter_threshold` (float, optional): Used only for RP-4 to filter students with dues greater than this value.
  - (Any other query parameter will be passed as a filter to the underlying report view)
- **Response Schema**:
  - If `export_csv=false`: `PaginatedResponse` (contains `data`, `total`, `page`, `size`) where `data` is a list of objects depending on the report (e.g., `DeptStudentRankingResponse`, `FeeCollectionSummaryResponse`, etc.).
  - If `export_csv=true`: Returns a `text/csv` stream.
- **Errors**:
  - `400 Bad Request`: If an invalid `report_key` is provided.
  - `401 Unauthorized`: Missing or invalid token.
  - `403 Forbidden`: Insufficient role permissions.

### 2. Get Audit Logs
**GET /api/v1/analytics/audit-logs**
- **Summary**: Get unified audit logs (combines general and fee audit logs).
- **Roles Allowed**: Admin
- **Query Parameters**:
  - `page` (int, default=1): Page number.
  - `size` (int, default=20): Items per page.
  - (Any other query parameter acts as a filter)
- **Response Schema**: `PaginatedResponse` containing `AuditLogResponse` objects.
  - `source` (str)
  - `log_id` (int)
  - `entity_name` (str)
  - `entity_id` (str)
  - `action` (str)
  - `before_state` (str, optional)
  - `after_state` (str, optional)
  - `actor` (str, optional)
  - `timestamp` (datetime)
- **Errors**:
  - `401 Unauthorized`
  - `403 Forbidden`

### 3. Run Integrity Checks
**GET /api/v1/analytics/integrity/checks**
- **Summary**: Runs and returns the results of system integrity checks.
- **Roles Allowed**: Admin
- **Response Schema**: List of `IntegrityCheckResponse`.
  - `module` (str)
  - `check_name` (str)
  - `status` (str): 'PASS' or 'FAIL'
  - `affected_count` (int)
  - `sample_keys` (str, optional)
- **Errors**:
  - `401 Unauthorized`
  - `403 Forbidden`

### 4. Admin Dashboard
**GET /api/v1/analytics/dashboard/admin**
- **Summary**: Get Admin dashboard metrics.
- **Roles Allowed**: Admin
- **Response Schema**: `AdminDashboardResponse`
  - `total_students` (int)
  - `total_faculty` (int)
  - `active_enrollments` (int)
  - `fees_collected_current` (float)
  - `fees_due_current` (float)
  - `beds_available` (float)
  - `pending_leaves` (int)
  - `pending_hostel_requests` (int)
  - `students_low_attendance` (int)
- **Errors**:
  - `401 Unauthorized`
  - `403 Forbidden`

### 5. Faculty Dashboard
**GET /api/v1/analytics/dashboard/faculty**
- **Summary**: Get Faculty dashboard metrics for the logged-in faculty.
- **Roles Allowed**: Faculty
- **Response Schema**: `FacultyDashboardResponse`
  - `assigned_offerings` (int)
  - `pending_marks_entry` (int)
  - `total_leave_balance` (float)
  - `latest_payslip_net` (float, optional)
- **Errors**:
  - `401 Unauthorized`
  - `403 Forbidden`
  - `404 Not Found`: No employee record linked to the user.

### 6. Student Dashboard
**GET /api/v1/analytics/dashboard/student**
- **Summary**: Get Student dashboard metrics for the logged-in student.
- **Roles Allowed**: Student
- **Response Schema**: `StudentDashboardResponse`
  - `total_enrolled_courses` (int)
  - `low_attendance_courses` (int)
  - `current_cgpa` (float, optional)
  - `total_outstanding_dues` (float)
  - `hostel_status` (str, optional)
  - `pending_exams` (int)
- **Errors**:
  - `401 Unauthorized`
  - `403 Forbidden`
  - `404 Not Found`: No student record linked to the user.
