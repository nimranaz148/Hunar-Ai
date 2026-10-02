"""Acceptance tests for Task 26: Agent Progress SSE overlay (F-042 / PRD §5.2, §36)."""

import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token
from app.auth.password import hash_password
from app.core.database import get_db
from app.main import app
from app.models.agent import AgentRun, AgentStep
from app.models.user import User


@pytest.fixture
def entrepreneur_user() -> User:
    """Mock entrepreneur user."""
    return User(
        id=uuid.uuid4(),
        email="fatima.stream@hunar.pk",
        name="Fatima Bibi",
        role="entrepreneur",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def other_user() -> User:
    """Cross-tenant user."""
    return User(
        id=uuid.uuid4(),
        email="other.stream@hunar.pk",
        name="Other User",
        role="entrepreneur",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def sample_run(entrepreneur_user: User) -> AgentRun:
    """Sample AgentRun record."""
    return AgentRun(
        id=uuid.uuid4(),
        trace_id=f"trace-{uuid.uuid4().hex[:16]}",
        workflow="content_calendar",
        user_id=entrepreneur_user.id,
        business_id=None,
        status="running",
        started_at=datetime.now(UTC),
    )


@pytest.fixture
def sample_steps(sample_run: AgentRun) -> list[AgentStep]:
    """Sample AgentStep records."""
    return [
        AgentStep(
            id=1,
            trace_id=sample_run.trace_id or "trace-test",
            span_id="span-1",
            span_type="agent",
            data={
                "name": "Research competitors & market trends",
                "detail": "3 local competitors analyzed",
                "status": "completed",
            },
        ),
        AgentStep(
            id=2,
            trace_id=sample_run.trace_id or "trace-test",
            span_id="span-2",
            span_type="agent",
            data={
                "name": "Strategy outline & pillar selection",
                "detail": "Audience hooks identified",
                "status": "in_progress",
            },
        ),
    ]


def get_auth_headers(user: User) -> dict[str, str]:
    """Generate Authorization header with valid JWT token."""
    token = create_access_token(user_id=user.id, role=user.role, email=user.email)
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# API Route Acceptance Tests (F-042)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_start_agent_run(entrepreneur_user: User) -> None:
    """POST /api/v1/agents/runs starts a new agent run and returns progress steps."""
    mock_db = AsyncMock()

    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/agents/runs",
            json={"workflow": "content_calendar"},
            headers=get_auth_headers(entrepreneur_user),
        )

    app.dependency_overrides.clear()

    assert response.status_code == 201
    data = response.json()
    assert data["workflow"] == "content_calendar"
    assert data["status"] == "running"
    assert len(data["steps"]) > 0
    assert data["steps"][0]["name"] == "Research competitors & market trends"
    assert data["steps"][0]["status"] == "in_progress"


@pytest.mark.asyncio
async def test_get_agent_run_progress(
    entrepreneur_user: User,
    sample_run: AgentRun,
    sample_steps: list[AgentStep],
) -> None:
    """GET /api/v1/agents/runs/{run_id} returns current run progress and step details."""
    mock_db = AsyncMock()

    async def mock_execute(stmt: object) -> MagicMock:
        result = MagicMock()
        stmt_str = str(stmt).lower()
        if "from agent_runs" in stmt_str:
            result.scalar_one_or_none.return_value = sample_run
        elif "from agent_steps" in stmt_str:
            result.scalars.return_value.all.return_value = sample_steps
        return result

    mock_db.execute = mock_execute

    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            f"/api/v1/agents/runs/{sample_run.id}",
            headers=get_auth_headers(entrepreneur_user),
        )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["run_id"] == str(sample_run.id)
    assert data["workflow"] == "content_calendar"
    assert len(data["steps"]) == 2
    assert data["steps"][0]["status"] == "completed"
    assert data["steps"][1]["status"] == "in_progress"


@pytest.mark.asyncio
async def test_cross_tenant_access_forbidden(
    other_user: User,
    sample_run: AgentRun,
) -> None:
    """Entrepreneurs cannot access agent runs owned by other users (403 Forbidden)."""
    mock_db = AsyncMock()

    async def mock_execute(stmt: object) -> MagicMock:
        result = MagicMock()
        result.scalar_one_or_none.return_value = sample_run
        return result

    mock_db.execute = mock_execute

    app.dependency_overrides[get_current_user] = lambda: other_user
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            f"/api/v1/agents/runs/{sample_run.id}",
            headers=get_auth_headers(other_user),
        )

    app.dependency_overrides.clear()

    assert response.status_code == 403
    assert "access" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_cancel_agent_run(
    entrepreneur_user: User,
    sample_run: AgentRun,
) -> None:
    """POST /api/v1/agents/runs/{run_id}/cancel halts an active run."""
    mock_db = AsyncMock()

    async def mock_execute(stmt: object) -> MagicMock:
        result = MagicMock()
        stmt_str = str(stmt).lower()
        if "from agent_runs" in stmt_str:
            result.scalar_one_or_none.return_value = sample_run
        elif "from agent_steps" in stmt_str:
            result.scalars.return_value.all.return_value = []
        return result

    mock_db.execute = mock_execute

    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            f"/api/v1/agents/runs/{sample_run.id}/cancel",
            headers=get_auth_headers(entrepreneur_user),
        )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["run_id"] == str(sample_run.id)
    assert data["status"] == "failed"
    assert "cancelled" in data["message"].lower()
    assert sample_run.status == "failed"
    assert sample_run.error == "Cancelled by user"


@pytest.mark.asyncio
async def test_stream_agent_progress(
    entrepreneur_user: User,
    sample_run: AgentRun,
    sample_steps: list[AgentStep],
) -> None:
    """GET /api/v1/agents/runs/{run_id}/stream streams SSE events with content-type text/event-stream."""
    mock_db = AsyncMock()

    # Completed run for fast stream termination
    sample_run.status = "succeeded"

    async def mock_execute(stmt: object) -> MagicMock:
        result = MagicMock()
        stmt_str = str(stmt).lower()
        if "from agent_runs" in stmt_str:
            result.scalar_one_or_none.return_value = sample_run
        elif "from agent_steps" in stmt_str:
            result.scalars.return_value.all.return_value = sample_steps
        return result

    mock_db.execute = mock_execute

    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            f"/api/v1/agents/runs/{sample_run.id}/stream",
            headers=get_auth_headers(entrepreneur_user),
        )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert "text/event-stream" in response.headers.get("content-type", "")
    assert "data:" in response.text
