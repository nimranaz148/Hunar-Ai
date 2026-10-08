"""Pydantic schemas for Weekly Review & Human Gate 3 (Task 50 / F-017 / PRD §5.2, §10 W-004, §13.2, §36.7)."""

import uuid
from datetime import UTC, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class WeeklyReviewDiagnosis(BaseModel):
    """Aggregated performance diagnosis computed from logged metrics snapshots."""

    best_format: str = "reel"
    best_day: str = "Wednesday"
    engagement_trend: str = "+15%"
    revenue_trend: str = "+10%"
    total_views: int = 0
    total_reach: int = 0
    total_likes: int = 0
    total_comments: int = 0
    total_shares: int = 0
    total_saves: int = 0
    total_inquiries: int = 0
    total_orders: int = 0
    total_revenue_pkr: int = 0
    days_analyzed: int = 3
    summary_notes: str = ""


class ProposedContentAdjustment(BaseModel):
    """Specific proposed adjustment to an upcoming content calendar item."""

    item_id: str | None = None
    day: int
    current_format: str
    proposed_format: str
    current_hook: str = ""
    proposed_hook: str | None = None
    recommended_hashtags: list[str] = Field(default_factory=list)
    rationale: str = ""


class WeeklyReviewProposalPayload(BaseModel):
    """Structured proposal payload for gate_type='weekly_review'."""

    diagnosis: WeeklyReviewDiagnosis
    coach_rationale: str
    proposed_adjustments: list[ProposedContentAdjustment] = Field(default_factory=list)
    mentor_recommendation: str | None = None


class ApproveProposalRequest(BaseModel):
    """Request payload for approving an agent proposal at Human Gate 3."""

    comments: str | None = None


class RejectProposalRequest(BaseModel):
    """Request payload for rejecting an agent proposal with feedback reason."""

    reason: str = Field(
        ...,
        min_length=3,
        max_length=1000,
        description="Reason or feedback explaining why the proposal was rejected",
    )


class ProposalDetailResponse(BaseModel):
    """Proposal response with human gate decision status and payload."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    business_id: uuid.UUID
    run_id: uuid.UUID | None = None
    gate_type: str
    payload: dict[str, Any] = Field(default_factory=dict)
    status: Literal["pending", "approved", "rejected"]
    rejection_reason: str | None = None
    decided_at: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime | None = None
