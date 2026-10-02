"""Validation service layer for market feasibility analysis (F-006 / PRD §5.2, §36.12)."""

import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.validator import run_validator_agent
from app.core.audit import record_audit_log
from app.models.business import Product, ValidationReport
from app.models.user import User
from app.services.business import get_business_by_id


async def get_validation_report(
    db: AsyncSession,
    business_id: uuid.UUID,
    user: User,
) -> ValidationReport | None:
    """Retrieve the validation report for a business if it exists."""
    await get_business_by_id(db, business_id, user)

    stmt = select(ValidationReport).where(ValidationReport.business_id == business_id)
    res = await db.execute(stmt)
    return res.scalar_one_or_none()


async def generate_or_get_validation_report(
    db: AsyncSession,
    business_id: uuid.UUID,
    user: User,
    force_refresh: bool = False,
) -> ValidationReport:
    """Generate or retrieve cached validation report using Idea Validator agent."""
    business = await get_business_by_id(db, business_id, user)

    if business.owner_id != user.id and user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the business owner can generate or refresh validation reports.",
        )

    # Check for existing report if not forcing refresh
    existing_stmt = select(ValidationReport).where(ValidationReport.business_id == business_id)
    existing_res = await db.execute(existing_stmt)
    existing_report = existing_res.scalar_one_or_none()

    if existing_report and not force_refresh:
        return existing_report

    # Collect products summary to give agent full context
    prod_stmt = select(Product).where(Product.business_id == business_id)
    prod_res = await db.execute(prod_stmt)
    products = list(prod_res.scalars().all())
    products_summary = ", ".join(f"{p.name} (PKR {p.price_pkr:,})" for p in products)

    # Run agent
    agent_output = await run_validator_agent(
        business_name=business.name,
        niche=business.niche,
        city=business.city,
        area=business.area,
        budget_pkr=business.budget_pkr,
        hours_per_week=business.hours_per_week,
        target_customer=business.target_customer,
        products_summary=products_summary,
    )

    competitors_raw = [c.model_dump() for c in agent_output.competitors]

    if existing_report:
        # Update existing record
        existing_report.competitors = competitors_raw
        existing_report.how_to_be_better = agent_output.how_to_be_better
        existing_report.confidence = agent_output.confidence
        existing_report.demand_summary = agent_output.demand_summary
        existing_report.pricing_insight = agent_output.pricing_insight
        existing_report.reasoning = agent_output.reasoning
        existing_report.updated_at = datetime.now(UTC)
        report = existing_report
    else:
        # Create new record
        report = ValidationReport(
            id=uuid.uuid4(),
            business_id=business_id,
            competitors=competitors_raw,
            how_to_be_better=agent_output.how_to_be_better,
            confidence=agent_output.confidence,
            demand_summary=agent_output.demand_summary,
            pricing_insight=agent_output.pricing_insight,
            reasoning=agent_output.reasoning,
            created_at=datetime.now(UTC),
        )
        db.add(report)

    await db.flush()
    await db.refresh(report)

    await record_audit_log(
        db=db,
        action="validation_report.generated",
        actor_id=user.id,
        actor_role=user.role,
        target_type="validation_report",
        target_id=str(report.id),
        program_id=business.program_id,
        after={
            "id": str(report.id),
            "business_id": str(business_id),
            "confidence": report.confidence,
            "competitor_count": len(competitors_raw),
        },
    )

    return report
