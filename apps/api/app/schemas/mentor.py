"""Pydantic schemas for Mentors and Mentor Services (PRD §5 F-018, F-021, F-022, §13.2)."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class MentorSummaryResponse(BaseModel):
    """Public/Browse summary of a mentor profile."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    city: str
    bio: str
    niches: list[str]
    languages: list[str]
    avatar_url: str | None = None
    rating: float
    review_count: int
    status: str


class MentorServiceItemResponse(BaseModel):
    """Item in the mentor services catalog/list view (PRD §5 F-018)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    mentor_id: uuid.UUID
    mentor_name: str
    mentor_avatar_url: str | None = None
    mentor_city: str
    mentor_rating: float
    mentor_review_count: int
    title: str
    description: str
    niche: str
    type: str
    price_pkr: int = Field(..., gt=0, description="Price in PKR")
    duration_min: int = Field(..., ge=15, le=180, description="Duration in minutes")
    active: bool
    created_at: datetime


class MentorServiceDetailResponse(MentorServiceItemResponse):
    """Full detail view for a specific mentor service."""

    mentor_bio: str
    mentor_languages: list[str]
    mentor_niches: list[str]


class MentorProfileResponse(BaseModel):
    """Full mentor profile view (PRD §5 F-021, §12.3)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    email: str
    city: str
    bio: str
    niches: list[str]
    languages: list[str]
    avatar_url: str | None = None
    rating: float
    review_count: int
    status: str
    created_at: datetime
    updated_at: datetime | None = None


class MentorProfileUpdateRequest(BaseModel):
    """Payload for updating own mentor profile (PRD §5 F-021, §13.2)."""

    city: str | None = Field(default=None, max_length=100)
    bio: str | None = Field(default=None, max_length=2000)
    niches: list[str] | None = None
    languages: list[str] | None = None
    avatar_url: str | None = Field(default=None, max_length=500)


VALID_NICHES = {"food", "stitching_fashion", "beauty", "handmade", "tutoring", "digital"}
VALID_SERVICE_TYPES = {"session", "review", "done_with_you", "package"}


class MentorServiceCreateRequest(BaseModel):
    """Payload for creating a new mentor coaching service (PRD §5 F-022)."""

    title: str = Field(..., min_length=2, max_length=200)
    description: str = Field(..., min_length=10, max_length=1000)
    niche: str = Field(
        ...,
        description="Service niche: food, stitching_fashion, beauty, handmade, tutoring, digital",
    )
    type: str = Field(..., description="Service type: session, review, done_with_you, package")
    price_pkr: int = Field(..., gt=0, description="Price in PKR")
    duration_min: int = Field(
        default=60, ge=15, le=180, description="Duration in minutes (15-180, step 15)"
    )
    active: bool = Field(default=True)

    @field_validator("niche")
    @classmethod
    def validate_niche(cls, v: str) -> str:
        if v not in VALID_NICHES:
            raise ValueError(
                f"Invalid niche '{v}'. Must be one of: {', '.join(sorted(VALID_NICHES))}"
            )
        return v

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in VALID_SERVICE_TYPES:
            raise ValueError(
                f"Invalid type '{v}'. Must be one of: {', '.join(sorted(VALID_SERVICE_TYPES))}"
            )
        return v

    @field_validator("duration_min")
    @classmethod
    def validate_duration(cls, v: int) -> int:
        if v % 15 != 0:
            raise ValueError(
                "Duration must be a multiple of 15 minutes (e.g. 15, 30, 45, 60, 90)."
            )
        return v


