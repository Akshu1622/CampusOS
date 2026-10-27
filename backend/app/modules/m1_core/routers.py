"""
M1 Core Platform — Routers
Covers: C-01 Auth, C-05 Profile, C-06 Users, C-07 Roles/Permissions,
        C-08 Departments, C-09 Programs, C-10 Terms, C-11 Students
"""
from fastapi import APIRouter, Depends, Request, Query, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional

from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user, CurrentUser, require_role, require_ownership_or_role
from app.modules.m1_core.schemas import (
    Token, TokenRefreshRequest, ChangePasswordRequest, ResetPasswordRequest,
    UserStatusUpdate, UserRoleUpdate, UserPermissionUpdate,
    UserCreateRequest, UserUpdateRequest, UserResponse, UserDetailResponse,
    RoleResponse, PermissionSetResponse,
    DepartmentResponse, DepartmentCreateRequest, DepartmentUpdateRequest, PaginatedDepartments,
    ProgramResponse, ProgramCreateRequest, ProgramUpdateRequest, PaginatedPrograms,
    TermResponse, TermCreateRequest, TermUpdateRequest,
    StudentCreateRequest, StudentUpdateRequest, StudentResponse, StudentDetailResponse,
    PaginatedUsers, PaginatedStudents,
)
from app.modules.m1_core.service import M1Service
from app.core.security import get_password_hash, verify_password
from app.core.limiter import limiter
from app.core.errors import APIError

router = APIRouter()


def get_service(db: Session = Depends(get_db)):
    return M1Service(db)


# ─── Auth (C-01) ──────────────────────────────────────────────────────────────

@router.post("/auth/login", response_model=Token, tags=["Auth"])
@limiter.limit("20/minute")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    svc: M1Service = Depends(get_service)
):
    """Login with username/password. Returns access + refresh tokens."""
    return svc.perform_login(form_data.username, form_data.password, request.client.host)


@router.post("/auth/refresh", response_model=Token, tags=["Auth"])
def refresh(req: TokenRefreshRequest, svc: M1Service = Depends(get_service)):
    """Rotate refresh token and issue a new access token."""
    return svc.perform_refresh(req.refresh_token)


@router.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT, tags=["Auth"])
def logout(req: TokenRefreshRequest, svc: M1Service = Depends(get_service)):
    """Revoke the refresh token (logout)."""
    svc.logout(req.refresh_token)
    return None


# ─── Profile – /me (C-05) ─────────────────────────────────────────────────────

@router.get("/me", response_model=UserDetailResponse, tags=["Profile"])
def get_me(
    user: CurrentUser = Depends(get_current_user),
    svc: M1Service = Depends(get_service)
):
    """Get current user's full profile including linked student/employee data."""
    u = svc.repo.get_user_detail(user.user_id)
    if not u:
        raise APIError("NOT_FOUND", "User not found", 404)
    roles, perms = svc.repo.get_user_roles_and_perms(user.user_id)
    return UserDetailResponse(
        id=u.id, username=u.username, status=u.status, last_login=u.last_login,
        student_id=u.student_id, employee_id=u.employee_id,
        roles=roles, permission_sets=perms,
        full_name=u.full_name, email=u.email, phone=u.phone,
        linked_type=u.linked_type,
        global_student_id=u.global_student_id,
        employee_code=u.employee_code,
        program=u.program_name, department=u.department_name,
    )


@router.put("/me", status_code=status.HTTP_204_NO_CONTENT, tags=["Profile"])
def update_me(
    req: UserUpdateRequest,
    user: CurrentUser = Depends(get_current_user),
    svc: M1Service = Depends(get_service)
):
    """Update own contact info (phone, email). Updates linked student or employee record."""
    u = svc.repo.get_user_by_id(user.user_id)
    if not u:
        raise APIError("NOT_FOUND", "User not found", 404)
    try:
        if u.student_id:
            svc.repo.update_student_contact(u.student_id, req.email, req.phone)
        elif u.employee_id:
            svc.repo.update_employee_contact(u.employee_id, req.email, req.phone)
    except Exception as e:
        if "Duplicate entry" in str(e):
            raise APIError("DUPLICATE_EMAIL", "Email already in use", status_code=status.HTTP_409_CONFLICT)
        raise APIError("BAD_REQUEST", str(e), status_code=status.HTTP_400_BAD_REQUEST)


