"""Business service layer for profile management (F-004 / PRD §10, §13.2, §14.1)."""

import uuid
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import record_audit_log
from app.models.business import Business
from app.models.user import User
from app.schemas.business import UpdateBusinessRequest


async def get_my_business(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> Business | None:
    """Retrieve business owned by the user."""
    stmt = select(Business).where(Business.owner_id == user_id)
    res = await db.execute(stmt)
    return res.scalar_one_or_none()


async def get_business_by_id(
    db: AsyncSession,
    business_id: uuid.UUID,
    user: User,
) -> Business:
    """Retrieve business by ID with ownership/admin access check."""
    stmt = select(Business).where(Business.id == business_id)
    res = await db.execute(stmt)
    business = res.scalar_one_or_none()

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found",
        )

    # Scoping check: entrepreneur can only access own business
    if user.role != "super_admin" and business.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this business",
        )

    return business


async def update_business_profile(
    db: AsyncSession,
    business_id: uuid.UUID,
    user: User,
    data: UpdateBusinessRequest,
) -> Business:
    """Update business profile with ownership enforcement and audit logging."""
    business = await get_business_by_id(db, business_id, user)

    # Only the owner can edit business profile
    if business.owner_id != user.id and user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the business owner can edit this business profile",
        )

    before_state: dict[str, Any] = {
        "name": business.name,
        "niche": business.niche,
        "city": business.city,
        "area": business.area,
        "budget_pkr": business.budget_pkr,
        "hours_per_week": business.hours_per_week,
        "tone": business.tone,
        "languages": business.languages,
        "platforms": business.platforms,
        "target_customer": business.target_customer,
    }

    update_dict = data.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        if val is not None:
            setattr(business, field, val)

    await db.flush()

    after_state: dict[str, Any] = {
        "name": business.name,
        "niche": business.niche,
        "city": business.city,
        "area": business.area,
        "budget_pkr": business.budget_pkr,
        "hours_per_week": business.hours_per_week,
        "tone": business.tone,
        "languages": business.languages,
        "platforms": business.platforms,
        "target_customer": business.target_customer,
    }

    await record_audit_log(
        db=db,
        actor_id=user.id,
        actor_role=user.role,
        action="business.updated",
        target_type="business",
        target_id=str(business.id),
        program_id=business.program_id,
        before=before_state,
        after=after_state,
    )

    await db.commit()
    await db.refresh(business)
    return business
