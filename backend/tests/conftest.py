"""Pytest fixtures and configuration."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import settings
from app.database import Base, get_db
from app.main import app
from app.models.category import Category
from app.models.store import Store
from app.models.user import User
from app.security import hash_password

# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Seed standard category
    cat = Category(name="Textbooks", slug="textbooks", icon="📚", sort_order=1)
    db.add(cat)
    db.commit()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def student_user(db_session):
    user = User(
        email="student@ssn.edu.in",
        password_hash=hash_password("Student@123"),
        full_name="Student Test",
        department="IT",
        year_of_study=2,
        role="student",
        is_verified=True,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def student_headers(client, student_user):
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": student_user.email, "password": "Student@123"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def seller_user(db_session):
    user = User(
        email="seller@ssn.edu.in",
        password_hash=hash_password("Student@123"),
        full_name="Seller Test",
        department="CSE",
        year_of_study=4,
        role="student",
        is_verified=True,
        is_active=True,
        has_storefront=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    store = Store(
        owner_id=user.id,
        name="Test Seller Store",
        bio="Test Store Bio",
        pickup_location_hint="Hostel Gate",
        is_active=True,
    )
    db_session.add(store)
    db_session.commit()
    db_session.refresh(store)
    return user


@pytest.fixture
def seller_headers(client, seller_user):
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": seller_user.email, "password": "Student@123"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_user(db_session):
    user = User(
        email="admin@ssn.edu.in",
        password_hash=hash_password("Admin@12345"),
        full_name="Admin Test",
        department="IT",
        year_of_study=4,
        role="admin",
        is_verified=True,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_headers(client, admin_user):
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": admin_user.email, "password": "Admin@12345"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
