"""Pydantic schemas for authentication and user payloads."""

import re
import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    """F-001 Signup request payload."""

    name: str = Field(min_length=2, max_length=100, description="User full name")
    email: EmailStr = Field(description="Unique email address")
    password: str = Field(
        min_length=8,
        description="Password with min 8 chars, 1 uppercase, 1 digit",
    )
    language: Literal["en", "ur", "roman_ur"] = Field(
        default="roman_ur",
        description="Preferred interface and content language",
    )
    invite_code: str | None = Field(
        default=None,
        description="Optional cohort invite code linking to a program",
    )

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, value: str) -> str:
        """Validate minimum 8 characters, at least 1 uppercase letter and 1 digit."""
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"\d", value):
            raise ValueError("Password must contain at least one digit")
        return value


class LoginRequest(BaseModel):
    """F-002 Login request payload."""

    email: EmailStr = Field(description="Registered email address")
    password: str = Field(min_length=1, description="Account password")


class UserResponse(BaseModel):
    """Public user profile response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    name: str
    role: str
    status: str
    language: str = "roman_ur"
    force_password_change: bool = False
    program_id: uuid.UUID | None = None
    created_at: datetime | None = None

    @field_validator("force_password_change", mode="before")
    @classmethod
    def coerce_force_password_change(cls, v: Any) -> bool:
        return bool(v) if v is not None else False


class TokenResponse(BaseModel):
    """Login and refresh token response."""

    access_token: str
    token_type: str = "bearer"  # noqa: S105
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    """Optional request body when refresh token is passed in JSON instead of cookie."""

    refresh_token: str | None = None


class MentorApplyRequest(BaseModel):
    """F-040 Mentor application request payload."""

    name: str = Field(min_length=2, max_length=100, description="Mentor full name")
    email: EmailStr = Field(description="Unique email address")
    password: str = Field(
        min_length=8,
        description="Password with min 8 chars, 1 uppercase, 1 digit",
    )
    city: str = Field(min_length=2, max_length=100, description="City of residence")
    bio: str = Field(min_length=10, max_length=2000, description="Professional bio and experience")
    niches: list[str] = Field(
        min_length=1, max_length=10, description="Industry and expertise niches"
    )
    languages: list[str] = Field(
        default=["Urdu", "English"],
        min_length=1,
        max_length=5,
        description="Languages spoken by the mentor",
    )
    avatar_url: str | None = Field(
        default=None, max_length=500, description="Optional profile photo URL"
    )

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, value: str) -> str:
        """Validate minimum 8 characters, at least 1 uppercase letter and 1 digit."""
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"\d", value):
            raise ValueError("Password must contain at least one digit")
        return value


class MentorApplyResponse(BaseModel):
    """F-040 Mentor application response payload."""

    user_id: uuid.UUID
    mentor_id: uuid.UUID
    name: str
    email: str
    status: str = "pending"
    message: str = (
        "Mentor application submitted successfully. Your profile is pending Super Admin review."
    )
