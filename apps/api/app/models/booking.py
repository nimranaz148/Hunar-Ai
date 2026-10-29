"""Booking and PaymentSim database models (PRD §5 F-019, §10 W-005, §12.3)."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.mentor import MentorProfile, MentorService
    from app.models.user import User


class Booking(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Mentoring session booking transaction (PRD §5 F-019, §10 W-005, §12.3)."""

    __tablename__ = "bookings"
    __table_args__ = (
        CheckConstraint(
            "status IN ('requested', 'accepted', 'declined', 'scheduled', 'completed', 'cancelled', 'reviewed')",
            name="check_booking_status",
        ),
        Index("ix_bookings_service_id", "service_id"),
        Index("ix_bookings_mentor_id", "mentor_id"),
        Index("ix_bookings_entrepreneur_id", "entrepreneur_id"),
        Index("ix_bookings_status", "status"),
    )

    service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("mentor_services.id", ondelete="CASCADE"),
        nullable=False,
    )
    mentor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("mentor_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    entrepreneur_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default="requested",
        server_default="requested",
        nullable=False,
    )
    scheduled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    session_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    service: Mapped["MentorService"] = relationship(
        "MentorService",
        foreign_keys=[service_id],
        lazy="joined",
    )
    mentor: Mapped["MentorProfile"] = relationship(
        "MentorProfile",
        foreign_keys=[mentor_id],
        lazy="joined",
    )
    entrepreneur: Mapped["User"] = relationship(
        "User",
        foreign_keys=[entrepreneur_id],
        lazy="joined",
    )
    payment: Mapped["PaymentSim | None"] = relationship(
        "PaymentSim",
        back_populates="booking",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="joined",
    )
    review: Mapped["Review | None"] = relationship(
        "Review",
        back_populates="booking",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="joined",
    )


class PaymentSim(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Simulated escrow payment record for a mentor booking (PRD §5 F-019, §10 W-005, §12.3)."""

    __tablename__ = "payments_sim"
    __table_args__ = (
        CheckConstraint(
            "status IN ('held', 'released', 'refunded')",
            name="check_payment_sim_status",
        ),
        CheckConstraint(
            "amount_pkr > 0",
            name="check_payment_sim_amount",
        ),
        Index("ix_payments_sim_booking_id", "booking_id", unique=True),
        Index("ix_payments_sim_status", "status"),
    )

    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    amount_pkr: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50),
        default="held",
        server_default="held",
        nullable=False,
    )

    # Relationship
    booking: Mapped["Booking"] = relationship(
        "Booking",
        back_populates="payment",
        foreign_keys=[booking_id],
    )


class Review(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Post-session mentor review and rating by entrepreneur (PRD §5 F-041, §12.3)."""

    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint(
            "rating >= 1 AND rating <= 5",
            name="check_review_rating",
        ),
        Index("ix_reviews_booking_id", "booking_id", unique=True),
        Index("ix_reviews_mentor_id", "mentor_id"),
        Index("ix_reviews_entrepreneur_id", "entrepreneur_id"),
    )

    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    mentor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("mentor_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    entrepreneur_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    booking: Mapped["Booking"] = relationship(
        "Booking",
        back_populates="review",
        foreign_keys=[booking_id],
    )
    mentor: Mapped["MentorProfile"] = relationship(
        "MentorProfile",
        foreign_keys=[mentor_id],
        lazy="joined",
    )
    entrepreneur: Mapped["User"] = relationship(
        "User",
        foreign_keys=[entrepreneur_id],
        lazy="joined",
    )
