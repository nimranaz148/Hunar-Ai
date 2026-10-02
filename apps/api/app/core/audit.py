"""Append-only audit trail helper with sensitive data masking."""

import re
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.middleware import request_id_ctx
from app.models.audit import AuditLog

# Regex patterns for identifying sensitive strings
EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")
PHONE_REGEX = re.compile(r"^\+?[0-9]{7,15}$")

# Keys whose values must never be stored anywhere in audit logs
FORBIDDEN_KEY_PATTERNS = ("password", "token", "secret", "api_key", "auth_header", "hash")


def mask_email(email: str) -> str:
    """Mask email address (e.g. fatima.bibi@example.com -> f***i@example.com)."""
    clean = email.strip()
    if "@" not in clean:
        return "[MASKED]"
    user_part, domain = clean.split("@", 1)
    if len(user_part) <= 2:
        masked_user = user_part[0] + "***" if user_part else "***"
    else:
        masked_user = f"{user_part[0]}***{user_part[-1]}"
    return f"{masked_user}@{domain}"


def mask_phone(phone: str) -> str:
    """Mask phone number (e.g. +923001234567 -> +92300***567)."""
    clean = phone.strip()
    if len(clean) <= 6:
        return "[MASKED]"
    return f"{clean[:5]}***{clean[-3:]}"


def sanitize_audit_payload(obj: Any, mask_pii: bool = False) -> Any:
    """Recursively scrub forbidden secrets and optionally mask PII (email/phone)."""
    if isinstance(obj, dict):
        sanitized: dict[str, Any] = {}
        for key, value in obj.items():
            key_lower = str(key).lower()

            # Always redact credentials and tokens
            if any(forbidden in key_lower for forbidden in FORBIDDEN_KEY_PATTERNS):
                sanitized[key] = "[REDACTED]"
                continue

            # Mask PII in meta and general dictionaries
            if any(e in key_lower for e in ("email", "mail")):
                if isinstance(value, str) and "@" in value:
                    sanitized[key] = mask_email(value)
                    continue

            if any(p in key_lower for p in ("phone", "mobile", "cell")):
                if isinstance(value, str):
                    sanitized[key] = mask_phone(value)
                    continue

            sanitized[key] = sanitize_audit_payload(value, mask_pii=mask_pii)
        return sanitized

    if isinstance(obj, list):
        return [sanitize_audit_payload(item, mask_pii=mask_pii) for item in obj]

    if isinstance(obj, str):
        if mask_pii and EMAIL_REGEX.match(obj.strip()):
            return mask_email(obj)
        if mask_pii and PHONE_REGEX.match(obj.strip()):
            return mask_phone(obj)

    return obj


async def record_audit_log(
    db: AsyncSession,
    action: str,
    actor_id: uuid.UUID | None = None,
    actor_role: str | None = None,
    target_type: str | None = None,
    target_id: str | None = None,
    program_id: uuid.UUID | None = None,
    ip: str | None = None,
    user_agent: str | None = None,
    request_id: uuid.UUID | None = None,
    before: dict[str, Any] | None = None,
    after: dict[str, Any] | None = None,
    meta: dict[str, Any] | None = None,
) -> AuditLog:
    """Create and append an immutable audit log entry with PII masking."""
    effective_req_id = request_id or request_id_ctx.get(None)

    clean_before = sanitize_audit_payload(before, mask_pii=False) if before else None
    clean_after = sanitize_audit_payload(after, mask_pii=False) if after else None
    clean_meta = sanitize_audit_payload(meta, mask_pii=True) if meta else {}

    audit_entry = AuditLog(
        at=datetime.now(UTC),
        request_id=effective_req_id,
        actor_id=actor_id,
        actor_role=actor_role,
        action=action,
        target_type=target_type,
        target_id=str(target_id) if target_id is not None else None,
        program_id=program_id,
        ip=ip,
        user_agent=user_agent,
        before=clean_before,
        after=clean_after,
        meta=clean_meta,
    )
    db.add(audit_entry)
    return audit_entry
