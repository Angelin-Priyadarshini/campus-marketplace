"""Authentication tests."""
import pytest
from app.config import settings
from app.models.notification import AuthToken


def test_register_success(client):
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newstudent@ssn.edu.in",
            "password": "Password123",
            "full_name": "New Student",
            "department": "IT",
            "year_of_study": 2,
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "newstudent@ssn.edu.in"
    assert data["full_name"] == "New Student"


def test_register_invalid_domain(client, monkeypatch):
    monkeypatch.setattr(settings, "allow_any_email", False)
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "hacker@gmail.com",
            "password": "Password123",
            "full_name": "Bad Actor",
        },
    )
    assert resp.status_code == 422
    assert "allowed campus domain" in resp.json()["detail"]


def test_register_weak_password(client):
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "weak@ssn.edu.in",
            "password": "short",
            "full_name": "Weak Pwd",
        },
    )
    assert resp.status_code == 422


def test_login_success(client, student_user):
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "student@ssn.edu.in", "password": "Student@123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "refresh_token" in resp.cookies


def test_login_invalid_password(client, student_user):
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "student@ssn.edu.in", "password": "WrongPassword1"},
    )
    assert resp.status_code == 401


def test_login_suspended_user(client, student_user, db_session):
    student_user.is_active = False
    db_session.commit()

    resp = client.post(
        "/api/v1/auth/login",
        json={"email": student_user.email, "password": "Student@123"},
    )
    assert resp.status_code == 403
    assert "suspended" in resp.json()["detail"].lower()


def test_refresh_token(client, student_user):
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": student_user.email, "password": "Student@123"},
    )
    refresh_cookie = login_resp.cookies.get("refresh_token")

    refresh_resp = client.post("/api/v1/auth/refresh", cookies={"refresh_token": refresh_cookie})
    assert refresh_resp.status_code == 200
    assert "access_token" in refresh_resp.json()


def test_logout(client):
    resp = client.post("/api/v1/auth/logout")
    assert resp.status_code == 200
