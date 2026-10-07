"""Service layer for Mentor and MentorService operations (PRD §5 F-018, §13.2)."""

import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.agents.mentor_brief import run_mentor_brief_agent
from app.core.audit import record_audit_log
from app.models.booking import Booking
from app.models.business import Business
from app.models.content import ContentCalendar, ContentItem
from app.models.mentor import MentorAvailability, MentorProfile, MentorService
from app.models.plan import LaunchPlan, PlanTask
from app.models.user import User
from app.schemas.mentor import (
    AvailabilitySlotItem,
    # Task 42
    EarningsTransaction,
    MenteeBookingSummary,
    MenteeBriefData,
    MenteeDetailResponse,
    MenteeListItem,
    MenteeListResponse,
    MenteeTaskSummary,
    MentorAvailabilityResponse,
    MentorAvailabilityUpdateRequest,
    MentorDashboardResponse,
    MentorDashboardSessionItem,
    MentorEarningsResponse,
    MentorProfileResponse,
    MentorProfileUpdateRequest,
    MentorServiceCreateRequest,
    MentorServiceDetailResponse,
    MentorServiceItemResponse,
    MentorServiceResponse,
    MentorServiceUpdateRequest,
    MentorSummaryResponse,
    MonthlyEarningSummary,
)


async def list_active_services(
    db: AsyncSession,
    *,
    niche: str | None = None,
    service_type: str | None = None,
    max_price: int | None = None,
    city: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[MentorServiceItemResponse], int]:
    """List active mentor services with filters and pagination."""
    query = (
        select(MentorService)
        .join(MentorProfile, MentorService.mentor_id == MentorProfile.id)
        .join(User, MentorProfile.user_id == User.id)
        .where(
            MentorService.active.is_(True),
            MentorProfile.status == "active",
        )
    )

    if niche:
        query = query.where(MentorService.niche == niche)
    if service_type:
        query = query.where(MentorService.type == service_type)
    if max_price is not None:
        query = query.where(MentorService.price_pkr <= max_price)
    if city:
        query = query.where(MentorProfile.city.ilike(f"%{city}%"))
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                MentorService.title.ilike(search_pattern),
                MentorService.description.ilike(search_pattern),
                User.name.ilike(search_pattern),
            )
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    count_res = await db.execute(count_query)
    total = count_res.scalar() or 0

    # Paginate and fetch
    query = (
        query.order_by(MentorService.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    services = result.scalars().all()

    items = [
        MentorServiceItemResponse(
            id=s.id,
            mentor_id=s.mentor_id,
            mentor_name=s.mentor.user.name if s.mentor and s.mentor.user else "Verified Mentor",
            mentor_avatar_url=s.mentor.avatar_url if s.mentor else None,
            mentor_city=s.mentor.city if s.mentor else "Pakistan",
            mentor_rating=float(s.mentor.rating) if s.mentor else 5.0,
            mentor_review_count=s.mentor.review_count if s.mentor else 0,
            title=s.title,
            description=s.description,
            niche=s.niche,
            type=s.type,
            price_pkr=s.price_pkr,
            duration_min=s.duration_min,
            active=s.active,
            created_at=s.created_at,
        )
        for s in services
    ]

    return items, total


async def get_service_by_id(
    db: AsyncSession,
    service_id: uuid.UUID,
) -> MentorServiceDetailResponse | None:
    """Fetch detail for a single active mentor service."""
    query = (
        select(MentorService)
        .join(MentorProfile, MentorService.mentor_id == MentorProfile.id)
        .join(User, MentorProfile.user_id == User.id)
        .where(
            MentorService.id == service_id,
            MentorService.active.is_(True),
        )
    )
    result = await db.execute(query)
    s = result.scalar_one_or_none()
    if not s:
        return None

    return MentorServiceDetailResponse(
        id=s.id,
        mentor_id=s.mentor_id,
        mentor_name=s.mentor.user.name if s.mentor and s.mentor.user else "Verified Mentor",
        mentor_avatar_url=s.mentor.avatar_url if s.mentor else None,
        mentor_city=s.mentor.city if s.mentor else "Pakistan",
        mentor_rating=float(s.mentor.rating) if s.mentor else 5.0,
        mentor_review_count=s.mentor.review_count if s.mentor else 0,
        mentor_bio=s.mentor.bio if s.mentor else "",
        mentor_languages=s.mentor.languages if s.mentor else [],
        mentor_niches=s.mentor.niches if s.mentor else [],
        title=s.title,
        description=s.description,
        niche=s.niche,
        type=s.type,
        price_pkr=s.price_pkr,
        duration_min=s.duration_min,
        active=s.active,
        created_at=s.created_at,
    )


async def list_active_mentors(
    db: AsyncSession,
    *,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[MentorSummaryResponse], int]:
    """List active mentors with pagination."""
    query = (
        select(MentorProfile)
        .join(User, MentorProfile.user_id == User.id)
        .where(MentorProfile.status == "active")
    )

    count_query = select(func.count()).select_from(query.subquery())
    count_res = await db.execute(count_query)
    total = count_res.scalar() or 0

    query = (
        query.order_by(MentorProfile.rating.desc(), MentorProfile.review_count.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    mentors = result.scalars().all()

    items = [
        MentorSummaryResponse(
            id=m.id,
            user_id=m.user_id,
            name=m.user.name if m.user else "Verified Mentor",
            city=m.city,
            bio=m.bio,
            niches=m.niches,
            languages=m.languages,
            avatar_url=m.avatar_url,
            rating=float(m.rating),
            review_count=m.review_count,
            status=m.status,
        )
        for m in mentors
    ]

    return items, total


async def get_my_mentor_profile(
    db: AsyncSession,
    *,
    current_user: User,
) -> MentorProfileResponse:
    """Fetch current authenticated mentor's profile (PRD §5 F-021, §13.2)."""
    query = (
        select(MentorProfile)
        .options(selectinload(MentorProfile.user))
        .where(MentorProfile.user_id == current_user.id)
    )
    res = await db.execute(query)
    profile = res.scalar_one_or_none()

    if not profile:
        profile = MentorProfile(
            id=uuid.uuid4(),
            user_id=current_user.id,
            niches=[],
            languages=["ur", "en"],
            city="Pakistan",
            bio="Experienced industry professional offering guidance on Hunar.",
            avatar_url=None,
            rating=5.0,
            review_count=0,
            status="active" if current_user.status == "active" else "pending",
            created_at=datetime.now(UTC),
        )
        db.add(profile)
        await db.commit()
        res = await db.execute(query)
        profile = res.scalar_one()

    return MentorProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        name=current_user.name,
        email=current_user.email,
        city=profile.city,
        bio=profile.bio,
        niches=profile.niches,
        languages=profile.languages,
        avatar_url=profile.avatar_url,
        rating=float(profile.rating),
        review_count=profile.review_count,
        status=profile.status,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


async def update_my_mentor_profile(
    db: AsyncSession,
    *,
    current_user: User,
    data: MentorProfileUpdateRequest,
    ip: str | None = None,
    user_agent: str | None = None,
) -> MentorProfileResponse:
    """Update current mentor's profile information (PRD §5 F-021, §13.2)."""
    query = (
        select(MentorProfile)
        .options(selectinload(MentorProfile.user))
        .where(MentorProfile.user_id == current_user.id)
    )
    res = await db.execute(query)
    profile = res.scalar_one_or_none()

    now = datetime.now(UTC)

    if not profile:
        profile = MentorProfile(
            id=uuid.uuid4(),
            user_id=current_user.id,
            niches=data.niches or [],
            languages=data.languages or ["ur", "en"],
            city=data.city or "Pakistan",
            bio=data.bio or "",
            avatar_url=data.avatar_url,
            rating=5.0,
            review_count=0,
            status="active" if current_user.status == "active" else "pending",
            created_at=now,
            updated_at=now,
        )
        db.add(profile)
        await db.flush()
        before_state = {}
    else:
        before_state = {
            "city": profile.city,
            "bio": profile.bio,
            "niches": list(profile.niches),
            "languages": list(profile.languages),
            "avatar_url": profile.avatar_url,
        }
        if data.city is not None:
            profile.city = data.city
        if data.bio is not None:
            profile.bio = data.bio
        if data.niches is not None:
            profile.niches = data.niches
        if data.languages is not None:
            profile.languages = data.languages
        if data.avatar_url is not None:
            profile.avatar_url = data.avatar_url

        profile.updated_at = now

    after_state = {
        "city": profile.city,
        "bio": profile.bio,
        "niches": list(profile.niches),
        "languages": list(profile.languages),
        "avatar_url": profile.avatar_url,
    }

    await record_audit_log(
        db=db,
        action="mentor.profile_updated",
        actor_id=current_user.id,
        actor_role=current_user.role,
        target_type="mentor_profile",
        target_id=str(profile.id),
        ip=ip,
        user_agent=user_agent,
        before=before_state,
        after=after_state,
    )

    await db.commit()

    return MentorProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        name=current_user.name,
        email=current_user.email,
        city=profile.city,
        bio=profile.bio,
        niches=profile.niches,
        languages=profile.languages,
        avatar_url=profile.avatar_url,
        rating=float(profile.rating),
        review_count=profile.review_count,
        status=profile.status,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


async def list_my_services(
    db: AsyncSession,
    *,
    current_user: User,
) -> list[MentorServiceResponse]:
    """Retrieve all services belonging to current mentor, ordered by created_at desc (PRD §5 F-022)."""
    profile_res = await db.execute(
        select(MentorProfile).where(MentorProfile.user_id == current_user.id)
    )
    profile = profile_res.scalar_one_or_none()
    if not profile:
        now = datetime.now(UTC)
        profile = MentorProfile(
            id=uuid.uuid4(),
            user_id=current_user.id,
            niches=[],
            languages=["ur", "en"],
            city="Pakistan",
            bio="Experienced industry professional offering guidance on Hunar.",
            rating=5.0,
            review_count=0,
            status="active" if current_user.status == "active" else "pending",
            created_at=now,
            updated_at=now,
        )
        db.add(profile)
        await db.commit()

    query = (
        select(MentorService)
        .where(MentorService.mentor_id == profile.id)
        .order_by(MentorService.created_at.desc())
    )
    result = await db.execute(query)
    services = result.scalars().all()
    return [MentorServiceResponse.model_validate(s) for s in services]


async def create_my_service(
    db: AsyncSession,
    *,
    current_user: User,
    data: MentorServiceCreateRequest,
    ip: str | None = None,
    user_agent: str | None = None,
) -> MentorServiceResponse:
    """Create a new service for current mentor with audit logging (PRD §5 F-022, §14.1)."""
    profile_res = await db.execute(
        select(MentorProfile).where(MentorProfile.user_id == current_user.id)
    )
    profile = profile_res.scalar_one_or_none()
    if not profile:
        now = datetime.now(UTC)
        profile = MentorProfile(
            id=uuid.uuid4(),
            user_id=current_user.id,
            niches=[data.niche],
            languages=["ur", "en"],
            city="Pakistan",
            bio="Experienced industry professional offering guidance on Hunar.",
            rating=5.0,
            review_count=0,
            status="active" if current_user.status == "active" else "pending",
            created_at=now,
            updated_at=now,
        )
        db.add(profile)
        await db.flush()

    now = datetime.now(UTC)
    service = MentorService(
        id=uuid.uuid4(),
        mentor_id=profile.id,
        title=data.title,
        description=data.description,
        niche=data.niche,
        type=data.type,
        price_pkr=data.price_pkr,
        duration_min=data.duration_min,
        active=data.active,
        created_at=now,
        updated_at=now,
    )
    db.add(service)
    await db.flush()

    await record_audit_log(
        db=db,
        action="service.created",
        actor_id=current_user.id,
        actor_role=current_user.role,
        target_type="mentor_service",
        target_id=str(service.id),
        ip=ip,
        user_agent=user_agent,
        before={},
        after={
            "title": service.title,
            "type": service.type,
            "niche": service.niche,
            "price_pkr": service.price_pkr,
            "duration_min": service.duration_min,
            "active": service.active,
        },
    )

    await db.commit()
    await db.refresh(service)
    return MentorServiceResponse.model_validate(service)


async def update_my_service(
    db: AsyncSession,
    *,
    current_user: User,
    service_id: uuid.UUID,
    data: MentorServiceUpdateRequest,
    ip: str | None = None,
    user_agent: str | None = None,
) -> MentorServiceResponse:
    """Update a mentor service with constraint checks and audit logging (PRD §5 F-022, §14.1)."""
    profile_res = await db.execute(
        select(MentorProfile).where(MentorProfile.user_id == current_user.id)
    )
    profile = profile_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor profile not found.",
        )

    svc_res = await db.execute(
        select(MentorService).where(
            MentorService.id == service_id,
            MentorService.mentor_id == profile.id,
        )
    )
    service = svc_res.scalar_one_or_none()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mentor service with ID '{service_id}' not found.",
        )

    # Constraint per PRD §5 F-022: Cannot change price after accepted booking
    if data.price_pkr is not None and data.price_pkr != service.price_pkr:
        booking_check = await db.execute(
            select(Booking).where(
                Booking.service_id == service.id,
                Booking.status.in_(["accepted", "scheduled"]),
            )
        )
        if booking_check.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change service price while an active accepted booking exists.",
            )

        # Audit price change
        await record_audit_log(
            db=db,
            action="service.price_changed",
            actor_id=current_user.id,
            actor_role=current_user.role,
            target_type="mentor_service",
            target_id=str(service.id),
            ip=ip,
            user_agent=user_agent,
            before={"price_pkr": service.price_pkr},
            after={"price_pkr": data.price_pkr},
        )

    before_state = {
        "title": service.title,
        "description": service.description,
        "niche": service.niche,
        "type": service.type,
        "price_pkr": service.price_pkr,
        "duration_min": service.duration_min,
        "active": service.active,
    }

    if data.title is not None:
        service.title = data.title
    if data.description is not None:
        service.description = data.description
    if data.niche is not None:
        service.niche = data.niche
    if data.type is not None:
        service.type = data.type
    if data.price_pkr is not None:
        service.price_pkr = data.price_pkr
    if data.duration_min is not None:
        service.duration_min = data.duration_min
    if data.active is not None:
        service.active = data.active

    service.updated_at = datetime.now(UTC)

    after_state = {
        "title": service.title,
        "description": service.description,
        "niche": service.niche,
        "type": service.type,
        "price_pkr": service.price_pkr,
        "duration_min": service.duration_min,
        "active": service.active,
    }

    await record_audit_log(
        db=db,
        action="service.updated",
        actor_id=current_user.id,
        actor_role=current_user.role,
        target_type="mentor_service",
        target_id=str(service.id),
        ip=ip,
        user_agent=user_agent,
        before=before_state,
        after=after_state,
    )

    await db.commit()
    await db.refresh(service)
    return MentorServiceResponse.model_validate(service)


async def delete_my_service(
    db: AsyncSession,
    *,
    current_user: User,
    service_id: uuid.UUID,
    ip: str | None = None,
    user_agent: str | None = None,
) -> None:
    """Delete a mentor service if no active bookings exist (PRD §5 F-022, §14.1)."""
    profile_res = await db.execute(
        select(MentorProfile).where(MentorProfile.user_id == current_user.id)
    )
    profile = profile_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor profile not found.",
        )

    svc_res = await db.execute(
        select(MentorService).where(
            MentorService.id == service_id,
            MentorService.mentor_id == profile.id,
        )
    )
    service = svc_res.scalar_one_or_none()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mentor service with ID '{service_id}' not found.",
        )

    booking_check = await db.execute(
        select(Booking).where(
            Booking.service_id == service.id,
            Booking.status.in_(["requested", "accepted", "scheduled"]),
        )
    )
    if booking_check.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete service with active bookings. Deactivate the service instead.",
        )

    before_state = {
        "title": service.title,
        "price_pkr": service.price_pkr,
        "type": service.type,
        "niche": service.niche,
    }

    await db.delete(service)

    await record_audit_log(
        db=db,
        action="service.deleted",
        actor_id=current_user.id,
        actor_role=current_user.role,
        target_type="mentor_service",
        target_id=str(service.id),
        ip=ip,
        user_agent=user_agent,
        before=before_state,
        after={},
    )

    await db.commit()


