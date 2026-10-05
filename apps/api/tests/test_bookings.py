"""Acceptance tests for Task 35: Book a Service (F-019 / PRD §5, §10 W-005, §12.3, §13.2)."""

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
def entrepreneur_user() -> User:
    """Mock entrepreneur user."""
    return User(
        id=uuid.uuid4(),
        email="fatima.booking@hunar.pk",
        name="Fatima Ali",
        role="entrepreneur",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def mentor_user() -> User:
    """Mock mentor user account."""
    return User(
        id=uuid.uuid4(),
        email="mentor.booking@hunar.pk",
        name="Tariq Mansoor",
        role="mentor",
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
        languages=["ur", "roman_ur", "en"],
        city="Lahore",
        bio="10+ years scaling Pakistani artisanal and apparel brands.",
        avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        rating=4.95,
        review_count=18,
        status="active",
    )
    profile.user = mentor_user
    return profile


@pytest.fixture
def sample_service(mentor_profile: MentorProfile) -> MentorService:
    """Mock mentor service."""
    service = MentorService(
        id=uuid.uuid4(),
        mentor_id=mentor_profile.id,
        title="1-on-1 Brand Strategy Session",
        description="Deep dive into packaging, pricing, and social distribution for handmade items.",
        niche="handmade",
        type="session",
        price_pkr=4500,
        duration_min=60,
        active=True,
    )
    service.mentor = mentor_profile
    return service


@pytest.fixture
def sample_booking(
    sample_service: MentorService,
    mentor_profile: MentorProfile,
    entrepreneur_user: User,
) -> Booking:
    """Mock booking with associated simulated payment."""
    booking_id = uuid.uuid4()
    now = datetime.now(UTC)
    booking = Booking(
        id=booking_id,
        service_id=sample_service.id,
        mentor_id=mentor_profile.id,
        entrepreneur_id=entrepreneur_user.id,
        status="requested",
        scheduled_at=now + timedelta(days=2),
        notes="I need help determining my wholesale vs retail markup.",
        session_notes=None,
        created_at=now,
    )
    booking.service = sample_service
    booking.mentor = mentor_profile
    booking.entrepreneur = entrepreneur_user

    payment = PaymentSim(
        id=uuid.uuid4(),
        booking_id=booking_id,
        amount_pkr=4500,
        status="held",
        created_at=now,
    )
    payment.booking = booking
    booking.payment = payment
    return booking


@pytest.fixture
def entrepreneur_auth_headers(entrepreneur_user: User) -> dict[str, str]:
    """Auth headers for entrepreneur user."""
    token = create_access_token(
        user_id=entrepreneur_user.id,
        role=entrepreneur_user.role,
        email=entrepreneur_user.email,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def mentor_auth_headers(mentor_user: User) -> dict[str, str]:
    """Auth headers for mentor user."""
    token = create_access_token(
        user_id=mentor_user.id,
        role=mentor_user.role,
        email=mentor_user.email,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_create_booking_unauthenticated_returns_401() -> None:
    """Anonymous request to create a booking is rejected with 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/bookings",
            json={"service_id": str(uuid.uuid4()), "notes": "Help needed"},
        )
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_booking_success(
    entrepreneur_user: User,
    sample_service: MentorService,
    mentor_profile: MentorProfile,
    entrepreneur_auth_headers: dict[str, str],
) -> None:
    """Entrepreneur successfully creates booking and held payment simulation is initialized."""
    mock_db = AsyncMock()

    service_result = MagicMock()
    service_result.scalar_one_or_none.return_value = sample_service
    mock_db.execute.return_value = service_result

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            scheduled_time = (datetime.now(UTC) + timedelta(days=3)).isoformat()
            payload = {
                "service_id": str(sample_service.id),
                "notes": "Help with packaging supplier selection",
                "scheduled_at": scheduled_time,
            }
            response = await client.post("/api/v1/bookings", json=payload, headers=entrepreneur_auth_headers)
            assert response.status_code == 201
            data = response.json()
            assert data["service_id"] == str(sample_service.id)
            assert data["status"] == "requested"
            assert data["notes"] == "Help with packaging supplier selection"
            assert data["amount_pkr"] == sample_service.price_pkr
            assert data["payment_status"] == "held"
            assert data["mentor_name"] == mentor_profile.user.name
            assert mock_db.commit.called
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_create_booking_inactive_service_returns_400(
    entrepreneur_user: User,
    sample_service: MentorService,
    entrepreneur_auth_headers: dict[str, str],
) -> None:
    """Booking an inactive service returns 400 Bad Request."""
    sample_service.active = False
    mock_db = AsyncMock()

    service_result = MagicMock()
    service_result.scalar_one_or_none.return_value = sample_service
    mock_db.execute.return_value = service_result

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            payload = {"service_id": str(sample_service.id)}
            response = await client.post("/api/v1/bookings", json=payload, headers=entrepreneur_auth_headers)
            assert response.status_code == 400
            assert "Service is not active" in response.json()["detail"]
    finally:
        sample_service.active = True
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_create_booking_mentor_cannot_book_own_service(
    mentor_user: User,
    sample_service: MentorService,
    mentor_auth_headers: dict[str, str],
) -> None:
    """Mentor cannot book their own service."""
    mock_db = AsyncMock()

    service_result = MagicMock()
    service_result.scalar_one_or_none.return_value = sample_service
    mock_db.execute.return_value = service_result

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return mentor_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            payload = {"service_id": str(sample_service.id)}
            # Mentor role cannot access entrepreneur booking endpoint directly (returns 403 or 400)
            response = await client.post("/api/v1/bookings", json=payload, headers=mentor_auth_headers)
            assert response.status_code in [400, 403]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_list_bookings_entrepreneur_scoped(
    entrepreneur_user: User,
    sample_booking: Booking,
    entrepreneur_auth_headers: dict[str, str],
) -> None:
    """Entrepreneur only sees their own booked services."""
    mock_db = AsyncMock()

    count_result = MagicMock()
    count_result.scalar.return_value = 1

    items_result = MagicMock()
    items_result.scalars.return_value.all.return_value = [sample_booking]

    mock_db.execute.side_effect = [count_result, items_result]

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/v1/bookings", headers=entrepreneur_auth_headers)
            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 1
            assert len(data["items"]) == 1
            assert data["items"][0]["id"] == str(sample_booking.id)
            assert data["items"][0]["status"] == "requested"
            assert data["items"][0]["amount_pkr"] == 4500
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_booking_detail_participant_success(
    entrepreneur_user: User,
    sample_booking: Booking,
    entrepreneur_auth_headers: dict[str, str],
) -> None:
    """Participant entrepreneur can view full booking details."""
    mock_db = AsyncMock()

    booking_result = MagicMock()
    booking_result.scalar_one_or_none.return_value = sample_booking
    mock_db.execute.return_value = booking_result

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(f"/api/v1/bookings/{sample_booking.id}", headers=entrepreneur_auth_headers)
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == str(sample_booking.id)
            assert data["notes"] == sample_booking.notes
            assert data["payment_status"] == "held"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_booking_detail_third_party_forbidden_403(
    sample_booking: Booking,
) -> None:
    """User who is not the entrepreneur or mentor receives 403 Forbidden."""
    third_party_user = User(
        id=uuid.uuid4(),
        email="intruder@hunar.pk",
        name="Third Party",
        role="entrepreneur",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
    )
    token = create_access_token(
        user_id=third_party_user.id,
        role=third_party_user.role,
        email=third_party_user.email,
    )
    headers = {"Authorization": f"Bearer {token}"}

    mock_db = AsyncMock()
    booking_result = MagicMock()
    booking_result.scalar_one_or_none.return_value = sample_booking
    mock_db.execute.return_value = booking_result

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return third_party_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(f"/api/v1/bookings/{sample_booking.id}", headers=headers)
            assert response.status_code == 403
            assert "Access denied" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_booking_detail_not_found(
    entrepreneur_user: User,
    entrepreneur_auth_headers: dict[str, str],
) -> None:
    """Non-existent booking returns 404."""
    mock_db = AsyncMock()
    booking_result = MagicMock()
    booking_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = booking_result

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(f"/api/v1/bookings/{uuid.uuid4()}", headers=entrepreneur_auth_headers)
            assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()
