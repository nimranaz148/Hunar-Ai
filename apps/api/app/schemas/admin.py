"""Pydantic schemas for Super Admin endpoints (Tasks 12-17 / PRD §14, §30, §36)."""

import re
import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ---------------------------------------------------------------------------
# Task 12 — User Management (F-031)
# ---------------------------------------------------------------------------
class AdminUserResponse(BaseModel):
    """Admin view of a user record."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    name: str
    role: str
    status: str
    language: str | None = "roman_ur"
    force_password_change: bool = False
    program_id: uuid.UUID | None = None
    created_at: datetime | None = None

    @field_validator("force_password_change", mode="before")
    @classmethod
    def coerce_force_password_change(cls, v: Any) -> bool:
        return bool(v) if v is not None else False


class AdminCreateUserRequest(BaseModel):
    """Admin request to create a user with a generated temporary password."""

    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    role: Literal["entrepreneur", "mentor", "super_admin"]
    language: Literal["en", "ur", "roman_ur"] = "roman_ur"
    program_id: uuid.UUID | None = None


class AdminCreateUserResponse(BaseModel):
    """Admin response including temporary password for onboarding."""

    user: AdminUserResponse
    temporary_password: str


class AdminUpdateUserRequest(BaseModel):
    """Admin request to modify user role or status."""

    role: Literal["entrepreneur", "mentor", "super_admin"] | None = None
    status: Literal["active", "suspended", "pending"] | None = None
    name: str | None = Field(default=None, min_length=2, max_length=100)


class AdminResetPasswordResponse(BaseModel):
    """Response when admin resets a user's password."""

    user_id: uuid.UUID
    temporary_password: str


# ---------------------------------------------------------------------------
# Task 13 — Audit Log Viewer (F-032)
# ---------------------------------------------------------------------------
class AdminAuditLogResponse(BaseModel):
    """Admin view of an immutable audit log entry."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    actor_id: uuid.UUID | None = None
    action: str
    target_type: str | None = None
    target_id: str | None = None
    ip_address: str | None = None
    meta: dict[str, Any] | None = None


# ---------------------------------------------------------------------------
# Tasks 14 & 15 — Agent Run Explorer & Detail (F-033, F-034)
# ---------------------------------------------------------------------------
class AdminAgentRunResponse(BaseModel):
    """Admin summary of an agent workflow run."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    trace_id: str | None = None
    workflow: str
    user_id: uuid.UUID | None = None
    business_id: uuid.UUID | None = None
    status: str
    input_summary: str | None = None
    output_summary: str | None = None
    error: str | None = None
    started_at: datetime | None = None
    ended_at: datetime | None = None
    created_at: datetime


class AdminSpanResponse(BaseModel):
    """Execution span item in the run timeline tree."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    trace_id: str
    span_id: str
    parent_id: str | None = None
    span_type: str
    started_at: datetime | None = None
    ended_at: datetime | None = None
    data: dict[str, Any] | None = None
    error: dict[str, Any] | None = None


class AdminAgentRunDetailResponse(BaseModel):
    """Detailed view of an agent workflow run with all child spans."""

    run: AdminAgentRunResponse
    spans: list[AdminSpanResponse]


# ---------------------------------------------------------------------------
# Task 16 — System Settings & Kill Switch (F-035)
# ---------------------------------------------------------------------------
class SettingsResponse(BaseModel):
    """System-wide operational thresholds and flags."""

    agent_max_concurrent: int = 5
    agent_per_user_daily_limit: int = 5
    agent_kill_switch: bool = False
    rate_limit_per_minute: int = 100


class UpdateSettingsRequest(BaseModel):
    """Request to update system operational settings."""

    agent_max_concurrent: int | None = Field(default=None, ge=1, le=50)
    agent_per_user_daily_limit: int | None = Field(default=None, ge=1, le=100)
    agent_kill_switch: bool | None = None
    rate_limit_per_minute: int | None = Field(default=None, ge=10, le=10000)


class KillSwitchResponse(BaseModel):
    """Current status of the emergency agent kill switch."""

    agent_kill_switch: bool


# ---------------------------------------------------------------------------
# Task 17 — Change Password (F-039)
# ---------------------------------------------------------------------------
class ChangePasswordRequest(BaseModel):
    """User password change request."""

    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_new_password_complexity(cls, value: str) -> str:
        """Validate min 8 chars, 1 uppercase, 1 digit."""
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"\d", value):
            raise ValueError("Password must contain at least one digit")
        return value
