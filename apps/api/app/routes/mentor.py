"""Mentor and Mentor Service routes (PRD §5 F-018, §13.2)."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.core.database import get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.mentor import (
    MenteeDetailResponse,
    MenteeListResponse,
    MentorAvailabilityResponse,
    MentorAvailabilityUpdateRequest,
    MentorDashboardResponse,
    MentorEarningsResponse,
    MentorProfileResponse,
    MentorProfileUpdateRequest,
    MentorServiceCreateRequest,
    MentorServiceDetailResponse,
    MentorServiceItemResponse,
    MentorServiceResponse,
    MentorServiceUpdateRequest,
    MentorSummaryResponse,
)
from app.services.mentor import (
    create_my_service,
    delete_my_service,
    get_mentor_dashboard,
    get_mentor_earnings,
    get_mentor_mentee_detail,
    get_mentor_mentees,
    get_my_availability,
    get_my_mentor_profile,
    get_service_by_id,
    list_active_mentors,
    list_active_services,
    list_my_services,
    set_my_availability,
    update_my_mentor_profile,
    update_my_service,
)

services_router = APIRouter(
    prefix="/api/v1/services",
    tags=["services"],
    dependencies=[Depends(require_role("entrepreneur", "super_admin", "mentor"))],
)

mentors_router = APIRouter(
    prefix="/api/v1/mentors",
    tags=["mentors"],
    dependencies=[Depends(require_role("entrepreneur", "super_admin", "mentor"))],
)


@services_router.get(
    "",
    response_model=PaginatedResponse[MentorServiceItemResponse],
    summary="Browse active mentor services (F-018)",
)
async def browse_services(
    niche: Annotated[str | None, Query(description="Filter by niche")] = None,
    service_type: Annotated[
        str | None, Query(alias="type", description="Filter by service type")
    ] = None,
    max_price: Annotated[int | None, Query(ge=1, description="Filter by max PKR price")] = None,
    city: Annotated[str | None, Query(description="Filter by mentor city")] = None,
    search: Annotated[
        str | None, Query(description="Search keyword in title, description, mentor name")
    ] = None,
    page: Annotated[int, Query(ge=1, description="Page number")] = 1,
    page_size: Annotated[int, Query(ge=1, le=100, description="Items per page")] = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaginatedResponse[MentorServiceItemResponse]:
    """Retrieve paginated active mentor services with filters."""
    items, total = await list_active_services(
        db,
        niche=niche,
        service_type=service_type,
        max_price=max_price,
        city=city,
        search=search,
        page=page,
        page_size=page_size,
    )
    return PaginatedResponse[MentorServiceItemResponse](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@services_router.get(
    "/{service_id}",
    response_model=MentorServiceDetailResponse,
    summary="Get mentor service detail by ID",
)
async def get_service(
    service_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MentorServiceDetailResponse:
    """Retrieve full detail for a mentor service by ID."""
    service = await get_service_by_id(db, service_id)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mentor service with ID '{service_id}' not found.",
        )
    return service


@mentors_router.get(
    "",
    response_model=PaginatedResponse[MentorSummaryResponse],
    summary="Browse active mentors",
)
async def browse_mentors(
    page: Annotated[int, Query(ge=1, description="Page number")] = 1,
    page_size: Annotated[int, Query(ge=1, le=100, description="Items per page")] = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaginatedResponse[MentorSummaryResponse]:
    """Retrieve paginated active mentors."""
    items, total = await list_active_mentors(
        db,
        page=page,
        page_size=page_size,
    )
    return PaginatedResponse[MentorSummaryResponse](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@mentors_router.get(
    "/me",
    response_model=MentorProfileResponse,
    summary="Get current mentor profile (F-021)",
)
async def get_own_mentor_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("mentor", "super_admin")),
) -> MentorProfileResponse:
    """Retrieve authenticated mentor's own profile for viewing or editing."""
    return await get_my_mentor_profile(db, current_user=current_user)


@mentors_router.patch(
    "/me",
    response_model=MentorProfileResponse,
    summary="Update current mentor profile (F-021)",
)
async def update_own_mentor_profile(
    data: MentorProfileUpdateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("mentor", "super_admin")),
) -> MentorProfileResponse:
    """Update profile bio, city, niches, languages, or avatar."""
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return await update_my_mentor_profile(
        db,
        current_user=current_user,
        data=data,
        ip=client_ip,
        user_agent=user_agent,
    )