@router.put("/me/change-password", status_code=status.HTTP_204_NO_CONTENT, tags=["Profile"])
def change_password(
    req: ChangePasswordRequest,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    svc: M1Service = Depends(get_service)
):
    """Change own password. Requires the current password."""
    u = svc.repo.get_user_by_username(svc.repo.get_user_by_id(user.user_id).username)
    if not verify_password(req.old_password, u.password_hash):
        raise APIError("UNAUTHORIZED", "Incorrect old password", status_code=status.HTTP_401_UNAUTHORIZED)
    new_hash = get_password_hash(req.new_password)
    svc.repo.update_password(user.user_id, new_hash)
    svc.repo.log_audit(user.user_id, "PASSWORD_CHANGED", "user_account", user.user_id, "Password changed by user", request.client.host)


# ─── User Management (C-06) ───────────────────────────────────────────────────

@router.get(
    "/users", response_model=PaginatedUsers, tags=["Users"],
    dependencies=[Depends(require_role(["ADMIN", "SUPERADMIN"]))]
)
def get_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by name, email, or username"),
    role: Optional[str] = Query(None, description="Filter by role name"),
    status: Optional[str] = Query(None, pattern="^(ACTIVE|INACTIVE|LOCKED)$"),
    svc: M1Service = Depends(get_service)
):
    """Paginated user list with optional search and filters (C-06)."""
    rows, total = svc.repo.get_users((page - 1) * page_size, page_size, search, role, status)
    items = []
    for r in rows:
        roles, perms = svc.repo.get_user_roles_and_perms(r.id)
        items.append(UserResponse(
            id=r.id, username=r.username, status=r.status, last_login=r.last_login,
            student_id=r.student_id, employee_id=r.employee_id,
            roles=roles, permission_sets=perms,
            full_name=r.full_name, email=r.email, linked_type=r.linked_type,
        ))
    return PaginatedUsers(items=items, total=total, page=page, page_size=page_size)


@router.post("/users", response_model=UserDetailResponse, tags=["Users"],
             dependencies=[Depends(require_role(["ADMIN", "SUPERADMIN"]))])
def create_user(req: UserCreateRequest, svc: M1Service = Depends(get_service)):
    """Create a user account linked to a student or employee record (C-06)."""
    try:
        uid = svc.repo.create_user(req.username, get_password_hash(req.password), req.student_id, req.employee_id)
        for role in req.roles:
            svc.repo.assign_user_role(uid, role)
        for perm in req.permission_sets:
            svc.repo.assign_user_permission(uid, perm)
        u = svc.repo.get_user_detail(uid)
        roles, perms = svc.repo.get_user_roles_and_perms(uid)
        return UserDetailResponse(
            id=u.id, username=u.username, status=u.status, last_login=u.last_login,
            student_id=u.student_id, employee_id=u.employee_id,
            roles=roles, permission_sets=perms,
            full_name=u.full_name, email=u.email, phone=u.phone,
            linked_type=u.linked_type, global_student_id=u.global_student_id,
            employee_code=u.employee_code, program=u.program_name, department=u.department_name,
        )
    except APIError:
        raise
    except Exception as e:
        if "Duplicate entry" in str(e) or "UK_user_account_username" in str(e):
            raise APIError("DUPLICATE_USERNAME", f"Username '{req.username}' already exists", status_code=status.HTTP_409_CONFLICT)
        raise APIError("BAD_REQUEST", str(e), status_code=status.HTTP_400_BAD_REQUEST)


