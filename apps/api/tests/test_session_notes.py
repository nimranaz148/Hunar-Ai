"""Acceptance tests for POST /api/v1/bookings/{id}/notes (Task 43 / F-027 / PRD §10 W-005, §13.2)."""

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
        email="mentor.notes@hunar.pk",
        name="Tariq Mansoor",
        role="mentor",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def other_mentor_user() -> User:
    """Mock unrelated mentor user."""
    return User(
        id=uuid.uuid4(),
        email="other.mentor@hunar.pk",
        name="Other Mentor",
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
    """Mock mentor profile."""
    profile = MentorProfile(
        id=uuid.uuid4(),
        user_id=mentor_user.id,
        niches=["handmade"],
        languages=["ur", "en"],
        city="Lahore",
        bio="Coach helping craft founders.",
        avatar_url=None,
        rating=5.0,
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
        title="Handmade Cost & Pricing Strategy",
        description="Detailed unit economics review.",
        niche="handmade",
        type="session",
        price_pkr=4000,
        duration_min=60,
        active=True,
    )
    service.mentor = mentor_profile
    return service


@pytest.fixture
def scheduled_booking(
    mentor_profile: MentorProfile,
    mentor_service: MentorService,
    mentee_user: User,
) -> Booking:
    """Mock scheduled booking with held escrow payment."""
    b = Booking(
        id=uuid.uuid4(),
        service_id=mentor_service.id,
        mentor_id=mentor_profile.id,
        entrepreneur_id=mentee_user.id,
        status="scheduled",
        notes="Need help with cost sheets.",
        scheduled_at=datetime(2026, 10, 10, 10, 0, tzinfo=UTC),
        created_at=datetime(2026, 10, 5, 9, 0, tzinfo=UTC),
        updated_at=datetime(2026, 10, 5, 9, 0, tzinfo=UTC),
    )
    b.service = mentor_service
    b.mentor = mentor_profile
    b.entrepreneur = mentee_user
    b.payment = PaymentSim(
        id=uuid.uuid4(),
        booking_id=b.id,
        amount_pkr=4000,
        status="held",
        created_at=b.created_at,
    )
    return b


@pytest.fixture
def mentor_headers(mentor_user: User) -> dict[str, str]:
    token = create_access_token(
        user_id=mentor_user.id,
        role=mentor_user.role,
        email=mentor_user.email,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other_mentor_headers(other_mentor_user: User) -> dict[str, str]:
    token = create_access_token(
        user_id=other_mentor_user.id,
        role=other_mentor_user.role,
        email=other_mentor_user.email,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def entrepreneur_headers(mentee_user: User) -> dict[str, str]:
    token = create_access_token(
        user_id=mentee_user.id,
        role=mentee_user.role,
        email=mentee_user.email,
    )
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Acceptance Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_session_notes_unauthenticated_returns_401() -> None:
    """Anonymous request to add notes is rejected with 401."""
    booking_id = uuid.uuid4()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            f"/api/v1/bookings/{booking_id}/notes",
            json={"session_notes": "Reviewed cost structure and margins."},
        )
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_session_notes_entrepreneur_forbidden(
    mentee_user: User,
    entrepreneur_headers: dict[str, str],
) -> None:
    """Entrepreneur role cannot submit mentor session notes (403)."""
    booking_id = uuid.uuid4()
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
            response = await client.post(
                f"/api/v1/bookings/{booking_id}/notes",
                headers=entrepreneur_headers,
                json={"session_notes": "Reviewed cost structure and margins."},
            )
            assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_session_notes_unrelated_mentor_forbidden(
    other_mentor_user: User,
    scheduled_booking: Booking,
    other_mentor_headers: dict[str, str],
) -> None:
    """Mentor who is not assigned to this booking cannot submit session notes (403)."""
    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = scheduled_booking
    mock_db.execute.return_value = mock_res

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return other_mentor_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/bookings/{scheduled_booking.id}/notes",
                headers=other_mentor_headers,
                json={"session_notes": "Reviewed cost structure and margins."},
            )
            assert response.status_code == 403
            assert "Access denied" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_session_notes_success_completes_booking_and_releases_escrow(
    mentor_user: User,
    scheduled_booking: Booking,
    mentor_headers: dict[str, str],
) -> None:
    """Submitting session notes marks booking completed and releases escrow payment (F-027 / PRD §10 W-005)."""
    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = scheduled_booking
    mock_db.execute.return_value = mock_res

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return mentor_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    notes_text = (
        "We reviewed Amina's crochet bag pricing. Suggested separating material cost "
        "(PKR 450) from labor (2.5 hours @ PKR 300/hr). Recommended setting initial retail "
        "price at PKR 1,800 to yield a 35% net margin."
    )

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/bookings/{scheduled_booking.id}/notes",
                headers=mentor_headers,
                json={"session_notes": notes_text},
            )
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == str(scheduled_booking.id)
            assert data["status"] == "completed"
            assert data["payment_status"] == "released"
            assert data["session_notes"] == notes_text
            assert scheduled_booking.status == "completed"
            assert scheduled_booking.payment.status == "released"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_session_notes_validation_min_length(
    mentor_user: User,
    scheduled_booking: Booking,
    mentor_headers: dict[str, str],
) -> None:
    """Notes less than 10 characters are rejected with 422."""
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
            response = await client.post(
                f"/api/v1/bookings/{scheduled_booking.id}/notes",
                headers=mentor_headers,
                json={"session_notes": "Too short"},
            )
            assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_session_notes_cancelled_booking_fails(
    mentor_user: User,
    scheduled_booking: Booking,
    mentor_headers: dict[str, str],
) -> None:
    """Cannot add session notes to a cancelled booking (400)."""
    scheduled_booking.status = "cancelled"
    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = scheduled_booking
    mock_db.execute.return_value = mock_res

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return mentor_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/bookings/{scheduled_booking.id}/notes",
                headers=mentor_headers,
                json={"session_notes": "Attempting to add notes to cancelled session."},
            )
            assert response.status_code == 400
            assert "cancelled" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()
