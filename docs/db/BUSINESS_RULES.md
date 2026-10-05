# Business-Rule Enforcement Matrix

This matrix maps every business rule from PRD §9.3 and §11.4 to its database-level enforcement mechanism.

## PRD §9.3 Rules

| Business Rule | Enforcement Mechanism | Table(s) Involved |
|---|---|---|
| One active enrollment per student per offering | `UNIQUE` constraint | `enrollment` (`student_id`, `offering_id`) |
| Enrollment capacity not exceeded | API check inside a transaction holding a lock | `course_offering`, `enrollment` |
| Term must be open for enrollment | API check (only terms with `is_current = 1` allowed) | `academic_term`, `enrollment` |
| Program mapping valid | API check | `curriculum_mapping`, `enrollment` |
| Unique attendance session per offering/date/slot | `UNIQUE` constraint | `attendance_session` (`offering_id`, `session_date`, `slot`) |
| Only assigned faculty/admin may write attendance | API check + DB trigger verifying ownership | `attendance_session`, `course_offering` |
| Exam registration: attendance >= 75% | **Database Trigger** | `exam_registration` (reads `attendance_record`, `attendance_session`) |
| Exam registration: student enrolled | API check / FK implies enrollment via logical validation | `enrollment`, `exam_registration` |
| Exam registration: window open | API check | `exam`, `exam_registration` |
| Exam registration: no duplicate | `UNIQUE` constraint | `exam_registration` (`exam_id`, `student_id`) |
| Marks within 0…max | API check / Trigger | `exam`, `exam_marks_result` |
| Marks only for registered students | `FOREIGN KEY` | `exam_marks_result` -> `exam_registration` |
| No marks edits after publish | API check / DB trigger blocking UPDATE if `is_published=1` | `exam_marks_result` |
| Fee payment: payment <= balance | **Stored Procedure** | `student_fee`, `payment` |
| Atomic update of dues, payment, receipt | **Stored Procedure** (Transaction) | `student_fee`, `payment`, `receipt` |
| Receipt numbers unique and sequential | `UNIQUE` constraint + Sequence Generator | `receipt`, `id_sequences` |
| Leave: days <= available balance | API check / **Leave Balance UDF** | `leave_application` |
| Leave: non-overlapping with approved leave | API check / DB trigger | `leave_application` |
| Payroll: one finalized run per month | `UNIQUE` constraint + API check | `payroll_run` (`payroll_month`) |
| Payroll: net = earnings - deductions | **Stored Procedure** | `payslip` |
| Payroll: reruns only before finalize | API check (blocks execution if `status = 'FINALIZED'`) | `payroll_run` |
| Hostel: allocation only if beds available | **Database Trigger** | `room`, `hostel_allocation` |
| Hostel: one active allocation per student | DB Trigger / Unique constraint trick | `hostel_allocation` |
| Hostel: counts always consistent | **Database Trigger** (increments/decrements) | `room` (`available_beds`) |

## PRD §11.4 Rules

| Business Rule | Enforcement Mechanism | Table(s) Involved |
|---|---|---|
| Global identifiers identical across modules | Shared standard columns/types; `id_sequences` generation | `student`, `employee`, `course`, `receipt` |
| No orphan records | `FOREIGN KEY` (RESTRICT/CASCADE) | All tables |
| Attendance % is derived and computable | View/Function (used by Exam Trigger) | `attendance_record`, `attendance_session` |
| Room available beds >= 0 and <= capacity | `CHECK` constraint | `room` (`available_beds >= 0 AND available_beds <= bed_capacity`) |
| Payment never exceeds outstanding dues | **Stored Procedure** | `student_fee`, `payment` |
| Only one current term | Database Trigger (`BEFORE UPDATE/INSERT` ensuring one `is_current=1`) | `academic_term` |
| One finalized payroll per month | `UNIQUE` constraint on month | `payroll_run` |
| Leave balance = entitlement - approved (derived) | **Leave Balance UDF** | `leave_entitlement`, `leave_application` |
| Cross-module dependency order (M1 -> M2 ...) | DB schema file execution sequence | All tables |
