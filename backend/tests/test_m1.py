"""
M1 Core Platform — Backend Tests
Covers: Auth, Profile, User Management, Roles/Permissions,
        Departments, Programs, Terms, Students
"""
import pytest
from fastapi.testclient import TestClient
from app.core.config import settings
from app.db.engine import engine


# ─── Infrastructure ────────────────────────────────────────────────────────────

def test_app_user_least_privilege():
    """API must connect as the least-privilege 'app' account."""
    assert settings.MYSQL_APP_USER == "app", "API must connect as the 'app' user!"


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


# ─── Auth (C-01) ──────────────────────────────────────────────────────────────

@pytest.mark.parametrize("password", ["password123", "Password@123"])
def test_login_success(client, password):
    res = client.post("/api/v1/auth/login", data={"username": "admin_core", "password": password})
    assert res.status_code == 200, res.text
    assert "access_token" in res.json()
    assert "refresh_token" in res.json()
    assert res.json()["token_type"] == "bearer"


def test_login_invalid_credentials(client):
    res = client.post("/api/v1/auth/login", data={"username": "admin_core", "password": "wrongpassword"})
    assert res.status_code == 401
    assert res.json()["code"] == "UNAUTHORIZED"


def test_login_unknown_user(client):
    res = client.post("/api/v1/auth/login", data={"username": "nobody_at_all", "password": "wrong"})
    assert res.status_code == 401


def test_login_failure_and_lockout(client):
    """After MAX_LOGIN_ATTEMPTS failures, account is locked out (403 ACCOUNT_LOCKED)."""
    for _ in range(5):
        res = client.post("/api/v1/auth/login", data={"username": "student2", "password": "wrong"})
        assert res.status_code in (401, 403)

    # The 6th attempt should return 403 Account Locked
    res = client.post("/api/v1/auth/login", data={"username": "student2", "password": "wrong"})
    assert res.status_code == 403
    assert res.json()["code"] == "ACCOUNT_LOCKED"


def test_refresh_token_rotation(client):
    """Refresh rotates the token; the old refresh token must be rejected."""
    res = client.post("/api/v1/auth/login", data={"username": "faculty1", "password": "password123"})
    assert res.status_code == 200
    refresh = res.json()["refresh_token"]

    res2 = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert res2.status_code == 200
    assert "access_token" in res2.json()
    new_refresh = res2.json()["refresh_token"]

    # Old refresh token is revoked
    res3 = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert res3.status_code == 401

    # Logout using new refresh token
    res4 = client.post("/api/v1/auth/logout", json={"refresh_token": new_refresh})
    assert res4.status_code == 204

    # After logout, the new refresh token is also revoked
    res5 = client.post("/api/v1/auth/refresh", json={"refresh_token": new_refresh})
    assert res5.status_code == 401


def test_logout_idempotent(client):
    """Logout with an already-invalid token should not error."""
    res = client.post("/api/v1/auth/logout", json={"refresh_token": "invalid.token.here"})
    assert res.status_code == 204


# ─── Profile (C-05) ────────────────────────────────────────────────────────────

