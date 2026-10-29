"""Pydantic schemas for Feature Flags (Task 53 / F-036)."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FeatureFlagResponse(BaseModel):
    """Admin view of a system feature flag."""

    key: str = Field(..., description="Unique technical identifier for the flag")
    name: str = Field(..., description="Human-readable title")
    description: str = Field(..., description="Detailed explanation of functionality controlled")
    is_enabled: bool = Field(..., description="Whether the feature is currently active")
    updated_at: datetime | None = Field(default=None, description="Last modification timestamp")
    updated_by: uuid.UUID | None = Field(
        default=None, description="Admin user who last modified flag"
    )

    model_config = ConfigDict(from_attributes=True)


class FeatureFlagUpdateItem(BaseModel):
    """Single flag update instruction."""

    key: str = Field(..., min_length=1, max_length=100)
    is_enabled: bool


class UpdateFeatureFlagsRequest(BaseModel):
    """Payload to update one or more feature flags."""

    flags: list[FeatureFlagUpdateItem] = Field(..., min_length=1)