@router.get("/users/{id}", response_model=UserDetailResponse, tags=["Users"])
def get_user(
    id: int,
    user: CurrentUser = Depends(get_current_user),
    svc: M1Service = Depends(get_service)
):
    """Get user detail. Users may only access their own record; admins see all."""
    require_ownership_or_role(id, ["ADMIN", "SUPERADMIN"], user)
    u = svc.repo.get_user_detail(id)
    if not u:
        raise APIError("NOT_FOUND", "User not found", 404)
    roles, perms = svc.repo.get_user_roles_and_perms(id)
    return UserDetailResponse(
        id=u.id, username=u.username, status=u.status, last_login=u.last_login,
        student_id=u.student_id, employee_id=u.employee_id,
        roles=roles, permission_sets=perms,
        full_name=u.full_name, email=u.email, phone=u.phone,
        linked_type=u.linked_type, global_student_id=u.global_student_id,
        employee_code=u.employee_code, program=u.program_name, department=u.department_name,
    )


@router.patch(
    "/users/{id}/status", status_code=status.HTTP_204_NO_CONTENT, tags=["Users"],
    dependencies=[Depends(require_role(["ADMIN", "SUPERADMIN"]))]
)
def update_user_status(
    id: int, req: UserStatusUpdate,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    svc: M1Service = Depends(get_service)
):
    """Activate, deactivate, or unlock a user account (C-06)."""
    svc.repo.update_user_status(id, req.status)
    svc.repo.log_audit(user.user_id, f"USER_STATUS_{req.status}", "user_account", id,
                       f"Status changed to {req.status}", request.client.host)


@router.post(
    "/users/{id}/reset-password", status_code=status.HTTP_204_NO_CONTENT, tags=["Users"],
    dependencies=[Depends(require_role(["ADMIN", "SUPERADMIN"]))]
)
def reset_password(
    id: int, req: ResetPasswordRequest,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    svc: M1Service = Depends(get_service)
):
    """Admin resets another user's password (C-06)."""
    new_hash = get_password_hash(req.new_password)
    svc.repo.update_password(id, new_hash)
    svc.repo.log_audit(user.user_id, "PASSWORD_RESET", "user_account", id, "Password reset by admin", request.client.host)


# ─── Roles & Permissions (C-07) ───────────────────────────────────────────────

@router.get(
    "/roles", response_model=List[RoleResponse], tags=["Roles"],
    dependencies=[Depends(require_role(["ADMIN", "SUPERADMIN"]))]
)
def get_roles(svc: M1Service = Depends(get_service)):
    """List all RBAC roles with user counts (C-07)."""
    return svc.repo.get_roles()


@router.get(
    "/permissions", response_model=List[PermissionSetResponse], tags=["Roles"],
    dependencies=[Depends(require_role(["ADMIN", "SUPERADMIN"]))]
)
def get_permissions(svc: M1Service = Depends(get_service)):
    """List all admin permission sets with assignment counts (C-07)."""
    rows = svc.repo.get_permissions()
    return [PermissionSetResponse(id=r.id, name=r.name, user_count=r.user_count) for r in rows]


@router.put(
    "/users/{id}/roles", status_code=status.HTTP_204_NO_CONTENT, tags=["Roles"],
    dependencies=[Depends(require_role(["SUPERADMIN"]))]
)
def update_user_roles(
    id: int, req: UserRoleUpdate,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    svc: M1Service = Depends(get_service)
):
    """Replace all roles for a user (SUPERADMIN only) (C-07)."""
    svc.repo.clear_user_roles(id)
    for role in req.roles:
        svc.repo.assign_user_role(id, role)
    svc.repo.log_audit(user.user_id, "ROLES_UPDATED", "user_role", id,
                       f"Roles updated to {req.roles}", request.client.host)


@router.put(
    "/users/{id}/permissions", status_code=status.HTTP_204_NO_CONTENT, tags=["Roles"],
    dependencies=[Depends(require_role(["ADMIN", "SUPERADMIN"]))]
)
def update_user_permissions(
    id: int, req: UserPermissionUpdate,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    svc: M1Service = Depends(get_service)
):
    """Replace all admin permission sets for a user (C-07)."""
    svc.repo.clear_user_permissions(id)
    for perm in req.permission_sets:
        svc.repo.assign_user_permission(id, perm)
    svc.repo.log_audit(user.user_id, "PERMISSIONS_UPDATED", "admin_permission_set_assignment", id,
                       f"Permissions updated to {req.permission_sets}", request.client.host)


# ─── Departments (C-08) ───────────────────────────────────────────────────────

