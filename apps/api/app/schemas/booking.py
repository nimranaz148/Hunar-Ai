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


class BookingDetailResponse(BookingItemResponse):
    """Detailed booking view with full service context and payment state."""

    notes: str | None = None
    session_notes: str | None = None
    service_description: str
    payment_status: str
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
