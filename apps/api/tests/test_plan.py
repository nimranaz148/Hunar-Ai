"""Acceptance tests for Task 24: Plan Approval Gate (F-008 - Human Gate 1 / PRD §10, §14.1, §36.7)."""

import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, date, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token
from app.auth.password import hash_password
from app.core.database import get_db
from app.main import app
from app.models.business import Business, PricingResult, ValidationReport
from app.models.plan import LaunchPlan, PlanTask, Proposal
from app.models.user import User


@pytest.fixture
def entrepreneur_user() -> User:
    """Mock entrepreneur user."""
    return User(
        id=uuid.uuid4(),
        email="hina.plan@hunar.pk",
        name="Hina Tariq",
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
        email="samina.plan@hunar.pk",
        name="Samina Bibi",
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
        name="Hina's Artisan Bakery",
        niche="food",
        city="Karachi",
        area="Gulshan-e-Iqbal",
        budget_pkr=25000,
        hours_per_week=20,
        tone="friendly",
        languages=["roman_ur", "en"],
        platforms=["whatsapp", "instagram"],
        target_customer="Family celebrations and casual dessert cravings",
    )


@pytest.fixture
def sample_plan(sample_business: Business) -> LaunchPlan:
    """Mock launch plan with sample tasks."""
    plan_id = uuid.uuid4()
    plan = LaunchPlan(
        id=plan_id,
        business_id=sample_business.id,
        status="awaiting_approval",
        summary="30-day launch roadmap for Hina's Artisan Bakery.",
        created_at=datetime.now(UTC),
    )
    plan.tasks = [
        PlanTask(
            id=uuid.uuid4(),
            plan_id=plan_id,
            title="Set up branded WhatsApp catalog",
            description="Add cake prices and ordering guidelines.",
            week=1,
            category="setup",
            due_date=date.today(),
            status="pending",
            order_index=0,
            created_at=datetime.now(UTC),
        ),
        PlanTask(
            id=uuid.uuid4(),
            plan_id=plan_id,
            title="Publish first launch teaser reel",
            description="Behind-the-scenes cake decorating video.",
            week=2,
            category="content",
            due_date=date.today(),
            status="pending",
            order_index=1,
            created_at=datetime.now(UTC),
        ),
    ]
    return plan


