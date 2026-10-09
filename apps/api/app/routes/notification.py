"""Notifications API endpoints (Task 55 / F-038 / PRD §13.2 line 1082, §14.2)."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.notification import (
    NotificationListResponse,
    NotificationReadActionResponse,
    NotificationReadAllResponse,
    UnreadCountResponse,
)
from app.services.notification import (
    get_unread_count,
    list_user_notifications,
    mark_all_notifications_as_read,
    mark_notification_as_read,
)

router = APIRouter(
    prefix="/api/v1/notifications",
    tags=["notifications"],
)


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    unread_only: bool = Query(False, description="Filter for unread notifications only"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationListResponse:
    """List paginated notifications for current authenticated user (F-038)."""
    return await list_user_notifications(
        db,
        user_id=current_user.id,
        unread_only=unread_only,
        page=page,
        page_size=page_size,
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_notifications_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UnreadCountResponse:
    """Retrieve total count of unread notifications for current authenticated user."""
    count = await get_unread_count(db, user_id=current_user.id)
    return UnreadCountResponse(unread_count=count)


@router.patch("/{notification_id}/read", response_model=NotificationReadActionResponse)
async def mark_single_notification_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationReadActionResponse:
    """Mark a single user notification as read."""
    notification = await mark_notification_as_read(
        db,
        user_id=current_user.id,
        notification_id=notification_id,
    )
    return NotificationReadActionResponse(
        id=notification.id,
        is_read=notification.is_read,
        read_at=notification.read_at or notification.created_at,
    )


@router.post("/read-all", response_model=NotificationReadAllResponse)
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationReadAllResponse:
    """Mark all unread notifications for current user as read."""
    count = await mark_all_notifications_as_read(db, user_id=current_user.id)
    return NotificationReadAllResponse(marked_count=count)
