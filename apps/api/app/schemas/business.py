"""Pydantic schemas for Business Profile view and edit (PRD §5.2 F-004, §13.2)."""

import uuid
from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.onboarding import ALLOWED_NICHES


class BusinessResponse(BaseModel):
    """Business profile details response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_id: uuid.UUID
    program_id: uuid.UUID | None = None
    name: str
    niche: str
    city: str
    area: str | None = None
    budget_pkr: int
    hours_per_week: int
    tone: str
    languages: list[str]
    platforms: list[str]
    target_customer: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime | None = None


class UpdateBusinessRequest(BaseModel):
    """Payload for updating business profile attributes (F-004)."""

    name: str | None = Field(default=None, min_length=2, max_length=200)
    niche: str | None = Field(default=None)
    city: str | None = Field(default=None, min_length=2, max_length=100)
    area: str | None = Field(default=None, max_length=100)
    budget_pkr: int | None = Field(default=None, ge=1000, le=10000000)
    hours_per_week: int | None = Field(default=None, ge=1, le=80)
    tone: str | None = Field(default=None)
    languages: list[str] | None = Field(default=None)
    platforms: list[str] | None = Field(default=None)
    target_customer: str | None = Field(default=None, max_length=500)

    @field_validator("niche")
    @classmethod
    def validate_niche(cls, v: str | None) -> str | None:
        if v is not None:
            cleaned = v.strip().lower()
            if cleaned not in ALLOWED_NICHES:
                raise ValueError(f"Niche must be one of: {', '.join(sorted(ALLOWED_NICHES))}")
            return cleaned
        return v
