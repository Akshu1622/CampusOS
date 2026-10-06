from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user, require_role, require_permission, CurrentUser
from app.modules.m3_attendance_exams.schemas import (
    GradeScaleCreate, GradeScaleUpdate, GradeScaleResponse,
    AttendanceSessionCreate, AttendanceSessionUpdate, AttendanceSessionResponse,
    MyAttendanceResponse, AttendanceShortageReport,
    ExamCreate, ExamUpdate, ExamResponse,
    ExamRegistrationCreate, ExamRegistrationResponse,
    MarksBulkEntry, MarksResultResponse, ProcessResultInput,
    MyResultResponse, CgpaResponse, CourseResultSummaryResponse, PaginatedResponse
)
from app.modules.m3_attendance_exams.service import M3Service

m3_router = APIRouter(prefix="/api/v1", tags=["M3 - Attendance and Exams"])

def get_m3_service(db: Session = Depends(get_db)):
    return M3Service(db)

# --- Grade Scale ---
@m3_router.post("/grade-scale", status_code=status.HTTP_201_CREATED, response_model=GradeScaleResponse)
def create_grade_scale(data: GradeScaleCreate, svc: M3Service = Depends(get_m3_service), _=Depends(require_permission(["Exams_Admin"]))):
    id = svc.create_grade_scale(data.dict())
    return svc.get_grade_scale(id)

@m3_router.get("/grade-scale", response_model=PaginatedResponse)
def get_grade_scales(page: int = 1, page_size: int = 20, svc: M3Service = Depends(get_m3_service), _=Depends(require_role(["Admin"]))):
    items = svc.get_grade_scales((page - 1) * page_size, page_size)
    return {"items": [dict(i._mapping) for i in items], "total": len(items), "page": page, "page_size": page_size}

@m3_router.get("/grade-scale/{id}", response_model=GradeScaleResponse)
def get_grade_scale(id: int, svc: M3Service = Depends(get_m3_service), _=Depends(require_role(["Admin"]))):
    return svc.get_grade_scale(id)

@m3_router.patch("/grade-scale/{id}", response_model=GradeScaleResponse)
def update_grade_scale(id: int, data: GradeScaleUpdate, svc: M3Service = Depends(get_m3_service), _=Depends(require_permission(["Exams_Admin"]))):
    svc.update_grade_scale(id, data.dict(exclude_unset=True))
    return svc.get_grade_scale(id)