@router.get("/departments", response_model=PaginatedDepartments, tags=["Catalog"])
def get_departments(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    search: Optional[str] = Query(None),
    svc: M1Service = Depends(get_service)
):
    """List departments with pagination and optional name/code search (C-08)."""
    rows, total = svc.repo.get_departments((page - 1) * page_size, page_size, search)
    items = [
        DepartmentResponse(
            id=r.id, code=r.code, name=r.name, head=r.head,
            head_employee_id=r.head_employee_id,
            programs_count=r.programs_count, courses_count=r.courses_count,
            status=r.status
        )
        for r in rows
    ]
    return PaginatedDepartments(items=items, total=total, page=page, page_size=page_size)


@router.get("/departments/{id}", response_model=DepartmentResponse, tags=["Catalog"])
def get_department(id: int, svc: M1Service = Depends(get_service)):
    """Get a single department by ID with program/course counts (C-08)."""
    from sqlalchemy import text as _text
    row = svc.repo.db.execute(_text("""
        SELECT d.id, d.code, d.name, d.head_employee_id,
               CASE WHEN d.head_employee_id IS NOT NULL
                    THEN CONCAT(e.first_name, ' ', e.last_name)
                    ELSE 'Not assigned' END AS head,
               (SELECT COUNT(*) FROM program p WHERE p.department_id = d.id) AS programs_count,
               (SELECT COUNT(*) FROM course c WHERE c.department_id = d.id) AS courses_count,
               CASE WHEN (SELECT COUNT(*) FROM program p WHERE p.department_id = d.id) = 0
                     AND (SELECT COUNT(*) FROM course c WHERE c.department_id = d.id) = 0
                    THEN 'INACTIVE' ELSE 'ACTIVE' END AS status
        FROM department d
        LEFT JOIN employee e ON d.head_employee_id = e.id
        WHERE d.id = :id
    """), {"id": id}).fetchone()
    if not row:
        raise APIError("NOT_FOUND", "Department not found", 404)
    return DepartmentResponse(
        id=row.id, code=row.code, name=row.name, head=row.head,
        head_employee_id=row.head_employee_id,
        programs_count=row.programs_count, courses_count=row.courses_count,
        status=row.status
    )


@router.post(
    "/departments", response_model=DepartmentResponse, tags=["Catalog"],
    dependencies=[Depends(require_role(["ADMIN", "SUPERADMIN"]))]
)
def create_department(
    req: DepartmentCreateRequest,
    svc: M1Service = Depends(get_service),
    db: Session = Depends(get_db)
):
    """Create a department (C-08)."""
    code_clean = req.code.strip().upper()
    if len(code_clean) > 10:
        raise APIError("INVALID_CODE", "Department code must be at most 10 characters", status_code=status.HTTP_400_BAD_REQUEST)

    head_id = _resolve_employee(req.head, db) if req.head and req.head.strip() and req.head.strip().lower() not in ["none", "unassigned", "null", "undefined"] else None

    try:
        dept_id = svc.repo.create_department(code_clean, req.name.strip(), head_id)
        rows, _ = svc.repo.get_departments(0, 10000)
        for r in rows:
            if r.id == dept_id:
                return DepartmentResponse(id=r.id, code=r.code, name=r.name, head=r.head,
                                          head_employee_id=r.head_employee_id,
                                          programs_count=0, courses_count=0, status="INACTIVE")
    except APIError:
        raise
    except Exception as e:
        if "Duplicate entry" in str(e) or "UK_department_code" in str(e):
            raise APIError("DUPLICATE_CODE", f"Department code '{req.code}' already exists", status_code=status.HTTP_409_CONFLICT)
        raise APIError("BAD_REQUEST", str(e), status_code=status.HTTP_400_BAD_REQUEST)


@router.put(
    "/departments/{id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Catalog"],
    dependencies=[Depends(require_role(["ADMIN", "SUPERADMIN"]))]
)
def update_department(
    id: int, req: DepartmentUpdateRequest,
    svc: M1Service = Depends(get_service),
    db: Session = Depends(get_db)
):
    """Update department name or head (C-08)."""
    d = svc.repo.get_department_by_id(id)
    if not d:
        raise APIError("NOT_FOUND", "Department not found", 404)

    head_id = None
    clear_head = False
    if req.head is not None:
        if req.head.strip().lower() in ["none", "unassigned", "", "null"]:
            clear_head = True
        else:
            head_id = _resolve_employee(req.head, db)

    svc.repo.update_department(id, req.name, head_id, clear_head)


