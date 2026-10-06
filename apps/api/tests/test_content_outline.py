"""Acceptance tests for Task 27: Content Outline Approval (F-010 - Human Gate 2 / PRD §12.1, §36.7, §36.16)."""

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
from app.models.content import ContentCalendar, ResearchReport
from app.models.user import User


@pytest.fixture
def entrepreneur_user() -> User:
    """Mock entrepreneur user."""
    return User(
        id=uuid.uuid4(),
        email="fatima.content@hunar.pk",
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
        email="other.content@hunar.pk",
        name="Other Entrepreneur",
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
        name="Fatima Embroideries",
        niche="apparel",
        city="Lahore",
        area="Gulberg",
        budget_pkr=35000,
        hours_per_week=20,
        tone="friendly",
        languages=["roman_ur", "urdu"],
        platforms=["instagram", "facebook"],
        target_customer="Women looking for handcrafted dupattas and kurtis",
    )


@pytest.fixture
def sample_research(sample_business: Business) -> ResearchReport:
    """Mock research report record."""
    return ResearchReport(
        id=uuid.uuid4(),
        business_id=sample_business.id,
        competitors=[
            {
                "name": "Khaadi Studio",
                "handle": "@khaadistudio",
                "price_point": "mid-high",
                "key_advantage": "Fast delivery",
            },
            {
                "name": "Zeenat Pret",
                "handle": "@zeenatpret",
                "price_point": "affordable",
                "key_advantage": "Viral reels",
            },
        ],
        how_to_be_better=[
            "Highlight hand-stitched detailing in short-form video",
            "Offer custom colour palette options for seasonal weddings",
        ],
        hashtags={
            "broad": ["#pakistanifashion", "#easternwear", "#handcrafted"],
            "niche": ["#handembroiderylahore", "#chikanworkkurti"],
            "local": ["#lahorefashionistas", "#gulbergshopping"],
        },
        confidence=0.88,
        source_urls=["https://instagram.com/explore/tags/chikanworkkurti/"],
        researched_at=datetime.now(UTC),
    )


@pytest.fixture
def sample_calendar(sample_business: Business) -> ContentCalendar:
    """Mock content calendar record awaiting approval."""
    day_briefs = [
        {
            "day": i + 1,
            "format": "reel" if (i % 3 == 0) else ("carousel" if (i % 3 == 1) else "story"),
            "pillar": "behind_the_scenes" if (i % 2 == 0) else "product_showcase",
            "goal": "engagement" if (i % 2 == 0) else "sales",
            "key_idea": f"Highlight day {i + 1} artisan technique or customer story",
        }
        for i in range(30)
    ]
    return ContentCalendar(
        id=uuid.uuid4(),
        business_id=sample_business.id,
        status="awaiting_approval",
        pillars=[
            {
                "name": "behind_the_scenes",
                "description": "Crafting process & workshop",
                "target_percentage": 35,
            },
            {
                "name": "product_showcase",
                "description": "Finished collections & styling",
                "target_percentage": 40,
            },
            {
                "name": "social_proof",
                "description": "Customer reviews and unboxing",
                "target_percentage": 25,
            },
        ],
        weekly_themes=[
            {
                "week": 1,
                "theme": "Brand Story & Heritage",
                "objective": "Build trust and brand identity",
            },
            {
                "week": 2,
                "theme": "Craftsmanship & Detail",
                "objective": "Differentiate quality and material",
            },
            {
                "week": 3,
                "theme": "Styling & Seasonal Wear",
                "objective": "Drive styling inspiration and saves",
            },
            {
                "week": 4,
                "theme": "Customer Love & Special Offers",
                "objective": "Convert interest into orders",
            },
        ],
        format_distribution={"reels": 40, "carousels": 35, "stories": 25},
        day_briefs=day_briefs,
        revision_notes=None,
        approved_at=None,
        created_at=datetime.now(UTC),
    )


