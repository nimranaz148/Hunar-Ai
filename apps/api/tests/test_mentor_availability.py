"""Acceptance tests for Task 39: Availability Editor (F-023 / PRD §5, §12.3, §13.2, §14.1, §14.2)."""

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
from app.models.mentor import MentorAvailability, MentorProfile
from app.models.user import User


@pytest.fixture
def mentor_user() -> User:
    """Mock mentor user."""
    return User(
        id=uuid.uuid4(),
        email="mentor.avail@hunar.pk",
        name="Dr. Tariq Mansoor",
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
        bio="Apparel and craft coach guiding Pakistani founders.",
        avatar_url=None,
        rating=4.9,
        review_count=14,
        status="active",
        created_at=datetime.now(UTC),
    )
    profile.user = mentor_user
    return profile


@pytest.fixture
def sample_slots(mentor_profile: MentorProfile) -> list[MentorAvailability]:
    """Sample recurring weekly slots."""
    now = datetime.now(UTC)
    return [
        MentorAvailability(
            id=uuid.uuid4(),
            mentor_id=mentor_profile.id,
            weekday=0,  # Monday
            start_time="09:00",
            end_time="17:00",
            is_available=True,
            created_at=now,
            updated_at=now,
        ),
        MentorAvailability(
            id=uuid.uuid4(),
            mentor_id=mentor_profile.id,
            weekday=2,  # Wednesday
            start_time="10:00",
            end_time="15:00",
            is_available=True,
            created_at=now,
            updated_at=now,
        ),
    ]


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
async def test_get_mentor_availability_unauthenticated_returns_401() -> None:
    """Anonymous request to get mentor availability is rejected with 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/mentors/me/availability")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_mentor_availability_by_entrepreneur_returns_403(
    entrepreneur_user: User,
    entrepreneur_headers: dict[str, str],
) -> None:
    """Entrepreneur cannot access mentor availability editor endpoint."""
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
                "/api/v1/mentors/me/availability", headers=entrepreneur_headers
            )
            assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_mentor_availability_success(
    mentor_user: User,
    mentor_profile: MentorProfile,
    sample_slots: list[MentorAvailability],
    mentor_headers: dict[str, str],
) -> None:
    """Mentor retrieves own weekly availability schedule."""
    mock_db = AsyncMock()

    profile_result = MagicMock()
    profile_result.scalar_one_or_none.return_value = mentor_profile

    slots_result = MagicMock()
    slots_result.scalars.return_value.all.return_value = sample_slots

    mock_db.execute.side_effect = [profile_result, slots_result]

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return mentor_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/v1/mentors/me/availability", headers=mentor_headers)
            assert response.status_code == 200
            data = response.json()
            assert "slots" in data
            assert len(data["slots"]) == 2
            assert data["slots"][0]["weekday"] == 0
            assert data["slots"][0]["start_time"] == "09:00"
            assert data["slots"][0]["end_time"] == "17:00"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_update_mentor_availability_success(
    mentor_user: User,
    mentor_profile: MentorProfile,
    mentor_headers: dict[str, str],
) -> None:
    """Mentor replaces weekly schedule and triggers audit logging."""
    mock_db = AsyncMock()

    profile_result = MagicMock()
    profile_result.scalar_one_or_none.return_value = mentor_profile

    existing_slots_result = MagicMock()
    existing_slots_result.scalars.return_value.all.return_value = []

    mock_db.execute.side_effect = [profile_result, existing_slots_result, MagicMock()]

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
                "slots": [
                    {
                        "weekday": 1,  # Tuesday
                        "start_time": "11:00",
                        "end_time": "18:00",
                        "is_available": True,
                    },
                    {
                        "weekday": 3,  # Thursday
                        "start_time": "14:00",
                        "end_time": "20:00",
                        "is_available": True,
                    },
                ]
            }
            response = await client.put(
                "/api/v1/mentors/me/availability", json=payload, headers=mentor_headers
            )
            assert response.status_code == 200
            data = response.json()
            assert len(data["slots"]) == 2
            assert data["slots"][0]["weekday"] == 1
            assert data["slots"][0]["start_time"] == "11:00"
            assert data["slots"][1]["weekday"] == 3
            assert data["slots"][1]["end_time"] == "20:00"
            assert mock_db.commit.called
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_update_mentor_availability_invalid_times_returns_422(
    mentor_user: User,
    mentor_profile: MentorProfile,
    mentor_headers: dict[str, str],
) -> None:
    """Rejects slot when start_time is greater than or equal to end_time."""
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
                "slots": [
                    {
                        "weekday": 1,
                        "start_time": "18:00",
                        "end_time": "10:00",  # Invalid: end < start
                        "is_available": True,
                    }
                ]
            }
            response = await client.put(
                "/api/v1/mentors/me/availability", json=payload, headers=mentor_headers
            )
            assert response.status_code == 422
            assert "Start time (18:00) must be earlier than end time" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_update_mentor_availability_invalid_weekday_returns_422(
    mentor_user: User,
    mentor_headers: dict[str, str],
) -> None:
    """Pydantic rejects weekday outside 0..6."""
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
            payload = {
                "slots": [
                    {
                        "weekday": 7,  # Invalid: max is 6
                        "start_time": "09:00",
                        "end_time": "17:00",
                        "is_available": True,
                    }
                ]
            }
            response = await client.put(
                "/api/v1/mentors/me/availability", json=payload, headers=mentor_headers
            )
            assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()
