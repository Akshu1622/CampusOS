from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# --- Course ---
class CourseCreateRequest(BaseModel):
    code: str = Field(..., pattern=r'^[A-Z]{2,4}[0-9]{3,4}$')
    title: str = Field(..., max_length=100)
    credits: int = Field(..., ge=0)
    department_id: int

class CourseUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, max_length=100)
    credits: Optional[int] = Field(None, ge=0)
    department_id: Optional[int] = None
    status: Optional[str] = None # ACTIVE, RETIRED

class CourseResponse(BaseModel):
    id: int
    code: str
    title: str
    credits: int
    department_id: int
    department_name: Optional[str] = None
    status: str

class PaginatedCourses(BaseModel):
    items: List[CourseResponse]
    total: int
    page: int
    page_size: int

# --- Curriculum Mapping ---
class CurriculumCreateRequest(BaseModel):
    program_id: int
    semester: int = Field(..., gt=0)
    course_id: int
    type: str = Field(..., pattern=r'^(CORE|ELECTIVE)$')

class CurriculumUpdateRequest(BaseModel):
    type: str = Field(..., pattern=r'^(CORE|ELECTIVE)$')

class CurriculumResponse(BaseModel):
    id: int
    program_id: int
    program_name: Optional[str] = None
    semester: int
    course_id: int
    course_code: Optional[str] = None
    course_title: Optional[str] = None
    credits: Optional[int] = None
    type: str

class PaginatedCurriculum(BaseModel):
    items: List[CurriculumResponse]
    total: int
    page: int
    page_size: int

# --- Course Offering ---
class OfferingCreateRequest(BaseModel):
    course_id: int
    term_id: int
    faculty_id: int
    section: str = Field(..., max_length=10)
    capacity: int = Field(..., gt=0)

class OfferingUpdateRequest(BaseModel):
    faculty_id: Optional[int] = None
    capacity: Optional[int] = Field(None, gt=0)

class OfferingResponse(BaseModel):
    id: int
    course_id: int
    course_code: Optional[str] = None
    course_title: Optional[str] = None
    term_id: int
    term_label: Optional[str] = None
    term_year: Optional[int] = None
    faculty_id: int
    faculty_name: Optional[str] = None
    section: str
    capacity: int
    enrolled_count: int

class PaginatedOfferings(BaseModel):
    items: List[OfferingResponse]
    total: int
    page: int
    page_size: int

# --- Enrollment ---
class EnrollmentCreateRequest(BaseModel):
    student_id: int
    offering_id: int

class EnrollmentResponse(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    global_student_id: Optional[str] = None
    offering_id: int
    course_code: Optional[str] = None
    course_title: Optional[str] = None
    section: Optional[str] = None
    term_id: Optional[int] = None
    term_label: Optional[str] = None
    status: str
    enrolled_date: datetime

class PaginatedEnrollments(BaseModel):
    items: List[EnrollmentResponse]
    total: int
    page: int
    page_size: int

# --- Bulk Enrollment ---
class BulkEnrollmentRequest(BaseModel):
    policy: str = Field('SKIP_INVALID', pattern=r'^(ALL_OR_NOTHING|SKIP_INVALID)$')
    dry_run: bool = False
    payload: List[dict] # Will contain student_id and offering_id


class BulkEnrollmentRowResult(BaseModel):
    student_id: Optional[int] = None
    offering_id: Optional[int] = None
    status: str
    message: Optional[str] = None

class BulkEnrollmentResponse(BaseModel):
    batch_id: str
    total_processed: int
    total_success: int
    total_failed: int
    total_skipped: Optional[int] = 0
    message: str
    row_results: Optional[List[BulkEnrollmentRowResult]] = None
    
# --- Role Views ---
class MyCourseResponse(BaseModel):
    enrollment_id: int
    offering_id: int
    course_code: str
    course_title: str
    term_id: int
    faculty_id: int
    faculty_name: Optional[str] = None
    section: str
    credits: int
    status: str

class MyTeachingResponse(BaseModel):
    offering_id: int
    course_code: str
    course_title: str
    term_id: int
    term_label: Optional[str] = None
    section: str
    capacity: int
    enrolled_count: int

class RosterStudentResponse(BaseModel):
    student_id: int
    global_student_id: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    enrollment_status: str
    enrolled_date: datetime
