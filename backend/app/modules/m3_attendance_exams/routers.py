from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional

from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user, require_role, require_permission, CurrentUser
from app.core.errors import APIError
from app.modules.m3_attendance_exams.schemas import (
    GradeScaleCreate, GradeScaleUpdate, GradeScaleResponse,
    AttendanceSessionCreate, AttendanceSessionUpdate, AttendanceSessionResponse,
    MyAttendanceResponse, AttendanceShortageReport,
    ExamCreate, ExamUpdate, ExamResponse,
    ExamRegistrationCreate, ExamRegistrationResponse, ExamBlockedResponse, StudentAvailableExamResponse,
    MarksBulkEntry, MarksResultResponse, ProcessResultInput,
    MyResultResponse, CgpaResponse, CourseResultSummaryResponse, PaginatedResponse
)
from app.modules.m3_attendance_exams.service import M3Service

m3_router = APIRouter(prefix="/api/v1", tags=["M3 - Attendance and Exams"])

def get_m3_service(db: Session = Depends(get_db)):
    return M3Service(db)

# --- Grade Scale (E-11) ---
@m3_router.post("/grade-scale", status_code=status.HTTP_201_CREATED, response_model=GradeScaleResponse)
def create_grade_scale(data: GradeScaleCreate, svc: M3Service = Depends(get_m3_service), _=Depends(require_permission(["Exams_Admin"]))):
    id = svc.create_grade_scale(data.model_dump())
    return svc.get_grade_scale(id)

@m3_router.get("/grade-scale", response_model=PaginatedResponse)
def get_grade_scales(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    svc: M3Service = Depends(get_m3_service),
    _=Depends(require_role(["Admin", "Faculty", "Student"]))
):
    items, total = svc.get_grade_scales((page - 1) * page_size, page_size)
    return {"items": [dict(i._mapping) for i in items], "total": total, "page": page, "page_size": page_size}

@m3_router.get("/grade-scale/{id}", response_model=GradeScaleResponse)
def get_grade_scale(id: int, svc: M3Service = Depends(get_m3_service), _=Depends(require_role(["Admin", "Faculty", "Student"]))):
    return svc.get_grade_scale(id)

@m3_router.patch("/grade-scale/{id}", response_model=GradeScaleResponse)
def update_grade_scale(id: int, data: GradeScaleUpdate, svc: M3Service = Depends(get_m3_service), _=Depends(require_permission(["Exams_Admin"]))):
    svc.update_grade_scale(id, data.model_dump(exclude_unset=True))
    return svc.get_grade_scale(id)

@m3_router.put("/grade-scale/{id}", response_model=GradeScaleResponse)
def update_grade_scale_put(id: int, data: GradeScaleUpdate, svc: M3Service = Depends(get_m3_service), _=Depends(require_permission(["Exams_Admin"]))):
    svc.update_grade_scale(id, data.model_dump(exclude_unset=True))
    return svc.get_grade_scale(id)

@m3_router.delete("/grade-scale/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_grade_scale(id: int, svc: M3Service = Depends(get_m3_service), _=Depends(require_permission(["Exams_Admin"]))):
    svc.delete_grade_scale(id)

# --- Attendance (E-01, E-02, E-03, E-04) ---
@m3_router.post("/attendance/sessions", status_code=status.HTTP_201_CREATED, response_model=AttendanceSessionResponse)
def mark_attendance(data: AttendanceSessionCreate, svc: M3Service = Depends(get_m3_service), user: CurrentUser = Depends(require_role(["Faculty", "Admin"]))):
    has_admin = any(role.lower() in ["admin", "superadmin"] for role in user.roles) or "exams_admin" in [p.lower() for p in user.permission_sets]
    sid = svc.mark_attendance(data.model_dump(), user.user_id, has_admin)
    return svc.repo.get_attendance_session_by_id(sid)

@m3_router.put("/attendance/sessions/{id}", status_code=status.HTTP_200_OK, response_model=AttendanceSessionResponse)
def update_attendance_session(id: int, data: AttendanceSessionUpdate, svc: M3Service = Depends(get_m3_service), user: CurrentUser = Depends(require_role(["Faculty", "Admin"]))):
    has_admin = any(role.lower() in ["admin", "superadmin"] for role in user.roles) or "exams_admin" in [p.lower() for p in user.permission_sets]
    svc.update_attendance_session(id, [r.model_dump() for r in data.records], user.user_id, has_admin)
    row = svc.repo.get_attendance_session_by_id(id)
    return dict(row._mapping) if row else None

@m3_router.get("/attendance/sessions", response_model=PaginatedResponse)
def get_attendance_sessions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    offering_id: Optional[int] = None,
    session_date: Optional[str] = None,
    svc: M3Service = Depends(get_m3_service),
    _=Depends(require_role(["Faculty", "Admin"]))
):
    items, total = svc.get_attendance_sessions((page - 1) * page_size, page_size, offering_id, session_date)
    return {"items": [dict(i._mapping) for i in items], "total": total, "page": page, "page_size": page_size}

