"""Acceptance tests for Weekly Review Approval & Human Gate 3 (Task 50 / F-017 / PRD §5.2, §10 W-004, §13.2, §36.7)."""

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
from app.models.plan import Proposal
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
def calendar_and_items(business: Business) -> tuple[ContentCalendar, list[ContentItem]]:
    """Mock content calendar with draft items for upcoming days."""
    cal = ContentCalendar(
        id=uuid.uuid4(),
        business_id=business.id,
        status="approved",
    )
    items = [
        ContentItem(
            id=uuid.uuid4(),
            calendar_id=cal.id,
            day=10,
            date=date(2026, 10, 10),
            platform=["instagram"],
            format="static",
            pillar="product",
            goal="sales",
            hook="Purani block printing tradition",
            caption="Check out our new kurtas",
            cta="DM to order",
            hashtags=["#blockprint"],
            status="draft",
        ),
        ContentItem(
            id=uuid.uuid4(),
            calendar_id=cal.id,
            day=11,
            date=date(2026, 10, 11),
            platform=["instagram"],
            format="static",
            pillar="educational",
            goal="engagement",
            hook="Hand printing vs screen printing",
            caption="Learn about natural dyes",
            cta="Drop a comment",
            hashtags=["#naturaldyes"],
            status="draft",
        ),
    ]
    return cal, items


@pytest.fixture
def three_days_snapshots(business: Business) -> list[MetricsSnapshot]:
    """Mock 3 distinct days of metrics snapshots."""
    return [
        MetricsSnapshot(
            id=uuid.uuid4(),
            business_id=business.id,
            platform="instagram",
            period_start=date(2026, 10, 1),
            period_end=date(2026, 10, 1),
            views=1200,
            reach=900,
            likes=140,
            comments=25,
            shares=10,
            saves=30,
            inquiries=8,
            orders=2,
            revenue_pkr=4500,
            created_at=datetime(2026, 10, 1, 20, 0, tzinfo=UTC),
        ),
        MetricsSnapshot(
            id=uuid.uuid4(),
            business_id=business.id,
            platform="instagram",
            period_start=date(2026, 10, 2),
            period_end=date(2026, 10, 2),
            views=2100,
            reach=1600,
            likes=280,
            comments=45,
            shares=20,
            saves=55,
            inquiries=15,
            orders=4,
            revenue_pkr=9000,
            created_at=datetime(2026, 10, 2, 20, 0, tzinfo=UTC),
        ),
        MetricsSnapshot(
            id=uuid.uuid4(),
            business_id=business.id,
            platform="facebook",
            period_start=date(2026, 10, 3),
            period_end=date(2026, 10, 3),
            views=1800,
            reach=1300,
            likes=190,
            comments=30,
            shares=15,
            saves=40,
            inquiries=12,
            orders=3,
            revenue_pkr=6000,
            created_at=datetime(2026, 10, 3, 20, 0, tzinfo=UTC),
        ),
    ]


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


