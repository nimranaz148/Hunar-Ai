"""Business logic and agent orchestration for entrepreneur onboarding (F-003 / PRD §10, §36.11)."""

import json
import logging
import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.intake import process_intake_chat
from app.agents.runner import run_agent
from app.core.audit import record_audit_log
from app.models.business import Business, OnboardingMessage, Product
from app.models.user import User
from app.schemas.onboarding import (
    OnboardingMessageItem,
    OnboardingMessagesResponse,
)

logger = logging.getLogger(__name__)


async def get_onboarding_state(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> OnboardingMessagesResponse:
    """Fetch existing chat history and check if business is created."""
    # 1. Check existing business
    stmt_biz = select(Business).where(Business.owner_id == user_id)
    biz_res = await db.execute(stmt_biz)
    business = biz_res.scalar_one_or_none()

    # 2. Fetch messages ordered by created_at
    stmt_msgs = (
        select(OnboardingMessage)
        .where(OnboardingMessage.user_id == user_id)
        .order_by(OnboardingMessage.created_at.asc())
    )
    msg_res = await db.execute(stmt_msgs)
    db_messages = list(msg_res.scalars().all())

    message_items = [
        OnboardingMessageItem(
            id=m.id,
            role=m.role,
            content=m.content,
            meta=m.meta or {},
            created_at=m.created_at or datetime.now(UTC),
        )
        for m in db_messages
    ]

    return OnboardingMessagesResponse(
        messages=message_items,
        is_profile_complete=business is not None,
        business_id=business.id if business else None,
    )


async def stream_onboarding_chat(
    db: AsyncSession,
    user: User,
    user_message_text: str,
) -> AsyncGenerator[str, None]:
    """Execute Intake Agent, persist chat messages, create business upon completion,
    and stream SSE.
    """

    # 1. Save user's message
    user_msg = OnboardingMessage(
        user_id=user.id,
        role="user",
        content=user_message_text,
    )
    db.add(user_msg)
    await db.flush()

    # 2. Check if business already exists
    stmt_biz = select(Business).where(Business.owner_id == user.id)
    biz_res = await db.execute(stmt_biz)
    existing_business = biz_res.scalar_one_or_none()

    # 3. Retrieve conversation history
    stmt_history = (
        select(OnboardingMessage)
        .where(OnboardingMessage.user_id == user.id)
        .order_by(OnboardingMessage.created_at.asc())
    )
    history_res = await db.execute(stmt_history)
    history_records = list(history_res.scalars().all())

    history_payload = [{"role": m.role, "content": m.content} for m in history_records]

    # Initial SSE event indicating thinking state
    thinking_payload = {
        "event": "status",
        "status": "thinking",
        "text": "Agent is thinking...",
    }
    yield f"data: {json.dumps(thinking_payload)}\n\n"

    # 4. Run Intake Agent wrapped in agent runner for tracing & concurrency tracking
    captured: dict[str, Any] = {}

    async def _execute_agent() -> Any:
        captured["output"] = await process_intake_chat(history_payload, user_name=user.name)
        return captured["output"]

    agent_run = await run_agent(
        db=db,
        workflow="onboarding",
        user_id=user.id,
        business_id=existing_business.id if existing_business else None,
        execute_fn=_execute_agent,
        input_summary=user_message_text[:100],
    )

    # Reuse the result from the traced run (running the agent twice doubled LLM cost and latency)
    agent_output = captured["output"]
    reply_text = agent_output.reply
    is_complete = agent_output.is_complete
    profile = agent_output.profile

    # Stream chunks of the response to give immediate feedback
    chunk_size = 20
    for i in range(0, len(reply_text), chunk_size):
        chunk = reply_text[i : i + chunk_size]
        yield f"data: {json.dumps({'event': 'chunk', 'text': chunk})}\n\n"

    created_business_id: uuid.UUID | None = existing_business.id if existing_business else None

    # 5. If profile is complete and business doesn't exist, create Business & Product
    if is_complete and profile and not existing_business:
        new_business = Business(
            owner_id=user.id,
            program_id=user.program_id,
            name=profile.name,
            niche=profile.niche,
            city=profile.city,
            area=profile.area,
            budget_pkr=profile.budget_pkr,
            hours_per_week=profile.hours_per_week,
            tone=profile.tone,
            languages=profile.languages,
            platforms=profile.platforms,
            target_customer=profile.target_customer,
        )
        db.add(new_business)
        await db.flush()
        created_business_id = new_business.id

        # Update the agent run with business_id
        agent_run.business_id = new_business.id

        # Create starter product per F-005
        starter_product = Product(
            business_id=new_business.id,
            name=f"Standard {profile.niche.title().replace('_', ' ')} Offering",
            description=f"Core offering for {profile.name}",
            cost_inputs=[{"item": "Raw materials", "amount_pkr": int(profile.budget_pkr * 0.4)}],
            price_pkr=int(profile.budget_pkr * 0.8),
        )
        db.add(starter_product)
        await db.flush()

        # Audit business creation
        await record_audit_log(
            db=db,
            actor_id=user.id,
            actor_role=user.role,
            action="business.created",
            target_type="business",
            target_id=str(new_business.id),
            program_id=user.program_id,
            after={
                "name": profile.name,
                "niche": profile.niche,
                "city": profile.city,
                "budget_pkr": profile.budget_pkr,
            },
        )
        complete_data = {"event": "profile_complete", "business_id": str(created_business_id)}
        yield f"data: {json.dumps(complete_data)}\n\n"

    # 6. Save assistant's reply in database
    asst_msg = OnboardingMessage(
        user_id=user.id,
        role="assistant",
        content=reply_text,
        meta={
            "is_complete": is_complete,
            "business_id": str(created_business_id) if created_business_id else None,
            "trace_id": agent_run.trace_id,
        },
    )
    db.add(asst_msg)
    await db.commit()

    # Final event
    final_payload = {
        "event": "done",
        "reply": reply_text,
        "is_complete": is_complete or (existing_business is not None),
        "business_id": str(created_business_id) if created_business_id else None,
    }
    yield f"data: {json.dumps(final_payload)}\n\n"
