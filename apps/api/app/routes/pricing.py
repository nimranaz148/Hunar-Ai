"""Pricing routes for cost-based pricing and break-even analysis (F-007 / PRD §5.2, §13.2, §36.13)."""

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.pricing import (
    PricingCalculateRequest,
    PricingResultResponse,
)
from app.services.pricing import (
    approve_pricing_result,
    calculate_business_pricing,
    get_pricing_results,
)

router = APIRouter(
    prefix="/api/v1/businesses/{business_id}/pricing",
    tags=["pricing"],
)


@router.get(
    "",
    response_model=list[PricingResultResponse],
    summary="Get business pricing results",
)
async def get_pricing(
    business_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PricingResultResponse]:
    """Retrieve all calculated pricing results for the business."""
    results = await get_pricing_results(db, business_id, current_user)
    return [PricingResultResponse.model_validate(r) for r in results]


@router.post(
    "/calculate",
    response_model=list[PricingResultResponse],
    status_code=status.HTTP_200_OK,
    summary="Calculate or recalculate pricing economics",
)
async def calculate_pricing(
    business_id: uuid.UUID,
    payload: PricingCalculateRequest = PricingCalculateRequest(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PricingResultResponse]:
    """Run Pricing Agent to calculate cost-based pricing, unit margins, and break-even."""
    results = await calculate_business_pricing(
        db, business_id, current_user, overhead_pkr=payload.overhead_pkr
    )
    return [PricingResultResponse.model_validate(r) for r in results]


@router.post(
    "/{pricing_id}/approve",
    response_model=PricingResultResponse,
    status_code=status.HTTP_200_OK,
    summary="Approve pricing result",
)
async def approve_pricing(
    business_id: uuid.UUID,
    pricing_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PricingResultResponse:
    """Approve a specific product pricing calculation."""
    result = await approve_pricing_result(db, business_id, pricing_id, current_user)
    return PricingResultResponse.model_validate(result)
