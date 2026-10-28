import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from app.main import app
from app.db.engine import engine
import time

client = TestClient(app)

def test_hostel_workflow_and_features(admin_hostel_token, student_token, admin_finance_token):
    headers_admin = {"Authorization": f"Bearer {admin_hostel_token}"}
    headers_student = {"Authorization": f"Bearer {student_token}"}
    headers_finance = {"Authorization": f"Bearer {admin_finance_token}"}
    
    unique_suffix = str(int(time.time()))

    # 1. Security / Permission test: Non-hostel admin must be blocked (403 Forbidden)
    resp = client.post("/api/v1/hostels", json={"name": f"Forbidden {unique_suffix}", "gender_block": "COED", "total_capacity": 50}, headers=headers_finance)
    assert resp.status_code == 403
    assert resp.json()["code"] == "FORBIDDEN"

    # 2. Create COED Hostel (Admin)
    hostel_data = {
        "name": f"Hall of Innovation {unique_suffix}",
        "gender_block": "COED",
        "total_capacity": 100
    }
    resp = client.post("/api/v1/hostels", json=hostel_data, headers=headers_admin)
    assert resp.status_code == 201, resp.text
    hostel_id = resp.json()["id"]

    # 3. Create 2 Rooms in Hostel
    room_1_data = {
        "hostel_id": hostel_id,
        "room_number": f"101-{unique_suffix}",
        "bed_capacity": 2
    }
    resp = client.post("/api/v1/rooms", json=room_1_data, headers=headers_admin)
    assert resp.status_code == 201, resp.text
    room_1_id = resp.json()["id"]

    room_2_data = {
        "hostel_id": hostel_id,
        "room_number": f"102-{unique_suffix}",
        "bed_capacity": 2
    }
    resp = client.post("/api/v1/rooms", json=room_2_data, headers=headers_admin)
    assert resp.status_code == 201, resp.text
    room_2_id = resp.json()["id"]

    # 4. Student checks initial allocation (ensure clean state)
    resp = client.get("/api/v1/me/hostel", headers=headers_student)
    assert resp.status_code == 200
    if resp.json() is not None:
        client.patch(f"/api/v1/hostel-allocations/{resp.json()['id']}/vacate", headers=headers_admin)
        resp = client.get("/api/v1/me/hostel", headers=headers_student)
        assert resp.status_code == 200
        assert resp.json() is None

    # 5. Student creates Hostel Request (Allocation)
    req_data = {
        "request_type": "ALLOCATION",
        "details": "Ground floor request for ease of access",
        "preferred_hostel_id": hostel_id
    }
    resp = client.post("/api/v1/hostel-requests", json=req_data, headers=headers_student)
    assert resp.status_code == 201, resp.text
    req_id = resp.json()["id"]
    student_id = resp.json()["student_id"]

    # 6. Duplicate pending request prevention: second request while one is pending must return 409
    resp = client.post("/api/v1/hostel-requests", json=req_data, headers=headers_student)
    assert resp.status_code == 409
    assert resp.json()["code"] == "DUPLICATE_PENDING_REQUEST"

    # 7. Admin reviews Hostel Request and verifies Student Identity in payload
    resp = client.get("/api/v1/hostel-requests", headers=headers_admin)
    assert resp.status_code == 200
    reqs = [r for r in resp.json() if r["id"] == req_id]
    assert len(reqs) == 1
    # Check that official identity fields are returned!
    assert "global_student_id" in reqs[0]
    assert "student_name" in reqs[0]
    student_global_id = reqs[0]["global_student_id"]

    # Admin approves request
    dec_data = {
        "status": "APPROVED",
        "remark": "Approved for Hall of Innovation Room 101"
    }
    resp = client.patch(f"/api/v1/hostel-requests/{req_id}/decision", json=dec_data, headers=headers_admin)
    assert resp.status_code == 200, resp.text

    # 8. Demographic Eligibility Check:
    # Ensure student has NULL gender (unverified) for clean test idempotency
    with engine.begin() as conn:
        conn.execute(text("UPDATE student SET gender = NULL WHERE id = :sid"), {"sid": student_id})
    # Student 1 has NULL gender (unverified). Creating a MALE-only hostel and trying to allocate must reject!
    male_hostel_resp = client.post("/api/v1/hostels", json={"name": f"Male Wing {unique_suffix}", "gender_block": "MALE", "total_capacity": 50}, headers=headers_admin)
    male_hostel_id = male_hostel_resp.json()["id"]
    male_room_resp = client.post("/api/v1/rooms", json={"hostel_id": male_hostel_id, "room_number": f"M1-{unique_suffix}", "bed_capacity": 2}, headers=headers_admin)
    male_room_id = male_room_resp.json()["id"]

    resp = client.post("/api/v1/hostel-allocations", json={"student_id": student_id, "room_id": male_room_id, "from_date": "2026-08-01"}, headers=headers_admin)
    assert resp.status_code == 422
    assert resp.json()["code"] == "DEMOGRAPHICS_UNVERIFIED"

    # 9. Allocate student to the COED room (succeeds!)
    alloc_data = {
        "student_id": student_id,
        "room_id": room_1_id,
        "bed_number": "Bed 1",
        "from_date": "2026-08-01"
    }
    resp = client.post("/api/v1/hostel-allocations", json=alloc_data, headers=headers_admin)
    assert resp.status_code == 201, resp.text
    alloc_id = resp.json()["id"]
    assert resp.json()["bed_number"] == "Bed 1"
    assert resp.json()["global_student_id"] is not None

    # Check available beds decreased from 2 to 1
    resp = client.get(f"/api/v1/rooms/{room_1_id}", headers=headers_admin)
    assert resp.status_code == 200
    assert resp.json()["available_beds"] == 1

    # 10. Student checks allocation (returns active allocation)
    resp = client.get("/api/v1/me/hostel", headers=headers_student)
    assert resp.status_code == 200
    assert resp.json()["id"] == alloc_id
    assert resp.json()["room_number"] == f"101-{unique_suffix}"

    # 11. Room Roster & Allocation Listing API
    resp = client.get(f"/api/v1/hostel-allocations?hostel_id={hostel_id}&status=ACTIVE", headers=headers_admin)
    assert resp.status_code == 200
    alloc_list = resp.json()
    assert len(alloc_list) >= 1
    assert alloc_list[0]["global_student_id"] is not None
    assert alloc_list[0]["student_name"] is not None

    # 12. Atomic Room Transfer: Transfer from Room 101 to Room 102
    resp = client.post(f"/api/v1/hostel-allocations/{alloc_id}/transfer", json={"new_room_id": room_2_id, "new_bed_number": "Bed 2A"}, headers=headers_admin)
    assert resp.status_code == 200, resp.text
    assert resp.json()["room_id"] == room_2_id

    # Verify bed counts balanced: Room 1 back to 2 available beds, Room 2 decremented to 1 available bed
    resp1 = client.get(f"/api/v1/rooms/{room_1_id}", headers=headers_admin)
    resp2 = client.get(f"/api/v1/rooms/{room_2_id}", headers=headers_admin)
    assert resp1.json()["available_beds"] == 2
    assert resp2.json()["available_beds"] == 1

    # 13. Student submits Complaint ticket
    comp_data = {
        "hostel_id": hostel_id,
        "room_id": room_2_id,
        "category": "ELECTRICAL",
        "priority": "HIGH",
        "title": "Study lamp socket loose",
        "description": "The socket near the desk is loose and needs fixing."
    }
    resp = client.post("/api/v1/hostel-complaints", json=comp_data, headers=headers_student)
    assert resp.status_code == 201, resp.text
    comp_id = resp.json()["id"]

    # Admin updates complaint status
    resp = client.patch(f"/api/v1/hostel-complaints/{comp_id}/status", json={"status": "IN_PROGRESS", "assigned_to": "Electrician Suresh"}, headers=headers_admin)
    assert resp.status_code == 200
    assert resp.json()["status"] == "IN_PROGRESS"

    # 14. Signatures Feature A: Hostel Data Integrity Guardian
    resp = client.get("/api/v1/hostel-integrity/guardian", headers=headers_admin)
    assert resp.status_code == 200
    report = resp.json()
    assert "status" in report
    assert "findings" in report
    assert isinstance(report["findings"], list)

    # 15. Signatures Feature B: Smart Allocation Lab
    resp = client.post("/api/v1/hostel-lab/smart-allocation", json={"student_id": student_id, "preferred_hostel_id": hostel_id}, headers=headers_admin)
    assert resp.status_code == 200
    smart_res = resp.json()
    assert smart_res["student_id"] == student_id
    assert len(smart_res["recommended_rooms"]) > 0

    # 16. Signatures Feature C: Capacity What-If Simulator
    sim_data = {
        "hostel_id": hostel_id,
        "additional_male_applicants": 10,
        "additional_female_applicants": 5,
        "closed_room_ids": [room_1_id]
    }
    resp = client.post("/api/v1/hostel-simulator/capacity-what-if", json=sim_data, headers=headers_admin)
    assert resp.status_code == 200
    sim_res = resp.json()
    assert sim_res["is_simulation"] is True
    assert len(sim_res["hostel_projections"]) > 0

    # 17. Signatures Feature D: Hostel Change Impact Radar
    radar_data = {
        "target_action": "CLOSE_ROOM",
        "target_room_ids": [room_2_id]
    }
    resp = client.post("/api/v1/hostel-radar/change-impact", json=radar_data, headers=headers_admin)
    assert resp.status_code == 200
    radar_res = resp.json()
    assert radar_res["action"] == "CLOSE_ROOM"
    assert radar_res["displaced_residents_count"] == 1
    assert len(radar_res["affected_residents"]) == 1

    # 18. Signatures Feature E: Student Hostel Journey
    resp = client.get("/api/v1/me/hostel-journey", headers=headers_student)
    assert resp.status_code == 200
    journey = resp.json()
    assert journey["student_id"] == student_id
    assert len(journey["events"]) >= 3 # Application, Approval, Allocation, etc.

    # 19. Vacate Allocation
    resp = client.patch(f"/api/v1/hostel-allocations/{alloc_id}/vacate", headers=headers_admin)
    assert resp.status_code == 200
    assert resp.json()["status"] == "VACATED"

    # Room 2 available beds restored to 2
    resp2 = client.get(f"/api/v1/rooms/{room_2_id}", headers=headers_admin)
    assert resp2.json()["available_beds"] == 2

    # 20. Admin updates Complaint Priority & Status
    resp = client.patch(f"/api/v1/hostel-complaints/{comp_id}/status", json={
        "status": "IN_PROGRESS",
        "priority": "HIGH",
        "assigned_to": "Electrician Suresh",
        "resolution_notes": "Parts ordered for power outlet replacement."
    }, headers=headers_admin)
    assert resp.status_code == 200

    # 21. Policy-Based Waitlist Creation & Retrieval
    resp = client.post("/api/v1/hostel-waitlist", json={
        "student_id": student_id,
        "preferred_hostel_id": hostel_id,
        "priority_score": 75,
        "notes": "Prefers ground floor quiet study room."
    }, headers=headers_admin)
    assert resp.status_code == 201
    waitlist_entry = resp.json()
    assert waitlist_entry["student_id"] == student_id
    assert waitlist_entry["priority_score"] == 75

    resp = client.get(f"/api/v1/hostel-waitlist?hostel_id={hostel_id}", headers=headers_admin)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1

    # 22. Visitor Registration & Gate Pass Exit
    visitor_data = {
        "hostel_id": hostel_id,
        "student_id": student_id,
        "visitor_name": "Ramesh Sharma",
        "relationship": "Father",
        "id_proof_type": "Aadhaar Card",
        "id_proof_number": "1234-5678-9012",
        "entry_time": "2026-10-27T10:00:00",
        "purpose": "Delivering study materials"
    }
    resp = client.post("/api/v1/hostel-visitors", json=visitor_data, headers=headers_admin)
    assert resp.status_code == 201
    visitor = resp.json()
    assert visitor["visitor_name"] == "Ramesh Sharma"
    assert "GP-" in visitor["gate_pass_number"]

    resp = client.patch(f"/api/v1/hostel-visitors/{visitor['id']}/exit", json={
        "exit_time": "2026-10-27T12:00:00"
    }, headers=headers_admin)
    assert resp.status_code == 200
    assert resp.json()["exit_time"] is not None

    # 23. Official Allocation Letter Generation
    resp = client.get(f"/api/v1/hostel-allocations/{alloc_id}/letter", headers=headers_admin)
    assert resp.status_code == 200
    letter = resp.json()
    assert "HAL-" in letter["letter_id"]
    assert letter["student"]["student_id"] == student_id
    assert "accommodation" in letter
    assert len(letter["rules_and_terms"]) > 0

    # 24. Student Demographics CSV Import
    csv_sample = f"""global_student_id,gender,is_hostel_eligible,remarks
{student_global_id},MALE,1,Verified demographic from admissions registry
STU-9999-999999,FEMALE,1,Verified female resident
"""
    resp = client.post("/api/v1/hostel/students/import-demographics-csv", json={
        "csv_content": csv_sample
    }, headers=headers_admin)
    assert resp.status_code == 200
    import_res = resp.json()
    assert import_res["total_processed"] == 2
    assert import_res["updated_count"] >= 1
    assert import_res["skipped_count"] >= 1

    # 25. Room Inventory CSV Import
    h_name = hostel_data["name"]
    csv_rooms = f"""Hostel Name,Room Number,Gender Block,Bed Capacity,Readiness Status
"{h_name}",999-TEST,MALE,3,READY
"Imported Tower",101,COED,2,READY
"""
    resp = client.post("/api/v1/hostel/rooms/import-csv", json={
        "csv_content": csv_rooms
    }, headers=headers_admin)
    assert resp.status_code == 200
    room_import_res = resp.json()
    assert room_import_res["total_processed"] == 2
    assert room_import_res["created_count"] + room_import_res["updated_count"] == 2

    # 26. Feature C: Capacity What-If Scenario Simulator
    resp = client.post("/api/v1/hostel-simulator/capacity-what-if", json={
        "additional_male_applicants": 20,
        "additional_female_applicants": 15,
        "closed_room_ids": [room_1_id]
    }, headers=headers_admin)
    assert resp.status_code == 200
    sim_data = resp.json()
    assert sim_data["is_simulation"] is True
    assert "hostel_projections" in sim_data
    assert "overall_campus_shortage" in sim_data
    assert len(sim_data["recommendations"]) > 0

    # 27. Feature D: Change Impact Radar (Disruption Analysis)
    resp = client.post("/api/v1/hostel-radar/change-impact", json={
        "target_action": "CLOSE_ROOM",
        "target_room_ids": [room_1_id]
    }, headers=headers_admin)
    assert resp.status_code == 200
    radar_data = resp.json()
    assert radar_data["action"] == "CLOSE_ROOM"
    assert "severity_level" in radar_data
    assert "capacity_loss" in radar_data
    assert "affected_residents" in radar_data
    assert len(radar_data["mitigation_options"]) > 0

    # 28. Feature: Minimal Hostel Fee Configuration & Invoices
    resp = client.post("/api/v1/hostel-fees/configs", json={
        "hostel_id": hostel_id,
        "fee_name": f"Term Maintenance {unique_suffix}",
        "amount": 12000.0,
        "academic_term": "AY-2026-27-SEM1",
        "due_days": 30
    }, headers=headers_admin)
    assert resp.status_code == 201
    cfg_id = resp.json()["id"]

    # Create an invoice for the student
    resp = client.post("/api/v1/hostel-fees/invoices", json={
        "student_id": student_id,
        "hostel_id": hostel_id,
        "fee_config_id": cfg_id,
        "title": f"Hostel Rent & Utility {unique_suffix}",
        "amount": 12000.0,
        "due_date": "2026-11-30"
    }, headers=headers_admin)
    assert resp.status_code == 201
    test_inv_id = resp.json()["id"]
    assert resp.json()["balance"] == 12000.0

    # 29. Student Payment Submission (UPI) & Admin Verification
    resp = client.get("/api/v1/me/hostel-fees/invoices", headers=headers_student)
    assert resp.status_code == 200
    student_invs = resp.json()
    target_inv = next(i for i in student_invs if i["id"] == test_inv_id)

    # Student pays partial amount via UPI
    resp = client.post("/api/v1/me/hostel-fees/pay", json={
        "invoice_id": test_inv_id,
        "amount_paid": 5000.0,
        "payment_method": "UPI",
        "payment_reference": f"UPI-TEST-{unique_suffix}",
        "proof_notes": "Paid from GPay"
    }, headers=headers_student)
    assert resp.status_code == 201
    pay_id = resp.json()["id"]
    assert resp.json()["status"] == "PENDING_VERIFICATION"

    # Admin verifies the payment
    resp = client.post(f"/api/v1/hostel-fees/payments/{pay_id}/verify", json={
        "status": "VERIFIED",
        "verification_notes": "Approved by warden desk"
    }, headers=headers_admin)
    assert resp.status_code == 200
    assert resp.json()["verification_status"] == "VERIFIED"

    # Check updated invoice balance
    resp = client.get(f"/api/v1/hostel-fees/invoices?student_id={student_id}", headers=headers_admin)
    assert resp.status_code == 200
    updated_inv = next(i for i in resp.json() if i["id"] == test_inv_id)
    assert updated_inv["amount_paid"] == 5000.0
    assert updated_inv["balance"] == 7000.0
    assert updated_inv["status"] == "PARTIALLY_PAID"

    # Student pays remaining balance via Instant Demo Mode
    resp = client.post("/api/v1/me/hostel-fees/pay", json={
        "invoice_id": test_inv_id,
        "amount_paid": 7000.0,
        "payment_method": "DEMO",
        "payment_reference": f"DEMO-{unique_suffix}",
        "proof_notes": "Demo instant settlement"
    }, headers=headers_student)
    assert resp.status_code == 201
    assert resp.json()["status"] == "VERIFIED"

    # Verify invoice is now fully PAID
    resp = client.get(f"/api/v1/hostel-fees/invoices?student_id={student_id}", headers=headers_admin)
    assert resp.status_code == 200
    final_inv = next(i for i in resp.json() if i["id"] == test_inv_id)
    assert final_inv["balance"] == 0.0
    assert final_inv["status"] == "PAID"
