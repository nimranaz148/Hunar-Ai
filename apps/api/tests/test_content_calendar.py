"""Acceptance tests for Task 28: Content Calendar Month View (F-011 / PRD §12.1, §12.3, §30.2, §36.16)."""

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
        email="sara.calendar@hunar.pk",
        name="Sara Pottery",
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
        email="other.calendar@hunar.pk",
        name="Other User",
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
        name="Sara Terracotta Studio",
        niche="ceramics",
        city="Multan",
        area="Cantt",
        budget_pkr=40000,
        hours_per_week=25,
        tone="friendly",
        languages=["roman_ur", "urdu"],
        platforms=["instagram", "facebook"],
        target_customer="Artisan lovers seeking handmade glazed mugs and planters",
    )


@pytest.fixture
def sample_calendar(sample_business: Business) -> ContentCalendar:
    """Mock content calendar record."""
    return ContentCalendar(
        id=uuid.uuid4(),
        business_id=sample_business.id,
        status="approved",
        pillars=[
            {
                "name": "behind_the_scenes",
                "description": "Clay molding & kiln firing",
                "target_percentage": 30,
            },
            {
                "name": "product_showcase",
                "description": "Glazed mugs & planters",
                "target_percentage": 40,
            },
            {
                "name": "education_tips",
                "description": "Ceramic care & food-safety",
                "target_percentage": 20,
            },
            {"name": "social_proof", "description": "Customer reviews", "target_percentage": 10},
        ],
        weekly_themes=[
            {"week": 1, "theme": "From Mud to Art", "objective": "Heritage storytelling"},
            {"week": 2, "theme": "The Kiln Firing Process", "objective": "Quality craftsmanship"},
            {
                "week": 3,
                "theme": "Styling Ceramic Planters",
                "objective": "Home decor inspiration",
            },
            {
                "week": 4,
                "theme": "Limited Handcrafted Batch Drop",
                "objective": "Drive WhatsApp sales orders",
            },
        ],
        format_distribution={"reels": 40, "carousels": 30, "stories": 20, "static": 10},
        day_briefs=[],
        revision_notes=None,
        approved_at=datetime.now(UTC),
        created_at=datetime.now(UTC),
    )


@pytest.fixture
def sample_items(sample_calendar: ContentCalendar) -> list[ContentItem]:
    """Mock 30 content items for the calendar."""
    base_date = date.today()
    items = []
    formats = ["reel", "carousel", "story", "static"]
    pillars = ["behind_the_scenes", "product_showcase", "education_tips", "social_proof"]

    for i in range(30):
        day = i + 1
        fmt = formats[i % len(formats)]
        pillar = pillars[i % len(pillars)]
        status_val = "posted" if day <= 3 else ("approved" if day <= 10 else "draft")

        items.append(
            ContentItem(
                id=uuid.uuid4(),
                calendar_id=sample_calendar.id,
                day=day,
                date=base_date + timedelta(days=i),
                platform=["instagram", "facebook"],
                format=fmt,
                pillar=pillar,
                goal="awareness" if fmt == "reel" else "sales",
                hook=f"Day {day} Hook: Secrets of Multani Blue Pottery glaze",
                caption=f"Day {day} Caption: Every cup is molded by hand with care in Multan.",
                cta="Comment 'CUP' to receive price list in your DMs!",
                hashtags=["#multanipottery", "#bluepotterypk", "#handmadeceramics"],
                best_time_hint="6:00 PM - 8:00 PM",
                image_prompt={
                    "subject": "blue glazed ceramic mug",
                    "style": "warm lifestyle photography",
                    "composition": "overhead flatlay on wooden table",
                },
                video_prompt={
                    "duration_sec": 15,
                    "aspect_ratio": "9:16",
                    "scenes": ["Clay shaping", "Blue glaze dipping", "Finished mug steam rising"],
                },
                alt_text="Handmade blue glazed pottery mug on wooden table",
                status=status_val,
                posted_at=datetime.now(UTC) if status_val == "posted" else None,
                post_url="https://instagram.com/p/test" if status_val == "posted" else None,
                created_at=datetime.now(UTC),
            )
        )
    return items


def get_auth_headers(user: User) -> dict[str, str]:
    token = create_access_token(user_id=user.id, role=user.role, email=user.email)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_get_content_calendar_success(
    client: AsyncClient,
    entrepreneur_user: User,
    sample_business: Business,
    sample_calendar: ContentCalendar,
    sample_items: list[ContentItem],
) -> None:
    """Test owner can fetch the 30-day content calendar items with progress stats."""
    mock_db = AsyncMock()

    async def mock_execute(statement: Any, *args: Any, **kwargs: Any) -> MagicMock:
        mock_result = MagicMock()
        stmt_str = str(statement)
        if "FROM businesses" in stmt_str:
            mock_result.scalar_one_or_none.return_value = sample_business
        elif "FROM content_calendars" in stmt_str:
            mock_result.scalar_one_or_none.return_value = sample_calendar
        elif "FROM content_items" in stmt_str:
            mock_result.scalars.return_value.all.return_value = sample_items
        else:
            mock_result.scalar_one_or_none.return_value = None
            mock_result.scalars.return_value.all.return_value = []
        return mock_result

    mock_db.execute = AsyncMock(side_effect=mock_execute)
    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = await client.get(
            f"/api/v1/businesses/{sample_business.id}/content/calendar",
            headers=get_auth_headers(entrepreneur_user),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["calendar_id"] == str(sample_calendar.id)
        assert len(data["items"]) == 30
        assert data["stats"]["total"] == 30
        assert data["stats"]["posted"] == 3
        assert data["stats"]["approved"] == 7
        assert data["stats"]["draft"] == 20
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_content_calendar_cross_tenant_forbidden(
    client: AsyncClient,
    other_entrepreneur: User,
    sample_business: Business,
) -> None:
    """Test cross-tenant access to another entrepreneur's calendar returns 403."""
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
            f"/api/v1/businesses/{sample_business.id}/content/calendar",
            headers=get_auth_headers(other_entrepreneur),
        )
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_update_content_item_status_success(
    client: AsyncClient,
    entrepreneur_user: User,
    sample_business: Business,
    sample_calendar: ContentCalendar,
    sample_items: list[ContentItem],
) -> None:
    """Test updating a content item status (e.g. to skipped or approved) with audit logging."""
    target_item = sample_items[5]
    mock_db = AsyncMock()

    async def mock_execute(statement: Any, *args: Any, **kwargs: Any) -> MagicMock:
        mock_result = MagicMock()
        stmt_str = str(statement)
        if "FROM businesses" in stmt_str:
            mock_result.scalar_one_or_none.return_value = sample_business
        elif "FROM content_calendars" in stmt_str:
            mock_result.scalar_one_or_none.return_value = sample_calendar
        elif "FROM content_items" in stmt_str:
            mock_result.scalar_one_or_none.return_value = target_item
        return mock_result

    mock_db.execute = AsyncMock(side_effect=mock_execute)
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()
    mock_db.add = MagicMock()

    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = await client.patch(
            f"/api/v1/businesses/{sample_business.id}/content/items/{target_item.id}/status",
            json={"status": "skipped"},
            headers=get_auth_headers(entrepreneur_user),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "skipped"
        assert target_item.status == "skipped"
        # Check audit log added
        assert mock_db.add.called
        added_objs = [call.args[0] for call in mock_db.add.call_args_list]
        audit_events = [obj.action for obj in added_objs if hasattr(obj, "action")]
        assert "content_item.status_changed" in audit_events
    finally:
        app.dependency_overrides.clear()
