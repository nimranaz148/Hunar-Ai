"""Pydantic schemas for In-App Notifications (Task 55 / F-038 / PRD §13.2 line 1082, §14.2)."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NotificationItemResponse(BaseModel):
    """Single notification record schema."""

    id: int = Field(..., description="Notification unique sequential ID")
    user_id: uuid.UUID = Field(..., description="Recipient user UUID")
    title: str = Field(..., description="Notification short title")
    message: str = Field(..., description="Notification descriptive content")
    type: str = Field("system", description="Semantic notification category")
    link: str | None = Field(None, description="Optional relative URL path for in-app navigation")
    is_read: bool = Field(False, description="Read state status flag")
    created_at: datetime = Field(..., description="Timestamp notification was generated")
    read_at: datetime | None = Field(None, description="Timestamp notification was marked read")

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    """Paginated notifications response including overall unread count."""

    items: list[NotificationItemResponse] = Field(
        default_factory=list, description="List of notification items"
    )
    total: int = Field(0, description="Total notifications matching query")
    unread_count: int = Field(0, description="Total unread notifications for current user")
    page: int = Field(1, description="Current page number")
    page_size: int = Field(20, description="Number of items per page")


class UnreadCountResponse(BaseModel):
    """Quick unread count response for layout badge display."""

    unread_count: int = Field(0, description="Total unread notifications count")


class NotificationReadActionResponse(BaseModel):
    """Response after marking a single notification as read."""

    id: int = Field(..., description="Notification ID")
    is_read: bool = Field(True, description="Updated read status flag")
    read_at: datetime = Field(..., description="Timestamp read state was updated")


class NotificationReadAllResponse(BaseModel):
    """Response after marking all notifications read."""

    marked_count: int = Field(0, description="Number of unread notifications updated to read")
