from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from datetime import date
from . import schemas
from app.db.helpers import handle_db_error, call_procedure, call_function

# --- Employees ---
def create_employee(db: Session, data: schemas.EmployeeCreate) -> int:
    try:
        # Generate employee_id via DB function
        emp_id_str = call_function(db, 'fn_generate_employee_id', [str(data.joining_date.year)])
        
        query = text("""
            INSERT INTO employee (employee_id, first_name, last_name, department_id, designation_id, joining_date, emp_type, status)
            VALUES (:eid, :fname, :lname, :dept, :desig, :jdate, :type, :status)
        """)
        res = db.execute(query, {
            "eid": emp_id_str,
            "fname": data.first_name,
            "lname": data.last_name,
            "dept": data.department_id,
            "desig": data.designation_id,
            "jdate": data.joining_date,
            "type": data.emp_type.value,
            "status": data.status.value
        })
        db.commit()
        return res.lastrowid
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def get_employee(db: Session, emp_id: int) -> Optional[dict]:
    try:
        query = text("SELECT * FROM employee WHERE id = :id")
        res = db.execute(query, {"id": emp_id}).mappings().first()
        return dict(res) if res else None
    except Exception as e:
        handle_db_error(e)

def get_employees(db: Session, skip: int = 0, limit: int = 100, dept_id: int = None) -> List[dict]:
    try:
        if dept_id:
            query = text("SELECT * FROM employee WHERE department_id = :d LIMIT :l OFFSET :s")
            res = db.execute(query, {"d": dept_id, "l": limit, "s": skip}).mappings().all()
        else:
            query = text("SELECT * FROM employee LIMIT :l OFFSET :s")
            res = db.execute(query, {"l": limit, "s": skip}).mappings().all()
        return [dict(r) for r in res]
    except Exception as e:
        handle_db_error(e)

def update_employee(db: Session, emp_id: int, data: schemas.EmployeeUpdate):
    try:
        updates = []
        params = {"id": emp_id}
        for k, v in data.model_dump(exclude_unset=True).items():
            if isinstance(v, (schemas.EmpType, schemas.Status)):
                v = v.value
            updates.append(f"{k} = :{k}")
            params[k] = v
            
        if updates:
            query = text(f"UPDATE employee SET {', '.join(updates)} WHERE id = :id")
            db.execute(query, params)
            db.commit()
    except Exception as e:
        db.rollback()
        handle_db_error(e)

# --- Designations ---
def create_designation(db: Session, data: schemas.DesignationCreate) -> int:
    try:
        query = text("INSERT INTO designation (title, job_level) VALUES (:t, :jl)")
        res = db.execute(query, {"t": data.title, "jl": data.job_level})
        db.commit()
        return res.lastrowid
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def get_designation(db: Session, desig_id: int) -> Optional[dict]:
    try:
        query = text("SELECT * FROM designation WHERE id = :id")
        res = db.execute(query, {"id": desig_id}).mappings().first()
        return dict(res) if res else None
    except Exception as e:
        handle_db_error(e)

def get_designations(db: Session) -> List[dict]:
    try:
        query = text("SELECT * FROM designation")
        res = db.execute(query).mappings().all()
        return [dict(r) for r in res]
    except Exception as e:
        handle_db_error(e)

def update_designation(db: Session, desig_id: int, data: schemas.DesignationUpdate):
    try:
        updates = []
        params = {"id": desig_id}
        for k, v in data.model_dump(exclude_unset=True).items():
            updates.append(f"{k} = :{k}")
            params[k] = v
        if updates:
            query = text(f"UPDATE designation SET {', '.join(updates)} WHERE id = :id")
            db.execute(query, params)
            db.commit()
    except Exception as e:
        db.rollback()
        handle_db_error(e)

# --- Leave Types ---
def create_leave_type(db: Session, data: schemas.LeaveTypeCreate) -> int:
    try:
        query = text("INSERT INTO leave_type (name, is_paid) VALUES (:n, :p)")
        res = db.execute(query, {"n": data.name, "p": 1 if data.is_paid else 0})
        db.commit()
        return res.lastrowid
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def get_leave_types(db: Session) -> List[dict]:
    try:
        query = text("SELECT * FROM leave_type")
        res = db.execute(query).mappings().all()
        return [dict(r) for r in res]
    except Exception as e:
        handle_db_error(e)

