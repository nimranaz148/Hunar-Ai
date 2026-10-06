"""Acceptance tests for Task 37: Mentor Profile Editor (F-021 / PRD §5, §12.3, §13.2, §14.2)."""

import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token
from app.auth.password import hash_password
from app.core.database import get_db
from app.main import app
from app.models.mentor import MentorProfile
from app.models.user import User


@pytest.fixture
def mentor_user() -> User:
    """Mock mentor user."""
    return User(
        id=uuid.uuid4(),
        email="mentor.profile@hunar.pk",
        name="Zainab Qazi",
        role="mentor",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def entrepreneur_user() -> User:
    """Mock entrepreneur user."""
    return User(
        id=uuid.uuid4(),
        email="entrepreneur@hunar.pk",
        name="Fatima Ali",
        role="entrepreneur",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def mentor_profile(mentor_user: User) -> MentorProfile:
    """Mock active mentor profile."""
    profile = MentorProfile(
        id=uuid.uuid4(),
        user_id=mentor_user.id,
        niches=["handmade", "stitching_fashion"],
        languages=["ur", "en"],
        city="Lahore",
        bio="Apparel and craft coach guiding Pakistani direct-to-consumer founders.",
        avatar_url="https://images.unsplash.com/photo-1534528741775",
        rating=4.9,
        review_count=12,
        status="active",
        created_at=datetime.now(UTC),
    )
    profile.user = mentor_user
    return profile


@pytest.fixture
def mentor_headers(mentor_user: User) -> dict[str, str]:
    """Auth headers for mentor."""
    token = create_access_token(
        user_id=mentor_user.id,
        role=mentor_user.role,
        email=mentor_user.email,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def entrepreneur_headers(entrepreneur_user: User) -> dict[str, str]:
    """Auth headers for entrepreneur."""
    token = create_access_token(
        user_id=entrepreneur_user.id,
        role=entrepreneur_user.role,
        email=entrepreneur_user.email,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_get_mentor_profile_unauthenticated_returns_401() -> None:
    """Anonymous request to get own mentor profile is rejected with 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/mentors/me")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_mentor_profile_by_entrepreneur_returns_403(
    entrepreneur_user: User,
    entrepreneur_headers: dict[str, str],
) -> None:
    """Entrepreneur cannot access mentor profile editor endpoint."""
    mock_db = AsyncMock()

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/v1/mentors/me", headers=entrepreneur_headers)
            assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_mentor_profile_success(
    mentor_user: User,
    mentor_profile: MentorProfile,
    mentor_headers: dict[str, str],
) -> None:
    """Authenticated mentor successfully retrieves own profile."""
    mock_db = AsyncMock()
    profile_result = MagicMock()
    profile_result.scalar_one_or_none.return_value = mentor_profile
    mock_db.execute.return_value = profile_result

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return mentor_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/v1/mentors/me", headers=mentor_headers)
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == str(mentor_profile.id)
            assert data["user_id"] == str(mentor_user.id)
            assert data["name"] == mentor_user.name
            assert data["email"] == mentor_user.email
            assert data["city"] == "Lahore"
            assert data["bio"] == mentor_profile.bio
            assert "handmade" in data["niches"]
            assert data["rating"] == 4.9
            assert data["review_count"] == 12
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_update_mentor_profile_success(
    mentor_user: User,
    mentor_profile: MentorProfile,
    mentor_headers: dict[str, str],
) -> None:
    """Authenticated mentor successfully updates bio, city, niches, and languages."""
    mock_db = AsyncMock()
    profile_result = MagicMock()
    profile_result.scalar_one_or_none.return_value = mentor_profile
    mock_db.execute.return_value = profile_result

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return mentor_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            payload = {
                "city": "Karachi",
                "bio": "Updated bio highlighting 12 years in textile manufacturing & exports.",
                "niches": ["stitching_fashion", "handmade"],
                "languages": ["ur", "roman_ur", "en"],
            }
            response = await client.patch(
                "/api/v1/mentors/me", json=payload, headers=mentor_headers
            )
            assert response.status_code == 200
            data = response.json()
            assert data["city"] == "Karachi"
            assert data["bio"] == payload["bio"]
            assert data["niches"] == payload["niches"]
            assert data["languages"] == payload["languages"]
            assert mentor_profile.city == "Karachi"
            assert mock_db.commit.called
    finally:
        app.dependency_overrides.clear()
