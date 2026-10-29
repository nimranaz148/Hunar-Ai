"""Plan service layer: Launch Plan, Task Management, and Human Gate 1 Approval (F-008, F-009 / PRD §10, §14.1, §36.7, §36.14)."""

import uuid
from datetime import UTC, date, datetime, timedelta
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.agents.planner import run_planner_agent
from app.core.audit import record_audit_log
from app.models.business import PricingResult, Product, ValidationReport
from app.models.plan import LaunchPlan, PlanTask, Proposal
from app.models.user import User
from app.schemas.plan import Gate1OverviewResponse, LaunchPlanResponse
from app.services.business import get_business_by_id


async def get_or_create_launch_plan(
    db: AsyncSession,
    business_id: uuid.UUID,
    user: User,
    force_refresh: bool = False,
) -> LaunchPlan:
    """Retrieve existing launch plan or generate a 30-day roadmap with tasks."""
    business = await get_business_by_id(db, business_id, user)

    # Check for existing plan with tasks
    stmt = (
        select(LaunchPlan)
        .options(selectinload(LaunchPlan.tasks))
        .where(LaunchPlan.business_id == business_id)
    )
    res = await db.execute(stmt)
    existing_plan = res.scalar_one_or_none()

    if existing_plan and not force_refresh:
        return existing_plan

    if business.owner_id != user.id and user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the business owner can generate or refresh the launch plan.",
        )

    # Collect context for agent: products, validation report, pricing
    prod_stmt = select(Product).where(Product.business_id == business_id)
    prod_res = await db.execute(prod_stmt)
    products = list(prod_res.scalars().all())
    products_summary = ", ".join(f"{p.name} (PKR {p.price_pkr:,})" for p in products)

    # Run Launch Planner Agent
    agent_output = await run_planner_agent(
        business_name=business.name,
        niche=business.niche,
        city=business.city,
        area=business.area,
        budget_pkr=business.budget_pkr,
        hours_per_week=business.hours_per_week,
        platforms=business.platforms,
        target_customer=business.target_customer,
        products_summary=products_summary,
    )

    today = date.today()

    if existing_plan:
        existing_plan.summary = agent_output.summary
        existing_plan.status = "awaiting_approval"
        existing_plan.updated_at = datetime.now(UTC)

        # Remove old tasks
        await db.execute(delete(PlanTask).where(PlanTask.plan_id == existing_plan.id))
        plan = existing_plan
    else:
        plan = LaunchPlan(
            id=uuid.uuid4(),
            business_id=business_id,
            status="awaiting_approval",
            summary=agent_output.summary,
            created_at=datetime.now(UTC),
        )
        db.add(plan)
        await db.flush()

    # Create task items
    created_tasks: list[PlanTask] = []
    for idx, t in enumerate(agent_output.tasks):
        due = today + timedelta(days=t.day_offset)
        task_record = PlanTask(
            id=uuid.uuid4(),
            plan_id=plan.id,
            title=t.title,
            description=t.description,
            week=t.week,
            category=t.category,
            due_date=due,
            status="pending",
            order_index=idx,
            created_at=datetime.now(UTC),
        )
        db.add(task_record)
        created_tasks.append(task_record)

    # Create / update Gate 1 Proposal (PRD §36.7)
    prop_stmt = select(Proposal).where(
        Proposal.business_id == business_id,
        Proposal.gate_type == "plan_approval",
    )
    prop_res = await db.execute(prop_stmt)
    existing_prop = prop_res.scalar_one_or_none()

    payload_data = {
        "summary": plan.summary,
        "task_count": len(created_tasks),
        "generated_at": datetime.now(UTC).isoformat(),
    }

    if existing_prop:
        existing_prop.payload = payload_data
        existing_prop.status = "pending"
        existing_prop.rejection_reason = None
        existing_prop.decided_at = None
        existing_prop.updated_at = datetime.now(UTC)
    else:
        prop = Proposal(
            id=uuid.uuid4(),
            business_id=business_id,
            gate_type="plan_approval",
            payload=payload_data,
            status="pending",
            created_at=datetime.now(UTC),
        )
        db.add(prop)

    await db.flush()
    reload_stmt = (
        select(LaunchPlan).options(selectinload(LaunchPlan.tasks)).where(LaunchPlan.id == plan.id)
    )
    reload_res = await db.execute(reload_stmt)
    plan = reload_res.scalar_one()

    # Audit event
    await record_audit_log(
        db=db,
        action="agent.run.succeeded",
        actor_id=user.id,
        actor_role=user.role,
        target_type="launch_plan",
        target_id=str(plan.id),
        program_id=business.program_id,
        after={
            "plan_id": str(plan.id),
            "business_id": str(business_id),
            "status": plan.status,
            "task_count": len(created_tasks),
        },
    )

    return plan


