"""Business routes for entrepreneur business profile (F-004 / PRD §5.2, §13.2)."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.business import BusinessResponse, UpdateBusinessRequest
from app.schemas.dashboard import EntrepreneurDashboardResponse
from app.services.business import (
    get_business_by_id,
    get_my_business,
    update_business_profile,
)
from app.services.dashboard import get_entrepreneur_dashboard

router = APIRouter(
    prefix="/api/v1/businesses",
    tags=["business"],
)


@router.get(
    "",
    response_model=BusinessResponse,
    summary="Get current entrepreneur's business profile",
)
async def get_current_user_business(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BusinessResponse:
    """Retrieve the business profile owned by the authenticated entrepreneur."""
    business = await get_my_business(db, current_user.id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile has not been created yet.",
        )
    return BusinessResponse.model_validate(business)


@router.get(
    "/{business_id}",
    response_model=BusinessResponse,
    summary="Get business profile by ID",
)
async def get_business(
    business_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BusinessResponse:
    """Retrieve business profile by ID (owner or super_admin only)."""
    business = await get_business_by_id(db, business_id, current_user)
    return BusinessResponse.model_validate(business)


@router.patch(
    "/{business_id}",
    response_model=BusinessResponse,
    summary="Update business profile",
)
async def update_business(
    business_id: uuid.UUID,
    payload: UpdateBusinessRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BusinessResponse:
    """Update business profile details (owner only)."""
    updated = await update_business_profile(db, business_id, current_user, payload)
    return BusinessResponse.model_validate(updated)


@router.get(
    "/{business_id}/dashboard",
    response_model=EntrepreneurDashboardResponse,
    summary="Get Entrepreneur Home Dashboard (D-001)",
    status_code=status.HTTP_200_OK,
)
async def get_dashboard(
    business_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> EntrepreneurDashboardResponse:
    """Retrieve consolidated KPIs, 7-day engagement trend, today's post spotlight, and upcoming tasks."""
    return await get_entrepreneur_dashboard(db=db, business_id=business_id, user=current_user)

