"""Acceptance tests for Task 29: Content Item Detail / Editor (F-012 / PRD §12.3, §27)."""

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
from app.models.user import User


@pytest.fixture
def entrepreneur_user() -> User:
    """Mock entrepreneur user."""
    return User(
        id=uuid.uuid4(),
        email="fatima.silks@hunar.pk",
        name="Fatima Handmades",
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
        email="other.entrepreneur@hunar.pk",
        name="Other User",
        role="entrepreneur",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def sample_business(entrepreneur_user: User) -> Business:
    """Mock business record owned by entrepreneur."""
    return Business(
        id=uuid.uuid4(),
        owner_id=entrepreneur_user.id,
        name="Fatima Silks",
        niche="apparel",
        city="Lahore",
        area="Gulberg",
        budget_pkr=35000,
        hours_per_week=20,
        tone="friendly",
        languages=["roman_ur", "urdu"],
        platforms=["instagram", "facebook"],
        target_customer="Women shopping for handcrafted traditional silk dupattas",
    )


@pytest.fixture
def sample_calendar(sample_business: Business) -> ContentCalendar:
    """Mock content calendar record."""
    return ContentCalendar(
        id=uuid.uuid4(),
        business_id=sample_business.id,
        status="approved",
        pillars=[{"name": "behind_the_scenes", "target_percentage": 50}],
        weekly_themes=[{"week": 1, "theme": "Brand Story"}],
        format_distribution={"reels": 50, "carousels": 50},
        day_briefs=[],
        revision_notes=None,
        approved_at=datetime.now(UTC),
        created_at=datetime.now(UTC),
    )


@pytest.fixture
def sample_item(sample_calendar: ContentCalendar) -> ContentItem:
    """Mock content item for day 1."""
    return ContentItem(
        id=uuid.uuid4(),
        calendar_id=sample_calendar.id,
        day=1,
        date=date(2026, 10, 1),
        platform=["instagram"],
        format="reel",
        pillar="behind_the_scenes",
        goal="awareness",
        hook="Kaisay banta hai pure raw silk dupatta",
        caption="Pure silk handloom making process from scratch.",
        cta="Order on WhatsApp",
        hashtags=["#silk", "#lahore"],
        best_time_hint="7:00 PM PKT",
        image_prompt={"prompt": "Artisan handloom close up"},
        video_prompt={"prompt": "Dyeing process reel"},
        alt_text="Artisan working on raw silk loom",
        status="draft",
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
async def test_get_content_item_detail_success(
    client: AsyncClient,
    entrepreneur_user: User,
    sample_business: Business,
    sample_item: ContentItem,
) -> None:
    """Test owner can fetch single content item detail."""
    mock_db = AsyncMock()

    async def mock_execute(statement: Any, *args: Any, **kwargs: Any) -> MagicMock:
        mock_result = MagicMock()
        stmt_str = str(statement)
        if "FROM businesses" in stmt_str:
            mock_result.scalar_one_or_none.return_value = sample_business
        elif "FROM content_items" in stmt_str:
            mock_result.scalar_one_or_none.return_value = sample_item
        return mock_result

    mock_db.execute = mock_execute

    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        headers = get_auth_headers(entrepreneur_user)
        res = await client.get(
            f"/api/v1/businesses/{sample_business.id}/content/items/{sample_item.id}",
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == str(sample_item.id)
        assert data["day"] == 1
        assert data["hook"] == "Kaisay banta hai pure raw silk dupatta"
        assert data["format"] == "reel"
        assert data["caption"] == "Pure silk handloom making process from scratch."
        assert data["hashtags"] == ["#silk", "#lahore"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_content_item_detail_cross_tenant_forbidden(
    client: AsyncClient,
    other_entrepreneur: User,
    sample_business: Business,
    sample_item: ContentItem,
) -> None:
    """Test non-owner cannot view another user's content item."""
    mock_db = AsyncMock()

    async def mock_execute(statement: Any, *args: Any, **kwargs: Any) -> MagicMock:
        mock_result = MagicMock()
        stmt_str = str(statement)
        if "FROM businesses" in stmt_str:
            mock_result.scalar_one_or_none.return_value = sample_business
        elif "FROM content_items" in stmt_str:
            mock_result.scalar_one_or_none.return_value = sample_item
        return mock_result

    mock_db.execute = mock_execute

    app.dependency_overrides[get_current_user] = lambda: other_entrepreneur
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        headers = get_auth_headers(other_entrepreneur)
        res = await client.get(
            f"/api/v1/businesses/{sample_business.id}/content/items/{sample_item.id}",
            headers=headers,
        )
        assert res.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_update_content_item_detail_success(
    client: AsyncClient,
    entrepreneur_user: User,
    sample_business: Business,
    sample_item: ContentItem,
) -> None:
    """Test owner can update content item copy, visual prompts, and status."""
    mock_db = AsyncMock()

    async def mock_execute(statement: Any, *args: Any, **kwargs: Any) -> MagicMock:
        mock_result = MagicMock()
        stmt_str = str(statement)
        if "FROM businesses" in stmt_str:
            mock_result.scalar_one_or_none.return_value = sample_business
        elif "FROM content_items" in stmt_str:
            mock_result.scalar_one_or_none.return_value = sample_item
        return mock_result

    mock_db.execute = mock_execute

    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        headers = get_auth_headers(entrepreneur_user)
        update_payload = {
            "hook": "Updated Hook: Raw silk secrets revealed!",
            "caption": "New polished caption for Instagram reel.",
            "cta": "Link in bio to view full catalog",
            "hashtags": ["#silkdress", "#pakistanifashion", "#lahorecraft"],
            "best_time_hint": "8:30 PM PKT",
            "image_prompt": {"prompt": "New dramatic studio lighting"},
            "video_prompt": {"prompt": "Cinematic 4k slow motion dye pour"},
            "status": "approved",
        }

        res = await client.put(
            f"/api/v1/businesses/{sample_business.id}/content/items/{sample_item.id}",
            json=update_payload,
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == str(sample_item.id)
        assert data["hook"] == update_payload["hook"]
        assert data["caption"] == update_payload["caption"]
        assert data["cta"] == update_payload["cta"]
        assert data["hashtags"] == update_payload["hashtags"]
        assert data["status"] == "approved"
        assert data["image_prompt"]["prompt"] == "New dramatic studio lighting"
    finally:
        app.dependency_overrides.clear()