@mentors_router.get(
    "/me/services",
    response_model=list[MentorServiceResponse],
    summary="List mentor's own services (F-022)",
)
async def list_own_mentor_services(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("mentor", "super_admin")),
) -> list[MentorServiceResponse]:
    """Retrieve all coaching and consultation services created by the current mentor."""
    return await list_my_services(db, current_user=current_user)


@mentors_router.post(
    "/me/services",
    response_model=MentorServiceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new mentor service (F-022)",
)
async def create_own_mentor_service(
    data: MentorServiceCreateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("mentor", "super_admin")),
) -> MentorServiceResponse:
    """Create a new service offering with title, description, niche, type, duration, and price."""
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return await create_my_service(
        db,
        current_user=current_user,
        data=data,
        ip=client_ip,
        user_agent=user_agent,
    )


@mentors_router.patch(
    "/me/services/{service_id}",
    response_model=MentorServiceResponse,
    summary="Update mentor service (F-022)",
)
async def update_own_mentor_service(
    service_id: uuid.UUID,
    data: MentorServiceUpdateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("mentor", "super_admin")),
) -> MentorServiceResponse:
    """Update title, description, niche, type, duration, price, or active status."""
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return await update_my_service(
        db,
        current_user=current_user,
        service_id=service_id,
        data=data,
        ip=client_ip,
        user_agent=user_agent,
    )


@mentors_router.delete(
    "/me/services/{service_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete mentor service (F-022)",
)
async def delete_own_mentor_service(
    service_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("mentor", "super_admin")),
) -> None:
    """Delete a service offering if no active bookings exist."""
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    await delete_my_service(
        db,
        current_user=current_user,
        service_id=service_id,
        ip=client_ip,
        user_agent=user_agent,
    )


@mentors_router.get(
    "/me/availability",
    response_model=MentorAvailabilityResponse,
    summary="Get mentor availability schedule (F-023)",
)
async def get_own_availability(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("mentor", "super_admin")),
) -> MentorAvailabilityResponse:
    """Retrieve current mentor's recurring weekly availability time slots."""
    return await get_my_availability(db, current_user=current_user)


@mentors_router.put(
    "/me/availability",
    response_model=MentorAvailabilityResponse,
    summary="Update mentor availability schedule (F-023)",
)
async def update_own_availability(
    data: MentorAvailabilityUpdateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("mentor", "super_admin")),
) -> MentorAvailabilityResponse:
    """Replace recurring weekly availability time windows with audit logging."""
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return await set_my_availability(
        db,
        current_user=current_user,
        data=data,
        ip=client_ip,
        user_agent=user_agent,
    )


@mentors_router.get(
    "/me/dashboard",
    response_model=MentorDashboardResponse,
    summary="Get mentor dashboard overview (F-024 / D-002)",
)
async def get_own_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("mentor", "super_admin")),
) -> MentorDashboardResponse:
    """Retrieve mentor dashboard with KPIs, pending requests, and upcoming sessions."""
    return await get_mentor_dashboard(db, current_user=current_user)


@mentors_router.get(
    "/me/mentees",
    response_model=MenteeListResponse,
    summary="List mentees booked with the mentor (F-025)",
)
async def list_own_mentees(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("mentor", "super_admin")),
) -> MenteeListResponse:
    """Retrieve all entrepreneurs who have booked sessions with the authenticated mentor."""
    return await get_mentor_mentees(db, current_user=current_user)


@mentors_router.get(
    "/me/mentees/{mentee_id}",
    response_model=MenteeDetailResponse,
    summary="Get detailed mentee report and one-page brief (F-025)",
)
async def get_own_mentee_detail(
    mentee_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("mentor", "super_admin")),
) -> MenteeDetailResponse:
    """Retrieve detailed mentee business profile, launch plan progress, and AI-generated session brief."""
    return await get_mentor_mentee_detail(db, current_user=current_user, mentee_id=mentee_id)


@mentors_router.get(
    "/me/earnings",
    response_model=MentorEarningsResponse,
    summary="Get mentor earnings report (F-026 / R-006)",
)
async def get_own_earnings(
    period: str = Query(
        default="all",
        description="Time period filter: all | this_month | last_month | this_year",
        pattern="^(all|this_month|last_month|this_year)$",
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("mentor", "super_admin")),
) -> MentorEarningsResponse:
    """Retrieve earnings report with KPIs, monthly trend, and transaction ledger for the authenticated mentor."""
    return await get_mentor_earnings(db, current_user=current_user, period=period)
