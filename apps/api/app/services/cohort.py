"""Service layer for Super Admin Cohort Dashboard & Stalled Monitoring (F-028, F-029, D-003 / PRD §11.1, §13.2, §29.3)."""

import uuid
from datetime import UTC, date, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import distinct, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

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
    StalledBusinessItem,
)


async def get_cohort_dashboard(
    db: AsyncSession,
    program_id: uuid.UUID | None = None,
) -> CohortDashboardResponse:
    """Aggregate cohort conversion funnel, high-level KPIs, and stalled business alerts."""
    # 1. Fetch available programs and entrepreneur counts per cohort
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

    selected_program_name = "All Cohorts"
    if program_id is not None:
        target_prog = next((p for p in all_programs if p.id == program_id), None)
        if not target_prog:
            # Query directly from DB to verify if program exists
            prog_query = select(Program).where(Program.id == program_id)
            target_prog = (await db.execute(prog_query)).scalar_one_or_none()
            if not target_prog:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Program not found",
                )
        selected_program_name = target_prog.name

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

    # 4. Milestone Funnel Calculations
    signed_up = total_entrepreneurs
    plan_approved = 0
    first_post = 0
    first_order = 0

    plans_by_business: dict[uuid.UUID, LaunchPlan] = {}

    if business_ids:
        # (a) Plan Approved count and map
        plans_res = await db.execute(
            select(LaunchPlan).where(LaunchPlan.business_id.in_(business_ids))
        )
        all_plans = list(plans_res.scalars().all())
        plans_by_business = {p.business_id: p for p in all_plans}
        plan_approved = sum(1 for p in all_plans if p.status == "approved")

        # (b) First Post: businesses with at least 1 posted content item
        first_post_query = (
            select(func.count(distinct(ContentCalendar.business_id)))
            .join(ContentItem, ContentCalendar.id == ContentItem.calendar_id)
            .where(
                ContentCalendar.business_id.in_(business_ids),
                ContentItem.status == "posted",
            )
        )
        first_post = (await db.execute(first_post_query)).scalar_one() or 0

        # (c) First Order: businesses with >= 1 order or revenue logged
        first_order_query = select(func.count(distinct(MetricsSnapshot.business_id))).where(
            MetricsSnapshot.business_id.in_(business_ids),
            or_(MetricsSnapshot.orders > 0, MetricsSnapshot.revenue_pkr > 0),
        )
        first_order = (await db.execute(first_order_query)).scalar_one() or 0

    # Calculate funnel stages
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

    # 5. Stalled Businesses Analysis
    now_utc = datetime.now(UTC)
    today_date = now_utc.date()

    stalled_items: list[StalledBusinessItem] = []

    if business_ids:
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
            # Only consider businesses that have progressed past onboarding (e.g. plan approved or plan generated)
            if not plan or plan.status != "approved":
                continue

            last_post = latest_post_map.get(b.id)
            last_metric = latest_metrics_map.get(b.id)
            overdue_count = overdue_tasks_map.get(plan.id, 0)

            days_post: int | None = None
            days_metric: int | None = None

            # Reference baseline date for newly approved plans without posts/metrics yet
            plan_ref_date = plan.approved_at.date() if plan.approved_at else plan.created_at.date()

            if last_post:
                days_post = (today_date - last_post).days
            else:
                days_post = (today_date - plan_ref_date).days

            if last_metric:
                days_metric = (today_date - last_metric).days
            else:
                days_metric = (today_date - plan_ref_date).days

            # Stalled criteria: no post > 5d OR no metrics > 7d OR overdue tasks > 0
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

    # Sort stalled businesses by urgency (highest days without activity or highest overdue count)
    stalled_items.sort(
        key=lambda item: (item.overdue_task_count, item.days_since_last_post or 0),
        reverse=True,
    )

    # 6. Mentors & Bookings This Week
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

    # 7. Assemble Cohort KPIs
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
        stalled_preview=stalled_items[:5],  # top 5 preview for D-003 dashboard
        programs=program_summaries,
    )
