"""Acceptance tests for Task 31: Research Report View (F-014 / PRD §5.2, §12.1, §36.15)."""

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
from app.models.business import Business
from app.models.content import ResearchReport
from app.models.user import User


@pytest.fixture
def entrepreneur_user() -> User:
    """Mock entrepreneur user."""
    return User(
        id=uuid.uuid4(),
        email="fatima.research@hunar.pk",
        name="Fatima Textile",
        role="entrepreneur",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def other_entrepreneur() -> User:
    """Mock cross-tenant entrepreneur."""
    return User(
        id=uuid.uuid4(),
        email="other.research@hunar.pk",
        name="Other User",
        role="entrepreneur",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def sample_business(entrepreneur_user: User) -> Business:
    """Mock business record."""
    return Business(
        id=uuid.uuid4(),
        owner_id=entrepreneur_user.id,
        name="Fatima Silks",
        niche="apparel",
        city="Lahore",
        area="Gulberg",
        budget_pkr=50000,
        hours_per_week=20,
        tone="professional",
        languages=["roman_ur", "en"],
        platforms=["instagram", "facebook"],
        target_customer="Women 20-40",
    )


@pytest.fixture
def sample_research_report(sample_business: Business) -> ResearchReport:
    """Mock research report record."""
    return ResearchReport(
        id=uuid.uuid4(),
        business_id=sample_business.id,
        competitors=[
            {
                "name": "Silk Studio Lahore",
                "handle": "@silk_lahore",
                "price_point": "mid-high",
                "key_advantage": "Fast 2-day delivery across Pakistan",
                "weakness": "High prices and slow customer response",
            },
            {
                "name": "Handmade Pret Collective",
                "handle": "@handmade_pret",
                "price_point": "affordable",
                "key_advantage": "Viral reel engagement with artisan voiceovers",
                "weakness": "Limited sizing options",
            },
        ],
        how_to_be_better=[
            "Focus on transparent artisan weaving background and unboxing videos",
            "Offer clear WhatsApp direct inquiry links in bio with 5-minute reply time",
            "Package orders with handwritten Urdu thank-you notes for organic story reposts",
        ],
        hashtags={
            "broad": ["#apparellahore", "#pakistanifashion", "#handmadesilk"],
            "niche": ["#puredupattas", "#handwovensilk"],
            "local": ["#lahorestyle", "#lahoreshopping"],
        },
        confidence=0.88,
        source_urls=[
            "https://instagram.com/explore/tags/apparellahore/",
            "https://facebook.com/marketplace/lahore",
        ],
        researched_at=datetime.now(UTC),
        created_at=datetime.now(UTC),
    )


@pytest.fixture
def auth_headers(entrepreneur_user: User) -> dict[str, str]:
    """Auth token header for entrepreneur."""
    token = create_access_token(
        user_id=entrepreneur_user.id, role=entrepreneur_user.role, email=entrepreneur_user.email
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other_auth_headers(other_entrepreneur: User) -> dict[str, str]:
    """Auth token header for cross-tenant user."""
    token = create_access_token(
        user_id=other_entrepreneur.id, role=other_entrepreneur.role, email=other_entrepreneur.email
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_get_research_report_success(
    entrepreneur_user: User,
    sample_business: Business,
    sample_research_report: ResearchReport,
    auth_headers: dict[str, str],
) -> None:
    """Test retrieving competitor research report successfully (F-014)."""
    mock_session = AsyncMock()

    async def mock_execute(stmt: Any) -> Any:
        query_str = str(stmt)
        res = MagicMock()
        if "FROM businesses" in query_str:
            res.scalar_one_or_none.return_value = sample_business
        elif "FROM research_reports" in query_str:
            res.scalar_one_or_none.return_value = sample_research_report
        else:
            res.scalar_one_or_none.return_value = None
        return res

    mock_session.execute = AsyncMock(side_effect=mock_execute)
    mock_session.commit = AsyncMock()

    async def override_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_session

    async def override_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(
            f"/api/v1/businesses/{sample_business.id}/content/research",
            headers=auth_headers,
        )

    app.dependency_overrides.clear()

    assert resp.status_code == 200
    data = resp.json()
    assert data["business_id"] == str(sample_business.id)
    assert len(data["competitors"]) == 2
    assert data["competitors"][0]["name"] == "Silk Studio Lahore"
    assert len(data["how_to_be_better"]) == 3
    assert data["hashtags"]["broad"] == ["#apparellahore", "#pakistanifashion", "#handmadesilk"]
    assert data["confidence"] == 0.88
    assert len(data["source_urls"]) == 2


@pytest.mark.asyncio
async def test_get_research_report_cross_tenant_forbidden(
    other_entrepreneur: User,
    sample_business: Business,
    sample_research_report: ResearchReport,
    other_auth_headers: dict[str, str],
) -> None:
    """Test cross-tenant access to research report is rejected with 403 Forbidden."""
    mock_session = AsyncMock()

    async def mock_execute(stmt: Any) -> Any:
        query_str = str(stmt)
        res = MagicMock()
        if "FROM businesses" in query_str:
            res.scalar_one_or_none.return_value = sample_business
        elif "FROM research_reports" in query_str:
            res.scalar_one_or_none.return_value = sample_research_report
        return res

    mock_session.execute = AsyncMock(side_effect=mock_execute)

    async def override_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_session

    async def override_user() -> User:
        return other_entrepreneur

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(
            f"/api/v1/businesses/{sample_business.id}/content/research",
            headers=other_auth_headers,
        )

    app.dependency_overrides.clear()

    assert resp.status_code == 403
    assert "permission" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_research_report_business_not_found(
    entrepreneur_user: User,
    auth_headers: dict[str, str],
) -> None:
    """Test retrieving research report for nonexistent business returns 404 Not Found."""
    mock_session = AsyncMock()

    async def mock_execute(stmt: Any) -> Any:
        res = MagicMock()
        res.scalar_one_or_none.return_value = None
        return res

    mock_session.execute = AsyncMock(side_effect=mock_execute)

    async def override_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_session

    async def override_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user

    random_id = uuid.uuid4()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(
            f"/api/v1/businesses/{random_id}/content/research",
            headers=auth_headers,
        )

    app.dependency_overrides.clear()

    assert resp.status_code == 404