async def get_my_availability(
    db: AsyncSession,
    *,
    current_user: User,
) -> MentorAvailabilityResponse:
    """Retrieve all recurring weekly availability slots for the current mentor (PRD §5 F-023, §13.2)."""
    profile_res = await db.execute(
        select(MentorProfile).where(MentorProfile.user_id == current_user.id)
    )
    profile = profile_res.scalar_one_or_none()
    if not profile:
        now = datetime.now(UTC)
        profile = MentorProfile(
            id=uuid.uuid4(),
            user_id=current_user.id,
            niches=[],
            languages=["ur", "en"],
            city="Pakistan",
            bio="Experienced industry professional offering guidance on Hunar.",
            rating=5.0,
            review_count=0,
            status="active" if current_user.status == "active" else "pending",
            created_at=now,
            updated_at=now,
        )
        db.add(profile)
        await db.commit()

    query = (
        select(MentorAvailability)
        .where(MentorAvailability.mentor_id == profile.id)
        .order_by(MentorAvailability.weekday.asc(), MentorAvailability.start_time.asc())
    )
    result = await db.execute(query)
    slots = result.scalars().all()
    return MentorAvailabilityResponse(
        slots=[AvailabilitySlotItem.model_validate(s) for s in slots]
    )


async def set_my_availability(
    db: AsyncSession,
    *,
    current_user: User,
    data: MentorAvailabilityUpdateRequest,
    ip: str | None = None,
    user_agent: str | None = None,
) -> MentorAvailabilityResponse:
    """Replace weekly recurring availability slots for the current mentor (PRD §5 F-023, §13.2, §14.1)."""
    profile_res = await db.execute(
        select(MentorProfile).where(MentorProfile.user_id == current_user.id)
    )
    profile = profile_res.scalar_one_or_none()
    if not profile:
        now = datetime.now(UTC)
        profile = MentorProfile(
            id=uuid.uuid4(),
            user_id=current_user.id,
            niches=[],
            languages=["ur", "en"],
            city="Pakistan",
            bio="Experienced industry professional offering guidance on Hunar.",
            rating=5.0,
            review_count=0,
            status="active" if current_user.status == "active" else "pending",
            created_at=now,
            updated_at=now,
        )
        db.add(profile)
        await db.flush()

    # Validate slot times
    for s in data.slots:
        if s.is_available and s.start_time >= s.end_time:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Start time ({s.start_time}) must be earlier than end time ({s.end_time}) on weekday {s.weekday}.",
            )

    # Fetch existing slots for audit comparison
    existing_res = await db.execute(
        select(MentorAvailability).where(MentorAvailability.mentor_id == profile.id)
    )
    existing_slots = existing_res.scalars().all()
    before_count = len(existing_slots)

    # Clear previous slots
    await db.execute(delete(MentorAvailability).where(MentorAvailability.mentor_id == profile.id))

    now = datetime.now(UTC)
    new_slots: list[MentorAvailability] = []
    for s in data.slots:
        slot_obj = MentorAvailability(
            id=uuid.uuid4(),
            mentor_id=profile.id,
            weekday=s.weekday,
            start_time=s.start_time,
            end_time=s.end_time,
            is_available=s.is_available,
            created_at=now,
            updated_at=now,
        )
        db.add(slot_obj)
        new_slots.append(slot_obj)

    await record_audit_log(
        db=db,
        action="mentor.availability_updated",
        actor_id=current_user.id,
        actor_role=current_user.role,
        target_type="mentor_availability",
        target_id=str(profile.id),
        ip=ip,
        user_agent=user_agent,
        before={"slot_count": before_count},
        after={"slot_count": len(new_slots)},
    )

    await db.commit()

    return MentorAvailabilityResponse(
        slots=[AvailabilitySlotItem.model_validate(s) for s in new_slots]
    )


