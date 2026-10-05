"""MentorProfile and MentorService database models (PRD §5 F-018, F-021, F-022, §12.3)."""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User


class MentorProfile(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Mentor professional profile linked to user account (PRD §5 F-021, §12.3)."""

    __tablename__ = "mentor_profiles"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'active', 'declined')",
            name="check_mentor_profile_status",
        ),
        Index("ix_mentor_profiles_user_id", "user_id", unique=True),
        Index("ix_mentor_profiles_status", "status"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    niches: Mapped[list[str]] = mapped_column(
        ARRAY(String(50)),
        nullable=False,
        default=list,
    )
    languages: Mapped[list[str]] = mapped_column(
        ARRAY(String(20)),
        nullable=False,
        default=list,
    )
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    bio: Mapped[str] = mapped_column(Text, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    rating: Mapped[float] = mapped_column(Float, default=0.0, server_default="0.0", nullable=False)
    review_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    status: Mapped[str] = mapped_column(String(50), server_default="active", nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], lazy="joined")
    services: Mapped[list["MentorService"]] = relationship(
        "MentorService",
        back_populates="mentor",
        cascade="all, delete-orphan",
    )


class MentorService(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Specific coaching/mentoring service offered by an active mentor (PRD §5 F-022, §12.3)."""

    __tablename__ = "mentor_services"
    __table_args__ = (
        CheckConstraint(
            "type IN ('session', 'review', 'done_with_you', 'package')",
            name="check_mentor_service_type",
        ),
        CheckConstraint(
            "price_pkr > 0",
            name="check_mentor_service_price",
        ),
        CheckConstraint(
            "duration_min >= 15 AND duration_min <= 180",
            name="check_mentor_service_duration",
        ),
        Index("ix_mentor_services_mentor_id", "mentor_id"),
        Index("ix_mentor_services_niche", "niche"),
        Index("ix_mentor_services_type", "type"),
        Index("ix_mentor_services_active", "active"),
    )

    mentor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("mentor_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    niche: Mapped[str] = mapped_column(String(50), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    price_pkr: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_min: Mapped[int] = mapped_column(Integer, default=60, server_default="60", nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", nullable=False)

    # Relationships
    mentor: Mapped["MentorProfile"] = relationship("MentorProfile", back_populates="services", lazy="joined")
