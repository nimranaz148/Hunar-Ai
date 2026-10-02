"""Acceptance tests for Task 22: Validation Report View (F-006 / PRD §5.2, §36.12, §14.1)."""

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
from app.models.business import Business, ValidationReport
from app.models.user import User


@pytest.fixture
def entrepreneur_user() -> User:
    """Mock entrepreneur user."""
    return User(
        id=uuid.uuid4(),
        email="fatima.validator@hunar.pk",
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
        email="ayesha.validator@hunar.pk",
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
        budget_pkr=30000,
        hours_per_week=25,
        tone="friendly",
        languages=["roman_ur", "ur"],
        platforms=["whatsapp", "instagram"],
        target_customer="Working moms looking for customized birthday treats",
    )


@pytest.fixture
def sample_report(sample_business: Business) -> ValidationReport:
    """Mock sample validation report."""
    return ValidationReport(
        id=uuid.uuid4(),
        business_id=sample_business.id,
        competitors=[
            {
                "name": "Karachi Home Delights",
                "what_they_do_well": "Strong presence on Foodpanda and active WhatsApp broadcast list.",
                "gap_we_can_exploit": "High minimum order value and generic packaging.",
                "source_url": "https://instagram.com/karachi_homedelights",
            },
            {
                "name": "Sweet Cravings Bakery",
                "what_they_do_well": "High-end fondant customized cakes.",
                "gap_we_can_exploit": "Requires 3-day advance notice; premium pricing.",
                "source_url": "https://instagram.com/sweetcravings_pk",
            },
        ],
        how_to_be_better=[
            "Offer miniature trial bento cakes.",
            "Guarantee 2-hour WhatsApp response time.",
            "Use signature branded packaging.",
        ],
        confidence="high",
        demand_summary="Strong year-round demand for home-baked items in Karachi.",
        pricing_insight="Average gross margin is 45-60%.",
        reasoning="Gulshan Bakes has strong viability with PKR 30,000 budget.",
        created_at=datetime.now(UTC),
    )


def get_auth_headers(user: User) -> dict[str, str]:
    """Generate Authorization header with valid JWT token."""
    token = create_access_token(user_id=user.id, role=user.role, email=user.email)
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# 1. Integration: GET /api/v1/businesses/{id}/validation
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_validation_report_not_found(
    entrepreneur_user: User,
    sample_business: Business,
) -> None:
    """GET returns 404 if validation report has not been generated yet."""
    mock_db = AsyncMock()

    # 1. get_business_by_id returns business
    mock_biz_result = MagicMock()
    mock_biz_result.scalar_one_or_none.return_value = sample_business

    # 2. get_validation_report returns None
    mock_rep_result = MagicMock()
    mock_rep_result.scalar_one_or_none.return_value = None

    mock_db.execute.side_effect = [mock_biz_result, mock_rep_result]

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user

    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(
                f"/api/v1/businesses/{sample_business.id}/validation",
                headers=get_auth_headers(entrepreneur_user),
            )
            assert resp.status_code == 404
            assert "Validation report has not been generated yet" in resp.json()["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_validation_report_success(
    entrepreneur_user: User,
    sample_business: Business,
    sample_report: ValidationReport,
) -> None:
    """GET returns 200 with full validation report if available."""
    mock_db = AsyncMock()

    mock_biz_result = MagicMock()
    mock_biz_result.scalar_one_or_none.return_value = sample_business

    mock_rep_result = MagicMock()
    mock_rep_result.scalar_one_or_none.return_value = sample_report

    mock_db.execute.side_effect = [mock_biz_result, mock_rep_result]

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user

    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(
                f"/api/v1/businesses/{sample_business.id}/validation",
                headers=get_auth_headers(entrepreneur_user),
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["confidence"] == "high"
            assert len(data["competitors"]) == 2
            assert data["competitors"][0]["name"] == "Karachi Home Delights"
            assert len(data["how_to_be_better"]) == 3
    finally:
        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# 2. Integration: POST /api/v1/businesses/{id}/validation/generate
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_generate_validation_report_success(
    entrepreneur_user: User,
    sample_business: Business,
) -> None:
    """POST /generate runs Idea Validator agent and stores new report."""
    mock_db = AsyncMock()

    # 1. get_business_by_id
    mock_biz_result = MagicMock()
    mock_biz_result.scalar_one_or_none.return_value = sample_business

    # 2. existing report check -> None (not cached)
    mock_rep_result = MagicMock()
    mock_rep_result.scalar_one_or_none.return_value = None

    # 3. products query -> []
    mock_prod_result = MagicMock()
    mock_prod_result.scalars.return_value.all.return_value = []

    mock_db.execute.side_effect = [mock_biz_result, mock_rep_result, mock_prod_result]

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user

    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                f"/api/v1/businesses/{sample_business.id}/validation/generate",
                headers=get_auth_headers(entrepreneur_user),
                json={"force_refresh": True},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["confidence"] in ("low", "medium", "high")
            assert len(data["competitors"]) >= 2
            assert len(data["how_to_be_better"]) >= 3
            assert mock_db.add.called
    finally:
        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# 3. Integration: Ownership scoping enforcement (Cross-tenant 403)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_validation_cross_tenant_forbidden(
    other_entrepreneur: User,
    sample_business: Business,
) -> None:
    """Non-owner is rejected with 403 on generate."""
    mock_db = AsyncMock()
    mock_biz_result = MagicMock()
    mock_biz_result.scalar_one_or_none.return_value = sample_business
    mock_db.execute.return_value = mock_biz_result

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: other_entrepreneur

    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                f"/api/v1/businesses/{sample_business.id}/validation/generate",
                headers=get_auth_headers(other_entrepreneur),
            )
            assert resp.status_code == 403
    finally:
        app.dependency_overrides.clear()