async def get_mentor_dashboard(
    db: AsyncSession,
    *,
    current_user: User,
) -> MentorDashboardResponse:
    """Retrieve consolidated Mentor Dashboard KPIs, pending requests, and upcoming sessions (PRD §5 F-024 / D-002)."""
    # 1. Fetch or create mentor profile
    prof_res = await db.execute(
        select(MentorProfile)
        .options(selectinload(MentorProfile.user))
        .where(MentorProfile.user_id == current_user.id)
    )
    profile = prof_res.scalar_one_or_none()
    if not profile:
        profile = MentorProfile(
            id=uuid.uuid4(),
            user_id=current_user.id,
            niches=[],
            languages=["ur", "en"],
            city="Pakistan",
            bio="Experienced industry professional offering guidance on Hunar.",
            avatar_url=None,
            rating=5.0,
            review_count=0,
            status="active" if current_user.status == "active" else "pending",
            created_at=datetime.now(UTC),
        )
        db.add(profile)
        await db.commit()
        refreshed = await db.execute(
            select(MentorProfile)
            .options(selectinload(MentorProfile.user))
            .where(MentorProfile.user_id == current_user.id)
        )
        profile = refreshed.scalar_one()

    # 2. Query bookings for this mentor
    bookings_res = await db.execute(
        select(Booking)
        .options(
            selectinload(Booking.service),
            selectinload(Booking.entrepreneur),
            selectinload(Booking.payment),
        )
        .where(Booking.mentor_id == profile.id)
        .order_by(Booking.created_at.desc())
    )
    all_bookings = bookings_res.scalars().all()

    pending_items: list[MentorDashboardSessionItem] = []
    upcoming_items: list[MentorDashboardSessionItem] = []
    total_earnings_pkr = 0

    for b in all_bookings:
        # Sum released payments for earnings
        if b.payment and b.payment.status == "released":
            total_earnings_pkr += b.payment.amount_pkr
        elif b.status == "completed" and b.payment and b.payment.status != "refunded":
            total_earnings_pkr += b.payment.amount_pkr

        item = MentorDashboardSessionItem(
            id=b.id,
            service_id=b.service_id,
            service_title=b.service.title if b.service else "Mentoring Session",
            service_type=b.service.type if b.service else "session",
            entrepreneur_id=b.entrepreneur_id,
            entrepreneur_name=b.entrepreneur.name if b.entrepreneur else "Entrepreneur",
            status=b.status,
            amount_pkr=b.payment.amount_pkr
            if b.payment
            else (b.service.price_pkr if b.service else 0),
            duration_min=b.service.duration_min if b.service else 60,
            scheduled_at=b.scheduled_at,
            notes=b.notes,
            session_notes=b.session_notes,
            payment_status=b.payment.status if b.payment else "held",
            created_at=b.created_at,
        )

        if b.status == "requested":
            pending_items.append(item)
        elif b.status in ("accepted", "scheduled"):
            upcoming_items.append(item)

    return MentorDashboardResponse(
        pending_requests_count=len(pending_items),
        upcoming_sessions_count=len(upcoming_items),
        total_earnings_pkr=total_earnings_pkr,
        average_rating=float(profile.rating or 5.0),
        review_count=int(profile.review_count or 0),
        pending_requests=pending_items,
        upcoming_sessions=upcoming_items,
        recent_reviews=[],
    )