class MentorServiceUpdateRequest(BaseModel):
    """Payload for updating an existing mentor service (PRD §5 F-022)."""

    title: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = Field(default=None, min_length=10, max_length=1000)
    niche: str | None = None
    type: str | None = None
    price_pkr: int | None = Field(default=None, gt=0)
    duration_min: int | None = Field(default=None, ge=15, le=180)
    active: bool | None = None

    @field_validator("niche")
    @classmethod
    def validate_niche(cls, v: str | None) -> str | None:
        if v is not None and v not in VALID_NICHES:
            raise ValueError(
                f"Invalid niche '{v}'. Must be one of: {', '.join(sorted(VALID_NICHES))}"
            )
        return v

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str | None) -> str | None:
        if v is not None and v not in VALID_SERVICE_TYPES:
            raise ValueError(
                f"Invalid type '{v}'. Must be one of: {', '.join(sorted(VALID_SERVICE_TYPES))}"
            )
        return v

    @field_validator("duration_min")
    @classmethod
    def validate_duration(cls, v: int | None) -> int | None:
        if v is not None and v % 15 != 0:
            raise ValueError(
                "Duration must be a multiple of 15 minutes (e.g. 15, 30, 45, 60, 90)."
            )
        return v


class MentorServiceResponse(BaseModel):
    """Full detail of a mentor's own service (PRD §5 F-022)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    mentor_id: uuid.UUID
    title: str
    description: str
    niche: str
    type: str
    price_pkr: int
    duration_min: int
    active: bool
    created_at: datetime
    updated_at: datetime | None = None


class AvailabilitySlotItem(BaseModel):
    """Recurring weekly availability time window (PRD §5 F-023, §13.2)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID | None = None
    weekday: int = Field(
        ...,
        ge=0,
        le=6,
        description="Day of week: 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday",
    )
    start_time: str = Field(
        ...,
        pattern=r"^([01]\d|2[0-3]):[0-5]\d$",
        description="Start time in HH:MM format, e.g. 09:00",
    )
    end_time: str = Field(
        ...,
        pattern=r"^([01]\d|2[0-3]):[0-5]\d$",
        description="End time in HH:MM format, e.g. 17:00",
    )
    is_available: bool = Field(default=True)


class MentorAvailabilityResponse(BaseModel):
    """Weekly availability schedule response for a mentor (PRD §5 F-023, §13.2)."""

    slots: list[AvailabilitySlotItem]


class MentorAvailabilityUpdateRequest(BaseModel):
    """Payload to update weekly recurring availability slots (PRD §5 F-023, §13.2)."""

    slots: list[AvailabilitySlotItem]


class MentorDashboardSessionItem(BaseModel):
    """Session or request item on the mentor dashboard (PRD §5 F-024 / D-002)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    service_id: uuid.UUID
    service_title: str
    service_type: str
    entrepreneur_id: uuid.UUID
    entrepreneur_name: str
    status: str
    amount_pkr: int
    duration_min: int
    scheduled_at: datetime | None = None
    notes: str | None = None
    session_notes: str | None = None
    payment_status: str = "held"
    created_at: datetime


class MentorReviewItem(BaseModel):
    """Mentee feedback or review item on the mentor dashboard."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    entrepreneur_name: str
    service_title: str
    rating: float
    review_text: str | None = None
    created_at: datetime


class MentorDashboardResponse(BaseModel):
    """Consolidated Mentor Dashboard response (PRD §7 D-002, §8, §29.2)."""

    pending_requests_count: int
    upcoming_sessions_count: int
    total_earnings_pkr: int
    average_rating: float
    review_count: int
    pending_requests: list[MentorDashboardSessionItem]
    upcoming_sessions: list[MentorDashboardSessionItem]
    recent_reviews: list[MentorReviewItem]


# ============================================================================
# Mentee View & Brief Schemas (PRD §5 F-025, §10 W-005, §12.3, §36.14)
# ============================================================================


class MenteeListItem(BaseModel):
    """Summary item for a mentee who has booked sessions with the mentor."""

    entrepreneur_id: uuid.UUID
    name: str
    email: str
    business_name: str | None = None
    business_niche: str | None = None
    business_city: str | None = None
    total_bookings: int
    latest_booking_status: str
    latest_booking_date: datetime | None = None
    tasks_completed: int = 0
    tasks_total: int = 0


