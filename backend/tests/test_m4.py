import pytest
import time
import random
from datetime import date, timedelta

def test_m4_fee_workflow(client, admin_finance_token, student_token):
    # Ensure no collision on UK_prog_term (program_id, term_id)
    res_list = client.get("/api/v1/fee-structures", headers={"Authorization": f"Bearer {admin_finance_token}"})
    if res_list.status_code == 200:
        for item in res_list.json().get("items", []):
            if item.get("program_id") == 2 and item.get("term_id") == 2:
                client.delete(f"/api/v1/fee-structures/{item['id']}", headers={"Authorization": f"Bearer {admin_finance_token}"})

    # 1. Create Fee Structure
    name = f"Term Fee {random.randint(1000, 9999)}"
    res_fs = client.post("/api/v1/fee-structures", json={
        "program_id": 2,
        "term_id": 2,
        "structure_name": name,
        "components": [
            {
                "component_name": "Tuition",
                "amount": 50000.0,
                "due_date": (date.today() + timedelta(days=30)).isoformat()
            }
        ]
    }, headers={"Authorization": f"Bearer {admin_finance_token}"})
    assert res_fs.status_code == 201, res_fs.text
    fs = res_fs.json()
    fs_id = fs["id"]
    assert len(fs["components"]) == 1

    # 2. Get Student ID from student token
    # Hack to find student ID: call an endpoint that returns it, or just use 1 since student_token is for student 1.
    res_me = client.get("/api/v1/me", headers={"Authorization": f"Bearer {student_token}"})
    # If /api/v1/me doesn't exist, we just assign to student 1.
    
    # 3. Assign Fees
    res_assign = client.post("/api/v1/fee-assignments", json={
        "fee_structure_id": fs_id,
        "student_ids": [1]
    }, headers={"Authorization": f"Bearer {admin_finance_token}"})
    assert res_assign.status_code == 201

    # 4. Student views dues
    res_dues = client.get("/api/v1/me/dues", headers={"Authorization": f"Bearer {student_token}"})
    assert res_dues.status_code == 200
    dues = res_dues.json()
    assert any(d["amount_due"] == 50000.0 for d in dues)
    
    due_id = next(d["id"] for d in dues if d["amount_due"] == 50000.0 and d["status"] == "PENDING")

    # 5. Student pays fee
    res_pay = client.post("/api/v1/payments", json={
        "due_ids": [due_id],
        "amount": 50000.0,
        "payment_mode": "ONLINE",
        "reference_no": f"TXN{random.randint(10000, 99999)}"
    }, headers={"Authorization": f"Bearer {student_token}"})
    assert res_pay.status_code == 201
    receipt = res_pay.json()
    assert receipt["receipt_number"] is not None

    # 6. View receipt
    receipt_id = receipt["id"]
    res_rect = client.get(f"/api/v1/receipts/{receipt_id}", headers={"Authorization": f"Bearer {student_token}"})
    assert res_rect.status_code == 200

    # 7. View payments
    res_pays = client.get("/api/v1/me/payments", headers={"Authorization": f"Bearer {student_token}"})
    assert res_pays.status_code == 200
    assert any(p["id"] == receipt["payment_id"] for p in res_pays.json())

    # 8. View Defaulters (Admin)
    res_def = client.get("/api/v1/fees/defaulters", headers={"Authorization": f"Bearer {admin_finance_token}"})
    assert res_def.status_code == 200

    # 9. View Audit Log
    res_audit = client.get("/api/v1/audit/fees", headers={"Authorization": f"Bearer {admin_finance_token}"})
    assert res_audit.status_code == 200

def test_late_fee_rule_crud(client, admin_finance_token):
    # Create Late Fee Rule
    res = client.post("/api/v1/late-fee-rules", json={
        "rule_type": "FLAT",
        "penalty_amount": 500.0,
        "max_penalty": 1000.0
    }, headers={"Authorization": f"Bearer {admin_finance_token}"})
    assert res.status_code == 201
    rule_id = res.json()["id"]

    # Get
    res_get = client.get("/api/v1/late-fee-rules", headers={"Authorization": f"Bearer {admin_finance_token}"})
    assert res_get.status_code == 200

    # Update
    res_upd = client.put(f"/api/v1/late-fee-rules/{rule_id}", json={
        "penalty_amount": 600.0
    }, headers={"Authorization": f"Bearer {admin_finance_token}"})
    assert res_upd.status_code == 200
    assert res_upd.json()["penalty_amount"] == 600.0

    # Delete
    res_del = client.delete(f"/api/v1/late-fee-rules/{rule_id}", headers={"Authorization": f"Bearer {admin_finance_token}"})
    assert res_del.status_code == 204
