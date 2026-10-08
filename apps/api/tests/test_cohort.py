"""Acceptance tests for Super Admin Cohort Dashboard & Stalled Monitoring (Task 51 / F-028 / D-003 / PRD §11.1, §13.2, §29.3)."""

import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token
from app.auth.password import hash_password
from app.core.database import get_db
from app.main import app
from app.models.business import Business
from app.models.plan import LaunchPlan
from app.models.program import Program
from app.models.user import User
from app.schemas.cohort import (
    CohortDashboardResponse,
    CohortFunnelData,
    CohortFunnelStage,
    CohortKPIs,
    CohortProgramSummary,
    StalledBusinessItem,
)
from app.services.cohort import get_cohort_dashboard


@pytest.fixture
def super_admin_user() -> User:
    """Mock super admin user."""
    return User(
        id=uuid.uuid4(),
        email="admin@hunar.pk",
        name="Super Admin",
        role="super_admin",
        password_hash=hash_password("AdminPass123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def entrepreneur_user() -> User:
    """Mock entrepreneur user."""
    return User(
        id=uuid.uuid4(),
        email="entrepreneur@hunar.pk",
        name="Fatima Entrepreneur",
        role="entrepreneur",
        password_hash=hash_password("EntPass123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


def get_auth_headers(user: User) -> dict[str, str]:
    """Generate bearer token header."""
    token = create_access_token(user_id=user.id, role=user.role, email=user.email)
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_cohort_dashboard_unauthenticated() -> None:
    """GET /api/v1/admin/cohort/dashboard returns 401 when no auth header provided."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/admin/cohort/dashboard")
        assert resp.status_code == 401


@pytest.mark.asyncio
async def test_cohort_dashboard_forbidden_for_entrepreneur(entrepreneur_user: User) -> None:
    """GET /api/v1/admin/cohort/dashboard returns 403 when called by non-admin role."""
    mock_db = AsyncMock()

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user

    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(
                "/api/v1/admin/cohort/dashboard",
                headers=get_auth_headers(entrepreneur_user),
            )
            assert resp.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_cohort_dashboard_success_for_super_admin(super_admin_user: User) -> None:
    """GET /api/v1/admin/cohort/dashboard returns 200 with funnel stages, KPIs, and stalled preview."""
    mock_db = AsyncMock()

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: super_admin_user

    mock_response = CohortDashboardResponse(
        program_id=None,
        program_name="All Cohorts",
        funnel=CohortFunnelData(
            signed_up=28,
            plan_approved=22,
            first_post=15,
            first_order=8,
            stages=[
                CohortFunnelStage(
                    stage="signed_up",
                    label="Signed Up",
                    count=28,
                    percentage=100.0,
                    step_conversion_rate=100.0,
                ),
                CohortFunnelStage(
                    stage="plan_approved",
                    label="Plan Approved",
                    count=22,
                    percentage=78.6,
                    step_conversion_rate=78.6,
                ),
                CohortFunnelStage(
                    stage="first_post",
                    label="First Post",
                    count=15,
                    percentage=53.6,
                    step_conversion_rate=68.2,
                ),
                CohortFunnelStage(
                    stage="first_order",
                    label="First Order",
                    count=8,
                    percentage=28.6,
                    step_conversion_rate=53.3,
                ),
            ],
        ),
        kpis=CohortKPIs(
            total_entrepreneurs=28,
            plan_approved_count=22,
            stalled_count=5,
            active_mentors=6,
            bookings_this_week=12,
        ),
        stalled_preview=[
            StalledBusinessItem(
                business_id=uuid.uuid4(),
                business_name="Zari Threads",
                owner_id=uuid.uuid4(),
                owner_name="Fatima Ali",
                owner_email="fatima@example.com",
                reason="No post in 7 days",
                days_since_last_post=7,
                days_since_last_metric=4,
                overdue_task_count=0,
            )
        ],
        programs=[
            CohortProgramSummary(
                id=uuid.uuid4(),
                name="Lahore Batch 1",
                invite_code="LHR-01",
                entrepreneur_count=28,
            )
        ],
    )

    transport = ASGITransport(app=app)
    try:
        with patch("app.routes.admin.get_cohort_dashboard", return_value=mock_response):
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                resp = await client.get(
                    "/api/v1/admin/cohort/dashboard",
                    headers=get_auth_headers(super_admin_user),
                )
                assert resp.status_code == 200
                data = resp.json()
                assert data["program_name"] == "All Cohorts"
                assert data["funnel"]["signed_up"] == 28
                assert data["funnel"]["plan_approved"] == 22
                assert data["funnel"]["first_post"] == 15
                assert data["funnel"]["first_order"] == 8
                assert len(data["funnel"]["stages"]) == 4
                assert data["kpis"]["stalled_count"] == 5
                assert data["kpis"]["active_mentors"] == 6
                assert data["kpis"]["bookings_this_week"] == 12
                assert len(data["stalled_preview"]) == 1
                assert data["stalled_preview"][0]["business_name"] == "Zari Threads"
                assert len(data["programs"]) == 1
                assert data["programs"][0]["name"] == "Lahore Batch 1"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_cohort_dashboard_with_program_id(super_admin_user: User) -> None:
    """GET /api/v1/admin/cohort/dashboard?program_id=... propagates filter correctly."""
    mock_db = AsyncMock()

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: super_admin_user

    prog_id = uuid.uuid4()
    mock_response = CohortDashboardResponse(
        program_id=prog_id,
        program_name="Karachi Batch 2",
        funnel=CohortFunnelData(
            signed_up=14,
            plan_approved=10,
            first_post=6,
            first_order=3,
            stages=[],
        ),
        kpis=CohortKPIs(
            total_entrepreneurs=14,
            plan_approved_count=10,
            stalled_count=2,
            active_mentors=6,
            bookings_this_week=4,
        ),
        stalled_preview=[],
        programs=[],
    )

    transport = ASGITransport(app=app)
    try:
        with patch(
            "app.routes.admin.get_cohort_dashboard", return_value=mock_response
        ) as mock_service:
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                resp = await client.get(
                    f"/api/v1/admin/cohort/dashboard?program_id={prog_id}",
                    headers=get_auth_headers(super_admin_user),
                )
                assert resp.status_code == 200
                data = resp.json()
                assert data["program_id"] == str(prog_id)
                assert data["program_name"] == "Karachi Batch 2"
                mock_service.assert_called_once_with(mock_db, program_id=prog_id)
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_cohort_dashboard_service_calculation_logic() -> None:
    """Direct service unit test verifying funnel calculations and stalled diagnosis."""
    mock_db = AsyncMock()

    prog_id = uuid.uuid4()
    mock_program = Program(id=prog_id, name="Lahore Batch 1", invite_code="LHR-01")

    user1_id = uuid.uuid4()
    user2_id = uuid.uuid4()
    user1 = User(
        id=user1_id,
        email="fatima@test.pk",
        name="Fatima",
        role="entrepreneur",
        password_hash="...",
        program_id=prog_id,
        created_at=datetime.now(UTC),
    )
    user2 = User(
        id=user2_id,
        email="amina@test.pk",
        name="Amina",
        role="entrepreneur",
        password_hash="...",
        program_id=prog_id,
        created_at=datetime.now(UTC),
    )

    biz1 = Business(
        id=uuid.uuid4(),
        owner_id=user1_id,
        program_id=prog_id,
        name="Fatima Crafts",
        niche="apparel",
        city="Lahore",
        budget_pkr=10000,
        hours_per_week=10,
        languages=["ur"],
        platforms=["instagram"],
        created_at=datetime.now(UTC),
    )
    biz1.owner = user1
    biz1.program = mock_program

    biz2 = Business(
        id=uuid.uuid4(),
        owner_id=user2_id,
        program_id=prog_id,
        name="Amina Spices",
        niche="food",
        city="Lahore",
        budget_pkr=15000,
        hours_per_week=12,
        languages=["ur"],
        platforms=["facebook"],
        created_at=datetime.now(UTC),
    )
    biz2.owner = user2
    biz2.program = mock_program

    plan1 = LaunchPlan(
        id=uuid.uuid4(),
        business_id=biz1.id,
        status="approved",
        approved_at=datetime.now(UTC) - timedelta(days=8),
        created_at=datetime.now(UTC) - timedelta(days=10),
    )
    plan2 = LaunchPlan(
        id=uuid.uuid4(),
        business_id=biz2.id,
        status="awaiting_approval",
        created_at=datetime.now(UTC) - timedelta(days=2),
    )

    # Mock execute results sequentially:
    # 1: programs list
    # 2: program user counts
    # 3: total entrepreneurs count (2)
    # 4: businesses list ([biz1, biz2])
    # 5: plans list ([plan1, plan2])
    # 6: first post count (1)
    # 7: first order count (1)
    # 8: latest posts per business (biz1 last post 8 days ago)
    # 9: latest metrics per business (biz1 last metric 9 days ago)
    # 10: overdue tasks (biz1 has 2 overdue tasks)
    # 11: active mentors count (4)
    # 12: bookings this week count (3)

    m1 = MagicMock()
    m1.scalars.return_value.all.return_value = [mock_program]

    m2 = MagicMock()
    m2.all.return_value = [(prog_id, 2)]

    m3 = MagicMock()
    m3.scalar_one.return_value = 2

    m4 = MagicMock()
    m4.scalars.return_value.all.return_value = [biz1, biz2]

    m5 = MagicMock()
    m5.scalars.return_value.all.return_value = [plan1, plan2]

    # 6: latest posts per business (biz1 last post 8 days ago)
    eight_days_ago = datetime.now(UTC) - timedelta(days=8)
    m6 = MagicMock()
    m6.all.return_value = [(biz1.id, eight_days_ago, None)]

    # 7: latest metrics per business (biz1 last metric 9 days ago)
    nine_days_ago = (datetime.now(UTC) - timedelta(days=9)).date()
    m7 = MagicMock()
    m7.all.return_value = [(biz1.id, nine_days_ago)]

    # 8: overdue tasks (biz1 has 2 overdue tasks)
    m8 = MagicMock()
    m8.all.return_value = [(plan1.id, 2)]

    # 9: first post count (1)
    m9 = MagicMock()
    m9.scalar_one.return_value = 1

    # 10: first order count (1)
    m10 = MagicMock()
    m10.scalar_one.return_value = 1

    # 11: active mentors count (4)
    m11 = MagicMock()
    m11.scalar_one.return_value = 4

    # 12: bookings this week count (3)
    m12 = MagicMock()
    m12.scalar_one.return_value = 3

    mock_db.execute.side_effect = [m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12]

    result = await get_cohort_dashboard(mock_db, program_id=prog_id)

    assert result.program_id == prog_id
    assert result.program_name == "Lahore Batch 1"
    assert result.funnel.signed_up == 2
    assert result.funnel.plan_approved == 1
    assert result.funnel.first_post == 1
    assert result.funnel.first_order == 1
    assert result.kpis.total_entrepreneurs == 2
    assert result.kpis.active_mentors == 4
    assert result.kpis.bookings_this_week == 3

    # Stalled detection: biz1 has approved plan, last post > 5d, last metric > 7d, 2 overdue tasks
    assert result.kpis.stalled_count == 1
    assert len(result.stalled_preview) == 1
    stalled = result.stalled_preview[0]
    assert stalled.business_name == "Fatima Crafts"
    assert "No post in 8 days" in stalled.reason
    assert "No metrics in 9 days" in stalled.reason
    assert "2 tasks overdue" in stalled.reason
    assert stalled.overdue_task_count == 2


@pytest.mark.asyncio
async def test_stalled_list_unauthenticated() -> None:
    """GET /api/v1/admin/cohort/stalled returns 401 when unauthenticated."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/admin/cohort/stalled")
        assert resp.status_code == 401


@pytest.mark.asyncio
async def test_stalled_list_forbidden(entrepreneur_user: User) -> None:
    """GET /api/v1/admin/cohort/stalled returns 403 for non-admin."""
    mock_db = AsyncMock()

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user

    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(
                "/api/v1/admin/cohort/stalled",
                headers=get_auth_headers(entrepreneur_user),
            )
            assert resp.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_stalled_list_success(super_admin_user: User) -> None:
    """GET /api/v1/admin/cohort/stalled returns 200 with summary and items."""
    mock_db = AsyncMock()

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: super_admin_user

    from app.schemas.cohort import StalledListResponse, StalledSummaryCounts

    mock_response = StalledListResponse(
        items=[
            StalledBusinessItem(
                business_id=uuid.uuid4(),
                business_name="Zari Threads",
                owner_id=uuid.uuid4(),
                owner_name="Fatima Ali",
                owner_email="fatima@example.com",
                reason="No post in 8 days",
                days_since_last_post=8,
                days_since_last_metric=3,
                overdue_task_count=0,
            )
        ],
        total=1,
        page=1,
        page_size=20,
        total_pages=1,
        summary=StalledSummaryCounts(
            total_stalled=1,
            no_post_count=1,
            no_metrics_count=0,
            overdue_tasks_count=0,
        ),
        programs=[],
    )

    transport = ASGITransport(app=app)
    try:
        with patch("app.routes.admin.list_stalled_businesses", return_value=mock_response):
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                resp = await client.get(
                    "/api/v1/admin/cohort/stalled?reason_filter=no_post",
                    headers=get_auth_headers(super_admin_user),
                )
                assert resp.status_code == 200
                data = resp.json()
                assert data["total"] == 1
                assert len(data["items"]) == 1
                assert data["items"][0]["business_name"] == "Zari Threads"
                assert data["summary"]["no_post_count"] == 1
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_stalled_nudge_action(super_admin_user: User) -> None:
    """POST /api/v1/admin/cohort/stalled/{id}/nudge triggers admin outreach audit log."""
    mock_db = AsyncMock()

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: super_admin_user

    target_biz_id = uuid.uuid4()
    mock_biz = Business(
        id=target_biz_id,
        owner_id=uuid.uuid4(),
        name="Khaadi Heritage",
        niche="apparel",
        city="Lahore",
        budget_pkr=20000,
        hours_per_week=15,
        languages=["ur"],
        platforms=["instagram"],
    )

    # Mock DB query returning the business
    m_biz = MagicMock()
    m_biz.scalar_one_or_none.return_value = mock_biz
    mock_db.execute.return_value = m_biz

    transport = ASGITransport(app=app)
    try:
        with patch("app.services.cohort.record_audit_log") as mock_audit:
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                resp = await client.post(
                    f"/api/v1/admin/cohort/stalled/{target_biz_id}/nudge",
                    headers=get_auth_headers(super_admin_user),
                )
                assert resp.status_code == 200
                data = resp.json()
                assert data["success"] is True
                assert data["business_id"] == str(target_biz_id)
                assert "Khaadi Heritage" in data["message"]

                mock_audit.assert_called_once()
                assert mock_audit.call_args[1]["action"] == "admin.business.nudged"
    finally:
        app.dependency_overrides.clear()