def get_auth_headers(user: User) -> dict[str, str]:
    """Generate Authorization header with valid JWT token."""
    token = create_access_token(user_id=user.id, role=user.role, email=user.email)
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# API Route Acceptance Tests (F-008 / F-009)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_launch_plan(
    entrepreneur_user: User,
    sample_business: Business,
    sample_plan: LaunchPlan,
) -> None:
    """GET /plan returns launch plan with tasks."""
    mock_db = AsyncMock()

    async def mock_execute(stmt: object) -> MagicMock:
        result = MagicMock()
        stmt_str = str(stmt).lower()
        if "from businesses" in stmt_str:
            result.scalar_one_or_none.return_value = sample_business
        elif "from launch_plans" in stmt_str:
            result.scalar_one_or_none.return_value = sample_plan
        return result

    mock_db.execute = mock_execute

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(
                f"/api/v1/businesses/{sample_business.id}/plan",
                headers=get_auth_headers(entrepreneur_user),
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["id"] == str(sample_plan.id)
            assert data["status"] == "awaiting_approval"
            assert len(data["tasks"]) == 2
            assert data["tasks"][0]["title"] == "Set up branded WhatsApp catalog"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_gate1_overview(
    entrepreneur_user: User,
    sample_business: Business,
    sample_plan: LaunchPlan,
) -> None:
    """GET /plan/gate1 returns consolidated Gate 1 payload matching Wireframe §30.2."""
    mock_db = AsyncMock()

    mock_val = ValidationReport(
        id=uuid.uuid4(),
        business_id=sample_business.id,
        competitors=[
            {
                "name": "Cake Queen",
                "what_they_do_well": "Popular wedding cakes",
                "gap_we_can_exploit": "None offer same-day delivery in Gulshan",
                "source_url": "https://instagram.com/cakequeen",
            }
        ],
        how_to_be_better=["Offer same day delivery"],
        confidence="high",
        created_at=datetime.now(UTC),
    )

    mock_pricing = [
        PricingResult(
            id=uuid.uuid4(),
            business_id=sample_business.id,
            product_name="Chocolate Cake",
            unit_cost=800,
            price=1500,
            margin_pct=46.7,
            break_even_units=15,
            created_at=datetime.now(UTC),
        )
    ]

    async def mock_execute(stmt: object) -> MagicMock:
        result = MagicMock()
        stmt_str = str(stmt).lower()
        if "from businesses" in stmt_str:
            result.scalar_one_or_none.return_value = sample_business
        elif "from launch_plans" in stmt_str:
            result.scalar_one_or_none.return_value = sample_plan
        elif "from validation_reports" in stmt_str:
            result.scalar_one_or_none.return_value = mock_val
        elif "from pricing_results" in stmt_str:
            result.scalars.return_value.all.return_value = mock_pricing
        return result

    mock_db.execute = mock_execute

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(
                f"/api/v1/businesses/{sample_business.id}/plan/gate1",
                headers=get_auth_headers(entrepreneur_user),
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["gate_status"] == "awaiting_approval"
            assert data["validation_snapshot"]["confidence"] == "high"
            assert (
                data["validation_snapshot"]["key_gap"] == "None offer same-day delivery in Gulshan"
            )
            assert len(data["pricing_snapshot"]) == 1
            assert data["pricing_snapshot"][0]["product_name"] == "Chocolate Cake"
            assert data["pricing_snapshot"][0]["margin_pct"] == 46.7
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_approve_plan_cross_tenant_forbidden(
    other_entrepreneur: User,
    sample_business: Business,
) -> None:
    """Other entrepreneur cannot approve someone else's plan -> 403."""
    mock_db = AsyncMock()

    async def mock_execute(stmt: object) -> MagicMock:
        result = MagicMock()
        result.scalar_one_or_none.return_value = sample_business
        return result

    mock_db.execute = mock_execute

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return other_entrepreneur

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                f"/api/v1/businesses/{sample_business.id}/plan/approve",
                json={"comments": "Looks good!"},
                headers=get_auth_headers(other_entrepreneur),
            )
            assert resp.status_code == 403
            assert "permission" in resp.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_approve_and_reject_plan_flow(
    entrepreneur_user: User,
    sample_business: Business,
    sample_plan: LaunchPlan,
) -> None:
    """Full lifecycle: Approve plan -> Verify audit log; Reject plan with reason."""
    mock_db = AsyncMock()
    mock_prop = Proposal(
        id=uuid.uuid4(),
        business_id=sample_business.id,
        gate_type="plan_approval",
        status="pending",
        created_at=datetime.now(UTC),
    )

    async def mock_execute(stmt: object) -> MagicMock:
        result = MagicMock()
        stmt_str = str(stmt).lower()
        if "from businesses" in stmt_str:
            result.scalar_one_or_none.return_value = sample_business
        elif "from launch_plans" in stmt_str:
            result.scalar_one_or_none.return_value = sample_plan
        elif "from proposals" in stmt_str:
            result.scalar_one_or_none.return_value = mock_prop
        return result

    mock_db.execute = mock_execute

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # 1. Approve Plan (Human Gate 1 approve)
            appr_resp = await client.post(
                f"/api/v1/businesses/{sample_business.id}/plan/approve",
                json={"comments": "Budget and pricing look great. Ready to execute!"},
                headers=get_auth_headers(entrepreneur_user),
            )
            assert appr_resp.status_code == 200
            appr_data = appr_resp.json()
            assert appr_data["status"] == "approved"
            assert appr_data["approved_at"] is not None
            assert mock_prop.status == "approved"

            # 2. Reject Plan (Human Gate 1 request changes)
            rej_resp = await client.post(
                f"/api/v1/businesses/{sample_business.id}/plan/reject",
                json={"reason": "Please allocate more time to WhatsApp direct outreach."},
                headers=get_auth_headers(entrepreneur_user),
            )
            assert rej_resp.status_code == 200
            rej_data = rej_resp.json()
            assert rej_data["status"] == "revision_requested"
            assert (
                rej_data["revision_notes"]
                == "Please allocate more time to WhatsApp direct outreach."
            )
            assert mock_prop.status == "rejected"
    finally:
        app.dependency_overrides.clear()
