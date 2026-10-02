"""Content domain Pydantic schemas for Content Outline Approval (F-010 / PRD §36.15, §36.16)."""

import datetime as dt
import uuid
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class PillarItem(BaseModel):
    """Content pillar definition."""

    name: str = Field(..., description="Pillar slug/name e.g. behind_the_scenes")
    description: str = Field(..., description="Description of pillar")
    target_percentage: int = Field(..., ge=0, le=100, description="Target percentage mix")


class WeeklyThemeItem(BaseModel):
    """Weekly strategic focus."""

    week: int = Field(..., ge=1, le=4, description="Week number (1-4)")
    theme: str = Field(..., description="Theme headline")
    objective: str = Field(..., description="Goal/objective of the week")


class DayBriefItem(BaseModel):
    """Single day post outline brief."""

    day: int = Field(..., ge=1, le=30, description="Day number (1-30)")
    format: str = Field(..., description="Format e.g. reel, carousel, static, story")
    pillar: str = Field(..., description="Pillar category")
    goal: str = Field(..., description="awareness, engagement, leads, sales")
    key_idea: str = Field(..., description="Core angle or idea for the post")


class ContentCalendarResponse(BaseModel):
    """Content calendar outline response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    business_id: uuid.UUID
    status: str
    pillars: list[PillarItem] = Field(default_factory=list)
    weekly_themes: list[WeeklyThemeItem] = Field(default_factory=list)
    format_distribution: dict[str, Any] = Field(default_factory=dict)
    day_briefs: list[DayBriefItem] = Field(default_factory=list)
    revision_notes: str | None = None
    approved_at: dt.datetime | None = None
    created_at: dt.datetime | None = None
    updated_at: dt.datetime | None = None


class ResearchReportResponse(BaseModel):
    """Competitor & trend research report response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    business_id: uuid.UUID
    competitors: list[dict[str, Any]] = Field(default_factory=list)
    how_to_be_better: list[str] = Field(default_factory=list)
    hashtags: dict[str, Any] = Field(default_factory=dict)
    confidence: float
    source_urls: list[str] = Field(default_factory=list)
    researched_at: dt.datetime | None = None
    created_at: dt.datetime | None = None


class ContentOutlineGateResponse(BaseModel):
    """Human Gate 2 composite overview response."""

    calendar: ContentCalendarResponse
    research: ResearchReportResponse | None = None


class ReviseContentOutlineRequest(BaseModel):
    """Request payload for requesting revisions on content outline."""

    notes: str = Field(..., min_length=3, max_length=2000, description="Feedback or change requests")


class ContentOutlineActionResponse(BaseModel):
    """Response after approving or revising the content outline."""

    status: str
    message: str
    calendar: ContentCalendarResponse


class ContentItemResponse(BaseModel):
    """Single-day content item with post captions, visual prompts, and tracking (PRD §12.3, F-011, F-012, F-013)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    calendar_id: uuid.UUID
    day: int
    date: dt.date
    platform: list[str] = Field(default_factory=list)
    format: str
    pillar: str
    goal: str
    hook: str
    caption: str
    cta: str
    hashtags: list[str] = Field(default_factory=list)
    best_time_hint: str | None = None
    image_prompt: dict[str, Any] = Field(default_factory=dict)
    video_prompt: dict[str, Any] | None = None
    alt_text: str | None = None
    status: str
    posted_at: dt.datetime | None = None
    post_url: str | None = None
    created_at: dt.datetime | None = None
    updated_at: dt.datetime | None = None


class CalendarStatsResponse(BaseModel):
    """Summary statistics for monthly content calendar."""

    total: int = 30
    draft: int = 0
    approved: int = 0
    posted: int = 0
    skipped: int = 0
    needs_review: int = 0


class ContentCalendarViewResponse(BaseModel):
    """Full 30-day Content Calendar view response (F-011)."""

    calendar_id: uuid.UUID
    business_id: uuid.UUID
    status: str
    items: list[ContentItemResponse] = Field(default_factory=list)
    stats: CalendarStatsResponse


class UpdateContentItemStatusRequest(BaseModel):
    """Request payload for updating content item status."""

    status: str = Field(..., description="draft, approved, posted, skipped, needs_review")
    post_url: str | None = Field(default=None, max_length=500, description="Optional live post URL")


class UpdateContentItemRequest(BaseModel):
    """Full update payload for content item detail editor (F-012)."""

    hook: str | None = Field(default=None, max_length=500)
    caption: str | None = Field(default=None, max_length=5000)
    cta: str | None = Field(default=None, max_length=500)
    hashtags: list[str] | None = None
    best_time_hint: str | None = Field(default=None, max_length=100)
    image_prompt: dict[str, Any] | None = None
    video_prompt: dict[str, Any] | None = None
    alt_text: str | None = Field(default=None, max_length=500)
    status: str | None = Field(default=None, description="draft, approved, posted, skipped, needs_review")
    date: dt.date | None = None
