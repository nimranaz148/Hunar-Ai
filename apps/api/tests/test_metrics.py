"""Acceptance tests for Metrics Entry Form and Snapshots (Task 48 / F-015 / PRD §5.2, §10 W-004, §12.3, §13.2)."""

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
from app.models.metrics import MetricsSnapshot
from app.models.user import User

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def entrepreneur_user() -> User:
    """Mock entrepreneur user."""
    return User(
        id=uuid.uuid4(),
        email="entrepreneur.fatima@hunar.pk",
        name="Fatima Ali",
        role="entrepreneur",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def other_entrepreneur_user() -> User:
    """Mock another entrepreneur user (not the business owner)."""
    return User(
        id=uuid.uuid4(),
        email="other.user@hunar.pk",
        name="Zainab Khan",
        role="entrepreneur",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def super_admin_user() -> User:
    """Mock super admin user."""
    return User(
        id=uuid.uuid4(),
        email="admin@hunar.pk",
        name="System Admin",
        role="super_admin",
        password_hash=hash_password("Password123!"),
        status="active",
        language="en",
        force_password_change=False,
    )


@pytest.fixture
def mentor_user() -> User:
    """Mock mentor user."""
    return User(
        id=uuid.uuid4(),
        email="mentor@hunar.pk",
        name="Tariq Mansoor",
        role="mentor",
        password_hash=hash_password("Password123!"),
        status="active",
        language="en",
        force_password_change=False,
    )


@pytest.fixture
def business(entrepreneur_user: User) -> Business:
    """Mock business owned by entrepreneur."""
    return Business(
        id=uuid.uuid4(),
        owner_id=entrepreneur_user.id,
        program_id=uuid.uuid4(),
        name="Fatima's Block Prints",
        niche="textiles",
        city="Lahore",
        area="Gulberg",
        budget_pkr=25000,
        hours_per_week=20,
        tone="warm",
        languages=["Urdu", "English"],
        platforms=["instagram", "facebook"],
        target_customer="Working women interested in artisanal kurtas",
    )


@pytest.fixture
def content_item(business: Business) -> ContentItem:
    """Mock content item for post linkage."""
    cal = ContentCalendar(
        id=uuid.uuid4(),
        business_id=business.id,
        month=10,
        year=2026,
    )
    item = ContentItem(
        id=uuid.uuid4(),
        calendar_id=cal.id,
        day=5,
        date=date(2026, 10, 5),
        platform=["instagram"],
        format="reel",
        pillar="product",
        goal="sales",
        hook="Yeh block print technique 100 saal purani hai!",
        caption="Crafted with pure indigo dye.",
        cta="DM for prices",
        hashtags=["#blockprint", "#handmade"],
        status="posted",
    )
    item.calendar = cal
    return item


@pytest.fixture
def entrepreneur_headers(entrepreneur_user: User) -> dict[str, str]:
    token = create_access_token(
        user_id=entrepreneur_user.id,
        role=entrepreneur_user.role,
        email=entrepreneur_user.email,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other_entrepreneur_headers(other_entrepreneur_user: User) -> dict[str, str]:
    token = create_access_token(
        user_id=other_entrepreneur_user.id,
        role=other_entrepreneur_user.role,
        email=other_entrepreneur_user.email,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(super_admin_user: User) -> dict[str, str]:
    token = create_access_token(
        user_id=super_admin_user.id,
        role=super_admin_user.role,
        email=super_admin_user.email,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def mentor_headers(mentor_user: User) -> dict[str, str]:
    token = create_access_token(
        user_id=mentor_user.id,
        role=mentor_user.role,
        email=mentor_user.email,
    )
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Acceptance Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_metrics_unauthenticated_returns_401(business: Business) -> None:
    """Anonymous request to log metrics returns 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            f"/api/v1/businesses/{business.id}/metrics",
            json={
                "platform": "instagram",
                "period_start": "2026-10-01",
                "period_end": "2026-10-03",
                "views": 1500,
            },
        )
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_metrics_mentor_forbidden(
    business: Business,
    mentor_user: User,
    mentor_headers: dict[str, str],
) -> None:
    """Mentor role cannot log metrics for a business (403 Forbidden)."""
    mock_db = AsyncMock()

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return mentor_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/businesses/{business.id}/metrics",
                headers=mentor_headers,
                json={
                    "platform": "instagram",
                    "period_start": "2026-10-01",
                    "period_end": "2026-10-03",
                },
            )
            assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_metrics_non_owner_entrepreneur_forbidden(
    business: Business,
    other_entrepreneur_user: User,
    other_entrepreneur_headers: dict[str, str],
) -> None:
    """Another entrepreneur who does not own the business receives 403 Forbidden."""
    mock_db = AsyncMock()
    mock_db.get.return_value = business

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return other_entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/businesses/{business.id}/metrics",
                headers=other_entrepreneur_headers,
                json={
                    "platform": "instagram",
                    "period_start": "2026-10-01",
                    "period_end": "2026-10-03",
                },
            )
            assert response.status_code == 403
            assert "not authorized" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_metrics_date_validation_failure(
    business: Business,
    entrepreneur_user: User,
    entrepreneur_headers: dict[str, str],
) -> None:
    """period_end < period_start triggers 422 validation failure."""
    mock_db = AsyncMock()
    mock_db.get.return_value = business

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/businesses/{business.id}/metrics",
                headers=entrepreneur_headers,
                json={
                    "platform": "instagram",
                    "period_start": "2026-10-05",
                    "period_end": "2026-10-01",  # Invalid: end < start
                    "views": 500,
                },
            )
            assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_metrics_negative_number_validation_failure(
    business: Business,
    entrepreneur_user: User,
    entrepreneur_headers: dict[str, str],
) -> None:
    """Negative values on views or revenue trigger 422 validation failure."""
    mock_db = AsyncMock()
    mock_db.get.return_value = business

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/businesses/{business.id}/metrics",
                headers=entrepreneur_headers,
                json={
                    "platform": "instagram",
                    "period_start": "2026-10-01",
                    "period_end": "2026-10-03",
                    "views": -10,  # Invalid: < 0
                },
            )
            assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_log_metrics_snapshot_success(
    business: Business,
    entrepreneur_user: User,
    entrepreneur_headers: dict[str, str],
) -> None:
    """Entrepreneur logs metrics snapshot successfully (201 Created) and audit row is recorded."""
    mock_db = AsyncMock()
    mock_db.get.return_value = business

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/businesses/{business.id}/metrics",
                headers=entrepreneur_headers,
                json={
                    "platform": "instagram",
                    "period_start": "2026-10-01",
                    "period_end": "2026-10-03",
                    "views": 4500,
                    "reach": 3800,
                    "likes": 210,
                    "comments": 35,
                    "shares": 18,
                    "saves": 45,
                    "follower_delta": 24,
                    "inquiries": 9,
                    "orders": 3,
                    "revenue_pkr": 12500,
                },
            )
            assert response.status_code == 201
            data = response.json()
            assert data["platform"] == "instagram"
            assert data["period_start"] == "2026-10-01"
            assert data["period_end"] == "2026-10-03"
            assert data["views"] == 4500
            assert data["reach"] == 3800
            assert data["likes"] == 210
            assert data["follower_delta"] == 24
            assert data["inquiries"] == 9
            assert data["orders"] == 3
            assert data["revenue_pkr"] == 12500
            assert mock_db.commit.called
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_log_metrics_snapshot_super_admin_allowed(
    business: Business,
    super_admin_user: User,
    admin_headers: dict[str, str],
) -> None:
    """Super Admin can log metrics on behalf of any business."""
    mock_db = AsyncMock()
    mock_db.get.return_value = business

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return super_admin_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/businesses/{business.id}/metrics",
                headers=admin_headers,
                json={
                    "platform": "facebook",
                    "period_start": "2026-10-04",
                    "period_end": "2026-10-04",
                    "views": 800,
                    "revenue_pkr": 4000,
                },
            )
            assert response.status_code == 201
            assert response.json()["platform"] == "facebook"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_list_metrics_snapshots(
    business: Business,
    entrepreneur_user: User,
    entrepreneur_headers: dict[str, str],
) -> None:
    """List business metrics snapshots returns paginated envelope."""
    mock_db = AsyncMock()
    mock_db.get.return_value = business

    s1 = MetricsSnapshot(
        id=uuid.uuid4(),
        business_id=business.id,
        content_item_id=None,
        platform="instagram",
        period_start=date(2026, 10, 1),
        period_end=date(2026, 10, 2),
        views=1200,
        reach=1000,
        likes=50,
        comments=10,
        shares=5,
        saves=12,
        follower_delta=5,
        inquiries=2,
        orders=1,
        revenue_pkr=3500,
        created_at=datetime(2026, 10, 2, 12, 0, tzinfo=UTC),
        updated_at=None,
    )
    s1.content_item = None

    # Mock count query
    mock_count_res = MagicMock()
    mock_count_res.scalar.return_value = 1

    # Mock items query
    mock_items_res = MagicMock()
    mock_items_res.scalars.return_value.all.return_value = [s1]

    mock_db.execute.side_effect = [mock_count_res, mock_items_res]

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
                f"/api/v1/businesses/{business.id}/metrics?page=1&page_size=20",
                headers=entrepreneur_headers,
            )
            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 1
            assert len(data["items"]) == 1
            assert data["items"][0]["platform"] == "instagram"
            assert data["items"][0]["revenue_pkr"] == 3500
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_metrics_coaching_progress(
    business: Business,
    entrepreneur_user: User,
    entrepreneur_headers: dict[str, str],
) -> None:
    """Calculates distinct days and verifies 3-day coaching threshold."""
    mock_db = AsyncMock()
    mock_db.get.return_value = business

    # Mock 3 days covered: 2026-10-01 to 2026-10-03
    mock_ranges = [(date(2026, 10, 1), date(2026, 10, 3))]
    mock_exec_res = MagicMock()
    mock_exec_res.all.return_value = mock_ranges
    mock_db.execute.return_value = mock_exec_res

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
                f"/api/v1/businesses/{business.id}/metrics/progress",
                headers=entrepreneur_headers,
            )
            assert response.status_code == 200
            data = response.json()
            assert data["total_days_logged"] == 3
            assert data["target_days"] == 3
            assert data["threshold_met"] is True
            assert data["latest_snapshot_date"] == "2026-10-03"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_single_metric_snapshot_not_found(
    business: Business,
    entrepreneur_user: User,
    entrepreneur_headers: dict[str, str],
) -> None:
    """Returns 404 when metric snapshot ID does not exist."""
    mock_db = AsyncMock()
    mock_db.get.return_value = business

    mock_exec_res = MagicMock()
    mock_exec_res.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_exec_res

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
            response = await client.get(
                f"/api/v1/businesses/{business.id}/metrics/{random_id}",
                headers=entrepreneur_headers,
            )
            assert response.status_code == 404
            assert "not found" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_metrics_charts_success(
    business: Business,
    entrepreneur_user: User,
    entrepreneur_headers: dict[str, str],
) -> None:
    """Returns aggregated timeseries, channel comparison, and summary totals (Task 49 / F-016)."""
    mock_db = AsyncMock()
    mock_db.get.return_value = business

    snapshot_insta = MetricsSnapshot(
        id=uuid.uuid4(),
        business_id=business.id,
        content_item_id=None,
        platform="instagram",
        period_start=date(2026, 10, 1),
        period_end=date(2026, 10, 2),
        views=3000,
        reach=2500,
        likes=150,
        comments=20,
        shares=10,
        saves=25,
        follower_delta=12,
        inquiries=10,
        orders=2,
        revenue_pkr=5000,
        created_at=datetime(2026, 10, 2, 12, 0, 0, tzinfo=UTC),
    )
    snapshot_fb = MetricsSnapshot(
        id=uuid.uuid4(),
        business_id=business.id,
        content_item_id=None,
        platform="facebook",
        period_start=date(2026, 10, 3),
        period_end=date(2026, 10, 3),
        views=1500,
        reach=1200,
        likes=80,
        comments=10,
        shares=5,
        saves=15,
        follower_delta=6,
        inquiries=5,
        orders=1,
        revenue_pkr=3000,
        created_at=datetime(2026, 10, 3, 18, 0, 0, tzinfo=UTC),
    )

    mock_exec_res = MagicMock()
    mock_exec_res.scalars.return_value.all.return_value = [snapshot_insta, snapshot_fb]
    mock_db.execute.return_value = mock_exec_res

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
                f"/api/v1/businesses/{business.id}/metrics/charts",
                headers=entrepreneur_headers,
            )
            assert response.status_code == 200
            data = response.json()
            assert data["business_id"] == str(business.id)
            # Check summary totals
            summary = data["summary"]
            assert summary["total_views"] == 4500
            assert summary["total_reach"] == 3700
            assert summary["total_revenue_pkr"] == 8000
            assert summary["total_inquiries"] == 15
            assert summary["total_orders"] == 3
            assert summary["inquiry_to_order_rate_pct"] == 20.0
            assert summary["total_snapshots"] == 2

            # Check timeline points
            timeline = data["timeline"]
            assert len(timeline) == 2
            assert timeline[0]["date"] == "2026-10-02"
            assert timeline[0]["views"] == 3000
            assert timeline[0]["revenue_pkr"] == 5000
            assert timeline[1]["date"] == "2026-10-03"
            assert timeline[1]["views"] == 1500
            assert timeline[1]["revenue_pkr"] == 3000

            # Check channels comparison
            channels = data["channels"]
            insta_channel = next(c for c in channels if c["platform"] == "instagram")
            fb_channel = next(c for c in channels if c["platform"] == "facebook")
            assert insta_channel["views"] == 3000
            assert insta_channel["revenue_pkr"] == 5000
            assert insta_channel["views_share_pct"] == round(3000 / 4500 * 100, 1)
            assert fb_channel["views"] == 1500
            assert fb_channel["revenue_pkr"] == 3000
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_metrics_charts_with_filters(
    business: Business,
    entrepreneur_user: User,
    entrepreneur_headers: dict[str, str],
) -> None:
    """Accepts days and platform query parameters (Task 49 / F-016)."""
    mock_db = AsyncMock()
    mock_db.get.return_value = business

    mock_exec_res = MagicMock()
    mock_exec_res.scalars.return_value.all.return_value = []
    mock_db.execute.return_value = mock_exec_res

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
                f"/api/v1/businesses/{business.id}/metrics/charts?days=7&platform=instagram",
                headers=entrepreneur_headers,
            )
            assert response.status_code == 200
            data = response.json()
            assert data["timeframe_days"] == 7
            assert data["summary"]["total_views"] == 0
            assert len(data["timeline"]) == 0
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_metrics_charts_unauthorized_user(
    business: Business,
    other_entrepreneur_user: User,
    other_entrepreneur_headers: dict[str, str],
) -> None:
    """Non-owner entrepreneurs receive 403 Forbidden for charts (PRD §3.5)."""
    mock_db = AsyncMock()
    mock_db.get.return_value = business

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return other_entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                f"/api/v1/businesses/{business.id}/metrics/charts",
                headers=other_entrepreneur_headers,
            )
            assert response.status_code == 403
            assert "not authorized" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_metrics_charts_super_admin_allowed(
    business: Business,
    super_admin_user: User,
    admin_headers: dict[str, str],
) -> None:
    """Super Admin can view performance charts for any business (PRD §3.5)."""
    mock_db = AsyncMock()
    mock_db.get.return_value = business

    mock_exec_res = MagicMock()
    mock_exec_res.scalars.return_value.all.return_value = []
    mock_db.execute.return_value = mock_exec_res

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return super_admin_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                f"/api/v1/businesses/{business.id}/metrics/charts",
                headers=admin_headers,
            )
            assert response.status_code == 200
    finally:
        app.dependency_overrides.clear()