async def get_mentor_mentees(
    db: AsyncSession,
    *,
    current_user: User,
) -> MenteeListResponse:
    """List all mentees who have booked a service with this mentor (PRD §5 F-025, §13.2)."""
    # 1. Look up mentor profile
    profile_res = await db.execute(
        select(MentorProfile).where(MentorProfile.user_id == current_user.id)
    )
    profile = profile_res.scalar_one_or_none()
    if not profile:
        return MenteeListResponse(mentees=[], total_count=0)

    # 2. Query all bookings for this mentor with entrepreneur and service details
    bookings_res = await db.execute(
        select(Booking)
        .options(
            selectinload(Booking.entrepreneur),
            selectinload(Booking.service),
        )
        .where(Booking.mentor_id == profile.id)
        .order_by(Booking.created_at.desc())
    )
    bookings = bookings_res.scalars().all()

    # 3. Group bookings by entrepreneur_id
    mentee_bookings: dict[uuid.UUID, list[Booking]] = {}
    for b in bookings:
        mentee_bookings.setdefault(b.entrepreneur_id, []).append(b)

    mentee_items: list[MenteeListItem] = []

    for entrepreneur_id, b_list in mentee_bookings.items():
        user: User | None = b_list[0].entrepreneur
        if not user:
            user_res = await db.execute(select(User).where(User.id == entrepreneur_id))
            user = user_res.scalar_one_or_none()
        if not user:
            continue

        # Look up business
        biz_res = await db.execute(select(Business).where(Business.owner_id == entrepreneur_id))
        biz = biz_res.scalar_one_or_none()

        tasks_total = 0
        tasks_completed = 0
        if biz:
            plan_res = await db.execute(select(LaunchPlan).where(LaunchPlan.business_id == biz.id))
            plan = plan_res.scalar_one_or_none()
            if plan:
                tasks_cnt_res = await db.execute(
                    select(
                        func.count(PlanTask.id),
                        func.count(PlanTask.id).filter(PlanTask.status == "completed"),
                    ).where(PlanTask.plan_id == plan.id)
                )
                cnt_row = tasks_cnt_res.one()
                tasks_total = cnt_row[0] or 0
                tasks_completed = cnt_row[1] or 0

        latest_booking = b_list[0]
        mentee_items.append(
            MenteeListItem(
                entrepreneur_id=user.id,
                name=user.name,
                email=user.email,
                business_name=biz.name if biz else None,
                business_niche=biz.niche if biz else None,
                business_city=biz.city if biz else None,
                total_bookings=len(b_list),
                latest_booking_status=latest_booking.status,
                latest_booking_date=latest_booking.scheduled_at or latest_booking.created_at,
                tasks_completed=tasks_completed,
                tasks_total=tasks_total,
            )
        )

    # Sort by latest booking date descending
    mentee_items.sort(
        key=lambda m: m.latest_booking_date or datetime.min.replace(tzinfo=UTC),
        reverse=True,
    )

    return MenteeListResponse(
        mentees=mentee_items,
        total_count=len(mentee_items),
    )


