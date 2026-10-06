import pytest
import time
import random
from app.core.config import settings

def test_course_crud(client, admin_token):
    code = f"CS{random.randint(1000, 9999)}"
    # 1. Create Course
    res = client.post("/api/v1/courses", json={"code": code, "title": "Test Course", "credits": 4, "department_id": 1}, headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 201
    course_id = res.json()["id"]

    # 2. Get Courses
    res2 = client.get("/api/v1/courses?page_size=1000", headers={"Authorization": f"Bearer {admin_token}"})
    assert res2.status_code == 200
    assert any(c["id"] == course_id for c in res2.json()["items"])

    # 3. Update Course
    res3 = client.put(f"/api/v1/courses/{course_id}", json={"credits": 3}, headers={"Authorization": f"Bearer {admin_token}"})
    assert res3.status_code == 200
    assert res3.json()["credits"] == 3

def test_curriculum_crud(client, admin_token):
    code = f"CS{random.randint(1000, 9999)}"
    # Setup: Create Course
    res = client.post("/api/v1/courses", json={"code": code, "title": "Curr Course", "credits": 4, "department_id": 1}, headers={"Authorization": f"Bearer {admin_token}"})
    course_id = res.json()["id"]

    # 1. Create Curriculum
    res = client.post("/api/v1/curriculum", json={"program_id": 1, "semester": 1, "course_id": course_id, "type": "CORE"}, headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 201
    curr_id = res.json()["id"]

    # 2. Get Curriculum
    res2 = client.get("/api/v1/curriculum?program_id=1&semester=1&page_size=1000", headers={"Authorization": f"Bearer {admin_token}"})
    assert res2.status_code == 200
    assert any(c["id"] == curr_id for c in res2.json()["items"])

    # 3. Update Curriculum
    res3 = client.patch(f"/api/v1/curriculum/{curr_id}", json={"type": "ELECTIVE"}, headers={"Authorization": f"Bearer {admin_token}"})
    assert res3.status_code == 200
    assert res3.json()["type"] == "ELECTIVE"

    # 4. Delete Curriculum
    res4 = client.delete(f"/api/v1/curriculum/{curr_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert res4.status_code == 204

def test_offering_crud(client, admin_token):
    code = f"CS{random.randint(1000, 9999)}"
    # Setup Course
    res = client.post("/api/v1/courses", json={"code": code, "title": "Offering Course", "credits": 4, "department_id": 1}, headers={"Authorization": f"Bearer {admin_token}"})
    course_id = res.json()["id"]

    # 1. Create Offering
    res = client.post("/api/v1/offerings", json={"course_id": course_id, "term_id": 2, "faculty_id": 1, "section": "A1", "capacity": 30}, headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 201
    oid = res.json()["id"]

    # 2. Get Offerings
    res2 = client.get(f"/api/v1/offerings?term_id=2&page_size=1000", headers={"Authorization": f"Bearer {admin_token}"})
    assert res2.status_code == 200
    assert any(o["id"] == oid for o in res2.json()["items"])

    # 3. Update Offering
    res3 = client.put(f"/api/v1/offerings/{oid}", json={"capacity": 40}, headers={"Authorization": f"Bearer {admin_token}"})
    assert res3.status_code == 200
    assert res3.json()["capacity"] == 40

    # 4. Delete Offering
    res4 = client.delete(f"/api/v1/offerings/{oid}", headers={"Authorization": f"Bearer {admin_token}"})
    assert res4.status_code == 204

def test_enrollment_workflow(client, admin_token, student_token):
    code = f"CS{random.randint(1000, 9999)}"
    # Setup Course & Offering
    res = client.post("/api/v1/courses", json={"code": code, "title": "Enroll Course", "credits": 4, "department_id": 1}, headers={"Authorization": f"Bearer {admin_token}"})
    course_id = res.json()["id"]
    # use a unique section name so it doesn't collide
    section = f"Z{random.randint(1,99)}"
    res = client.post("/api/v1/offerings", json={"course_id": course_id, "term_id": 2, "faculty_id": 1, "section": section, "capacity": 30}, headers={"Authorization": f"Bearer {admin_token}"})
    oid = res.json()["id"]

    # Find student ID for the student token (Student1)
    res_me = client.get("/api/v1/me", headers={"Authorization": f"Bearer {student_token}"})
    student_uid = res_me.json()["id"]
    student_id = res_me.json()["student_id"]

    # 1. Admin Enrolls Student
    res_enr = client.post("/api/v1/enrollments", json={"student_id": student_id, "offering_id": oid}, headers={"Authorization": f"Bearer {admin_token}"})
    assert res_enr.status_code == 201
    eid = res_enr.json()["id"]

    # 2. Student views "My Courses"
    res_my = client.get("/api/v1/me/courses", headers={"Authorization": f"Bearer {student_token}"})
    assert res_my.status_code == 200
    assert any(c["enrollment_id"] == eid for c in res_my.json())

    # 3. Duplicate Enrollment is rejected
    res_dup = client.post("/api/v1/enrollments", json={"student_id": student_id, "offering_id": oid}, headers={"Authorization": f"Bearer {admin_token}"})
    assert res_dup.status_code == 409

    # 4. Admin withdraws student
    res_wd = client.patch(f"/api/v1/enrollments/{eid}/withdraw", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_wd.status_code == 200
    assert res_wd.json()["status"] == "WITHDRAWN"

def test_bulk_enrollment(client, admin_token):
    code = f"CS{random.randint(1000, 9999)}"
    # Setup
    res = client.post("/api/v1/courses", json={"code": code, "title": "Bulk Course", "credits": 4, "department_id": 1}, headers={"Authorization": f"Bearer {admin_token}"})
    course_id = res.json()["id"]
    section = f"X{random.randint(1,99)}"
    res = client.post("/api/v1/offerings", json={"course_id": course_id, "term_id": 2, "faculty_id": 1, "section": section, "capacity": 50}, headers={"Authorization": f"Bearer {admin_token}"})
    oid = res.json()["id"]

    # 1. Bulk Validation
    payload = {"policy": "SKIP_INVALID", "dry_run": True, "payload": [{"student_id": 1, "offering_id": oid}]}
    res_val = client.post("/api/v1/enrollments/bulk/validate", json=payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert res_val.status_code == 200
    assert res_val.json()["batch_id"] == "DRY-RUN"

    # 2. Bulk Execution
    payload["dry_run"] = False
    res_exec = client.post("/api/v1/enrollments/bulk", json=payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert res_exec.status_code == 200
    assert "batch_id" in res_exec.json()
    assert res_exec.json()["total_processed"] > 0 or res_exec.json()["total_success"] > 0
