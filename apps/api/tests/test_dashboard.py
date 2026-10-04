"""Acceptance tests for Task 32: Entrepreneur Home Dashboard (D-001 / PRD §7, §29.1)."""

import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, date, datetime
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
from app.models.content import ContentCalendar, ContentItem
from app.models.plan import LaunchPlan, PlanTask
from app.models.user import User


@pytest.fixture
def entrepreneur_user() -> User:
    """Mock entrepreneur user."""
    return User(
        id=uuid.uuid4(),
        email="amina.dash@hunar.pk",
        name="Amina Khan",
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
        email="other.dash@hunar.pk",
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
        name="Amina Crafts",
        niche="crafts",
        city="Karachi",
        area="Clifton",
        budget_pkr=50000,
        hours_per_week=20,
        tone="friendly",
        languages=["roman_ur"],
        platforms=["instagram"],
        target_customer="Youth",
    )


@pytest.fixture
def sample_plan(sample_business: Business) -> LaunchPlan:
    """Mock launch plan with tasks."""
    plan = LaunchPlan(
        id=uuid.uuid4(),
        business_id=sample_business.id,
        status="approved",
        summary="30-day craft launch roadmap",
        approved_at=datetime.now(UTC),
    )
    plan.tasks = [
        PlanTask(
            id=uuid.uuid4(),
            plan_id=plan.id,
            title="Setup WhatsApp Business Catalog",
            category="operations",
            week=1,
            order_index=1,
            status="completed",
        ),
        PlanTask(
            id=uuid.uuid4(),
            plan_id=plan.id,
            title="Shoot raw materials reel",
            category="marketing",
            week=1,
            order_index=2,
            status="pending",
        ),
    ]
    return plan


@pytest.fixture
def sample_calendar(sample_business: Business) -> ContentCalendar:
    """Mock content calendar with items."""
    cal = ContentCalendar(
        id=uuid.uuid4(),
        business_id=sample_business.id,
        status="approved",
        approved_at=datetime.now(UTC),
    )
    today = date.today()
    cal.items = [
        ContentItem(
            id=uuid.uuid4(),
            calendar_id=cal.id,
            day=1,
            date=today,
            status="approved",
            platform=["instagram"],
            format="reel",
            pillar="behind_the_scenes",
            goal="awareness",
            hook="Dekhein kaisay banta hai pure handmade item",
            caption="Mukammal process video!",
            cta="DM to order",
            hashtags=["#crafts", "#handmade"],
            image_prompt={"prompt": "Clay crafting"},
            created_at=datetime.now(UTC),
        ),
        ContentItem(
            id=uuid.uuid4(),
            calendar_id=cal.id,
            day=2,
            date=today,
            status="posted",
            platform=["instagram"],
            format="carousel",
            pillar="product_showcase",
            goal="sales",
            hook="First 10 orders get free delivery",
            caption="Check out new collection",
            cta="Order now",
            hashtags=["#crafts"],
            image_prompt={"prompt": "Product showcase"},
            created_at=datetime.now(UTC),
        ),
    ]
    return cal


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
async def test_get_dashboard_success(
    entrepreneur_user: User,
    sample_business: Business,
    sample_plan: LaunchPlan,
    sample_calendar: ContentCalendar,
    auth_headers: dict[str, str],
) -> None:
    """Test retrieving consolidated entrepreneur home dashboard (D-001)."""
    mock_session = AsyncMock()

    async def mock_execute(stmt: Any) -> Any:
        query_str = str(stmt)
        res = MagicMock()
        if "FROM businesses" in query_str:
            res.scalar_one_or_none.return_value = sample_business
        elif "FROM launch_plans" in query_str:
            res.scalar_one_or_none.return_value = sample_plan
        elif "FROM content_calendars" in query_str:
            res.scalar_one_or_none.return_value = sample_calendar
        else:
            res.scalar_one_or_none.return_value = None
        return res

    mock_session.execute = AsyncMock(side_effect=mock_execute)

    async def override_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_session

    async def override_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(
            f"/api/v1/businesses/{sample_business.id}/dashboard",
            headers=auth_headers,
        )

    app.dependency_overrides.clear()

    assert resp.status_code == 200
    data = resp.json()
    assert data["business_id"] == str(sample_business.id)
    assert data["business_name"] == "Amina Crafts"
    # KPIs
    assert data["tasks_done_count"] == 1
    assert data["total_tasks_count"] == 2
    assert data["posts_published_count"] == 1
    assert data["total_posts_count"] == 2
    assert data["engagement_change_pct"] == 23.0
    assert data["revenue_this_week_pkr"] == 15000
    # Spotlight & Lists
    assert data["today_post"] is not None
    assert data["today_post"]["hook"] == "Dekhein kaisay banta hai pure handmade item"
    assert len(data["trend_7d"]) == 7
    assert len(data["upcoming_tasks"]) == 1
    assert data["upcoming_tasks"][0]["title"] == "Shoot raw materials reel"


@pytest.mark.asyncio
async def test_get_dashboard_cross_tenant_forbidden(
    other_entrepreneur: User,
    sample_business: Business,
    other_auth_headers: dict[str, str],
) -> None:
    """Test cross-tenant entrepreneur cannot access another business dashboard."""
    mock_session = AsyncMock()

    async def mock_execute(stmt: Any) -> Any:
        query_str = str(stmt)
        res = MagicMock()
        if "FROM businesses" in query_str:
            res.scalar_one_or_none.return_value = sample_business
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
            f"/api/v1/businesses/{sample_business.id}/dashboard",
            headers=other_auth_headers,
        )

    app.dependency_overrides.clear()

    assert resp.status_code == 403
    assert "permission" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_dashboard_business_not_found(
    entrepreneur_user: User,
    auth_headers: dict[str, str],
) -> None:
    """Test non-existent business ID returns 404 Not Found."""
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
            f"/api/v1/businesses/{random_id}/dashboard",
            headers=auth_headers,
        )

    app.dependency_overrides.clear()

    assert resp.status_code == 404
