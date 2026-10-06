"""Service layer for Booking operations and simulated payments (PRD §5 F-019, §10 W-005, §13.2)."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.audit import record_audit_log
from app.models.booking import Booking, PaymentSim
from app.models.mentor import MentorProfile, MentorService
from app.models.user import User
from app.schemas.booking import (
    BookingCreateRequest,
    BookingDetailResponse,
    BookingItemResponse,
    BookingUpdateRequest,
)


async def create_booking(
    db: AsyncSession,
    *,
    current_user: User,
    data: BookingCreateRequest,
    ip: str | None = None,
    user_agent: str | None = None,
) -> BookingDetailResponse:
    """Create a new service booking request and hold payment in simulated escrow (PRD §5 F-019, W-005)."""
    service_query = (
        select(MentorService)
        .options(
            selectinload(MentorService.mentor).selectinload(MentorProfile.user),
        )
        .where(MentorService.id == data.service_id)
    )
    result = await db.execute(service_query)
    service = result.scalar_one_or_none()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor service not found",
        )

    if not service.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Service is not active and cannot be booked",
        )

    if service.mentor.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mentor is not currently active",
        )

    if service.mentor.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mentors cannot book their own services",
        )

    from datetime import UTC, datetime

    now = datetime.now(UTC)
    booking_id = uuid.uuid4()

    # 1. Create booking row
    booking = Booking(
        id=booking_id,
        service_id=service.id,
        mentor_id=service.mentor_id,
        entrepreneur_id=current_user.id,
        status="requested",
        scheduled_at=data.scheduled_at,
        notes=data.notes,
        created_at=now,
    )
    db.add(booking)
    await db.flush()

    # 2. Create simulated escrow payment
    payment = PaymentSim(
        id=uuid.uuid4(),
        booking_id=booking_id,
        amount_pkr=service.price_pkr,
        status="held",
        created_at=now,
    )
    db.add(payment)
    await db.flush()

    # 3. Record immutable audit event
    await record_audit_log(
        db=db,
        action="booking.created",
        actor_id=current_user.id,
        actor_role=current_user.role,
        target_type="booking",
        target_id=str(booking.id),
        ip=ip,
        user_agent=user_agent,
        after={
            "booking_id": str(booking.id),
            "service_id": str(service.id),
            "amount_pkr": service.price_pkr,
            "status": "requested",
        },
    )

    await db.commit()

    return BookingDetailResponse(
        id=booking.id,
        service_id=service.id,
        service_title=service.title,
        service_type=service.type,
        mentor_id=service.mentor_id,
        mentor_name=service.mentor.user.name,
        mentor_avatar_url=service.mentor.avatar_url,
        entrepreneur_id=current_user.id,
        entrepreneur_name=current_user.name,
        status=booking.status,
        amount_pkr=payment.amount_pkr,
        duration_min=service.duration_min,
        scheduled_at=booking.scheduled_at,
        created_at=booking.created_at,
        notes=booking.notes,
        session_notes=booking.session_notes,
        service_description=service.description,
        payment_status=payment.status,
        updated_at=booking.updated_at,
    )


async def list_bookings(
    db: AsyncSession,
    *,
    current_user: User,
    page: int = 1,
    page_size: int = 20,
    status_filter: str | None = None,
) -> tuple[list[BookingItemResponse], int]:
    """List bookings scoped strictly by role (PRD §5 F-019, F-020, §12.3)."""
    query = (
        select(Booking)
        .options(
            selectinload(Booking.service),
            selectinload(Booking.mentor).selectinload(MentorProfile.user),
            selectinload(Booking.entrepreneur),
            selectinload(Booking.payment),
        )
    )

    if current_user.role == "entrepreneur":
        query = query.where(Booking.entrepreneur_id == current_user.id)
    elif current_user.role == "mentor":
        mentor_prof_res = await db.execute(
            select(MentorProfile).where(MentorProfile.user_id == current_user.id)
        )
        mentor_prof = mentor_prof_res.scalar_one_or_none()
        if not mentor_prof:
            return [], 0
        query = query.where(Booking.mentor_id == mentor_prof.id)
    # super_admin sees all

    if status_filter:
        query = query.where(Booking.status == status_filter)

    count_query = select(func.count()).select_from(query.subquery())
    count_res = await db.execute(count_query)
    total = count_res.scalar() or 0

    items_res = await db.execute(
        query.order_by(Booking.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    bookings = items_res.scalars().all()

    items = [
        BookingItemResponse(
            id=b.id,
            service_id=b.service_id,
            service_title=b.service.title,
            service_type=b.service.type,
            mentor_id=b.mentor_id,
            mentor_name=b.mentor.user.name,
            mentor_avatar_url=b.mentor.avatar_url,
            entrepreneur_id=b.entrepreneur_id,
            entrepreneur_name=b.entrepreneur.name,
            status=b.status,
            amount_pkr=b.payment.amount_pkr if b.payment else b.service.price_pkr,
            duration_min=b.service.duration_min,
            scheduled_at=b.scheduled_at,
            created_at=b.created_at,
            payment_status=b.payment.status if b.payment else "held",
        )
        for b in bookings
    ]

    return items, total


async def get_booking_by_id(
    db: AsyncSession,
    *,
    current_user: User,
    booking_id: uuid.UUID,
) -> BookingDetailResponse:
    """Retrieve full details of a booking with participant authorization check (PRD §5 F-019, §13.2)."""
    booking_query = (
        select(Booking)
        .options(
            selectinload(Booking.service),
            selectinload(Booking.mentor).selectinload(MentorProfile.user),
            selectinload(Booking.entrepreneur),
            selectinload(Booking.payment),
        )
        .where(Booking.id == booking_id)
    )
    result = await db.execute(booking_query)
    booking = result.scalar_one_or_none()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    is_entrepreneur = booking.entrepreneur_id == current_user.id
    is_mentor = booking.mentor.user_id == current_user.id
    is_admin = current_user.role == "super_admin"

    if not (is_entrepreneur or is_mentor or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: you are not a participant in this booking",
        )

    return BookingDetailResponse(
        id=booking.id,
        service_id=booking.service_id,
        service_title=booking.service.title,
        service_type=booking.service.type,
        mentor_id=booking.mentor_id,
        mentor_name=booking.mentor.user.name,
        mentor_avatar_url=booking.mentor.avatar_url,
        entrepreneur_id=booking.entrepreneur_id,
        entrepreneur_name=booking.entrepreneur.name,
        status=booking.status,
        amount_pkr=booking.payment.amount_pkr if booking.payment else booking.service.price_pkr,
        duration_min=booking.service.duration_min,
        scheduled_at=booking.scheduled_at,
        created_at=booking.created_at,
        notes=booking.notes,
        session_notes=booking.session_notes,
        service_description=booking.service.description,
        payment_status=booking.payment.status if booking.payment else "held",
        updated_at=booking.updated_at,
    )


async def update_booking(
    db: AsyncSession,
    *,
    current_user: User,
    booking_id: uuid.UUID,
    data: BookingUpdateRequest,
    ip: str | None = None,
    user_agent: str | None = None,
) -> BookingDetailResponse:
    """Update booking status or notes with participant authorization checks (PRD §5 F-019, F-020, §10 W-005, §13.2)."""
    from datetime import UTC, datetime

    booking_query = (
        select(Booking)
        .options(
            selectinload(Booking.service),
            selectinload(Booking.mentor).selectinload(MentorProfile.user),
            selectinload(Booking.entrepreneur),
            selectinload(Booking.payment),
        )
        .where(Booking.id == booking_id)
    )
    result = await db.execute(booking_query)
    booking = result.scalar_one_or_none()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    is_entrepreneur = booking.entrepreneur_id == current_user.id
    is_mentor = booking.mentor.user_id == current_user.id
    is_admin = current_user.role == "super_admin"

    if not (is_entrepreneur or is_mentor or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: you are not a participant in this booking",
        )

    old_status = booking.status

    if data.status and data.status != old_status:
        # Validate allowed transitions
        if data.status == "cancelled":
            # Per PRD W-005: Booking cancelled before session -> payment refunded
            if old_status in ["completed", "reviewed", "cancelled", "declined"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot cancel a booking that is already {old_status}",
                )
            booking.status = "cancelled"
            if booking.payment:
                booking.payment.status = "refunded"
            action_name = "booking.cancelled"

        elif data.status == "accepted":
            if not (is_mentor or is_admin):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only the mentor can accept a booking request",
                )
            if old_status != "requested":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot accept booking in {old_status} status",
                )
            booking.status = "accepted"
            action_name = "booking.accepted"

        elif data.status == "declined":
            if not (is_mentor or is_admin):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only the mentor can decline a booking request",
                )
            if old_status != "requested":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot decline booking in {old_status} status",
                )
            booking.status = "declined"
            if booking.payment:
                booking.payment.status = "refunded"
            action_name = "booking.declined"

        elif data.status == "completed":
            if not (is_mentor or is_admin):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only the mentor or admin can mark a booking as completed",
                )
            if old_status not in ["accepted", "scheduled"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot complete booking in {old_status} status",
                )
            booking.status = "completed"
            if booking.payment:
                booking.payment.status = "released"
            action_name = "booking.completed"

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid booking status transition: {data.status}",
            )

        await record_audit_log(
            db=db,
            action=action_name,
            actor_id=current_user.id,
            actor_role=current_user.role,
            target_type="booking",
            target_id=str(booking.id),
            ip=ip,
            user_agent=user_agent,
            before={"status": old_status},
            after={"status": booking.status},
        )

    if data.notes is not None:
        booking.notes = data.notes

    if data.session_notes is not None:
        if not (is_mentor or is_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the mentor can add session notes",
            )
        booking.session_notes = data.session_notes

    if data.scheduled_at is not None:
        booking.scheduled_at = data.scheduled_at

    booking.updated_at = datetime.now(UTC)

    await db.commit()

    return BookingDetailResponse(
        id=booking.id,
        service_id=booking.service_id,
        service_title=booking.service.title,
        service_type=booking.service.type,
        mentor_id=booking.mentor_id,
        mentor_name=booking.mentor.user.name,
        mentor_avatar_url=booking.mentor.avatar_url,
        entrepreneur_id=booking.entrepreneur_id,
        entrepreneur_name=booking.entrepreneur.name,
        status=booking.status,
        amount_pkr=booking.payment.amount_pkr if booking.payment else booking.service.price_pkr,
        duration_min=booking.service.duration_min,
        scheduled_at=booking.scheduled_at,
        created_at=booking.created_at,
        notes=booking.notes,
        session_notes=booking.session_notes,
        service_description=booking.service.description,
        payment_status=booking.payment.status if booking.payment else "held",
        updated_at=booking.updated_at,
    )
