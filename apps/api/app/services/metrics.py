"""Service layer for manual performance metrics (PRD §5.2 F-015, §10 W-004, §12.3, §14.1)."""

import uuid
from datetime import UTC, date, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.audit import record_audit_log
from app.models.business import Business
from app.models.content import ContentItem
from app.models.metrics import MetricsSnapshot
from app.models.user import User
from app.schemas.metrics import (
    ChannelMetricTotals,
    MetricsChartPoint,
    MetricsChartsResponse,
    MetricsProgressResponse,
    MetricsSnapshotCreate,
    MetricsSnapshotResponse,
    MetricsSummaryTotals,
    TopPerformingContent,
)


def _format_content_item_title(item: ContentItem | None) -> str | None:
    if not item:
        return None
    hook_preview = item.hook[:45] + ("..." if len(item.hook) > 45 else "")
    return f"Day {item.day} ({item.format.capitalize()}): {hook_preview}"


def _to_snapshot_response(snapshot: MetricsSnapshot) -> MetricsSnapshotResponse:
    title = _format_content_item_title(snapshot.content_item)
    return MetricsSnapshotResponse(
        id=snapshot.id,
        business_id=snapshot.business_id,
        content_item_id=snapshot.content_item_id,
        content_item_title=title,
        platform=snapshot.platform,
        period_start=snapshot.period_start,
        period_end=snapshot.period_end,
        views=snapshot.views,
        reach=snapshot.reach,
        likes=snapshot.likes,
        comments=snapshot.comments,
        shares=snapshot.shares,
        saves=snapshot.saves,
        follower_delta=snapshot.follower_delta,
        inquiries=snapshot.inquiries,
        orders=snapshot.orders,
        revenue_pkr=snapshot.revenue_pkr,
        created_at=snapshot.created_at,
        updated_at=snapshot.updated_at,
    )


async def verify_business_ownership(
    db: AsyncSession,
    business_id: uuid.UUID,
    user: User,
) -> Business:
    """Ensure business exists and requesting user is the entrepreneur owner or super_admin."""
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found",
        )

    if user.role != "super_admin" and business.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view or manage metrics for this business",
        )

    return business


async def create_metrics_snapshot(
    db: AsyncSession,
    *,
    business_id: uuid.UUID,
    user: User,
    data: MetricsSnapshotCreate,
    ip: str | None = None,
    user_agent: str | None = None,
) -> MetricsSnapshotResponse:
    """Validate, create, and audit a manual metrics snapshot (PRD §5.2 F-015, §14.1)."""
    business = await verify_business_ownership(db, business_id, user)

    # If post linkage is specified, verify content item exists and belongs to this business
    content_item: ContentItem | None = None
    if data.content_item_id:
        content_item = await db.get(
            ContentItem,
            data.content_item_id,
            options=[selectinload(ContentItem.calendar)],
        )
        if not content_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Referenced content item not found",
            )
        if content_item.calendar.business_id != business_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Referenced content item does not belong to this business",
            )

    snapshot = MetricsSnapshot(
        id=uuid.uuid4(),
        created_at=datetime.now(UTC),
        business_id=business.id,
        content_item_id=data.content_item_id,
        platform=data.platform,
        period_start=data.period_start,
        period_end=data.period_end,
        views=data.views,
        reach=data.reach,
        likes=data.likes,
        comments=data.comments,
        shares=data.shares,
        saves=data.saves,
        follower_delta=data.follower_delta,
        inquiries=data.inquiries,
        orders=data.orders,
        revenue_pkr=data.revenue_pkr,
    )
    db.add(snapshot)
    await db.flush()

    # Append-only audit trail (PRD §14.1)
    await record_audit_log(
        db,
        action="metrics.logged",
        actor_id=user.id,
        actor_role=user.role,
        target_type="metrics_snapshot",
        target_id=str(snapshot.id),
        program_id=business.program_id,
        ip=ip,
        user_agent=user_agent,
        after={
            "platform": snapshot.platform,
            "period_start": str(snapshot.period_start),
            "period_end": str(snapshot.period_end),
            "views": snapshot.views,
            "revenue_pkr": snapshot.revenue_pkr,
            "orders": snapshot.orders,
        },
        meta={
            "business_id": str(business.id),
            "content_item_id": str(data.content_item_id) if data.content_item_id else None,
        },
    )

    await db.commit()
    await db.refresh(snapshot)
    if content_item:
        snapshot.content_item = content_item

    return _to_snapshot_response(snapshot)


