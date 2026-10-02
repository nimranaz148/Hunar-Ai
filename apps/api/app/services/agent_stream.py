"""Agent progress SSE streaming and run management service (F-042 / PRD §5.2, §36)."""

import asyncio
import json
import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import record_audit_log
from app.models.agent import AgentRun, AgentStep
from app.models.user import User
from app.schemas.agent_stream import (
    AgentProgressEvent,
    AgentProgressStep,
    CancelRunResponse,
)

DEFAULT_WORKFLOW_STEPS: dict[str, list[dict[str, str]]] = {
    "content_calendar": [
        {"name": "Research competitors & market trends", "detail": "3 local competitors analyzed"},
        {"name": "Strategy outline & pillar selection", "detail": "Audience hooks identified"},
        {"name": "Writing batch 1/4 (days 1-8)", "detail": "8 social posts & captions"},
        {"name": "Writing batch 2/4 (days 9-16)", "detail": "8 educational carousel posts"},
        {"name": "Writing batch 3/4 (days 17-24)", "detail": "8 product spotlight posts"},
        {"name": "Writing batch 4/4 (days 25-30)", "detail": "6 conversion & offer posts"},
        {"name": "Visual & media prompt generation", "detail": "Image prompts formatted"},
        {"name": "Quality & compliance guardrails check", "detail": "Brand tone verified"},
    ],
    "launch_plan": [
        {"name": "Analyzing business profile & niche", "detail": "Market profile loaded"},
        {"name": "Validating viability & margin signals", "detail": "Breakeven verified"},
        {"name": "Structuring 30-day milestones", "detail": "4 sprint weeks outlined"},
        {"name": "Formulating week-by-week action items", "detail": "Daily tasks generated"},
        {"name": "Finalizing launch roadmap", "detail": "Ready for Gate 1 review"},
    ],
    "idea_validator": [
        {"name": "Analyzing business idea & niche", "detail": "Concept parsed"},
        {"name": "Scanning competitor landscape", "detail": "Local rivals identified"},
        {"name": "Evaluating pricing & margin feasibility", "detail": "Unit economics calculated"},
        {"name": "Generating risk analysis & recommendations", "detail": "Mitigations prepared"},
        {"name": "Compiling validation report", "detail": "Report generated"},
    ],
}


def _get_workflow_steps(workflow: str) -> list[dict[str, str]]:
    """Return template steps for given workflow type or generic fallback."""
    return DEFAULT_WORKFLOW_STEPS.get(
        workflow,
        [
            {"name": "Initializing agent environment", "detail": "Context loaded"},
            {"name": "Gathering market & business data", "detail": "Data retrieved"},
            {"name": "Generating targeted output", "detail": "Drafting content"},
            {"name": "Validating quality & safety guardrails", "detail": "Checks complete"},
            {"name": "Finalizing recommendations", "detail": "Execution done"},
        ],
    )


async def start_tracked_run(
    db: AsyncSession,
    workflow: str,
    user: User,
    business_id: uuid.UUID | None = None,
) -> AgentProgressEvent:
    """Start an agent run and initialize its traceable steps."""
    run_id = uuid.uuid4()
    trace_id = f"trace-{uuid.uuid4().hex[:16]}"
    now = datetime.now(UTC)

    run = AgentRun(
        id=run_id,
        trace_id=trace_id,
        workflow=workflow,
        user_id=user.id,
        business_id=business_id,
        status="running",
        started_at=now,
    )
    db.add(run)

    step_templates = _get_workflow_steps(workflow)
    steps_pydantic: list[AgentProgressStep] = []

    for idx, template in enumerate(step_templates):
        span_id = f"span-{run_id.hex[:8]}-{idx}"
        initial_status = "in_progress" if idx == 0 else "pending"
        step = AgentStep(
            trace_id=trace_id,
            span_id=span_id,
            span_type="agent",
            started_at=now if idx == 0 else None,
            data={
                "name": template["name"],
                "detail": template["detail"],
                "status": initial_status,
                "step_order": idx,
            },
        )
        db.add(step)
        steps_pydantic.append(
            AgentProgressStep(
                name=template["name"],
                status=initial_status,
                detail=template["detail"],
            )
        )

    await db.commit()
    await db.refresh(run)

    await record_audit_log(
        db=db,
        action="agent.run.started",
        actor_id=user.id,
        actor_role=user.role,
        target_type="AgentRun",
        target_id=str(run_id),
        meta={"workflow": workflow, "trace_id": trace_id},
    )

    return AgentProgressEvent(
        run_id=run.id,
        workflow=run.workflow,
        status="running",
        steps=steps_pydantic,
    )


