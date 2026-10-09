from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user, CurrentUser, require_role, require_permission
from . import schemas, service

m5_router = APIRouter(prefix="/api/v1", tags=["HR and Leave"])

# --- HR Setup (Admin) ---
@m5_router.post("/employees", response_model=schemas.EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(data: schemas.EmployeeCreate, db: Session = Depends(get_db), _=Depends(require_permission(["HR_Admin"]))):
    return service.create_employee(db, data)

@m5_router.get("/employees", response_model=List[schemas.EmployeeResponse])
def get_employees(skip: int = 0, limit: int = 100, dept_id: int = None, db: Session = Depends(get_db), _=Depends(require_role(["Admin", "Faculty", "Student", "SuperAdmin"]))):
    return service.get_employees(db, skip, limit, dept_id)

@m5_router.get("/employees/{id}", response_model=schemas.EmployeeResponse)
def get_employee(id: int, db: Session = Depends(get_db), _=Depends(require_role(["Admin", "Faculty", "Student", "SuperAdmin"]))):
    return service.get_employee(db, id)

@m5_router.put("/employees/{id}", response_model=schemas.EmployeeResponse)
def update_employee(id: int, data: schemas.EmployeeUpdate, db: Session = Depends(get_db), _=Depends(require_permission(["HR_Admin"]))):
    return service.update_employee(db, id, data)

@m5_router.post("/designations", response_model=schemas.DesignationResponse, status_code=status.HTTP_201_CREATED)
def create_designation(data: schemas.DesignationCreate, db: Session = Depends(get_db), _=Depends(require_permission(["HR_Admin"]))):
    return service.create_designation(db, data)

@m5_router.get("/designations", response_model=List[schemas.DesignationResponse])
def get_designations(db: Session = Depends(get_db), _=Depends(require_permission(["HR_Admin"]))):
    return service.get_designations(db)

@m5_router.put("/designations/{id}", response_model=schemas.DesignationResponse)
def update_designation(id: int, data: schemas.DesignationUpdate, db: Session = Depends(get_db), _=Depends(require_permission(["HR_Admin"]))):
    return service.update_designation(db, id, data)

@m5_router.post("/leave-types", response_model=schemas.LeaveTypeResponse, status_code=status.HTTP_201_CREATED)
def create_leave_type(data: schemas.LeaveTypeCreate, db: Session = Depends(get_db), _=Depends(require_permission(["HR_Admin"]))):
    return service.create_leave_type(db, data)

@m5_router.get("/leave-types", response_model=List[schemas.LeaveTypeResponse])
def get_leave_types(db: Session = Depends(get_db), _=Depends(require_permission(["HR_Admin"]))):
    return service.get_leave_types(db)

@m5_router.put("/leave-types/{id}", response_model=schemas.LeaveTypeResponse)
def update_leave_type(id: int, data: schemas.LeaveTypeUpdate, db: Session = Depends(get_db), _=Depends(require_permission(["HR_Admin"]))):
    return service.update_leave_type(db, id, data)

@m5_router.post("/leave-entitlements", response_model=schemas.LeaveEntitlementResponse, status_code=status.HTTP_201_CREATED)
def create_leave_entitlement(data: schemas.LeaveEntitlementCreate, db: Session = Depends(get_db), _=Depends(require_permission(["HR_Admin"]))):
    return service.create_leave_entitlement(db, data)

@m5_router.get("/leave-entitlements", response_model=List[schemas.LeaveEntitlementResponse])
def get_leave_entitlements(db: Session = Depends(get_db), _=Depends(require_permission(["HR_Admin"]))):
    return service.get_leave_entitlements(db)

@m5_router.post("/salary-structures", response_model=schemas.SalaryStructureResponse, status_code=status.HTTP_201_CREATED)
def create_salary_structure(data: schemas.SalaryStructureCreate, db: Session = Depends(get_db), _=Depends(require_permission(["HR_Admin"]))):
    return service.create_salary_structure(db, data)

@m5_router.get("/salary-structures", response_model=List[schemas.SalaryStructureResponse])
def get_salary_structures(db: Session = Depends(get_db), _=Depends(require_permission(["HR_Admin"]))):
    return service.get_salary_structures(db)

@m5_router.put("/salary-structures/{id}", response_model=schemas.SalaryStructureResponse)
def update_salary_structure(id: int, data: schemas.SalaryStructureUpdate, db: Session = Depends(get_db), _=Depends(require_permission(["HR_Admin"]))):
    return service.update_salary_structure(db, id, data)

# --- Leave Applications (Faculty & Admin) ---
@m5_router.post("/leaves", response_model=schemas.LeaveApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_leave(data: schemas.LeaveApplicationCreate, db: Session = Depends(get_db), user: CurrentUser = Depends(require_role(["Faculty"]))):
    emp_id = service.get_employee_id_for_user(db, user.user_id)
    return service.apply_leave(db, emp_id, data)

@m5_router.get("/leaves/me", response_model=List[schemas.LeaveApplicationResponse])
def get_my_leaves(db: Session = Depends(get_db), user: CurrentUser = Depends(require_role(["Faculty"]))):
    emp_id = service.get_employee_id_for_user(db, user.user_id)
    return service.get_leaves_for_employee(db, emp_id)

@m5_router.get("/leaves/me/balance", response_model=List[schemas.LeaveBalanceResponse])
def get_my_leave_balance(year: int, db: Session = Depends(get_db), user: CurrentUser = Depends(require_role(["Faculty"]))):
    emp_id = service.get_employee_id_for_user(db, user.user_id)
    return service.get_leave_balance_all_types(db, emp_id, year)

@m5_router.get("/leaves", response_model=List[schemas.LeaveApplicationResponse])
def get_all_leaves(status: str = None, db: Session = Depends(get_db), _=Depends(require_permission(["HR_Admin"]))):
    return service.get_all_leaves(db, status_filter=status)

@m5_router.patch("/leaves/{id}/decision", response_model=schemas.LeaveApplicationResponse)
def decide_leave(id: int, data: schemas.LeaveDecision, db: Session = Depends(get_db), user: CurrentUser = Depends(require_permission(["HR_Admin"]))):
    return service.update_leave_decision(db, id, data, user.user_id)

# --- Payroll (Admin) ---
@m5_router.post("/payroll/run", response_model=schemas.PayrollRunResponse)
def run_payroll_draft(data: schemas.PayrollRunRequest, db: Session = Depends(get_db), user: CurrentUser = Depends(require_permission(["HR_Admin"]))):
    return service.run_payroll_draft(db, data, user.user_id)

@m5_router.post("/payroll/{month}/finalize", response_model=schemas.PayrollRunResponse)
def finalize_payroll(month: str, db: Session = Depends(get_db), user: CurrentUser = Depends(require_permission(["HR_Admin"]))):
    return service.finalize_payroll(db, month, user.user_id)

@m5_router.get("/payroll/{month}", response_model=schemas.PayrollRunResponse)
def get_payroll_run(month: str, db: Session = Depends(get_db), _=Depends(require_permission(["HR_Admin"]))):
    return service.get_payroll(db, month)

# --- Payslips (Faculty) ---
@m5_router.get("/me/payslips", response_model=List[schemas.PayslipResponse])
def get_my_payslips(db: Session = Depends(get_db), user: CurrentUser = Depends(require_role(["Faculty"]))):
    emp_id = service.get_employee_id_for_user(db, user.user_id)
    return service.get_my_payslips(db, emp_id)