class MenteeListResponse(BaseModel):
    """Response containing list of mentees booked with the mentor."""

    mentees: list[MenteeListItem]
    total_count: int


class MenteeTaskSummary(BaseModel):
    """High-level summary of a mentee's launch plan task."""

    id: uuid.UUID
    title: str
    category: str
    week: int
    status: str
    due_date: str | None = None


class MenteeBookingSummary(BaseModel):
    """Session booking history between this mentor and mentee."""

    id: uuid.UUID
    service_title: str
    service_type: str
    scheduled_at: datetime | None = None
    status: str
    amount_pkr: int
    duration_min: int
    notes: str | None = None
    session_notes: str | None = None
    created_at: datetime


class MenteeBriefData(BaseModel):
    """Synthesized one-page brief prepared for the mentor before a session."""

    executive_summary: str
    stage: str
    key_blockers: list[str] = Field(default_factory=list)
    focus_areas: list[str] = Field(default_factory=list)
    recommended_questions: list[str] = Field(default_factory=list)
    growth_priorities: list[str] = Field(default_factory=list)


class MenteeDetailResponse(BaseModel):
    """Comprehensive Mentee Detail and Brief report for a mentor (F-025)."""

    entrepreneur_id: uuid.UUID
    name: str
    email: str
    business_id: uuid.UUID | None = None
    business_name: str | None = None
    niche: str | None = None
    city: str | None = None
    area: str | None = None
    budget_pkr: int | None = None
    hours_per_week: int | None = None
    tone: str | None = None
    languages: list[str] = Field(default_factory=list)
    platforms: list[str] = Field(default_factory=list)
    target_customer: str | None = None

    # Validation & Economics
    validation_confidence: str | None = None
    competitor_gap: str | None = None
    products_count: int = 0

    # Plan Progress
    plan_status: str | None = None
    tasks_total: int = 0
    tasks_completed: int = 0
    completion_rate: float = 0.0
    recent_tasks: list[MenteeTaskSummary] = Field(default_factory=list)

    # Content stats
    content_items_total: int = 0
    content_items_posted: int = 0

    # Booking history with this mentor
    session_history: list[MenteeBookingSummary] = Field(default_factory=list)

    # Generated Mentor Brief
    mentor_brief: MenteeBriefData


# ---------------------------------------------------------------------------
# Task 42 — Earnings View (F-026 / R-006)
# ---------------------------------------------------------------------------


class EarningsTransaction(BaseModel):
    """Single mentoring session transaction entry in the earnings ledger (F-026)."""

    booking_id: uuid.UUID
    mentee_name: str
    service_title: str
    service_type: str
    amount_pkr: int
    payment_status: str  # held | released | refunded
    booking_status: str  # requested | accepted | scheduled | completed | cancelled | reviewed | declined
    scheduled_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime


class MonthlyEarningSummary(BaseModel):
    """Aggregated earnings for a calendar month for trend charting (F-026)."""

    year: int
    month: int  # 1-12
    month_label: str  # e.g. "Oct 2026"
    sessions_completed: int
    earned_pkr: int
    refunded_pkr: int


class MentorEarningsResponse(BaseModel):
    """Full mentor earnings report with KPIs, monthly trend, and transaction ledger (F-026 / R-006)."""

    # Top-level KPIs
    total_earned_pkr: int
    pending_escrow_pkr: int
    total_refunded_pkr: int
    completed_sessions_count: int
    average_session_fee_pkr: int

    # Filtering metadata
    period: str  # all | this_month | last_month | this_year
    period_label: str  # human-readable e.g. "October 2026"

    # Monthly trend breakdown (last N months ordered ascending)
    monthly_trend: list[MonthlyEarningSummary]

    # Full transaction ledger
    transactions: list[EarningsTransaction]
