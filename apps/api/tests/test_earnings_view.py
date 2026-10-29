"""Acceptance tests for GET /api/v1/mentors/me/earnings (Task 42 / F-026 / R-006)."""

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
from app.models.booking import Booking, PaymentSim
from app.models.mentor import MentorProfile, MentorService
from app.models.user import User

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def mentor_user() -> User:
    """Mock mentor user."""
    return User(
        id=uuid.uuid4(),
        email="mentor.earnings@hunar.pk",
        name="Zara Mentor",
        role="mentor",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def mentee_user() -> User:
    """Mock entrepreneur user."""
    return User(
        id=uuid.uuid4(),
        email="mentee.amina@hunar.pk",
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
        niches=["handmade"],
        languages=["ur", "en"],
        city="Karachi",
        bio="Experienced craft coach helping micro-enterprises scale.",
        avatar_url=None,
        rating=4.8,
        review_count=5,
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
        title="Business Clarity Session",
        description="Comprehensive review of craft cost breakdown and pricing.",
        niche="handmade",
        type="session",
        price_pkr=5000,
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
def entrepreneur_headers(mentee_user: User) -> dict[str, str]:
    """Auth headers for entrepreneur."""
    token = create_access_token(
        user_id=mentee_user.id,
        role=mentee_user.role,
        email=mentee_user.email,
    )
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_earnings_unauthenticated_returns_401() -> None:
    """Anonymous request to mentor earnings endpoint is rejected with 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/mentors/me/earnings")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_earnings_by_entrepreneur_returns_403(
    mentee_user: User,
    entrepreneur_headers: dict[str, str],
) -> None:
    """Entrepreneur role cannot access mentor earnings report."""
    mock_db = AsyncMock()

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return mentee_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/mentors/me/earnings",
                headers=entrepreneur_headers,
            )
            assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_earnings_no_profile_returns_zeros(
    mentor_user: User,
    mentor_headers: dict[str, str],
) -> None:
    """Mentor without profile receives an empty earnings response with zero counts."""
    mock_db = AsyncMock()
    mock_prof_res = MagicMock()
    mock_prof_res.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_prof_res

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
                "/api/v1/mentors/me/earnings",
                headers=mentor_headers,
            )
            assert response.status_code == 200
            data = response.json()
            assert data["total_earned_pkr"] == 0
            assert data["pending_escrow_pkr"] == 0
            assert data["total_refunded_pkr"] == 0
            assert data["completed_sessions_count"] == 0
            assert data["average_session_fee_pkr"] == 0
            assert data["transactions"] == []
            assert data["monthly_trend"] == []
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_earnings_all_period_kpis_and_ledger(
    mentor_user: User,
    mentee_user: User,
    mentor_profile: MentorProfile,
    mentor_service: MentorService,
    mentor_headers: dict[str, str],
) -> None:
    """Returns correct aggregated KPIs and transaction ledger for bookings."""
    # Booking 1: completed, released (6,000 PKR)
    b1 = Booking(
        id=uuid.uuid4(),
        service_id=mentor_service.id,
        mentor_id=mentor_profile.id,
        entrepreneur_id=mentee_user.id,
        status="completed",
        notes="First session",
        scheduled_at=datetime(2026, 10, 2, 10, 0, tzinfo=UTC),
        created_at=datetime(2026, 10, 1, 9, 0, tzinfo=UTC),
    )
    b1.service = mentor_service
    b1.entrepreneur = mentee_user
    b1.payment = PaymentSim(
        id=uuid.uuid4(),
        booking_id=b1.id,
        amount_pkr=6000,
        status="released",
        created_at=b1.created_at,
    )

    # Booking 2: scheduled, held (4,000 PKR)
    b2 = Booking(
        id=uuid.uuid4(),
        service_id=mentor_service.id,
        mentor_id=mentor_profile.id,
        entrepreneur_id=mentee_user.id,
        status="scheduled",
        notes="Upcoming session",
        scheduled_at=datetime(2026, 10, 15, 14, 0, tzinfo=UTC),
        created_at=datetime(2026, 10, 3, 11, 0, tzinfo=UTC),
    )
    b2.service = mentor_service
    b2.entrepreneur = mentee_user
    b2.payment = PaymentSim(
        id=uuid.uuid4(),
        booking_id=b2.id,
        amount_pkr=4000,
        status="held",
        created_at=b2.created_at,
    )

    # Booking 3: cancelled, refunded (3,000 PKR)
    b3 = Booking(
        id=uuid.uuid4(),
        service_id=mentor_service.id,
        mentor_id=mentor_profile.id,
        entrepreneur_id=mentee_user.id,
        status="cancelled",
        notes="Cancelled session",
        created_at=datetime(2026, 9, 20, 12, 0, tzinfo=UTC),
    )
    b3.service = mentor_service
    b3.entrepreneur = mentee_user
    b3.payment = PaymentSim(
        id=uuid.uuid4(),
        booking_id=b3.id,
        amount_pkr=3000,
        status="refunded",
        created_at=b3.created_at,
    )

    mock_db = AsyncMock()

    call_count = 0

    async def mock_execute(stmt: Any, *args: Any, **kwargs: Any) -> MagicMock:
        nonlocal call_count
        call_count += 1
        res = MagicMock()
        if call_count == 1:
            res.scalar_one_or_none.return_value = mentor_profile
        else:
            res.scalars.return_value.all.return_value = [b1, b2, b3]
        return res

    mock_db.execute.side_effect = mock_execute

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
                "/api/v1/mentors/me/earnings",
                headers=mentor_headers,
            )
            assert response.status_code == 200
            data = response.json()
            assert data["total_earned_pkr"] == 6000
            assert data["pending_escrow_pkr"] == 4000
            assert data["total_refunded_pkr"] == 3000
            assert data["completed_sessions_count"] == 1
            assert data["average_session_fee_pkr"] == 6000
            assert len(data["transactions"]) == 3

            # Verify transaction fields
            t1 = data["transactions"][0]
            assert t1["mentee_name"] == "Amina Khan"
            assert t1["service_title"] == "Business Clarity Session"
            assert t1["amount_pkr"] in (6000, 4000, 3000)

            # Monthly trend
            assert len(data["monthly_trend"]) >= 1
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_earnings_invalid_period_param(
    mentor_user: User,
    mentor_headers: dict[str, str],
) -> None:
    """Invalid period parameter returns 422 validation error."""
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
                "/api/v1/mentors/me/earnings?period=invalid_period",
                headers=mentor_headers,
            )
            assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()
