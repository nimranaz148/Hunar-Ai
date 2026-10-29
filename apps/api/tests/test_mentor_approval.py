"""Acceptance tests for Mentor Approval (Task 44 / F-030 / PRD §10 W-006, §13.2)."""

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

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def admin_user() -> User:
    """Mock super admin user."""
    return User(
        id=uuid.uuid4(),
        email="admin@hunar.pk",
        name="Super Admin",
        role="super_admin",
        password_hash=hash_password("AdminPass123!"),
        status="active",
        language="en",
        force_password_change=False,
    )


@pytest.fixture
def mentor_user() -> User:
    """Mock mentor user."""
    return User(
        id=uuid.uuid4(),
        email="applicant@mentor.pk",
        name="Bilal Aslam",
        role="mentor",
        password_hash=hash_password("Password123!"),
        status="pending",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def pending_profile(mentor_user: User) -> MentorProfile:
    """Mock pending mentor profile."""
    profile = MentorProfile(
        id=uuid.uuid4(),
        user_id=mentor_user.id,
        niches=["handmade", "food_culinary"],
        languages=["ur", "en"],
        city="Faisalabad",
        bio="10 years mentoring craft artisans.",
        avatar_url=None,
        rating=0.0,
        review_count=0,
        status="pending",
        created_at=datetime.now(UTC),
    )
    profile.user = mentor_user
    return profile


@pytest.fixture
def admin_headers(admin_user: User) -> dict[str, str]:
    token = create_access_token(
        user_id=admin_user.id,
        role=admin_user.role,
        email=admin_user.email,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def mentor_headers(mentor_user: User) -> dict[str, str]:
    token = create_access_token(
        user_id=mentor_user.id,
        role=mentor_user.role,
        email=mentor_user.email,
    )
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_pending_mentors_unauthenticated_returns_401() -> None:
    """Anonymous request to pending mentors list is rejected with 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/admin/mentors/pending")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_pending_mentors_non_admin_returns_403(
    mentor_user: User,
    mentor_headers: dict[str, str],
) -> None:
    """Non-admin user cannot access pending mentor applications (403)."""
    mock_db = AsyncMock()

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return mentor_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/admin/mentors/pending",
                headers=mentor_headers,
            )
            assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_list_pending_mentors_success(
    admin_user: User,
    pending_profile: MentorProfile,
    admin_headers: dict[str, str],
) -> None:
    """Super admin retrieves pending mentor applications list (F-030)."""
    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = [pending_profile]
    mock_db.execute.return_value = mock_res

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return admin_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/admin/mentors/pending",
                headers=admin_headers,
            )
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            item = data[0]
            assert item["id"] == str(pending_profile.id)
            assert item["name"] == "Bilal Aslam"
            assert item["city"] == "Faisalabad"
            assert item["mentor_status"] == "pending"
            assert "handmade" in item["niches"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_approve_mentor_success(
    admin_user: User,
    pending_profile: MentorProfile,
    admin_headers: dict[str, str],
) -> None:
    """Super admin approves a pending mentor application (F-030 / W-006)."""
    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = pending_profile
    mock_db.execute.return_value = mock_res

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return admin_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/admin/mentors/{pending_profile.id}/approve",
                headers=admin_headers,
            )
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == str(pending_profile.id)
            assert data["status"] == "active"
            assert pending_profile.status == "active"
            assert pending_profile.user.status == "active"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_decline_mentor_success(
    admin_user: User,
    pending_profile: MentorProfile,
    admin_headers: dict[str, str],
) -> None:
    """Super admin declines a pending mentor application (F-030 / W-006)."""
    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = pending_profile
    mock_db.execute.return_value = mock_res

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return admin_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/admin/mentors/{pending_profile.id}/decline?reason=Incomplete+profile",
                headers=admin_headers,
            )
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == str(pending_profile.id)
            assert data["status"] == "declined"
            assert pending_profile.status == "declined"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_approve_nonexistent_mentor_returns_404(
    admin_user: User,
    admin_headers: dict[str, str],
) -> None:
    """Approving non-existent mentor returns 404."""
    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_res

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return admin_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/admin/mentors/{uuid.uuid4()}/approve",
                headers=admin_headers,
            )
            assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()