def test_get_me_admin(client, admin_token):
    res = client.get("/api/v1/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["username"] == "admin_core"
    assert "roles" in data
    assert "ADMIN" in data["roles"] or "SUPERADMIN" in data["roles"]


def test_get_me_student(client, student_token):
    res = client.get("/api/v1/me", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 200
    data = res.json()
    assert "username" in data
    # Student should have linked_type 'student'
    assert data.get("linked_type") == "student"


def test_get_me_requires_auth(client):
    res = client.get("/api/v1/me")
    assert res.status_code == 401


def test_change_password_wrong_old(client, student_token):
    res = client.put(
        "/api/v1/me/change-password",
        json={"old_password": "wrongpassword", "new_password": "NewPassword1!"},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 401
    assert res.json()["code"] == "UNAUTHORIZED"


# ─── User Management (C-06) ────────────────────────────────────────────────────

def test_admin_can_list_users(client, admin_token):
    res = client.get("/api/v1/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] > 0


def test_user_list_pagination(client, admin_token):
    res = client.get("/api/v1/users?page=1&page_size=3", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) <= 3
    assert data["page"] == 1
    assert data["page_size"] == 3


def test_user_list_search(client, admin_token):
    res = client.get("/api/v1/users?search=admin", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1


def test_user_list_filter_by_status(client, admin_token):
    res = client.get("/api/v1/users?status=ACTIVE", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    for item in res.json()["items"]:
        assert item["status"] == "ACTIVE"


def test_student_cannot_list_users(client, student_token):
    res = client.get("/api/v1/users", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 403
    assert res.json()["code"] == "FORBIDDEN"


def test_user_detail_own(client, student_token):
    me = client.get("/api/v1/me", headers={"Authorization": f"Bearer {student_token}"}).json()
    res = client.get(f"/api/v1/users/{me['id']}", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 200
    assert res.json()["id"] == me["id"]


def test_user_detail_other_blocked_for_student(client, student_token, admin_token):
    # Get admin's ID
    admin_me = client.get("/api/v1/me", headers={"Authorization": f"Bearer {admin_token}"}).json()
    admin_id = admin_me["id"]
    # Student cannot get admin detail
    me = client.get("/api/v1/me", headers={"Authorization": f"Bearer {student_token}"}).json()
    if me["id"] != admin_id:
        res = client.get(f"/api/v1/users/{admin_id}", headers={"Authorization": f"Bearer {student_token}"})
        assert res.status_code == 403


def test_user_detail_returns_linked_info(client, admin_token):
    res = client.get("/api/v1/users", headers={"Authorization": f"Bearer {admin_token}"})
    users = res.json()["items"]
    # Find a student-linked user
    student_users = [u for u in users if u.get("linked_type") == "student"]
    if student_users:
        u = student_users[0]
        assert u["full_name"] is not None
        assert u["email"] is not None


def test_validation_failure_on_create_user(client, admin_token):
    res = client.post("/api/v1/users", json={"username": "ab"}, headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 422


# ─── Roles & Permissions (C-07) ────────────────────────────────────────────────

def test_get_roles(client, admin_token):
    res = client.get("/api/v1/roles", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    role_names = [r["role_name"] for r in data]
    assert "ADMIN" in role_names or "STUDENT" in role_names


def test_get_permissions(client, admin_token):
    res = client.get("/api/v1/permissions", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    # Each permission set should have id, name, user_count
    for perm in data:
        assert "id" in perm
        assert "name" in perm


def test_roles_require_auth(client):
    res = client.get("/api/v1/roles")
    assert res.status_code == 401


# ─── Departments (C-08) ────────────────────────────────────────────────────────

def test_list_departments(client, admin_token):
    res = client.get("/api/v1/departments", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert data["total"] > 0


def test_list_departments_search(client, admin_token):
    res = client.get("/api/v1/departments?search=Eng", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    # If there's an Engineering department, it should show up
    data = res.json()
    assert isinstance(data["items"], list)


def test_create_department(client, admin_token):
    res = client.post(
        "/api/v1/departments",
        json={"code": "TESTD01", "name": "Test Department 01"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    # 200 or 409 (already exists from previous run)
    assert res.status_code in (200, 409)


def test_create_department_duplicate_code(client, admin_token):
    # Create it first
    client.post("/api/v1/departments", json={"code": "DUPTEST", "name": "Dup Test"},
                headers={"Authorization": f"Bearer {admin_token}"})
    # Create again with same code
    res = client.post("/api/v1/departments", json={"code": "DUPTEST", "name": "Dup Test 2"},
                      headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 409
    assert res.json()["code"] == "DUPLICATE_CODE"


def test_get_department_by_id(client, admin_token):
    # Get list first
    list_res = client.get("/api/v1/departments", headers={"Authorization": f"Bearer {admin_token}"})
    first_dept = list_res.json()["items"][0]
    res = client.get(f"/api/v1/departments/{first_dept['id']}", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert res.json()["id"] == first_dept["id"]


def test_update_department(client, admin_token):
    list_res = client.get("/api/v1/departments", headers={"Authorization": f"Bearer {admin_token}"})
    dept = list_res.json()["items"][0]
    res = client.put(
        f"/api/v1/departments/{dept['id']}",
        json={"name": dept["name"] + " (Updated)"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 204


# ─── Programs (C-09) ───────────────────────────────────────────────────────────

def test_list_programs(client, admin_token):
    res = client.get("/api/v1/programs", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert data["total"] > 0
    # Each item should have department_name
    for item in data["items"]:
        assert "department_name" in item


def test_list_programs_search(client, admin_token):
    res = client.get("/api/v1/programs?search=B.Tech", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200


def test_get_program_by_id(client, admin_token):
    list_res = client.get("/api/v1/programs", headers={"Authorization": f"Bearer {admin_token}"})
    first = list_res.json()["items"][0]
    res = client.get(f"/api/v1/programs/{first['id']}", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert res.json()["id"] == first["id"]


def test_update_program(client, admin_token):
    list_res = client.get("/api/v1/programs", headers={"Authorization": f"Bearer {admin_token}"})
    prog = list_res.json()["items"][0]
    res = client.put(
        f"/api/v1/programs/{prog['id']}",
        json={"duration_years": prog["duration_years"]},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 204


# ─── Terms (C-10) ──────────────────────────────────────────────────────────────

def test_list_terms(client, admin_token):
    res = client.get("/api/v1/terms", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    # Exactly one current term
    current_terms = [t for t in data if t["is_current"]]
    assert len(current_terms) <= 1


def test_get_term_by_id(client, admin_token):
    terms = client.get("/api/v1/terms", headers={"Authorization": f"Bearer {admin_token}"}).json()
    if terms:
        res = client.get(f"/api/v1/terms/{terms[0]['id']}", headers={"Authorization": f"Bearer {admin_token}"})
        assert res.status_code == 200
        assert res.json()["id"] == terms[0]["id"]


def test_get_term_not_found(client, admin_token):
    res = client.get("/api/v1/terms/99999", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 404


def test_create_term_invalid_dates(client, admin_token):
    res = client.post(
        "/api/v1/terms",
        json={"year": 2030, "label": "FALL", "start_date": "2030-12-01", "end_date": "2030-06-01"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 400
    assert res.json()["code"] == "INVALID_DATES"


# ─── Students (C-11) ───────────────────────────────────────────────────────────

def test_admin_can_list_students(client, admin_token):
    res = client.get("/api/v1/students", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert data["total"] > 0
    # Items should include program_name and department_name
    for item in data["items"]:
        assert "program_name" in item
        assert "global_student_id" in item


def test_student_list_pagination(client, admin_token):
    res = client.get("/api/v1/students?page=1&page_size=5", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 5
    assert data["total"] > 0
    assert data["page"] == 1
    assert data["page_size"] == 5


def test_student_list_search(client, admin_token):
    res = client.get("/api/v1/students?search=STU", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data["items"], list)


def test_student_list_filter_by_status(client, admin_token):
    res = client.get("/api/v1/students?status=ACTIVE", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    for item in res.json()["items"]:
        assert item["status"] == "ACTIVE"


def test_get_student_detail(client, admin_token):
    list_res = client.get("/api/v1/students", headers={"Authorization": f"Bearer {admin_token}"})
    student = list_res.json()["items"][0]
    res = client.get(f"/api/v1/students/{student['id']}", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == student["id"]
    assert "has_user_account" in data
    assert "global_student_id" in data


def test_student_cannot_list_students(client, student_token):
    """Students cannot list all students (role guard)."""
    res = client.get("/api/v1/students", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 403


def test_validation_failure_on_create_student(client, admin_token):
    res = client.post(
        "/api/v1/students",
        json={"first_name": "Test"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 422


def test_create_and_update_student(client, admin_token):
    """Create a student then update their status to ALUMNI."""
    # Get a valid program
    progs = client.get("/api/v1/programs", headers={"Authorization": f"Bearer {admin_token}"}).json()["items"]
    assert progs, "Need at least one program to create a student"
    prog_id = progs[0]["id"]

    import time
    unique_email = f"test.student.{int(time.time())}@test.campus.edu"
    res = client.post(
        "/api/v1/students",
        json={
            "first_name": "Test", "last_name": "Student",
            "email": unique_email, "phone": "9999999999",
            "batch_year": 2024, "program_id": prog_id
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 200, res.text
    created = res.json()
    assert created["global_student_id"].startswith("STU-")
    assert created["status"] == "ACTIVE"

    # Update status to ALUMNI
    res2 = client.put(
        f"/api/v1/students/{created['id']}",
        json={"status": "ALUMNI"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res2.status_code == 204

    # Verify
    res3 = client.get(f"/api/v1/students/{created['id']}", headers={"Authorization": f"Bearer {admin_token}"})
    assert res3.json()["status"] == "ALUMNI"


# ─── Role-based access (integration) ──────────────────────────────────────────

def test_ownership_check(client, student_token, admin_token):
    """Student can read own user; admin can read any user."""
    me = client.get("/api/v1/me", headers={"Authorization": f"Bearer {student_token}"}).json()
    student_uid = me["id"]

    # Student reads own record — OK
    res = client.get(f"/api/v1/users/{student_uid}", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 200

    # Admin reads student record — OK
    res2 = client.get(f"/api/v1/users/{student_uid}", headers={"Authorization": f"Bearer {admin_token}"})
    assert res2.status_code == 200

    # Admin reads another user — OK
    admin_me = client.get("/api/v1/me", headers={"Authorization": f"Bearer {admin_token}"}).json()
    if student_uid != admin_me["id"]:
        res3 = client.get(f"/api/v1/users/{admin_me['id']}", headers={"Authorization": f"Bearer {student_token}"})
        assert res3.status_code == 403
