"""Acceptance tests for Task 38: Service CRUD (F-022 / PRD §5, §12.3, §13.2, §14.1, §14.2)."""

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
from app.models.booking import Booking
from app.models.mentor import MentorProfile, MentorService
from app.models.user import User


@pytest.fixture
def mentor_user() -> User:
    """Mock mentor user."""
    return User(
        id=uuid.uuid4(),
        email="mentor.services@hunar.pk",
        name="Tariq Mansoor",
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
        bio="Coaching craft founders across Pakistan.",
        avatar_url=None,
        rating=4.9,
        review_count=10,
        status="active",
        created_at=datetime.now(UTC),
    )
    profile.user = mentor_user
    return profile


@pytest.fixture
def mentor_service(mentor_profile: MentorProfile) -> MentorService:
    """Mock mentor service."""
    service = MentorService(
        id=uuid.uuid4(),
        mentor_id=mentor_profile.id,
        title="1-on-1 Product Pricing Strategy",
        description="Comprehensive review of your craft costs, margins, and wholesale pricing structure.",
        niche="handmade",
        type="session",
        price_pkr=3500,
        duration_min=60,
        active=True,
    )
    service.created_at = datetime.now(UTC)
    service.updated_at = datetime.now(UTC)
    return service


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
async def test_list_mentor_services_unauthenticated_returns_401() -> None:
    """Anonymous request to list mentor services is rejected with 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/mentors/me/services")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_mentor_services_by_entrepreneur_returns_403(
    entrepreneur_user: User,
    entrepreneur_headers: dict[str, str],
) -> None:
    """Entrepreneur role cannot access mentor services CRUD endpoint."""
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
            response = await client.get(
                "/api/v1/mentors/me/services", headers=entrepreneur_headers
            )
            assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_list_mentor_services_success(
    mentor_user: User,
    mentor_profile: MentorProfile,
    mentor_service: MentorService,
    mentor_headers: dict[str, str],
) -> None:
    """Mentor successfully retrieves list of own services."""
    mock_db = AsyncMock()

    profile_result = MagicMock()
    profile_result.scalar_one_or_none.return_value = mentor_profile

    services_result = MagicMock()
    services_result.scalars.return_value.all.return_value = [mentor_service]

    mock_db.execute.side_effect = [profile_result, services_result]

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return mentor_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/v1/mentors/me/services", headers=mentor_headers)
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["id"] == str(mentor_service.id)
            assert data[0]["title"] == mentor_service.title
            assert data[0]["price_pkr"] == 3500
            assert data[0]["duration_min"] == 60
            assert data[0]["active"] is True
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_create_mentor_service_success(
    mentor_user: User,
    mentor_profile: MentorProfile,
    mentor_headers: dict[str, str],
) -> None:
    """Mentor successfully creates a new service and audits creation."""
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
                "title": "Stitching & Apparel Pattern Audit",
                "description": "Deep-dive audit into seasonal sizing and production cost efficiency.",
                "niche": "stitching_fashion",
                "type": "review",
                "price_pkr": 4500,
                "duration_min": 90,
                "active": True,
            }
            response = await client.post(
                "/api/v1/mentors/me/services", json=payload, headers=mentor_headers
            )
            assert response.status_code == 201
            data = response.json()
            assert data["title"] == payload["title"]
            assert data["niche"] == "stitching_fashion"
            assert data["price_pkr"] == 4500
            assert data["duration_min"] == 90
            assert mock_db.commit.called
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_create_mentor_service_validation_errors(
    mentor_user: User,
    mentor_headers: dict[str, str],
) -> None:
    """Rejects invalid duration not multiple of 15, invalid niche, and invalid type."""
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
            # Invalid duration (not multiple of 15)
            res1 = await client.post(
                "/api/v1/mentors/me/services",
                json={
                    "title": "Invalid Duration Service",
                    "description": "Checking duration step validation logic.",
                    "niche": "handmade",
                    "type": "session",
                    "price_pkr": 2000,
                    "duration_min": 40,
                },
                headers=mentor_headers,
            )
            assert res1.status_code == 422

            # Invalid niche
            res2 = await client.post(
                "/api/v1/mentors/me/services",
                json={
                    "title": "Invalid Niche Service",
                    "description": "Checking niche domain validation.",
                    "niche": "unknown_niche",
                    "type": "session",
                    "price_pkr": 2000,
                    "duration_min": 60,
                },
                headers=mentor_headers,
            )
            assert res2.status_code == 422
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_update_mentor_service_success(
    mentor_user: User,
    mentor_profile: MentorProfile,
    mentor_service: MentorService,
    mentor_headers: dict[str, str],
) -> None:
    """Mentor updates service details successfully."""
    mock_db = AsyncMock()

    profile_result = MagicMock()
    profile_result.scalar_one_or_none.return_value = mentor_profile

    service_result = MagicMock()
    service_result.scalar_one_or_none.return_value = mentor_service

    booking_check = MagicMock()
    booking_check.scalars.return_value.first.return_value = None

    mock_db.execute.side_effect = [profile_result, service_result, booking_check]

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
                "title": "Updated 1-on-1 Pricing Strategy",
                "price_pkr": 5000,
                "active": False,
            }
            response = await client.patch(
                f"/api/v1/mentors/me/services/{mentor_service.id}",
                json=payload,
                headers=mentor_headers,
            )
            assert response.status_code == 200
            data = response.json()
            assert data["title"] == payload["title"]
            assert data["price_pkr"] == 5000
            assert data["active"] is False
            assert mock_db.commit.called
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_update_service_price_blocked_on_accepted_booking(
    mentor_user: User,
    mentor_profile: MentorProfile,
    mentor_service: MentorService,
    mentor_headers: dict[str, str],
) -> None:
    """Price change is blocked with 400 when an active accepted booking exists."""
    mock_db = AsyncMock()

    profile_result = MagicMock()
    profile_result.scalar_one_or_none.return_value = mentor_profile

    service_result = MagicMock()
    service_result.scalar_one_or_none.return_value = mentor_service

    # Existing accepted booking
    booking = Booking(
        id=uuid.uuid4(),
        service_id=mentor_service.id,
        mentor_id=mentor_profile.id,
        entrepreneur_id=uuid.uuid4(),
        status="accepted",
        scheduled_at=datetime.now(UTC),
    )
    booking_check = MagicMock()
    booking_check.scalars.return_value.first.return_value = booking

    mock_db.execute.side_effect = [profile_result, service_result, booking_check]

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return mentor_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.patch(
                f"/api/v1/mentors/me/services/{mentor_service.id}",
                json={"price_pkr": 6000},
                headers=mentor_headers,
            )
            assert response.status_code == 400
            assert "Cannot change service price" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_delete_mentor_service_success(
    mentor_user: User,
    mentor_profile: MentorProfile,
    mentor_service: MentorService,
    mentor_headers: dict[str, str],
) -> None:
    """Mentor deletes service when no active bookings exist."""
    mock_db = AsyncMock()

    profile_result = MagicMock()
    profile_result.scalar_one_or_none.return_value = mentor_profile

    service_result = MagicMock()
    service_result.scalar_one_or_none.return_value = mentor_service

    booking_check = MagicMock()
    booking_check.scalars.return_value.first.return_value = None

    mock_db.execute.side_effect = [profile_result, service_result, booking_check]

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return mentor_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.delete(
                f"/api/v1/mentors/me/services/{mentor_service.id}",
                headers=mentor_headers,
            )
            assert response.status_code == 204
            assert mock_db.delete.called
            assert mock_db.commit.called
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_delete_service_blocked_on_active_booking(
    mentor_user: User,
    mentor_profile: MentorProfile,
    mentor_service: MentorService,
    mentor_headers: dict[str, str],
) -> None:
    """Delete is blocked with 400 when an active booking exists."""
    mock_db = AsyncMock()

    profile_result = MagicMock()
    profile_result.scalar_one_or_none.return_value = mentor_profile

    service_result = MagicMock()
    service_result.scalar_one_or_none.return_value = mentor_service

    booking = Booking(
        id=uuid.uuid4(),
        service_id=mentor_service.id,
        mentor_id=mentor_profile.id,
        entrepreneur_id=uuid.uuid4(),
        status="requested",
        scheduled_at=datetime.now(UTC),
    )
    booking_check = MagicMock()
    booking_check.scalars.return_value.first.return_value = booking

    mock_db.execute.side_effect = [profile_result, service_result, booking_check]

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return mentor_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.delete(
                f"/api/v1/mentors/me/services/{mentor_service.id}",
                headers=mentor_headers,
            )
            assert response.status_code == 400
            assert "Cannot delete service with active bookings" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()
