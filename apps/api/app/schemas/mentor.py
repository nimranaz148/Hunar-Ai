"""Pydantic schemas for Mentors and Mentor Services (PRD §5 F-018, F-021, F-022, §13.2)."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MentorSummaryResponse(BaseModel):
    """Public/Browse summary of a mentor profile."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    city: str
    bio: str
    niches: list[str]
    languages: list[str]
    avatar_url: str | None = None
    rating: float
    review_count: int
    status: str


class MentorServiceItemResponse(BaseModel):
    """Item in the mentor services catalog/list view (PRD §5 F-018)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    mentor_id: uuid.UUID
    mentor_name: str
    mentor_avatar_url: str | None = None
    mentor_city: str
    mentor_rating: float
    mentor_review_count: int
    title: str
    description: str
    niche: str
    type: str
    price_pkr: int = Field(..., gt=0, description="Price in PKR")
    duration_min: int = Field(..., ge=15, le=180, description="Duration in minutes")
    active: bool
    created_at: datetime


class MentorServiceDetailResponse(MentorServiceItemResponse):
    """Full detail view for a specific mentor service."""

    mentor_bio: str
    mentor_languages: list[str]
    mentor_niches: list[str]
