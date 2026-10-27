from sqlalchemy.orm import Session
from . import repository, schemas
from app.core.errors import APIError
from fastapi import status
from datetime import date

# --- User Account helper ---
def get_employee_id_for_user(db: Session, user_id: int) -> int:
    from sqlalchemy import text
    query = text("SELECT employee_id FROM user_account WHERE id = :u")
    res = db.execute(query, {"u": user_id}).scalar()
    if not res:
        raise APIError(code="UNAUTHORIZED", message="User has no linked employee profile", status_code=status.HTTP_401_UNAUTHORIZED)
    return res

# --- Employees ---
def create_employee(db: Session, data: schemas.EmployeeCreate) -> schemas.EmployeeResponse:
    emp_id = repository.create_employee(db, data)
    return get_employee(db, emp_id)

def get_employee(db: Session, emp_id: int) -> schemas.EmployeeResponse:
    emp = repository.get_employee(db, emp_id)
    if not emp:
        raise APIError(code="NOT_FOUND", message="Employee not found", status_code=status.HTTP_404_NOT_FOUND)
    return schemas.EmployeeResponse(**emp)

def get_employees(db: Session, skip: int = 0, limit: int = 100, dept_id: int = None):
    res = repository.get_employees(db, skip, limit, dept_id)
    return [schemas.EmployeeResponse(**r) for r in res]

def update_employee(db: Session, emp_id: int, data: schemas.EmployeeUpdate):
    get_employee(db, emp_id) # ensure exists
    repository.update_employee(db, emp_id, data)
    return get_employee(db, emp_id)

# --- Designations ---
def create_designation(db: Session, data: schemas.DesignationCreate):
    d_id = repository.create_designation(db, data)
    return get_designation(db, d_id)

def get_designation(db: Session, d_id: int):
    d = repository.get_designation(db, d_id)
    if not d:
        raise APIError(code="NOT_FOUND", message="Designation not found", status_code=status.HTTP_404_NOT_FOUND)
    return schemas.DesignationResponse(**d)

def get_designations(db: Session):
    res = repository.get_designations(db)
    return [schemas.DesignationResponse(**r) for r in res]

def update_designation(db: Session, d_id: int, data: schemas.DesignationUpdate):
    get_designation(db, d_id)
    repository.update_designation(db, d_id, data)
    return get_designation(db, d_id)

# --- Leave Types ---
def create_leave_type(db: Session, data: schemas.LeaveTypeCreate):
    l_id = repository.create_leave_type(db, data)
    # create doesn't return dict directly in repo, fetch it
    res = repository.get_leave_types(db)
    for r in res:
        if r["id"] == l_id:
            return schemas.LeaveTypeResponse(**r)
    return None

def get_leave_types(db: Session):
    return [schemas.LeaveTypeResponse(**r) for r in repository.get_leave_types(db)]

def update_leave_type(db: Session, lt_id: int, data: schemas.LeaveTypeUpdate):
    repository.update_leave_type(db, lt_id, data)
    # fetch manually
    res = repository.get_leave_types(db)
    for r in res:
        if r["id"] == lt_id:
            return schemas.LeaveTypeResponse(**r)
    return None

# --- Leave Entitlements ---
def create_leave_entitlement(db: Session, data: schemas.LeaveEntitlementCreate):
    le_id = repository.create_leave_entitlement(db, data)
    res = repository.get_leave_entitlements(db)
    for r in res:
        if r["id"] == le_id:
            return schemas.LeaveEntitlementResponse(**r)

def get_leave_entitlements(db: Session):
    return [schemas.LeaveEntitlementResponse(**r) for r in repository.get_leave_entitlements(db)]

# --- Leave Applications ---
def apply_leave(db: Session, emp_id: int, data: schemas.LeaveApplicationCreate):
    # Verify employee exists
    get_employee(db, emp_id)

    # 1. Overlap Check (PRD §9.3 & Error Code 55002)
    if repository.check_leave_overlap(db, emp_id, data.start_date, data.end_date):
        raise APIError(
            code="OVERLAPPING_LEAVE",
            message="The requested leave dates overlap with an existing approved or pending leave.",
            status_code=status.HTTP_409_CONFLICT
        )

    # 2. Balance Check (PRD §9.3 & Error Code 55001)
    year = data.start_date.year
    bal = repository.get_leave_balance(db, emp_id, data.leave_type_id, year)
    if data.days > bal:
        raise APIError(
            code="LEAVE_EXCEEDS_BALANCE",
            message=f"Insufficient leave balance. Requested {data.days} days, available {bal} days.",
            status_code=status.HTTP_400_BAD_REQUEST
        )

    leave_id = repository.create_leave_application(db, emp_id, data)
    return get_leave_application(db, leave_id)