@m3_router.get("/attendance/sessions/{id}")
def get_attendance_session(id: int, svc: M3Service = Depends(get_m3_service), user: CurrentUser = Depends(require_role(["Faculty", "Admin"]))):
    sess = svc.repo.get_attendance_session_by_id(id)
    if not sess:
        raise APIError("NOT_FOUND", "Attendance session not found", 404)
    records = svc.repo.get_attendance_records(id)
    res = dict(sess._mapping)
    res["records"] = [dict(r._mapping) for r in records]
    return res

@m3_router.get("/me/attendance", response_model=List[MyAttendanceResponse])
def get_my_attendance(svc: M3Service = Depends(get_m3_service), user: CurrentUser = Depends(require_role(["Student"]))):
    return svc.get_my_attendance(user.user_id)

@m3_router.get("/attendance/shortage", response_model=PaginatedResponse)
def get_attendance_shortage(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    threshold: float = Query(75.0, ge=0, le=100),
    search: Optional[str] = None,
    svc: M3Service = Depends(get_m3_service),
    _=Depends(require_role(["Faculty", "Admin"]))
):
    items, total = svc.get_attendance_shortage((page - 1) * page_size, page_size, threshold, search)
    return {"items": [dict(i._mapping) for i in items], "total": total, "page": page, "page_size": page_size}

# --- Exams (E-05) ---
@m3_router.post("/exams", status_code=status.HTTP_201_CREATED, response_model=ExamResponse)
def create_exam(data: ExamCreate, svc: M3Service = Depends(get_m3_service), _=Depends(require_permission(["Exams_Admin"]))):
    id = svc.create_exam(data.model_dump())
    return svc.get_exam(id)

@m3_router.get("/exams", response_model=PaginatedResponse)
def get_exams(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    offering_id: Optional[int] = None,
    term_id: Optional[int] = None,
    search: Optional[str] = None,
    svc: M3Service = Depends(get_m3_service),
    _=Depends(get_current_user)
):
    items, total = svc.get_exams((page - 1) * page_size, page_size, offering_id, term_id, search)
    return {"items": [dict(i._mapping) for i in items], "total": total, "page": page, "page_size": page_size}

@m3_router.get("/exams/{id}", response_model=ExamResponse)
def get_exam(id: int, svc: M3Service = Depends(get_m3_service), _=Depends(get_current_user)):
    return svc.get_exam(id)

@m3_router.patch("/exams/{id}", response_model=ExamResponse)
def update_exam(id: int, data: ExamUpdate, svc: M3Service = Depends(get_m3_service), _=Depends(require_permission(["Exams_Admin"]))):
    svc.update_exam(id, data.model_dump(exclude_unset=True))
    return svc.get_exam(id)

@m3_router.put("/exams/{id}", response_model=ExamResponse)
def update_exam_put(id: int, data: ExamUpdate, svc: M3Service = Depends(get_m3_service), _=Depends(require_permission(["Exams_Admin"]))):
    svc.update_exam(id, data.model_dump(exclude_unset=True))
    return svc.get_exam(id)