@m3_router.delete("/grade-scale/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_grade_scale(id: int, svc: M3Service = Depends(get_m3_service), _=Depends(require_permission(["Exams_Admin"]))):
    svc.delete_grade_scale(id)

# --- Attendance ---
@m3_router.post("/attendance/sessions", status_code=status.HTTP_201_CREATED, response_model=AttendanceSessionResponse)
def mark_attendance(data: AttendanceSessionCreate, svc: M3Service = Depends(get_m3_service), user: CurrentUser = Depends(require_role(["Faculty", "Admin"]))):
    has_admin = "Exams_Admin" in user.permission_sets
    sid = svc.mark_attendance(data.dict(), user.user_id, has_admin)
    return svc.repo.get_attendance_session_by_id(sid)

@m3_router.put("/attendance/sessions/{id}", status_code=status.HTTP_200_OK, response_model=AttendanceSessionResponse)
def update_attendance_session(id: int, data: AttendanceSessionUpdate, svc: M3Service = Depends(get_m3_service), user: CurrentUser = Depends(require_role(["Faculty", "Admin"]))):
    has_admin = "Exams_Admin" in user.permission_sets
    svc.update_attendance_session(id, [r.dict() for r in data.records], user.user_id, has_admin)
    row = svc.repo.get_attendance_session_by_id(id)
    return dict(row._mapping) if row else None

@m3_router.get("/attendance/sessions", response_model=PaginatedResponse)
def get_attendance_sessions(page: int = 1, page_size: int = 20, offering_id: int = None, svc: M3Service = Depends(get_m3_service), _=Depends(require_role(["Faculty", "Admin"]))):
    items = svc.get_attendance_sessions((page - 1) * page_size, page_size, offering_id)
    return {"items": [dict(i._mapping) for i in items], "total": len(items), "page": page, "page_size": page_size}

@m3_router.get("/me/attendance", response_model=List[MyAttendanceResponse])
def get_my_attendance(svc: M3Service = Depends(get_m3_service), user: CurrentUser = Depends(require_role(["Student"]))):
    return svc.get_my_attendance(user.user_id)

@m3_router.get("/attendance/shortage", response_model=PaginatedResponse)
def get_attendance_shortage(page: int = 1, page_size: int = 20, svc: M3Service = Depends(get_m3_service), _=Depends(require_role(["Faculty", "Admin"]))):
    items = svc.get_attendance_shortage((page - 1) * page_size, page_size)
    return {"items": [dict(i._mapping) for i in items], "total": len(items), "page": page, "page_size": page_size}

# --- Exams ---
@m3_router.post("/exams", status_code=status.HTTP_201_CREATED, response_model=ExamResponse)
def create_exam(data: ExamCreate, svc: M3Service = Depends(get_m3_service), _=Depends(require_permission(["Exams_Admin"]))):
    id = svc.create_exam(data.dict())
    return svc.get_exam(id)

@m3_router.get("/exams", response_model=PaginatedResponse)
def get_exams(page: int = 1, page_size: int = 20, offering_id: int = None, svc: M3Service = Depends(get_m3_service), _=Depends(get_current_user)):
    items = svc.get_exams((page - 1) * page_size, page_size, offering_id)
    return {"items": [dict(i._mapping) for i in items], "total": len(items), "page": page, "page_size": page_size}

@m3_router.get("/exams/{id}", response_model=ExamResponse)
def get_exam(id: int, svc: M3Service = Depends(get_m3_service), _=Depends(get_current_user)):
    return svc.get_exam(id)

@m3_router.patch("/exams/{id}", response_model=ExamResponse)
def update_exam(id: int, data: ExamUpdate, svc: M3Service = Depends(get_m3_service), _=Depends(require_permission(["Exams_Admin"]))):
    svc.update_exam(id, data.dict(exclude_unset=True))
    return svc.get_exam(id)

@m3_router.delete("/exams/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam(id: int, svc: M3Service = Depends(get_m3_service), _=Depends(require_permission(["Exams_Admin"]))):
    svc.delete_exam(id)

# --- Exam Registration ---
@m3_router.post("/exam-registrations", status_code=status.HTTP_201_CREATED, response_model=ExamRegistrationResponse)
def register_exam(data: ExamRegistrationCreate, svc: M3Service = Depends(get_m3_service), user: CurrentUser = Depends(require_role(["Student"]))):
    id = svc.register_for_exam(data.exam_id, user.user_id)
    row = svc.get_exam_registration(data.exam_id, user.user_id)
    return dict(row._mapping) if row else None

@m3_router.get("/exam-registrations", response_model=PaginatedResponse)
def get_exam_registrations(page: int = 1, page_size: int = 20, exam_id: int = None, student_id: int = None, svc: M3Service = Depends(get_m3_service), _=Depends(require_permission(["Exams_Admin"]))):
    items = svc.get_exam_registrations((page - 1) * page_size, page_size, exam_id, student_id)
    return {"items": [dict(i._mapping) for i in items], "total": len(items), "page": page, "page_size": page_size}

# --- Marks & Results ---
@m3_router.put("/exams/{id}/marks", status_code=status.HTTP_200_OK)
def enter_marks(id: int, data: MarksBulkEntry, svc: M3Service = Depends(get_m3_service), user: CurrentUser = Depends(require_role(["Faculty", "Admin"]))):
    has_admin = "Exams_Admin" in user.permission_sets
    svc.enter_marks(id, [m.dict() for m in data.marks], user.user_id, has_admin)
    return {"status": "success"}

@m3_router.get("/exams/{id}/marks", response_model=List[MarksResultResponse])
def get_marks(id: int, svc: M3Service = Depends(get_m3_service), user: CurrentUser = Depends(require_role(["Faculty", "Admin"]))):
    has_admin = "Exams_Admin" in user.permission_sets
    items = svc.get_marks(id, user.user_id, has_admin)
    return [dict(i._mapping) for i in items]

@m3_router.post("/results/process")
def process_results(data: ProcessResultInput, svc: M3Service = Depends(get_m3_service), _=Depends(require_permission(["Exams_Admin"]))):
    svc.process_results(data.exam_id)
    return {"status": "success"}

@m3_router.post("/results/publish")
def publish_results(data: ProcessResultInput, svc: M3Service = Depends(get_m3_service), _=Depends(require_permission(["Exams_Admin"]))):
    svc.publish_results(data.exam_id)
    return {"status": "success"}

@m3_router.get("/me/results", response_model=List[MyResultResponse])
def get_my_results(svc: M3Service = Depends(get_m3_service), user: CurrentUser = Depends(require_role(["Student"]))):
    return svc.get_my_results(user.user_id)

@m3_router.get("/me/cgpa", response_model=CgpaResponse)
def get_my_cgpa(svc: M3Service = Depends(get_m3_service), user: CurrentUser = Depends(require_role(["Student"]))):
    return svc.get_my_cgpa(user.user_id)

@m3_router.get("/exams/{id}/summary", response_model=CourseResultSummaryResponse)
def get_course_result_summary(id: int, svc: M3Service = Depends(get_m3_service), user: CurrentUser = Depends(require_role(["Faculty", "Admin"]))):
    has_admin = "Exam_Admin" in user.permission_sets
    return svc.get_course_result_summary(id)
