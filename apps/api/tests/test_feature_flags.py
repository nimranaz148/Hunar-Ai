"""Acceptance tests for Feature Flags management (Task 53 / F-036 / PRD §12.1, §13.2 line 1079, §14.1, §14.2)."""

import uuid
from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token
from app.auth.password import hash_password
from app.core.database import get_db
from app.main import app
from app.models.feature_flag import FeatureFlag
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
async def test_admin_feature_flags_access_control(
    super_admin_user: User,
    entrepreneur_user: User,
) -> None:
    """GET /api/v1/admin/feature-flags rejects entrepreneur with 403 and unauthenticated with 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Unauthenticated request -> 401
        unauth_resp = await client.get("/api/v1/admin/feature-flags")
        assert unauth_resp.status_code == 401

        # 2. Entrepreneur request -> 403 Forbidden
        ent_headers = get_auth_headers(entrepreneur_user)
        app.dependency_overrides[get_current_user] = lambda: entrepreneur_user
        try:
            ent_resp = await client.get("/api/v1/admin/feature-flags", headers=ent_headers)
            assert ent_resp.status_code == 403
        finally:
            app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_admin_get_feature_flags(super_admin_user: User) -> None:
    """GET /api/v1/admin/feature-flags returns list of all feature flags."""
    mock_db = AsyncMock()

    sample_flags = [
        FeatureFlag(
            key="weekly_coach_agent",
            name="Weekly AI Coach",
            description="Enables AI-driven weekly marketing diagnostics and proposals.",
            is_enabled=True,
            updated_by=super_admin_user.id,
        ),
        FeatureFlag(
            key="meta_connect",
            name="Meta / Social Auto-Publish",
            description="Direct posting API integration.",
            is_enabled=False,
            updated_by=None,
        ),
    ]

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = sample_flags
    mock_db.scalars.return_value = mock_scalars

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: super_admin_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            headers = get_auth_headers(super_admin_user)
            resp = await client.get("/api/v1/admin/feature-flags", headers=headers)
            assert resp.status_code == 200
            data = resp.json()
            assert len(data) == 2
            assert data[0]["key"] == "weekly_coach_agent"
            assert data[0]["is_enabled"] is True
            assert data[1]["key"] == "meta_connect"
            assert data[1]["is_enabled"] is False
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_admin_patch_feature_flags(super_admin_user: User) -> None:
    """PATCH /api/v1/admin/feature-flags updates flags and records audit log."""
    mock_db = AsyncMock()

    flag1 = FeatureFlag(
        key="weekly_coach_agent",
        name="Weekly AI Coach",
        description="Enables AI-driven weekly marketing diagnostics.",
        is_enabled=True,
    )
    flag2 = FeatureFlag(
        key="meta_connect",
        name="Meta / Social Auto-Publish",
        description="Direct posting API integration.",
        is_enabled=False,
    )

    async def mock_get(model_cls: type, key: str) -> FeatureFlag | None:
        if key == "weekly_coach_agent":
            return flag1
        if key == "meta_connect":
            return flag2
        return None

    mock_db.get.side_effect = mock_get

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [flag1, flag2]
    mock_db.scalars.return_value = mock_scalars

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: super_admin_user

    try:
        with patch("app.services.admin.record_audit_log", new_callable=AsyncMock) as mock_audit:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                headers = get_auth_headers(super_admin_user)
                payload = {
                    "flags": [
                        {"key": "meta_connect", "is_enabled": True},
                    ]
                }
                resp = await client.patch(
                    "/api/v1/admin/feature-flags",
                    json=payload,
                    headers=headers,
                )
                assert resp.status_code == 200
                data = resp.json()
                assert len(data) == 2
                assert flag2.is_enabled is True
                assert flag2.updated_by == super_admin_user.id

                # Verify audit logging
                mock_audit.assert_called_once()
                call_kwargs = mock_audit.call_args.kwargs
                assert call_kwargs["action"] == "feature_flag.changed"
                assert call_kwargs["target_type"] == "feature_flag"
                assert "meta_connect" in call_kwargs["meta"]
                assert call_kwargs["meta"]["meta_connect"]["before"] is False
                assert call_kwargs["meta"]["meta_connect"]["after"] is True
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_public_get_feature_flags() -> None:
    """GET /api/v1/feature-flags returns map of active flags for application runtime."""
    mock_db = AsyncMock()

    sample_flags = [
        FeatureFlag(
            key="weekly_coach_agent",
            name="Weekly AI Coach",
            description="Enables AI-driven weekly marketing diagnostics.",
            is_enabled=True,
        ),
        FeatureFlag(
            key="meta_connect",
            name="Meta / Social Auto-Publish",
            description="Direct posting API integration.",
            is_enabled=False,
        ),
    ]

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = sample_flags
    mock_db.scalars.return_value = mock_scalars

    async def override_get_db() -> AsyncGenerator[AsyncMock, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/v1/feature-flags")
            assert resp.status_code == 200
            data = resp.json()
            assert data["weekly_coach_agent"] is True
            assert data["meta_connect"] is False
    finally:
        app.dependency_overrides.pop(get_db, None)
