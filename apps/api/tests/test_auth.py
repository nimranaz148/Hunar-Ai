"""Tests for authentication, authorization, token rotation, and lockout logic."""

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import jwt
import pytest
from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient

from app.auth.dependencies import get_current_user, require_role
from app.auth.jwt import (
    create_access_token,
    decode_access_token,
    generate_refresh_token,
    hash_token,
)
from app.auth.password import hash_password, verify_password
from app.core.database import get_db
from app.main import app
from app.models.program import Program
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


def mock_db_results(side_effects: list[Any]) -> list[MagicMock]:
    """Create a list of mock SQLAlchemy Result objects for sequential queries."""
    results = []
    for item in side_effects:
        res = MagicMock()
        res.scalar_one_or_none.return_value = item
        results.append(res)
    return results


# ---------------------------------------------------------------------------
# Unit tests: Password hashing (Argon2id)
# ---------------------------------------------------------------------------


def test_password_hashing_and_verification() -> None:
    """Argon2id hashes password securely and verifies correct password."""
    raw_pw = "SecurePass123"
    hashed = hash_password(raw_pw)
    assert hashed != raw_pw
    assert hashed.startswith("$argon2")
    assert verify_password(raw_pw, hashed) is True
    assert verify_password("WrongPassword1", hashed) is False


# ---------------------------------------------------------------------------
# Unit tests: JWT and Refresh Token operations
# ---------------------------------------------------------------------------


def test_jwt_create_and_decode() -> None:
    """Access token contains sub, role, email, exp and decodes accurately."""
    user_id = uuid.uuid4()
    token = create_access_token(user_id=user_id, role="entrepreneur", email="fatima@example.com")
    payload = decode_access_token(token)
    assert payload["sub"] == str(user_id)
    assert payload["role"] == "entrepreneur"
    assert payload["email"] == "fatima@example.com"
    assert payload["type"] == "access"


def test_jwt_expired_raises_error() -> None:
    """Expired access token fails decoding with PyJWTError."""
    user_id = uuid.uuid4()
    expired_token = create_access_token(
        user_id=user_id,
        role="entrepreneur",
        email="fatima@example.com",
        expires_delta=timedelta(seconds=-10),
    )
    with pytest.raises(jwt.PyJWTError):
        decode_access_token(expired_token)


def test_generate_refresh_token() -> None:
    """Refresh tokens have cryptographically random string, sha256 hash, and future expiry."""
    raw, token_hash, expires = generate_refresh_token()
    assert len(raw) > 30
    assert hash_token(raw) == token_hash
    assert expires > datetime.now(UTC)


# ---------------------------------------------------------------------------
# Schema validation tests
# ---------------------------------------------------------------------------


def test_register_request_password_validation() -> None:
    """Password must be >= 8 chars and contain uppercase and digit."""
    # Valid
    req = RegisterRequest(
        name="Fatima Bibi",
        email="fatima@example.com",
        password="ValidPassword1",
    )
    assert req.password == "ValidPassword1"

    # Missing uppercase
    with pytest.raises(ValueError, match="uppercase"):
        RegisterRequest(
            name="Fatima Bibi",
            email="fatima@example.com",
            password="lowercaseonly1",
        )

    # Missing digit
    with pytest.raises(ValueError, match="digit"):
        RegisterRequest(
            name="Fatima Bibi",
            email="fatima@example.com",
            password="NoDigitsHere",
        )


# ---------------------------------------------------------------------------
# Service tests: Registration, Auth, Lockout, and Token Rotation
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_register_user_success() -> None:
    """Registering user creates an active entrepreneur account with hashed password."""
    mock_db = AsyncMock()
    mock_db.execute.return_value = mock_db_result(None)

    data = RegisterRequest(
        name="Amina Khan",
        email="amina@example.com",
        password="StrongPassword123",
        language="roman_ur",
    )
    user = await register_user(mock_db, data)
    assert user.name == "Amina Khan"
    assert user.email == "amina@example.com"
    assert user.role == "entrepreneur"
    assert user.status == "active"
    assert verify_password("StrongPassword123", user.password_hash) is True


