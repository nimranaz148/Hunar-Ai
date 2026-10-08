"""Service layer for Super Admin Cohort Dashboard & Stalled Monitoring (F-028, F-029, D-003 / PRD §11.1, §13.2, §29.3)."""

import math
import uuid
from datetime import UTC, date, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import distinct, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.audit import record_audit_log
from app.models.booking import Booking
from app.models.business import Business
from app.models.content import ContentCalendar, ContentItem
from app.models.mentor import MentorProfile
from app.models.metrics import MetricsSnapshot
from app.models.plan import LaunchPlan, PlanTask
from app.models.program import Program
from app.models.user import User
from app.schemas.cohort import (
    CohortDashboardResponse,
    CohortFunnelData,
    CohortFunnelStage,
    CohortKPIs,
    CohortProgramSummary,
    NudgeStalledBusinessResponse,
    StalledBusinessItem,
    StalledListResponse,
    StalledSummaryCounts,
)


async def _fetch_stalled_businesses(
    db: AsyncSession,
    program_id: uuid.UUID | None = None,
) -> tuple[list[StalledBusinessItem], list[CohortProgramSummary], int, list[uuid.UUID], int]:
    """Internal helper to detect and rank all stalled businesses across a cohort or platform."""
    # 1. Fetch available programs and entrepreneur counts
    programs_res = await db.execute(select(Program).order_by(Program.name.asc()))
    all_programs = list(programs_res.scalars().all())

    program_counts_res = await db.execute(
        select(User.program_id, func.count(User.id))
        .where(User.role == "entrepreneur")
        .group_by(User.program_id)
    )
    program_counts_map = dict(program_counts_res.all())

    program_summaries = [
        CohortProgramSummary(
            id=p.id,
            name=p.name,
            invite_code=p.invite_code,
            entrepreneur_count=program_counts_map.get(p.id, 0),
        )
        for p in all_programs
    ]

    if program_id is not None:
        target_prog = next((p for p in all_programs if p.id == program_id), None)
        if not target_prog:
            prog_query = select(Program).where(Program.id == program_id)
            target_prog = (await db.execute(prog_query)).scalar_one_or_none()
            if not target_prog:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Program not found",
                )

    # 2. Total enrolled entrepreneurs in cohort
    entrepreneur_filter = [User.role == "entrepreneur"]
    if program_id is not None:
        entrepreneur_filter.append(User.program_id == program_id)

    total_entrepreneurs_query = select(func.count(User.id)).where(*entrepreneur_filter)
    total_entrepreneurs = (await db.execute(total_entrepreneurs_query)).scalar_one() or 0

    # 3. Fetch businesses belonging to the cohort
    business_query = (
        select(Business)
        .join(User, Business.owner_id == User.id)
        .where(*entrepreneur_filter)
        .options(selectinload(Business.owner), selectinload(Business.program))
    )
    businesses = list((await db.execute(business_query)).scalars().all())
    business_ids = [b.id for b in businesses]

    now_utc = datetime.now(UTC)
    today_date = now_utc.date()
    stalled_items: list[StalledBusinessItem] = []
    plan_approved_count = 0

    if business_ids:
        # Plans map
        plans_res = await db.execute(
            select(LaunchPlan).where(LaunchPlan.business_id.in_(business_ids))
        )
        all_plans = list(plans_res.scalars().all())
        plans_by_business = {p.business_id: p for p in all_plans}
        plan_approved_count = sum(1 for p in all_plans if p.status == "approved")

        # Latest posted content dates per business
        latest_posts_query = (
            select(
                ContentCalendar.business_id,
                func.max(ContentItem.posted_at),
                func.max(ContentItem.date),
            )
            .join(ContentItem, ContentCalendar.id == ContentItem.calendar_id)
            .where(
                ContentCalendar.business_id.in_(business_ids),
                ContentItem.status == "posted",
            )
            .group_by(ContentCalendar.business_id)
        )
        latest_posts_res = (await db.execute(latest_posts_query)).all()
        latest_post_map: dict[uuid.UUID, date] = {}
        for b_id, max_posted_at, max_date in latest_posts_res:
            if max_posted_at:
                latest_post_map[b_id] = max_posted_at.date()
            elif max_date:
                latest_post_map[b_id] = max_date

        # Latest metrics snapshot dates per business
        latest_metrics_query = (
            select(
                MetricsSnapshot.business_id,
                func.max(MetricsSnapshot.period_end),
            )
            .where(MetricsSnapshot.business_id.in_(business_ids))
            .group_by(MetricsSnapshot.business_id)
        )
        latest_metrics_res = (await db.execute(latest_metrics_query)).all()
        latest_metrics_map: dict[uuid.UUID, date] = {
            b_id: max_period for b_id, max_period in latest_metrics_res if max_period
        }

        # Overdue plan tasks count per plan
        plan_ids = [p.id for p in plans_by_business.values()]
        overdue_tasks_map: dict[uuid.UUID, int] = {}
        if plan_ids:
            overdue_query = (
                select(PlanTask.plan_id, func.count(PlanTask.id))
                .where(
                    PlanTask.plan_id.in_(plan_ids),
                    PlanTask.due_date < today_date,
                    PlanTask.status.in_(["pending", "in_progress"]),
                )
                .group_by(PlanTask.plan_id)
            )
            overdue_res = (await db.execute(overdue_query)).all()
            overdue_tasks_map = dict(overdue_res)

        # Evaluate stalled status for each business
        for b in businesses:
            plan = plans_by_business.get(b.id)
            if not plan or plan.status != "approved":
                continue

            last_post = latest_post_map.get(b.id)
            last_metric = latest_metrics_map.get(b.id)
            overdue_count = overdue_tasks_map.get(plan.id, 0)

            plan_ref_date = plan.approved_at.date() if plan.approved_at else plan.created_at.date()

            days_post = (
                (today_date - last_post).days if last_post else (today_date - plan_ref_date).days
            )
            days_metric = (
                (today_date - last_metric).days
                if last_metric
                else (today_date - plan_ref_date).days
            )

            is_stalled = False
            reasons: list[str] = []

            if days_post is not None and days_post > 5:
                is_stalled = True
                reasons.append(f"No post in {days_post} days")

            if days_metric is not None and days_metric > 7:
                is_stalled = True
                reasons.append(f"No metrics in {days_metric} days")

            if overdue_count > 0:
                is_stalled = True
                reasons.append(f"{overdue_count} task{'s' if overdue_count > 1 else ''} overdue")

            if is_stalled:
                last_activity: str | None = None
                if last_post:
                    last_activity = last_post.isoformat()
                elif last_metric:
                    last_activity = last_metric.isoformat()

                stalled_items.append(
                    StalledBusinessItem(
                        business_id=b.id,
                        business_name=b.name,
                        owner_id=b.owner_id,
                        owner_name=b.owner.name if b.owner else "Unknown",
                        owner_email=b.owner.email if b.owner else "",
                        program_id=b.program_id,
                        program_name=b.program.name if b.program else None,
                        reason=" · ".join(reasons),
                        days_since_last_post=days_post,
                        days_since_last_metric=days_metric,
                        overdue_task_count=overdue_count,
                        last_activity_at=last_activity,
                    )
                )

    stalled_items.sort(
        key=lambda item: (item.overdue_task_count, item.days_since_last_post or 0),
        reverse=True,
    )

    return (
        stalled_items,
        program_summaries,
        total_entrepreneurs,
        business_ids,
        plan_approved_count,
    )


