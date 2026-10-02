"""Acceptance tests for Task 20: Business Profile View & Edit (F-004 / PRD §5.2, §13.2)."""

import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token
from app.auth.password import hash_password
from app.core.database import get_db
from app.main import app
from app.models.business import Business
from app.models.user import User
from app.schemas.business import UpdateBusinessRequest


@pytest.fixture
def entrepreneur_user() -> User:
    """Mock entrepreneur user."""
    return User(
        id=uuid.uuid4(),
        email="fatima@hunar.pk",
        name="Fatima Khan",
        role="entrepreneur",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def other_entrepreneur() -> User:
    """Mock another entrepreneur user for cross-tenant testing."""
    return User(
        id=uuid.uuid4(),
        email="ayesha@hunar.pk",
        name="Ayesha Khan",
        role="entrepreneur",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def sample_business(entrepreneur_user: User) -> Business:
    """Mock sample business record."""
    return Business(
        id=uuid.uuid4(),
        owner_id=entrepreneur_user.id,
        program_id=None,
        name="Gulshan Bakes",
        niche="food",
        city="Karachi",
        area="Gulshan-e-Iqbal",
        budget_pkr=25000,
        hours_per_week=20,
        tone="friendly",
        languages=["roman_ur", "en"],
        platforms=["instagram", "facebook"],
        target_customer="Local families looking for custom cakes",
        created_at=datetime.now(UTC),
    )


def get_auth_headers(user: User) -> dict[str, str]:
    """Generate bearer token header for a mock user."""
    token = create_access_token(user_id=user.id, role=user.role, email=user.email)
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# 1. Unit: Schema validation
# ---------------------------------------------------------------------------


def test_update_business_schema_validation() -> None:
    """UpdateBusinessRequest validates niche, budget bounds, and string limits."""
    valid_data = {
        "name": "Updated Bakes",
        "niche": "food",
        "city": "Lahore",
        "budget_pkr": 30000,
        "hours_per_week": 25,
        "tone": "professional",
        "languages": ["ur", "en"],
        "platforms": ["instagram"],
    }
    req = UpdateBusinessRequest(**valid_data)
    assert req.name == "Updated Bakes"
    assert req.budget_pkr == 30000

    # Niche must be allowed
    with pytest.raises(ValueError):
        UpdateBusinessRequest(
            name="Valid Name",
            niche="unsupported_niche",
            city="Karachi",
            budget_pkr=20000,
            hours_per_week=10,
        )

    # Budget < 1000 rejected
    with pytest.raises(ValueError):
        UpdateBusinessRequest(
            name="Valid Name",
            niche="food",
            city="Karachi",
            budget_pkr=500,
            hours_per_week=10,
        )


# ---------------------------------------------------------------------------
# 2. Integration: GET /api/v1/businesses
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_my_business(
    entrepreneur_user: User,
    sample_business: Business,
) -> None:
    """GET /api/v1/businesses returns current user's business."""
    mock_db = AsyncMock()

    mock_db_result = MagicMock()
    mock_db_result.scalar_one_or_none.return_value = sample_business
    mock_db.execute.return_value = mock_db_result

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user

    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(
                "/api/v1/businesses",
                headers=get_auth_headers(entrepreneur_user),
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["id"] == str(sample_business.id)
            assert data["name"] == "Gulshan Bakes"
            assert data["budget_pkr"] == 25000
    finally:
        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# 3. Integration: Ownership scoping on PATCH /api/v1/businesses/{id}
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_patch_business_ownership_enforcement(
    entrepreneur_user: User,
    other_entrepreneur: User,
    sample_business: Business,
) -> None:
    """PATCH /api/v1/businesses/{id} rejects update by a non-owner with 403."""
    mock_db = AsyncMock()

    mock_db_result = MagicMock()
    mock_db_result.scalar_one_or_none.return_value = sample_business
    mock_db.execute.return_value = mock_db_result

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    # Call endpoint as other_entrepreneur (who is NOT the owner)
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: other_entrepreneur

    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.patch(
                f"/api/v1/businesses/{sample_business.id}",
                headers=get_auth_headers(other_entrepreneur),
                json={"name": "Hacked Business Name"},
            )
            assert resp.status_code == 403
    finally:
        app.dependency_overrides.clear()
