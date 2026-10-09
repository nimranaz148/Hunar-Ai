"""Notification service operations (Task 55 / F-038 / PRD §13.2 line 1082, §14.2)."""

import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.schemas.notification import (
    NotificationItemResponse,
    NotificationListResponse,
)


async def list_user_notifications(
    db: AsyncSession,
    user_id: uuid.UUID,
    unread_only: bool = False,
    page: int = 1,
    page_size: int = 20,
) -> NotificationListResponse:
    """List paginated notifications for the authenticated user."""
    page = max(1, page)
    page_size = max(1, min(page_size, 100))
    offset = (page - 1) * page_size

    # Unread count query
    unread_count_query = select(func.count(Notification.id)).where(
        Notification.user_id == user_id,
        Notification.is_read.is_(False),
    )
    unread_count_result = await db.execute(unread_count_query)
    unread_count = unread_count_result.scalar_one_or_none() or 0

    # Total matching items query
    total_query = select(func.count(Notification.id)).where(Notification.user_id == user_id)
    if unread_only:
        total_query = total_query.where(Notification.is_read.is_(False))
    total_result = await db.execute(total_query)
    total = total_result.scalar_one_or_none() or 0

    # Items query
    items_query = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    if unread_only:
        items_query = items_query.where(Notification.is_read.is_(False))

    result = await db.execute(items_query)
    notifications = list(result.scalars().all())

    return NotificationListResponse(
        items=[NotificationItemResponse.model_validate(n) for n in notifications],
        total=total,
        unread_count=unread_count,
        page=page,
        page_size=page_size,
    )


async def get_unread_count(db: AsyncSession, user_id: uuid.UUID) -> int:
    """Get the current count of unread notifications for a user."""
    query = select(func.count(Notification.id)).where(
        Notification.user_id == user_id,
        Notification.is_read.is_(False),
    )
    result = await db.execute(query)
    return result.scalar_one_or_none() or 0


async def mark_notification_as_read(
    db: AsyncSession,
    user_id: uuid.UUID,
    notification_id: int,
) -> Notification:
    """Mark a single notification owned by the user as read."""
    query = select(Notification).where(
        Notification.id == notification_id,
        Notification.user_id == user_id,
    )
    result = await db.execute(query)
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    if not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.now(UTC)
        await db.commit()
        await db.refresh(notification)

    return notification


async def mark_all_notifications_as_read(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> int:
    """Mark all unread notifications for the user as read."""
    stmt = (
        update(Notification)
        .where(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
        )
        .values(
            is_read=True,
            read_at=datetime.now(UTC),
        )
    )
    result = await db.execute(stmt)
    await db.commit()
    rowcount = getattr(result, "rowcount", 0)
    return int(rowcount) if rowcount is not None else 0


async def create_notification(
    db: AsyncSession,
    user_id: uuid.UUID,
    title: str,
    message: str,
    notification_type: str = "system",
    link: str | None = None,
) -> Notification:
    """Helper to dispatch an in-app notification to a user."""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
        link=link,
        is_read=False,
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification
