"""Onboarding routes for entrepreneur onboarding chat (F-003 / PRD §5.2, §30.1, §36.11)."""

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_role
from app.core.database import get_db
from app.models.user import User
from app.schemas.onboarding import (
    ChatMessageRequest,
    OnboardingMessagesResponse,
)
from app.services.onboarding import get_onboarding_state, stream_onboarding_chat

router = APIRouter(
    prefix="/api/v1/onboarding",
    tags=["onboarding"],
    dependencies=[Depends(require_role("entrepreneur"))],
)


@router.get(
    "/messages",
    response_model=OnboardingMessagesResponse,
    summary="Get onboarding chat history",
)
async def get_messages(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("entrepreneur")),
) -> OnboardingMessagesResponse:
    """Retrieve chat history and current business creation status
    for the authenticated entrepreneur.
    """
    return await get_onboarding_state(db, current_user.id)


@router.post(
    "/chat",
    summary="Send chat message and stream Intake Agent response via SSE",
    responses={
        200: {
            "content": {"text/event-stream": {}},
            "description": "Real-time SSE stream with status, tokens, and completion events.",
        }
    },
)
async def post_chat_stream(
    payload: ChatMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("entrepreneur")),
) -> StreamingResponse:
    """Send a message to Hunar Intake Agent and stream response chunks via Server-Sent Events."""
    generator = stream_onboarding_chat(
        db=db,
        user=current_user,
        user_message_text=payload.message,
    )
    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
