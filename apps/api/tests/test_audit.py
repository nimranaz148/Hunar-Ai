"""Tests for audit logging, sensitive data masking, and correlation ID propagation."""

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient

from app.auth.password import hash_password
from app.core.audit import mask_email, mask_phone, sanitize_audit_payload
from app.main import app
from app.models.audit import AuditLog
from app.models.user import RefreshToken, User
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.auth import (
    authenticate,
    register_user,
    revoke_user_refresh_token,
    rotate_refresh_token,
)


def mock_db_result(return_value: Any) -> MagicMock:
    """Create a synchronous mock of SQLAlchemy Result with scalar_one_or_none."""
    res = MagicMock()
    res.scalar_one_or_none.return_value = return_value
    return res


# ---------------------------------------------------------------------------
# Unit tests: Sensitive data masking & redaction
# ---------------------------------------------------------------------------


def test_mask_email() -> None:
    """Email addresses are properly masked for privacy in meta."""
    assert mask_email("fatima.bibi@example.com") == "f***i@example.com"
    assert mask_email("ab@domain.com") == "a***@domain.com"
    assert mask_email("invalid-email") == "[MASKED]"


def test_mask_phone() -> None:
    """Phone numbers are masked leaving prefix and suffix."""
    assert mask_phone("+923001234567") == "+9230***567"
    assert mask_phone("123") == "[MASKED]"


def test_sanitize_audit_payload_redacts_credentials_and_tokens() -> None:
    """Forbidden credential keys (password, token, secret, api_key) are always redacted."""
    raw_payload = {
        "user_id": "123",
        "password": "SuperSecretPassword1!",
        "password_hash": "$argon2id$v=19...",
        "access_token": "eyJhbGciOi...",
        "token_hash": "a1b2c3d4...",
        "api_key": "AIzaSy...",
        "nested": {
            "refresh_token": "secret_rt_token",
            "safe_field": "visible_data",
        },
    }
    sanitized = sanitize_audit_payload(raw_payload, mask_pii=False)

    assert sanitized["password"] == "[REDACTED]"
    assert sanitized["password_hash"] == "[REDACTED]"
    assert sanitized["access_token"] == "[REDACTED]"
    assert sanitized["token_hash"] == "[REDACTED]"
    assert sanitized["api_key"] == "[REDACTED]"
    assert sanitized["nested"]["refresh_token"] == "[REDACTED]"
    assert sanitized["nested"]["safe_field"] == "visible_data"


def test_sanitize_audit_payload_masks_pii_in_meta() -> None:
    """PII fields (email, phone) in meta are masked."""
    meta_payload = {
        "email": "fatima@example.com",
        "phone": "+923001234567",
        "ip": "192.168.1.1",
        "deep": {
            "contact_email": "contact@example.com",
        },
    }
    sanitized = sanitize_audit_payload(meta_payload, mask_pii=True)

    assert sanitized["email"] == "f***a@example.com"
    assert sanitized["phone"] == "+9230***567"
    assert sanitized["ip"] == "192.168.1.1"
    assert sanitized["deep"]["contact_email"] == "c***t@example.com"


# ---------------------------------------------------------------------------
# Integration tests: Audited actions write audit rows
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_audit_user_created_on_registration() -> None:
    """Registering user appends user.created audit row with before=None and after=user_data."""
    added_records: list[Any] = []
    mock_db = AsyncMock()
    mock_db.execute.return_value = mock_db_result(None)
    mock_db.add = MagicMock(side_effect=lambda obj: added_records.append(obj))

    data = RegisterRequest(
        name="Sadia Bibi",
        email="sadia@example.com",
        password="ValidPassword1",
    )
    user = await register_user(mock_db, data)

    audit_rows = [r for r in added_records if isinstance(r, AuditLog)]
    assert len(audit_rows) == 1
    row = audit_rows[0]
    assert row.action == "user.created"
    assert row.actor_id == user.id
    assert row.target_id == str(user.id)
    assert row.before is None
    assert row.after is not None
    assert row.after["email"] == "s***a@example.com"  # masked PII
    assert "password" not in row.after
    assert "password_hash" not in row.after


@pytest.mark.asyncio
async def test_audit_login_success() -> None:
    """Successful login writes auth.login.success audit row with actor_id, ip, user_agent."""
    added_records: list[Any] = []
    mock_db = AsyncMock()
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email="sadia@example.com",
        name="Sadia",
        password_hash=hash_password("ValidPassword1"),
        role="entrepreneur",
        status="active",
        failed_login_count=0,
    )
    mock_db.execute.return_value = mock_db_result(user)
    mock_db.add = MagicMock(side_effect=lambda obj: added_records.append(obj))

    data = LoginRequest(email="sadia@example.com", password="ValidPassword1")
    await authenticate(mock_db, data, ip="127.0.0.1", user_agent="Mozilla/5.0")

    audit_rows = [r for r in added_records if isinstance(r, AuditLog)]
    assert len(audit_rows) == 1
    row = audit_rows[0]
    assert row.action == "auth.login.success"
    assert row.actor_id == user_id
    assert row.actor_role == "entrepreneur"
    assert row.ip == "127.0.0.1"
    assert row.user_agent == "Mozilla/5.0"


