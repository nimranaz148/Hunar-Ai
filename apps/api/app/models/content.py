"""Content domain database models: ContentCalendar, ContentItem, and ResearchReport (PRD §12.1, §12.3, §36.15, §36.16, F-010, F-011, F-012, F-014)."""

import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.business import Business


class ContentCalendar(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """30-day content calendar outline and generation state (PRD §12.1, §36.16, F-010, F-011)."""

    __tablename__ = "content_calendars"
    __table_args__ = (
        CheckConstraint(
            "status IN ('not_started', 'researching', 'strategizing', 'awaiting_approval', 'generating', 'qa', 'ready', 'approved', 'revision_requested')",
            name="check_content_calendar_status",
        ),
        Index("ix_content_calendars_business_id", "business_id", unique=True),
    )

    business_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    status: Mapped[str] = mapped_column(
        String(30), server_default="awaiting_approval", nullable=False
    )
    pillars: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB, server_default="[]", nullable=False
    )
    weekly_themes: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB, server_default="[]", nullable=False
    )
    format_distribution: Mapped[dict[str, Any]] = mapped_column(
        JSONB, server_default="{}", nullable=False
    )
    day_briefs: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB, server_default="[]", nullable=False
    )
    revision_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    business: Mapped["Business"] = relationship("Business", lazy="select")
    items: Mapped[list["ContentItem"]] = relationship(
        "ContentItem",
        back_populates="calendar",
        cascade="all, delete-orphan",
        order_by="ContentItem.day",
        lazy="select",
    )


class ContentItem(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Single-day content item with post captions, visual prompts, and tracking (PRD §12.3, F-011, F-012, F-013)."""

    __tablename__ = "content_items"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'approved', 'posted', 'skipped', 'needs_review')",
            name="check_content_item_status",
        ),
        Index("ix_content_items_calendar_id_day", "calendar_id", "day", unique=True),
        Index("ix_content_items_status", "status"),
    )

    calendar_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("content_calendars.id", ondelete="CASCADE"),
        nullable=False,
    )
    day: Mapped[int] = mapped_column(Integer, nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    platform: Mapped[list[str]] = mapped_column(JSONB, server_default="[]", nullable=False)
    format: Mapped[str] = mapped_column(String(30), nullable=False)
    pillar: Mapped[str] = mapped_column(String(50), nullable=False)
    goal: Mapped[str] = mapped_column(String(50), nullable=False)
    hook: Mapped[str] = mapped_column(Text, nullable=False)
    caption: Mapped[str] = mapped_column(Text, nullable=False)
    cta: Mapped[str] = mapped_column(Text, nullable=False)
    hashtags: Mapped[list[str]] = mapped_column(JSONB, server_default="[]", nullable=False)
    best_time_hint: Mapped[str | None] = mapped_column(String(100), nullable=True)
    image_prompt: Mapped[dict[str, Any]] = mapped_column(
        JSONB, server_default="{}", nullable=False
    )
    video_prompt: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    alt_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), server_default="draft", nullable=False)
    posted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    post_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    calendar: Mapped["ContentCalendar"] = relationship(
        "ContentCalendar", back_populates="items", lazy="select"
    )


class ResearchReport(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Competitor teardown and hashtag research feeding Content Strategist (PRD §12.1, §36.15, F-014)."""

    __tablename__ = "research_reports"
    __table_args__ = (Index("ix_research_reports_business_id", "business_id", unique=True),)

    business_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    competitors: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB, server_default="[]", nullable=False
    )
    how_to_be_better: Mapped[list[str]] = mapped_column(JSONB, server_default="[]", nullable=False)
    hashtags: Mapped[dict[str, Any]] = mapped_column(JSONB, server_default="{}", nullable=False)
    confidence: Mapped[float] = mapped_column(Float, server_default="0.8", nullable=False)
    source_urls: Mapped[list[str]] = mapped_column(JSONB, server_default="[]", nullable=False)
    researched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    business: Mapped["Business"] = relationship("Business", lazy="select")
