"""Pydantic schemas for Onboarding and Business Profile (PRD §5.2 F-003, F-004, §36.11)."""

import uuid
from datetime import UTC, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

ALLOWED_NICHES = {
    "food",
    "stitching_fashion",
    "beauty",
    "handmade",
    "tutoring",
    "digital",
    "other",
}


class BusinessProfile(BaseModel):
    """Structured business profile extracted by the Intake Agent (PRD §36.11)."""

    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., min_length=2, max_length=200, description="Business name")
    niche: str = Field(..., description="Business niche from allowed categories")
    city: str = Field(..., min_length=2, max_length=100, description="City of operation")
    area: str | None = Field(default=None, max_length=100, description="Neighborhood or locality")
    budget_pkr: int = Field(..., ge=1000, le=10000000, description="Monthly budget in PKR")
    hours_per_week: int = Field(
        default=20, ge=1, le=80, description="Available working hours per week"
    )
    tone: str = Field(default="friendly", description="Brand voice / tone")
    languages: list[str] = Field(
        default_factory=lambda: ["roman_ur", "en"], description="Content languages"
    )
    platforms: list[str] = Field(
        default_factory=lambda: ["instagram", "facebook"], description="Target platforms"
    )
    target_customer: str | None = Field(
        default=None, max_length=500, description="Target customer description"
    )

    @field_validator("niche")
    @classmethod
    def validate_niche(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if cleaned not in ALLOWED_NICHES:
            raise ValueError(f"Niche must be one of: {', '.join(sorted(ALLOWED_NICHES))}")
        return cleaned


class ChatMessageRequest(BaseModel):
    """Request payload for sending a chat message to the onboarding agent (F-003)."""

    message: str = Field(..., min_length=1, max_length=2000, description="User's chat message")


class OnboardingMessageItem(BaseModel):
    """A single chat message in the onboarding conversation."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    role: Literal["user", "assistant", "system"]
    content: str
    meta: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class OnboardingMessagesResponse(BaseModel):
    """History of onboarding messages and current onboarding status."""

    messages: list[OnboardingMessageItem]
    is_profile_complete: bool = False
    business_id: uuid.UUID | None = None


class ChatMessageResponse(BaseModel):
    """Response payload for synchronous chat interaction."""

    reply: str
    is_profile_complete: bool = False
    business_id: uuid.UUID | None = None