async def get_mentor_mentee_detail(
    db: AsyncSession,
    *,
    current_user: User,
    mentee_id: uuid.UUID,
) -> MenteeDetailResponse:
    """Retrieve full Mentee View and synthesized one-page Mentor Brief (PRD §5 F-025, §10 W-005, §13.2)."""
    # 1. Look up mentor profile
    profile_res = await db.execute(
        select(MentorProfile).where(MentorProfile.user_id == current_user.id)
    )
    profile = profile_res.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor profile not found.",
        )

    # 2. Verify authorization / scoping: has this mentee booked with this mentor?
    bookings_res = await db.execute(
        select(Booking)
        .options(
            selectinload(Booking.service),
            selectinload(Booking.payment),
        )
        .where(
            Booking.mentor_id == profile.id,
            Booking.entrepreneur_id == mentee_id,
        )
        .order_by(Booking.created_at.desc())
    )
    bookings = bookings_res.scalars().all()
    if not bookings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentee not found or no booked sessions exist with this mentor.",
        )

    # 3. Retrieve Mentee user
    user_res = await db.execute(select(User).where(User.id == mentee_id))
    mentee_user = user_res.scalar_one_or_none()
    if not mentee_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentee account not found.",
        )

    # 4. Retrieve Business and associated data
    biz_res = await db.execute(
        select(Business)
        .options(
            selectinload(Business.products),
            selectinload(Business.validation_report),
        )
        .where(Business.owner_id == mentee_id)
    )
    biz = biz_res.scalar_one_or_none()

    plan_status: str | None = None
    tasks_total = 0
    tasks_completed = 0
    completion_rate = 0.0
    recent_tasks: list[MenteeTaskSummary] = []
    content_items_total = 0
    content_items_posted = 0
    competitor_gap: str | None = None
    validation_conf: str | None = None
    products_count = 0
    products_summary = ""

    if biz:
        if biz.validation_report:
            validation_conf = biz.validation_report.confidence
            if biz.validation_report.how_to_be_better:
                competitor_gap = biz.validation_report.how_to_be_better[0]
            else:
                competitor_gap = biz.validation_report.demand_summary
        products_count = len(biz.products)
        if biz.products:
            products_summary = ", ".join(f"{p.name} (PKR {p.price_pkr})" for p in biz.products[:3])

        # Plan progress
        plan_res = await db.execute(select(LaunchPlan).where(LaunchPlan.business_id == biz.id))
        plan = plan_res.scalar_one_or_none()
        if plan:
            plan_status = plan.status
            tasks_res = await db.execute(
                select(PlanTask)
                .where(PlanTask.plan_id == plan.id)
                .order_by(PlanTask.week, PlanTask.order_index)
            )
            all_tasks = tasks_res.scalars().all()
            tasks_total = len(all_tasks)
            tasks_completed = sum(1 for t in all_tasks if t.status == "completed")
            completion_rate = round((tasks_completed / tasks_total * 100), 1) if tasks_total > 0 else 0.0
            recent_tasks = [
                MenteeTaskSummary(
                    id=t.id,
                    title=t.title,
                    category=t.category,
                    week=t.week,
                    status=t.status,
                    due_date=str(t.due_date) if t.due_date else None,
                )
                for t in all_tasks[:8]
            ]

        # Content items progress
        cal_res = await db.execute(
            select(ContentCalendar).where(ContentCalendar.business_id == biz.id)
        )
        cal = cal_res.scalar_one_or_none()
        if cal:
            items_res = await db.execute(
                select(ContentItem).where(ContentItem.calendar_id == cal.id)
            )
            c_items = items_res.scalars().all()
            content_items_total = len(c_items)
            content_items_posted = sum(1 for ci in c_items if ci.status == "posted")

    # 5. Session History
    session_history: list[MenteeBookingSummary] = []
    latest_booking_notes = bookings[0].notes if bookings else None
    for b in bookings:
        session_history.append(
            MenteeBookingSummary(
                id=b.id,
                service_title=b.service.title if b.service else "Mentoring Session",
                service_type=b.service.type if b.service else "session",
                scheduled_at=b.scheduled_at,
                status=b.status,
                amount_pkr=b.payment.amount_pkr if b.payment else (b.service.price_pkr if b.service else 0),
                duration_min=b.service.duration_min if b.service else 60,
                notes=b.notes,
                session_notes=b.session_notes,
                created_at=b.created_at,
            )
        )

    # 6. Run Mentor Brief Agent
    brief_out = await run_mentor_brief_agent(
        entrepreneur_name=mentee_user.name,
        business_name=biz.name if biz else "New Venture",
        niche=biz.niche if biz else "Business",
        city=biz.city if biz else "Pakistan",
        budget_pkr=biz.budget_pkr if biz else 20000,
        tasks_total=tasks_total,
        tasks_completed=tasks_completed,
        content_posted=content_items_posted,
        mentee_notes=latest_booking_notes,
        competitor_gap=competitor_gap,
        products_summary=products_summary,
    )

    mentor_brief_data = MenteeBriefData(
        executive_summary=brief_out.executive_summary,
        stage=brief_out.stage,
        key_blockers=brief_out.key_blockers,
        focus_areas=brief_out.focus_areas,
        recommended_questions=brief_out.recommended_questions,
        growth_priorities=brief_out.growth_priorities,
    )

    return MenteeDetailResponse(
        entrepreneur_id=mentee_user.id,
        name=mentee_user.name,
        email=mentee_user.email,
        business_id=biz.id if biz else None,
        business_name=biz.name if biz else None,
        niche=biz.niche if biz else None,
        city=biz.city if biz else None,
        area=biz.area if biz else None,
        budget_pkr=biz.budget_pkr if biz else None,
        hours_per_week=biz.hours_per_week if biz else None,
        tone=biz.tone if biz else None,
        languages=biz.languages if biz else [],
        platforms=biz.platforms if biz else [],
        target_customer=biz.target_customer if biz else None,
        validation_confidence=validation_conf,
        competitor_gap=competitor_gap,
        products_count=products_count,
        plan_status=plan_status,
        tasks_total=tasks_total,
        tasks_completed=tasks_completed,
        completion_rate=completion_rate,
        recent_tasks=recent_tasks,
        content_items_total=content_items_total,
        content_items_posted=content_items_posted,
        session_history=session_history,
        mentor_brief=mentor_brief_data,
    )


