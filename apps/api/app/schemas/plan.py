"""Pydantic schemas for Launch Planner, Plan Approval Gate, and Task Checklist (F-008, F-009 / PRD §5.2, §36.7, §36.14)."""

import uuid
from datetime import UTC, date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class PlanTaskResponse(BaseModel):
    """Single task item within the 30-day launch roadmap."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    plan_id: uuid.UUID
    title: str
    description: str = ""
    week: int = Field(..., ge=1, le=4)
    category: str = "setup"
    due_date: date | None = None
    status: Literal["pending", "in_progress", "completed", "skipped"] = "pending"
    order_index: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime | None = None


class UpdateTaskStatusRequest(BaseModel):
    """Request payload to change task status (F-009)."""

    status: Literal["pending", "in_progress", "completed", "skipped"]


class LaunchPlanResponse(BaseModel):
    """30-day launch plan schema with tasks."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    business_id: uuid.UUID
    status: str
    summary: str = ""
    revision_notes: str | None = None
    approved_at: datetime | None = None
    tasks: list[PlanTaskResponse] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime | None = None


class ProposalResponse(BaseModel):
    """Proposal awaiting human gate decision (F-008 / PRD §36.7)."""

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


class Gate1OverviewResponse(BaseModel):
    """Consolidated Plan Approval Gate (Human Gate 1 / Wireframe §30.2) response."""

    plan: LaunchPlanResponse
    validation_snapshot: dict[str, Any] = Field(default_factory=dict)
    pricing_snapshot: list[dict[str, Any]] = Field(default_factory=list)
    gate_status: str = Field(..., description="Current gate status (awaiting_approval, approved, revision_requested)")


class ApprovePlanRequest(BaseModel):
    """Approve launch plan and activate tasks."""

    comments: str | None = None


class RejectPlanRequest(BaseModel):
    """Request changes on launch plan."""

    reason: str = Field(..., min_length=3, max_length=1000, description="Feedback explaining changes needed")
