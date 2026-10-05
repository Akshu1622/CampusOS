# Error Codes Registry

This document catalogs the standard business-rule rejection codes for the University ERP.
All stored programs use `SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = <ErrNo>, MESSAGE_TEXT = '<Message>'`.
The backend API maps these errors to the specified HTTP Status codes.

## M1: Core Module (51000 - 51999)
| ErrNo | Name | Message | HTTP Status |
|-------|------|---------|-------------|
| 51001 | TERM_NOT_OPEN | The academic term is not open for this operation. | 400 |

## M2: Academics and Enrollment (52000 - 52999)
| ErrNo | Name | Message | HTTP Status |
|-------|------|---------|-------------|
| 52001 | ENROLLMENT_CAPACITY_FULL | The enrollment capacity for this course offering is full. | 409 |
| 52002 | DUPLICATE_ENROLLMENT | The student is already enrolled in this course offering. | 409 |
| 52003 | STUDENT_NOT_IN_CURRICULUM | The student is not in the required program curriculum for this course. | 400 |

## M3: Attendance, Exams, and Results (53000 - 53999)
| ErrNo | Name | Message | HTTP Status |
|-------|------|---------|-------------|
| 53001 | ATTENDANCE_BELOW_THRESHOLD | Attendance is below 75%, blocking exam registration. | 403 |
| 53002 | EXAM_REGISTRATION_CLOSED | The exam registration window is closed. | 400 |
| 53003 | MARKS_OUT_OF_BOUNDS | Marks entered are outside the allowed range of 0 to max. | 400 |
| 53004 | RESULT_ALREADY_PUBLISHED | The result for this exam is already published and cannot be modified. | 409 |
| 53005 | EXAM_STUDENT_NOT_ENROLLED | The student is not actively enrolled in the course offering. | 400 |
| 53006 | EXAM_DUPLICATE_REGISTRATION | The student is already registered for this exam. | 409 |

## M4: Finance (54000 - 54999)
| ErrNo | Name | Message | HTTP Status |
|-------|------|---------|-------------|
| 54001 | PAYMENT_EXCEEDS_BALANCE | The payment amount exceeds the outstanding balance. | 400 |
| 54002 | DUE_ALREADY_SETTLED | The fee due is already fully settled. | 400 |

## M5: HR, Leave, and Payroll (55000 - 55999)
| ErrNo | Name | Message | HTTP Status |
|-------|------|---------|-------------|
| 55001 | LEAVE_EXCEEDS_BALANCE | The requested leave days exceed the available leave balance. | 400 |
| 55002 | OVERLAPPING_LEAVE | The requested leave dates overlap with an existing approved leave. | 409 |
| 55003 | PAYROLL_ALREADY_FINALIZED | The payroll month is already finalized and cannot be modified. | 409 |

## M6: Hostel (56000 - 56999)
| ErrNo | Name | Message | HTTP Status |
|-------|------|---------|-------------|
| 56001 | NO_BEDS_AVAILABLE | There are no beds available in the requested hostel/room. | 409 |
| 56002 | ACTIVE_ALLOCATION_EXISTS | The student already has an active hostel allocation. | 409 |

## M7: Analytics and Audit (57000 - 57999)
*(Reserved for future use)*
