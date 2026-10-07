"""
Smoke test for CampusOS API.
Tests all major endpoints respond without 5xx errors.
Ref: docs/DEMO_CREDENTIALS.md
"""
import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"

ERRORS = []

def login(username: str, password: str) -> str:
    resp = requests.post(f"{BASE_URL}/auth/login", data={"username": username, "password": password})
    if resp.status_code != 200:
        print(f"FAIL: Login for {username}: {resp.status_code} {resp.text}")
        sys.exit(1)
    return resp.json()["access_token"]

def check(endpoint: str, token: str, label: str = ""):
    """GET endpoint and assert no 5xx or 422. 404 is tolerated, 403 is tolerated."""
    url = f"{BASE_URL}{endpoint}"
    resp = requests.get(url, headers={"Authorization": f"Bearer {token}"})
    tag = label or endpoint
    if resp.status_code >= 500:
        print(f"  ERROR 5xx [{resp.status_code}] {tag}")
        ERRORS.append(tag)
    elif resp.status_code == 422:
        print(f"  ERROR 422  {tag}  {resp.text[:200]}")
        ERRORS.append(tag)
    else:
        print(f"  OK    {resp.status_code}  {tag}")


def main():
    print("--- Logging in ---")
    admin_token   = login("admin_core", "password123")
    faculty_token = login("faculty1", "password123")
    student_token = login("student1", "password123")

    print("\n--- Admin endpoints ---")
    admin_endpoints = [
        "/departments",
        "/programs",
        "/terms",
        "/users",
        "/roles",
        "/students",
        "/courses",
        "/curriculum",
        "/offerings",
        "/enrollments",
        "/grade-scale",
        "/attendance/sessions",
        "/attendance/shortage",
        "/exams",
        "/fee-structures",
        "/payments",
        "/fees/defaulters",
        "/employees",
        "/designations",
        "/leave-types",
        "/salary-structures",
        "/hostels",
        "/rooms",
        "/hostel-requests",
        "/analytics/dashboard/admin",
        "/analytics/audit-logs",
        "/analytics/integrity/checks",
    ]
    for ep in admin_endpoints:
        check(ep, admin_token)

    print("\n--- Faculty endpoints ---")
    faculty_endpoints = [
        "/me",
        "/faculty/me/offerings",
        "/analytics/dashboard/faculty",
        "/me/attendance",
        "/me/payslips",
    ]
    for ep in faculty_endpoints:
        check(ep, faculty_token)

    print("\n--- Student endpoints ---")
    student_endpoints = [
        "/me",
        "/me/courses",
        "/me/dues",
        "/me/payments",
        "/me/attendance",
        "/me/results",
        "/me/cgpa",
        "/me/hostel",
        "/me/hostel-requests",
        "/analytics/dashboard/student",
    ]
    for ep in student_endpoints:
        check(ep, student_token)

    total = len(admin_endpoints) + len(faculty_endpoints) + len(student_endpoints)
    print(f"\n--- Smoke test done. {total} endpoints tested. {len(ERRORS)} errors ---")
    if ERRORS:
        print("Failed endpoints:")
        for e in ERRORS:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("ALL OK")


if __name__ == "__main__":
    main()
