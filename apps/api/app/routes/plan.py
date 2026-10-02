"""Plan routes for Launch Plan, Human Gate 1 Approval, and Task Checklist (F-008, F-009 / PRD §5.2, §13.2, §36.7, §36.14)."""

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.plan import (
    ApprovePlanRequest,
    Gate1OverviewResponse,
    LaunchPlanResponse,
    PlanTaskResponse,
    RejectPlanRequest,
    UpdateTaskStatusRequest,
)
from app.services.plan import (
    approve_launch_plan,
    get_gate1_overview,
    get_or_create_launch_plan,
    reject_launch_plan,
    update_task_status,
)

router = APIRouter(
    prefix="/api/v1/businesses/{business_id}/plan",
    tags=["plan"],
)


@router.get(
    "",
    response_model=LaunchPlanResponse,
    summary="Get 30-day launch plan",
)
async def get_plan(
    business_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LaunchPlanResponse:
    """Retrieve 30-day launch plan with tasks for the business."""
    plan = await get_or_create_launch_plan(db, business_id, current_user)
    return LaunchPlanResponse.model_validate(plan)


@router.get(
    "/gate1",
    response_model=Gate1OverviewResponse,
    summary="Get Human Gate 1 approval overview",
)
async def get_gate1(
    business_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Gate1OverviewResponse:
    """Retrieve consolidated Plan Approval Gate (Wireframe §30.2) payload."""
    return await get_gate1_overview(db, business_id, current_user)


@router.post(
    "/generate",
    response_model=LaunchPlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate or refresh 30-day launch plan",
)
async def generate_plan(
    business_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LaunchPlanResponse:
    """Trigger Launch Planner agent to construct or regenerate 30-day roadmap."""
    plan = await get_or_create_launch_plan(db, business_id, current_user, force_refresh=True)
    return LaunchPlanResponse.model_validate(plan)


@router.post(
    "/approve",
    response_model=LaunchPlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Approve launch plan at Human Gate 1",
)
async def approve_plan(
    business_id: uuid.UUID,
    payload: ApprovePlanRequest = ApprovePlanRequest(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LaunchPlanResponse:
    """Approve the business launch plan and pricing, unlocking task execution."""
    plan = await approve_launch_plan(db, business_id, current_user, comments=payload.comments)
    return LaunchPlanResponse.model_validate(plan)


@router.post(
    "/reject",
    response_model=LaunchPlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Request revisions on launch plan at Human Gate 1",
)
async def reject_plan(
    business_id: uuid.UUID,
    payload: RejectPlanRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LaunchPlanResponse:
    """Reject the plan with feedback to trigger revisions."""
    plan = await reject_launch_plan(db, business_id, current_user, reason=payload.reason)
    return LaunchPlanResponse.model_validate(plan)


@router.patch(
    "/tasks/{task_id}",
    response_model=PlanTaskResponse,
    summary="Update launch task status",
)
async def update_task(
    business_id: uuid.UUID,
    task_id: uuid.UUID,
    payload: UpdateTaskStatusRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PlanTaskResponse:
    """Update status of an individual launch task (pending, in_progress, completed, skipped)."""
    task = await update_task_status(db, business_id, task_id, payload.status, current_user)
    return PlanTaskResponse.model_validate(task)