# ─── Programs (C-09) ──────────────────────────────────────────────────────────

@router.get("/programs", response_model=PaginatedPrograms, tags=["Catalog"])
def get_programs(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    search: Optional[str] = Query(None),
    department_id: Optional[int] = Query(None),
    svc: M1Service = Depends(get_service)
):
    """List programs with pagination, search, and department filter (C-09)."""
    rows, total = svc.repo.get_programs((page - 1) * page_size, page_size, search, department_id)
    items = [
        ProgramResponse(
            id=r.id, department_id=r.department_id, department_name=r.department_name,
            code=r.code, name=r.name, duration_years=r.duration_years,
            total_credits=r.total_credits, credits_required=r.credits_required,
            students_count=r.students_count
        )
        for r in rows
    ]
    return PaginatedPrograms(items=items, total=total, page=page, page_size=page_size)


@router.get("/programs/{id}", response_model=ProgramResponse, tags=["Catalog"])
def get_program(id: int, svc: M1Service = Depends(get_service)):
    """Get a single program (C-09)."""
    r = svc.repo.get_program_by_id(id)
    if not r:
        raise APIError("NOT_FOUND", "Program not found", 404)
    return ProgramResponse(
        id=r.id, department_id=r.department_id, department_name=r.department_name,
        code=r.code, name=r.name, duration_years=r.duration_years,
        total_credits=r.total_credits, credits_required=r.credits_required,
    )


@router.post(
    "/programs", response_model=ProgramResponse, tags=["Catalog"],
    dependencies=[Depends(require_role(["ADMIN", "SUPERADMIN"]))]
)
def create_program(req: ProgramCreateRequest, svc: M1Service = Depends(get_service)):
    """Create a degree program (C-09)."""
    try:
        code = "".join([c.upper() for c in req.name if c.isalnum() or c.isspace()]).replace(" ", "_")[:10]
        pid = svc.repo.create_program(code, req.name, req.department_id, req.duration_years, req.total_credits)
        r = svc.repo.get_program_by_id(pid)
        return ProgramResponse(
            id=r.id, department_id=r.department_id, department_name=r.department_name,
            code=r.code, name=r.name, duration_years=r.duration_years,
            total_credits=r.total_credits, credits_required=r.credits_required,
        )
    except APIError:
        raise
    except Exception as e:
        if "Duplicate entry" in str(e) or "UK_program_code" in str(e):
            raise APIError("DUPLICATE_CODE", "Program already exists", status_code=status.HTTP_409_CONFLICT)
        raise APIError("BAD_REQUEST", str(e), status_code=status.HTTP_400_BAD_REQUEST)


@router.put(
    "/programs/{id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Catalog"],
    dependencies=[Depends(require_role(["ADMIN", "SUPERADMIN"]))]
)
def update_program(id: int, req: ProgramUpdateRequest, svc: M1Service = Depends(get_service)):
    """Update a program (C-09)."""
    r = svc.repo.get_program_by_id(id)
    if not r:
        raise APIError("NOT_FOUND", "Program not found", 404)
    try:
        svc.repo.update_program(id, req.name, req.department_id, req.duration_years, req.total_credits)
    except Exception as e:
        raise APIError("BAD_REQUEST", str(e), status_code=status.HTTP_400_BAD_REQUEST)


# ─── Terms (C-10) ─────────────────────────────────────────────────────────────

@router.get("/terms", response_model=List[TermResponse], tags=["Catalog"])
def get_terms(svc: M1Service = Depends(get_service)):
    """List all academic terms ordered newest first (C-10)."""
    return [
        TermResponse(id=r.id, year=r.year, label=r.label,
                     start_date=r.start_date, end_date=r.end_date, is_current=bool(r.is_current))
        for r in svc.repo.get_terms()
    ]


