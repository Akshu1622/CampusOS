# Database Build Order and Circular Dependencies

## 1. Creation Order (Build Sequence)

The cross-module dependencies dictate a strict build sequence (PRD §11.4).

1. **M1 Core (Part 1 - Base)**
   - `department` (Deferred FK for head_employee_id)
   - `program`
   - `academic_term`
   - `student`
   - `role`, `permission_set`
2. **M5 HR (Part 1 - Base)**
   - `designation`
   - `employee` (Resolves the forward reference for M1.department.head_employee_id)
3. **M1 Core (Part 2 - Auth)**
   - `user_account` (Requires `student` and `employee` to exist)
   - `role_assignment`, `admin_permission_set_assignment`
   - `refresh_token`, `login_attempt`
   - `general_audit_log`
4. **M2 Academics**
   - `course`
   - `curriculum_mapping`
   - `course_offering` (Requires `employee` from M5)
   - `enrollment`
   - `bulk_enrollment_batch`, `bulk_enrollment_batch_log`
5. **M3 Attendance & Exams**
   - `attendance_session`, `attendance_record`
   - `exam`, `exam_registration`
   - `exam_marks_result`
   - `grade_scale`, `semester_result`
6. **M6 Hostel**
   - `hostel`, `room`
   - `hostel_allocation`, `hostel_request`
7. **M4 Finance**
   - `fee_structure`, `fee_component`
   - `student_fee`, `late_fee_rule`
   - `payment`, `payment_allocation`, `receipt`
   - `fee_audit_log`
   - `hostel_fee_component_link` (Requires `hostel` from M6)
8. **M5 HR (Part 2 - Payroll)**
   - `leave_type`, `leave_entitlement`, `leave_application`
   - `salary_structure`
   - `payroll_run`, `payslip`, `payslip_line`
9. **M1 Core (Part 3 - Deferred FK Alterations)**
   - Add FK constraint for `department.head_employee_id` -> `employee.id`
10. **M7 Analytics**
    - Create views over the base tables.

## 2. Circular and Forward References

| Reference | Nature | Resolution |
|---|---|---|
| `department.head_employee_id` -> `employee.id` | Circular: A department needs a head (employee), but an employee must belong to a department. | **Nullable-then-backfill / Deferred FK**: `head_employee_id` is NULLable. `department` is created first without the FK. `employee` is created next. Then an `ALTER TABLE` adds the FK to `department`. |
| `user_account` -> `student.id` / `employee.id` | Forward: Identity links to people, but people must exist first. | **Reorder**: `student` and `employee` are created before `user_account`. |
| `course_offering` -> `employee.id` | Forward: Academic module requires faculty. | **Reorder**: `employee` (M5 base) is created before `course_offering` (M2). |
| `hostel_fee_component_link` -> `hostel.id` | Forward: Finance allows hostel fees to be components. | **Reorder**: M6 `hostel` is created before the link table in M4. |

## 3. Deferred Foreign Keys

The following Foreign Keys must be created via `ALTER TABLE` at the end of the schema build phase (Step 9) rather than inline during `CREATE TABLE`:

- `ALTER TABLE department ADD CONSTRAINT fk_dept_head FOREIGN KEY (head_employee_id) REFERENCES employee(id) ON DELETE SET NULL;`
