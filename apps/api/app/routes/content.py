"""Content Outline & Calendar endpoints (F-010, F-011 / PRD §12.1, §12.3, §36.16)."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.core.database import get_db
from app.models.user import User
from app.schemas.content import (
    ContentCalendarViewResponse,
    ContentItemResponse,
    ContentOutlineActionResponse,
    ContentOutlineGateResponse,
    MarkPostAsPostedRequest,
    ReviseContentOutlineRequest,
    UpdateContentItemRequest,
    UpdateContentItemStatusRequest,
)
from app.services.content import (
    approve_content_outline,
    get_calendar_view,
    get_content_item,
    get_content_outline_gate,
    get_today_content_item,
    mark_item_as_posted,
    revise_content_outline,
    update_content_item,
    update_content_item_status,
)

router = APIRouter(
    prefix="/api/v1/businesses/{business_id}/content",
    tags=["Content"],
    dependencies=[Depends(require_role("entrepreneur", "super_admin"))],
)


@router.get(
    "/outline",
    response_model=ContentOutlineGateResponse,
    summary="Get Gate 2 Content Outline and Research Rationale",
    status_code=status.HTTP_200_OK,
)
async def get_outline_gate(
    business_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ContentOutlineGateResponse:
    """Retrieve 30-day content outline briefs and competitor research for Gate 2 review."""
    return await get_content_outline_gate(db=db, business_id=business_id, user=current_user)


@router.post(
    "/outline/approve",
    response_model=ContentOutlineActionResponse,
    summary="Approve Gate 2 Content Outline",
    status_code=status.HTTP_200_OK,
)
async def approve_outline(
    business_id: uuid.UUID,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ContentOutlineActionResponse:
    """Approve the 30-day content outline and trigger Content Writer & Visual Prompt agents."""
    req_id = getattr(request.state, "request_id", None)
    return await approve_content_outline(
        db=db,
        business_id=business_id,
        user=current_user,
        request_id=req_id,
    )


@router.post(
    "/outline/revise",
    response_model=ContentOutlineActionResponse,
    summary="Request Revisions on Gate 2 Content Outline",
    status_code=status.HTTP_200_OK,
)
async def revise_outline(
    business_id: uuid.UUID,
    payload: ReviseContentOutlineRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ContentOutlineActionResponse:
    """Request changes to the content outline with specific feedback notes."""
    req_id = getattr(request.state, "request_id", None)
    return await revise_content_outline(
        db=db,
        business_id=business_id,
        user=current_user,
        notes=payload.notes,
        request_id=req_id,
    )


@router.get(
    "/calendar",
    response_model=ContentCalendarViewResponse,
    summary="Get 30-Day Content Calendar View",
    status_code=status.HTTP_200_OK,
)
async def get_calendar(
    business_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    status_filter: Annotated[str | None, Query(alias="status")] = None,
    format_filter: Annotated[str | None, Query(alias="format")] = None,
    pillar_filter: Annotated[str | None, Query(alias="pillar")] = None,
) -> ContentCalendarViewResponse:
    """Retrieve 30-day content calendar items with progress statistics and optional filtering."""
    return await get_calendar_view(
        db=db,
        business_id=business_id,
        user=current_user,
        status_filter=status_filter,
        format_filter=format_filter,
        pillar_filter=pillar_filter,
    )


@router.patch(
    "/items/{item_id}/status",
    response_model=ContentItemResponse,
    summary="Update Content Item Status",
    status_code=status.HTTP_200_OK,
)
async def update_item_status(
    business_id: uuid.UUID,
    item_id: uuid.UUID,
    payload: UpdateContentItemStatusRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ContentItemResponse:
    """Update status of a content item (draft, approved, posted, skipped) with audit recording."""
    req_id = getattr(request.state, "request_id", None)
    return await update_content_item_status(
        db=db,
        business_id=business_id,
        item_id=item_id,
        user=current_user,
        new_status=payload.status,
        post_url=payload.post_url,
        request_id=req_id,
    )


@router.get(
    "/items/{item_id}",
    response_model=ContentItemResponse,
    summary="Get Single Content Item Detail",
    status_code=status.HTTP_200_OK,
)
async def get_item(
    business_id: uuid.UUID,
    item_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ContentItemResponse:
    """Retrieve details for a single content item (F-012)."""
    return await get_content_item(
        db=db,
        business_id=business_id,
        item_id=item_id,
        user=current_user,
    )


@router.put(
    "/items/{item_id}",
    response_model=ContentItemResponse,
    summary="Update Content Item Details",
    status_code=status.HTTP_200_OK,
)
async def update_item(
    business_id: uuid.UUID,
    item_id: uuid.UUID,
    payload: UpdateContentItemRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ContentItemResponse:
    """Full update for content item captions, hashtags, prompts and status (F-012)."""
    req_id = getattr(request.state, "request_id", None)
    return await update_content_item(
        db=db,
        business_id=business_id,
        item_id=item_id,
        user=current_user,
        payload=payload,
        request_id=req_id,
    )


@router.get(
    "/today",
    response_model=ContentItemResponse,
    summary="Get Today Content Item",
    status_code=status.HTTP_200_OK,
)
async def get_today_item(
    business_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ContentItemResponse:
    """Retrieve post scheduled for today, or next upcoming approved post (F-013)."""
    return await get_today_content_item(
        db=db,
        business_id=business_id,
        user=current_user,
    )


@router.post(
    "/items/{item_id}/post",
    response_model=ContentItemResponse,
    summary="Mark Content Item as Posted",
    status_code=status.HTTP_200_OK,
)
async def post_item(
    business_id: uuid.UUID,
    item_id: uuid.UUID,
    payload: MarkPostAsPostedRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ContentItemResponse:
    """Mark a content item as published on social media with audit record (F-013, W-003)."""
    req_id = getattr(request.state, "request_id", None)
    return await mark_item_as_posted(
        db=db,
        business_id=business_id,
        item_id=item_id,
        user=current_user,
        post_url=payload.post_url,
        request_id=req_id,
    )


