"""Pydantic schemas for Agent Progress SSE streaming overlay (F-042 / PRD §5.2, §36)."""

import uuid
from typing import Literal

from pydantic import BaseModel, Field


class AgentProgressStep(BaseModel):
    """Step progress item rendered in the overlay (PRD §648-667)."""

    name: str = Field(..., description="Step label (e.g. Research, Strategy, Batch Writing)")
    status: Literal["pending", "in_progress", "completed", "failed"] = Field(
        default="pending",
        description="Current state of this sub-step",
    )
    detail: str = Field(default="", description="Specific detail or count (e.g. 3 competitors found)")


class AgentProgressEvent(BaseModel):
    """Real-time SSE event payload pushed to the client."""

    run_id: uuid.UUID
    workflow: str
    status: Literal["queued", "running", "awaiting_approval", "succeeded", "failed", "blocked"]
    steps: list[AgentProgressStep] = Field(default_factory=list)
    error: str | None = None


class StartAgentRunRequest(BaseModel):
    """Request payload to initiate a tracked agent workflow."""

    workflow: str = Field(
        default="content_calendar",
        description="Workflow type (e.g. content_calendar, launch_plan, idea_validator)",
    )


class CancelRunResponse(BaseModel):
    """Response after cancelling an in-progress agent run."""

    run_id: uuid.UUID
    status: str
    message: str