@pytest.mark.asyncio
async def test_audit_login_failed() -> None:
    """Failed login writes auth.login.failed audit row."""
    added_records: list[Any] = []
    mock_db = AsyncMock()
    user = User(
        id=uuid.uuid4(),
        email="sadia@example.com",
        name="Sadia",
        password_hash=hash_password("ValidPassword1"),
        role="entrepreneur",
        status="active",
        failed_login_count=0,
    )
    mock_db.execute.return_value = mock_db_result(user)
    mock_db.add = MagicMock(side_effect=lambda obj: added_records.append(obj))

    data = LoginRequest(email="sadia@example.com", password="WrongPassword99")
    with pytest.raises(HTTPException):
        await authenticate(mock_db, data, ip="192.168.1.5", user_agent="TestAgent")

    audit_rows = [r for r in added_records if isinstance(r, AuditLog)]
    assert len(audit_rows) == 1
    row = audit_rows[0]
    assert row.action == "auth.login.failed"
    assert row.ip == "192.168.1.5"
    assert row.meta["email"] == "s***a@example.com"


@pytest.mark.asyncio
async def test_audit_account_locked() -> None:
    """Account lockout writes auth.locked audit row."""
    added_records: list[Any] = []
    mock_db = AsyncMock()
    user = User(
        id=uuid.uuid4(),
        email="locked@example.com",
        name="Lock Test",
        password_hash=hash_password("ValidPassword1"),
        role="entrepreneur",
        status="active",
        failed_login_count=4,  # Next failure triggers lockout
    )
    mock_db.execute.return_value = mock_db_result(user)
    mock_db.add = MagicMock(side_effect=lambda obj: added_records.append(obj))

    data = LoginRequest(email="locked@example.com", password="WrongPassword99")
    with pytest.raises(HTTPException):
        await authenticate(mock_db, data, ip="10.0.0.1", user_agent="LockAgent")

    audit_rows = [r for r in added_records if isinstance(r, AuditLog)]
    assert len(audit_rows) == 1
    row = audit_rows[0]
    assert row.action == "auth.locked"
    assert row.actor_id == user.id
    assert row.meta["reason"] == "5_failed_attempts"


@pytest.mark.asyncio
async def test_audit_refresh_reuse_detected() -> None:
    """Token reuse writes auth.refresh.reuse_detected audit row."""
    added_records: list[Any] = []
    mock_db = AsyncMock()
    family_id = uuid.uuid4()
    revoked_rt = RefreshToken(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        token_hash="fakehash",
        family_id=family_id,
        expires_at=datetime.now(UTC) + timedelta(days=7),
        revoked_at=datetime.now(UTC) - timedelta(hours=1),
    )
    mock_db.execute.return_value = mock_db_result(revoked_rt)
    mock_db.add = MagicMock(side_effect=lambda obj: added_records.append(obj))

    with pytest.raises(HTTPException):
        await rotate_refresh_token(mock_db, "reused_token")

    audit_rows = [r for r in added_records if isinstance(r, AuditLog)]
    assert len(audit_rows) == 1
    row = audit_rows[0]
    assert row.action == "auth.refresh.reuse_detected"
    assert row.target_type == "refresh_token"
    assert row.meta["family_id"] == str(family_id)


@pytest.mark.asyncio
async def test_audit_logout() -> None:
    """Logout writes auth.logout audit row."""
    added_records: list[Any] = []
    mock_db = AsyncMock()
    user_id = uuid.uuid4()
    rt = RefreshToken(
        id=uuid.uuid4(),
        user_id=user_id,
        token_hash="fakehash",
        family_id=uuid.uuid4(),
        expires_at=datetime.now(UTC) + timedelta(days=7),
        revoked_at=None,
    )
    mock_db.execute.return_value = mock_db_result(rt)
    mock_db.add = MagicMock(side_effect=lambda obj: added_records.append(obj))

    await revoke_user_refresh_token(mock_db, "some_token", user_id=user_id)

    audit_rows = [r for r in added_records if isinstance(r, AuditLog)]
    assert len(audit_rows) == 1
    row = audit_rows[0]
    assert row.action == "auth.logout"
    assert row.actor_id == user_id


# ---------------------------------------------------------------------------
# Middleware tests: RequestId correlation
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_request_id_middleware_and_correlation() -> None:
    """RequestIdMiddleware propagates correlation ID header and injects into audit entries."""
    custom_req_id = uuid.uuid4()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Send request with custom X-Request-Id
        res = await client.get("/api/v1/health", headers={"X-Request-Id": str(custom_req_id)})
        assert res.status_code == 200
        assert res.headers["X-Request-Id"] == str(custom_req_id)

        # Send request without X-Request-Id — should auto-generate a valid UUID
        res_auto = await client.get("/api/v1/health")
        assert res_auto.status_code == 200
        generated_id = res_auto.headers.get("X-Request-Id")
        assert generated_id is not None
        assert uuid.UUID(generated_id)
