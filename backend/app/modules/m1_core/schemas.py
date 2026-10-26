from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, datetime

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

class UserStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(ACTIVE|DEACTIVATED|REVOKED)$")

class UserRoleUpdate(BaseModel):
    roles: List[str]

class UserResponse(BaseModel):
    id: int
    username: str
    status: str
    student_id: Optional[int] = None
    employee_id: Optional[int] = None
    roles: List[str]

class UserCreateRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=8)
    roles: List[str]
    student_id: Optional[int] = None
    employee_id: Optional[int] = None

class RoleResponse(BaseModel):
    id: int
    role_name: str
    description: Optional[str] = None
    permission_sets: List[str]

class DepartmentCreateRequest(BaseModel):
    code: str
    name: str
    head: Optional[str] = None

class DepartmentResponse(BaseModel):
    id: int
    code: str
    name: str
    head: Optional[str] = None
    programs_count: Optional[int] = 0
    courses_count: Optional[int] = 0
    status: Optional[str] = "ACTIVE"

class ProgramCreateRequest(BaseModel):
    name: str
    department_id: int
    duration_years: int
    total_credits: int

class ProgramResponse(BaseModel):
    id: int
    department_id: int
    code: str
    name: str
    duration_years: int
    total_credits: int
    credits_required: Optional[int] = None
    status: Optional[str] = "ACTIVE"
    students_count: Optional[int] = 0


class TermCreateRequest(BaseModel):
    year: int
    label: str = Field(..., pattern="^(FALL|SPRING|SUMMER|WINTER)$")
    start_date: date
    end_date: date
    is_current: bool = False

class TermResponse(BaseModel):
    id: int
    year: int
    label: str
    start_date: date
    end_date: date
    is_current: bool

class StudentCreateRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    batch_year: int = Field(..., ge=2000, le=2100)
    program_id: int

class StudentResponse(BaseModel):
    id: int
    global_student_id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    batch_year: int
    program_id: int
    status: str

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
