"""Service layer for Mentor and MentorService operations (PRD §5 F-018, §13.2)."""

import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mentor import MentorProfile, MentorService
from app.models.user import User
from app.schemas.mentor import (
    MentorServiceDetailResponse,
    MentorServiceItemResponse,
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
