"""JWT and refresh token creation and verification utilities."""

import hashlib
import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt

from app.core.config import settings


def create_access_token(
    user_id: uuid.UUID | str,
    role: str,
    email: str,
    expires_delta: timedelta | None = None,
) -> str:
    """Create a signed short-lived JWT access token."""
    now = datetime.now(UTC)
    if expires_delta is not None:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload: dict[str, Any] = {
        "sub": str(user_id),
        "role": role,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access",
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT access token.

    Raises jwt.PyJWTError subclasses on invalid or expired token.
    """
    return jwt.decode(
        token,
        settings.JWT_SECRET,
        algorithms=[settings.JWT_ALGORITHM],
        options={"require": ["sub", "exp", "iat"]},
    )


def hash_token(raw_token: str) -> str:
    """Hash a token string using SHA-256 for secure storage."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def generate_refresh_token() -> tuple[str, str, datetime]:
    """Generate a cryptographically secure refresh token and its hash.

    Returns:
        tuple[raw_token, token_hash, expires_at]
    """
    raw_token = secrets.token_urlsafe(48)
    token_hash = hash_token(raw_token)
    expires_at = datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return raw_token, token_hash, expires_at
