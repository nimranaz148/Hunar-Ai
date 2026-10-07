"""Pydantic schemas for manual performance metrics (PRD §5.2 F-015, §10 W-004, §12.3)."""

import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class MetricsSnapshotCreate(BaseModel):
    """Payload for submitting a new manual metrics snapshot (F-015)."""

    model_config = ConfigDict(extra="forbid")

    content_item_id: uuid.UUID | None = Field(
        default=None,
        description="Optional content item ID to link metrics directly to a scheduled/published post",
    )
    platform: Literal["instagram", "facebook"] = Field(
        description="Social media platform for this metrics snapshot",
    )
    period_start: date = Field(
        description="Start date of the reporting period",
    )
    period_end: date = Field(
        description="End date of the reporting period (must be >= period_start)",
    )
    views: int = Field(
        default=0,
        ge=0,
        description="Video views / impressions (>= 0)",
    )
    reach: int = Field(
        default=0,
        ge=0,
        description="Unique accounts reached (>= 0)",
    )
    likes: int = Field(
        default=0,
        ge=0,
        description="Post likes (>= 0)",
    )
    comments: int = Field(
        default=0,
        ge=0,
        description="Comments received (>= 0)",
    )
    shares: int = Field(
        default=0,
        ge=0,
        description="Post shares (>= 0)",
    )
    saves: int = Field(
        default=0,
        ge=0,
        description="Post bookmarks/saves (>= 0)",
    )
    follower_delta: int = Field(
        default=0,
        description="Net follower count change (can be positive, zero, or negative)",
    )
    inquiries: int = Field(
        default=0,
        ge=0,
        description="Customer inquiries via DMs / WhatsApp messages (>= 0)",
    )
    orders: int = Field(
        default=0,
        ge=0,
        description="Confirmed orders received (>= 0)",
    )
    revenue_pkr: int = Field(
        default=0,
        ge=0,
        description="Revenue in PKR generated during the period (>= 0)",
    )

    @model_validator(mode="after")
    def validate_period_dates(self) -> "MetricsSnapshotCreate":
        if self.period_end < self.period_start:
            raise ValueError("period_end must be greater than or equal to period_start")
        return self


class MetricsSnapshotResponse(BaseModel):
    """Response representation of a metrics snapshot."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    business_id: uuid.UUID
    content_item_id: uuid.UUID | None = None
    content_item_title: str | None = None
    platform: str
    period_start: date
    period_end: date
    views: int
    reach: int
    likes: int
    comments: int
    shares: int
    saves: int
    follower_delta: int
    inquiries: int
    orders: int
    revenue_pkr: int
    created_at: datetime
    updated_at: datetime | None = None


class MetricsProgressResponse(BaseModel):
    """Tracking progress toward the 3-day Weekly Coach threshold (PRD §10 W-004)."""

    model_config = ConfigDict(from_attributes=True)

    total_days_logged: int
    target_days: int = 3
    threshold_met: bool
    latest_snapshot_date: date | None = None


class MetricsChartPoint(BaseModel):
    """Daily or period data point for timeseries charts."""

    date: date
    views: int = 0
    reach: int = 0
    likes: int = 0
    comments: int = 0
    shares: int = 0
    saves: int = 0
    engagement: int = 0
    follower_delta: int = 0
    inquiries: int = 0
    orders: int = 0
    revenue_pkr: int = 0


class ChannelMetricTotals(BaseModel):
    """Channel comparison metrics (Instagram vs Facebook)."""

    platform: str
    snapshots_count: int = 0
    views: int = 0
    reach: int = 0
    inquiries: int = 0
    orders: int = 0
    revenue_pkr: int = 0
    views_share_pct: float = 0.0
    revenue_share_pct: float = 0.0


class TopPerformingContent(BaseModel):
    """Top performing attributed post item."""

    content_item_id: uuid.UUID
    title: str
    platform: str
    views: int = 0
    revenue_pkr: int = 0
    inquiries: int = 0
    orders: int = 0


class MetricsSummaryTotals(BaseModel):
    """Aggregated KPI totals across the selected timeframe."""

    total_views: int = 0
    total_reach: int = 0
    total_engagement: int = 0
    total_inquiries: int = 0
    total_orders: int = 0
    total_revenue_pkr: int = 0
    net_follower_delta: int = 0
    inquiry_to_order_rate_pct: float = 0.0
    total_snapshots: int = 0


class MetricsChartsResponse(BaseModel):
    """Complete aggregated charts and trend data response (F-016)."""

    business_id: uuid.UUID
    timeframe_days: int | None = None
    start_date: date | None = None
    end_date: date | None = None
    summary: MetricsSummaryTotals
    timeline: list[MetricsChartPoint]
    channels: list[ChannelMetricTotals]
    top_content: list[TopPerformingContent]
