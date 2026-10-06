"""Schemas for Entrepreneur Home Dashboard (D-001 / PRD §7, §29.1)."""

import datetime as dt
import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.content import ContentItemResponse


class TrendPoint(BaseModel):
    """Daily engagement trend data point for 7-day sparkline."""

    day: str
    engagement: int
    reach: int


class DashboardTaskItem(BaseModel):
    """Actionable upcoming task for quick-execution checklist."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    category: str
    week: int
    order_index: int = 0
    status: str
    due_date: dt.date | None = None


class EntrepreneurDashboardResponse(BaseModel):
    """Consolidated KPI and status metrics for Entrepreneur Home Dashboard (D-001)."""

    model_config = ConfigDict(from_attributes=True)

    business_id: uuid.UUID
    business_name: str
    niche: str
    city: str

    # 4 Core PRD KPIs
    tasks_done_count: int = Field(..., description="Count of completed launch tasks")
    total_tasks_count: int = Field(..., description="Total count of launch roadmap tasks")
    posts_published_count: int = Field(..., description="Count of posted content items")
    total_posts_count: int = Field(..., description="Total count of 30-day content items")
    engagement_change_pct: float = Field(
        ..., description="7-day engagement percentage trend (▲/▼)"
    )
    revenue_this_week_pkr: int = Field(..., description="Revenue achieved this week in PKR")

    # Spotlight & Activities
    today_post: ContentItemResponse | None = Field(
        default=None, description="Spotlight post for today"
    )
    trend_7d: list[TrendPoint] = Field(
        default_factory=list, description="7-day engagement points for visual chart"
    )
    upcoming_tasks: list[DashboardTaskItem] = Field(
        default_factory=list, description="Top pending roadmap tasks"
    )