async def get_cohort_dashboard(
    db: AsyncSession,
    program_id: uuid.UUID | None = None,
) -> CohortDashboardResponse:
    """Aggregate cohort conversion funnel, high-level KPIs, and stalled business alerts."""
    (
        stalled_items,
        program_summaries,
        total_entrepreneurs,
        business_ids,
        plan_approved,
    ) = await _fetch_stalled_businesses(db, program_id=program_id)

    selected_program_name = "All Cohorts"
    if program_id is not None:
        matched = next((p for p in program_summaries if p.id == program_id), None)
        if matched:
            selected_program_name = matched.name

    # Funnel milestones
    signed_up = total_entrepreneurs
    first_post = 0
    first_order = 0

    if business_ids:
        # First Post
        first_post_query = (
            select(func.count(distinct(ContentCalendar.business_id)))
            .join(ContentItem, ContentCalendar.id == ContentItem.calendar_id)
            .where(
                ContentCalendar.business_id.in_(business_ids),
                ContentItem.status == "posted",
            )
        )
        first_post = (await db.execute(first_post_query)).scalar_one() or 0

        # First Order
        first_order_query = (
            select(func.count(distinct(MetricsSnapshot.business_id)))
            .where(
                MetricsSnapshot.business_id.in_(business_ids),
                or_(MetricsSnapshot.orders > 0, MetricsSnapshot.revenue_pkr > 0),
            )
        )
        first_order = (await db.execute(first_order_query)).scalar_one() or 0

    base_count = signed_up if signed_up > 0 else 1
    pct_signed = 100.0 if signed_up > 0 else 0.0
    pct_plan = round((plan_approved / base_count) * 100.0, 1) if signed_up > 0 else 0.0
    pct_post = round((first_post / base_count) * 100.0, 1) if signed_up > 0 else 0.0
    pct_order = round((first_order / base_count) * 100.0, 1) if signed_up > 0 else 0.0

    step_plan = round((plan_approved / base_count) * 100.0, 1) if signed_up > 0 else 0.0
    step_post = round((first_post / plan_approved) * 100.0, 1) if plan_approved > 0 else 0.0
    step_order = round((first_order / first_post) * 100.0, 1) if first_post > 0 else 0.0

    funnel_stages = [
        CohortFunnelStage(
            stage="signed_up",
            label="Signed Up",
            count=signed_up,
            percentage=pct_signed,
            step_conversion_rate=100.0 if signed_up > 0 else 0.0,
        ),
        CohortFunnelStage(
            stage="plan_approved",
            label="Plan Approved",
            count=plan_approved,
            percentage=pct_plan,
            step_conversion_rate=step_plan,
        ),
        CohortFunnelStage(
            stage="first_post",
            label="First Post",
            count=first_post,
            percentage=pct_post,
            step_conversion_rate=step_post,
        ),
        CohortFunnelStage(
            stage="first_order",
            label="First Order",
            count=first_order,
            percentage=pct_order,
            step_conversion_rate=step_order,
        ),
    ]

    funnel_data = CohortFunnelData(
        signed_up=signed_up,
        plan_approved=plan_approved,
        first_post=first_post,
        first_order=first_order,
        stages=funnel_stages,
    )

    # Mentors & Bookings This Week
    now_utc = datetime.now(UTC)
    mentor_query = select(func.count(MentorProfile.id)).where(MentorProfile.status == "active")
    active_mentors = (await db.execute(mentor_query)).scalar_one() or 0

    seven_days_ago = now_utc - timedelta(days=7)
    if program_id is not None:
        booking_query = (
            select(func.count(Booking.id))
            .join(User, Booking.entrepreneur_id == User.id)
            .where(Booking.created_at >= seven_days_ago, User.program_id == program_id)
        )
    else:
        booking_query = select(func.count(Booking.id)).where(Booking.created_at >= seven_days_ago)

    bookings_this_week = (await db.execute(booking_query)).scalar_one() or 0

    kpis = CohortKPIs(
        total_entrepreneurs=total_entrepreneurs,
        plan_approved_count=plan_approved,
        stalled_count=len(stalled_items),
        active_mentors=active_mentors,
        bookings_this_week=bookings_this_week,
    )

    return CohortDashboardResponse(
        program_id=program_id,
        program_name=selected_program_name,
        funnel=funnel_data,
        kpis=kpis,
        stalled_preview=stalled_items[:5],
        programs=program_summaries,
    )