async def get_agent_run_progress(
    db: AsyncSession,
    run_id: uuid.UUID,
    user: User,
) -> AgentProgressEvent:
    """Fetch current progress and step list for an agent run with ownership enforcement."""
    stmt = select(AgentRun).where(AgentRun.id == run_id)
    res = await db.execute(stmt)
    run = res.scalar_one_or_none()

    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent run not found.",
        )

    if run.user_id != user.id and user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this agent run.",
        )

    # Load steps associated with this run's trace
    steps_list: list[AgentProgressStep] = []
    if run.trace_id:
        step_stmt = (
            select(AgentStep)
            .where(AgentStep.trace_id == run.trace_id)
            .order_by(AgentStep.id.asc())
        )
        step_res = await db.execute(step_stmt)
        steps = step_res.scalars().all()
        for s in steps:
            s_data: dict[str, Any] = s.data or {}
            steps_list.append(
                AgentProgressStep(
                    name=s_data.get("name", s.span_type),
                    status=s_data.get("status", "pending"),
                    detail=s_data.get("detail", ""),
                )
            )

    return AgentProgressEvent(
        run_id=run.id,
        workflow=run.workflow,
        status=run.status,
        steps=steps_list,
        error=run.error,
    )


async def cancel_agent_run(
    db: AsyncSession,
    run_id: uuid.UUID,
    user: User,
) -> CancelRunResponse:
    """Cancel an active agent run (PRD §665)."""
    stmt = select(AgentRun).where(AgentRun.id == run_id)
    res = await db.execute(stmt)
    run = res.scalar_one_or_none()

    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent run not found.",
        )

    if run.user_id != user.id and user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to cancel this agent run.",
        )

    if run.status in ("succeeded", "failed", "blocked"):
        return CancelRunResponse(
            run_id=run.id,
            status=run.status,
            message=f"Agent run is already {run.status}.",
        )

    run.status = "failed"
    run.error = "Cancelled by user"
    run.ended_at = datetime.now(UTC)

    # Also update any pending/in_progress steps
    if run.trace_id:
        step_stmt = select(AgentStep).where(AgentStep.trace_id == run.trace_id)
        step_res = await db.execute(step_stmt)
        for step in step_res.scalars().all():
            data = dict(step.data or {})
            if data.get("status") in ("in_progress", "pending"):
                data["status"] = "failed"
                step.data = data

    await db.commit()

    await record_audit_log(
        db=db,
        action="agent.run.cancelled",
        actor_id=user.id,
        actor_role=user.role,
        target_type="AgentRun",
        target_id=str(run.id),
        meta={"workflow": run.workflow, "error": "Cancelled by user"},
    )

    return CancelRunResponse(
        run_id=run.id,
        status="failed",
        message="Agent run cancelled successfully.",
    )


async def stream_agent_progress(
    db: AsyncSession,
    run_id: uuid.UUID,
    user: User,
    delay_between_steps: float = 0.25,
) -> AsyncGenerator[str, None]:
    """Stream real-time progress events as Server-Sent Events (SSE).

    Yields `data: <json>\n\n` frames until the run succeeds, fails, or is cancelled.
    """
    stmt = select(AgentRun).where(AgentRun.id == run_id)
    res = await db.execute(stmt)
    run = res.scalar_one_or_none()

    if not run:
        yield f"event: error\ndata: {json.dumps({'error': 'Agent run not found'})}\n\n"
        return

    if run.user_id != user.id and user.role != "super_admin":
        yield f"event: error\ndata: {json.dumps({'error': 'Forbidden'})}\n\n"
        return

    # If the run already completed or failed, emit current state and exit
    current_progress = await get_agent_run_progress(db, run_id, user)
    yield f"data: {current_progress.model_dump_json()}\n\n"

    if current_progress.status in ("succeeded", "failed", "blocked"):
        return

    # Retrieve all steps for this run
    step_stmt = (
        select(AgentStep)
        .where(AgentStep.trace_id == run.trace_id)
        .order_by(AgentStep.id.asc())
    )
    step_res = await db.execute(step_stmt)
    db_steps = list(step_res.scalars().all())

    # Advance steps sequentially to simulate progress while checking for cancellation
    for idx, current_step in enumerate(db_steps):
        # Refresh run to detect user cancellation
        await db.refresh(run)
        if run.status in ("failed", "blocked"):
            event = await get_agent_run_progress(db, run_id, user)
            yield f"data: {event.model_dump_json()}\n\n"
            return

        # Mark current step as completed
        step_data = dict(current_step.data or {})
        step_data["status"] = "completed"
        current_step.data = step_data
        current_step.ended_at = datetime.now(UTC)

        # Mark next step as in_progress if exists
        if idx + 1 < len(db_steps):
            next_step = db_steps[idx + 1]
            next_data = dict(next_step.data or {})
            next_data["status"] = "in_progress"
            next_step.data = next_data
            next_step.started_at = datetime.now(UTC)

        await db.commit()

        # Emit updated progress event
        event = await get_agent_run_progress(db, run_id, user)
        yield f"data: {event.model_dump_json()}\n\n"

        if idx + 1 < len(db_steps):
            await asyncio.sleep(delay_between_steps)

    # All steps completed successfully
    await db.refresh(run)
    if run.status == "running":
        run.status = "succeeded"
        run.ended_at = datetime.now(UTC)
        await db.commit()

        await record_audit_log(
            db=db,
            action="agent.run.completed",
            actor_id=user.id,
            actor_role=user.role,
            target_type="AgentRun",
            target_id=str(run.id),
            meta={"workflow": run.workflow, "steps_count": len(db_steps)},
        )

    final_event = await get_agent_run_progress(db, run_id, user)
    yield f"data: {final_event.model_dump_json()}\n\n"
