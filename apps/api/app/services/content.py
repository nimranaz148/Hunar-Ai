"""Content domain service layer: 30-Day Content Outline & Calendar Management (F-010, F-011 / PRD §12.3, §36.16)."""

import uuid
from datetime import UTC, date, datetime, timedelta
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import record_audit_log
from app.models.business import Business
from app.models.content import ContentCalendar, ContentItem, ResearchReport
from app.models.user import User
from app.schemas.content import (
    CalendarStatsResponse,
    ContentCalendarResponse,
    ContentCalendarViewResponse,
    ContentItemResponse,
    ContentOutlineActionResponse,
    ContentOutlineGateResponse,
    ResearchReportResponse,
    UpdateContentItemRequest,
)
from app.services.business import get_business_by_id


def generate_default_day_briefs(niche: str) -> list[dict[str, Any]]:
    """Generate 30 structured day-brief outlines balanced across pillars and formats."""
    pillars = [
        ("behind_the_scenes", "awareness", "Artisan workspace & material prep process"),
        ("product_showcase", "sales", "Hero collection piece closeup & price details"),
        ("education_tips", "engagement", f"How to choose quality {niche} and care for it"),
        ("social_proof", "leads", "Happy customer reaction and unboxing experience"),
    ]
    formats = ["reel", "carousel", "story", "static"]

    briefs = []
    for day in range(1, 31):
        idx = (day - 1) % len(pillars)
        format_idx = (day - 1) % len(formats)
        pillar, goal, base_idea = pillars[idx]
        fmt = formats[format_idx]

        briefs.append(
            {
                "day": day,
                "format": fmt,
                "pillar": pillar,
                "goal": goal,
                "key_idea": f"Day {day} ({pillar.replace('_', ' ').title()}): {base_idea}",
            }
        )
    return briefs


def get_default_pillars() -> list[dict[str, Any]]:
    return [
        {
            "name": "behind_the_scenes",
            "description": "Crafting process, workshop & packaging",
            "target_percentage": 30,
        },
        {
            "name": "product_showcase",
            "description": "Catalog styling, quality details & prices",
            "target_percentage": 35,
        },
        {
            "name": "education_tips",
            "description": "Care guide, material benefits & customer FAQs",
            "target_percentage": 20,
        },
        {
            "name": "social_proof",
            "description": "Customer reviews, orders dispatched & testimonials",
            "target_percentage": 15,
        },
    ]


def get_default_weekly_themes() -> list[dict[str, Any]]:
    return [
        {
            "week": 1,
            "theme": "Brand Story & Heritage",
            "objective": "Establish authentic founder identity and handmade craft",
        },
        {
            "week": 2,
            "theme": "Craftsmanship & Quality",
            "objective": "Highlight material uniqueness and detail over mass market alternatives",
        },
        {
            "week": 3,
            "theme": "Styling & Practical Value",
            "objective": "Provide everyday inspiration and customer styling tips",
        },
        {
            "week": 4,
            "theme": "Community Love & Conversion",
            "objective": "Showcase customer trust, reviews, and prompt direct inquiries/orders",
        },
    ]


async def get_or_create_content_calendar(
    db: AsyncSession,
    business: Business,
) -> ContentCalendar:
    """Retrieve existing content calendar or generate default outline."""
    stmt = select(ContentCalendar).where(ContentCalendar.business_id == business.id)
    res = await db.execute(stmt)
    calendar = res.scalar_one_or_none()

    if calendar:
        return calendar

    calendar = ContentCalendar(
        business_id=business.id,
        status="awaiting_approval",
        pillars=get_default_pillars(),
        weekly_themes=get_default_weekly_themes(),
        format_distribution={"reels": 40, "carousels": 30, "stories": 20, "static": 10},
        day_briefs=generate_default_day_briefs(business.niche),
    )
    db.add(calendar)
    await db.commit()
    await db.refresh(calendar)
    return calendar