@router.get("/terms/{id}", response_model=TermResponse, tags=["Catalog"])
def get_term(id: int, svc: M1Service = Depends(get_service)):
    """Get a single academic term (C-10)."""
    r = svc.repo.get_term_by_id(id)
    if not r:
        raise APIError("NOT_FOUND", "Term not found", 404)
    return TermResponse(id=r.id, year=r.year, label=r.label,
                        start_date=r.start_date, end_date=r.end_date, is_current=bool(r.is_current))


@router.post(
    "/terms", response_model=TermResponse, tags=["Catalog"],
    dependencies=[Depends(require_role(["ADMIN", "SUPERADMIN"]))]
)
def create_term(req: TermCreateRequest, svc: M1Service = Depends(get_service)):
    """Create an academic term. Only one term can be 'current' at a time (C-10)."""
    if req.end_date <= req.start_date:
        raise APIError("INVALID_DATES", "Term end date must be after start date", status_code=status.HTTP_400_BAD_REQUEST)
    try:
        tid = svc.repo.create_term(req.year, req.label, req.start_date, req.end_date, req.is_current)
        r = svc.repo.get_term_by_id(tid)
        return TermResponse(id=r.id, year=r.year, label=r.label,
                            start_date=r.start_date, end_date=r.end_date, is_current=bool(r.is_current))
    except APIError:
        raise
    except Exception as e:
        if "Duplicate entry" in str(e) or "UK_academic_term" in str(e):
            raise APIError("DUPLICATE_TERM", "Academic term already exists", status_code=status.HTTP_409_CONFLICT)
        raise APIError("BAD_REQUEST", str(e), status_code=status.HTTP_400_BAD_REQUEST)


@router.put(
    "/terms/{id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Catalog"],
    dependencies=[Depends(require_role(["ADMIN", "SUPERADMIN"]))]
)
def update_term(id: int, req: TermUpdateRequest, svc: M1Service = Depends(get_service)):
    """Update an academic term (dates, label, or set as current) (C-10)."""
    r = svc.repo.get_term_by_id(id)
    if not r:
        raise APIError("NOT_FOUND", "Term not found", 404)
    if req.start_date and req.end_date and req.end_date <= req.start_date:
        raise APIError("INVALID_DATES", "Term end date must be after start date", status_code=status.HTTP_400_BAD_REQUEST)
    try:
        svc.repo.update_term(id, req.year, req.label, req.start_date, req.end_date, req.is_current)
    except Exception as e:
        if "UK_academic_term_current" in str(e):
            raise APIError("DUPLICATE_CURRENT_TERM", "Another term is already marked as current", status_code=status.HTTP_409_CONFLICT)
        raise APIError("BAD_REQUEST", str(e), status_code=status.HTTP_400_BAD_REQUEST)


# ─── Students (C-11) ──────────────────────────────────────────────────────────

@router.get(
    "/students", response_model=PaginatedStudents, tags=["Students"],
    dependencies=[Depends(require_role(["ADMIN", "FACULTY", "HR"]))]
)
def get_students(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by name, email, or Student ID"),
    program_id: Optional[int] = Query(None),
    batch_year: Optional[int] = Query(None),
    status: Optional[str] = Query(None, pattern="^(ACTIVE|ALUMNI|DROPPED)$"),
    svc: M1Service = Depends(get_service)
):
    """Paginated student list with search and filters (C-11)."""
    rows, total = svc.repo.get_students((page - 1) * page_size, page_size, search, program_id, batch_year, status)
    items = [
        StudentResponse(
            id=r.id, global_student_id=r.global_student_id,
            first_name=r.first_name, last_name=r.last_name,
            email=r.email, phone=r.phone, batch_year=r.batch_year,
            program_id=r.program_id, program_name=r.program_name,
            department_name=r.department_name, status=r.status
        )
        for r in rows
    ]
    return PaginatedStudents(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/students/{id}", response_model=StudentDetailResponse, tags=["Students"]
)
def get_student(
    id: int,
    user: CurrentUser = Depends(get_current_user),
    svc: M1Service = Depends(get_service)
):
    """Get full student detail. Admins see all; students may only see own record (C-11)."""
    # Students can read their own record: check via linked student_id on user
    u = svc.repo.get_user_by_id(user.user_id)
    if u and u.student_id == id:
        pass  # owns this record
    else:
        require_ownership_or_role(user.user_id, ["ADMIN", "SUPERADMIN", "FACULTY"], user)
    r = svc.repo.get_student_by_id(id)
    if not r:
        raise APIError("NOT_FOUND", "Student not found", 404)
    return StudentDetailResponse(
        id=r.id, global_student_id=r.global_student_id,
        first_name=r.first_name, last_name=r.last_name,
        email=r.email, phone=r.phone, batch_year=r.batch_year,
        program_id=r.program_id, program_name=r.program_name,
        department_name=r.department_name, status=r.status,
        has_user_account=bool(r.has_user_account), user_id=r.user_id
    )


