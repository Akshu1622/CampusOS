#!/usr/bin/env python3
import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"

def login(username, password="password123"):
    data = urllib.parse.urlencode({"username": username, "password": password}).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}/auth/login",
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    try:
        with urllib.request.urlopen(req) as res:
            res_data = json.loads(res.read().decode("utf-8"))
            return res_data["access_token"]
    except urllib.error.HTTPError as e:
        print(f"Failed to login {username}: {e.code} {e.read().decode('utf-8')}")
        raise e

def api_call(path, method="GET", token=None, body=None):
    url = f"{BASE_URL}{path}"
    headers = {}
    data = None
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            raw = res.read().decode("utf-8")
            return res.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = raw
        return e.code, parsed

def main():
    print("Authenticating test accounts...", flush=True)
    tokens = {
        "admin": login("admin_core"),
        "faculty": login("faculty1"),
        "student": login("student1"),
        "student_low_att": login("student3") # 50% attendance
    }
    print("Authentication successful.\n", flush=True)

    results = []

    def check(endpoint, method, role, expected_status, body=None, description=""):
        token = tokens.get(role)
        status, resp = api_call(endpoint, method=method, token=token, body=body)
        passed = (status == expected_status)
        print(f"  {method:<6} {endpoint:<30} -> {status} (exp {expected_status}) {'OK' if passed else 'FAIL'}", flush=True)
        results.append({
            "endpoint": f"{method} {endpoint}",
            "role": role,
            "expected": expected_status,
            "actual": status,
            "passed": passed,
            "desc": description,
            "resp": resp
        })
        return status, resp

    print("Verifying M2 & M3 Endpoints...")

    # --- M2 Endpoints ---
    check("/courses", "GET", "admin", 200, description="List courses as Admin")
    check("/courses", "GET", "faculty", 200, description="List courses as Faculty")
    check("/courses", "GET", "student", 200, description="List courses as Student")
    check("/courses", "GET", None, 401, description="List courses unauthenticated")
    check("/courses/1", "GET", "admin", 200, description="Get course 1 as Admin")
    check("/courses", "POST", "faculty", 403, body={"code": "XX999", "title": "Test", "credits": 3, "department_id": 1}, description="Faculty cannot create course")

    check("/curriculum", "GET", "admin", 200, description="List curriculum as Admin")
    check("/curriculum", "GET", "student", 200, description="List curriculum as Student")
    check("/curriculum", "POST", "student", 403, body={"program_id": 1, "semester": 1, "course_id": 1, "type": "CORE"}, description="Student cannot create curriculum")

    check("/offerings", "GET", "admin", 200, description="List offerings as Admin")
    check("/offerings/1", "GET", "admin", 200, description="Get offering 1 as Admin")
    check("/offerings", "POST", "faculty", 403, body={"course_id": 1, "term_id": 2, "faculty_id": 1, "section": "Z", "capacity": 30}, description="Faculty cannot create offering")

    check("/enrollments", "GET", "admin", 200, description="List enrollments as Admin")
    check("/enrollments", "GET", "student", 403, description="Student cannot list all enrollments")
    check("/enrollments/1", "GET", "admin", 200, description="Get enrollment 1 as Admin")

    check("/me/courses", "GET", "student", 200, description="Student views own courses")
    check("/me/courses", "GET", "faculty", 403, description="Faculty cannot view student own courses")

    check("/faculty/me/offerings", "GET", "faculty", 200, description="Faculty views assigned offerings")
    check("/faculty/me/offerings", "GET", "student", 403, description="Student cannot view faculty offerings")

    check("/offerings/1/roster", "GET", "admin", 200, description="Admin views offering 1 roster")
    check("/offerings/1/roster", "GET", "faculty", 200, description="Faculty views assigned offering roster")
    check("/offerings/1/roster", "GET", "student", 403, description="Student cannot view offering roster")

    check("/enrollments/bulk/validate", "POST", "admin", 200, body={
        "policy": "SKIP_INVALID",
        "dry_run": True,
        "payload": [{"student_id": 1, "offering_id": 2}]
    }, description="Bulk enrollment validate preview")

    # --- M3 Endpoints ---
    check("/attendance/sessions", "GET", "admin", 200, description="Admin views attendance sessions")
    check("/attendance/sessions", "GET", "faculty", 200, description="Faculty views attendance sessions")
    check("/attendance/sessions", "GET", "student", 403, description="Student cannot view attendance sessions")
    check("/attendance/sessions/1", "GET", "admin", 200, description="Admin views session 1 with records")

    check("/me/attendance", "GET", "student", 200, description="Student views own attendance")
    check("/me/attendance", "GET", "faculty", 403, description="Faculty cannot view student attendance")

    check("/attendance/shortage", "GET", "admin", 200, description="Admin views attendance shortage")
    check("/attendance/shortage", "GET", "student", 403, description="Student cannot view attendance shortage")

    check("/grade-scale", "GET", "admin", 200, description="Admin views grade scale")
    check("/grade-scale", "GET", "student", 403, description="Student cannot view grade scale")
    check("/grade-scale/1", "GET", "admin", 200, description="Admin views grade scale 1")

    check("/exams", "GET", "admin", 200, description="Admin views exams")
    check("/exams", "GET", "student", 200, description="Student views exams")
    check("/exams/1", "GET", "admin", 200, description="Admin views exam 1")
    check("/exams", "POST", "student", 403, body={
        "offering_id": 1, "exam_type": "MIDTERM", "exam_date": "2024-03-01",
        "max_marks": 50, "reg_start_date": "2024-01-01T00:00:00", "reg_end_date": "2024-02-01T00:00:00"
    }, description="Student cannot create exam")

    check("/exam-registrations", "GET", "admin", 200, description="Admin views exam registrations")
    check("/exam-registrations", "GET", "student", 403, description="Student cannot view all exam registrations")

    check("/exams/1/marks", "GET", "admin", 200, description="Admin views exam marks")
    check("/exams/1/marks", "GET", "faculty", 200, description="Faculty views exam marks")
    check("/exams/1/marks", "GET", "student", 403, description="Student cannot view all marks")

    check("/exams/1/summary", "GET", "admin", 200, description="Admin views course result summary")
    check("/exams/1/summary", "GET", "faculty", 200, description="Faculty views course result summary")
    check("/exams/1/summary", "GET", "student", 403, description="Student cannot view exam summary")

    check("/me/results", "GET", "student", 200, description="Student views own results")
    check("/me/cgpa", "GET", "student", 200, description="Student views own CGPA")

    # --- Negative Business Rule Tests ---
    print("\nVerifying Domain Rejection Mappings...")
    
    # 1. Attendance < 75% on exam registration
    # First, let's create an exam with open registration for offering 1
    # Check if we can create a temporary exam for testing
    st, exam_res = check("/exams", "POST", "admin", 201, body={
        "offering_id": 1,
        "exam_type": "QUIZ_REPAIR",
        "exam_date": "2026-11-01",
        "max_marks": 25.0,
        "reg_start_date": "2024-01-01T00:00:00",
        "reg_end_date": "2030-01-01T00:00:00"
    }, description="Create test exam for negative tests")

    if st == 201:
        test_exam_id = exam_res["id"]
        # Student 3 has 50% attendance on offering 1 -> must return 403 ATTENDANCE_BELOW_THRESHOLD
        st_reg, resp_reg = check("/exam-registrations", "POST", "student_low_att", 403, body={
            "exam_id": test_exam_id
        }, description="Reject exam registration for attendance < 75%")
        
        # Verify message
        if isinstance(resp_reg, dict):
            code = resp_reg.get("code")
            msg = resp_reg.get("message", "")
            print(f"  Attendance rejection response: code={code}, message='{msg}'")
            if code != "ATTENDANCE_BELOW_THRESHOLD" or "75%" not in msg:
                print("  [FAIL] Expected ATTENDANCE_BELOW_THRESHOLD with message mentioning 75%")
                results[-1]["passed"] = False
            else:
                print("  [PASS] Correctly mapped to 403 ATTENDANCE_BELOW_THRESHOLD with exact message")

        # 2. Student 1 has 100% attendance -> should register successfully (201)
        st_reg1, resp_reg1 = check("/exam-registrations", "POST", "student", 201, body={
            "exam_id": test_exam_id
        }, description="Student 1 (100% att) registers successfully")

        # 3. Duplicate exam registration -> 409 EXAM_DUPLICATE_REGISTRATION
        st_dup, resp_dup = check("/exam-registrations", "POST", "student", 409, body={
            "exam_id": test_exam_id
        }, description="Reject duplicate exam registration")
        if isinstance(resp_dup, dict):
            code = resp_dup.get("code")
            print(f"  Duplicate exam registration: code={code}")
            if code != "EXAM_DUPLICATE_REGISTRATION":
                print("  [FAIL] Expected code EXAM_DUPLICATE_REGISTRATION")
                results[-1]["passed"] = False

        # Cleanup test exam registrations and then the exam
        import pymysql
        db_conn = pymysql.connect(host="localhost", port=3306, user="root", password="rootpassword", database="university_erp")
        with db_conn.cursor() as cur:
            cur.execute("DELETE FROM exam_registration WHERE exam_id = %s", (test_exam_id,))
        db_conn.commit()
        db_conn.close()

        check(f"/exams/{test_exam_id}", "DELETE", "admin", 204, description="Cleanup test exam")

    # 4. Duplicate enrollment rejection
    st_enr, resp_enr = check("/enrollments", "POST", "admin", 409, body={
        "student_id": 1,
        "offering_id": 1
    }, description="Reject duplicate enrollment")
    if isinstance(resp_enr, dict):
        code = resp_enr.get("code")
        print(f"  Duplicate enrollment: code={code}")
        if code != "DUPLICATE_ENROLLMENT":
            print("  [FAIL] Expected code DUPLICATE_ENROLLMENT")
            results[-1]["passed"] = False

    # 5. Offering capacity full rejection
    # Offering 1 has capacity 5 and 5 active enrollments
    # Student 6 is not enrolled in offering 1
    st_full, resp_full = check("/enrollments", "POST", "admin", 409, body={
        "student_id": 6,
        "offering_id": 1
    }, description="Reject enrollment into full offering")
    if isinstance(resp_full, dict):
        code = resp_full.get("code")
        print(f"  Full capacity enrollment: code={code}")
        if code != "ENROLLMENT_CAPACITY_FULL":
            print("  [FAIL] Expected code ENROLLMENT_CAPACITY_FULL")
            results[-1]["passed"] = False

    # 6. Publishing already-published results -> 409 RESULT_ALREADY_PUBLISHED
    st_pub, resp_pub = check("/results/publish", "POST", "admin", 409, body={
        "exam_id": 1
    }, description="Reject publishing already-published result")
    if isinstance(resp_pub, dict):
        code = resp_pub.get("code")
        print(f"  Already published result: code={code}")
        if code != "RESULT_ALREADY_PUBLISHED":
            print("  [FAIL] Expected code RESULT_ALREADY_PUBLISHED")
            results[-1]["passed"] = False

    # 7. Marks entry above max_marks -> 400 MARKS_OUT_OF_BOUNDS
    st_m, resp_m = check("/exams/1/marks", "PUT", "admin", 400, body={
        "marks": [{"registration_id": 1, "marks": 150.0}]
    }, description="Reject marks exceeding max marks")
    if isinstance(resp_m, dict):
        code = resp_m.get("code")
        print(f"  Marks out of bounds: code={code}")
        if code != "MARKS_OUT_OF_BOUNDS":
            print("  [FAIL] Expected code MARKS_OUT_OF_BOUNDS")
            results[-1]["passed"] = False

    # Print summary table
    print("\n" + "="*80)
    print(f"{'Endpoint':<35} | {'Role':<8} | {'Exp':<4} | {'Act':<4} | {'Status':<6} | {'Description'}")
    print("="*80)
    failed_count = 0
    for r in results:
        status_str = "PASS" if r["passed"] else "FAIL"
        if not r["passed"]:
            failed_count += 1
        print(f"{r['endpoint']:<35} | {str(r['role']):<8} | {r['expected']:<4} | {r['actual']:<4} | {status_str:<6} | {r['desc']}")
    print("="*80)
    print(f"Total Tests: {len(results)}, Passed: {len(results) - failed_count}, Failed: {failed_count}")

    if failed_count > 0:
        print("\n[FAILED] Some API checks did not pass.")
        sys.exit(1)
    else:
        print("\n[SUCCESS] All M2 and M3 API checks passed perfectly!")
        sys.exit(0)

if __name__ == "__main__":
    main()
