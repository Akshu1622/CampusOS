from fastapi import APIRouter, Depends, Request, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any, Optional

from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user, CurrentUser, require_role, require_permission, require_ownership_or_role
from app.modules.m2_academics.schemas import (
    CourseCreateRequest, CourseUpdateRequest, CourseResponse, PaginatedCourses,
    CurriculumCreateRequest, CurriculumUpdateRequest, CurriculumResponse, PaginatedCurriculum,
    OfferingCreateRequest, OfferingUpdateRequest, OfferingResponse, PaginatedOfferings,
    EnrollmentCreateRequest, EnrollmentResponse, PaginatedEnrollments,
    BulkEnrollmentRequest, BulkEnrollmentResponse,
    MyCourseResponse, MyTeachingResponse, RosterStudentResponse
)
from app.modules.m2_academics.service import M2Service

router = APIRouter()

def get_service(db: Session = Depends(get_db)):
    return M2Service(db)

# --- Course ---
@router.get("/courses", response_model=PaginatedCourses, tags=["Courses"], dependencies=[Depends(require_role(["Admin", "Faculty", "Student"]))])
def get_courses(page: int = 1, page_size: int = 20, department_id: Optional[int] = None, svc: M2Service = Depends(get_service)):
    rows, total = svc.get_courses((page-1)*page_size, page_size, department_id)
    items = [CourseResponse(**dict(r._mapping)) for r in rows]
    return PaginatedCourses(items=items, total=total, page=page, page_size=page_size)