async def list_metrics_snapshots(
    db: AsyncSession,
    *,
    business_id: uuid.UUID,
    user: User,
    page: int = 1,
    page_size: int = 20,
    platform: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
) -> tuple[list[MetricsSnapshotResponse], int]:
    """Retrieve paginated metrics snapshots for a business with optional filtering."""
    await verify_business_ownership(db, business_id, user)

    query = (
        select(MetricsSnapshot)
        .where(MetricsSnapshot.business_id == business_id)
        .options(selectinload(MetricsSnapshot.content_item))
    )

    if platform:
        query = query.where(MetricsSnapshot.platform == platform.lower())
    if start_date:
        query = query.where(MetricsSnapshot.period_start >= start_date)
    if end_date:
        query = query.where(MetricsSnapshot.period_end <= end_date)

    count_query = select(func.count()).select_from(query.subquery())
    count_res = await db.execute(count_query)
    total = count_res.scalar() or 0

    items_query = (
        query.order_by(MetricsSnapshot.period_end.desc(), MetricsSnapshot.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items_res = await db.execute(items_query)
    snapshots = items_res.scalars().all()

    return [_to_snapshot_response(s) for s in snapshots], total


async def get_metrics_snapshot(
    db: AsyncSession,
    *,
    business_id: uuid.UUID,
    snapshot_id: uuid.UUID,
    user: User,
) -> MetricsSnapshotResponse:
    """Retrieve a single metrics snapshot."""
    await verify_business_ownership(db, business_id, user)

    query = (
        select(MetricsSnapshot)
        .where(
            MetricsSnapshot.id == snapshot_id,
            MetricsSnapshot.business_id == business_id,
        )
        .options(selectinload(MetricsSnapshot.content_item))
    )
    res = await db.execute(query)
    snapshot = res.scalar_one_or_none()
    if not snapshot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Metrics snapshot not found",
        )

    return _to_snapshot_response(snapshot)


async def get_metrics_coaching_progress(
    db: AsyncSession,
    *,
    business_id: uuid.UUID,
    user: User,
) -> MetricsProgressResponse:
    """Calculate progress toward 3-day metrics threshold for Weekly Coach (PRD §10 W-004)."""
    await verify_business_ownership(db, business_id, user)

    query = select(
        MetricsSnapshot.period_start,
        MetricsSnapshot.period_end,
    ).where(MetricsSnapshot.business_id == business_id)

    res = await db.execute(query)
    ranges = res.all()

    # Calculate distinct days covered across snapshots
    logged_dates: set[date] = set()
    latest_date: date | None = None

    for p_start, p_end in ranges:
        curr = p_start
        while curr <= p_end:
            logged_dates.add(curr)
            if latest_date is None or curr > latest_date:
                latest_date = curr
            # Increment day
            from datetime import timedelta

            curr = curr + timedelta(days=1)

    total_days = len(logged_dates)
    return MetricsProgressResponse(
        total_days_logged=total_days,
        target_days=3,
        threshold_met=total_days >= 3,
        latest_snapshot_date=latest_date,
    )


async def get_metrics_charts_data(
    db: AsyncSession,
    *,
    business_id: uuid.UUID,
    user: User,
    days: int | None = 30,
    platform: str | None = None,
) -> MetricsChartsResponse:
    """Retrieve aggregated timeseries, channel comparison, and summary metrics (F-016)."""
    await verify_business_ownership(db, business_id, user)

    query = (
        select(MetricsSnapshot)
        .where(MetricsSnapshot.business_id == business_id)
        .options(selectinload(MetricsSnapshot.content_item))
    )

    if platform and platform != "all":
        query = query.where(MetricsSnapshot.platform == platform.lower())

    if days is not None and days > 0:
        cutoff = date.today() - timedelta(days=days)
        query = query.where(MetricsSnapshot.period_end >= cutoff)

    query = query.order_by(MetricsSnapshot.period_end.asc(), MetricsSnapshot.created_at.asc())
    res = await db.execute(query)
    snapshots = res.scalars().all()

    # Timeline points aggregated by date (period_end)
    daily_map: dict[date, dict[str, int]] = {}
    channel_map: dict[str, dict[str, int]] = {
        "instagram": {
            "count": 0,
            "views": 0,
            "reach": 0,
            "inquiries": 0,
            "orders": 0,
            "revenue_pkr": 0,
        },
        "facebook": {
            "count": 0,
            "views": 0,
            "reach": 0,
            "inquiries": 0,
            "orders": 0,
            "revenue_pkr": 0,
        },
    }

    total_views = 0
    total_reach = 0
    total_likes = 0
    total_comments = 0
    total_shares = 0
    total_saves = 0
    total_follower_delta = 0
    total_inquiries = 0
    total_orders = 0
    total_revenue_pkr = 0

    earliest_date: date | None = None
    latest_date: date | None = None

    attributed_posts: list[MetricsSnapshot] = []

    for s in snapshots:
        d = s.period_end
        if earliest_date is None or d < earliest_date:
            earliest_date = d
        if latest_date is None or d > latest_date:
            latest_date = d

        total_views += s.views
        total_reach += s.reach
        total_likes += s.likes
        total_comments += s.comments
        total_shares += s.shares
        total_saves += s.saves
        total_follower_delta += s.follower_delta
        total_inquiries += s.inquiries
        total_orders += s.orders
        total_revenue_pkr += s.revenue_pkr

        # Aggregation by date
        if d not in daily_map:
            daily_map[d] = {
                "views": 0,
                "reach": 0,
                "likes": 0,
                "comments": 0,
                "shares": 0,
                "saves": 0,
                "follower_delta": 0,
                "inquiries": 0,
                "orders": 0,
                "revenue_pkr": 0,
            }
        daily_map[d]["views"] += s.views
        daily_map[d]["reach"] += s.reach
        daily_map[d]["likes"] += s.likes
        daily_map[d]["comments"] += s.comments
        daily_map[d]["shares"] += s.shares
        daily_map[d]["saves"] += s.saves
        daily_map[d]["follower_delta"] += s.follower_delta
        daily_map[d]["inquiries"] += s.inquiries
        daily_map[d]["orders"] += s.orders
        daily_map[d]["revenue_pkr"] += s.revenue_pkr

        # Channel aggregation
        plat = s.platform.lower()
        if plat not in channel_map:
            channel_map[plat] = {
                "count": 0,
                "views": 0,
                "reach": 0,
                "inquiries": 0,
                "orders": 0,
                "revenue_pkr": 0,
            }
        channel_map[plat]["count"] += 1
        channel_map[plat]["views"] += s.views
        channel_map[plat]["reach"] += s.reach
        channel_map[plat]["inquiries"] += s.inquiries
        channel_map[plat]["orders"] += s.orders
        channel_map[plat]["revenue_pkr"] += s.revenue_pkr

        if s.content_item_id and s.content_item:
            attributed_posts.append(s)

    # Build sorted timeline
    timeline: list[MetricsChartPoint] = []
    for d in sorted(daily_map.keys()):
        stats = daily_map[d]
        eng = stats["likes"] + stats["comments"] + stats["shares"] + stats["saves"]
        timeline.append(
            MetricsChartPoint(
                date=d,
                views=stats["views"],
                reach=stats["reach"],
                likes=stats["likes"],
                comments=stats["comments"],
                shares=stats["shares"],
                saves=stats["saves"],
                engagement=eng,
                follower_delta=stats["follower_delta"],
                inquiries=stats["inquiries"],
                orders=stats["orders"],
                revenue_pkr=stats["revenue_pkr"],
            )
        )

    # Build channel breakdown
    channels: list[ChannelMetricTotals] = []
    for plat_name, c_stats in channel_map.items():
        v_share = round((c_stats["views"] / total_views * 100), 1) if total_views > 0 else 0.0
        r_share = (
            round((c_stats["revenue_pkr"] / total_revenue_pkr * 100), 1)
            if total_revenue_pkr > 0
            else 0.0
        )
        channels.append(
            ChannelMetricTotals(
                platform=plat_name,
                snapshots_count=c_stats["count"],
                views=c_stats["views"],
                reach=c_stats["reach"],
                inquiries=c_stats["inquiries"],
                orders=c_stats["orders"],
                revenue_pkr=c_stats["revenue_pkr"],
                views_share_pct=v_share,
                revenue_share_pct=r_share,
            )
        )

    # Sort top content by views descending
    attributed_posts.sort(key=lambda item: (item.views, item.revenue_pkr), reverse=True)
    top_content = [
        TopPerformingContent(
            content_item_id=p.content_item_id,
            title=_format_content_item_title(p.content_item) or "Attributed Post",
            platform=p.platform,
            views=p.views,
            revenue_pkr=p.revenue_pkr,
            inquiries=p.inquiries,
            orders=p.orders,
        )
        for p in attributed_posts[:5]
        if p.content_item_id is not None
    ]

    total_engagement = total_likes + total_comments + total_shares + total_saves
    conversion_rate = (
        round((total_orders / total_inquiries * 100), 1) if total_inquiries > 0 else 0.0
    )

    summary = MetricsSummaryTotals(
        total_views=total_views,
        total_reach=total_reach,
        total_engagement=total_engagement,
        total_inquiries=total_inquiries,
        total_orders=total_orders,
        total_revenue_pkr=total_revenue_pkr,
        net_follower_delta=total_follower_delta,
        inquiry_to_order_rate_pct=conversion_rate,
        total_snapshots=len(snapshots),
    )

    return MetricsChartsResponse(
        business_id=business_id,
        timeframe_days=days,
        start_date=earliest_date,
        end_date=latest_date,
        summary=summary,
        timeline=timeline,
        channels=channels,
        top_content=top_content,
    )