def update_leave_type(db: Session, lt_id: int, data: schemas.LeaveTypeUpdate):
    try:
        updates = []
        params = {"id": lt_id}
        for k, v in data.model_dump(exclude_unset=True).items():
            if k == "is_paid":
                v = 1 if v else 0
            updates.append(f"{k} = :{k}")
            params[k] = v
        if updates:
            query = text(f"UPDATE leave_type SET {', '.join(updates)} WHERE id = :id")
            db.execute(query, params)
            db.commit()
    except Exception as e:
        db.rollback()
        handle_db_error(e)

# --- Leave Entitlements ---
def create_leave_entitlement(db: Session, data: schemas.LeaveEntitlementCreate) -> int:
    try:
        query = text("""
            INSERT INTO leave_entitlement (leave_type_id, emp_type, annual_quota, carry_forward)
            VALUES (:lt, :et, :q, :cf)
        """)
        res = db.execute(query, {
            "lt": data.leave_type_id,
            "et": data.emp_type.value,
            "q": data.annual_quota,
            "cf": 1 if data.carry_forward else 0
        })
        db.commit()
        return res.lastrowid
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def get_leave_entitlements(db: Session) -> List[dict]:
    try:
        query = text("SELECT * FROM leave_entitlement")
        res = db.execute(query).mappings().all()
        return [dict(r) for r in res]
    except Exception as e:
        handle_db_error(e)

# --- Leave Applications ---
def create_leave_application(db: Session, emp_id: int, data: schemas.LeaveApplicationBase) -> int:
    try:
        query = text("""
            INSERT INTO leave_application (employee_id, leave_type_id, start_date, end_date, days, reason, status)
            VALUES (:e, :lt, :s, :end, :d, :r, 'PENDING')
        """)
        res = db.execute(query, {
            "e": emp_id,
            "lt": data.leave_type_id,
            "s": data.start_date,
            "end": data.end_date,
            "d": data.days,
            "r": data.reason
        })
        db.commit()
        return res.lastrowid
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def get_leave_application(db: Session, leave_id: int) -> Optional[dict]:
    try:
        query = text("SELECT * FROM leave_application WHERE id = :id")
        res = db.execute(query, {"id": leave_id}).mappings().first()
        return dict(res) if res else None
    except Exception as e:
        handle_db_error(e)

def get_leave_applications(db: Session, emp_id: int = None, status: str = None) -> List[dict]:
    try:
        q = "SELECT * FROM leave_application WHERE 1=1"
        params = {}
        if emp_id:
            q += " AND employee_id = :e"
            params["e"] = emp_id
        if status:
            q += " AND status = :s"
            params["s"] = status
        res = db.execute(text(q), params).mappings().all()
        return [dict(r) for r in res]
    except Exception as e:
        handle_db_error(e)

def update_leave_decision(db: Session, leave_id: int, status: str, admin_id: int):
    try:
        query = text("""
            UPDATE leave_application 
            SET status = :s, decision_by = :a, decision_date = CURRENT_TIMESTAMP
            WHERE id = :id
        """)
        db.execute(query, {"s": status, "a": admin_id, "id": leave_id})
        db.commit()
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def get_leave_balance(db: Session, emp_id: int, leave_type_id: int, year: int) -> float:
    return float(call_function(db, 'fn_leave_balance', [emp_id, leave_type_id, year]) or 0)

# --- Salary Structures ---
def create_salary_structure(db: Session, data: schemas.SalaryStructureCreate) -> int:
    try:
        query = text("""
            INSERT INTO salary_structure (designation_id, basic_pay, allowances, standard_deductions)
            VALUES (:d, :b, :a, :sd)
        """)
        res = db.execute(query, {
            "d": data.designation_id,
            "b": data.basic_pay,
            "a": data.allowances,
            "sd": data.standard_deductions
        })
        db.commit()
        return res.lastrowid
    except Exception as e:
        db.rollback()
        handle_db_error(e)

def get_salary_structures(db: Session) -> List[dict]:
    try:
        query = text("SELECT * FROM salary_structure")
        res = db.execute(query).mappings().all()
        return [dict(r) for r in res]
    except Exception as e:
        handle_db_error(e)

