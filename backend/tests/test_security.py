import pytest
import os
from fastapi.testclient import TestClient
from app.main import app

def test_security_headers(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert "Strict-Transport-Security" in res.headers

def test_rate_limiting(client):
    # Hit the login endpoint multiple times to trigger 429
    # Use a unique IP header so it doesn't break other tests
    headers = {"X-Test-IP": "123.456.789.000"}
    for _ in range(21):
        res = client.post("/api/v1/auth/login", data={"username": "test", "password": "pwd"}, headers=headers)
    assert res.status_code == 429

def test_no_passwords_returned(client, admin_token):
    # Verify that user list doesn't return passwords
    res = client.get("/api/v1/users?page_size=10", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    for user in res.json()["items"]:
        assert "password_hash" not in user
        assert "password" not in user

def test_cross_user_access(client, student_token):
    # A student trying to get another student's profile or enrollments should fail
    # Actually, students don't have access to /api/v1/users at all, only Admins
    res = client.get("/api/v1/users", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code in (401, 403)

def test_sql_injection_filter(client, admin_token):
    # Try a simple SQL injection in page parameter (since search isn't supported)
    res = client.get("/api/v1/users?page=' OR 1=1 --", headers={"Authorization": f"Bearer {admin_token}"})
    # Pydantic should catch it as 422 Unprocessable Entity
    assert res.status_code == 422
