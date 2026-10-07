"""Acceptance tests for POST /api/v1/bookings/{id}/review (Task 46 / F-041 / PRD §5, §10 W-005, §13.2)."""

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
from app.models.booking import Booking, PaymentSim, Review
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
        email="mentor.tariq@hunar.pk",
        name="Tariq Mansoor",
        role="mentor",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def entrepreneur_user() -> User:
    """Mock entrepreneur mentee user."""
    return User(
        id=uuid.uuid4(),
        email="entrepreneur.amina@hunar.pk",
        name="Amina Bibi",
        role="entrepreneur",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def other_entrepreneur_user() -> User:
    """Mock unrelated entrepreneur user."""
    return User(
        id=uuid.uuid4(),
        email="other.entrepreneur@hunar.pk",
        name="Other Entrepreneur",
        role="entrepreneur",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def super_admin_user() -> User:
    """Mock super admin user."""
    return User(
        id=uuid.uuid4(),
        email="admin@hunar.pk",
        name="Super Admin",
        role="super_admin",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def mentor_profile(mentor_user: User) -> MentorProfile:
    """Mock mentor profile with initial rating and review count."""
    p = MentorProfile(
        id=uuid.uuid4(),
        user_id=mentor_user.id,
        niches=["pricing", "export"],
        languages=["Urdu", "English"],
        city="Lahore",
        bio="15 years helping artisans price crafts for domestic and export retail.",
        rating=4.0,
        review_count=1,
        status="active",
    )
    p.user = mentor_user
    return p


@pytest.fixture
def mentor_service(mentor_profile: MentorProfile) -> MentorService:
    """Mock mentor service."""
    s = MentorService(
        id=uuid.uuid4(),
        mentor_id=mentor_profile.id,
        title="Cost Structure & Export Pricing Strategy",
        description="Comprehensive 60-min audit of production cost sheet.",
        niche="pricing",
        type="session",
        price_pkr=4000,
        duration_min=60,
        active=True,
    )
    s.mentor = mentor_profile
    return s


@pytest.fixture
def completed_booking(
    mentor_service: MentorService,
    mentor_profile: MentorProfile,
    entrepreneur_user: User,
) -> Booking:
    """Mock booking that has completed session notes and released payment."""
    b = Booking(
        id=uuid.uuid4(),
        service_id=mentor_service.id,
        mentor_id=mentor_profile.id,
        entrepreneur_id=entrepreneur_user.id,
        status="completed",
        notes="Need help with cost sheets.",
        session_notes="Discussed fabric margins, target minimum 35% margin.",
        scheduled_at=datetime(2026, 10, 5, 10, 0, tzinfo=UTC),
        created_at=datetime(2026, 10, 1, 9, 0, tzinfo=UTC),
        updated_at=datetime(2026, 10, 5, 11, 0, tzinfo=UTC),
    )
    b.service = mentor_service
    b.mentor = mentor_profile
    b.entrepreneur = entrepreneur_user
    b.payment = PaymentSim(
        id=uuid.uuid4(),
        booking_id=b.id,
        amount_pkr=4000,
        status="released",
        created_at=b.created_at,
    )
    b.review = None
    return b


@pytest.fixture
def entrepreneur_headers(entrepreneur_user: User) -> dict[str, str]:
    token = create_access_token(
        user_id=entrepreneur_user.id,
        role=entrepreneur_user.role,
        email=entrepreneur_user.email,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other_entrepreneur_headers(other_entrepreneur_user: User) -> dict[str, str]:
    token = create_access_token(
        user_id=other_entrepreneur_user.id,
        role=other_entrepreneur_user.role,
        email=other_entrepreneur_user.email,
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


@pytest.fixture
def admin_headers(super_admin_user: User) -> dict[str, str]:
    token = create_access_token(
        user_id=super_admin_user.id,
        role=super_admin_user.role,
        email=super_admin_user.email,
    )
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Acceptance Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_booking_review_unauthenticated_returns_401() -> None:
    """Anonymous request to review booking returns 401."""
    booking_id = uuid.uuid4()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            f"/api/v1/bookings/{booking_id}/review",
            json={"rating": 5, "comment": "Great advice!"},
        )
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_booking_review_mentor_forbidden(
    mentor_user: User,
    mentor_headers: dict[str, str],
) -> None:
    """Mentor role cannot submit reviews (403 Forbidden)."""
    booking_id = uuid.uuid4()
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
                f"/api/v1/bookings/{booking_id}/review",
                headers=mentor_headers,
                json={"rating": 5, "comment": "Self review"},
            )
            assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_booking_review_unrelated_entrepreneur_forbidden(
    other_entrepreneur_user: User,
    completed_booking: Booking,
    other_entrepreneur_headers: dict[str, str],
) -> None:
    """Unrelated entrepreneur cannot review someone else's booking (403 Forbidden)."""
    mock_db = AsyncMock()
    mock_execute = MagicMock()
    mock_execute.scalar_one_or_none.return_value = completed_booking
    mock_db.execute.return_value = mock_execute

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return other_entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/bookings/{completed_booking.id}/review",
                headers=other_entrepreneur_headers,
                json={"rating": 5, "comment": "Trying to review"},
            )
            assert response.status_code == 403
            assert "only the booking's entrepreneur" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_booking_review_not_completed_fails(
    entrepreneur_user: User,
    completed_booking: Booking,
    entrepreneur_headers: dict[str, str],
) -> None:
    """Cannot review a booking that is not completed (400 Bad Request)."""
    completed_booking.status = "scheduled"

    mock_db = AsyncMock()
    mock_execute = MagicMock()
    mock_execute.scalar_one_or_none.return_value = completed_booking
    mock_db.execute.return_value = mock_execute

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/bookings/{completed_booking.id}/review",
                headers=entrepreneur_headers,
                json={"rating": 5, "comment": "Good"},
            )
            assert response.status_code == 400
            assert "Only completed bookings can be reviewed" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_booking_review_duplicate_fails(
    entrepreneur_user: User,
    completed_booking: Booking,
    entrepreneur_headers: dict[str, str],
) -> None:
    """Cannot review a booking twice (400 Bad Request)."""
    existing_review = Review(
        id=uuid.uuid4(),
        booking_id=completed_booking.id,
        mentor_id=completed_booking.mentor_id,
        entrepreneur_id=completed_booking.entrepreneur_id,
        rating=4,
        comment="Earlier review",
        created_at=datetime.now(UTC),
    )
    completed_booking.review = existing_review

    mock_db = AsyncMock()
    mock_execute = MagicMock()
    mock_execute.scalar_one_or_none.return_value = completed_booking
    mock_db.execute.return_value = mock_execute

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/bookings/{completed_booking.id}/review",
                headers=entrepreneur_headers,
                json={"rating": 5, "comment": "Trying second review"},
            )
            assert response.status_code == 400
            assert "already been reviewed" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_booking_review_validation_rating_out_of_range(
    entrepreneur_user: User,
    completed_booking: Booking,
    entrepreneur_headers: dict[str, str],
) -> None:
    """Pydantic rejects rating < 1 or > 5 with 422 Unprocessable Entity."""
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
            # Rating = 0
            res1 = await client.post(
                f"/api/v1/bookings/{completed_booking.id}/review",
                headers=entrepreneur_headers,
                json={"rating": 0},
            )
            assert res1.status_code == 422

            # Rating = 6
            res2 = await client.post(
                f"/api/v1/bookings/{completed_booking.id}/review",
                headers=entrepreneur_headers,
                json={"rating": 6},
            )
            assert res2.status_code == 422
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_booking_review_success(
    entrepreneur_user: User,
    completed_booking: Booking,
    mentor_profile: MentorProfile,
    entrepreneur_headers: dict[str, str],
) -> None:
    """Entrepreneur successfully submits review: transitions to 'reviewed', recalculates mentor rating."""
    # Mentor initial rating: 4.0 with 1 review
    assert mentor_profile.rating == 4.0
    assert mentor_profile.review_count == 1

    mock_db = AsyncMock()
    mock_execute = MagicMock()
    mock_execute.scalar_one_or_none.return_value = completed_booking
    mock_db.execute.return_value = mock_execute

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/bookings/{completed_booking.id}/review",
                headers=entrepreneur_headers,
                json={"rating": 5, "comment": "Tariq Bhai helped me refine our cost sheet!"},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["id"] == str(completed_booking.id)
            assert data["status"] == "reviewed"
            assert data["review"] is not None
            assert data["review"]["rating"] == 5
            assert data["review"]["comment"] == "Tariq Bhai helped me refine our cost sheet!"
            assert data["review"]["entrepreneur_id"] == str(entrepreneur_user.id)
            assert data["review"]["mentor_id"] == str(mentor_profile.id)

            # Rating recalculation: ((4.0 * 1) + 5) / 2 = 4.5
            assert mentor_profile.rating == 4.5
            assert mentor_profile.review_count == 2

            # Assert database interactions
            assert mock_db.add.called
            assert mock_db.commit.called
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_booking_review_super_admin_allowed(
    super_admin_user: User,
    completed_booking: Booking,
    admin_headers: dict[str, str],
) -> None:
    """Super Admin is allowed to submit a review for completed booking."""
    mock_db = AsyncMock()
    mock_execute = MagicMock()
    mock_execute.scalar_one_or_none.return_value = completed_booking
    mock_db.execute.return_value = mock_execute

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return super_admin_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/bookings/{completed_booking.id}/review",
                headers=admin_headers,
                json={"rating": 5, "comment": "Admin verified review"},
            )
            assert response.status_code == 200
            assert response.json()["status"] == "reviewed"
    finally:
        app.dependency_overrides.clear()
