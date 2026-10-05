"""Mentor and Mentor Service routes (PRD §5 F-018, §13.2)."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.core.database import get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.mentor import (
    MentorServiceDetailResponse,
    MentorServiceItemResponse,
    MentorSummaryResponse,
)
from app.services.mentor import (
    get_service_by_id,
    list_active_mentors,
    list_active_services,
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
    service_type: Annotated[str | None, Query(alias="type", description="Filter by service type")] = None,
    max_price: Annotated[int | None, Query(ge=1, description="Filter by max PKR price")] = None,
    city: Annotated[str | None, Query(description="Filter by mentor city")] = None,
    search: Annotated[str | None, Query(description="Search keyword in title, description, mentor name")] = None,
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
