from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from enum import Enum

class EmpType(str, Enum):
    FACULTY = 'FACULTY'
    STAFF = 'STAFF'

class Status(str, Enum):
    ACTIVE = 'ACTIVE'
    INACTIVE = 'INACTIVE'

class LeaveStatus(str, Enum):
    PENDING = 'PENDING'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'

class PayrollStatus(str, Enum):
    DRAFT = 'DRAFT'
    FINALIZED = 'FINALIZED'

class ComponentType(str, Enum):
    EARNING = 'EARNING'
    DEDUCTION = 'DEDUCTION'

# --- Employees ---
class EmployeeBase(BaseModel):
    first_name: str = Field(..., max_length=50)
    last_name: str = Field(..., max_length=50)
    department_id: int
    designation_id: int
    joining_date: date
    emp_type: EmpType
    status: Status = Status.ACTIVE

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    department_id: Optional[int] = None
    designation_id: Optional[int] = None
    emp_type: Optional[EmpType] = None
    status: Optional[Status] = None

class EmployeeResponse(EmployeeBase):
    id: int
    employee_id: str

    model_config = {"from_attributes": True}

# --- Designations ---
class DesignationBase(BaseModel):
    title: str = Field(..., max_length=100)
    job_level: int = Field(..., gt=0)

class DesignationCreate(DesignationBase):
    pass

class DesignationUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=100)
    job_level: Optional[int] = Field(None, gt=0)

class DesignationResponse(DesignationBase):
    id: int

    model_config = {"from_attributes": True}

# --- Leave Types ---
class LeaveTypeBase(BaseModel):
    name: str = Field(..., max_length=50)
    is_paid: bool = True

class LeaveTypeCreate(LeaveTypeBase):
    pass

class LeaveTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=50)
    is_paid: Optional[bool] = None

class LeaveTypeResponse(LeaveTypeBase):
    id: int

    model_config = {"from_attributes": True}

# --- Leave Entitlements ---
class LeaveEntitlementBase(BaseModel):
    leave_type_id: int
    emp_type: EmpType
    annual_quota: int = Field(..., ge=0)
    carry_forward: bool = False

class LeaveEntitlementCreate(LeaveEntitlementBase):
    pass

class LeaveEntitlementUpdate(BaseModel):
    annual_quota: Optional[int] = Field(None, ge=0)
    carry_forward: Optional[bool] = None

class LeaveEntitlementResponse(LeaveEntitlementBase):
    id: int

    model_config = {"from_attributes": True}

# --- Leave Applications ---
class LeaveApplicationBase(BaseModel):
    leave_type_id: int
    start_date: date
    end_date: date
    days: float = Field(..., gt=0)
    reason: Optional[str] = None

class LeaveApplicationCreate(LeaveApplicationBase):
    pass

class LeaveDecision(BaseModel):
    status: LeaveStatus

class LeaveApplicationResponse(LeaveApplicationBase):
    id: int
    employee_id: int
    status: LeaveStatus
    decision_by: Optional[int] = None
    decision_date: Optional[datetime] = None

    model_config = {"from_attributes": True}

class LeaveBalanceResponse(BaseModel):
    leave_type_id: int
    leave_type_name: str
    entitled: int
    balance: float

# --- Salary Structures ---
class SalaryStructureBase(BaseModel):
    designation_id: int
    basic_pay: float = Field(..., ge=0)
    allowances: float = Field(default=0, ge=0)
    standard_deductions: float = Field(default=0, ge=0)

class SalaryStructureCreate(SalaryStructureBase):
    pass

class SalaryStructureUpdate(BaseModel):
    basic_pay: Optional[float] = Field(None, ge=0)
    allowances: Optional[float] = Field(None, ge=0)
    standard_deductions: Optional[float] = Field(None, ge=0)

class SalaryStructureResponse(SalaryStructureBase):
    id: int

    model_config = {"from_attributes": True}

# --- Payroll ---
class PayrollRunRequest(BaseModel):
    payroll_month: str = Field(..., pattern=r'^[0-9]{4}-(0[1-9]|1[0-2])$')

class PayslipLineResponse(BaseModel):
    id: int
    payslip_id: int
    component_type: ComponentType
    description: str
    amount: float

    model_config = {"from_attributes": True}

class PayslipResponse(BaseModel):
    id: int
    run_id: int
    employee_id: int
    gross_pay: float
    total_deductions: float
    net_pay: float
    leave_days_deducted: float
    lines: List[PayslipLineResponse] = []

    model_config = {"from_attributes": True}

class PayrollRunResponse(BaseModel):
    id: int
    payroll_month: str
    run_date: datetime
    status: PayrollStatus
    run_by: int
    payslips: List[PayslipResponse] = []

    model_config = {"from_attributes": True}

class PayrollRegisterRecord(BaseModel):
    payroll_month: str
    run_status: str
    department_name: str
    employee_id: int
    global_employee_id: str
    employee_name: str
    designation: str
    gross_pay: float
    total_deductions: float
    net_pay: float
    leave_days_deducted: float

    model_config = {"from_attributes": True}

