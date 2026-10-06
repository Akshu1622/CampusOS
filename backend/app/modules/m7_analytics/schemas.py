from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

# RP-1: vw_dept_student_ranking
class DeptStudentRankingResponse(BaseModel):
    department_id: int
    department_name: str
    program_name: str
    student_id: int
    first_name: str
    last_name: str
    cgpa: Optional[float] = None
    dept_rank: int

# RP-2: vw_program_term_ranking
class ProgramTermRankingResponse(BaseModel):
    program_id: int
    program_name: str
    term_id: int
    term_year: int
    term_label: str
    student_id: int
    first_name: str
    last_name: str
    cgpa: Optional[float] = None
    prog_term_rank: int

# RP-3: vw_course_attendance_summary
class CourseAttendanceSummaryResponse(BaseModel):
    offering_id: int
    course_code: str
    course_title: str
    term_label: str
    faculty_name: Optional[str] = None
    total_enrollments: int
    total_sessions: int
    avg_attendance_pct: Optional[float] = None

# RP-4: sp_fee_collection_summary
class FeeCollectionSummaryResponse(BaseModel):
    program_name: str
    term_label: str
    total_due: float
    total_paid: float
    total_balance: float
    defaulters_count: int

# RP-5: vw_high_dues_students
class HighDuesStudentsResponse(BaseModel):
    student_id: int
    global_student_id: str
    first_name: str
    last_name: str
    program_name: str
    total_dues: float
    average_dues: float

# RP-6: vw_hostel_occupancy
class HostelOccupancyResponse(BaseModel):
    hostel_id: int
    hostel_name: str
    gender_block: str
    total_capacity: float
    occupied_beds: float
    available_beds: float
    occupancy_pct: float

# RP-7: vw_payroll_summary
class PayrollSummaryResponse(BaseModel):
    payroll_month: str
    department_id: int
    department_name: str
    employee_count: int
    total_gross_pay: float
    total_deductions: float
    total_net_pay: float

# RP-8: vw_faculty_leave_utilisation
class FacultyLeaveUtilisationResponse(BaseModel):
    employee_id: int
    first_name: str
    last_name: str
    department_name: str
    leave_type_name: str
    annual_quota: int
    used_leave: float
    available_balance: float

# RP-9: vw_course_pass_percentage
class CoursePassPercentageResponse(BaseModel):
    offering_id: int
    term_label: str
    course_code: str
    course_title: str
    faculty_name: Optional[str] = None
    total_results: int
    passed_count: float
    failed_count: float
    pass_pct: Optional[float] = None
    grade_a_count: float
    grade_b_count: float
    grade_c_count: float
    grade_f_count: float

# RP-10: vw_exam_blocked_students
class ExamBlockedStudentsResponse(BaseModel):
    student_id: int
    global_student_id: str
    student_name: str
    term_label: str
    course_code: str
    course_title: str
    attendance_pct: float

# Audit Logs (vw_audit_log_unified)
class AuditLogResponse(BaseModel):
    source: str
    log_id: int
    entity_name: str
    entity_id: str
    action: str
    before_state: Optional[str] = None
    after_state: Optional[str] = None
    actor: Optional[str] = None
    timestamp: datetime

# Integrity Checks (sp_run_integrity_checks)
class IntegrityCheckResponse(BaseModel):
    module: str
    check_name: str
    status: str
    affected_count: int
    sample_keys: Optional[str] = None

# Dashboards
class AdminDashboardResponse(BaseModel):
    total_students: int
    total_faculty: int
    active_enrollments: int
    fees_collected_current: float
    fees_due_current: float
    beds_available: float
    pending_leaves: int
    pending_hostel_requests: int
    students_low_attendance: int
    
    # Extended fields
    blocked_exams_today: int = 0
    overdue_fees_today: int = 0
    fee_collection_donut: Dict[str, float] = Field(default_factory=dict)
    collection_trend: List[Dict[str, Any]] = Field(default_factory=list)
    enrollment_by_department: List[Dict[str, Any]] = Field(default_factory=list)

class FacultyDashboardResponse(BaseModel):
    assigned_offerings: int
    pending_marks_entry: int
    total_leave_balance: float
    latest_payslip_net: Optional[float] = None
    
    # Extended fields
    sessions_to_mark: int = 0
    today_sessions: List[Dict[str, Any]] = Field(default_factory=list)
    attendance_by_offering: List[Dict[str, Any]] = Field(default_factory=list)
    result_snapshot: List[Dict[str, Any]] = Field(default_factory=list)
    students_below_75: List[Dict[str, Any]] = Field(default_factory=list)

class StudentDashboardResponse(BaseModel):
    total_enrolled_courses: int
    low_attendance_courses: int
    current_cgpa: Optional[float] = None
    total_outstanding_dues: float
    hostel_status: Optional[str] = None
    pending_exams: int
    
    # Extended fields
    exam_registrations: List[Dict[str, Any]] = Field(default_factory=list)
    classes_today: List[Dict[str, Any]] = Field(default_factory=list)
    cgpa_trend: List[Dict[str, Any]] = Field(default_factory=list)
    upcoming_deadlines: List[Dict[str, Any]] = Field(default_factory=list)

class PaginatedResponse(BaseModel):
    data: List[Any]
    total: int
    page: int
    size: int
