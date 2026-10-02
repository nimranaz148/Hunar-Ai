"""Agent execution runner managing concurrency semaphore and run lifecycle (PRD §12.3, §36.18)."""

import asyncio
import logging
import uuid
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.config import agent_config
from app.agents.tracing import DbTraceProcessor
from app.core.audit import record_audit_log
from app.models.agent import AgentRun

logger = logging.getLogger(__name__)

# Global concurrency semaphore controlling parallel agent workflows
_concurrency_semaphore: asyncio.Semaphore | None = None


def get_agent_semaphore() -> asyncio.Semaphore:
    """Get or initialize the concurrency semaphore (max 5 parallel runs)."""
    global _concurrency_semaphore
    if _concurrency_semaphore is None:
        _concurrency_semaphore = asyncio.Semaphore(agent_config.max_concurrent)
    return _concurrency_semaphore


class KillSwitchActiveError(Exception):
    """Raised when an agent run is attempted while the emergency kill switch is active."""

    pass


async def run_agent(
    db: AsyncSession,
    workflow: str,
    user_id: uuid.UUID | None,
    business_id: uuid.UUID | None,
    execute_fn: Callable[[], Awaitable[Any]],
    input_summary: str | None = None,
    trace_processor: DbTraceProcessor | None = None,
) -> AgentRun:
    """Execute an agent workflow with concurrency management and lifecycle tracking."""
    trace_id = f"trace_{uuid.uuid4().hex[:16]}"
    now = datetime.now(UTC)

    # 1. Kill Switch Check
    if agent_config.kill_switch:
        blocked_run = AgentRun(
            trace_id=trace_id,
            workflow=workflow,
            user_id=user_id,
            business_id=business_id,
            status="blocked",
            input_summary=input_summary,
            error="Execution blocked: emergency kill switch is active.",
            started_at=now,
            ended_at=now,
        )
        db.add(blocked_run)
        await db.flush()

        await record_audit_log(
            db=db,
            actor_id=user_id,
            action="agent.run.blocked",
            target_type="agent_run",
            target_id=str(blocked_run.id),
            meta={"workflow": workflow, "reason": "kill_switch_active"},
        )
        raise KillSwitchActiveError(
            "Agent execution is currently disabled by system administrator."
        )

    # 2. Initialize in Queued state
    agent_run = AgentRun(
        trace_id=trace_id,
        workflow=workflow,
        user_id=user_id,
        business_id=business_id,
        status="queued",
        input_summary=input_summary,
    )
    db.add(agent_run)
    await db.flush()

    sem = get_agent_semaphore()

    # If semaphore is currently fully acquired, the run remains in 'queued' until a slot opens
    async with sem:
        # Transition: queued -> running
        agent_run.status = "running"
        agent_run.started_at = datetime.now(UTC)
        await db.flush()

        await record_audit_log(
            db=db,
            actor_id=user_id,
            action="agent.run.started",
            target_type="agent_run",
            target_id=str(agent_run.id),
            meta={"workflow": workflow, "trace_id": trace_id},
        )

        try:
            result = await execute_fn()

            # Transition: running -> succeeded
            agent_run.status = "succeeded"
            agent_run.ended_at = datetime.now(UTC)
            agent_run.output_summary = str(result)[:1000] if result else None
            await db.flush()

            # Flush spans to agent_steps
            if trace_processor:
                await trace_processor.flush_to_db(db)

            return agent_run

        except Exception as exc:
            logger.exception("Agent execution failed for workflow %s: %s", workflow, exc)
            # Transition: running -> failed
            agent_run.status = "failed"
            agent_run.ended_at = datetime.now(UTC)
            agent_run.error = str(exc)[:1000]
            await db.flush()

            if trace_processor:
                await trace_processor.flush_to_db(db)

            raise
