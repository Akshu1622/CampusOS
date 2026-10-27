from fastapi import APIRouter, Depends, Request, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any, Optional
import io
import csv
import json
import xml.etree.ElementTree as ET

from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user, CurrentUser, require_role, require_permission, require_ownership_or_role
from app.core.errors import APIError
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

def parse_bulk_file_contents(contents: bytes, filename: str, db: Session) -> List[dict]:
    fname = filename.lower()
    payload = []
    
    if fname.endswith(".csv") or fname.endswith(".txt"):
        text_data = contents.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text_data))
        for row in reader:
            stu = row.get("student_id") or row.get("student")
            off = row.get("offering_id") or row.get("offering")
            if not stu or not off:
                continue
            stu_str = str(stu).strip()
            if stu_str.startswith("STU-"):
                res = db.execute(text("SELECT id FROM student WHERE global_student_id = :gid"), {"gid": stu_str}).fetchone()
                stu_id = res[0] if res else None
            else:
                stu_id = int(stu_str) if stu_str.isdigit() else None
            off_id = int(str(off).strip()) if str(off).strip().isdigit() else None
            if stu_id and off_id:
                payload.append({"student_id": stu_id, "offering_id": off_id})

    elif fname.endswith(".xml"):
        root = ET.fromstring(contents.decode("utf-8"))
        for elem in root.findall(".//enrollment") or root.findall(".//row"):
            stu = elem.findtext("student_id") or elem.findtext("student")
            off = elem.findtext("offering_id") or elem.findtext("offering")
            if not stu or not off:
                continue
            stu_str = str(stu).strip()
            if stu_str.startswith("STU-"):
                res = db.execute(text("SELECT id FROM student WHERE global_student_id = :gid"), {"gid": stu_str}).fetchone()
                stu_id = res[0] if res else None
            else:
                stu_id = int(stu_str) if stu_str.isdigit() else None
            off_id = int(str(off).strip()) if str(off).strip().isdigit() else None
            if stu_id and off_id:
                payload.append({"student_id": stu_id, "offering_id": off_id})

    else:
        # Default JSON
        data = json.loads(contents.decode("utf-8"))
        if isinstance(data, list):
            payload = data
        elif isinstance(data, dict) and "payload" in data:
            payload = data["payload"]
        elif isinstance(data, dict) and "enrollments" in data:
            payload = data["enrollments"]
            
    return payload

# --- Course ---
@router.get("/courses", response_model=PaginatedCourses, tags=["Courses"], dependencies=[Depends(require_role(["Admin", "Faculty", "Student"]))])
def get_courses(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    department_id: Optional[int] = None,
    search: Optional[str] = None,
    svc: M2Service = Depends(get_service)
):
    rows, total = svc.get_courses((page-1)*page_size, page_size, department_id, search)
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

@router.get("/courses/{id}", response_model=CourseResponse, tags=["Courses"], dependencies=[Depends(require_role(["Admin", "Faculty", "Student"]))])
def get_course(id: int, svc: M2Service = Depends(get_service)):
    return svc.get_course(id)

@router.delete("/courses/{id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Courses"], dependencies=[Depends(require_permission(["Academics_Admin"]))])
def delete_course(id: int, svc: M2Service = Depends(get_service)):
    svc.delete_course(id)

# --- Curriculum Mapping ---
@router.get("/curriculum", response_model=PaginatedCurriculum, tags=["Curriculum"], dependencies=[Depends(require_role(["Admin", "Faculty", "Student"]))])
def get_curriculum(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    program_id: Optional[int] = None,
    semester: Optional[int] = None,
    search: Optional[str] = None,
    svc: M2Service = Depends(get_service)
):
    rows, total = svc.get_curriculum((page-1)*page_size, page_size, program_id, semester, search)
    items = [CurriculumResponse(**dict(r._mapping)) for r in rows]
    return PaginatedCurriculum(items=items, total=total, page=page, page_size=page_size)

@router.get("/curriculum/{id}", response_model=CurriculumResponse, tags=["Curriculum"], dependencies=[Depends(require_role(["Admin", "Faculty", "Student"]))])
def get_curriculum_by_id(id: int, svc: M2Service = Depends(get_service)):
    return svc.get_curriculum_by_id(id)

