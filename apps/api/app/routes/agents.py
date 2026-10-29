"""Agents routes for SSE streaming progress overlay and workflow execution (F-042 / PRD §5.2, §36)."""

import uuid

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.core.database import get_db
from app.models.user import User
from app.schemas.agent_stream import (
    AgentProgressEvent,
    CancelRunResponse,
    StartAgentRunRequest,
)
from app.schemas.guide import GuideRequest, GuideResponse, MentorMatchResponse
from app.services.agent_stream import (
    cancel_agent_run,
    get_agent_run_progress,
    start_tracked_run,
    stream_agent_progress,
)
from app.services.guide import ask_guide, match_mentors

router = APIRouter(
    prefix="/api/v1/agents",
    tags=["Agents"],
)


@router.post(
    "/runs",
    response_model=AgentProgressEvent,
    status_code=status.HTTP_201_CREATED,
    summary="Start an agent workflow run",
)
async def start_run(
    payload: StartAgentRunRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AgentProgressEvent:
    """Start an agent run and return the initial tracking event."""
    return await start_tracked_run(
        db=db,
        workflow=payload.workflow,
        user=current_user,
    )


@router.get(
    "/runs/{run_id}/stream",
    summary="Stream real-time agent execution progress via SSE",
)
async def stream_run(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """Server-Sent Events endpoint streaming real-time step progress (PRD §648-669)."""
    return StreamingResponse(
        stream_agent_progress(db=db, run_id=run_id, user=current_user),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get(
    "/runs/{run_id}",
    response_model=AgentProgressEvent,
    summary="Get current agent run progress",
)
async def get_run_progress(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AgentProgressEvent:
    """Polling fallback and single-query progress check for an agent run."""
    return await get_agent_run_progress(
        db=db,
        run_id=run_id,
        user=current_user,
    )


@router.post(
    "/runs/{run_id}/cancel",
    response_model=CancelRunResponse,
    summary="Cancel an in-progress agent run",
)
async def cancel_run(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CancelRunResponse:
    """Cancel an active agent run (PRD §665)."""
    return await cancel_agent_run(
        db=db,
        run_id=run_id,
        user=current_user,
    )


@router.post(
    "/guide",
    response_model=GuideResponse,
    summary="Ask Hunar Guide (orchestrator with specialist handoffs)",
)
async def guide(
    payload: GuideRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("entrepreneur", "super_admin")),
) -> GuideResponse:
    """Route a question to specialist agents via handoffs and agent-tools; traced as a run."""
    return await ask_guide(db, current_user, payload.message)


@router.get(
    "/mentor-match",
    response_model=MentorMatchResponse,
    summary="Recommend mentors for a business (Mentor Matcher)",
)
async def mentor_match(
    business_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("entrepreneur", "super_admin")),
) -> MentorMatchResponse:
    """Rank active mentors for the caller's own business."""
    return await match_mentors(db, current_user, business_id)
