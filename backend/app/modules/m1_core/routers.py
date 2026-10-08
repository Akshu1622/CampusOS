from fastapi import APIRouter, Depends, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user, CurrentUser, require_role, require_ownership_or_role
from app.modules.m1_core.schemas import (
    Token, TokenRefreshRequest, ChangePasswordRequest, ResetPasswordRequest,
    UserStatusUpdate, UserRoleUpdate, UserResponse, UserCreateRequest,
    RoleResponse, DepartmentResponse, ProgramResponse, TermResponse, TermCreateRequest,
    StudentCreateRequest, StudentResponse, PaginatedUsers, PaginatedStudents,
    DepartmentCreateRequest, ProgramCreateRequest
)
from app.modules.m1_core.service import M1Service
from app.core.security import get_password_hash
from app.core.limiter import limiter

router = APIRouter()

def get_service(db: Session = Depends(get_db)):
    return M1Service(db)

@router.post("/auth/login", response_model=Token, tags=["Auth"])
@limiter.limit("20/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), svc: M1Service = Depends(get_service)):
    return svc.perform_login(form_data.username, form_data.password, request.client.host)

@router.post("/auth/refresh", response_model=Token, tags=["Auth"])
def refresh(req: TokenRefreshRequest, svc: M1Service = Depends(get_service)):
    return svc.perform_refresh(req.refresh_token)

@router.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT, tags=["Auth"])
def logout(req: TokenRefreshRequest, svc: M1Service = Depends(get_service)):
    svc.logout(req.refresh_token)
    return None

@router.get("/me", response_model=UserResponse, tags=["Users"])
def get_me(user: CurrentUser = Depends(get_current_user), svc: M1Service = Depends(get_service)):
    u = svc.repo.get_user_by_id(user.user_id)
    return {"id": u.id, "username": u.username, "status": u.status, "student_id": u.student_id, "employee_id": u.employee_id, "roles": user.roles}

@router.put("/me/change-password", status_code=status.HTTP_204_NO_CONTENT, tags=["Users"])
def change_password(req: ChangePasswordRequest, request: Request, user: CurrentUser = Depends(get_current_user), svc: M1Service = Depends(get_service)):
    # Validate old password
    u = svc.repo.get_user_by_username(svc.repo.get_user_by_id(user.user_id).username)
    from app.core.security import verify_password
    if not verify_password(req.old_password, u.password_hash):
        from app.core.errors import APIError
        raise APIError(code="UNAUTHORIZED", message="Incorrect old password", status_code=status.HTTP_401_UNAUTHORIZED)
    new_hash = get_password_hash(req.new_password)
    svc.repo.update_password(user.user_id, new_hash)
    svc.repo.log_audit(user.user_id, "PASSWORD_CHANGED", "user_account", user.user_id, "Password changed by user", request.client.host)

@router.get("/users", response_model=PaginatedUsers, tags=["Users"], dependencies=[Depends(require_role(["ADMIN", "SUPERADMIN"]))])
def get_users(page: int = 1, page_size: int = 20, svc: M1Service = Depends(get_service)):
    rows, total = svc.repo.get_users((page-1)*page_size, page_size)
    items = []
    for r in rows:
        roles, _ = svc.repo.get_user_roles_and_perms(r.id)
        items.append(UserResponse(id=r.id, username=r.username, status=r.status, student_id=r.student_id, employee_id=r.employee_id, roles=roles))
    return PaginatedUsers(items=items, total=total, page=page, page_size=page_size)

@router.post("/users", response_model=UserResponse, tags=["Users"], dependencies=[Depends(require_role(["ADMIN", "SUPERADMIN"]))])
def create_user(req: UserCreateRequest, svc: M1Service = Depends(get_service)):
    uid = svc.repo.create_user(req.username, get_password_hash(req.password), req.student_id, req.employee_id)
    for role in req.roles:
        svc.repo.assign_user_role(uid, role)
    return {"id": uid, "username": req.username, "status": "ACTIVE", "student_id": req.student_id, "employee_id": req.employee_id, "roles": req.roles}

@router.get("/users/{id}", response_model=UserResponse, tags=["Users"])
def get_user(id: int, user: CurrentUser = Depends(get_current_user), svc: M1Service = Depends(get_service)):
    require_ownership_or_role(id, ["ADMIN", "SUPERADMIN"], user)
    u = svc.repo.get_user_by_id(id)
    if not u:
        from app.core.errors import APIError
        raise APIError("NOT_FOUND", "User not found", 404)
    roles, _ = svc.repo.get_user_roles_and_perms(u.id)
    return {"id": u.id, "username": u.username, "status": u.status, "student_id": u.student_id, "employee_id": u.employee_id, "roles": roles}

@router.put("/users/{id}/status", status_code=status.HTTP_204_NO_CONTENT, tags=["Users"], dependencies=[Depends(require_role(["ADMIN", "SUPERADMIN"]))])
def update_user_status(id: int, req: UserStatusUpdate, svc: M1Service = Depends(get_service)):
    svc.repo.update_user_status(id, req.status)

