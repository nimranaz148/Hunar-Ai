"""Acceptance tests for Task 34: Browse Mentor Services (F-018 / PRD §5, §12.3, §13.2)."""

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
from app.models.mentor import MentorProfile, MentorService
from app.models.user import User


@pytest.fixture
def entrepreneur_user() -> User:
    """Mock entrepreneur user."""
    return User(
        id=uuid.uuid4(),
        email="entrepreneur.browse@hunar.pk",
        name="Fatima Ali",
        role="entrepreneur",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


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
def mentor_profile(mentor_user: User) -> MentorProfile:
    """Mock active mentor profile."""
    return MentorProfile(
        id=uuid.uuid4(),
        user_id=mentor_user.id,
        niches=["handmade", "stitching_fashion"],
        languages=["ur", "roman_ur", "en"],
        city="Lahore",
        bio="10+ years helping Pakistani artisanal and apparel brands scale direct-to-consumer.",
        avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        rating=4.9,
        review_count=18,
        status="active",
        created_at=datetime.now(UTC),
    )


@pytest.fixture
def sample_services(mentor_profile: MentorProfile, mentor_user: User) -> list[MentorService]:
    """Mock list of active mentor services."""
    mentor_profile.user = mentor_user

    service1 = MentorService(
        id=uuid.uuid4(),
        mentor_id=mentor_profile.id,
        title="1-on-1 Artisanal Product Pricing & Margins",
        description="Deep dive review of your unit economics, material costs, and packaging margins.",
        niche="handmade",
        type="session",
        price_pkr=3500,
        duration_min=60,
        active=True,
        created_at=datetime.now(UTC),
    )
    service1.mentor = mentor_profile

    service2 = MentorService(
        id=uuid.uuid4(),
        mentor_id=mentor_profile.id,
        title="Fashion Catalog & Reels Audit",
        description="Comprehensive review of your Instagram catalog, lighting, and video hooks.",
        niche="stitching_fashion",
        type="review",
        price_pkr=5000,
        duration_min=45,
        active=True,
        created_at=datetime.now(UTC),
    )
    service2.mentor = mentor_profile

    return [service1, service2]


@pytest.fixture
def entrepreneur_token(entrepreneur_user: User) -> str:
    """Create JWT token for entrepreneur."""
    return create_access_token(
        user_id=entrepreneur_user.id,
        role=entrepreneur_user.role,
        email=entrepreneur_user.email,
    )


@pytest.fixture
def auth_headers(entrepreneur_token: str) -> dict[str, str]:
    """Auth headers for API requests."""
    return {"Authorization": f"Bearer {entrepreneur_token}"}


@pytest.mark.asyncio
async def test_browse_services_unauthenticated_returns_401() -> None:
    """Unauthenticated access to /api/v1/services is rejected with 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/services")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_browse_services_success(
    entrepreneur_user: User,
    sample_services: list[MentorService],
    auth_headers: dict[str, str],
) -> None:
    """Entrepreneur retrieves active mentor services with mentor details."""
    mock_db = AsyncMock()

    # Mock count query
    count_result = MagicMock()
    count_result.scalar.return_value = 2

    # Mock items query
    items_result = MagicMock()
    items_result.scalars.return_value.all.return_value = sample_services

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
            response = await client.get("/api/v1/services", headers=auth_headers)
            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 2
            assert len(data["items"]) == 2

            item = data["items"][0]
            assert item["title"] == "1-on-1 Artisanal Product Pricing & Margins"
            assert item["price_pkr"] == 3500
            assert item["duration_min"] == 60
            assert item["niche"] == "handmade"
            assert item["type"] == "session"
            assert item["mentor_name"] == "Tariq Mansoor"
            assert item["mentor_city"] == "Lahore"
            assert item["mentor_rating"] == 4.9
            assert item["mentor_review_count"] == 18
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_service_detail_success(
    entrepreneur_user: User,
    sample_services: list[MentorService],
    auth_headers: dict[str, str],
) -> None:
    """Entrepreneur retrieves full details for a single mentor service."""
    service = sample_services[0]
    mock_db = AsyncMock()

    result = MagicMock()
    result.scalar_one_or_none.return_value = service
    mock_db.execute.return_value = result

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(f"/api/v1/services/{service.id}", headers=auth_headers)
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == str(service.id)
            assert data["title"] == service.title
            assert data["mentor_name"] == "Tariq Mansoor"
            assert data["price_pkr"] == 3500
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_service_detail_not_found(
    entrepreneur_user: User,
    auth_headers: dict[str, str],
) -> None:
    """Requesting non-existent service ID returns 404."""
    mock_db = AsyncMock()

    result = MagicMock()
    result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = result

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            random_id = uuid.uuid4()
            response = await client.get(f"/api/v1/services/{random_id}", headers=auth_headers)
            assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_browse_services_filtered(
    entrepreneur_user: User,
    sample_services: list[MentorService],
    auth_headers: dict[str, str],
) -> None:
    """Entrepreneur filters services by niche and price."""
    mock_db = AsyncMock()

    count_result = MagicMock()
    count_result.scalar.return_value = 1

    items_result = MagicMock()
    items_result.scalars.return_value.all.return_value = [sample_services[0]]

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
            response = await client.get(
                "/api/v1/services?niche=handmade&type=session&max_price=4000&search=Artisanal",
                headers=auth_headers,
            )
            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 1
            assert data["items"][0]["niche"] == "handmade"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_browse_mentors_list(
    entrepreneur_user: User,
    mentor_profile: MentorProfile,
    mentor_user: User,
    auth_headers: dict[str, str],
) -> None:
    """Authenticated user browses mentors list."""
    mentor_profile.user = mentor_user
    mock_db = AsyncMock()

    count_result = MagicMock()
    count_result.scalar.return_value = 1

    items_result = MagicMock()
    items_result.scalars.return_value.all.return_value = [mentor_profile]

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
            response = await client.get("/api/v1/mentors", headers=auth_headers)
            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 1
            assert data["items"][0]["name"] == "Tariq Mansoor"
            assert data["items"][0]["city"] == "Lahore"
            assert "handmade" in data["items"][0]["niches"]
    finally:
        app.dependency_overrides.clear()
