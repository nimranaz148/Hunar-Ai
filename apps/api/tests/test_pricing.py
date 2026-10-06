"""Acceptance tests for Task 23: Pricing & Break-even View (F-007 / PRD §5.2, §36.13, §14.1)."""

import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.agents.pricing import calc_pricing, run_pricing_agent
from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token
from app.auth.password import hash_password
from app.core.database import get_db
from app.main import app
from app.models.business import Business, PricingResult, Product
from app.models.user import User


@pytest.fixture
def entrepreneur_user() -> User:
    """Mock entrepreneur user."""
    return User(
        id=uuid.uuid4(),
        email="sara.pricing@hunar.pk",
        name="Sara Ahmed",
        role="entrepreneur",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def other_entrepreneur() -> User:
    """Mock another entrepreneur user for cross-tenant testing."""
    return User(
        id=uuid.uuid4(),
        email="zainab.pricing@hunar.pk",
        name="Zainab Bibi",
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
        name="Lahore Sweet Bakes",
        niche="food",
        city="Lahore",
        area="Gulberg",
        budget_pkr=40000,
        hours_per_week=20,
        tone="friendly",
        languages=["roman_ur", "en"],
        platforms=["whatsapp", "instagram"],
        target_customer="Dessert lovers and tea-time parties",
    )


@pytest.fixture
def sample_products(sample_business: Business) -> list[Product]:
    """Mock sample product catalog."""
    return [
        Product(
            id=uuid.uuid4(),
            business_id=sample_business.id,
            name="Belgian Chocolate Cake",
            description="2-pound rich fudge cake",
            cost_inputs=[
                {"name": "Cocoa & chocolate", "amount_pkr": 500},
                {"name": "Flour, eggs & dairy", "amount_pkr": 250},
                {"name": "Box packaging", "amount_pkr": 100},
            ],
            price_pkr=1600,
        ),
        Product(
            id=uuid.uuid4(),
            business_id=sample_business.id,
            name="Vanilla Cupcakes (Box of 6)",
            description="Soft sponge cupcakes with buttercream",
            cost_inputs=[
                {"name": "Ingredients", "amount_pkr": 300},
                {"name": "Packaging", "amount_pkr": 80},
            ],
            price_pkr=700,
        ),
    ]


def get_auth_headers(user: User) -> dict[str, str]:
    """Generate Authorization header with valid JWT token."""
    token = create_access_token(user_id=user.id, role=user.role, email=user.email)
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Unit Tests for Pricing Calculations (PRD §36.13)
# ---------------------------------------------------------------------------


def test_calc_pricing_deterministic_values() -> None:
    """Verify deterministic arithmetic for price, margin %, and break-even units."""
    # Wireframe PRD §30.2 example: Cost Rs. 800, Price Rs. 1500, Overhead Rs. 10000
    res = calc_pricing(unit_cost=800, price=1500, overhead_pkr=10000)
    assert res["unit_cost"] == 800
    assert res["price"] == 1500
    # Margin % = (1500 - 800) / 1500 * 100 = 46.7%
    assert res["margin_pct"] == 46.7
    # Break-even = ceil(10000 / 700) = 15 units
    assert res["break_even_units"] == 15
    assert len(res["risk_flags"]) == 0


def test_calc_pricing_risk_flags_margins_and_volume() -> None:
    """Verify PRD §36.13 rules: margin < 20% warning, break-even > 100 units risk flag."""
    # Low margin case: cost 900, price 1000 (margin = 10%)
    res_low = calc_pricing(unit_cost=900, price=1000, overhead_pkr=5000)
    assert res_low["margin_pct"] == 10.0
    assert any("Margin below 20%" in flag for flag in res_low["risk_flags"])

    # High break-even case: overhead 150,000, unit contribution = 1000 (break-even = 150 units)
    res_high_be = calc_pricing(unit_cost=1000, price=2000, overhead_pkr=150000)
    assert res_high_be["break_even_units"] == 150
    assert any("Break-even above 100 units" in flag for flag in res_high_be["risk_flags"])


@pytest.mark.asyncio
async def test_run_pricing_agent_fallback() -> None:
    """Verify fallback pricing agent output without live LLM calls."""
    prods = [
        {
            "id": str(uuid.uuid4()),
            "name": "Artisan Loaf",
            "cost_inputs": [{"name": "Flour", "amount_pkr": 200}],
            "price_pkr": 450,
        }
    ]
    output = await run_pricing_agent(
        business_name="Artisan Bakery",
        niche="food",
        city="Lahore",
        products_data=prods,
        overhead_pkr=10000,
    )
    assert len(output.items) == 1
    item = output.items[0]
    assert item.product_name == "Artisan Loaf"
    assert item.unit_cost == 200
    assert item.price == 450
    assert item.margin_pct > 50.0
    assert item.break_even_units > 0


# ---------------------------------------------------------------------------
# API Route Acceptance Tests (F-007)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_pricing_empty(
    entrepreneur_user: User,
    sample_business: Business,
) -> None:
    """GET /pricing returns empty list when no calculations exist."""
    mock_db = AsyncMock()

    async def mock_execute(stmt: object) -> MagicMock:
        result = MagicMock()
        stmt_str = str(stmt).lower()
        if "from businesses" in stmt_str:
            result.scalar_one_or_none.return_value = sample_business
        elif "from pricing_results" in stmt_str:
            result.scalars.return_value.all.return_value = []
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
                f"/api/v1/businesses/{sample_business.id}/pricing",
                headers=get_auth_headers(entrepreneur_user),
            )
            assert resp.status_code == 200
            assert resp.json() == []
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_calculate_pricing_cross_tenant_forbidden(
    other_entrepreneur: User,
    sample_business: Business,
) -> None:
    """Cross-tenant calculate request returns 403 Forbidden."""
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
                f"/api/v1/businesses/{sample_business.id}/pricing/calculate",
                json={"overhead_pkr": 15000},
                headers=get_auth_headers(other_entrepreneur),
            )
            assert resp.status_code == 403
            assert "permission" in resp.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_calculate_and_approve_pricing_flow(
    entrepreneur_user: User,
    sample_business: Business,
    sample_products: list[Product],
) -> None:
    """Full lifecycle: Calculate pricing -> Return unit metrics -> Approve pricing result."""
    mock_db = AsyncMock()
    pricing_records: list[PricingResult] = []

    async def mock_execute(stmt: object) -> MagicMock:
        result = MagicMock()
        stmt_str = str(stmt).lower()
        if "from businesses" in stmt_str:
            result.scalar_one_or_none.return_value = sample_business
        elif "from products" in stmt_str:
            result.scalars.return_value.all.return_value = sample_products
        elif "delete from pricing_results" in stmt_str:
            pricing_records.clear()
        elif "from pricing_results" in stmt_str:
            if "where pricing_results.id =" in stmt_str:
                result.scalar_one_or_none.return_value = (
                    pricing_records[0] if pricing_records else None
                )
            else:
                result.scalars.return_value.all.return_value = pricing_records
        return result

    mock_db.execute = mock_execute

    def mock_add(entity: object) -> None:
        if isinstance(entity, PricingResult):
            entity.created_at = datetime.now(UTC)
            pricing_records.append(entity)

    mock_db.add = mock_add

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return entrepreneur_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # 1. Calculate pricing
            calc_resp = await client.post(
                f"/api/v1/businesses/{sample_business.id}/pricing/calculate",
                json={"overhead_pkr": 10000},
                headers=get_auth_headers(entrepreneur_user),
            )
            assert calc_resp.status_code == 200
            data = calc_resp.json()
            assert len(data) == 2
            first_item = data[0]
            assert first_item["product_name"] == "Belgian Chocolate Cake"
            assert first_item["unit_cost"] == 850  # 500 + 250 + 100
            assert first_item["price"] == 1600
            assert first_item["margin_pct"] == 46.9
            assert first_item["break_even_units"] == 14  # ceil(10000 / 750) = 14
            assert first_item["approved_at"] is None

            # 2. Approve pricing
            pricing_id = first_item["id"]
            appr_resp = await client.post(
                f"/api/v1/businesses/{sample_business.id}/pricing/{pricing_id}/approve",
                headers=get_auth_headers(entrepreneur_user),
            )
            assert appr_resp.status_code == 200
            appr_data = appr_resp.json()
            assert appr_data["id"] == pricing_id
            assert appr_data["approved_at"] is not None
    finally:
        app.dependency_overrides.clear()