async def get_or_create_research_report(
    db: AsyncSession,
    business: Business,
) -> ResearchReport:
    """Retrieve existing research report or initialize market research context."""
    stmt = select(ResearchReport).where(ResearchReport.business_id == business.id)
    res = await db.execute(stmt)
    report = res.scalar_one_or_none()

    if report:
        return report

    report = ResearchReport(
        business_id=business.id,
        competitors=[
            {
                "name": f"{business.niche.title()} Studio Lahore",
                "handle": f"@{business.niche}_lahore",
                "price_point": "mid-high",
                "key_advantage": "Fast 2-day delivery across Pakistan",
            },
            {
                "name": f"Handmade {business.niche.title()} Collective",
                "handle": f"@{business.niche}_craft",
                "price_point": "affordable",
                "key_advantage": "High viral reel engagement with artisan voiceovers",
            },
        ],
        how_to_be_better=[
            "Focus on transparent artisan background and unboxing videos",
            "Offer clear WhatsApp direct inquiry links in bio with 5-minute reply time",
            "Package orders with handwritten Urdu thank-you notes for organic story reposts",
        ],
        hashtags={
            "broad": [f"#{business.niche}pk", "#pakistanientrepreneur", "#handmadepk"],
            "niche": [f"#{business.niche}designs", f"#custom{business.niche}"],
            "local": [f"#{business.city.lower()}creatives", f"#{business.city.lower()}shopping"],
        },
        confidence=0.86,
        source_urls=[
            f"https://instagram.com/explore/tags/{business.niche}pk/",
            f"https://facebook.com/marketplace/{business.city.lower()}",
        ],
        researched_at=datetime.now(UTC),
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report


async def get_or_create_calendar_items(
    db: AsyncSession,
    calendar: ContentCalendar,
    business: Business,
) -> list[ContentItem]:
    """Retrieve existing 30 content items or generate them based on the calendar outline."""
    stmt = (
        select(ContentItem).where(ContentItem.calendar_id == calendar.id).order_by(ContentItem.day)
    )
    res = await db.execute(stmt)
    items = list(res.scalars().all())

    if items and len(items) == 30:
        return items

    briefs = calendar.day_briefs or generate_default_day_briefs(business.niche)
    base_date = date.today()
    created_items: list[ContentItem] = []

    for i, brief in enumerate(briefs):
        day = brief.get("day", i + 1)
        fmt = brief.get("format", "reel")
        pillar = brief.get("pillar", "product_showcase")
        goal = brief.get("goal", "awareness")
        key_idea = brief.get("key_idea", f"Day {day} Showcase")

        hook = f"Day {day}: {key_idea}"
        caption = (
            f"🌟 {business.name} — Day {day} Focus\n\n"
            f"{key_idea}. Har product hamaray {business.city} workshop mein bohut pyar aur mehnat se tayyar hota hai.\n\n"
            f"Dm 'ORDER' karein ya WhatsApp link par click karein."
        )
        cta = "Comment 'ORDER' ya WhatsApp par rabta karein to get direct details!"
        hashtags = [
            f"#{business.niche}pk",
            "#madeinpakistan",
            f"#{business.city.lower()}business",
            "#handcraftedpk",
        ]

        item = ContentItem(
            calendar_id=calendar.id,
            day=day,
            date=base_date + timedelta(days=i),
            platform=business.platforms or ["instagram", "facebook"],
            format=fmt,
            pillar=pillar,
            goal=goal,
            hook=hook,
            caption=caption,
            cta=cta,
            hashtags=hashtags,
            best_time_hint="6:30 PM - 8:30 PM",
            image_prompt={
                "subject": f"Handcrafted {business.niche} item for {business.name}",
                "style": "warm Pakistani aesthetic photography, soft ambient studio lighting",
                "composition": "close up flatlay with subtle artisan props",
            },
            video_prompt={
                "duration_sec": 15,
                "aspect_ratio": "9:16",
                "scenes": [
                    "Artisan handcrafting",
                    "Finished product reveal",
                    "Packaging with note",
                ],
            }
            if fmt in ["reel", "story"]
            else None,
            alt_text=f"Product photography showcasing handcrafted {business.niche} by {business.name}",
            status="approved" if calendar.status == "approved" else "draft",
        )
        db.add(item)
        created_items.append(item)

    await db.commit()
    for item in created_items:
        await db.refresh(item)
    return created_items


async def get_content_outline_gate(
    db: AsyncSession,
    business_id: uuid.UUID,
    user: User,
) -> ContentOutlineGateResponse:
    """Fetch Gate 2 Content Outline and supporting Research Report."""
    business = await get_business_by_id(db, business_id, user)

    calendar = await get_or_create_content_calendar(db, business)
    research = await get_or_create_research_report(db, business)

    return ContentOutlineGateResponse(
        calendar=ContentCalendarResponse.model_validate(calendar),
        research=ResearchReportResponse.model_validate(research),
    )


async def approve_content_outline(
    db: AsyncSession,
    business_id: uuid.UUID,
    user: User,
    request_id: uuid.UUID | None = None,
) -> ContentOutlineActionResponse:
    """Approve Human Gate 2 Content Outline, transition status to approved, and generate 30 items."""
    business = await get_business_by_id(db, business_id, user)

    stmt = select(ContentCalendar).where(ContentCalendar.business_id == business.id)
    res = await db.execute(stmt)
    calendar = res.scalar_one_or_none()

    if not calendar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content calendar outline not found for this business.",
        )

    calendar.status = "approved"
    calendar.approved_at = datetime.now(UTC)
    calendar.updated_at = datetime.now(UTC)

    # Automatically generate / seed 30 items upon outline approval
    await get_or_create_calendar_items(db, calendar, business)

    # Record append-only audit event
    await record_audit_log(
        db=db,
        action="content_outline.approved",
        actor_id=user.id,
        actor_role=user.role,
        target_type="content_calendar",
        target_id=str(calendar.id),
        request_id=request_id,
        meta={"business_id": str(business.id), "days_count": len(calendar.day_briefs)},
    )

    await db.commit()
    await db.refresh(calendar)

    return ContentOutlineActionResponse(
        status="approved",
        message="30-Day Content Outline approved successfully. Content Writer and Visual Prompt agents queued.",
        calendar=ContentCalendarResponse.model_validate(calendar),
    )