def get_leave_application(db: Session, leave_id: int):
    r = repository.get_leave_application(db, leave_id)
    if not r:
        raise APIError(code="NOT_FOUND", message="Leave application not found", status_code=status.HTTP_404_NOT_FOUND)
    return schemas.LeaveApplicationResponse(**r)

def get_leaves_for_employee(db: Session, emp_id: int):
    res = repository.get_leave_applications(db, emp_id=emp_id)
    return [schemas.LeaveApplicationResponse(**r) for r in res]

def get_all_leaves(db: Session, status_filter: str = None):
    res = repository.get_leave_applications(db, status=status_filter)
    return [schemas.LeaveApplicationResponse(**r) for r in res]

def update_leave_decision(db: Session, leave_id: int, decision: schemas.LeaveDecision, admin_id: int):
    # check exists
    get_leave_application(db, leave_id)
    repository.update_leave_decision(db, leave_id, decision.status.value, admin_id)
    return get_leave_application(db, leave_id)

def get_leave_balance_all_types(db: Session, emp_id: int, year: int):
    # fetch all leave types, then fn_leave_balance for each
    lts = repository.get_leave_types(db)
    ents = repository.get_leave_entitlements(db)
    emp = get_employee(db, emp_id)
    
    balances = []
    for lt in lts:
        bal = repository.get_leave_balance(db, emp_id, lt["id"], year)
        # Find entitled
        entitled = 0
        for e in ents:
            if e["leave_type_id"] == lt["id"] and e["emp_type"] == emp.emp_type.value:
                entitled = e["annual_quota"]
        balances.append(schemas.LeaveBalanceResponse(
            leave_type_id=lt["id"],
            leave_type_name=lt["name"],
            entitled=entitled,
            balance=bal
        ))
    return balances

# --- Salary Structures ---
def create_salary_structure(db: Session, data: schemas.SalaryStructureCreate):
    s_id = repository.create_salary_structure(db, data)
    res = repository.get_salary_structures(db)
    for r in res:
        if r["id"] == s_id:
            return schemas.SalaryStructureResponse(**r)

def get_salary_structures(db: Session):
    return [schemas.SalaryStructureResponse(**r) for r in repository.get_salary_structures(db)]

def update_salary_structure(db: Session, ss_id: int, data: schemas.SalaryStructureUpdate):
    repository.update_salary_structure(db, ss_id, data)
    res = repository.get_salary_structures(db)
    for r in res:
        if r["id"] == ss_id:
            return schemas.SalaryStructureResponse(**r)
    raise APIError(code="NOT_FOUND", message="Salary structure not found", status_code=status.HTTP_404_NOT_FOUND)

# --- Payroll ---
def run_payroll_draft(db: Session, data: schemas.PayrollRunRequest, admin_id: int):
    repository.run_payroll(db, data.payroll_month, 'DRAFT', admin_id)
    return get_payroll(db, data.payroll_month)

def finalize_payroll(db: Session, month: str, admin_id: int):
    repository.run_payroll(db, month, 'FINALIZE', admin_id)
    return get_payroll(db, month)

def get_payroll(db: Session, month: str):
    pr = repository.get_payroll_run(db, month)
    if not pr:
        raise APIError(code="NOT_FOUND", message="Payroll run not found for this month", status_code=status.HTTP_404_NOT_FOUND)
    return schemas.PayrollRunResponse(**pr)

def get_my_payslips(db: Session, emp_id: int):
    res = repository.get_payslips_for_employee(db, emp_id)
    return [schemas.PayslipResponse(**r) for r in res]

def get_payroll_register(db: Session, month: str = None, dept_id: int = None):
    return repository.get_payroll_register(db, month=month, dept_id=dept_id)

