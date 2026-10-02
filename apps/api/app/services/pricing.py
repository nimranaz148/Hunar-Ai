"""Pricing service layer for cost-based pricing and break-even analysis (F-007 / PRD §5.2, §36.13)."""

import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.pricing import run_pricing_agent
from app.core.audit import record_audit_log
from app.models.business import PricingResult, Product
from app.models.user import User
from app.services.business import get_business_by_id


async def get_pricing_results(
    db: AsyncSession,
    business_id: uuid.UUID,
    user: User,
) -> list[PricingResult]:
    """Retrieve all pricing calculations for a business."""
    await get_business_by_id(db, business_id, user)

    stmt = (
        select(PricingResult)
        .where(PricingResult.business_id == business_id)
        .order_by(PricingResult.created_at.asc())
    )
    res = await db.execute(stmt)
    return list(res.scalars().all())


async def calculate_business_pricing(
    db: AsyncSession,
    business_id: uuid.UUID,
    user: User,
    overhead_pkr: int | None = None,
) -> list[PricingResult]:
    """Run Pricing Agent and persist deterministic unit economics."""
    business = await get_business_by_id(db, business_id, user)

    if business.owner_id != user.id and user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the business owner can calculate pricing economics.",
        )

    # Determine monthly overhead estimate
    effective_overhead = (
        overhead_pkr
        if overhead_pkr is not None and overhead_pkr > 0
        else max(5000, business.budget_pkr // 4)
    )

    # Fetch products
    prod_stmt = select(Product).where(Product.business_id == business_id)
    prod_res = await db.execute(prod_stmt)
    products = list(prod_res.scalars().all())

    products_data: list[dict[str, Any]] = [
        {
            "id": p.id,
            "name": p.name,
            "cost_inputs": p.cost_inputs,
            "price_pkr": p.price_pkr,
        }
        for p in products
    ]

    agent_output = await run_pricing_agent(
        business_name=business.name,
        niche=business.niche,
        city=business.city,
        products_data=products_data,
        overhead_pkr=effective_overhead,
    )

    # Clean existing pricing results for fresh calculation
    await db.execute(delete(PricingResult).where(PricingResult.business_id == business_id))

    new_results: list[PricingResult] = []
    for item in agent_output.items:
        prod_uuid = uuid.UUID(item.product_id) if item.product_id else None
        res_record = PricingResult(
            id=uuid.uuid4(),
            business_id=business_id,
            product_id=prod_uuid,
            product_name=item.product_name,
            assumptions=item.assumptions,
            unit_cost=item.unit_cost,
            price=item.price,
            margin_pct=item.margin_pct,
            break_even_units=item.break_even_units,
            risk_flags=item.risk_flags,
            notes=item.notes,
            created_at=datetime.now(UTC),
        )
        db.add(res_record)
        new_results.append(res_record)

    await db.flush()

    # Record audit log
    await record_audit_log(
        db=db,
        action="pricing.calculated",
        actor_id=user.id,
        actor_role=user.role,
        target_type="pricing_result",
        target_id=str(business_id),
        program_id=business.program_id,
        after={
            "business_id": str(business_id),
            "calculated_count": len(new_results),
            "overhead_pkr": effective_overhead,
        },
    )

    return new_results


async def approve_pricing_result(
    db: AsyncSession,
    business_id: uuid.UUID,
    pricing_id: uuid.UUID,
    user: User,
) -> PricingResult:
    """Approve a specific pricing calculation (Human Gate 1 sub-step / PRD §10 W-001)."""
    business = await get_business_by_id(db, business_id, user)

    if business.owner_id != user.id and user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the business owner can approve pricing economics.",
        )

    stmt = select(PricingResult).where(
        PricingResult.id == pricing_id,
        PricingResult.business_id == business_id,
    )
    res = await db.execute(stmt)
    pricing = res.scalar_one_or_none()

    if not pricing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pricing result {pricing_id} not found for this business.",
        )

    before_approved = pricing.approved_at
    pricing.approved_at = datetime.now(UTC)
    pricing.updated_at = datetime.now(UTC)

    await db.flush()
    await db.refresh(pricing)

    await record_audit_log(
        db=db,
        action="pricing.approved",
        actor_id=user.id,
        actor_role=user.role,
        target_type="pricing_result",
        target_id=str(pricing.id),
        program_id=business.program_id,
        before={"approved_at": before_approved.isoformat() if before_approved else None},
        after={"approved_at": pricing.approved_at.isoformat() if pricing.approved_at else None},
    )

    return pricing
