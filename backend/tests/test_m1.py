import pytest
from fastapi.testclient import TestClient
from app.core.config import settings
from app.db.engine import engine

def test_app_user_least_privilege():
    # Assert that the configured DB user is the app account, not migrator
    assert settings.MYSQL_APP_USER == "app", "API must connect as the 'app' user!"
    
def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_login_success(client):
    res = client.post("/api/v1/auth/login", data={"username": "admin_core", "password": "password123"})
    assert res.status_code == 200
    assert "access_token" in res.json()
    assert "refresh_token" in res.json()

def test_login_failure_and_lockout(client):
    for _ in range(5):
        res = client.post("/api/v1/auth/login", data={"username": "student2", "password": "wrong"})
        assert res.status_code == 401 or res.status_code == 403
        
    # The 6th attempt should return 403 Account Locked
    res = client.post("/api/v1/auth/login", data={"username": "student2", "password": "wrong"})
    assert res.status_code == 403
    assert res.json()["code"] == "ACCOUNT_LOCKED"

def test_refresh_token(client):
    res = client.post("/api/v1/auth/login", data={"username": "faculty1", "password": "password123"})
    refresh = res.json()["refresh_token"]
    
    res2 = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert res2.status_code == 200
    assert "access_token" in res2.json()
    assert "refresh_token" in res2.json()
    
    # Try reusing old refresh token (should be revoked)
    res3 = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert res3.status_code == 401
    
    # Logout using new refresh token
    new_refresh = res2.json()["refresh_token"]
    res4 = client.post("/api/v1/auth/logout", json={"refresh_token": new_refresh})
    assert res4.status_code == 204
    
    # Attempt to refresh after logout
    res5 = client.post("/api/v1/auth/refresh", json={"refresh_token": new_refresh})
    assert res5.status_code == 401

def test_get_me(client, admin_token):
    res = client.get("/api/v1/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert res.json()["username"] == "admin_core"

def test_role_based_access(client, admin_token, student_token):
    # Admin can access /users
    res = client.get("/api/v1/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert "items" in res.json()
    
    # Student cannot access /users
    res = client.get("/api/v1/users", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 403
    assert res.json()["code"] == "FORBIDDEN"

def test_ownership_or_role(client, student_token, admin_token):
    # First get student's user ID (student1 is usually user ID 1 or 5 depending on seed)
    res = client.get("/api/v1/me", headers={"Authorization": f"Bearer {student_token}"})
    student_uid = res.json()["id"]
    
    # Student can get their own user profile
    res2 = client.get(f"/api/v1/users/{student_uid}", headers={"Authorization": f"Bearer {student_token}"})
    assert res2.status_code == 200
    
    # Student cannot get someone else's profile (admin is 1)
    # Actually wait, student1 might be ID 5, admin is ID 1
    if student_uid != 1:
        res3 = client.get(f"/api/v1/users/1", headers={"Authorization": f"Bearer {student_token}"})
        assert res3.status_code == 403
        
    # Admin can get student's profile
    res4 = client.get(f"/api/v1/users/{student_uid}", headers={"Authorization": f"Bearer {admin_token}"})
    assert res4.status_code == 200

def test_validation_failure(client, admin_token):
    # Missing required fields
    res = client.post("/api/v1/students", json={"first_name": "Test"}, headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 422 # Pydantic validation error
    
def test_pagination(client, admin_token):
    res = client.get("/api/v1/students?page=1&page_size=5", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 5
    assert data["total"] > 0
    assert data["page"] == 1
    assert data["page_size"] == 5
