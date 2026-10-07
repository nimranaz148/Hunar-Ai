"""Acceptance tests for Task 40: Mentor Dashboard (F-024 / D-002 / PRD §5, §7, §8, §29.2)."""

import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token
from app.auth.password import hash_password
from app.core.database import get_db
from app.main import app
from app.models.booking import Booking, PaymentSim
from app.models.mentor import MentorProfile, MentorService
from app.models.user import User


@pytest.fixture
def mentor_user() -> User:
    """Mock mentor user."""
    return User(
        id=uuid.uuid4(),
        email="mentor.dashboard@hunar.pk",
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
        email="entrepreneur.mentee@hunar.pk",
        name="Amina Khan",
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
        bio="Experienced craft coach helping micro-enterprises scale.",
        avatar_url=None,
        rating=4.8,
        review_count=12,
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
        title="Handmade Pricing & Margins",
        description="Comprehensive review of craft cost breakdown and pricing.",
        niche="handmade",
        type="session",
        price_pkr=4000,
        duration_min=60,
        active=True,
    )
    service.mentor = mentor_profile
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
async def test_get_mentor_dashboard_unauthenticated_returns_401() -> None:
    """Anonymous request to mentor dashboard is rejected with 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/mentors/me/dashboard")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_mentor_dashboard_by_entrepreneur_returns_403(
    entrepreneur_user: User,
    entrepreneur_headers: dict[str, str],
) -> None:
    """Entrepreneur role cannot access mentor dashboard endpoint."""
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
                "/api/v1/mentors/me/dashboard", headers=entrepreneur_headers
            )
            assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_mentor_dashboard_success(
    mentor_user: User,
    mentor_profile: MentorProfile,
    mentor_service: MentorService,
    entrepreneur_user: User,
    mentor_headers: dict[str, str],
) -> None:
    """Mentor successfully retrieves consolidated dashboard with KPIs and session lists."""
    mock_db = AsyncMock()

    # Create mock pending booking
    pending_booking = Booking(
        id=uuid.uuid4(),
        service_id=mentor_service.id,
        mentor_id=mentor_profile.id,
        entrepreneur_id=entrepreneur_user.id,
        status="requested",
        scheduled_at=None,
        notes="Need help pricing my embroidery shawls.",
        session_notes=None,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    pending_booking.service = mentor_service
    pending_booking.mentor = mentor_profile
    pending_booking.entrepreneur = entrepreneur_user
    pending_booking.payment = PaymentSim(
        id=uuid.uuid4(),
        booking_id=pending_booking.id,
        amount_pkr=4000,
        status="held",
    )

    # Create mock upcoming booking
    upcoming_booking = Booking(
        id=uuid.uuid4(),
        service_id=mentor_service.id,
        mentor_id=mentor_profile.id,
        entrepreneur_id=entrepreneur_user.id,
        status="scheduled",
        scheduled_at=datetime.now(UTC) + timedelta(days=2),
        notes="Reviewing product catalog.",
        session_notes=None,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    upcoming_booking.service = mentor_service
    upcoming_booking.mentor = mentor_profile
    upcoming_booking.entrepreneur = entrepreneur_user
    upcoming_booking.payment = PaymentSim(
        id=uuid.uuid4(),
        booking_id=upcoming_booking.id,
        amount_pkr=4000,
        status="held",
    )

    # Completed booking for earnings
    completed_booking = Booking(
        id=uuid.uuid4(),
        service_id=mentor_service.id,
        mentor_id=mentor_profile.id,
        entrepreneur_id=entrepreneur_user.id,
        status="completed",
        scheduled_at=datetime.now(UTC) - timedelta(days=5),
        notes="Finished launch strategy session.",
        session_notes="Completed action items.",
        created_at=datetime.now(UTC) - timedelta(days=6),
        updated_at=datetime.now(UTC) - timedelta(days=5),
    )
    completed_booking.service = mentor_service
    completed_booking.mentor = mentor_profile
    completed_booking.entrepreneur = entrepreneur_user
    completed_booking.payment = PaymentSim(
        id=uuid.uuid4(),
        booking_id=completed_booking.id,
        amount_pkr=4000,
        status="released",
    )

    profile_result = MagicMock()
    profile_result.scalar_one_or_none.return_value = mentor_profile

    # Bookings query result
    all_bookings = [pending_booking, upcoming_booking, completed_booking]
    bookings_result = MagicMock()
    bookings_result.scalars.return_value.all.return_value = all_bookings

    mock_db.execute.side_effect = [
        profile_result,
        bookings_result,
    ]

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
                "/api/v1/mentors/me/dashboard", headers=mentor_headers
            )
            assert response.status_code == 200
            data = response.json()

            # Verify KPI card figures (PRD §7 D-002, §8, §29.2)
            assert data["pending_requests_count"] == 1
            assert data["upcoming_sessions_count"] == 1
            assert data["total_earnings_pkr"] == 4000
            assert data["average_rating"] == 4.8
            assert data["review_count"] == 12

            # Verify pending request details (F-024)
            assert len(data["pending_requests"]) == 1
            assert data["pending_requests"][0]["service_title"] == "Handmade Pricing & Margins"
            assert data["pending_requests"][0]["entrepreneur_name"] == "Amina Khan"
            assert data["pending_requests"][0]["notes"] == "Need help pricing my embroidery shawls."

            # Verify upcoming session details
            assert len(data["upcoming_sessions"]) == 1
            assert data["upcoming_sessions"][0]["service_title"] == "Handmade Pricing & Margins"
            assert data["upcoming_sessions"][0]["status"] == "scheduled"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_mentor_dashboard_empty_initializes_profile(
    mentor_user: User,
    mentor_headers: dict[str, str],
) -> None:
    """Mentor without prior profile auto-initializes active base profile with zeroed KPIs."""
    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    # First call: profile doesn't exist
    profile_res_empty = MagicMock()
    profile_res_empty.scalar_one_or_none.return_value = None

    # After add/commit: refreshed profile
    created_profile = MentorProfile(
        id=uuid.uuid4(),
        user_id=mentor_user.id,
        niches=[],
        languages=["ur", "en"],
        city="Pakistan",
        bio="Experienced industry professional offering guidance on Hunar.",
        rating=5.0,
        review_count=0,
        status="active",
        created_at=datetime.now(UTC),
    )
    profile_res_created = MagicMock()
    profile_res_created.scalar_one.return_value = created_profile

    # Bookings result: empty
    bookings_res = MagicMock()
    bookings_res.scalars.return_value.all.return_value = []

    mock_db.execute.side_effect = [
        profile_res_empty,
        profile_res_created,
        bookings_res,
    ]

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
                "/api/v1/mentors/me/dashboard", headers=mentor_headers
            )
            assert response.status_code == 200
            data = response.json()
            assert data["pending_requests_count"] == 0
            assert data["upcoming_sessions_count"] == 0
            assert data["total_earnings_pkr"] == 0
            assert data["average_rating"] == 5.0
            assert data["review_count"] == 0
            assert data["pending_requests"] == []
            assert data["upcoming_sessions"] == []
    finally:
        app.dependency_overrides.clear()