async def get_gate1_overview(
    db: AsyncSession,
    business_id: uuid.UUID,
    user: User,
) -> Gate1OverviewResponse:
    """Consolidated Plan Approval Gate (Human Gate 1 / Wireframe §30.2) payload."""
    plan = await get_or_create_launch_plan(db, business_id, user)

    # 1. Validation Report snapshot
    val_stmt = select(ValidationReport).where(ValidationReport.business_id == business_id)
    val_res = await db.execute(val_stmt)
    val_report = val_res.scalar_one_or_none()

    validation_snapshot: dict[str, Any] = {}
    if val_report:
        competitor_names = [
            c.get("name", "") for c in val_report.competitors if isinstance(c, dict)
        ]
        first_gap = ""
        if val_report.competitors and isinstance(val_report.competitors[0], dict):
            first_gap = val_report.competitors[0].get("gap_we_can_exploit", "")

        validation_snapshot = {
            "confidence": val_report.confidence,
            "competitor_count": len(val_report.competitors),
            "competitors_summary": ", ".join(competitor_names[:3]),
            "key_gap": first_gap or "Under-served local delivery and personalized customization",
            "demand_summary": val_report.demand_summary,
        }

    # 2. Pricing snapshot
    price_stmt = (
        select(PricingResult)
        .where(PricingResult.business_id == business_id)
        .order_by(PricingResult.created_at.asc())
    )
    price_res = await db.execute(price_stmt)
    pricing_list = list(price_res.scalars().all())

    pricing_snapshot = [
        {
            "id": str(p.id),
            "product_name": p.product_name,
            "unit_cost": p.unit_cost,
            "price": p.price,
            "margin_pct": p.margin_pct,
            "break_even_units": p.break_even_units,
            "approved": bool(p.approved_at),
        }
        for p in pricing_list
    ]

    return Gate1OverviewResponse(
        plan=LaunchPlanResponse.model_validate(plan),
        validation_snapshot=validation_snapshot,
        pricing_snapshot=pricing_snapshot,
        gate_status=plan.status,
    )


