# Integration Mapping Document

## 1. Cross-Module Foreign Keys

| FK Column | Consumer Module | Producer Module (Target) | Key Type | Delete Behavior |
|---|---|---|---|---|
| `department.head_employee_id` | M1 Core | M5 HR (`employee.id`) | BIGINT | SET NULL |
| `user_account.student_id` | M1 Core | M1 Core (`student.id`) | BIGINT | RESTRICT |
| `user_account.employee_id` | M1 Core | M5 HR (`employee.id`) | BIGINT | RESTRICT |
| `course_offering.term_id` | M2 Academics | M1 Core (`academic_term.id`) | INT | RESTRICT |
| `course_offering.faculty_id` | M2 Academics | M5 HR (`employee.id`) | BIGINT | RESTRICT |
| `enrollment.student_id` | M2 Academics | M1 Core (`student.id`) | BIGINT | RESTRICT |
| `exam_registration.student_id` | M3 Exams | M1 Core (`student.id`) | BIGINT | RESTRICT |
| `semester_result.student_id` | M3 Exams | M1 Core (`student.id`) | BIGINT | RESTRICT |
| `semester_result.term_id` | M3 Exams | M1 Core (`academic_term.id`) | INT | RESTRICT |
| `fee_structure.program_id` | M4 Finance | M1 Core (`program.id`) | INT | RESTRICT |
| `fee_structure.term_id` | M4 Finance | M1 Core (`academic_term.id`) | INT | RESTRICT |
| `student_fee.student_id` | M4 Finance | M1 Core (`student.id`) | BIGINT | RESTRICT |
| `payment.student_id` | M4 Finance | M1 Core (`student.id`) | BIGINT | RESTRICT |
| `hostel_fee_component_link.hostel_id` | M4 Finance | M6 Hostel (`hostel.id`) | INT | CASCADE |
| `employee.department_id` | M5 HR | M1 Core (`department.id`) | INT | RESTRICT |
| `hostel_allocation.student_id` | M6 Hostel | M1 Core (`student.id`) | BIGINT | RESTRICT |
| `hostel_request.student_id` | M6 Hostel | M1 Core (`student.id`) | BIGINT | CASCADE |

## 2. Global Identifier Usage Matrix

| Identifier | Format | Defined In | Used In / Queried By |
|---|---|---|---|
| `Student_ID` | `STU-YYYY-XXXXXX` | M1 (`student`) | UI and APIs across M2, M3, M4, M6, M7 |
| `Employee ID` | `EMP-YYYY-XXXX` | M5 (`employee`) | M1 (Identity), M2 (Offerings), M5 (Payroll) |
| `Course Code` | `[A-Z]{2,4}[0-9]{3,4}` | M2 (`course`) | M2 (Offerings), M3 (Exams), M7 (Reports) |
| `Receipt Num` | `RCP-YYYYMMDD-XXXXX` | M4 (`receipt`) | M4 (Payments, Ledger), M7 (Reports) |
| `Term ID` | `YYYY-TERM` | M1 (`academic_term`) | M1, M2, M3, M4, M7 |
| `Payment Ref` | `PAY-XXXXXXXXXXXX` | M4 (`payment`) | M4 (Ledger) |
| `Batch ID` | `BAT-YYYYMMDD-XXXX` | M2 (`bulk_enrollment_batch`) | M2 (Logs) |
| `Payroll Month` | `YYYY-MM` | M5 (`payroll_run`) | M5 (Payslips), M7 (Reports) |

## 3. Module Build and Merge Order

Following PRD §11.4 and §12, the integration sequence is strict:

1. **M1 (Core Platform)**: Must be deployed first as it establishes foundational identifiers, roles, students, terms, programs, and departments.
2. **M5 (HR)** (Partial base): `employee` and `designation` are built immediately after M1 base to satisfy faculty dependencies.
3. **M2 (Academics)**: Consumes M1 (Term, Student, Program) and M5 (Faculty) to establish courses and enrollments.
4. **M3 (Attendance & Exams)**: Consumes M2 enrollments and offerings.
5. **M4 (Finance)**: Consumes M1 (Students, Terms).
6. **M6 (Hostel)**: Consumes M1 (Students) and is consumed by M4 (Hostel fee link).
7. **M7 (Analytics & Audit)**: Consumes all modules for reporting and views. Built last.

Merge Sequence: `M1 -> M2 -> M3, M4, M5, M6 -> M7`.
