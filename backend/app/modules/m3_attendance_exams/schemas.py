from pydantic import BaseModel, Field, validator
from typing import List, Optional, Literal
from datetime import date, datetime

class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=1000)

class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int

# --- Grade Scale ---
class GradeScaleBase(BaseModel):
    grade: str = Field(..., max_length=2)
    min_marks_pct: float = Field(..., ge=0, le=100)
    max_marks_pct: float = Field(..., ge=0, le=100)
    grade_points: float = Field(..., ge=0)

class GradeScaleCreate(GradeScaleBase):
    pass

class GradeScaleUpdate(BaseModel):
    min_marks_pct: Optional[float] = Field(None, ge=0, le=100)
    max_marks_pct: Optional[float] = Field(None, ge=0, le=100)
    grade_points: Optional[float] = Field(None, ge=0)

class GradeScaleResponse(GradeScaleBase):
    id: int

# --- Attendance ---
class AttendanceRecordInput(BaseModel):
    enrollment_id: int
    status: Literal['PRESENT', 'ABSENT']

class AttendanceSessionCreate(BaseModel):
    offering_id: int
    session_date: date
    slot: str = Field(..., max_length=50)
    records: List[AttendanceRecordInput]

class AttendanceSessionUpdate(BaseModel):
    records: List[AttendanceRecordInput]

class AttendanceRecordResponse(BaseModel):
    enrollment_id: int
    student_id: int
    first_name: str
    last_name: str
    status: Literal['PRESENT', 'ABSENT']

class AttendanceSessionResponse(BaseModel):
    id: int
    offering_id: int
    session_date: date
    slot: str
    marked_by: int
    marked_at: datetime
    records: Optional[List[AttendanceRecordResponse]] = None

class MyAttendanceResponse(BaseModel):
    offering_id: int
    course_code: str
    course_title: str
    sessions_held: int
    sessions_attended: int
    attendance_pct: float
    eligible_for_exam: bool

class AttendanceShortageReport(BaseModel):
    student_id: int
    first_name: str
    last_name: str
    offering_id: int
    course_code: str
    attendance_pct: float

# --- Exam Management ---
class ExamBase(BaseModel):
    offering_id: int
    exam_type: str = Field(..., max_length=50)
    exam_date: date
    max_marks: float = Field(..., gt=0)
    reg_start_date: datetime
    reg_end_date: datetime

class ExamCreate(ExamBase):
    pass

class ExamUpdate(BaseModel):
    exam_date: Optional[date] = None
    max_marks: Optional[float] = Field(None, gt=0)
    reg_start_date: Optional[datetime] = None
    reg_end_date: Optional[datetime] = None

class ExamResponse(ExamBase):
    id: int

# --- Exam Registration ---
class ExamRegistrationCreate(BaseModel):
    exam_id: int

class ExamRegistrationResponse(BaseModel):
    id: int
    exam_id: int
    student_id: int
    status: Literal['REGISTERED', 'CANCELLED']
    registered_at: datetime

# --- Marks Entry ---
class MarkInput(BaseModel):
    registration_id: int
    marks: float = Field(..., ge=0)

class MarksBulkEntry(BaseModel):
    marks: List[MarkInput]

class MarksResultResponse(BaseModel):
    registration_id: int
    student_id: int
    first_name: str
    last_name: str
    marks: float
    grade: Optional[str] = None
    grade_points: Optional[float] = None
    is_published: bool

# --- Processing & Results ---
class ProcessResultInput(BaseModel):
    exam_id: int

class MyResultCourse(BaseModel):
    offering_id: int
    course_code: str
    course_title: str
    credits: int
    marks: Optional[float] = None
    grade: Optional[str] = None
    grade_points: Optional[float] = None

class MyResultResponse(BaseModel):
    term_id: int
    term_label: str
    courses: List[MyResultCourse]
    sgpa: Optional[float] = None
    cgpa: Optional[float] = None

class CgpaResponse(BaseModel):
    student_id: int
    cgpa: float

class CourseResultSummaryResponse(BaseModel):
    exam_id: int
    total_registered: int
    total_passed: int
    pass_percentage: float
    average_marks: float
