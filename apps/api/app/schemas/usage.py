"""Pydantic schemas for System Usage Statistics (Task 54 / F-037 / R-011 / D-004)."""

import uuid

from pydantic import BaseModel, ConfigDict, Field


class HourlyRunStat(BaseModel):
    """Hourly breakdown of agent workflow executions."""

    hour: str = Field(..., description="Hour label or ISO string, e.g. '14:00'")
    total: int = Field(0, description="Total runs started in this hour")
    succeeded: int = Field(0, description="Succeeded runs in this hour")
    failed: int = Field(0, description="Failed/blocked runs in this hour")


class WorkflowStat(BaseModel):
    """Aggregated metrics per workflow type."""

    workflow: str = Field(..., description="Workflow identifier")
    total_runs: int = Field(0, description="Total runs for this workflow")
    avg_latency_seconds: float = Field(0.0, description="Average runtime duration in seconds")
    failure_rate_pct: float = Field(0.0, description="Failure rate percentage (0-100)")


class TopUserRunStat(BaseModel):
    """Top platform users by agent workflow volume."""

    user_id: uuid.UUID = Field(..., description="User unique identifier")
    name: str = Field(..., description="User display name")
    email: str = Field(..., description="User email address")
    role: str = Field(..., description="User account role")
    run_count: int = Field(0, description="Total agent workflow runs executed")


class UsageStatsResponse(BaseModel):
    """Super Admin system usage and telemetry response (D-004 / PRD §29.4)."""

    active_users_today: int = Field(0, description="Distinct users active today")
    runs_today_total: int = Field(0, description="Total workflow runs today")
    runs_today_succeeded: int = Field(0, description="Succeeded runs today")
    runs_today_failed: int = Field(0, description="Failed/blocked runs today")
    avg_latency_seconds: float = Field(0.0, description="Average agent runtime in seconds")
    error_rate_pct: float = Field(0.0, description="Agent workflow error rate percentage")
    runs_per_hour: list[HourlyRunStat] = Field(default_factory=list, description="24-hour activity trend")
    workflows: list[WorkflowStat] = Field(default_factory=list, description="Breakdown by workflow type")
    top_users: list[TopUserRunStat] = Field(default_factory=list, description="Top users by workflow execution volume")

    model_config = ConfigDict(from_attributes=True)
