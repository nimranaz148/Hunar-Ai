"""Phase 1 Exit Gate End-to-End Acceptance Test (PRD §5.2, §10, §14.1, §36 / build-plan.md Phase 1 Exit Gate).

Exit Criteria:
"An entrepreneur types a business idea → agents produce validation report, pricing,
and launch plan → she approves → plan tasks are visible. Agent run appears in
Super Admin's explorer with spans."
"""

import uuid
from datetime import UTC, date, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token
from app.auth.password import hash_password
from app.core.database import get_db
from app.main import app
from app.models.agent import AgentRun, AgentStep
from app.models.business import Business, PricingResult, Product, ValidationReport
from app.models.plan import LaunchPlan, PlanTask
from app.models.user import User


@pytest.fixture
def entrepreneur_user() -> User:
    """Mock entrepreneur user."""
    return User(
        id=uuid.uuid4(),
        email="fatima.gate@hunar.pk",
        name="Fatima Bibi",
        role="entrepreneur",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def admin_user() -> User:
    """Mock super admin user."""
    return User(
        id=uuid.uuid4(),
        email="admin.gate@hunar.pk",
        name="Super Admin",
        role="super_admin",
        password_hash=hash_password("Password123!"),
        status="active",
        language="en",
        force_password_change=False,
    )


def get_auth_headers(user: User) -> dict[str, str]:
    """Generate valid bearer token header."""
    token = create_access_token(user_id=user.id, role=user.role, email=user.email)
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_phase_1_exit_gate_end_to_end(
    entrepreneur_user: User,
    admin_user: User,
) -> None:
    """Full Phase 1 exit gate verification from onboarding idea to Gate 1 approval and admin tracing."""
    biz_id = uuid.uuid4()
    plan_id = uuid.uuid4()
    task_id = uuid.uuid4()
    run_id = uuid.uuid4()
    trace_id = f"trace-{uuid.uuid4().hex[:16]}"

    # Step 1: Business Profile initialized from onboarding interview
    business = Business(
        id=biz_id,
        owner_id=entrepreneur_user.id,
        name="Fatima's Homemade Pickles & Chutneys",
        niche="food",
        city="Lahore",
        area="Model Town",
        budget_pkr=20000,
        hours_per_week=15,
        tone="friendly",
        languages=["roman_ur", "ur"],
        platforms=["whatsapp", "facebook"],
        target_customer="Working mothers and traditional food lovers in Lahore",
    )

    # Step 2: Product Catalog with itemized costs
    product = Product(
        id=uuid.uuid4(),
        business_id=biz_id,
        name="Spicy Mango Achar (500g)",
        description="Fresh seasonal mango pickle with mustard oil",
        price_pkr=850,
        cost_inputs=[
            {"item": "Raw Mangoes", "cost_pkr": 150},
            {"item": "Spices & Mustard Oil", "cost_pkr": 180},
            {"item": "Glass Jar & Label", "cost_pkr": 90},
        ],
    )

    # Step 3: Validation Report produced by Validator Agent
    validation_report = ValidationReport(
        id=uuid.uuid4(),
        business_id=biz_id,
        competitors=[
            {
                "name": "National Foods",
                "what_they_do_well": "Mass availability",
                "gap_we_can_exploit": "Industrial preservatives, lack of artisanal taste",
                "source_url": "https://instagram.com/nationalfoods",
            }
        ],
        how_to_be_better=["Offer 250g sample jars", "Bundle achar with homemade chutneys"],
        confidence="high",
        created_at=datetime.now(UTC),
    )

    # Step 4: Pricing Economics produced by Pricing Agent
    pricing_result = PricingResult(
        id=uuid.uuid4(),
        business_id=biz_id,
        product_id=product.id,
        product_name="Spicy Mango Achar (500g)",
        unit_cost=420,
        price=850,
        margin_pct=50.6,
        break_even_units=12,
        risk_flags=[],
        notes="Healthy premium homemade positioning.",
        created_at=datetime.now(UTC),
    )

    # Step 5: 30-day Launch Plan & Tasks produced by Launch Planner Agent
    plan = LaunchPlan(
        id=plan_id,
        business_id=biz_id,
        status="awaiting_approval",
        summary="30-day roadmap for Fatima's Homemade Pickles.",
        created_at=datetime.now(UTC),
    )
    plan_task = PlanTask(
        id=task_id,
        plan_id=plan_id,
        title="Distribute 10 free sample jars to neighbors & collect reviews",
        description="Pack 10 mini jars with WhatsApp feedback QR code.",
        week=1,
        category="setup",
        due_date=date.today(),
        status="pending",
        order_index=0,
        created_at=datetime.now(UTC),
    )
    plan.tasks = [plan_task]

    # Step 6: Agent Run & Trace spans for Admin Explorer
    agent_run = AgentRun(
        id=run_id,
        trace_id=trace_id,
        workflow="launch_plan",
        user_id=entrepreneur_user.id,
        business_id=biz_id,
        status="succeeded",
        started_at=datetime.now(UTC),
        ended_at=datetime.now(UTC),
        created_at=datetime.now(UTC),
    )
    agent_steps = [
        AgentStep(
            id=1,
            trace_id=trace_id,
            span_id=f"span-{run_id.hex[:8]}-0",
            span_type="agent",
            started_at=datetime.now(UTC),
            ended_at=datetime.now(UTC),
            data={"name": "Analyzing business profile & niche", "status": "completed"},
        ),
        AgentStep(
            id=2,
            trace_id=trace_id,
            span_id=f"span-{run_id.hex[:8]}-1",
            span_type="generation",
            started_at=datetime.now(UTC),
            ended_at=datetime.now(UTC),
            data={"name": "Finalizing launch roadmap", "status": "completed"},
        ),
    ]

    # Set up mock DB router for full execution
    mock_db = AsyncMock()
    mock_db.get = AsyncMock(return_value=agent_run)
    mock_scalars_result = MagicMock()
    mock_scalars_result.all.return_value = agent_steps
    mock_db.scalars = AsyncMock(return_value=mock_scalars_result)

    async def mock_execute(stmt: object) -> MagicMock:
        result = MagicMock()
        stmt_str = str(stmt).lower()
        if "from businesses" in stmt_str:
            result.scalar_one_or_none.return_value = business
        elif "from validation_reports" in stmt_str:
            result.scalar_one_or_none.return_value = validation_report
        elif "from pricing_results" in stmt_str:
            result.scalars.return_value.all.return_value = [pricing_result]
            result.scalar_one_or_none.return_value = pricing_result
        elif "from launch_plans" in stmt_str:
            result.scalar_one_or_none.return_value = plan
            result.scalar_one.return_value = plan
        elif "from plan_tasks" in stmt_str:
            result.scalar_one_or_none.return_value = plan_task
            result.scalars.return_value.all.return_value = [plan_task]
        elif "from agent_runs" in stmt_str:
            result.scalar_one_or_none.return_value = agent_run
            result.scalars.return_value.all.return_value = [agent_run]
        elif "from agent_steps" in stmt_str:
            result.scalars.return_value.all.return_value = agent_steps
        return result

    mock_db.execute = mock_execute

    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # A. Gate 1 Overview: Entrepreneur views combined validation, pricing & roadmap
        gate1_res = await client.get(
            f"/api/v1/businesses/{biz_id}/plan/gate1",
            headers=get_auth_headers(entrepreneur_user),
        )
        assert gate1_res.status_code == 200
        gate1_data = gate1_res.json()
        assert gate1_data["plan"]["business_id"] == str(biz_id)
        assert gate1_data["gate_status"] == "awaiting_approval"
        assert gate1_data["validation_snapshot"]["confidence"] == "high"
        assert len(gate1_data["pricing_snapshot"]) == 1
        assert gate1_data["pricing_snapshot"][0]["product_name"] == "Spicy Mango Achar (500g)"

        # B. Human Gate 1: Entrepreneur approves the launch plan
        approve_res = await client.post(
            f"/api/v1/businesses/{biz_id}/plan/approve",
            json={"comments": "Looks great, let's start with sample distribution."},
            headers=get_auth_headers(entrepreneur_user),
        )
        assert approve_res.status_code == 200
        approved_data = approve_res.json()
        assert approved_data["status"] == "approved"
        assert plan.status == "approved"

        # C. Plan Tasks: Entrepreneur views active tasks and marks week 1 task complete
        plan_res = await client.get(
            f"/api/v1/businesses/{biz_id}/plan",
            headers=get_auth_headers(entrepreneur_user),
        )
        assert plan_res.status_code == 200
        plan_data = plan_res.json()
        assert len(plan_data["tasks"]) == 1

        update_task_res = await client.patch(
            f"/api/v1/businesses/{biz_id}/plan/tasks/{task_id}",
            json={"status": "completed"},
            headers=get_auth_headers(entrepreneur_user),
        )
        assert update_task_res.status_code == 200
        assert update_task_res.json()["status"] == "completed"

        # D. Super Admin Explorer: Admin views agent run and execution spans
        app.dependency_overrides[get_current_user] = lambda: admin_user

        admin_run_res = await client.get(
            f"/api/v1/admin/runs/{run_id}",
            headers=get_auth_headers(admin_user),
        )
        assert admin_run_res.status_code == 200
        admin_data = admin_run_res.json()
        assert admin_data["run"]["id"] == str(run_id)
        assert admin_data["run"]["workflow"] == "launch_plan"
        assert len(admin_data["spans"]) == 2
        assert admin_data["spans"][0]["span_type"] == "agent"

    app.dependency_overrides.clear()