@pytest.mark.asyncio
async def test_register_user_duplicate_email_raises_409() -> None:
    """Duplicate email raises 409 conflict."""
    mock_db = AsyncMock()
    existing_user = User(
        id=uuid.uuid4(),
        email="amina@example.com",
        name="Amina",
        password_hash="hashed",
        role="entrepreneur",
        status="active",
    )
    mock_db.execute.return_value = mock_db_result(existing_user)

    data = RegisterRequest(
        name="Amina Khan",
        email="amina@example.com",
        password="StrongPassword123",
    )
    with pytest.raises(HTTPException) as exc_info:
        await register_user(mock_db, data)
    assert exc_info.value.status_code == 409


@pytest.mark.asyncio
async def test_register_user_with_valid_invite_code() -> None:
    """Valid invite code links user to the program."""
    mock_db = AsyncMock()
    prog_id = uuid.uuid4()
    program = Program(id=prog_id, name="Lahore Batch 1", invite_code="LAHORE2026")

    # First call checks duplicate email (None), second call checks invite code (program)
    mock_db.execute.side_effect = mock_db_results([None, program])

    data = RegisterRequest(
        name="Zainab Ali",
        email="zainab@example.com",
        password="StrongPassword123",
        invite_code="LAHORE2026",
    )
    user = await register_user(mock_db, data)
    assert user.program_id == prog_id


@pytest.mark.asyncio
async def test_authenticate_success() -> None:
    """Authenticating with correct credentials resets fail count and issues tokens."""
    mock_db = AsyncMock()
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email="zainab@example.com",
        name="Zainab",
        password_hash=hash_password("CorrectPass1"),
        role="entrepreneur",
        status="active",
        failed_login_count=2,
    )
    mock_db.execute.return_value = mock_db_result(user)

    data = LoginRequest(email="zainab@example.com", password="CorrectPass1")
    authenticated_user, access_token, raw_rt = await authenticate(mock_db, data)
    assert authenticated_user.id == user_id
    assert authenticated_user.failed_login_count == 0
    assert access_token is not None
    assert len(raw_rt) > 20


@pytest.mark.asyncio
async def test_authenticate_wrong_password_lockout_after_5_attempts() -> None:
    """Failed login increments failure count; 5th failure sets 15-min lockout."""
    mock_db = AsyncMock()
    user = User(
        id=uuid.uuid4(),
        email="locked@example.com",
        name="Test User",
        password_hash=hash_password("CorrectPass1"),
        role="entrepreneur",
        status="active",
        failed_login_count=4,  # Next failure will trigger lockout
        locked_until=None,
    )
    mock_db.execute.return_value = mock_db_result(user)

    data = LoginRequest(email="locked@example.com", password="WrongPassword1")
    with pytest.raises(HTTPException) as exc_info:
        await authenticate(mock_db, data)
    assert exc_info.value.status_code == 401
    assert "Account locked" in str(exc_info.value.detail)
    assert user.locked_until is not None


@pytest.mark.asyncio
async def test_refresh_token_rotation() -> None:
    """Valid refresh token rotates to new pair and invalidates old token."""
    mock_db = AsyncMock()
    user_id = uuid.uuid4()
    family_id = uuid.uuid4()
    old_rt_id = uuid.uuid4()

    user = User(
        id=user_id,
        email="user@example.com",
        name="User",
        password_hash="hash",
        role="entrepreneur",
        status="active",
    )
    old_rt = RefreshToken(
        id=old_rt_id,
        user_id=user_id,
        token_hash="fakehash",
        family_id=family_id,
        expires_at=datetime.now(UTC) + timedelta(days=7),
        revoked_at=None,
    )

    mock_db.execute.side_effect = mock_db_results([old_rt, user])

    refreshed_user, new_access_token, new_raw_rt = await rotate_refresh_token(
        mock_db, "some_token"
    )
    assert refreshed_user.id == user_id
    assert old_rt.revoked_at is not None
    assert old_rt.replaced_by is not None
    assert new_access_token is not None
    assert new_raw_rt is not None


