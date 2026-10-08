"""Pydantic schemas for Super Admin Cohort Dashboard and Stalled Monitoring (F-028, F-029, D-003 / PRD §11.1, §13.2, §29.3)."""

import uuid
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class CohortFunnelStage(BaseModel):
    """Detailed breakdown for a single funnel milestone."""

    stage: Literal["signed_up", "plan_approved", "first_post", "first_order"]
    label: str
    count: int = Field(ge=0)
    percentage: float = Field(
        ge=0.0, le=100.0, description="Percentage of total enrolled entrepreneurs"
    )
    step_conversion_rate: float = Field(
        ge=0.0, le=100.0, description="Conversion rate from previous step"
    )


class CohortFunnelData(BaseModel):
    """Cumulative counts and stage-by-stage conversion metrics for cohort funnel."""

    signed_up: int = Field(ge=0)
    plan_approved: int = Field(ge=0)
    first_post: int = Field(ge=0)
    first_order: int = Field(ge=0)
    stages: list[CohortFunnelStage] = Field(default_factory=list)


class CohortKPIs(BaseModel):
    """High-level cohort KPI cards matching PRD §11.1 D-003."""

    total_entrepreneurs: int = Field(ge=0)
    plan_approved_count: int = Field(ge=0)
    stalled_count: int = Field(ge=0)
    active_mentors: int = Field(ge=0)
    bookings_this_week: int = Field(ge=0)


class StalledBusinessItem(BaseModel):
    """Item representing a business flagged as stalled."""

    business_id: uuid.UUID
    business_name: str
    owner_id: uuid.UUID
    owner_name: str
    owner_email: str
    program_id: uuid.UUID | None = None
    program_name: str | None = None
    reason: str
    days_since_last_post: int | None = None
    days_since_last_metric: int | None = None
    overdue_task_count: int = 0
    last_activity_at: str | None = None


class CohortProgramSummary(BaseModel):
    """Brief program metadata for cohort selector filters."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    invite_code: str | None = None
    entrepreneur_count: int = 0


class CohortDashboardResponse(BaseModel):
    """Complete aggregated cohort performance and stalled monitoring response."""

    program_id: uuid.UUID | None = None
    program_name: str | None = None
    funnel: CohortFunnelData
    kpis: CohortKPIs
    stalled_preview: list[StalledBusinessItem] = Field(default_factory=list)
    programs: list[CohortProgramSummary] = Field(default_factory=list)
