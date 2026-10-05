# UI Traceability Matrix

This matrix maps every Page ID defined in `design.md` to the database tables it reads and writes, ensuring full logical coverage.

## Core Platform (C)
| Page ID | Name | Reads Tables | Writes Tables |
|---|---|---|---|
| C-01 | Login | `user_account`, `login_attempt` | `login_attempt`, `refresh_token`, `user_account` |
| C-02 | Admin Dashboard | `student`, `enrollment`, `student_fee`, `room`, `attendance_record`, `leave_application`, `hostel_request` | None |
| C-03 | Faculty Dashboard | `course_offering`, `attendance_session`, `exam_marks_result`, `leave_entitlement`, `leave_application` | None |
| C-04 | Student Dashboard | `student_fee`, `semester_result`, `enrollment`, `attendance_record`, `exam_registration` | None |
| C-05 | My Profile | `user_account`, `student`, `employee` | `user_account`, `student`, `employee` |
| C-06 | User Management | `user_account`, `role`, `permission_set`, `student`, `employee` | `user_account`, `role_assignment`, `admin_permission_set_assignment` |
| C-07 | Roles & Permissions | `role`, `permission_set`, `user_account`, `admin_permission_set_assignment` | `admin_permission_set_assignment` |
| C-08 | Department Management | `department`, `employee` | `department` |
| C-09 | Program Management | `program`, `department` | `program` |
| C-10 | Term Management | `academic_term` | `academic_term` |
| C-11 | Student Master | `student`, `program`, `user_account` | `student`, `user_account` |
| C-12 | Faculty/Staff Master | (See H-01) | (See H-01) |

## Academics & Enrollment (A)
| Page ID | Name | Reads Tables | Writes Tables |
|---|---|---|---|
| A-01 | Course Catalog | `course`, `department` | `course` |
| A-02 | Curriculum Mapping | `program`, `course`, `curriculum_mapping` | `curriculum_mapping` |
| A-03 | Course Offerings | `course_offering`, `course`, `academic_term`, `employee`, `enrollment` | `course_offering` |
| A-04 | Individual Enrollment | `student`, `course_offering`, `enrollment` | `enrollment` |
| A-05 | Bulk Enrollment | `student`, `course_offering` | `enrollment`, `bulk_enrollment_batch`, `bulk_enrollment_batch_log` |
| A-06 | Enrollment Records | `enrollment`, `student`, `course_offering` | `enrollment` |
| A-07 | My Courses | `enrollment`, `course_offering`, `attendance_record`, `exam_marks_result` | None |
| A-08 | My Teaching | `course_offering`, `enrollment`, `student` | None |

## Attendance & Exams (E)
| Page ID | Name | Reads Tables | Writes Tables |
|---|---|---|---|
| E-01 | Mark Attendance | `course_offering`, `enrollment`, `attendance_session` | `attendance_session`, `attendance_record` |
| E-02 | Attendance History | `attendance_session`, `attendance_record` | `attendance_record` |
| E-03 | My Attendance | `attendance_record`, `attendance_session`, `course_offering` | None |
| E-04 | Attendance Shortage | `attendance_record`, `attendance_session`, `enrollment` | None |
| E-05 | Exam Management | `exam`, `course_offering` | `exam` |
| E-06 | Exam Registration | `exam`, `attendance_record`, `enrollment`, `exam_registration` | `exam_registration` |
| E-07 | Exam Reg. Monitor | `exam_registration`, `exam`, `student` | None |
| E-08 | Marks Entry | `exam`, `exam_registration`, `exam_marks_result` | `exam_marks_result` |
| E-09 | Result Processing | `exam_marks_result`, `grade_scale`, `semester_result` | `exam_marks_result` (publish flag), `semester_result` |
| E-10 | My Results | `semester_result`, `exam_marks_result` | None |
| E-11 | Grade Scale | `grade_scale` | `grade_scale` |
| E-12 | Course Result Summary| `exam_marks_result`, `exam` | None |

## Finance (F)
| Page ID | Name | Reads Tables | Writes Tables |
|---|---|---|---|
| F-01 | Fee Structure | `fee_structure`, `fee_component`, `program`, `academic_term` | `fee_structure`, `fee_component` |
| F-02 | Fee Assignment | `student`, `fee_structure`, `fee_component`, `student_fee` | `student_fee` |
| F-03 | Late Fee Rule | `late_fee_rule` | `late_fee_rule` |
| F-04 | My Fees | `student_fee`, `fee_component` | None |
| F-05 | Pay Fee | `student_fee`, `late_fee_rule` | `payment`, `payment_allocation`, `receipt`, `student_fee` |
| F-06 | Receipt | `receipt`, `payment`, `payment_allocation` | None |
| F-07 | Receipt History | `receipt`, `payment` | None |
| F-08 | Payment Ledger | `payment`, `receipt`, `student` | None |
| F-09 | Fee Defaulters | `student_fee`, `student` | None |
| F-10 | Fee Audit Log | `fee_audit_log` | None |

## HR & Payroll (H)
| Page ID | Name | Reads Tables | Writes Tables |
|---|---|---|---|
| H-01 | Employee Master | `employee`, `department`, `designation` | `employee`, `user_account` |
| H-02 | Designation | `designation` | `designation` |
| H-03 | Leave Types | `leave_type`, `leave_entitlement` | `leave_type`, `leave_entitlement` |
| H-04 | Apply Leave | `leave_type`, `leave_entitlement`, `leave_application` | `leave_application` |
| H-05 | My Leave | `leave_application`, `leave_entitlement` | `leave_application` (cancel) |
| H-06 | Leave Approvals | `leave_application`, `employee` | `leave_application` (status update) |
| H-07 | Salary Structure | `salary_structure`, `designation` | `salary_structure` |
| H-08 | Payroll Run | `employee`, `salary_structure`, `leave_application`, `payroll_run` | `payroll_run`, `payslip`, `payslip_line` |
| H-09 | Payroll Register | `payroll_run`, `payslip`, `payslip_line` | None |
| H-10 | My Payslips | `payslip`, `payslip_line` | None |

## Hostel (S)
| Page ID | Name | Reads Tables | Writes Tables |
|---|---|---|---|
| S-01 | Hostel & Room | `hostel`, `room` | `hostel`, `room` |
| S-02 | Room Allocation | `student`, `room`, `hostel_allocation` | `hostel_allocation`, `room` (via trigger) |
| S-03 | Occupancy Dashboard| `hostel`, `room` | None |
| S-04 | My Hostel | `hostel_allocation`, `room` | None |
| S-05 | New Hostel Request | `hostel_request`, `student` | `hostel_request` |
| S-06 | My Hostel Requests | `hostel_request` | `hostel_request` (cancel) |
| S-07 | Request Review | `hostel_request`, `student`, `room` | `hostel_request`, `hostel_allocation` |

## Analytics & Audit (R)
| Page ID | Name | Reads Tables | Writes Tables |
|---|---|---|---|
| R-01 | Reports Hub | Metadata only (Role/Permission) | None |
| R-02 | Report Pages | Views across M7 combining tables | None |
| R-03 | System Audit Log | `general_audit_log` | None |
| R-04 | Data Integrity | Custom DB consistency queries | None |