@pytest.mark.asyncio
async def test_refresh_token_reuse_detection_revokes_family() -> None:
    """Reusing an already-revoked refresh token revokes entire token family."""
    mock_db = AsyncMock()
    family_id = uuid.uuid4()

    revoked_rt = RefreshToken(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        token_hash="fakehash",
        family_id=family_id,
        expires_at=datetime.now(UTC) + timedelta(days=7),
        revoked_at=datetime.now(UTC) - timedelta(hours=1),  # already revoked!
    )
    mock_db.execute.return_value = mock_db_result(revoked_rt)

    with pytest.raises(HTTPException) as exc_info:
        await rotate_refresh_token(mock_db, "stolen_token")
    assert exc_info.value.status_code == 401
    assert "Token reuse detected" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_revoke_refresh_token_logout() -> None:
    """Logout revokes the provided refresh token."""
    mock_db = AsyncMock()
    rt = RefreshToken(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        token_hash="fakehash",
        family_id=uuid.uuid4(),
        expires_at=datetime.now(UTC) + timedelta(days=7),
        revoked_at=None,
    )
    mock_db.execute.return_value = mock_db_result(rt)
    await revoke_user_refresh_token(mock_db, "raw_token")
    assert rt.revoked_at is not None


# ---------------------------------------------------------------------------
# Authorization dependency tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_require_role_enforcement() -> None:
    """require_role allows permitted roles and forbids unauthorized roles with 403."""
    admin_checker = require_role("super_admin")
    entrepreneur_user = User(
        id=uuid.uuid4(),
        email="entrepreneur@example.com",
        name="Entrepreneur",
        password_hash="hash",
        role="entrepreneur",
        status="active",
    )
    super_admin_user = User(
        id=uuid.uuid4(),
        email="admin@example.com",
        name="Admin",
        password_hash="hash",
        role="super_admin",
        status="active",
    )

    # Super admin passes
    passed = await admin_checker(current_user=super_admin_user)
    assert passed.role == "super_admin"

    # Entrepreneur fails with 403
    with pytest.raises(HTTPException) as exc_info:
        await admin_checker(current_user=entrepreneur_user)
    assert exc_info.value.status_code == 403


# ---------------------------------------------------------------------------
# Route integration tests via HTTP client
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_api_register_endpoint() -> None:
    """POST /api/v1/auth/register creates user and returns 201."""
    mock_db = AsyncMock()
    mock_db.execute.return_value = mock_db_result(None)

    async def override_get_db() -> AsyncMock:
        return mock_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            payload = {
                "name": "Maryam Bibi",
                "email": "maryam@example.com",
                "password": "Password123",
                "language": "roman_ur",
            }
            res = await client.post("/api/v1/auth/register", json=payload)
            assert res.status_code == 201
            body = res.json()
            assert body["email"] == "maryam@example.com"
            assert body["role"] == "entrepreneur"
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_api_login_endpoint() -> None:
    """POST /api/v1/auth/login returns token and sets refresh cookie."""
    mock_db = AsyncMock()
    user = User(
        id=uuid.uuid4(),
        email="maryam@example.com",
        name="Maryam",
        password_hash=hash_password("Password123"),
        role="entrepreneur",
        status="active",
        language="roman_ur",
        created_at=datetime.now(UTC),
    )
    mock_db.execute.return_value = mock_db_result(user)

    async def override_get_db() -> AsyncMock:
        return mock_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            payload = {
                "email": "maryam@example.com",
                "password": "Password123",
            }
            res = await client.post("/api/v1/auth/login", json=payload)
            assert res.status_code == 200
            data = res.json()
            assert "access_token" in data
            assert data["token_type"] == "bearer"
            assert "refresh_token" in res.cookies
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_api_me_endpoint() -> None:
    """GET /api/v1/auth/me returns current user profile when authenticated."""
    user = User(
        id=uuid.uuid4(),
        email="maryam@example.com",
        name="Maryam Bibi",
        role="entrepreneur",
        status="active",
        language="roman_ur",
        password_hash="hash",
        created_at=datetime.now(UTC),
    )

    async def override_get_current_user() -> User:
        return user

    app.dependency_overrides[get_current_user] = override_get_current_user
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.get("/api/v1/auth/me")
            assert res.status_code == 200
            data = res.json()
            assert data["email"] == "maryam@example.com"
            assert data["name"] == "Maryam Bibi"
    finally:
        app.dependency_overrides.pop(get_current_user, None)