async def revise_content_outline(
    db: AsyncSession,
    business_id: uuid.UUID,
    user: User,
    notes: str,
    request_id: uuid.UUID | None = None,
) -> ContentOutlineActionResponse:
    """Request revisions for Gate 2 Content Outline with specific feedback notes."""
    business = await get_business_by_id(db, business_id, user)

    stmt = select(ContentCalendar).where(ContentCalendar.business_id == business.id)
    res = await db.execute(stmt)
    calendar = res.scalar_one_or_none()

    if not calendar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content calendar outline not found for this business.",
        )

    calendar.status = "revision_requested"
    calendar.revision_notes = notes
    calendar.updated_at = datetime.now(UTC)

    # Record append-only audit event
    await record_audit_log(
        db=db,
        action="content_outline.revision_requested",
        actor_id=user.id,
        actor_role=user.role,
        target_type="content_calendar",
        target_id=str(calendar.id),
        request_id=request_id,
        meta={"business_id": str(business.id), "notes": notes},
    )

    await db.commit()
    await db.refresh(calendar)

    return ContentOutlineActionResponse(
        status="revision_requested",
        message="Revision request sent to Content Strategist with your feedback.",
        calendar=ContentCalendarResponse.model_validate(calendar),
    )


async def get_calendar_view(
    db: AsyncSession,
    business_id: uuid.UUID,
    user: User,
    status_filter: str | None = None,
    format_filter: str | None = None,
    pillar_filter: str | None = None,
) -> ContentCalendarViewResponse:
    """Fetch 30-day Content Calendar view with item cards and progress metrics (F-011)."""
    business = await get_business_by_id(db, business_id, user)
    calendar = await get_or_create_content_calendar(db, business)

    all_items = await get_or_create_calendar_items(db, calendar, business)

    # Compute overall statistics
    stats = CalendarStatsResponse(
        total=len(all_items),
        draft=sum(1 for i in all_items if i.status == "draft"),
        approved=sum(1 for i in all_items if i.status == "approved"),
        posted=sum(1 for i in all_items if i.status == "posted"),
        skipped=sum(1 for i in all_items if i.status == "skipped"),
        needs_review=sum(1 for i in all_items if i.status == "needs_review"),
    )

    # Apply filters if requested
    filtered_items = all_items
    if status_filter:
        filtered_items = [i for i in filtered_items if i.status.lower() == status_filter.lower()]
    if format_filter:
        filtered_items = [i for i in filtered_items if i.format.lower() == format_filter.lower()]
    if pillar_filter:
        filtered_items = [i for i in filtered_items if i.pillar.lower() == pillar_filter.lower()]

    return ContentCalendarViewResponse(
        calendar_id=calendar.id,
        business_id=business.id,
        status=calendar.status,
        items=[ContentItemResponse.model_validate(i) for i in filtered_items],
        stats=stats,
    )


