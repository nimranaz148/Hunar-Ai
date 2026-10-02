"""Acceptance tests for Task 21: Product Editor (F-005 / PRD §5.2, §12.3, §14.1)."""

import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token
from app.auth.password import hash_password
from app.core.database import get_db
from app.main import app
from app.models.business import Business, Product
from app.models.user import User


@pytest.fixture
def entrepreneur_user() -> User:
    """Mock entrepreneur user."""
    return User(
        id=uuid.uuid4(),
        email="fatima.products@hunar.pk",
        name="Fatima Khan",
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
        email="ayesha.products@hunar.pk",
        name="Ayesha Khan",
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
        name="Gulshan Bakes",
        niche="food",
        city="Karachi",
        area="Gulshan-e-Iqbal",
        budget_pkr=25000,
        hours_per_week=20,
        tone="friendly",
        languages=["roman_ur", "ur"],
        platforms=["whatsapp", "instagram"],
        target_customer="Moms in Gulshan looking for customized cakes",
    )


@pytest.fixture
def sample_product(sample_business: Business) -> Product:
    """Mock sample product record."""
    return Product(
        id=uuid.uuid4(),
        business_id=sample_business.id,
        name="Chocolate Fudge Cake 2lbs",
        description="Freshly baked rich chocolate fudge cake with Belgian ganache.",
        cost_inputs=[
            {"item": "Flour, cocoa, eggs", "amount_pkr": 600},
            {"item": "Belgian chocolate ganache", "amount_pkr": 800},
            {"item": "Packaging box and ribbon", "amount_pkr": 200},
        ],
        price_pkr=2500,
        created_at=datetime.now(UTC),
    )


def get_auth_headers(user: User) -> dict[str, str]:
    """Generate Authorization header with valid JWT token."""
    token = create_access_token(user_id=user.id, role=user.role, email=user.email)
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# 1. Integration: GET /api/v1/businesses/{id}/products
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_products_for_business(
    entrepreneur_user: User,
    sample_business: Business,
    sample_product: Product,
) -> None:
    """Owner can list all products for their business."""
    mock_db = AsyncMock()

    # 1. get_business_by_id query
    mock_biz_result = MagicMock()
    mock_biz_result.scalar_one_or_none.return_value = sample_business

    # 2. list products query
    mock_prod_result = MagicMock()
    mock_prod_result.scalars.return_value.all.return_value = [sample_product]

    mock_db.execute.side_effect = [mock_biz_result, mock_prod_result]

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user

    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(
                f"/api/v1/businesses/{sample_business.id}/products",
                headers=get_auth_headers(entrepreneur_user),
            )
            assert resp.status_code == 200
            data = resp.json()
            assert len(data) == 1
            assert data[0]["name"] == "Chocolate Fudge Cake 2lbs"
            assert data[0]["price_pkr"] == 2500
            assert len(data[0]["cost_inputs"]) == 3
    finally:
        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# 2. Integration: POST /api/v1/businesses/{id}/products (Success & Validation)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_product_success(
    entrepreneur_user: User,
    sample_business: Business,
) -> None:
    """Owner creates product with itemized costs and selling price >= costs."""
    mock_db = AsyncMock()

    mock_biz_result = MagicMock()
    mock_biz_result.scalar_one_or_none.return_value = sample_business
    mock_db.execute.return_value = mock_biz_result

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user

    payload = {
        "name": "Vanilla Bento Cake",
        "description": "Cute 4-inch mini cake for birthdays.",
        "cost_inputs": [
            {"item": "Sponge & vanilla buttercream", "amount_pkr": 400},
            {"item": "Bento box & candle", "amount_pkr": 150},
        ],
        "price_pkr": 1200,
    }

    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                f"/api/v1/businesses/{sample_business.id}/products",
                headers=get_auth_headers(entrepreneur_user),
                json=payload,
            )
            assert resp.status_code == 201
            data = resp.json()
            assert data["name"] == "Vanilla Bento Cake"
            assert data["price_pkr"] == 1200
            assert len(data["cost_inputs"]) == 2
            assert mock_db.add.called
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_create_product_price_less_than_costs_rejected(
    entrepreneur_user: User,
    sample_business: Business,
) -> None:
    """F-005 rule: Selling price cannot be less than total itemized costs."""
    mock_db = AsyncMock()
    mock_biz_result = MagicMock()
    mock_biz_result.scalar_one_or_none.return_value = sample_business
    mock_db.execute.return_value = mock_biz_result

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user

    # Total costs: 500 + 300 = 800 PKR, but selling price is 600 PKR
    payload = {
        "name": "Underpriced Cupcakes",
        "cost_inputs": [
            {"item": "Ingredients", "amount_pkr": 500},
            {"item": "Packaging", "amount_pkr": 300},
        ],
        "price_pkr": 600,
    }

    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                f"/api/v1/businesses/{sample_business.id}/products",
                headers=get_auth_headers(entrepreneur_user),
                json=payload,
            )
            assert resp.status_code == 422
    finally:
        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# 3. Integration: Ownership scoping enforcement (Cross-tenant 403)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_product_cross_tenant_forbidden(
    entrepreneur_user: User,
    other_entrepreneur: User,
    sample_business: Business,
) -> None:
    """Non-owner is rejected with 403 when attempting to create a product."""
    mock_db = AsyncMock()
    mock_biz_result = MagicMock()
    mock_biz_result.scalar_one_or_none.return_value = sample_business
    mock_db.execute.return_value = mock_biz_result

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    # Authenticated as other_entrepreneur
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: other_entrepreneur

    payload = {
        "name": "Intruder Product",
        "cost_inputs": [],
        "price_pkr": 1000,
    }

    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                f"/api/v1/businesses/{sample_business.id}/products",
                headers=get_auth_headers(other_entrepreneur),
                json=payload,
            )
            assert resp.status_code == 403
    finally:
        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# 4. Integration: DELETE /api/v1/businesses/{id}/products/{product_id}
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_product_success(
    entrepreneur_user: User,
    sample_business: Business,
    sample_product: Product,
) -> None:
    """Owner can delete a product (204 No Content)."""
    mock_db = AsyncMock()

    # 1. get_business_by_id
    mock_biz_result = MagicMock()
    mock_biz_result.scalar_one_or_none.return_value = sample_business

    # 2. get_product
    mock_prod_result = MagicMock()
    mock_prod_result.scalar_one_or_none.return_value = sample_product

    mock_db.execute.side_effect = [mock_biz_result, mock_prod_result]

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user

    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.delete(
                f"/api/v1/businesses/{sample_business.id}/products/{sample_product.id}",
                headers=get_auth_headers(entrepreneur_user),
            )
            assert resp.status_code == 204
            assert mock_db.delete.called
    finally:
        app.dependency_overrides.clear()
