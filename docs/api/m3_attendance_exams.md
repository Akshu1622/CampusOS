# M3 Attendance, Examinations, and Results API Documentation

Base Path: `/api/v1`

All responses are mapped to standard HTTP status codes, and exceptions are formatted as:
```json
{
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "field_errors": [],
  "request_id": null
}
```

## Attendance

### `GET /attendance/sessions`
**Roles:** Faculty, Admin  
**Query Parameters:** `page` (default 1), `page_size` (default 20), `offering_id` (optional)  
**Response:** `PaginatedResponse` (`items`, `total`, `page`, `page_size`)

### `GET /attendance/sessions/{id}` [DERIVED]
**Roles:** Faculty, Admin  
**Response:** `AttendanceSessionDetail` (`id`, `offering_id`, `session_date`, `slot`, `marked_by`, `records`: list of `{id, session_id, enrollment_id, status, student_id, global_student_id, first_name, last_name}`)

### `POST /attendance/sessions`
**Roles:** Assigned Faculty, Admin (with `Exams_Admin` override)  
**Request:** `AttendanceSessionCreate` (`offering_id`, `session_date`, `slot`, `records`: list of `{enrollment_id, status}`)  
**Response:** `AttendanceSessionResponse` (201 Created)  
**Errors:** 403 FORBIDDEN (unassigned faculty), 409 CONFLICT (session already exists for date and slot)

### `PUT /attendance/sessions/{id}`
**Roles:** Assigned Faculty, Admin (with `Exams_Admin` override)  
**Request:** `AttendanceSessionUpdate` (`records`: list of `{enrollment_id, status}`)  
**Response:** `AttendanceSessionResponse` (200 OK)

### `GET /me/attendance`
**Roles:** Student  
**Response:** `List[MyAttendanceResponse]` (`offering_id`, `course_code`, `course_title`, `sessions_held`, `sessions_attended`, `attendance_pct`, `eligible_for_exam`)

### `GET /attendance/shortage`
**Roles:** Faculty, Admin  
**Query Parameters:** `page` (default 1), `page_size` (default 20)  
**Response:** `PaginatedResponse` (`items`: list of students with attendance < 75%, `total`, `page`, `page_size`)

---

## Exams

### `GET /exams`
**Roles:** All Authenticated  
**Query Parameters:** `page` (default 1), `page_size` (default 20), `offering_id` (optional)  
**Response:** `PaginatedResponse` (`items`, `total`, `page`, `page_size`)

### `GET /exams/{id}`
**Roles:** All Authenticated  
**Response:** `ExamResponse` (`id`, `offering_id`, `exam_type`, `exam_date`, `max_marks`, `reg_start_date`, `reg_end_date`)

### `POST /exams`
**Roles:** Admin (with `Exams_Admin` permission)  
**Request:** `ExamCreate` (`offering_id`, `exam_type`, `exam_date`, `max_marks`, `reg_start_date`, `reg_end_date`)  
**Response:** `ExamResponse` (201 Created)  
**Errors:** 409 CONFLICT (exam of this type already exists for offering)

### `PATCH /exams/{id}`
**Roles:** Admin (with `Exams_Admin` permission)  
**Request:** `ExamUpdate`  
**Response:** `ExamResponse` (200 OK)

### `DELETE /exams/{id}`
**Roles:** Admin (with `Exams_Admin` permission)  
**Response:** 204 No Content  
**Errors:** 409 INTEGRITY_ERROR (cannot delete exam with existing registrations/results)

---

## Exam Registration

### `GET /exam-registrations`
**Roles:** Admin (with `Exams_Admin` permission)  
**Query Parameters:** `page` (default 1), `page_size` (default 20), `exam_id` (optional), `student_id` (optional)  
**Response:** `PaginatedResponse` (`items`, `total`, `page`, `page_size`)

### `POST /exam-registrations`
**Roles:** Student  
**Request:** `ExamRegistrationCreate` (`exam_id`)  
**Response:** `ExamRegistrationResponse` (201 Created)  
**Authoritative Trigger Enforcements:**
- 403 ATTENDANCE_BELOW_THRESHOLD (`Registration blocked: attendance <pct>% is below 75%`)
- 409 EXAM_DUPLICATE_REGISTRATION (`The student is already registered for this exam.`)
- 400 EXAM_REGISTRATION_CLOSED (`The exam registration window is closed.`)
- 400 EXAM_STUDENT_NOT_ENROLLED (`The student is not actively enrolled in the course offering.`)

---

## Marks Entry and Results

### `GET /exams/{id}/marks`
**Roles:** Assigned Faculty, Admin (with `Exams_Admin` permission)  
**Response:** `List[MarksResultResponse]` (`registration_id`, `student_id`, `first_name`, `last_name`, `marks`, `grade`, `grade_points`, `is_published`)

### `PUT /exams/{id}/marks`
**Roles:** Assigned Faculty, Admin (with `Exams_Admin` permission)  
**Request:** `MarksBulkEntry` (`marks`: list of `{registration_id, marks}`)  
**Response:** `{"status": "success"}`  
**Errors:**
- 400 MARKS_OUT_OF_BOUNDS (`Marks cannot exceed maximum <max>` / `Marks cannot be negative`)
- 409 RESULT_ALREADY_PUBLISHED (`The result for this exam is already published and cannot be modified.`)

### `POST /results/process`
**Roles:** Admin (with `Exams_Admin` permission)  
**Request:** `ProcessResultInput` (`exam_id`)  
**Response:** `{"status": "success"}`  
**Description:** Automatically computes grades and grade points for all marks based on `grade_scale`.

### `POST /results/publish`
**Roles:** Admin (with `Exams_Admin` permission)  
**Request:** `ProcessResultInput` (`exam_id`)  
**Response:** `{"status": "success"}`  
**Errors:** 409 RESULT_ALREADY_PUBLISHED (`The result for this exam is already published and cannot be modified.`)

### `GET /me/results`
**Roles:** Student  
**Response:** `List[MyResultResponse]` (terms, SGPA, CGPA, courses, grades, credits)

### `GET /me/cgpa`
**Roles:** Student  
**Response:** `CgpaResponse` (`student_id`, `cgpa`)  
**Description:** Computed via MySQL UDF `fn_student_cgpa`.

### `GET /exams/{id}/summary`
**Roles:** Assigned Faculty, Admin  
**Response:** `CourseResultSummaryResponse` (`exam_id`, `total_registered`, `total_passed`, `pass_percentage`, `average_marks`)

---

## Grade Scale Configuration

### `GET /grade-scale`
**Roles:** Admin  
**Response:** `PaginatedResponse` (`items`: list of grade scale rules, `total`, `page`, `page_size`)

### `GET /grade-scale/{id}`
**Roles:** Admin  
**Response:** `GradeScaleResponse` (`id`, `grade`, `min_marks_pct`, `max_marks_pct`, `grade_points`)

### `POST /grade-scale`
**Roles:** Admin (with `Exams_Admin` permission)  
**Request:** `GradeScaleCreate`  
**Response:** `GradeScaleResponse` (201 Created)

### `PATCH /grade-scale/{id}`
**Roles:** Admin (with `Exams_Admin` permission)  
**Request:** `GradeScaleUpdate`  
**Response:** `GradeScaleResponse` (200 OK)

### `DELETE /grade-scale/{id}`
**Roles:** Admin (with `Exams_Admin` permission)  
**Response:** 204 No Content