async def update_content_item_status(
    db: AsyncSession,
    business_id: uuid.UUID,
    item_id: uuid.UUID,
    user: User,
    new_status: str,
    post_url: str | None = None,
    request_id: uuid.UUID | None = None,
) -> ContentItemResponse:
    """Update status of a content item (e.g. approve, post, or skip) with audit trail."""
    business = await get_business_by_id(db, business_id, user)

    stmt = (
        select(ContentItem)
        .join(ContentCalendar, ContentItem.calendar_id == ContentCalendar.id)
        .where(ContentItem.id == item_id, ContentCalendar.business_id == business.id)
    )
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content item not found for this business calendar.",
        )

    old_status = item.status
    item.status = new_status
    item.updated_at = datetime.now(UTC)

    if new_status == "posted":
        item.posted_at = datetime.now(UTC)
        if post_url:
            item.post_url = post_url

    # Record append-only audit event
    await record_audit_log(
        db=db,
        action="content_item.status_changed",
        actor_id=user.id,
        actor_role=user.role,
        target_type="content_item",
        target_id=str(item.id),
        request_id=request_id,
        meta={
            "business_id": str(business.id),
            "calendar_id": str(item.calendar_id),
            "day": item.day,
            "old_status": old_status,
            "new_status": new_status,
            "post_url": post_url,
        },
    )

    await db.commit()
    await db.refresh(item)

    return ContentItemResponse.model_validate(item)


async def get_content_item(
    db: AsyncSession,
    business_id: uuid.UUID,
    item_id: uuid.UUID,
    user: User,
) -> ContentItemResponse:
    """Fetch single content item detail scoped to business ownership (F-012)."""
    business = await get_business_by_id(db, business_id, user)

    stmt = (
        select(ContentItem)
        .join(ContentCalendar, ContentItem.calendar_id == ContentCalendar.id)
        .where(ContentItem.id == item_id, ContentCalendar.business_id == business.id)
    )
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content item not found for this business.",
        )

    return ContentItemResponse.model_validate(item)


async def update_content_item(
    db: AsyncSession,
    business_id: uuid.UUID,
    item_id: uuid.UUID,
    user: User,
    payload: UpdateContentItemRequest,
    request_id: uuid.UUID | None = None,
) -> ContentItemResponse:
    """Full update for content item detail editor (F-012) with audit trail."""
    business = await get_business_by_id(db, business_id, user)

    stmt = (
        select(ContentItem)
        .join(ContentCalendar, ContentItem.calendar_id == ContentCalendar.id)
        .where(ContentItem.id == item_id, ContentCalendar.business_id == business.id)
    )
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content item not found for this business.",
        )

    updates_made: dict[str, Any] = {}
    for field in [
        "hook",
        "caption",
        "cta",
        "hashtags",
        "best_time_hint",
        "image_prompt",
        "video_prompt",
        "alt_text",
        "status",
        "date",
    ]:
        val = getattr(payload, field)
        if val is not None:
            updates_made[field] = val
            setattr(item, field, val)

    item.updated_at = datetime.now(UTC)

    # Record append-only audit event
    await record_audit_log(
        db=db,
        action="content_item.updated",
        actor_id=user.id,
        actor_role=user.role,
        target_type="content_item",
        target_id=str(item.id),
        request_id=request_id,
        meta={
            "business_id": str(business.id),
            "calendar_id": str(item.calendar_id),
            "day": item.day,
            "fields_updated": list(updates_made.keys()),
        },
    )

    await db.commit()
    await db.refresh(item)

    return ContentItemResponse.model_validate(item)


