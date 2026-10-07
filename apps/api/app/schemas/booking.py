"""Pydantic schemas for Bookings and Simulated Payments (PRD §5 F-019, §10 W-005, §13.2)."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BookingCreateRequest(BaseModel):
    """Payload for creating a mentor service booking request."""

    service_id: uuid.UUID
    notes: str | None = Field(
        default=None, max_length=1000, description="Questions or goals for the session"
    )
    scheduled_at: datetime | None = Field(
        default=None, description="Optional preferred session timestamp"
    )


class PaymentSimResponse(BaseModel):
    """Simulated escrow payment representation."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    booking_id: uuid.UUID
    amount_pkr: int
    status: str
    created_at: datetime


class BookingItemResponse(BaseModel):
    """Summary item in bookings list (PRD §5 F-019, F-020)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    service_id: uuid.UUID
    service_title: str
    service_type: str
    mentor_id: uuid.UUID
    mentor_name: str
    mentor_avatar_url: str | None = None
    entrepreneur_id: uuid.UUID
    entrepreneur_name: str
    status: str
    amount_pkr: int
    duration_min: int
    scheduled_at: datetime | None = None
    created_at: datetime
    payment_status: str = "held"


class BookingReviewResponse(BaseModel):
    """Review and rating details for a completed session (PRD §5 F-041, §12.3)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    booking_id: uuid.UUID
    mentor_id: uuid.UUID
    entrepreneur_id: uuid.UUID
    rating: int
    comment: str | None = None
    created_at: datetime


class BookingDetailResponse(BookingItemResponse):
    """Detailed booking view with full service context and payment state."""

    notes: str | None = None
    session_notes: str | None = None
    service_description: str
    payment_status: str
    review: BookingReviewResponse | None = None
    updated_at: datetime | None = None


class BookingUpdateRequest(BaseModel):
    """Payload for updating booking status or scheduling details (PRD §10 W-005, §13.2)."""

    status: str | None = Field(
        default=None, description="New status (e.g. cancelled, accepted, completed, declined)"
    )
    notes: str | None = Field(default=None, max_length=1000, description="Updated notes")
    session_notes: str | None = Field(
        default=None, max_length=2000, description="Notes from the completed session"
    )
    scheduled_at: datetime | None = Field(default=None, description="Scheduled session timestamp")


class SessionNotesCreateRequest(BaseModel):
    """Payload for submitting session notes and completing a session (PRD §5 F-027, §10 W-005, §13.2)."""

    session_notes: str = Field(
        ...,
        min_length=10,
        max_length=2000,
        description="Detailed guidance, recommendations, and next steps for the mentee (10-2000 characters)",
    )


class BookingReviewRequest(BaseModel):
    """Payload for submitting a mentor rating and review post-session (PRD §5 F-041, §10 W-005, §13.2)."""

    rating: int = Field(
        ...,
        ge=1,
        le=5,
        description="Rating from 1 (lowest) to 5 (highest) stars",
    )
    comment: str | None = Field(
        default=None,
        max_length=1000,
        description="Optional feedback comment (up to 1000 characters)",
    )