# ---------------------------------------------------------------------------
# Task 42 — Earnings View (F-026 / R-006)
# ---------------------------------------------------------------------------

_PERIOD_LABELS: dict[str, str] = {
    "this_month": "This Month",
    "last_month": "Last Month",
    "this_year": "This Year",
    "all": "All Time",
}


async def get_mentor_earnings(
    db: AsyncSession,
    *,
    current_user: User,
    period: str = "all",
) -> MentorEarningsResponse:
    """Retrieve mentor earnings report with KPIs, monthly trend, and transaction ledger (F-026 / R-006)."""
    # 1. Resolve mentor profile
    prof_res = await db.execute(
        select(MentorProfile).where(MentorProfile.user_id == current_user.id)
    )
    profile = prof_res.scalar_one_or_none()
    if not profile:
        # Return empty report for newly onboarded mentors
        return MentorEarningsResponse(
            total_earned_pkr=0,
            pending_escrow_pkr=0,
            total_refunded_pkr=0,
            completed_sessions_count=0,
            average_session_fee_pkr=0,
            period=period,
            period_label=_PERIOD_LABELS.get(period, "All Time"),
            monthly_trend=[],
            transactions=[],
        )

    # 2. Compute date boundaries for period filter
    now = datetime.now(UTC)
    period_start: datetime | None = None
    period_end: datetime | None = None

    if period == "this_month":
        period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == "last_month":
        first_of_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        # Last day of previous month = day before first of this month
        last_month_end = first_of_this_month
        last_month_start = (first_of_this_month.replace(month=first_of_this_month.month - 1) if first_of_this_month.month > 1
                            else first_of_this_month.replace(year=first_of_this_month.year - 1, month=12))
        period_start = last_month_start
        period_end = last_month_end
    elif period == "this_year":
        period_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    # 3. Fetch all bookings for this mentor (with payments and entrepreneur)
    bookings_query = (
        select(Booking)
        .options(
            selectinload(Booking.service),
            selectinload(Booking.entrepreneur),
            selectinload(Booking.payment),
        )
        .where(Booking.mentor_id == profile.id)
        .order_by(Booking.created_at.desc())
    )
    bookings_res = await db.execute(bookings_query)
    all_bookings = list(bookings_res.scalars().all())

    # 4. Compute KPIs and build transactions
    total_earned_pkr = 0
    pending_escrow_pkr = 0
    total_refunded_pkr = 0
    completed_sessions_count = 0
    transactions: list[EarningsTransaction] = []

    # monthly aggregation: key = (year, month)
    monthly_data: dict[tuple[int, int], dict[str, int]] = {}

    for b in all_bookings:
        # Apply period filter on created_at
        b_time = b.created_at
        if b_time.tzinfo is None:
            b_time = b_time.replace(tzinfo=UTC)

        if period_start and b_time < period_start:
            continue
        if period_end and b_time >= period_end:
            continue

        fee = b.payment.amount_pkr if b.payment else (b.service.price_pkr if b.service else 0)
        pay_status = b.payment.status if b.payment else "held"

        # KPI aggregation
        if pay_status == "released" or (b.status == "completed" and pay_status not in ("refunded",)):
            total_earned_pkr += fee
            if b.status == "completed":
                completed_sessions_count += 1
        elif pay_status == "held" and b.status in ("requested", "accepted", "scheduled"):
            pending_escrow_pkr += fee
        elif pay_status == "refunded":
            total_refunded_pkr += fee

        # Monthly aggregation
        ym_key = (b_time.year, b_time.month)
        if ym_key not in monthly_data:
            monthly_data[ym_key] = {"earned": 0, "refunded": 0, "sessions": 0}
        if pay_status == "released" or (b.status == "completed" and pay_status not in ("refunded",)):
            monthly_data[ym_key]["earned"] += fee
            monthly_data[ym_key]["sessions"] += 1
        elif pay_status == "refunded":
            monthly_data[ym_key]["refunded"] += fee

        # Build transaction entry
        mentee_name = b.entrepreneur.name if b.entrepreneur else "Entrepreneur"
        svc_title = b.service.title if b.service else "Mentoring Session"
        svc_type = b.service.type if b.service else "session"

        completed_at: datetime | None = None
        if b.status in ("completed", "reviewed"):
            completed_at = b.updated_at

        transactions.append(
            EarningsTransaction(
                booking_id=b.id,
                mentee_name=mentee_name,
                service_title=svc_title,
                service_type=svc_type,
                amount_pkr=fee,
                payment_status=pay_status,
                booking_status=b.status,
                scheduled_at=b.scheduled_at,
                completed_at=completed_at,
                created_at=b.created_at,
            )
        )

    # 5. Build monthly trend (ascending by date, last 12 months or period range)
    import calendar

    monthly_trend: list[MonthlyEarningSummary] = []
    for (yr, mo), data in sorted(monthly_data.items()):
        month_label = f"{calendar.month_abbr[mo]} {yr}"
        monthly_trend.append(
            MonthlyEarningSummary(
                year=yr,
                month=mo,
                month_label=month_label,
                sessions_completed=data["sessions"],
                earned_pkr=data["earned"],
                refunded_pkr=data["refunded"],
            )
        )

    avg_fee = total_earned_pkr // completed_sessions_count if completed_sessions_count > 0 else 0

    period_label = _PERIOD_LABELS.get(period, "All Time")
    if period == "this_month":
        period_label = f"{calendar.month_name[now.month]} {now.year}"
    elif period == "this_year":
        period_label = str(now.year)
    elif period == "last_month":
        lm = now.month - 1 if now.month > 1 else 12
        lm_yr = now.year if now.month > 1 else now.year - 1
        period_label = f"{calendar.month_name[lm]} {lm_yr}"

    return MentorEarningsResponse(
        total_earned_pkr=total_earned_pkr,
        pending_escrow_pkr=pending_escrow_pkr,
        total_refunded_pkr=total_refunded_pkr,
        completed_sessions_count=completed_sessions_count,
        average_session_fee_pkr=avg_fee,
        period=period,
        period_label=period_label,
        monthly_trend=monthly_trend,
        transactions=transactions,
    )