async def approve_launch_plan(
    db: AsyncSession,
    business_id: uuid.UUID,
    user: User,
    comments: str | None = None,
) -> LaunchPlan:
    """Approve launch plan at Human Gate 1 (PRD §10 W-001, §14.1, §36.7)."""
    business = await get_business_by_id(db, business_id, user)

    if business.owner_id != user.id and user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the business owner can approve the business plan.",
        )

    stmt = (
        select(LaunchPlan)
        .options(selectinload(LaunchPlan.tasks))
        .where(LaunchPlan.business_id == business_id)
    )
    res = await db.execute(stmt)
    plan = res.scalar_one_or_none()

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Launch plan does not exist yet for this business.",
        )

    before_status = plan.status
    plan.status = "approved"
    approved_at = datetime.now(UTC)
    plan.approved_at = approved_at
    plan.revision_notes = comments
    plan.updated_at = datetime.now(UTC)

    # Update Proposal
    prop_stmt = select(Proposal).where(
        Proposal.business_id == business_id,
        Proposal.gate_type == "plan_approval",
    )
    prop_res = await db.execute(prop_stmt)
    prop = prop_res.scalar_one_or_none()
    if prop:
        prop.status = "approved"
        prop.decided_at = datetime.now(UTC)
        prop.updated_at = datetime.now(UTC)

    await db.flush()
    stmt_reload = (
        select(LaunchPlan).options(selectinload(LaunchPlan.tasks)).where(LaunchPlan.id == plan.id)
    )
    res_reload = await db.execute(stmt_reload)
    plan = res_reload.scalar_one()

    # Mandatory PRD §14.1 audit event: plan.approved
    await record_audit_log(
        db=db,
        action="plan.approved",
        actor_id=user.id,
        actor_role=user.role,
        target_type="launch_plan",
        target_id=str(plan.id),
        program_id=business.program_id,
        before={"status": before_status},
        after={
            "status": "approved",
            "approved_at": approved_at.isoformat(),
            "comments": comments,
        },
    )

    return plan


async def reject_launch_plan(
    db: AsyncSession,
    business_id: uuid.UUID,
    user: User,
    reason: str,
) -> LaunchPlan:
    """Request changes on launch plan at Human Gate 1 (PRD §36.7)."""
    business = await get_business_by_id(db, business_id, user)

    if business.owner_id != user.id and user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the business owner can request changes on the plan.",
        )

    stmt = (
        select(LaunchPlan)
        .options(selectinload(LaunchPlan.tasks))
        .where(LaunchPlan.business_id == business_id)
    )
    res = await db.execute(stmt)
    plan = res.scalar_one_or_none()

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Launch plan does not exist yet for this business.",
        )

    before_status = plan.status
    plan.status = "revision_requested"
    plan.revision_notes = reason
    plan.updated_at = datetime.now(UTC)

    # Update Proposal
    prop_stmt = select(Proposal).where(
        Proposal.business_id == business_id,
        Proposal.gate_type == "plan_approval",
    )
    prop_res = await db.execute(prop_stmt)
    prop = prop_res.scalar_one_or_none()
    if prop:
        prop.status = "rejected"
        prop.rejection_reason = reason
        prop.decided_at = datetime.now(UTC)
        prop.updated_at = datetime.now(UTC)

    await db.flush()
    stmt_reload = (
        select(LaunchPlan).options(selectinload(LaunchPlan.tasks)).where(LaunchPlan.id == plan.id)
    )
    res_reload = await db.execute(stmt_reload)
    plan = res_reload.scalar_one()

    # Mandatory PRD §14.1 audit event: agent.proposal.rejected
    await record_audit_log(
        db=db,
        action="agent.proposal.rejected",
        actor_id=user.id,
        actor_role=user.role,
        target_type="proposal",
        target_id=str(prop.id) if prop else str(plan.id),
        program_id=business.program_id,
        before={"status": before_status},
        after={
            "status": "rejected",
            "rejection_reason": reason,
        },
    )

    return plan


async def update_task_status(
    db: AsyncSession,
    business_id: uuid.UUID,
    task_id: uuid.UUID,
    new_status: str,
    user: User,
) -> PlanTask:
    """Update progress status of a launch task (F-009)."""
    business = await get_business_by_id(db, business_id, user)

    if business.owner_id != user.id and user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the business owner can update task progress.",
        )

    stmt = (
        select(PlanTask)
        .join(LaunchPlan)
        .where(
            PlanTask.id == task_id,
            LaunchPlan.business_id == business_id,
        )
    )
    res = await db.execute(stmt)
    task = res.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found for this business launch plan.",
        )

    task.status = new_status
    task.updated_at = datetime.now(UTC)

    await db.flush()
    await db.refresh(task)

    return task
