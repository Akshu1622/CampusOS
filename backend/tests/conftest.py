import os
import pytest
import subprocess
import sys
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from app.main import app
from app.db.engine import engine

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Skipping db_reset.py to prevent wiping out users/data that were already set up
    yield
    
@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="session")
def admin_token(client):
    res = client.post("/api/v1/auth/login", data={"username": "admin_core", "password": "password123"})
    return res.json()["access_token"]

@pytest.fixture(scope="session")
def student_token(client):
    res = client.post("/api/v1/auth/login", data={"username": "student1", "password": "password123"})
    return res.json()["access_token"]

@pytest.fixture(scope="session")
def faculty_token(client):
    res = client.post("/api/v1/auth/login", data={"username": "faculty1", "password": "password123"})
    return res.json()["access_token"]
