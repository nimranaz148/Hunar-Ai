"""Acceptance tests for Mentor Application (Task 45 / F-040 / PRD §10 W-006, §13.2)."""

import uuid
from collections.abc import AsyncGenerator
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.database import get_db
from app.main import app
from app.models.user import User


@pytest.fixture
def mock_db() -> AsyncMock:
    """Mock async database session."""
    session = AsyncMock()
    session.add = MagicMock()
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    return session


@pytest.mark.asyncio
async def test_mentor_apply_success(mock_db: AsyncMock) -> None:
    """Public visitor can successfully submit mentor application (F-040)."""
    # Email does not exist
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_result

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    payload = {
        "name": "Dr. Tariq Masood",
        "email": "tariq.masood@mentor.pk",
        "password": "SecurePassword123!",
        "city": "Lahore",
        "bio": "Experienced retail supply chain advisor with 15+ years in artisan commerce.",
        "niches": ["textiles", "export", "ecommerce"],
        "languages": ["Urdu", "English", "Punjabi"],
    }

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/api/v1/auth/mentor-apply", json=payload)

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "tariq.masood@mentor.pk"
        assert data["name"] == "Dr. Tariq Masood"
        assert data["status"] == "pending"
        assert "user_id" in data
        assert "mentor_id" in data
        assert "message" in data
        assert "pending Super Admin review" in data["message"]

        # Verify DB additions
        assert mock_db.add.call_count >= 2
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_mentor_apply_duplicate_email_returns_409(mock_db: AsyncMock) -> None:
    """Attempting to apply with an already registered email returns 409 Conflict."""
    existing_user = User(
        id=uuid.uuid4(),
        email="existing@example.com",
        name="Existing User",
        role="entrepreneur",
        password_hash="hashed",
        status="active",
    )
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = existing_user
    mock_db.execute.return_value = mock_result

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    payload = {
        "name": "Another Applicant",
        "email": "existing@example.com",
        "password": "SecurePassword123!",
        "city": "Karachi",
        "bio": "Expert in e-commerce marketing and local marketplace scaling.",
        "niches": ["ecommerce"],
    }

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/api/v1/auth/mentor-apply", json=payload)

        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_mentor_apply_password_complexity_rejected() -> None:
    """Passwords lacking uppercase letter or digit are rejected (422)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # No uppercase
        res1 = await client.post(
            "/api/v1/auth/mentor-apply",
            json={
                "name": "Test Mentor",
                "email": "test@mentor.pk",
                "password": "password123!",
                "city": "Islamabad",
                "bio": "10 years experience in artisanal export markets.",
                "niches": ["export"],
            },
        )
        assert res1.status_code == 422

        # No digit
        res2 = await client.post(
            "/api/v1/auth/mentor-apply",
            json={
                "name": "Test Mentor",
                "email": "test@mentor.pk",
                "password": "PasswordOnly!",
                "city": "Islamabad",
                "bio": "10 years experience in artisanal export markets.",
                "niches": ["export"],
            },
        )
        assert res2.status_code == 422

        # Too short
        res3 = await client.post(
            "/api/v1/auth/mentor-apply",
            json={
                "name": "Test Mentor",
                "email": "test@mentor.pk",
                "password": "Pass1",
                "city": "Islamabad",
                "bio": "10 years experience in artisanal export markets.",
                "niches": ["export"],
            },
        )
        assert res3.status_code == 422


@pytest.mark.asyncio
async def test_mentor_apply_short_bio_rejected() -> None:
    """Mentor application with bio shorter than 10 chars is rejected (422)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/mentor-apply",
            json={
                "name": "Test Mentor",
                "email": "test@mentor.pk",
                "password": "SecurePassword123!",
                "city": "Lahore",
                "bio": "Too short",
                "niches": ["textiles"],
            },
        )
        assert response.status_code == 422


@pytest.mark.asyncio
async def test_mentor_apply_empty_niches_rejected() -> None:
    """Mentor application without at least one niche is rejected (422)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/mentor-apply",
            json={
                "name": "Test Mentor",
                "email": "test@mentor.pk",
                "password": "SecurePassword123!",
                "city": "Lahore",
                "bio": "Comprehensive mentor experience in marketing.",
                "niches": [],
            },
        )
        assert response.status_code == 422
