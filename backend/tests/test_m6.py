import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# We assume standard demo users from DB seed:
# Admin: admin@university.edu (pass123)
# Student: s.jones@university.edu (pass123)
# To create test tokens, we hit the /api/v1/auth/login endpoint (or whatever it is).
# Let's use the fixture or manual login.

import time

def test_hostel_workflow(admin_hostel_token, student_token):
    headers_admin = {"Authorization": f"Bearer {admin_hostel_token}"}
    headers_student = {"Authorization": f"Bearer {student_token}"}
    
    unique_suffix = str(int(time.time()))
    # 1. Create Hostel (Admin)
    hostel_data = {
        "name": f"Test Hostel A {unique_suffix}",
        "gender_block": "MALE",
        "total_capacity": 100
    }
    resp = client.post("/api/v1/hostels", json=hostel_data, headers=headers_admin)
    assert resp.status_code == 201, resp.text
    hostel_id = resp.json()["id"]

    # 2. Create Room (Admin)
    room_data = {
        "hostel_id": hostel_id,
        "room_number": f"101-{unique_suffix}",
        "bed_capacity": 2
    }
    resp = client.post("/api/v1/rooms", json=room_data, headers=headers_admin)
    assert resp.status_code == 201, resp.text
    room_id = resp.json()["id"]

    # 3. Student creates Hostel Request (Allocation)
    req_data = {
        "request_type": "ALLOCATION",
        "details": "Need ground floor"
    }
    resp = client.post("/api/v1/hostel-requests", json=req_data, headers=headers_student)
    assert resp.status_code == 201, resp.text
    req_id = resp.json()["id"]

    # 4. Admin reviews Hostel Request and Approves
    dec_data = {
        "status": "APPROVED",
        "remark": "Approved for 101"
    }
    resp = client.patch(f"/api/v1/hostel-requests/{req_id}/decision", json=dec_data, headers=headers_admin)
    assert resp.status_code == 200, resp.text

    # 5. Admin Allocates Room to Student
    # Need student ID for the student account. s.jones is usually ID 1 or we can parse from token/profile.
    resp = client.get("/api/v1/me", headers=headers_student)
    student_account_id = resp.json()["id"]
    
    # Actually we need `student.id`, not `user_account.id`.
    # Let's allocate manually. The DB expects `student_id` (BIGINT).
    # Since we can't easily fetch student_id from /me (unless it exposes it),
    # let's fetch it via another endpoint or assume student_id = 1.
    # Alternatively, the request returns student_id!
    resp = client.get(f"/api/v1/hostel-requests", headers=headers_admin)
    reqs = [r for r in resp.json() if r["id"] == req_id]
    assert len(reqs) == 1
    student_id = reqs[0]["student_id"]

    alloc_data = {
        "student_id": student_id,
        "room_id": room_id,
        "from_date": "2026-08-01"
    }
    resp = client.post("/api/v1/hostel-allocations", json=alloc_data, headers=headers_admin)
    assert resp.status_code == 201, resp.text
    alloc_id = resp.json()["id"]

    # Check room available beds decreased
    resp = client.get(f"/api/v1/rooms/{room_id}", headers=headers_admin)
    assert resp.status_code == 200
    assert resp.json()["available_beds"] == 1

    # Student checks allocation
    resp = client.get("/api/v1/me/hostel", headers=headers_student)
    assert resp.status_code == 200
    assert resp.json()["id"] == alloc_id

    # Try duplicate allocation -> should fail 409
    resp = client.post("/api/v1/hostel-allocations", json=alloc_data, headers=headers_admin)
    assert resp.status_code == 409
    assert resp.json()["code"] == "ACTIVE_ALLOCATION_EXISTS"

    # 6. Admin Vacates Room
    resp = client.patch(f"/api/v1/hostel-allocations/{alloc_id}/vacate", headers=headers_admin)
    assert resp.status_code == 200

    # Check room available beds increased back
    resp = client.get(f"/api/v1/rooms/{room_id}", headers=headers_admin)
    assert resp.status_code == 200
    assert resp.json()["available_beds"] == 2

    # Occupancy dashboard
    resp = client.get("/api/v1/hostels/occupancy", headers=headers_admin)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
