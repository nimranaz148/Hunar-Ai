"""Acceptance tests for Task 30: Today View (F-013 / PRD §5.2, §12.3, W-003)."""

import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, date, datetime, timedelta
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
from app.models.user import User


@pytest.fixture
def entrepreneur_user() -> User:
    """Mock entrepreneur user."""
    return User(
        id=uuid.uuid4(),
        email="sara.today@hunar.pk",
        name="Sara Handmades",
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
        email="other.today@hunar.pk",
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
        name="Sara Pottery",
        niche="ceramics",
        city="Lahore",
    )


@pytest.fixture
def sample_calendar(sample_business: Business) -> ContentCalendar:
    """Mock calendar record."""
    return ContentCalendar(
        id=uuid.uuid4(),
        business_id=sample_business.id,
        status="approved",
        pillars=[{"name": "behind_the_scenes", "target_percentage": 50}],
        weekly_themes=[{"week": 1, "theme": "Brand Story"}],
        format_distribution={"reels": 50, "carousels": 50},
        day_briefs=[],
        approved_at=datetime.now(UTC),
        created_at=datetime.now(UTC),
    )


@pytest.fixture
def today_item(sample_calendar: ContentCalendar) -> ContentItem:
    """Mock content item scheduled for today."""
    today = date.today()
    return ContentItem(
        id=uuid.uuid4(),
        calendar_id=sample_calendar.id,
        day=5,
        date=today,
        platform=["instagram"],
        format="reel",
        pillar="behind_the_scenes",
        goal="awareness",
        hook="Kaisay banti hai ceramic plate",
        caption="Clay shaping se le kar kiln firing tak ka mukammal safar.",
        cta="Comment 'PRICE' to get catalog on WhatsApp",
        hashtags=["#potterypakistan", "#handmadeceramics"],
        best_time_hint="7:30 PM PKT",
        image_prompt={"prompt": "Clay molding closeup"},
        video_prompt={"prompt": "Wheel spinning reel with soft music"},
        alt_text="Artisan shaping clay on wheel",
        status="approved",
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
async def test_get_today_content_item_exact_date(
    client: AsyncClient,
    entrepreneur_user: User,
    sample_business: Business,
    today_item: ContentItem,
) -> None:
    """Test retrieving today's post matching today's exact date."""
    mock_db = AsyncMock()

    async def mock_execute(statement: Any, *args: Any, **kwargs: Any) -> MagicMock:
        mock_result = MagicMock()
        stmt_str = str(statement)
        if "FROM businesses" in stmt_str:
            mock_result.scalar_one_or_none.return_value = sample_business
        elif "FROM content_items" in stmt_str:
            mock_result.scalars.return_value.all.return_value = [today_item]
            mock_result.scalar_one_or_none.return_value = today_item
        return mock_result

    mock_db.execute = mock_execute

    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        headers = get_auth_headers(entrepreneur_user)
        res = await client.get(
            f"/api/v1/businesses/{sample_business.id}/content/today",
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == str(today_item.id)
        assert data["day"] == 5
        assert data["hook"] == "Kaisay banti hai ceramic plate"
        assert data["status"] == "approved"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_today_content_item_fallback(
    client: AsyncClient,
    entrepreneur_user: User,
    sample_business: Business,
    today_item: ContentItem,
) -> None:
    """Test retrieving next upcoming unposted post if none matches today's exact date."""
    mock_db = AsyncMock()

    # today_item has date in future
    today_item.date = date.today() + timedelta(days=2)

    async def mock_execute(statement: Any, *args: Any, **kwargs: Any) -> MagicMock:
        mock_result = MagicMock()
        stmt_str = str(statement)
        if "FROM businesses" in stmt_str:
            mock_result.scalar_one_or_none.return_value = sample_business
        elif "FROM content_items" in stmt_str:
            # First query for exact today returns empty
            if "date ==" in stmt_str or "date =" in stmt_str:
                mock_result.scalar_one_or_none.return_value = None
                mock_result.scalars.return_value.all.return_value = []
            else:
                # Fallback query returns upcoming item
                mock_result.scalar_one_or_none.return_value = today_item
                mock_result.scalars.return_value.all.return_value = [today_item]
        return mock_result

    mock_db.execute = mock_execute

    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        headers = get_auth_headers(entrepreneur_user)
        res = await client.get(
            f"/api/v1/businesses/{sample_business.id}/content/today",
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == str(today_item.id)
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_mark_post_as_posted_success(
    client: AsyncClient,
    entrepreneur_user: User,
    sample_business: Business,
    today_item: ContentItem,
) -> None:
    """Test marking today's post as posted with optional post URL and audit log."""
    mock_db = AsyncMock()

    async def mock_execute(statement: Any, *args: Any, **kwargs: Any) -> MagicMock:
        mock_result = MagicMock()
        stmt_str = str(statement)
        if "FROM businesses" in stmt_str:
            mock_result.scalar_one_or_none.return_value = sample_business
        elif "FROM content_items" in stmt_str:
            mock_result.scalar_one_or_none.return_value = today_item
        return mock_result

    mock_db.execute = mock_execute

    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        headers = get_auth_headers(entrepreneur_user)
        post_payload = {
            "post_url": "https://instagram.com/p/DA_ceramic_reel123",
        }

        res = await client.post(
            f"/api/v1/businesses/{sample_business.id}/content/items/{today_item.id}/post",
            json=post_payload,
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == str(today_item.id)
        assert data["status"] == "posted"
        assert data["post_url"] == "https://instagram.com/p/DA_ceramic_reel123"
        assert data["posted_at"] is not None
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_today_content_cross_tenant_forbidden(
    client: AsyncClient,
    other_entrepreneur: User,
    sample_business: Business,
    today_item: ContentItem,
) -> None:
    """Test cross-tenant access to today's post is rejected with 403."""
    mock_db = AsyncMock()

    async def mock_execute(statement: Any, *args: Any, **kwargs: Any) -> MagicMock:
        mock_result = MagicMock()
        stmt_str = str(statement)
        if "FROM businesses" in stmt_str:
            mock_result.scalar_one_or_none.return_value = sample_business
        elif "FROM content_items" in stmt_str:
            mock_result.scalar_one_or_none.return_value = today_item
        return mock_result

    mock_db.execute = mock_execute

    app.dependency_overrides[get_current_user] = lambda: other_entrepreneur
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        headers = get_auth_headers(other_entrepreneur)
        res = await client.get(
            f"/api/v1/businesses/{sample_business.id}/content/today",
            headers=headers,
        )
        assert res.status_code == 403
    finally:
        app.dependency_overrides.clear()
