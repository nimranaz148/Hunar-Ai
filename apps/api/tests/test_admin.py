"""Acceptance tests for Super Admin and Change Password (Tasks 12-17 / PRD §14, §30, §36)."""

import uuid
from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token
from app.auth.password import hash_password
from app.core.database import get_db
from app.main import app
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
        name="Entrepreneur User",
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
async def test_admin_users_access_control(
    super_admin_user: User,
    entrepreneur_user: User,
) -> None:
    """GET /api/v1/admin/users rejects entrepreneur with 403, allows super_admin."""
    mock_db = AsyncMock()

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    transport = ASGITransport(app=app)

    # 1. Non-admin gets 403 Forbidden
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(
                "/api/v1/admin/users", headers={"Authorization": "Bearer token"}
            )
            assert resp.status_code == 403
    finally:
        app.dependency_overrides.clear()

    # 2. Super admin gets 200 OK
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: super_admin_user
    try:
        with patch("app.routes.admin.list_users") as mock_list:
            from app.schemas.common import PaginatedResponse

            mock_list.return_value = PaginatedResponse(
                items=[super_admin_user],
                total=1,
                page=1,
                page_size=20,
            )
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                resp = await client.get(
                    "/api/v1/admin/users", headers={"Authorization": "Bearer token"}
                )
                assert resp.status_code == 200
                data = resp.json()
                assert data["total"] == 1
                assert data["items"][0]["email"] == "admin@hunar.pk"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_admin_create_user(super_admin_user: User) -> None:
    """POST /api/v1/admin/users creates user with temp password and force_password_change."""
    mock_db = AsyncMock()

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: super_admin_user

    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            payload = {
                "name": "New Mentor",
                "email": "mentor.new@hunar.pk",
                "role": "mentor",
                "language": "roman_ur",
            }

            with patch("app.routes.admin.create_user_by_admin") as mock_create:
                created_user = User(
                    id=uuid.uuid4(),
                    name=payload["name"],
                    email=payload["email"],
                    role=payload["role"],
                    language=payload["language"],
                    password_hash="hashed",
                    status="active",
                    force_password_change=True,
                )
                mock_create.return_value = (created_user, "TempPass123!")

                resp = await client.post(
                    "/api/v1/admin/users", json=payload, headers={"Authorization": "Bearer token"}
                )
                assert resp.status_code == 201
                body = resp.json()
                assert body["user"]["role"] == "mentor"
                assert body["temporary_password"] == "TempPass123!"
                assert body["user"]["force_password_change"] is True
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_admin_kill_switch_toggle(super_admin_user: User) -> None:
    """POST /api/v1/admin/kill-switch toggles kill switch."""
    mock_db = AsyncMock()

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: super_admin_user

    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch(
                "app.routes.admin.toggle_kill_switch", new_callable=AsyncMock
            ) as mock_toggle:
                mock_toggle.return_value = True

                resp = await client.post(
                    "/api/v1/admin/kill-switch", headers={"Authorization": "Bearer token"}
                )
                assert resp.status_code == 200
                assert resp.json()["agent_kill_switch"] is True
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_change_password_flow(entrepreneur_user: User) -> None:
    """POST /api/v1/auth/change-password changes user password and logs audit."""
    mock_db = AsyncMock()

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: entrepreneur_user

    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.routes.auth.change_user_password", new_callable=AsyncMock) as mock_cp:
                resp = await client.post(
                    "/api/v1/auth/change-password",
                    json={
                        "current_password": "EntPass123!",
                        "new_password": "NewSecretPass456!",
                    },
                    headers={"Authorization": "Bearer token"},
                )
                assert resp.status_code == 200
                assert resp.json()["status"] == "ok"
                assert mock_cp.called
    finally:
        app.dependency_overrides.clear()