def get_auth_headers(user: User) -> dict[str, str]:
    token = create_access_token(user_id=user.id, role=user.role, email=user.email)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_get_content_outline_success(
    client: AsyncClient,
    entrepreneur_user: User,
    sample_business: Business,
    sample_calendar: ContentCalendar,
    sample_research: ResearchReport,
) -> None:
    """Test owner can fetch the Gate 2 content outline and research report."""
    mock_db = AsyncMock()

    async def mock_execute(statement: Any, *args: Any, **kwargs: Any) -> MagicMock:
        mock_result = MagicMock()
        stmt_str = str(statement)
        if "FROM businesses" in stmt_str:
            mock_result.scalar_one_or_none.return_value = sample_business
        elif "FROM content_calendars" in stmt_str:
            mock_result.scalar_one_or_none.return_value = sample_calendar
        elif "FROM research_reports" in stmt_str:
            mock_result.scalar_one_or_none.return_value = sample_research
        else:
            mock_result.scalar_one_or_none.return_value = None
        return mock_result

    mock_db.execute = AsyncMock(side_effect=mock_execute)
    mock_db.commit = AsyncMock()

    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = await client.get(
            f"/api/v1/businesses/{sample_business.id}/content/outline",
            headers=get_auth_headers(entrepreneur_user),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["calendar"]["id"] == str(sample_calendar.id)
        assert data["calendar"]["status"] == "awaiting_approval"
        assert len(data["calendar"]["day_briefs"]) == 30
        assert len(data["calendar"]["weekly_themes"]) == 4
        assert len(data["calendar"]["pillars"]) == 3
        assert data["research"]["confidence"] == 0.88
        assert len(data["research"]["competitors"]) == 2
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_content_outline_cross_tenant_forbidden(
    client: AsyncClient,
    other_entrepreneur: User,
    sample_business: Business,
) -> None:
    """Test cross-tenant access to another entrepreneur's outline returns 403."""
    mock_db = AsyncMock()

    async def mock_execute(statement: Any, *args: Any, **kwargs: Any) -> MagicMock:
        mock_result = MagicMock()
        stmt_str = str(statement)
        if "FROM businesses" in stmt_str:
            mock_result.scalar_one_or_none.return_value = sample_business
        return mock_result

    mock_db.execute = AsyncMock(side_effect=mock_execute)
    app.dependency_overrides[get_current_user] = lambda: other_entrepreneur
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = await client.get(
            f"/api/v1/businesses/{sample_business.id}/content/outline",
            headers=get_auth_headers(other_entrepreneur),
        )
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_approve_content_outline_success(
    client: AsyncClient,
    entrepreneur_user: User,
    sample_business: Business,
    sample_calendar: ContentCalendar,
) -> None:
    """Test approving Gate 2 outline transitions status to approved and writes audit log."""
    mock_db = AsyncMock()

    async def mock_execute(statement: Any, *args: Any, **kwargs: Any) -> MagicMock:
        mock_result = MagicMock()
        stmt_str = str(statement)
        if "FROM businesses" in stmt_str:
            mock_result.scalar_one_or_none.return_value = sample_business
        elif "FROM content_calendars" in stmt_str:
            mock_result.scalar_one_or_none.return_value = sample_calendar
        return mock_result

    mock_db.execute = AsyncMock(side_effect=mock_execute)
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()
    mock_db.add = MagicMock()

    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = await client.post(
            f"/api/v1/businesses/{sample_business.id}/content/outline/approve",
            headers=get_auth_headers(entrepreneur_user),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "approved"
        assert sample_calendar.status == "approved"
        assert sample_calendar.approved_at is not None
        # Check audit log added
        assert mock_db.add.called
        added_objs = [call.args[0] for call in mock_db.add.call_args_list]
        audit_events = [obj.action for obj in added_objs if hasattr(obj, "action")]
        assert "content_outline.approved" in audit_events
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_revise_content_outline_success(
    client: AsyncClient,
    entrepreneur_user: User,
    sample_business: Business,
    sample_calendar: ContentCalendar,
) -> None:
    """Test requesting revision updates status to revision_requested and records notes."""
    mock_db = AsyncMock()

    async def mock_execute(statement: Any, *args: Any, **kwargs: Any) -> MagicMock:
        mock_result = MagicMock()
        stmt_str = str(statement)
        if "FROM businesses" in stmt_str:
            mock_result.scalar_one_or_none.return_value = sample_business
        elif "FROM content_calendars" in stmt_str:
            mock_result.scalar_one_or_none.return_value = sample_calendar
        return mock_result

    mock_db.execute = AsyncMock(side_effect=mock_execute)
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()
    mock_db.add = MagicMock()

    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = await client.post(
            f"/api/v1/businesses/{sample_business.id}/content/outline/revise",
            json={"notes": "Please focus more on behind-the-scenes embroidery videos."},
            headers=get_auth_headers(entrepreneur_user),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "revision_requested"
        assert sample_calendar.status == "revision_requested"
        assert "behind-the-scenes" in (sample_calendar.revision_notes or "")
        # Check audit log added
        assert mock_db.add.called
        added_objs = [call.args[0] for call in mock_db.add.call_args_list]
        audit_events = [obj.action for obj in added_objs if hasattr(obj, "action")]
        assert "content_outline.revision_requested" in audit_events
    finally:
        app.dependency_overrides.clear()