@router.post("/curriculum", response_model=CurriculumResponse, status_code=status.HTTP_201_CREATED, tags=["Curriculum"], dependencies=[Depends(require_permission(["Academics_Admin"]))])
def create_curriculum(req: CurriculumCreateRequest, request: Request, user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    cid = svc.create_curriculum(req.model_dump(), user.user_id, request.client.host)
    return svc.get_curriculum_by_id(cid)

@router.patch("/curriculum/{id}", response_model=CurriculumResponse, tags=["Curriculum"], dependencies=[Depends(require_permission(["Academics_Admin"]))])
def update_curriculum(id: int, req: CurriculumUpdateRequest, request: Request, user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    svc.update_curriculum(id, req.type, user.user_id, request.client.host)
    return svc.get_curriculum_by_id(id)

@router.put("/curriculum/{id}", response_model=CurriculumResponse, tags=["Curriculum"], dependencies=[Depends(require_permission(["Academics_Admin"]))])
def update_curriculum_put(id: int, req: CurriculumUpdateRequest, request: Request, user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    svc.update_curriculum(id, req.type, user.user_id, request.client.host)
    return svc.get_curriculum_by_id(id)

@router.delete("/curriculum/{id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Curriculum"], dependencies=[Depends(require_permission(["Academics_Admin"]))])
def delete_curriculum(id: int, request: Request, user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    svc.delete_curriculum(id, user.user_id, request.client.host)

# --- Course Offering ---
@router.get("/offerings", response_model=PaginatedOfferings, tags=["Offerings"], dependencies=[Depends(require_role(["Admin", "Faculty", "Student"]))])
def get_offerings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    term_id: Optional[int] = None,
    course_id: Optional[int] = None,
    faculty_id: Optional[int] = None,
    search: Optional[str] = None,
    svc: M2Service = Depends(get_service)
):
    rows, total = svc.get_offerings((page-1)*page_size, page_size, term_id, course_id, faculty_id, search)
    items = [OfferingResponse(**dict(r._mapping)) for r in rows]
    return PaginatedOfferings(items=items, total=total, page=page, page_size=page_size)

@router.get("/offerings/{id}", response_model=OfferingResponse, tags=["Offerings"], dependencies=[Depends(require_role(["Admin", "Faculty", "Student"]))])
def get_offering(id: int, svc: M2Service = Depends(get_service)):
    return svc.get_offering(id)

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
def get_enrollments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    student_id: Optional[int] = None,
    offering_id: Optional[int] = None,
    term_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    svc: M2Service = Depends(get_service)
):
    rows, total = svc.get_enrollments((page-1)*page_size, page_size, student_id, offering_id, term_id, status, search)
    items = [EnrollmentResponse(**dict(r._mapping)) for r in rows]
    return PaginatedEnrollments(items=items, total=total, page=page, page_size=page_size)

@router.get("/enrollments/{id}", response_model=EnrollmentResponse, tags=["Enrollments"], dependencies=[Depends(require_role(["Admin"]))])
def get_enrollment(id: int, svc: M2Service = Depends(get_service)):
    return svc.get_enrollment(id)

@router.post("/enrollments", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED, tags=["Enrollments"], dependencies=[Depends(require_permission(["Academics_Admin"]))])
def create_enrollment(req: EnrollmentCreateRequest, request: Request, user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    eid = svc.create_enrollment(req.model_dump(), user.user_id, request.client.host)
    return svc.get_enrollment(eid)

@router.patch("/enrollments/{id}/withdraw", response_model=EnrollmentResponse, tags=["Enrollments"], dependencies=[Depends(require_permission(["Academics_Admin"]))])
def withdraw_enrollment(id: int, request: Request, user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    svc.withdraw_enrollment(id, user.user_id, request.client.host)
    return svc.get_enrollment(id)

@router.put("/enrollments/{id}/withdraw", response_model=EnrollmentResponse, tags=["Enrollments"], dependencies=[Depends(require_permission(["Academics_Admin"]))])
def withdraw_enrollment_put(id: int, request: Request, user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    svc.withdraw_enrollment(id, user.user_id, request.client.host)
    return svc.get_enrollment(id)

@router.post("/enrollments/bulk", response_model=BulkEnrollmentResponse, tags=["Enrollments"], dependencies=[Depends(require_permission(["Academics_Admin"]))])
def bulk_enrollment(req: BulkEnrollmentRequest, request: Request, user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    return svc.run_bulk_enrollment(req.payload, req.policy, req.dry_run, user.user_id, request.client.host)

@router.post("/enrollments/bulk/validate", response_model=BulkEnrollmentResponse, tags=["Enrollments"], dependencies=[Depends(require_permission(["Academics_Admin"]))])
def bulk_enrollment_validate(req: BulkEnrollmentRequest, request: Request, user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    return svc.run_bulk_enrollment(req.payload, req.policy, True, user.user_id, request.client.host)

@router.post("/enrollments/bulk/upload", response_model=BulkEnrollmentResponse, tags=["Enrollments"], dependencies=[Depends(require_permission(["Academics_Admin"]))])
async def bulk_enrollment_upload(
    file: UploadFile = File(...),
    policy: str = Form("SKIP_INVALID"),
    dry_run: bool = Form(False),
    request: Request = None,
    user: CurrentUser = Depends(get_current_user),
    svc: M2Service = Depends(get_service),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    payload = parse_bulk_file_contents(contents, file.filename, db)
    if not payload:
        raise APIError("BAD_REQUEST", "No valid enrollment rows could be parsed from the file", 400)
    return svc.run_bulk_enrollment(payload, policy, dry_run, user.user_id, request.client.host if request else "")

@router.post("/enrollments/bulk/validate-upload", response_model=BulkEnrollmentResponse, tags=["Enrollments"], dependencies=[Depends(require_permission(["Academics_Admin"]))])
async def bulk_enrollment_validate_upload(
    file: UploadFile = File(...),
    policy: str = Form("SKIP_INVALID"),
    request: Request = None,
    user: CurrentUser = Depends(get_current_user),
    svc: M2Service = Depends(get_service),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    payload = parse_bulk_file_contents(contents, file.filename, db)
    if not payload:
        raise APIError("BAD_REQUEST", "No valid enrollment rows could be parsed from the file", 400)
    return svc.run_bulk_enrollment(payload, policy, True, user.user_id, request.client.host if request else "")

# --- Role Views ---
@router.get("/me/courses", response_model=List[MyCourseResponse], tags=["Self Service"], dependencies=[Depends(require_role(["Student"]))])
def get_my_courses(term_id: Optional[int] = None, user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    u = svc.repo.db.execute(text("SELECT student_id FROM user_account WHERE id = :uid"), {"uid": user.user_id}).fetchone()
    if not u or not u.student_id:
        raise APIError("NOT_FOUND", "No student profile linked", 404)
    rows = svc.get_my_courses(u.student_id, term_id)
    return [MyCourseResponse(**dict(r._mapping)) for r in rows]

@router.get("/faculty/me/offerings", response_model=List[MyTeachingResponse], tags=["Self Service"], dependencies=[Depends(require_role(["Faculty"]))])
def get_my_teaching(term_id: Optional[int] = None, user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    u = svc.repo.db.execute(text("SELECT employee_id FROM user_account WHERE id = :uid"), {"uid": user.user_id}).fetchone()
    if not u or not u.employee_id:
        raise APIError("NOT_FOUND", "No employee profile linked", 404)
    rows = svc.get_my_teaching(u.employee_id, term_id)
    return [MyTeachingResponse(**dict(r._mapping)) for r in rows]

@router.get("/offerings/{id}/roster", response_model=List[RosterStudentResponse], tags=["Offerings"])
def get_offering_roster(id: int, user: CurrentUser = Depends(get_current_user), svc: M2Service = Depends(get_service)):
    o = svc.get_offering(id)
    is_admin = any(role.lower() in ["admin", "superadmin"] for role in user.roles)
    if not is_admin:
        u = svc.repo.db.execute(text("SELECT employee_id FROM user_account WHERE id = :uid"), {"uid": user.user_id}).fetchone()
        if not u or u.employee_id != o.faculty_id:
            raise APIError("FORBIDDEN", "You do not have access to this roster", 403)
            
    rows = svc.get_offering_roster(id)
    return [RosterStudentResponse(**dict(r._mapping)) for r in rows]