@m3_router.delete("/exams/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam(id: int, svc: M3Service = Depends(get_m3_service), _=Depends(require_permission(["Exams_Admin"]))):
    svc.delete_exam(id)

@m3_router.get("/me/exams", response_model=List[StudentAvailableExamResponse])
def get_my_available_exams(svc: M3Service = Depends(get_m3_service), user: CurrentUser = Depends(require_role(["Student"]))):
    """List exams for student's enrolled courses with eligibility flag (E-06)."""
    return svc.get_student_available_exams(user.user_id)

# --- Exam Registration (E-06, E-07) ---
@m3_router.post("/exam-registrations", status_code=status.HTTP_201_CREATED, response_model=ExamRegistrationResponse)
def register_exam(data: ExamRegistrationCreate, svc: M3Service = Depends(get_m3_service), user: CurrentUser = Depends(require_role(["Student"]))):
    svc.register_for_exam(data.exam_id, user.user_id)
    row = svc.get_exam_registration(data.exam_id, user.user_id)
    return dict(row._mapping) if row else None

@m3_router.get("/exam-registrations", response_model=PaginatedResponse)
def get_exam_registrations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    exam_id: Optional[int] = None,
    student_id: Optional[int] = None,
    search: Optional[str] = None,
    svc: M3Service = Depends(get_m3_service),
    _=Depends(require_permission(["Exams_Admin"]))
):
    items, total = svc.get_exam_registrations((page - 1) * page_size, page_size, exam_id, student_id, search)
    return {"items": [dict(i._mapping) for i in items], "total": total, "page": page, "page_size": page_size}

@m3_router.get("/exam-registrations/blocked", response_model=PaginatedResponse)
def get_blocked_registrations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    search: Optional[str] = None,
    svc: M3Service = Depends(get_m3_service),
    _=Depends(require_permission(["Exams_Admin"]))
):
    items, total = svc.get_blocked_exam_students((page - 1) * page_size, page_size, search)
    return {"items": [dict(i._mapping) for i in items], "total": total, "page": page, "page_size": page_size}

# --- Marks & Results (E-08, E-09, E-10, E-12) ---
@m3_router.put("/exams/{id}/marks", status_code=status.HTTP_200_OK)
def enter_marks(id: int, data: MarksBulkEntry, svc: M3Service = Depends(get_m3_service), user: CurrentUser = Depends(require_role(["Faculty", "Admin"]))):
    has_admin = any(role.lower() in ["admin", "superadmin"] for role in user.roles) or "exams_admin" in [p.lower() for p in user.permission_sets]
    svc.enter_marks(id, [m.model_dump() for m in data.marks], user.user_id, has_admin)
    return {"status": "success", "message": "Marks recorded successfully"}

@m3_router.get("/exams/{id}/marks", response_model=List[MarksResultResponse])
def get_marks(id: int, svc: M3Service = Depends(get_m3_service), user: CurrentUser = Depends(require_role(["Faculty", "Admin"]))):
    has_admin = any(role.lower() in ["admin", "superadmin"] for role in user.roles) or "exams_admin" in [p.lower() for p in user.permission_sets]
    items = svc.get_marks(id, user.user_id, has_admin)
    return [dict(i._mapping) for i in items]

@m3_router.post("/results/process")
def process_results(data: ProcessResultInput, svc: M3Service = Depends(get_m3_service), _=Depends(require_permission(["Exams_Admin"]))):
    svc.process_results(data.exam_id)
    return {"status": "success", "message": "Results processed and grade points computed"}

@m3_router.post("/results/publish")
def publish_results(data: ProcessResultInput, svc: M3Service = Depends(get_m3_service), _=Depends(require_permission(["Exams_Admin"]))):
    svc.publish_results(data.exam_id)
    return {"status": "success", "message": "Results published and semester GPA updated"}

@m3_router.get("/me/results", response_model=List[MyResultResponse])
def get_my_results(svc: M3Service = Depends(get_m3_service), user: CurrentUser = Depends(require_role(["Student"]))):
    return svc.get_my_results(user.user_id)

@m3_router.get("/me/cgpa", response_model=CgpaResponse)
def get_my_cgpa(svc: M3Service = Depends(get_m3_service), user: CurrentUser = Depends(require_role(["Student"]))):
    return svc.get_my_cgpa(user.user_id)

@m3_router.get("/exams/{id}/summary", response_model=CourseResultSummaryResponse)
def get_course_result_summary(id: int, svc: M3Service = Depends(get_m3_service), user: CurrentUser = Depends(require_role(["Faculty", "Admin"]))):
    return svc.get_course_result_summary(id)
