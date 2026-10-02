"""Acceptance tests for Task 19: Onboarding Chat (F-003 / PRD §10, §30.1, §36.11)."""

import uuid
from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token
from app.auth.password import hash_password
from app.core.database import get_db
from app.main import app
from app.models.business import OnboardingMessage
from app.models.user import User
from app.schemas.onboarding import BusinessProfile


@pytest.fixture
def entrepreneur_user() -> User:
    """Mock entrepreneur user."""
    return User(
        id=uuid.uuid4(),
        email="fatima@hunar.pk",
        name="Fatima Khan",
        role="entrepreneur",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def other_user() -> User:
    """Mock mentor user."""
    return User(
        id=uuid.uuid4(),
        email="mentor@hunar.pk",
        name="Mentor User",
        role="mentor",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


def get_auth_headers(user: User) -> dict[str, str]:
    """Generate bearer token header for a mock user."""
    token = create_access_token(user_id=user.id, role=user.role, email=user.email)
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# 1. Unit: BusinessProfile Schema & Intake validation
# ---------------------------------------------------------------------------


def test_business_profile_schema_validation() -> None:
    """BusinessProfile validates required fields, allowed niches, and budget constraints."""
    profile = BusinessProfile(
        name="Gulshan Bakes",
        niche="food",
        city="Karachi",
        area="Gulshan-e-Iqbal",
        budget_pkr=25000,
        hours_per_week=20,
        tone="friendly",
        languages=["roman_ur", "en"],
        platforms=["instagram", "facebook"],
        target_customer="Families and party hosts in Gulshan looking for fresh customized cakes",
    )
    assert profile.name == "Gulshan Bakes"
    assert profile.niche == "food"
    assert profile.budget_pkr == 25000

    # Niche must be from allowed list
    with pytest.raises(ValueError):
        BusinessProfile(
            name="Invalid Niche Business",
            niche="crypto_trading",
            city="Karachi",
            budget_pkr=10000,
            hours_per_week=10,
            languages=["en"],
            platforms=["instagram"],
        )

    # Budget must be >= 1000 per PRD §5.2
    with pytest.raises(ValueError):
        BusinessProfile(
            name="Too Low Budget",
            niche="food",
            city="Karachi",
            budget_pkr=500,
            hours_per_week=10,
            languages=["en"],
            platforms=["instagram"],
        )


# ---------------------------------------------------------------------------
# 2. Integration: Authorization & Access Control
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_onboarding_access_control(
    entrepreneur_user: User,
    other_user: User,
) -> None:
    """GET /messages and POST /chat reject unauthenticated or non-entrepreneur users."""
    mock_db = AsyncMock()

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    transport = ASGITransport(app=app)

    # 1. Unauthenticated -> 401
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/onboarding/messages")
        assert resp.status_code == 401

        resp_post = await client.post(
            "/api/v1/onboarding/chat",
            json={"message": "Salam! Mera naam Fatima hai."},
        )
        assert resp_post.status_code == 401

    # 2. Authenticated non-entrepreneur (mentor) -> 403 Forbidden
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: other_user
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(
                "/api/v1/onboarding/messages",
                headers=get_auth_headers(other_user),
            )
            assert resp.status_code == 403

            resp_post = await client.post(
                "/api/v1/onboarding/chat",
                headers=get_auth_headers(other_user),
                json={"message": "Salam! Mera naam Fatima hai."},
            )
            assert resp_post.status_code == 403
    finally:
        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# 3. Integration: Fetch chat messages (Scoped to user)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_onboarding_messages(entrepreneur_user: User) -> None:
    """GET /api/v1/onboarding/messages returns user's onboarding chat history."""
    mock_db = AsyncMock()

    msg1 = OnboardingMessage(
        id=uuid.uuid4(),
        user_id=entrepreneur_user.id,
        role="assistant",
        content="Assalamu alaikum! Main Hunar hun.",
    )
    msg2 = OnboardingMessage(
        id=uuid.uuid4(),
        user_id=entrepreneur_user.id,
        role="user",
        content="Mujhe home bakery shuru karni hai.",
    )

    mock_biz_result = MagicMock()
    mock_biz_result.scalar_one_or_none.return_value = None

    mock_msgs_result = MagicMock()
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [msg1, msg2]
    mock_msgs_result.scalars.return_value = mock_scalars

    mock_db.execute.side_effect = [mock_biz_result, mock_msgs_result]

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user

    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(
                "/api/v1/onboarding/messages",
                headers=get_auth_headers(entrepreneur_user),
            )
            assert resp.status_code == 200
            data = resp.json()
            assert len(data["messages"]) == 2
            assert data["messages"][0]["role"] == "assistant"
            assert data["messages"][1]["role"] == "user"
            assert data["messages"][1]["content"] == "Mujhe home bakery shuru karni hai."
    finally:
        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# 4. Integration: SSE Streaming & Business Creation
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_post_onboarding_chat_streaming(entrepreneur_user: User) -> None:
    """POST /api/v1/onboarding/chat returns text/event-stream with assistant reply."""
    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    # Mock user having no existing business
    mock_existing_business = MagicMock()
    mock_existing_business.scalar_one_or_none.return_value = None

    # Mock message history
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = []
    mock_messages_result = MagicMock()
    mock_messages_result.scalars.return_value = mock_scalars

    mock_db.execute.side_effect = [
        mock_existing_business,  # Check if business exists
        mock_messages_result,  # Query history
    ]

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user

    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/v1/onboarding/chat",
                headers=get_auth_headers(entrepreneur_user),
                json={"message": "Mujhe home bakery shuru karni hai Gulshan mein, budget 20000."},
            )
            assert resp.status_code == 200
            assert "text/event-stream" in resp.headers["content-type"]
            text = resp.text
            assert "data:" in text
    finally:
        app.dependency_overrides.clear()
