"""Service layer for Mentor and MentorService operations (PRD §5 F-018, §13.2)."""

import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.audit import record_audit_log
from app.models.booking import Booking
from app.models.mentor import MentorAvailability, MentorProfile, MentorService
from app.models.user import User
from app.schemas.mentor import (
    AvailabilitySlotItem,
    MentorAvailabilityResponse,
    MentorAvailabilityUpdateRequest,
    MentorDashboardResponse,
    MentorDashboardSessionItem,
    MentorProfileResponse,
    MentorProfileUpdateRequest,
    MentorServiceCreateRequest,
    MentorServiceDetailResponse,
    MentorServiceItemResponse,
    MentorServiceResponse,
    MentorServiceUpdateRequest,
    MentorSummaryResponse,
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