def update_salary_structure(db: Session, ss_id: int, data: schemas.SalaryStructureUpdate):
    try:
        updates = []
        params = {"id": ss_id}
        for k, v in data.model_dump(exclude_unset=True).items():
            updates.append(f"{k} = :{k}")
            params[k] = v
        if updates:
            query = text(f"UPDATE salary_structure SET {', '.join(updates)} WHERE id = :id")
            db.execute(query, params)
            db.commit()
    except Exception as e:
        db.rollback()
        handle_db_error(e)

# --- Payroll ---
def run_payroll(db: Session, month: str, mode: str, acting_user: int):
    # mode = 'DRAFT' or 'FINALIZE'
    call_procedure(db, 'sp_monthly_payroll', [month, mode, acting_user])

def get_payroll_run(db: Session, month: str) -> Optional[dict]:
    try:
        query = text("SELECT * FROM payroll_run WHERE payroll_month = :m")
        res = db.execute(query, {"m": month}).mappings().first()
        if not res:
            return None
        
        pr = dict(res)
        
        # Get payslips
        ps_query = text("SELECT * FROM payslip WHERE run_id = :r")
        payslips = [dict(p) for p in db.execute(ps_query, {"r": pr["id"]}).mappings().all()]
        
        if payslips:
            ps_ids = [p["id"] for p in payslips]
            lines_query = text("SELECT * FROM payslip_line WHERE payslip_id IN :ids")
            # For IN clause, format properly or execute safely (using simple loop or bindparam for simplicity since it's read)
            # Safe IN binding is annoying in core text(), so we'll just query per payslip (fine for small sets) or string format carefully
            # Let's bind manually
        
            ids_str = ",".join(str(i) for i in ps_ids)
            lines_res = db.execute(text(f"SELECT * FROM payslip_line WHERE payslip_id IN ({ids_str})")).mappings().all()
            
            lines_by_ps = {}
            for l in lines_res:
                lines_by_ps.setdefault(l["payslip_id"], []).append(dict(l))
                
            for p in payslips:
                p["lines"] = lines_by_ps.get(p["id"], [])
                
        pr["payslips"] = payslips
        return pr
    except Exception as e:
        handle_db_error(e)

def get_payslips_for_employee(db: Session, emp_id: int) -> List[dict]:
    try:
        ps_query = text("SELECT * FROM payslip WHERE employee_id = :e")
        payslips = [dict(p) for p in db.execute(ps_query, {"e": emp_id}).mappings().all()]
        
        if payslips:
            ps_ids = [p["id"] for p in payslips]
            ids_str = ",".join(str(i) for i in ps_ids)
            lines_res = db.execute(text(f"SELECT * FROM payslip_line WHERE payslip_id IN ({ids_str})")).mappings().all()
            
            lines_by_ps = {}
            for l in lines_res:
                lines_by_ps.setdefault(l["payslip_id"], []).append(dict(l))
                
            for p in payslips:
                p["lines"] = lines_by_ps.get(p["id"], [])
                
        return payslips
    except Exception as e:
        handle_db_error(e)

def check_leave_overlap(db: Session, employee_id: int, start_date: date, end_date: date) -> bool:
    """
    Returns True if employee has an active (PENDING or APPROVED) leave
    overlapping [start_date, end_date].
    Overlap formula: start_date <= existing.end_date AND end_date >= existing.start_date
    """
    try:
        query = text("""
            SELECT id FROM leave_application
            WHERE employee_id = :e
              AND status IN ('PENDING', 'APPROVED')
              AND start_date <= :end_d
              AND end_date >= :start_d
            LIMIT 1
        """)
        res = db.execute(query, {
            "e": employee_id,
            "start_d": start_date,
            "end_d": end_date
        }).fetchone()
        return res is not None
    except Exception as e:
        handle_db_error(e)

def get_payroll_register(db: Session, month: Optional[str] = None, dept_id: Optional[int] = None) -> List[dict]:
    try:
        q = "SELECT * FROM vw_payroll_register WHERE 1=1"
        params = {}
        if month:
            q += " AND payroll_month = :m"
            params["m"] = month
        if dept_id:
            q += " AND employee_id IN (SELECT id FROM employee WHERE department_id = :d)"
            params["d"] = dept_id
        q += " ORDER BY department_name ASC, employee_name ASC"
        res = db.execute(text(q), params).mappings().all()
        return [dict(r) for r in res]
    except Exception as e:
        handle_db_error(e)

