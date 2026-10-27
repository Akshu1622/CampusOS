from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, datetime


# ─── Auth ────────────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)

class ResetPasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=8)


# ─── Users ───────────────────────────────────────────────────────────────────

class UserStatusUpdate(BaseModel):
    """ACTIVE | INACTIVE | LOCKED — matches user_account.status ENUM."""
    status: str = Field(..., pattern="^(ACTIVE|INACTIVE|LOCKED)$")

class UserRoleUpdate(BaseModel):
    roles: List[str]

class UserPermissionUpdate(BaseModel):
    permission_sets: List[str]

class UserCreateRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=8)
    roles: List[str]
    permission_sets: List[str] = []
    student_id: Optional[int] = None
    employee_id: Optional[int] = None

class UserUpdateRequest(BaseModel):
    """Update own (or admin-on-behalf) mutable contact fields."""
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    status: str
    last_login: Optional[datetime] = None
    student_id: Optional[int] = None
    employee_id: Optional[int] = None
    roles: List[str]
    permission_sets: List[str] = []
    # linked person summary
    full_name: Optional[str] = None
    email: Optional[str] = None
    linked_type: Optional[str] = None  # 'student' | 'employee'

class UserDetailResponse(UserResponse):
    """Extended response used for /users/{id} and /me."""
    phone: Optional[str] = None
    department: Optional[str] = None
    program: Optional[str] = None
    global_student_id: Optional[str] = None
    employee_code: Optional[str] = None


# ─── Roles & Permissions ─────────────────────────────────────────────────────

class PermissionSetResponse(BaseModel):
    id: int
    name: str
    user_count: Optional[int] = 0

class RoleResponse(BaseModel):
    id: int
    role_name: str
    description: Optional[str] = None
    permission_sets: List[str]
    user_count: Optional[int] = 0


# ─── Departments ──────────────────────────────────────────────────────────────

class DepartmentCreateRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=10)
    name: str = Field(..., min_length=1, max_length=100)
    head: Optional[str] = None

class DepartmentUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    head: Optional[str] = None

class DepartmentResponse(BaseModel):
    id: int
    code: str
    name: str
    head: Optional[str] = None
    head_employee_id: Optional[int] = None
    programs_count: Optional[int] = 0
    courses_count: Optional[int] = 0
    status: Optional[str] = "ACTIVE"

class PaginatedDepartments(BaseModel):
    items: List[DepartmentResponse]
    total: int
    page: int
    page_size: int


# ─── Programs ─────────────────────────────────────────────────────────────────

class ProgramCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    department_id: int
    duration_years: int = Field(..., ge=1, le=10)
    total_credits: int = Field(..., ge=1)

class ProgramUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    department_id: Optional[int] = None
    duration_years: Optional[int] = Field(None, ge=1, le=10)
    total_credits: Optional[int] = Field(None, ge=1)

class ProgramResponse(BaseModel):
    id: int
    department_id: int
    department_name: Optional[str] = None
    code: str
    name: str
    duration_years: int
    total_credits: int
    credits_required: Optional[int] = None
    status: Optional[str] = "ACTIVE"
    students_count: Optional[int] = 0

class PaginatedPrograms(BaseModel):
    items: List[ProgramResponse]
    total: int
    page: int
    page_size: int


# ─── Terms ────────────────────────────────────────────────────────────────────

class TermCreateRequest(BaseModel):
    year: int = Field(..., ge=2000, le=2100)
    label: str = Field(..., pattern="^(FALL|SPRING|SUMMER|WINTER)$")
    start_date: date
    end_date: date
    is_current: bool = False

class TermUpdateRequest(BaseModel):
    year: Optional[int] = Field(None, ge=2000, le=2100)
    label: Optional[str] = Field(None, pattern="^(FALL|SPRING|SUMMER|WINTER)$")
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None

class TermResponse(BaseModel):
    id: int
    year: int
    label: str
    start_date: date
    end_date: date
    is_current: bool


# ─── Students ─────────────────────────────────────────────────────────────────

class StudentCreateRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    batch_year: int = Field(..., ge=2000, le=2100)
    program_id: int
    caste_category: Optional[str] = Field("GENERAL", pattern="^(GENERAL|OBC|SC|ST|EWS)$")

class StudentUpdateRequest(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    batch_year: Optional[int] = Field(None, ge=2000, le=2100)
    program_id: Optional[int] = None
    caste_category: Optional[str] = Field(None, pattern="^(GENERAL|OBC|SC|ST|EWS)$")
    status: Optional[str] = Field(None, pattern="^(ACTIVE|ALUMNI|DROPPED)$")

class StudentResponse(BaseModel):
    id: int
    global_student_id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    batch_year: int
    program_id: int
    program_name: Optional[str] = None
    department_name: Optional[str] = None
    caste_category: Optional[str] = "GENERAL"
    status: str

class StudentDetailResponse(StudentResponse):
    """Extended response for /students/{id} detail page."""
    has_user_account: Optional[bool] = None
    user_id: Optional[int] = None

class PaginatedUsers(BaseModel):
    items: List[UserResponse]
    total: int
    page: int
    page_size: int

class PaginatedStudents(BaseModel):
    items: List[StudentResponse]
    total: int
    page: int
    page_size: int