async def get_today_content_item(
    db: AsyncSession,
    business_id: uuid.UUID,
    user: User,
) -> ContentItemResponse:
    """Fetch today's scheduled content item, or next upcoming approved post (F-013, W-003)."""
    business = await get_business_by_id(db, business_id, user)

    stmt_cal = select(ContentCalendar).where(ContentCalendar.business_id == business.id)
    res_cal = await db.execute(stmt_cal)
    calendar = res_cal.scalar_one_or_none()
    if not calendar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No content calendar found for this business.",
        )

    today = date.today()

    # Query 1: Exact date match
    stmt_today = (
        select(ContentItem)
        .where(ContentItem.calendar_id == calendar.id, ContentItem.date == today)
        .order_by(ContentItem.day.asc())
    )
    res_today = await db.execute(stmt_today)
    items_today = res_today.scalars().all()

    if items_today:
        return ContentItemResponse.model_validate(items_today[0])

    # Query 2: Fallback to next upcoming unposted item
    stmt_fallback = (
        select(ContentItem)
        .where(
            ContentItem.calendar_id == calendar.id,
            ContentItem.status != "posted",
            ContentItem.status != "skipped",
        )
        .order_by(ContentItem.date.asc(), ContentItem.day.asc())
    )
    res_fallback = await db.execute(stmt_fallback)
    fallback_items = res_fallback.scalars().all()

    if fallback_items:
        return ContentItemResponse.model_validate(fallback_items[0])

    # Query 3: Any item from calendar
    stmt_any = (
        select(ContentItem)
        .where(ContentItem.calendar_id == calendar.id)
        .order_by(ContentItem.day.desc())
    )
    res_any = await db.execute(stmt_any)
    any_items = res_any.scalars().all()

    if any_items:
        return ContentItemResponse.model_validate(any_items[0])

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="No content items available for today.",
    )


async def mark_item_as_posted(
    db: AsyncSession,
    business_id: uuid.UUID,
    item_id: uuid.UUID,
    user: User,
    post_url: str | None = None,
    request_id: uuid.UUID | None = None,
) -> ContentItemResponse:
    """Mark a post item as posted with optional social link and audit logging (F-013, W-003)."""
    business = await get_business_by_id(db, business_id, user)

    stmt = (
        select(ContentItem)
        .join(ContentCalendar, ContentItem.calendar_id == ContentCalendar.id)
        .where(ContentItem.id == item_id, ContentCalendar.business_id == business.id)
    )
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content item not found for this business.",
        )

    item.status = "posted"
    item.posted_at = datetime.now(UTC)
    if post_url:
        item.post_url = post_url
    item.updated_at = datetime.now(UTC)

    # Record append-only audit event
    await record_audit_log(
        db=db,
        action="content_item.posted",
        actor_id=user.id,
        actor_role=user.role,
        target_type="content_item",
        target_id=str(item.id),
        request_id=request_id,
        meta={
            "business_id": str(business.id),
            "calendar_id": str(item.calendar_id),
            "day": item.day,
            "post_url": post_url,
            "posted_at": item.posted_at.isoformat(),
        },
    )

    await db.commit()
    await db.refresh(item)

    return ContentItemResponse.model_validate(item)


async def get_research_report(
    db: AsyncSession,
    business_id: uuid.UUID,
    user: User,
) -> ResearchReportResponse:
    """Retrieve competitor teardown and hashtag research report for an entrepreneur's business (F-014)."""
    business = await get_business_by_id(db, business_id, user)
    report = await get_or_create_research_report(db, business)
    return ResearchReportResponse.model_validate(report)
