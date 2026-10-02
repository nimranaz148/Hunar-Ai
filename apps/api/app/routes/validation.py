"""Validation routes for Idea Validator report (F-006 / PRD §5.2, §13.2, §36.12)."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.validation import (
    GenerateValidationReportRequest,
    ValidationReportResponse,
)
from app.services.validation import (
    generate_or_get_validation_report,
    get_validation_report,
)

router = APIRouter(
    prefix="/api/v1/businesses/{business_id}/validation",
    tags=["validation"],
)


@router.get(
    "",
    response_model=ValidationReportResponse,
    summary="Get business validation report",
)
async def get_report(
    business_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ValidationReportResponse:
    """Retrieve existing validation report for the business."""
    report = await get_validation_report(db, business_id, current_user)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Validation report has not been generated yet. Trigger generation first.",
        )
    return ValidationReportResponse.model_validate(report)


@router.post(
    "/generate",
    response_model=ValidationReportResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate or refresh validation report",
)
async def generate_report(
    business_id: uuid.UUID,
    payload: GenerateValidationReportRequest = GenerateValidationReportRequest(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ValidationReportResponse:
    """Trigger Idea Validator agent to produce or refresh market feasibility and competitor report."""
    report = await generate_or_get_validation_report(
        db, business_id, current_user, force_refresh=payload.force_refresh
    )
    return ValidationReportResponse.model_validate(report)
