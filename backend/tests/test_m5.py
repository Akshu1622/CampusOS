import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_hr_workflow(admin_hr_token, faculty_token):
    headers_admin = {"Authorization": f"Bearer {admin_hr_token}"}
    headers_fac = {"Authorization": f"Bearer {faculty_token}"}
    
    # 1. Create designation
    import time
    uid = str(time.time()).replace('.', '')
    desig_data = {"title": f"Professor_{uid}", "job_level": 5}
    resp = client.post("/api/v1/designations", json=desig_data, headers=headers_admin)
    assert resp.status_code == 201, resp.text
    desig_id = resp.json()["id"]
    
    # 2. Create employee (faculty)
    emp_data = {
        "first_name": "Test",
        "last_name": "Faculty",
        "department_id": 1, # assuming dept 1 exists from seed
        "designation_id": desig_id,
        "joining_date": "2030-01-01",
        "emp_type": "FACULTY",
        "status": "ACTIVE"
    }
    resp = client.post("/api/v1/employees", json=emp_data, headers=headers_admin)
    assert resp.status_code == 201, resp.text
    emp_id = resp.json()["id"]
    
    # In reality, this faculty must be linked to the user account that `faculty_token` belongs to for `faculty_token` tests to work.
    # The `faculty_token` belongs to user with id 2 (faculty1@test.com) from `test_conftest.py` setup (if available), or `test_db`.
    # Let's link it directly via DB to ensure `faculty_token` can act as this employee.
    # Actually, we can just test Admin routes for now to avoid manual DB linking in the test.
    
    # 3. Create Leave Type
    lt_data = {"name": f"Sick Leave_{uid}", "is_paid": True}
    resp = client.post("/api/v1/leave-types", json=lt_data, headers=headers_admin)
    assert resp.status_code == 201, resp.text
    lt_id = resp.json()["id"]
    
    # 4. Create Leave Entitlement
    ent_data = {
        "leave_type_id": lt_id,
        "emp_type": "FACULTY",
        "annual_quota": 10,
        "carry_forward": False
    }
    resp = client.post("/api/v1/leave-entitlements", json=ent_data, headers=headers_admin)
    assert resp.status_code == 201, resp.text
    
    # 5. Salary Structure
    sal_data = {
        "designation_id": desig_id,
        "basic_pay": 100000,
        "allowances": 20000,
        "standard_deductions": 5000
    }
    resp = client.post("/api/v1/salary-structures", json=sal_data, headers=headers_admin)
    assert resp.status_code == 201, resp.text
    
    # 6. Payroll run (Draft)
    # The payroll month must be unique per test run if we don't reset DB, or we can use a new month
    import random
    random_month = f"{random.randint(2040, 2090)}-10"
    pr_data = {"payroll_month": random_month}
    resp = client.post("/api/v1/payroll/run", json=pr_data, headers=headers_admin)
    assert resp.status_code == 200, resp.text
    
    pr = resp.json()
    assert pr["status"] == "DRAFT"
    
    # Check if payslip was generated for our employee
    payslips = [p for p in pr["payslips"] if p["employee_id"] == emp_id]
    assert len(payslips) == 1
    ps = payslips[0]
    assert ps["gross_pay"] == 120000.0  # 100k + 20k
    assert ps["total_deductions"] == 5000.0
    assert ps["net_pay"] == 115000.0
    
    # 7. Finalize Payroll
    resp = client.post(f"/api/v1/payroll/{random_month}/finalize", headers=headers_admin)
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "FINALIZED"
    
    # 8. Draft again should fail
    resp = client.post("/api/v1/payroll/run", json=pr_data, headers=headers_admin)
    assert resp.status_code == 409