@router.post("/users/{id}/reset-password", status_code=status.HTTP_204_NO_CONTENT, tags=["Users"], dependencies=[Depends(require_role(["ADMIN", "SUPERADMIN"]))])
def reset_password(id: int, req: ResetPasswordRequest, request: Request, user: CurrentUser = Depends(get_current_user), svc: M1Service = Depends(get_service)):
    new_hash = get_password_hash(req.new_password)
    svc.repo.update_password(id, new_hash)
    svc.repo.log_audit(user.user_id, "PASSWORD_RESET", "user_account", id, "Password reset by admin", request.client.host)

@router.get("/roles", response_model=List[RoleResponse], tags=["Roles"], dependencies=[Depends(require_role(["ADMIN", "SUPERADMIN"]))])
def get_roles(svc: M1Service = Depends(get_service)):
    return svc.repo.get_roles()

@router.put("/users/{id}/roles", status_code=status.HTTP_204_NO_CONTENT, tags=["Users"], dependencies=[Depends(require_role(["SUPERADMIN"]))])
def update_user_roles(id: int, req: UserRoleUpdate, request: Request, user: CurrentUser = Depends(get_current_user), svc: M1Service = Depends(get_service)):
    svc.repo.clear_user_roles(id)
    for role in req.roles:
        svc.repo.assign_user_role(id, role)
    svc.repo.log_audit(user.user_id, "ROLES_UPDATED", "user_role", id, f"Roles updated to {req.roles}", request.client.host)

@router.get("/departments", response_model=List[DepartmentResponse], tags=["Catalog"])
def get_departments(svc: M1Service = Depends(get_service)):
    return svc.repo.get_departments()

@router.post("/departments", response_model=dict, tags=["Catalog"], dependencies=[Depends(require_role(["ADMIN", "SUPERADMIN"]))])
def create_department(req: DepartmentCreateRequest, svc: M1Service = Depends(get_service)):
    head_id = int(req.head) if req.head and req.head.isdigit() else None
    svc.repo.create_department(req.code, req.name, head_id)
    return {"message": "Department created"}

@router.get("/programs", response_model=List[ProgramResponse], tags=["Catalog"])
def get_programs(svc: M1Service = Depends(get_service)):
    return svc.repo.get_programs()

@router.post("/programs", response_model=dict, tags=["Catalog"], dependencies=[Depends(require_role(["ADMIN", "SUPERADMIN"]))])
def create_program(req: ProgramCreateRequest, svc: M1Service = Depends(get_service)):
    # Generate code from name, e.g. "B.Tech Computer Science" -> "B.TECH_CO" or just a stripped version
    code = "".join([c.upper() for c in req.name if c.isalnum() or c.isspace()]).replace(" ", "_")[:10]
    svc.repo.create_program(code, req.name, req.department_id, req.duration_years, req.total_credits)
    return {"message": "Program created"}

@router.get("/terms", response_model=List[TermResponse], tags=["Catalog"])
def get_terms(svc: M1Service = Depends(get_service)):
    return svc.repo.get_terms()

@router.post("/terms", response_model=dict, tags=["Catalog"], dependencies=[Depends(require_role(["ADMIN", "SUPERADMIN"]))])
def create_term(req: TermCreateRequest, svc: M1Service = Depends(get_service)):
    svc.repo.create_term(req.year, req.label, req.start_date, req.end_date, req.is_current)
    return {"message": "Term created"}

@router.get("/students", response_model=PaginatedStudents, tags=["Students"], dependencies=[Depends(require_role(["ADMIN", "FACULTY", "HR"]))])
def get_students(page: int = 1, page_size: int = 20, svc: M1Service = Depends(get_service)):
    rows, total = svc.repo.get_students((page-1)*page_size, page_size)
    items = []
    for r in rows:
        items.append(StudentResponse(
            id=r.id, global_student_id=r.global_student_id, first_name=r.first_name, last_name=r.last_name, 
            email=r.email, phone=r.phone, batch_year=r.batch_year, program_id=r.program_id, status=r.status
        ))
    return PaginatedStudents(items=items, total=total, page=page, page_size=page_size)

@router.post("/students", response_model=StudentResponse, tags=["Students"], dependencies=[Depends(require_role(["ADMIN"]))])
def create_student(req: StudentCreateRequest, svc: M1Service = Depends(get_service)):
    gid = svc.repo.generate_student_id(req.batch_year)
    if not gid:
        from app.core.errors import APIError
        raise APIError("ID_GENERATION_FAILED", "Failed to generate student ID", 500)
    sid = svc.repo.create_student(gid, req.model_dump())
    rows, _ = svc.repo.get_students(0, 1) # Just a hack to get format since get_student_by_id isn't in repo, let's just return what we have
    return StudentResponse(
        id=sid, global_student_id=gid, first_name=req.first_name, last_name=req.last_name,
        email=req.email, phone=req.phone, batch_year=req.batch_year,
        program_id=req.program_id, status="ACTIVE"
    )