async def list_stalled_businesses(
    db: AsyncSession,
    program_id: uuid.UUID | None = None,
    reason_filter: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> StalledListResponse:
    """Retrieve full paginated and filterable stalled businesses list (PRD §13.2 line 1071 / F-029)."""
    all_stalled, program_summaries, _, _, _ = await _fetch_stalled_businesses(
        db, program_id=program_id
    )

    total_stalled = len(all_stalled)
    no_post_count = sum(
        1
        for item in all_stalled
        if item.days_since_last_post is not None and item.days_since_last_post > 5
    )
    no_metrics_count = sum(
        1
        for item in all_stalled
        if item.days_since_last_metric is not None and item.days_since_last_metric > 7
    )
    overdue_tasks_count = sum(1 for item in all_stalled if item.overdue_task_count > 0)

    summary = StalledSummaryCounts(
        total_stalled=total_stalled,
        no_post_count=no_post_count,
        no_metrics_count=no_metrics_count,
        overdue_tasks_count=overdue_tasks_count,
    )

    # Filter by category
    filtered = all_stalled
    if reason_filter == "no_post":
        filtered = [
            item
            for item in filtered
            if item.days_since_last_post is not None and item.days_since_last_post > 5
        ]
    elif reason_filter == "no_metrics":
        filtered = [
            item
            for item in filtered
            if item.days_since_last_metric is not None and item.days_since_last_metric > 7
        ]
    elif reason_filter == "overdue_tasks":
        filtered = [item for item in filtered if item.overdue_task_count > 0]

    # Filter by search term
    if search:
        term = search.strip().lower()
        filtered = [
            item
            for item in filtered
            if term in item.business_name.lower()
            or term in item.owner_name.lower()
            or term in item.owner_email.lower()
        ]

    total = len(filtered)
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    start = (page - 1) * page_size
    items = filtered[start : start + page_size]

    return StalledListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        summary=summary,
        programs=program_summaries,
    )


async def nudge_stalled_business(
    db: AsyncSession,
    business_id: uuid.UUID,
    actor_id: uuid.UUID,
    ip: str | None = None,
    user_agent: str | None = None,
) -> NudgeStalledBusinessResponse:
    """Record an administrator outreach/nudge event and log to audit trail (F-029)."""
    biz_query = select(Business).where(Business.id == business_id)
    biz = (await db.execute(biz_query)).scalar_one_or_none()
    if not biz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found",
        )

    now_iso = datetime.now(UTC).isoformat()

    await record_audit_log(
        db,
        action="admin.business.nudged",
        actor_id=actor_id,
        actor_role="super_admin",
        target_type="business",
        target_id=str(business_id),
        program_id=biz.program_id,
        ip=ip,
        user_agent=user_agent,
        meta={
            "business_name": biz.name,
            "owner_id": str(biz.owner_id),
            "nudged_at": now_iso,
        },
    )

    return NudgeStalledBusinessResponse(
        success=True,
        business_id=biz.id,
        business_name=biz.name,
        nudged_at=now_iso,
        message=f"Intervention nudge successfully recorded for {biz.name}.",
    )
