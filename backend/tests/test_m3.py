import pytest
import time
import random
from app.core.config import settings
from datetime import date, datetime, timedelta

def test_grade_scale_crud(client, admin_token):
    grade = f"{random.randint(0, 9)}X"
    # Create Grade Scale
    res = client.post("/api/v1/grade-scale", json={
        "grade": grade, "min_marks_pct": 90, "max_marks_pct": 100, "grade_points": 10.0
    }, headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 201
    gs_id = res.json()["id"]

    # Get
    res_get = client.get("/api/v1/grade-scale", headers={"Authorization": f"Bearer {admin_token}"})
    assert any(g["id"] == gs_id for g in res_get.json()["items"])

    # Update
    res_upd = client.patch(f"/api/v1/grade-scale/{gs_id}", json={"min_marks_pct": 91}, headers={"Authorization": f"Bearer {admin_token}"})
    assert res_upd.json()["min_marks_pct"] == 91

    # Delete
    res_del = client.delete(f"/api/v1/grade-scale/{gs_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_del.status_code == 204

def test_m3_workflow(client, admin_token, faculty_token, student_token):
    code = f"CS{random.randint(1000, 9999)}"
    
    # 1. Setup Course & Offering & Enrollment
    res_c = client.post("/api/v1/courses", json={"code": code, "title": "M3 Course", "credits": 4, "department_id": 1}, headers={"Authorization": f"Bearer {admin_token}"})
    course_id = res_c.json()["id"]
    
    # Find current active term
    terms_res = client.get("/api/v1/terms")
    current_term = next((t for t in terms_res.json() if t.get("is_current")), None)
    term_id = current_term["id"] if current_term else 1

    section = f"Z{random.randint(1,99)}"
    # Using faculty_id 1 which is assigned to faculty_token
    res_o = client.post("/api/v1/offerings", json={"course_id": course_id, "term_id": term_id, "faculty_id": 1, "section": section, "capacity": 30}, headers={"Authorization": f"Bearer {admin_token}"})
    oid = res_o.json()["id"]

    res_me = client.get("/api/v1/me", headers={"Authorization": f"Bearer {student_token}"})
    student_id = res_me.json()["student_id"]

    # Map course into student's program curriculum
    client.post("/api/v1/curriculum", json={"program_id": 1, "semester": 1, "course_id": course_id, "type": "CORE"}, headers={"Authorization": f"Bearer {admin_token}"})

    res_enr = client.post("/api/v1/enrollments", json={"student_id": student_id, "offering_id": oid}, headers={"Authorization": f"Bearer {admin_token}"})
    assert res_enr.status_code == 201, res_enr.text
    eid = res_enr.json()["id"]

    # 2. Mark Attendance
    # Faculty marks attendance
    session_data = {
        "offering_id": oid,
        "session_date": str(date.today()),
        "slot": "Morning",
        "records": [
            {"enrollment_id": eid, "status": "PRESENT"}
        ]
    }
    res_att = client.post("/api/v1/attendance/sessions", json=session_data, headers={"Authorization": f"Bearer {faculty_token}"})
    assert res_att.status_code == 201
    sess_id = res_att.json()["id"]

    # Check My Attendance
    res_my_att = client.get("/api/v1/me/attendance", headers={"Authorization": f"Bearer {student_token}"})
    assert res_my_att.status_code == 200
    assert any(a["offering_id"] == oid and a["attendance_pct"] == 100.0 for a in res_my_att.json())

    # 3. Create Exam
    exam_data = {
        "offering_id": oid,
        "exam_type": "FINAL",
        "exam_date": str(date.today() + timedelta(days=10)),
        "max_marks": 100,
        "reg_start_date": str(datetime.now() - timedelta(days=1)),
        "reg_end_date": str(datetime.now() + timedelta(days=5))
    }
    res_exam = client.post("/api/v1/exams", json=exam_data, headers={"Authorization": f"Bearer {admin_token}"})
    assert res_exam.status_code == 201
    exam_id = res_exam.json()["id"]

    # 4. Exam Registration
    res_reg = client.post("/api/v1/exam-registrations", json={"exam_id": exam_id}, headers={"Authorization": f"Bearer {student_token}"})
    assert res_reg.status_code == 201
    reg_id = res_reg.json()["id"]

    # 5. Marks Entry
    marks_data = {
        "marks": [
            {"registration_id": reg_id, "marks": 95}
        ]
    }
    res_marks = client.put(f"/api/v1/exams/{exam_id}/marks", json=marks_data, headers={"Authorization": f"Bearer {faculty_token}"})
    assert res_marks.status_code == 200

    # 6. Setup Grade Scale for processing
    client.post("/api/v1/grade-scale", json={"grade": "S", "min_marks_pct": 90, "max_marks_pct": 100, "grade_points": 10.0}, headers={"Authorization": f"Bearer {admin_token}"})

    # 7. Process & Publish Results
    res_proc = client.post("/api/v1/results/process", json={"exam_id": exam_id}, headers={"Authorization": f"Bearer {admin_token}"})
    assert res_proc.status_code == 200

    res_pub = client.post("/api/v1/results/publish", json={"exam_id": exam_id}, headers={"Authorization": f"Bearer {admin_token}"})
    assert res_pub.status_code == 200

    # 8. Check My Results
    res_my_res = client.get("/api/v1/me/results", headers={"Authorization": f"Bearer {student_token}"})
    assert res_my_res.status_code == 200
    
    # 9. Course Result Summary
    res_sum = client.get(f"/api/v1/exams/{exam_id}/summary", headers={"Authorization": f"Bearer {faculty_token}"})
    assert res_sum.status_code == 200
    assert res_sum.json()["total_passed"] == 1
