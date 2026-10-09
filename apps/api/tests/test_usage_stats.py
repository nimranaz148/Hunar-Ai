"""Acceptance tests for Usage Statistics (Task 54 / F-037 / R-011 / D-004 / PRD §13.2 line 1080, §29.4)."""

import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token
from app.auth.password import hash_password
from app.core.database import get_db
from app.main import app
from app.models.agent import AgentRun
from app.models.user import User


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
    """Generate bearer token header for a mock user."""
    token = create_access_token(user_id=user.id, role=user.role, email=user.email)
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_admin_usage_access_control(
    super_admin_user: User,
    entrepreneur_user: User,
) -> None:
    """GET /api/v1/admin/usage rejects unauthenticated (401) and entrepreneur (403)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Unauthenticated request -> 401
        unauth_resp = await client.get("/api/v1/admin/usage")
        assert unauth_resp.status_code == 401

        # 2. Entrepreneur request -> 403 Forbidden
        ent_headers = get_auth_headers(entrepreneur_user)
        app.dependency_overrides[get_current_user] = lambda: entrepreneur_user
        try:
            ent_resp = await client.get("/api/v1/admin/usage", headers=ent_headers)
            assert ent_resp.status_code == 403
        finally:
            app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_admin_get_usage_stats_success(super_admin_user: User) -> None:
    """GET /api/v1/admin/usage returns aggregated KPI metrics and activity breakdowns."""
    mock_db = AsyncMock()

    now = datetime.now(UTC)
    user_id_1 = uuid.uuid4()
    user_id_2 = uuid.uuid4()

    # Mock user objects
    user1 = User(id=user_id_1, name="Amina Khan", email="amina@hunar.pk", role="entrepreneur")
    user2 = User(id=user_id_2, name="Sara Bibi", email="sara@hunar.pk", role="entrepreneur")

    # Sample agent runs
    runs = [
        AgentRun(
            id=uuid.uuid4(),
            workflow="onboarding_intake",
            user_id=user_id_1,
            status="succeeded",
            started_at=now - timedelta(seconds=10),
            ended_at=now - timedelta(seconds=6),
            created_at=now - timedelta(hours=1),
        ),
        AgentRun(
            id=uuid.uuid4(),
            workflow="onboarding_intake",
            user_id=user_id_1,
            status="succeeded",
            started_at=now - timedelta(seconds=8),
            ended_at=now - timedelta(seconds=4),
            created_at=now - timedelta(hours=1),
        ),
        AgentRun(
            id=uuid.uuid4(),
            workflow="weekly_coach",
            user_id=user_id_2,
            status="failed",
            started_at=now - timedelta(seconds=5),
            ended_at=now - timedelta(seconds=3),
            created_at=now - timedelta(hours=2),
        ),
    ]

    # Active audit log actors
    audit_actors = [user_id_1, user_id_2, super_admin_user.id]

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: super_admin_user

    # Mock DB query executions
    # 1. scalar for active audit user ids
    # 2. scalars for agent runs today
    # 3. execute for top users query
    async def mock_execute(stmt, *args, **kwargs):
        mock_result = MagicMock()
        # If query is for top users
        if "user_id" in str(stmt).lower() and "count" in str(stmt).lower():
            mock_result.all.return_value = [
                (user1, 8),
                (user2, 5),
            ]
        elif "audit_logs" in str(stmt).lower():
            mock_result.all.return_value = [(uid,) for uid in audit_actors]
        else:
            mock_result.scalars.return_value.all.return_value = runs
            mock_result.all.return_value = runs
        return mock_result

    mock_db.execute.side_effect = mock_execute

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = runs
    mock_db.scalars.return_value = mock_scalars

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            headers = get_auth_headers(super_admin_user)
            resp = await client.get("/api/v1/admin/usage", headers=headers)
            assert resp.status_code == 200
            data = resp.json()

            # Verify response schema fields
            assert "active_users_today" in data
            assert "runs_today_total" in data
            assert "runs_today_succeeded" in data
            assert "runs_today_failed" in data
            assert "avg_latency_seconds" in data
            assert "error_rate_pct" in data
            assert "runs_per_hour" in data
            assert "workflows" in data
            assert "top_users" in data

            assert data["runs_today_total"] == 3
            assert data["runs_today_succeeded"] == 2
            assert data["runs_today_failed"] == 1
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)
