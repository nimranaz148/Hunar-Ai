"""Metrics routes for manual marketing and business conversion tracking (PRD §5.2 F-015, §10 W-004, §13.2)."""

import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_role
from app.core.database import get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.metrics import (
    MetricsChartsResponse,
    MetricsProgressResponse,
    MetricsSnapshotCreate,
    MetricsSnapshotResponse,
)
from app.services.metrics import (
    create_metrics_snapshot,
    get_metrics_charts_data,
    get_metrics_coaching_progress,
    get_metrics_snapshot,
    list_metrics_snapshots,
)

metrics_router = APIRouter(
    prefix="/api/v1/businesses/{business_id}/metrics",
    tags=["metrics"],
)


@metrics_router.post(
    "",
    response_model=MetricsSnapshotResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log manual performance metrics snapshot (F-015)",
)
async def log_metrics_snapshot(
    business_id: uuid.UUID,
    data: MetricsSnapshotCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("entrepreneur", "super_admin")),
) -> MetricsSnapshotResponse:
    """Record manual metrics snapshot (Instagram/Facebook, engagement, conversions, revenue)."""
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return await create_metrics_snapshot(
        db,
        business_id=business_id,
        user=current_user,
        data=data,
        ip=client_ip,
        user_agent=user_agent,
    )


@metrics_router.get(
    "",
    response_model=PaginatedResponse[MetricsSnapshotResponse],
    summary="List metrics snapshots for a business (F-015)",
)
async def list_business_metrics(
    business_id: uuid.UUID,
    page: Annotated[int, Query(ge=1, description="Page number")] = 1,
    page_size: Annotated[int, Query(ge=1, le=100, description="Items per page")] = 20,
    platform: Annotated[str | None, Query(description="Filter by platform")] = None,
    start_date: Annotated[date | None, Query(description="Filter by period start")] = None,
    end_date: Annotated[date | None, Query(description="Filter by period end")] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("entrepreneur", "super_admin")),
) -> PaginatedResponse[MetricsSnapshotResponse]:
    """Retrieve historical metrics snapshots with optional date range and platform filters."""
    items, total = await list_metrics_snapshots(
        db,
        business_id=business_id,
        user=current_user,
        page=page,
        page_size=page_size,
        platform=platform,
        start_date=start_date,
        end_date=end_date,
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@metrics_router.get(
    "/progress",
    response_model=MetricsProgressResponse,
    summary="Get 3-day coaching progress indicator (PRD §10 W-004)",
)
async def get_coaching_progress(
    business_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("entrepreneur", "super_admin")),
) -> MetricsProgressResponse:
    """Check how many days of metrics have been logged toward the 3-day Weekly Coach threshold."""
    return await get_metrics_coaching_progress(
        db,
        business_id=business_id,
        user=current_user,
    )


@metrics_router.get(
    "/charts",
    response_model=MetricsChartsResponse,
    summary="Get aggregated performance charts data (F-016)",
)
async def get_metrics_charts(
    business_id: uuid.UUID,
    days: Annotated[
        int | None,
        Query(ge=1, le=365, description="Number of past days to aggregate (e.g. 7, 14, 30)"),
    ] = 30,
    platform: Annotated[
        str | None, Query(description="Filter by platform (instagram, facebook, or all)")
    ] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("entrepreneur", "super_admin")),
) -> MetricsChartsResponse:
    """Retrieve timeseries timeline, channel comparison, and summary metrics for visualization."""
    return await get_metrics_charts_data(
        db,
        business_id=business_id,
        user=current_user,
        days=days,
        platform=platform,
    )


@metrics_router.get(
    "/{snapshot_id}",
    response_model=MetricsSnapshotResponse,
    summary="Get single metrics snapshot detail (F-015)",
)
async def get_single_metric_snapshot(
    business_id: uuid.UUID,
    snapshot_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("entrepreneur", "super_admin")),
) -> MetricsSnapshotResponse:
    """Retrieve specific metrics snapshot details."""
    return await get_metrics_snapshot(
        db,
        business_id=business_id,
        snapshot_id=snapshot_id,
        user=current_user,
    )
