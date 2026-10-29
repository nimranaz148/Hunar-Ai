"""Proposals and Weekly Review routes for Human Gate 3 (Task 50 / F-017 / PRD §5.2, §10 W-004, §13.2 line 1044-1046, §36.7)."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_role
from app.core.database import get_db
from app.models.user import User
from app.schemas.weekly_review import (
    ApproveProposalRequest,
    ProposalDetailResponse,
    RejectProposalRequest,
)
from app.services.weekly_review import (
    approve_proposal,
    get_latest_weekly_review_proposal,
    get_proposal,
    list_proposals,
    reject_proposal,
    trigger_weekly_coach_review,
)

proposals_router = APIRouter(
    tags=["proposals"],
)


@proposals_router.get(
    "/api/v1/proposals",
    response_model=list[ProposalDetailResponse],
    summary="List agent proposals awaiting human gate decisions (PRD §13.2 line 1044)",
)
async def get_proposals_list(
    business_id: Annotated[uuid.UUID | None, Query(description="Filter by business ID")] = None,
    gate_type: Annotated[
        str | None,
        Query(description="Filter by gate type (plan_approval, content_outline, weekly_review)"),
    ] = None,
    status_filter: Annotated[
        str | None,
        Query(alias="status", description="Filter by status (pending, approved, rejected)"),
    ] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("entrepreneur", "super_admin")),
) -> list[ProposalDetailResponse]:
    """Retrieve proposals with owner scoping and optional gate_type/status filtering."""
    items = await list_proposals(
        db,
        user=current_user,
        business_id=business_id,
        gate_type=gate_type,
        status_filter=status_filter,
    )
    return [ProposalDetailResponse.model_validate(p) for p in items]


@proposals_router.get(
    "/api/v1/proposals/{proposal_id}",
    response_model=ProposalDetailResponse,
    summary="Get single proposal detail",
)
async def get_single_proposal(
    proposal_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("entrepreneur", "super_admin")),
) -> ProposalDetailResponse:
    """Retrieve details for a specific proposal."""
    proposal = await get_proposal(db, proposal_id, current_user)
    return ProposalDetailResponse.model_validate(proposal)


@proposals_router.post(
    "/api/v1/proposals/{proposal_id}/approve",
    response_model=ProposalDetailResponse,
    summary="Approve proposal at Human Gate 3 (PRD §13.2 line 1045)",
)
async def approve_single_proposal(
    proposal_id: uuid.UUID,
    request: Request,
    payload: ApproveProposalRequest = ApproveProposalRequest(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("entrepreneur", "super_admin")),
) -> ProposalDetailResponse:
    """Approve an agent proposal, update status, apply adjustments to upcoming content, and record audit log."""
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    req_id = getattr(request.state, "request_id", None)
    proposal = await approve_proposal(
        db,
        proposal_id=proposal_id,
        user=current_user,
        comments=payload.comments,
        request_id=req_id,
        ip=client_ip,
        user_agent=user_agent,
    )
    return ProposalDetailResponse.model_validate(proposal)


@proposals_router.post(
    "/api/v1/proposals/{proposal_id}/reject",
    response_model=ProposalDetailResponse,
    summary="Reject proposal at Human Gate 3 (PRD §13.2 line 1046)",
)
async def reject_single_proposal(
    proposal_id: uuid.UUID,
    payload: RejectProposalRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("entrepreneur", "super_admin")),
) -> ProposalDetailResponse:
    """Reject an agent proposal with feedback reason and record audit log."""
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    req_id = getattr(request.state, "request_id", None)
    proposal = await reject_proposal(
        db,
        proposal_id=proposal_id,
        user=current_user,
        reason=payload.reason,
        request_id=req_id,
        ip=client_ip,
        user_agent=user_agent,
    )
    return ProposalDetailResponse.model_validate(proposal)


@proposals_router.post(
    "/api/v1/businesses/{business_id}/weekly-review/trigger",
    response_model=ProposalDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Trigger Weekly Coach Review (PRD §10 W-004, F-017)",
)
async def trigger_weekly_review(
    business_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("entrepreneur", "super_admin")),
) -> ProposalDetailResponse:
    """Analyze logged performance metrics and trigger Weekly Coach agent to draft Gate 3 proposals."""
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    req_id = getattr(request.state, "request_id", None)
    proposal = await trigger_weekly_coach_review(
        db,
        business_id=business_id,
        user=current_user,
        request_id=req_id,
        ip=client_ip,
        user_agent=user_agent,
    )
    return ProposalDetailResponse.model_validate(proposal)


@proposals_router.get(
    "/api/v1/businesses/{business_id}/weekly-review/latest",
    response_model=ProposalDetailResponse | None,
    summary="Get latest weekly review proposal for business",
)
async def get_latest_weekly_review(
    business_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("entrepreneur", "super_admin")),
) -> ProposalDetailResponse | None:
    """Retrieve the most recent weekly review proposal for this business."""
    proposal = await get_latest_weekly_review_proposal(db, business_id, current_user)
    if not proposal:
        return None
    return ProposalDetailResponse.model_validate(proposal)
