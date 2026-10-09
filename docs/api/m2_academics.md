# M2 Academics and Enrollment API Documentation

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

## Courses

### `GET /courses`
**Roles:** Admin, Faculty, Student  
**Query Parameters:** `page` (default 1), `page_size` (default 20), `department_id` (optional)  
**Response:** `PaginatedCourses` (`items`, `total`, `page`, `page_size`)

### `GET /courses/{id}` [DERIVED]
**Roles:** Admin, Faculty, Student  
**Response:** `CourseResponse` (`id`, `code`, `title`, `credits`, `department_id`, `status`)

### `POST /courses`
**Roles:** Admin (with `Academics_Admin` permission)  
**Request:** `CourseCreateRequest` (`code`, `title`, `credits`, `department_id`)  
**Response:** `CourseResponse` (201 Created)  
**Errors:** 409 CONFLICT (duplicate course code)

### `PUT /courses/{id}`
**Roles:** Admin (with `Academics_Admin` permission)  
**Request:** `CourseUpdateRequest` (`title`, `credits`, `department_id`, `status`)  
**Response:** `CourseResponse` (200 OK)

### `DELETE /courses/{id}` [DERIVED]
**Roles:** Admin (with `Academics_Admin` permission)  
**Response:** 204 No Content

---

## Curriculum Mapping

### `GET /curriculum`
**Roles:** Admin, Faculty, Student  
**Query Parameters:** `page` (default 1), `page_size` (default 20), `program_id` (optional), `semester` (optional)  
**Response:** `PaginatedCurriculum` (`items`, `total`, `page`, `page_size`)

### `GET /curriculum/{id}` [DERIVED]
**Roles:** Admin, Faculty, Student  
**Response:** `CurriculumResponse` (`id`, `program_id`, `semester`, `course_id`, `type`)

### `POST /curriculum`
**Roles:** Admin (with `Academics_Admin` permission)  
**Request:** `CurriculumCreateRequest` (`program_id`, `semester`, `course_id`, `type`)  
**Response:** `CurriculumResponse` (201 Created)  
**Errors:** 409 CONFLICT (mapping already exists)

### `PATCH /curriculum/{id}`
**Roles:** Admin (with `Academics_Admin` permission)  
**Request:** `CurriculumUpdateRequest` (`type`)  
**Response:** `CurriculumResponse` (200 OK)

### `DELETE /curriculum/{id}`
**Roles:** Admin (with `Academics_Admin` permission)  
**Response:** 204 No Content

---

## Course Offerings

### `GET /offerings`
**Roles:** Admin, Faculty, Student  
**Query Parameters:** `page` (default 1), `page_size` (default 20), `term_id` (optional), `course_id` (optional)  
**Response:** `PaginatedOfferings` (`items`, `total`, `page`, `page_size`)

### `GET /offerings/{id}` [DERIVED]
**Roles:** Admin, Faculty, Student  
**Response:** `OfferingResponse` (`id`, `course_id`, `term_id`, `faculty_id`, `section`, `capacity`, `enrolled_count`)

### `POST /offerings`
**Roles:** Admin (with `Academics_Admin` permission)  
**Request:** `OfferingCreateRequest` (`course_id`, `term_id`, `faculty_id`, `section`, `capacity`)  
**Response:** `OfferingResponse` (201 Created)  
**Errors:** 409 CONFLICT (section already exists for term)

### `PUT /offerings/{id}`
**Roles:** Admin (with `Academics_Admin` permission)  
**Request:** `OfferingUpdateRequest` (`faculty_id`, `capacity`)  
**Response:** `OfferingResponse` (200 OK)

### `DELETE /offerings/{id}`
**Roles:** Admin (with `Academics_Admin` permission)  
**Response:** 204 No Content

### `GET /offerings/{id}/roster`
**Roles:** Admin, Assigned Faculty  
**Response:** `List[RosterStudentResponse]` (`student_id`, `global_student_id`, `first_name`, `last_name`, `enrollment_status`, `enrolled_date`)  
**Errors:** 403 FORBIDDEN (unassigned faculty or student)

---

## Enrollments

### `GET /enrollments`
**Roles:** Admin  
**Query Parameters:** `page` (default 1), `page_size` (default 20), `student_id` (optional), `offering_id` (optional)  
**Response:** `PaginatedEnrollments` (`items`, `total`, `page`, `page_size`)

### `GET /enrollments/{id}` [DERIVED]
**Roles:** Admin  
**Response:** `EnrollmentResponse` (`id`, `student_id`, `offering_id`, `status`, `enrolled_date`)

### `POST /enrollments`
**Roles:** Admin (with `Academics_Admin` permission)  
**Request:** `EnrollmentCreateRequest` (`student_id`, `offering_id`)  
**Response:** `EnrollmentResponse` (201 Created)  
**Errors:**
- 400 TERM_NOT_OPEN (`The academic term is not open for this operation.`)
- 400 STUDENT_NOT_IN_CURRICULUM (`The student is not in the required program curriculum for this course.`)
- 409 DUPLICATE_ENROLLMENT (`The student is already enrolled in this course offering.`)
- 409 ENROLLMENT_CAPACITY_FULL (`The enrollment capacity for this course offering is full.`)

### `PATCH /enrollments/{id}/withdraw`
**Roles:** Admin (with `Academics_Admin` permission)  
**Response:** `EnrollmentResponse` (status set to `WITHDRAWN`)  
**Errors:** 400 BAD_REQUEST (cannot withdraw if not actively enrolled)

### `POST /enrollments/bulk`
**Roles:** Admin (with `Academics_Admin` permission)  
**Request:** `BulkEnrollmentRequest` (`policy`: `ALL_OR_NOTHING` | `SKIP_INVALID`, `dry_run`: false, `payload`: list of `{student_id, offering_id}`)  
**Response:** `BulkEnrollmentResponse` (`batch_id`, `total_processed`, `total_success`, `total_failed`, `total_skipped`, `message`, `row_results`)

### `POST /enrollments/bulk/validate`
**Roles:** Admin (with `Academics_Admin` permission)  
**Request:** `BulkEnrollmentRequest` (`policy`: `ALL_OR_NOTHING` | `SKIP_INVALID`, `dry_run`: true, `payload`: list of `{student_id, offering_id}`)  
**Response:** `BulkEnrollmentResponse` with validation preview and per-row status/message

---

## Role Self-Service Views

### `GET /me/courses`
**Roles:** Student  
**Response:** `List[MyCourseResponse]` (`enrollment_id`, `offering_id`, `course_code`, `course_title`, `term_id`, `faculty_id`, `section`, `credits`, `status`)

### `GET /faculty/me/offerings`
**Roles:** Faculty  
**Response:** `List[MyTeachingResponse]` (`offering_id`, `course_code`, `course_title`, `term_id`, `section`, `capacity`, `enrolled_count`)