@router.post(
    "/students", response_model=StudentDetailResponse, tags=["Students"],
    dependencies=[Depends(require_role(["ADMIN"]))]
)
def create_student(req: StudentCreateRequest, svc: M1Service = Depends(get_service)):
    """Create a student record and generate a global Student_ID (C-11)."""
    gid = svc.repo.generate_student_id(req.batch_year)
    if not gid:
        raise APIError("ID_GENERATION_FAILED", "Failed to generate student ID", 500)
    try:
        sid = svc.repo.create_student(gid, req.model_dump())
        r = svc.repo.get_student_by_id(sid)
        return StudentDetailResponse(
            id=r.id, global_student_id=r.global_student_id,
            first_name=r.first_name, last_name=r.last_name,
            email=r.email, phone=r.phone, batch_year=r.batch_year,
            program_id=r.program_id, program_name=r.program_name,
            department_name=r.department_name, status=r.status,
            has_user_account=False, user_id=None
        )
    except APIError:
        raise
    except Exception as e:
        if "Duplicate entry" in str(e) or "UK_student_email" in str(e):
            raise APIError("DUPLICATE_EMAIL", f"Student with email '{req.email}' already exists", status_code=status.HTTP_409_CONFLICT)
        raise APIError("BAD_REQUEST", str(e), status_code=status.HTTP_400_BAD_REQUEST)


@router.put(
    "/students/{id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Students"],
    dependencies=[Depends(require_role(["ADMIN"]))]
)
def update_student(id: int, req: StudentUpdateRequest, svc: M1Service = Depends(get_service)):
    """Update a student record (C-11). Admin only."""
    r = svc.repo.get_student_by_id(id)
    if not r:
        raise APIError("NOT_FOUND", "Student not found", 404)
    try:
        svc.repo.update_student(id, req.model_dump(exclude_none=True))
    except Exception as e:
        if "Duplicate entry" in str(e) or "UK_student_email" in str(e):
            raise APIError("DUPLICATE_EMAIL", "Email already in use by another student", status_code=status.HTTP_409_CONFLICT)
        raise APIError("BAD_REQUEST", str(e), status_code=status.HTTP_400_BAD_REQUEST)


# ─── Internal helpers ─────────────────────────────────────────────────────────

def _resolve_employee(head_str: str, db) -> int:
    """Resolve a head-employee reference (ID string, employee_id code, or name) to an employee PK."""
    head_str = head_str.strip()
    # Try numeric PK
    if head_str.isdigit():
        eid = db.execute(text("SELECT id FROM employee WHERE id = :id"), {"id": int(head_str)}).scalar()
        if eid:
            return eid
    # Try employee_id code
    eid = db.execute(text("SELECT id FROM employee WHERE employee_id = :eid"), {"eid": head_str}).scalar()
    if eid:
        return eid
    # Try name match
    clean_name = head_str.replace("Dr. ", "").replace("Dr.", "").replace("Prof. ", "").replace("Prof.", "").strip()
    eid = db.execute(
        text("SELECT id FROM employee WHERE CONCAT(first_name, ' ', last_name) LIKE :name OR last_name LIKE :name LIMIT 1"),
        {"name": f"%{clean_name}%"}
    ).scalar()
    if eid:
        return eid
    raise APIError("EMPLOYEE_NOT_FOUND", f"Employee '{head_str}' not found. Select from directory or leave empty.", status_code=404)