# ---------------------------------------------------------------------------
# Acceptance Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_trigger_weekly_review_unauthenticated_returns_401(business: Business) -> None:
    """Anonymous request to trigger weekly review returns 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            f"/api/v1/businesses/{business.id}/weekly-review/trigger",
        )
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_trigger_weekly_review_cross_tenant_forbidden_returns_403(
    business: Business,
    other_entrepreneur_user: User,
    other_entrepreneur_headers: dict[str, str],
) -> None:
    """Entrepreneur cannot trigger weekly review for another business (403 Forbidden)."""
    mock_db = AsyncMock()

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return other_entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        # Mock finding business owned by different user
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = business
        mock_db.execute.return_value = mock_result

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/businesses/{business.id}/weekly-review/trigger",
                headers=other_entrepreneur_headers,
            )
            assert response.status_code == 403
            data = response.json()
            assert "permission" in data["detail"].lower() or "access" in data["detail"].lower()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_trigger_weekly_review_insufficient_data_returns_400(
    business: Business,
    entrepreneur_user: User,
    entrepreneur_headers: dict[str, str],
) -> None:
    """Weekly review requires at least 3 days of metrics snapshots (PRD §10 W-004 failure path)."""
    mock_db = AsyncMock()

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        # Query 1: Business lookup -> business
        # Query 2: Metrics snapshot count / distinct days -> 1 day only
        mock_biz_result = MagicMock()
        mock_biz_result.scalar_one_or_none.return_value = business

        mock_count_result = MagicMock()
        mock_count_result.scalar.return_value = 1  # Only 1 day logged

        mock_snapshots_result = MagicMock()
        mock_snapshots_result.scalars.return_value.all.return_value = [
            MetricsSnapshot(
                id=uuid.uuid4(),
                business_id=business.id,
                period_start=date(2026, 10, 1),
                period_end=date(2026, 10, 1),
                views=100,
            )
        ]

        def execute_side_effect(stmt: Any, *args: Any, **kwargs: Any) -> Any:
            stmt_str = str(stmt).lower()
            if "from businesses" in stmt_str:
                return mock_biz_result
            if "count" in stmt_str:
                return mock_count_result
            return mock_snapshots_result

        mock_db.execute.side_effect = execute_side_effect

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/businesses/{business.id}/weekly-review/trigger",
                headers=entrepreneur_headers,
            )
            assert response.status_code == 400
            data = response.json()
            assert "at least 3 days" in data["detail"].lower()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_trigger_weekly_review_success_creates_proposal(
    business: Business,
    entrepreneur_user: User,
    entrepreneur_headers: dict[str, str],
    three_days_snapshots: list[MetricsSnapshot],
    calendar_and_items: tuple[ContentCalendar, list[ContentItem]],
) -> None:
    """When >= 3 days of metrics exist, Weekly Coach triggers and creates a pending proposal."""
    mock_db = AsyncMock()

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    cal, items = calendar_and_items

    try:
        mock_biz_result = MagicMock()
        mock_biz_result.scalar_one_or_none.return_value = business

        mock_count_result = MagicMock()
        mock_count_result.scalar.return_value = 3

        mock_snapshots_result = MagicMock()
        mock_snapshots_result.scalars.return_value.all.return_value = three_days_snapshots

        mock_cal_result = MagicMock()
        mock_cal_result.scalar_one_or_none.return_value = cal

        mock_items_result = MagicMock()
        mock_items_result.scalars.return_value.all.return_value = items

        mock_existing_prop_result = MagicMock()
        mock_existing_prop_result.scalar_one_or_none.return_value = None

        def execute_side_effect(stmt: Any, *args: Any, **kwargs: Any) -> Any:
            stmt_str = str(stmt).lower()
            if "from businesses" in stmt_str:
                return mock_biz_result
            if "count" in stmt_str:
                return mock_count_result
            if "from metrics_snapshots" in stmt_str:
                return mock_snapshots_result
            if "from content_calendars" in stmt_str:
                return mock_cal_result
            if "from content_items" in stmt_str:
                return mock_items_result
            if "from proposals" in stmt_str:
                return mock_existing_prop_result
            mock_default = MagicMock()
            mock_default.scalar_one_or_none.return_value = None
            mock_default.scalars.return_value.all.return_value = []
            return mock_default

        mock_db.execute.side_effect = execute_side_effect

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/businesses/{business.id}/weekly-review/trigger",
                headers=entrepreneur_headers,
            )
            assert response.status_code == 200
            data = response.json()
            assert data["gate_type"] == "weekly_review"
            assert data["status"] == "pending"
            assert "diagnosis" in data["payload"]
            assert data["payload"]["diagnosis"]["total_views"] == 5100
            assert data["payload"]["diagnosis"]["total_revenue_pkr"] == 19500
            assert len(data["payload"]["proposed_adjustments"]) > 0
            # DB add called for new Proposal
            assert mock_db.add.called
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_list_proposals_owner_scoping(
    business: Business,
    entrepreneur_user: User,
    entrepreneur_headers: dict[str, str],
) -> None:
    """GET /api/v1/proposals returns pending proposals for caller's businesses."""
    mock_db = AsyncMock()

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    mock_proposal = Proposal(
        id=uuid.uuid4(),
        business_id=business.id,
        gate_type="weekly_review",
        status="pending",
        payload={
            "diagnosis": {"best_format": "reel", "total_views": 5100},
            "coach_rationale": "Reels are outperforming static posts by 2.4x.",
            "proposed_adjustments": [],
        },
        created_at=datetime.now(UTC),
    )

    try:
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [mock_proposal]
        mock_db.execute.return_value = mock_result

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                f"/api/v1/proposals?business_id={business.id}&gate_type=weekly_review",
                headers=entrepreneur_headers,
            )
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["gate_type"] == "weekly_review"
            assert data[0]["status"] == "pending"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_approve_proposal_updates_content_items_and_audit(
    business: Business,
    entrepreneur_user: User,
    entrepreneur_headers: dict[str, str],
    calendar_and_items: tuple[ContentCalendar, list[ContentItem]],
) -> None:
    """POST /api/v1/proposals/{id}/approve approves proposal, updates upcoming draft items, writes audit."""
    mock_db = AsyncMock()

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    _cal, items = calendar_and_items
    item_to_update = items[0]

    mock_proposal = Proposal(
        id=uuid.uuid4(),
        business_id=business.id,
        gate_type="weekly_review",
        status="pending",
        payload={
            "diagnosis": {"best_format": "reel"},
            "coach_rationale": "Shift static posts to reels to boost inquiries.",
            "proposed_adjustments": [
                {
                    "item_id": str(item_to_update.id),
                    "day": item_to_update.day,
                    "current_format": "static",
                    "proposed_format": "reel",
                    "proposed_hook": "Watch this 100-year-old block printing technique in action!",
                    "recommended_hashtags": ["#artisanreel", "#pakistanicrafts"],
                    "rationale": "High video engagement",
                }
            ],
        },
        created_at=datetime.now(UTC),
    )
    mock_proposal.business = business

    try:
        mock_prop_result = MagicMock()
        mock_prop_result.scalar_one_or_none.return_value = mock_proposal

        mock_item_result = MagicMock()
        mock_item_result.scalar_one_or_none.return_value = item_to_update

        def execute_side_effect(stmt: Any, *args: Any, **kwargs: Any) -> Any:
            stmt_str = str(stmt).lower()
            if "from proposals" in stmt_str:
                return mock_prop_result
            if "from content_items" in stmt_str:
                return mock_item_result
            mock_default = MagicMock()
            mock_default.scalar_one_or_none.return_value = None
            return mock_default

        mock_db.execute.side_effect = execute_side_effect

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/proposals/{mock_proposal.id}/approve",
                headers=entrepreneur_headers,
                json={"comments": "Looks great, let's roll out the reels!"},
            )
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "approved"
            assert data["decided_at"] is not None

            # Verify content item was updated per proposed adjustment
            assert item_to_update.format == "reel"
            assert "100-year-old" in item_to_update.hook
            assert "#artisanreel" in item_to_update.hashtags
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_reject_proposal_saves_reason_and_audit(
    business: Business,
    entrepreneur_user: User,
    entrepreneur_headers: dict[str, str],
) -> None:
    """POST /api/v1/proposals/{id}/reject rejects proposal with reason note and audit."""
    mock_db = AsyncMock()

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    mock_proposal = Proposal(
        id=uuid.uuid4(),
        business_id=business.id,
        gate_type="weekly_review",
        status="pending",
        payload={"coach_rationale": "Shift static posts to reels."},
        created_at=datetime.now(UTC),
    )
    mock_proposal.business = business

    try:
        mock_prop_result = MagicMock()
        mock_prop_result.scalar_one_or_none.return_value = mock_proposal
        mock_db.execute.return_value = mock_prop_result

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/proposals/{mock_proposal.id}/reject",
                headers=entrepreneur_headers,
                json={"reason": "I do not have time to shoot video reels this week."},
            )
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "rejected"
            assert "shoot video reels" in data["rejection_reason"]
            assert data["decided_at"] is not None
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_approve_already_decided_proposal_returns_400(
    business: Business,
    entrepreneur_user: User,
    entrepreneur_headers: dict[str, str],
) -> None:
    """Attempting to approve or reject an already decided proposal returns 400 Bad Request."""
    mock_db = AsyncMock()

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    mock_proposal = Proposal(
        id=uuid.uuid4(),
        business_id=business.id,
        gate_type="weekly_review",
        status="approved",
        decided_at=datetime.now(UTC),
        payload={},
        created_at=datetime.now(UTC),
    )
    mock_proposal.business = business

    try:
        mock_prop_result = MagicMock()
        mock_prop_result.scalar_one_or_none.return_value = mock_proposal
        mock_db.execute.return_value = mock_prop_result

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/proposals/{mock_proposal.id}/approve",
                headers=entrepreneur_headers,
                json={},
            )
            assert response.status_code == 400
            data = response.json()
            assert "already approved" in data["detail"].lower()
    finally:
        app.dependency_overrides.clear()
