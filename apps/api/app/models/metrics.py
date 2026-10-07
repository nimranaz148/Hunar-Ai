"""Metrics Snapshot database model (PRD §5.2 F-015, §10 W-004, §12.3)."""

import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.business import Business
    from app.models.content import ContentItem


class MetricsSnapshot(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Point-in-time record of manual marketing and business conversion metrics (PRD §12.3)."""

    __tablename__ = "metrics_snapshots"
    __table_args__ = (
        Index("ix_metrics_snapshots_business_id", "business_id"),
        Index("ix_metrics_snapshots_content_item_id", "content_item_id"),
        Index("ix_metrics_snapshots_business_platform", "business_id", "platform"),
        Index("ix_metrics_snapshots_business_period", "business_id", "period_start", "period_end"),
    )

    business_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
    )
    content_item_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("content_items.id", ondelete="SET NULL"),
        nullable=True,
    )

    platform: Mapped[str] = mapped_column(String(30), nullable=False)  # instagram, facebook
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)

    views: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    reach: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    likes: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    comments: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    shares: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    saves: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    follower_delta: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    inquiries: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    orders: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    revenue_pkr: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)

    # Relationships
    business: Mapped["Business"] = relationship("Business", lazy="selectin")
    content_item: Mapped["ContentItem | None"] = relationship("ContentItem", lazy="selectin")