@router.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED, tags=["Courses"], dependencies=[Depends(require_permission(["Academics_Admin"]))])
def create_course(req: CourseCreateRequest, request: Request, user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    cid = svc.create_course(req.model_dump(), user.user_id, request.client.host)
    return svc.get_course(cid)

@router.put("/courses/{id}", response_model=CourseResponse, tags=["Courses"], dependencies=[Depends(require_permission(["Academics_Admin"]))])
def update_course(id: int, req: CourseUpdateRequest, request: Request, user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    svc.update_course(id, req.model_dump(), user.user_id, request.client.host)
    return svc.get_course(id)

# --- Curriculum Mapping ---
@router.get("/curriculum", response_model=PaginatedCurriculum, tags=["Curriculum"], dependencies=[Depends(require_role(["Admin", "Faculty", "Student"]))])
def get_curriculum(page: int = 1, page_size: int = 20, program_id: Optional[int] = None, semester: Optional[int] = None, svc: M2Service = Depends(get_service)):
    rows, total = svc.get_curriculum((page-1)*page_size, page_size, program_id, semester)
    items = [CurriculumResponse(**dict(r._mapping)) for r in rows]
    return PaginatedCurriculum(items=items, total=total, page=page, page_size=page_size)

@router.post("/curriculum", response_model=CurriculumResponse, status_code=status.HTTP_201_CREATED, tags=["Curriculum"], dependencies=[Depends(require_permission(["Academics_Admin"]))])
def create_curriculum(req: CurriculumCreateRequest, request: Request, user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    cid = svc.create_curriculum(req.model_dump(), user.user_id, request.client.host)
    return svc.get_curriculum_by_id(cid)

@router.patch("/curriculum/{id}", response_model=CurriculumResponse, tags=["Curriculum"], dependencies=[Depends(require_permission(["Academics_Admin"]))])
def update_curriculum(id: int, req: CurriculumUpdateRequest, request: Request, user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    svc.update_curriculum(id, req.type, user.user_id, request.client.host)
    return svc.get_curriculum_by_id(id)

@router.delete("/curriculum/{id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Curriculum"], dependencies=[Depends(require_permission(["Academics_Admin"]))])
def delete_curriculum(id: int, request: Request, user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    svc.delete_curriculum(id, user.user_id, request.client.host)

# --- Course Offering ---
@router.get("/offerings", response_model=PaginatedOfferings, tags=["Offerings"], dependencies=[Depends(require_role(["Admin", "Faculty", "Student"]))])
def get_offerings(page: int = 1, page_size: int = 20, term_id: Optional[int] = None, course_id: Optional[int] = None, svc: M2Service = Depends(get_service)):
    rows, total = svc.get_offerings((page-1)*page_size, page_size, term_id, course_id)
    items = [OfferingResponse(**dict(r._mapping)) for r in rows]
    return PaginatedOfferings(items=items, total=total, page=page, page_size=page_size)

@router.post("/offerings", response_model=OfferingResponse, status_code=status.HTTP_201_CREATED, tags=["Offerings"], dependencies=[Depends(require_permission(["Academics_Admin"]))])
def create_offering(req: OfferingCreateRequest, request: Request, user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    oid = svc.create_offering(req.model_dump(), user.user_id, request.client.host)
    return svc.get_offering(oid)

@router.put("/offerings/{id}", response_model=OfferingResponse, tags=["Offerings"], dependencies=[Depends(require_permission(["Academics_Admin"]))])
def update_offering(id: int, req: OfferingUpdateRequest, request: Request, user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    svc.update_offering(id, req.model_dump(), user.user_id, request.client.host)
    return svc.get_offering(id)

@router.delete("/offerings/{id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Offerings"], dependencies=[Depends(require_permission(["Academics_Admin"]))])
def delete_offering(id: int, request: Request, user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    svc.delete_offering(id, user.user_id, request.client.host)

# --- Enrollment ---
@router.get("/enrollments", response_model=PaginatedEnrollments, tags=["Enrollments"], dependencies=[Depends(require_role(["Admin"]))])
def get_enrollments(page: int = 1, page_size: int = 20, student_id: Optional[int] = None, offering_id: Optional[int] = None, svc: M2Service = Depends(get_service)):
    rows, total = svc.get_enrollments((page-1)*page_size, page_size, student_id, offering_id)
    items = [EnrollmentResponse(**dict(r._mapping)) for r in rows]
    return PaginatedEnrollments(items=items, total=total, page=page, page_size=page_size)

@router.post("/enrollments", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED, tags=["Enrollments"], dependencies=[Depends(require_permission(["Academics_Admin"]))])
def create_enrollment(req: EnrollmentCreateRequest, request: Request, user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    eid = svc.create_enrollment(req.model_dump(), user.user_id, request.client.host)
    return svc.get_enrollment(eid)

@router.patch("/enrollments/{id}/withdraw", response_model=EnrollmentResponse, tags=["Enrollments"], dependencies=[Depends(require_permission(["Academics_Admin"]))])
def withdraw_enrollment(id: int, request: Request, user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    svc.withdraw_enrollment(id, user.user_id, request.client.host)
    return svc.get_enrollment(id)

@router.post("/enrollments/bulk", response_model=BulkEnrollmentResponse, tags=["Enrollments"], dependencies=[Depends(require_permission(["Academics_Admin"]))])
def bulk_enrollment(req: BulkEnrollmentRequest, request: Request, user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    return svc.run_bulk_enrollment(req.payload, req.policy, req.dry_run, user.user_id, request.client.host)

@router.post("/enrollments/bulk/validate", response_model=BulkEnrollmentResponse, tags=["Enrollments"], dependencies=[Depends(require_permission(["Academics_Admin"]))])
def bulk_enrollment_validate(req: BulkEnrollmentRequest, request: Request, user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    return svc.run_bulk_enrollment(req.payload, req.policy, True, user.user_id, request.client.host)

# --- Role Views ---
@router.get("/me/courses", response_model=List[MyCourseResponse], tags=["Self Service"], dependencies=[Depends(require_role(["Student"]))])
def get_my_courses(user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    # Need student ID which might not be user_id directly, but wait!
    # In M1, student is linked to user_account by student_id or user_id?
    # PRD §11.2 user_account has student_id. Let's assume user.user_id can resolve to student_id.
    # We must fetch the actual student ID for this user.
    u = svc.repo.db.execute(text("SELECT student_id FROM user_account WHERE id = :uid"), {"uid": user.user_id}).fetchone()
    if not u or not u.student_id:
        from app.core.errors import APIError
        raise APIError("NOT_FOUND", "No student profile linked", 404)
    rows = svc.get_my_courses(u.student_id)
    return [MyCourseResponse(**dict(r._mapping)) for r in rows]

@router.get("/faculty/me/offerings", response_model=List[MyTeachingResponse], tags=["Self Service"], dependencies=[Depends(require_role(["Faculty"]))])
def get_my_teaching(user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    # Faculty ID = employee_id from user_account
    u = svc.repo.db.execute(text("SELECT employee_id FROM user_account WHERE id = :uid"), {"uid": user.user_id}).fetchone()
    if not u or not u.employee_id:
        from app.core.errors import APIError
        raise APIError("NOT_FOUND", "No employee profile linked", 404)
    rows = svc.get_my_teaching(u.employee_id)
    return [MyTeachingResponse(**dict(r._mapping)) for r in rows]

@router.get("/offerings/{id}/roster", response_model=List[RosterStudentResponse], tags=["Offerings"])
def get_offering_roster(id: int, user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    # Admin can view, Faculty can view if it's their own offering
    o = svc.get_offering(id)
    
    is_admin = any(role in user.roles for role in ["Admin"])
    if not is_admin:
        u = svc.repo.db.execute(text("SELECT employee_id FROM user_account WHERE id = :uid"), {"uid": user.user_id}).fetchone()
        if not u or u.employee_id != o.faculty_id:
            from app.core.errors import APIError
            raise APIError("FORBIDDEN", "You do not have access to this roster", 403)
            
    rows = svc.get_offering_roster(id)
    return [RosterStudentResponse(**dict(r._mapping)) for r in rows]
