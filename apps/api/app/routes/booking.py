"""Booking and Payment routes (PRD §5 F-019, §10 W-005, §13.2)."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_role
from app.core.database import get_db
from app.models.user import User
from app.schemas.booking import (
    BookingCreateRequest,
    BookingDetailResponse,
    BookingItemResponse,
    BookingUpdateRequest,
)
from app.schemas.common import PaginatedResponse
from app.services.booking import (
    create_booking,
    get_booking_by_id,
    list_bookings,
    update_booking,
)

bookings_router = APIRouter(
    prefix="/api/v1/bookings",
    tags=["bookings"],
)


@bookings_router.post(
    "",
    response_model=BookingDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Book a mentor service (F-019)",
)
async def book_mentor_service(
    data: BookingCreateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("entrepreneur", "super_admin")),
) -> BookingDetailResponse:
    """Create a new booking and hold simulated payment in escrow."""
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return await create_booking(
        db,
        current_user=current_user,
        data=data,
        ip=client_ip,
        user_agent=user_agent,
    )


@bookings_router.get(
    "",
    response_model=PaginatedResponse[BookingItemResponse],
    summary="List bookings (F-019, F-020)",
)
async def list_user_bookings(
    page: Annotated[int, Query(ge=1, description="Page number")] = 1,
    page_size: Annotated[int, Query(ge=1, le=100, description="Items per page")] = 20,
    status_filter: Annotated[
        str | None, Query(alias="status", description="Filter by booking status")
    ] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("entrepreneur", "mentor", "super_admin")),
) -> PaginatedResponse[BookingItemResponse]:
    """Retrieve bookings scoped by participant role."""
    items, total = await list_bookings(
        db,
        current_user=current_user,
        page=page,
        page_size=page_size,
        status_filter=status_filter,
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@bookings_router.get(
    "/{booking_id}",
    response_model=BookingDetailResponse,
    summary="Get booking detail (F-019)",
)
async def get_booking_details(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("entrepreneur", "mentor", "super_admin")),
) -> BookingDetailResponse:
    """Retrieve full detail of a booking if participant or super_admin."""
    return await get_booking_by_id(
        db,
        current_user=current_user,
        booking_id=booking_id,
    )


@bookings_router.patch(
    "/{booking_id}",
    response_model=BookingDetailResponse,
    summary="Update booking status or details (F-019, F-020)",
)
async def update_booking_details(
    booking_id: uuid.UUID,
    data: BookingUpdateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("entrepreneur", "mentor", "super_admin")),
) -> BookingDetailResponse:
    """Update booking status (cancel, accept, complete) or notes."""
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return await update_booking(
        db,
        current_user=current_user,
        booking_id=booking_id,
        data=data,
        ip=client_ip,
        user_agent=user_agent,
    )
