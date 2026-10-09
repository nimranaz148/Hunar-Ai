"""Database seed script for demo and staging environments (PRD §12.5, Phase 5 Task 58).

Creates realistic Pakistani market data:
- 1 Super Admin account (from env vars or default admin@hunar.pk)
- 1 Sample Cohort Program ("Lahore Batch 1")
- 5 Verified Mentors with services and availability slots
- 20 Entrepreneurs across all funnel stages (Intake, Plan Approved, First Post, First Order, Stalled)
- Associated Businesses, Products, Validation Reports, Pricing Results, Launch Plans, Tasks
- Content Calendars, Content Items, Research Reports
- Metrics Snapshots feeding performance analytics
- Bookings, Escrow Payments (simulated), Reviews
- In-app Notifications and Feature Flags
"""

import argparse
import asyncio
import logging
import sys
import uuid
from datetime import UTC, date, datetime, timedelta
from pathlib import Path

# Add apps/api to path so app modules can be imported
api_dir = Path(__file__).resolve().parent.parent / "apps" / "api"
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))

from sqlalchemy import delete, select  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession  # noqa: E402

from app.auth.password import hash_password  # noqa: E402
from app.core.config import settings  # noqa: E402
from app.core.database import async_session_maker  # noqa: E402
from app.models.booking import Booking, PaymentSim, Review  # noqa: E402
from app.models.business import (  # noqa: E402
    Business,
    PricingResult,
    Product,
    ValidationReport,
)
from app.models.content import ContentCalendar, ContentItem, ResearchReport  # noqa: E402
from app.models.feature_flag import FeatureFlag  # noqa: E402
from app.models.mentor import (  # noqa: E402
    MentorAvailability,
    MentorProfile,
    MentorService,
)
from app.models.metrics import MetricsSnapshot  # noqa: E402
from app.models.notification import Notification  # noqa: E402
from app.models.plan import LaunchPlan, PlanTask  # noqa: E402
from app.models.program import Program  # noqa: E402
from app.models.user import User  # noqa: E402
from typing import TypedDict  # noqa: E402

MentorServiceTuple = tuple[str, str, str, str, int, int]
MentorSlotTuple = tuple[int, str, str]


class MentorData(TypedDict):
    name: str
    email: str
    city: str
    niches: list[str]
    bio: str
    rating: float
    review_count: int
    services: list[MentorServiceTuple]
    slots: list[MentorSlotTuple]


class EntrepreneurSpec(TypedDict):
    name: str
    email: str
    biz_name: str
    niche: str
    city: str
    budget: int
    stage: str
    target: str
    stalled_reason: str | None


logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed")


async def seed_super_admin(session: AsyncSession) -> User:
    """Ensure at least one active Super Admin exists."""
    admin_email = settings.SUPER_ADMIN_EMAIL or "admin@hunar.pk"
    admin_pass = settings.SUPER_ADMIN_PASSWORD or "Admin1234!"

    result = await session.execute(select(User).where(User.email == admin_email))
    admin = result.scalar_one_or_none()

    if not admin:
        admin = User(
            id=uuid.uuid4(),
            email=admin_email,
            password_hash=hash_password(admin_pass),
            name="Super Admin",
            role="super_admin",
            status="active",
            language="roman_ur",
            force_password_change=False,
        )
        session.add(admin)
        await session.flush()
        logger.info(f"Created Super Admin: {admin_email}")
    else:
        logger.info(f"Super Admin already exists: {admin_email}")

    return admin


async def seed_program(session: AsyncSession) -> Program:
    """Ensure sample cohort program exists."""
    prog_name = "Lahore Batch 1"
    invite_code = "LHR-2026-B1"

    result = await session.execute(select(Program).where(Program.name == prog_name))
    program = result.scalar_one_or_none()

    if not program:
        program = Program(
            id=uuid.uuid4(),
            name=prog_name,
            invite_code=invite_code,
        )
        session.add(program)
        await session.flush()
        logger.info(f"Created Cohort Program: {prog_name} (Code: {invite_code})")
    else:
        logger.info(f"Program already exists: {prog_name}")

    return program


async def seed_feature_flags(session: AsyncSession) -> list[FeatureFlag]:
    """Ensure core system feature flags exist."""
    flags_data = [
        ("weekly_coach_agent", "Weekly Coach Agent", "AI Weekly Review & Content Adjustments", True),
        ("mentor_marketplace", "Mentor Marketplace", "Mentor Discovery and Booking", True),
        ("meta_connect", "Meta Graph API Integration", "Direct publishing to Instagram", False),
        ("vision_metrics", "Vision Metrics OCR", "Screenshot OCR for analytics", False),
        ("user_registration", "Public Registration", "Allow new entrepreneur signups", True),
    ]

    seeded_flags: list[FeatureFlag] = []
    for key, name, desc, is_enabled in flags_data:
        result = await session.execute(select(FeatureFlag).where(FeatureFlag.key == key))
        flag = result.scalar_one_or_none()
        if not flag:
            flag = FeatureFlag(
                key=key,
                name=name,
                description=desc,
                is_enabled=is_enabled,
            )
            session.add(flag)
            seeded_flags.append(flag)
        else:
            seeded_flags.append(flag)

    await session.flush()
    logger.info(f"Feature flags configured: {len(seeded_flags)} flags")
    return seeded_flags


async def seed_mentors(session: AsyncSession) -> list[MentorProfile]:
    """Seed 5 verified mentors with services and weekly availability slots."""
    mentor_data: list[MentorData] = [
        {
            "name": "Ayesha Siddiqua",
            "email": "ayesha.mentor@hunar.pk",
            "city": "Lahore",
            "niches": ["Apparel & Fashion", "Boutique"],
            "bio": "10+ years in retail fashion and Eastern pret wear. Mentored 40+ women apparel startups in Liberty and Gulberg.",
            "rating": 4.9,
            "review_count": 18,
            "services": [
                ("1-on-1 Pret Sourcing & Fabric Selection", "Deep dive into fabric procurement, dye houses, and vendor negotiation in Azam Cloth Market.", "Apparel & Fashion", "session", 3000, 60),
                ("Collection Catalog & Pricing Review", "Audit your seasonal catalog, markup calculation, and SKU variety before production.", "Apparel & Fashion", "review", 2500, 45),
            ],
            "slots": [(0, "15:00", "18:00"), (2, "15:00", "18:00"), (4, "15:00", "18:00")],
        },
        {
            "name": "Bilal Ahmed",
            "email": "bilal.mentor@hunar.pk",
            "city": "Karachi",
            "niches": ["Digital Marketing", "Social Media", "Meta Ads"],
            "bio": "Digital growth specialist with 8 years scaling Pakistani D2C brands via Instagram, TikTok, and Meta Ads.",
            "rating": 4.8,
            "review_count": 24,
            "services": [
                ("Instagram Growth & Reel Strategy Audit", "Actionable teardown of your Instagram feed, hooks, reel retention, and hashtag strategy.", "Digital Marketing", "review", 3500, 60),
                ("Meta Ads & ROAS Optimization Session", "Setup winning Advantage+ shopping campaigns, custom audiences, and budget allocation.", "Digital Marketing", "session", 5000, 90),
            ],
            "slots": [(1, "14:00", "19:00"), (3, "14:00", "19:00")],
        },
        {
            "name": "Zainab Tariq",
            "email": "zainab.mentor@hunar.pk",
            "city": "Islamabad",
            "niches": ["Handmade & Crafts", "Resin Art", "Jewelry"],
            "bio": "Handmade crafts entrepreneur. Built a 6-figure resin jewelry and gift business entirely from home.",
            "rating": 5.0,
            "review_count": 12,
            "services": [
                ("Packaging & Product Photography Critique", "How to photograph crafts with natural lighting and design memorable unboxing experiences.", "Handmade & Crafts", "review", 2000, 45),
                ("D2C Pricing & Margin Calculator Session", "Detailed costing formula accounting for resin shrinkage, waste, packaging, and courier rates.", "Handmade & Crafts", "session", 2500, 60),
            ],
            "slots": [(0, "11:00", "15:00"), (5, "11:00", "15:00")],
        },
        {
            "name": "Usman Khan",
            "email": "usman.mentor@hunar.pk",
            "city": "Lahore",
            "niches": ["Home Bakery", "Food & Culinary"],
            "bio": "Commercial baker & food safety consultant. Scaled artisan cloud bakery to 3 physical retail counters.",
            "rating": 4.7,
            "review_count": 15,
            "services": [
                ("Home Bakery Costing & Perishable Shelf-life", "Standard recipe batch cost breakdown, ingredient wastage, and refrigerator shelf-life management.", "Home Bakery", "session", 2800, 60),
                ("Menu Engineering & Custom Cake Pricing", "Structure your wedding and birthday dessert packages for maximum margin and predictability.", "Home Bakery", "review", 3200, 60),
            ],
            "slots": [(2, "10:00", "14:00"), (6, "10:00", "14:00")],
        },
        {
            "name": "Maryam Noor",
            "email": "maryam.mentor@hunar.pk",
            "city": "Rawalpindi",
            "niches": ["Skincare & Cosmetics", "Organic Beauty"],
            "bio": "Organic beauty formulator and e-commerce packaging consultant for organic personal care brands.",
            "rating": 4.9,
            "review_count": 9,
            "services": [
                ("Compliance, Labelling & Batch Testing Review", "Regulatory requirements, ingredient labelling, safety seals, and batch preservation testing.", "Skincare & Cosmetics", "review", 4000, 60),
                ("Organic Beauty Brand Launch Playbook", "Comprehensive 2-hour strategic roadmap for launching clean skincare products in Pakistan.", "Skincare & Cosmetics", "package", 7500, 120),
            ],
            "slots": [(3, "16:00", "20:00"), (4, "16:00", "20:00")],
        },
    ]

    seeded_profiles: list[MentorProfile] = []

    for m in mentor_data:
        res = await session.execute(select(User).where(User.email == m["email"]))
        user = res.scalar_one_or_none()

        if not user:
            user = User(
                id=uuid.uuid4(),
                email=m["email"],
                password_hash=hash_password("Mentor1234!"),
                name=m["name"],
                role="mentor",
                status="active",
                language="roman_ur",
                force_password_change=False,
            )
            session.add(user)
            await session.flush()

        res_prof = await session.execute(
            select(MentorProfile).where(MentorProfile.user_id == user.id)
        )
        profile = res_prof.scalar_one_or_none()

        if not profile:
            profile = MentorProfile(
                id=uuid.uuid4(),
                user_id=user.id,
                niches=m["niches"],
                languages=["Urdu", "English"],
                city=m["city"],
                bio=m["bio"],
                rating=m["rating"],
                review_count=m["review_count"],
                status="active",
            )
            session.add(profile)
            await session.flush()

            for title, desc, niche, s_type, price, dur in m["services"]:
                service = MentorService(
                    id=uuid.uuid4(),
                    mentor_id=profile.id,
                    title=title,
                    description=desc,
                    niche=niche,
                    type=s_type,
                    price_pkr=price,
                    duration_min=dur,
                    active=True,
                )
                session.add(service)

            for wday, stime, etime in m["slots"]:
                slot = MentorAvailability(
                    id=uuid.uuid4(),
                    mentor_id=profile.id,
                    weekday=wday,
                    start_time=stime,
                    end_time=etime,
                    is_available=True,
                )
                session.add(slot)

            await session.flush()
            logger.info(f"Seeded Mentor: {m['name']} ({m['city']})")

        seeded_profiles.append(profile)

    return seeded_profiles


async def seed_entrepreneurs(
    session: AsyncSession,
    program: Program,
    mentors: list[MentorProfile],
) -> list[User]:
    """Seed 20 entrepreneurs across progression stages (PRD §5.2, §11.1, §12.5, §29.3)."""
    now = datetime.now(UTC)
    today = date.today()

    entrepreneurs_specs: list[EntrepreneurSpec] = [
        # --- Stage 1: Signed Up / Intake (5) ---
        {
            "name": "Sadia Malik",
            "email": "sadia@hunar.pk",
            "biz_name": "Sadia's Clay Studio",
            "niche": "Handmade & Crafts",
            "city": "Lahore",
            "budget": 20000,
            "stage": "intake",
            "target": "Coffee lovers, home decor enthusiasts",
            "stalled_reason": None,
        },
        {
            "name": "Hina Farooq",
            "email": "hina@hunar.pk",
            "biz_name": "Hina Pret",
            "niche": "Apparel & Fashion",
            "city": "Lahore",
            "budget": 35000,
            "stage": "intake",
            "target": "College students looking for affordable summer lawn",
            "stalled_reason": None,
        },
        {
            "name": "Mehak Javed",
            "email": "mehak@hunar.pk",
            "biz_name": "Mehak's Scented Candles",
            "niche": "Handmade & Crafts",
            "city": "Karachi",
            "budget": 15000,
            "stage": "intake",
            "target": "Aromatherapy fans, wedding giveaway buyers",
            "stalled_reason": None,
        },
        {
            "name": "Bushra Riaz",
            "email": "bushra@hunar.pk",
            "biz_name": "Bushra Organic Soaps",
            "niche": "Skincare & Cosmetics",
            "city": "Faisalabad",
            "budget": 18000,
            "stage": "intake",
            "target": "Sensitive skin women seeking chemical-free soaps",
            "stalled_reason": None,
        },
        {
            "name": "Nimra Qureshi",
            "email": "nimra.q@hunar.pk",
            "biz_name": "Kainat Resin Arts",
            "niche": "Handmade & Crafts",
            "city": "Rawalpindi",
            "budget": 22000,
            "stage": "intake",
            "target": "Housewarming gift shoppers and event organizers",
            "stalled_reason": None,
        },
        # --- Stage 2: Plan Approved (5) ---
        {
            "name": "Rabia Akram",
            "email": "rabia@hunar.pk",
            "biz_name": "Rabia Luxe Pret",
            "niche": "Apparel & Fashion",
            "city": "Lahore",
            "budget": 45000,
            "stage": "plan_approved",
            "target": "Working women needing easy-to-wash office wear",
            "stalled_reason": "no_metrics",  # Stalled condition: No metrics logged in >7 days
        },
        {
            "name": "Samina Bibi",
            "email": "samina@hunar.pk",
            "biz_name": "Sweet Delights by Samina",
            "niche": "Home Bakery",
            "city": "Multan",
            "budget": 25000,
            "stage": "plan_approved",
            "target": "Mothers hosting birthday parties and milestone family events",
            "stalled_reason": None,
        },
        {
            "name": "Nadia Jamil",
            "email": "nadia@hunar.pk",
            "biz_name": "Nadia Silver Crafts",
            "niche": "Handmade & Crafts",
            "city": "Islamabad",
            "budget": 40000,
            "stage": "plan_approved",
            "target": "Jewelry collectors wanting sterling silver daily wear",
            "stalled_reason": "overdue_tasks",  # Stalled condition: Overdue tasks
        },
        {
            "name": "Amina Sohail",
            "email": "amina@hunar.pk",
            "biz_name": "Amina Macrame Decor",
            "niche": "Handmade & Crafts",
            "city": "Lahore",
            "budget": 15000,
            "stage": "plan_approved",
            "target": "Bohemian bedroom decor enthusiasts",
            "stalled_reason": None,
        },
        {
            "name": "Farah Naz",
            "email": "farah@hunar.pk",
            "biz_name": "Farah's Pickle Kitchen",
            "niche": "Food & Culinary",
            "city": "Gujranwala",
            "budget": 20000,
            "stage": "plan_approved",
            "target": "Expatriates and busy families seeking authentic Punjabi achars",
            "stalled_reason": None,
        },
        # --- Stage 3: First Post Published (5) ---
        {
            "name": "Sana Tariq",
            "email": "sana@hunar.pk",
            "biz_name": "Sana Leatherette",
            "niche": "Handmade & Crafts",
            "city": "Karachi",
            "budget": 30000,
            "stage": "first_post",
            "target": "University students needing sturdy laptop totes",
            "stalled_reason": "no_post",  # Stalled condition: No post in >5 days
        },
        {
            "name": "Iqra Sheikh",
            "email": "iqra@hunar.pk",
            "biz_name": "Iqra's Gourmet Brownies",
            "niche": "Home Bakery",
            "city": "Lahore",
            "budget": 28000,
            "stage": "first_post",
            "target": "Dessert gift-box buyers and corporate event planners",
            "stalled_reason": None,
        },
        {
            "name": "Mariam Khalid",
            "email": "mariam.k@hunar.pk",
            "biz_name": "Noor Herbal Hair Oils",
            "niche": "Skincare & Cosmetics",
            "city": "Rawalpindi",
            "budget": 25000,
            "stage": "first_post",
            "target": "Women dealing with postpartum hair fall and dandruff",
            "stalled_reason": None,
        },
        {
            "name": "Komal Aslam",
            "email": "komal@hunar.pk",
            "biz_name": "Komal Kids Wear",
            "niche": "Apparel & Fashion",
            "city": "Sialkot",
            "budget": 35000,
            "stage": "first_post",
            "target": "New mothers shopping for organic cotton baby onesies",
            "stalled_reason": None,
        },
        {
            "name": "Mahnoor Shah",
            "email": "mahnoor@hunar.pk",
            "biz_name": "Mahnoor Floral Decor",
            "niche": "Handmade & Crafts",
            "city": "Islamabad",
            "budget": 20000,
            "stage": "first_post",
            "target": "Brides preserving wedding bouquets in resin frames",
            "stalled_reason": None,
        },
        # --- Stage 4: First Order Achieved (5) ---
        {
            "name": "Fatima Ali",
            "email": "fatima@hunar.pk",
            "biz_name": "Zauq-e-Hunar Pret",
            "niche": "Apparel & Fashion",
            "city": "Lahore",
            "budget": 50000,
            "stage": "first_order",
            "target": "Young mothers seeking comfortable hand-embroidered daily kurtis",
            "stalled_reason": None,
        },
        {
            "name": "Zainab Rauf",
            "email": "zainab.r@hunar.pk",
            "biz_name": "Zainab Sourdough Bakery",
            "niche": "Home Bakery",
            "city": "Lahore",
            "budget": 30000,
            "stage": "first_order",
            "target": "Health-conscious households seeking gut-friendly artisan bread",
            "stalled_reason": None,
        },
        {
            "name": "Alishba Khan",
            "email": "alishba@hunar.pk",
            "biz_name": "Alishba Chikan Stitch",
            "niche": "Apparel & Fashion",
            "city": "Karachi",
            "budget": 45000,
            "stage": "first_order",
            "target": "Summer lawn shoppers seeking delicate white chikankari embroidery",
            "stalled_reason": None,
        },
        {
            "name": "Rimsha Tahir",
            "email": "rimsha@hunar.pk",
            "biz_name": "Rimsha Botanical Skin",
            "niche": "Skincare & Cosmetics",
            "city": "Islamabad",
            "budget": 40000,
            "stage": "first_order",
            "target": "Skincare enthusiasts looking for local rosewater and saffron serums",
            "stalled_reason": None,
        },
        {
            "name": "Tehmina Butt",
            "email": "tehmina@hunar.pk",
            "biz_name": "Tehmina Khussa Studio",
            "niche": "Handmade & Crafts",
            "city": "Lahore",
            "budget": 35000,
            "stage": "first_order",
            "target": "Eid and wedding shoppers wanting cushioned leather khussas",
            "stalled_reason": None,
        },
    ]

    seeded_users: list[User] = []

    for spec in entrepreneurs_specs:
        res = await session.execute(select(User).where(User.email == spec["email"]))
        user = res.scalar_one_or_none()

        if not user:
            user = User(
                id=uuid.uuid4(),
                email=spec["email"],
                password_hash=hash_password("User1234!"),
                name=spec["name"],
                role="entrepreneur",
                status="active",
                program_id=program.id,
                language="roman_ur",
                force_password_change=False,
            )
            session.add(user)
            await session.flush()

        # Seed Business
        res_biz = await session.execute(
            select(Business).where(Business.owner_id == user.id)
        )
        biz = res_biz.scalar_one_or_none()

        if not biz:
            biz = Business(
                id=uuid.uuid4(),
                owner_id=user.id,
                program_id=program.id,
                name=spec["biz_name"],
                niche=spec["niche"],
                city=spec["city"],
                area="Gulberg" if spec["city"] == "Lahore" else "DHA",
                budget_pkr=spec["budget"],
                hours_per_week=20,
                tone="friendly",
                languages=["Urdu", "English"],
                platforms=["Instagram", "WhatsApp"],
                target_customer=spec["target"],
            )
            session.add(biz)
            await session.flush()

            # Seed Product for business
            product = Product(
                id=uuid.uuid4(),
                business_id=biz.id,
                name=f"{spec['biz_name']} Signature Collection",
                description="Handcrafted with premium local raw materials and authentic Pakistani craftsmanship.",
                cost_inputs=[
                    {"item": "Raw Material", "cost_pkr": 800},
                    {"item": "Packaging & Branding", "cost_pkr": 150},
                    {"item": "Labor & Finishing", "cost_pkr": 350},
                ],
                price_pkr=2200,
            )
            session.add(product)
            await session.flush()

            # For Stage 2+, add ValidationReport, PricingResult, and LaunchPlan
            if spec["stage"] in ("plan_approved", "first_post", "first_order"):
                val_report = ValidationReport(
                    id=uuid.uuid4(),
                    business_id=biz.id,
                    competitors=[
                        {"name": "Local Retailer A", "price_pkr": 2500, "followers": 12000},
                        {"name": "Instagram Brand B", "price_pkr": 2800, "followers": 34000},
                    ],
                    how_to_be_better=[
                        "Offer fast 48-hour delivery in central city areas",
                        "Include personalized thank-you Urdu handwritten note",
                        "Use eco-friendly kraft packaging",
                    ],
                    confidence="high",
                    demand_summary=f"Strong organic demand in {spec['city']} for handcrafted {spec['niche']}.",
                    pricing_insight="Price point PKR 2,000 - PKR 2,500 maintains healthy 40%+ margins.",
                    reasoning="Competitors have slow response times on WhatsApp. Faster response yields 2x conversion.",
                )
                session.add(val_report)

                pricing_res = PricingResult(
                    id=uuid.uuid4(),
                    business_id=biz.id,
                    product_id=product.id,
                    product_name=product.name,
                    assumptions={"monthly_fixed_overhead": 5000, "courier_pkr": 250},
                    unit_cost=1300,
                    price=2200,
                    margin_pct=40.9,
                    break_even_units=15,
                    risk_flags=["Slight raw material seasonal inflation risk"],
                    notes="Approved by entrepreneur during initial financial planning gate.",
                    approved_at=now - timedelta(days=20),
                )
                session.add(pricing_res)

                launch_plan = LaunchPlan(
                    id=uuid.uuid4(),
                    business_id=biz.id,
                    status="approved",
                    summary="30-day go-to-market plan covering setup, branding, content release, and launch promo.",
                    approved_at=now - timedelta(days=18),
                )
                session.add(launch_plan)
                await session.flush()

                # Seed Plan Tasks
                # If stalled_reason == 'overdue_tasks', set due dates in the past
                is_overdue = spec.get("stalled_reason") == "overdue_tasks"
                tasks_data = [
                    (1, "Finalize Product Pricing & Unit Economics", "setup", 1, True, -15),
                    (1, "Set up WhatsApp Business & Quick Replies", "setup", 2, True, -12),
                    (2, "Design Instagram Bio & Story Highlight Covers", "content", 3, True, -10),
                    (2, "Order Eco-Friendly Packaging Boxes & Stickers", "inventory", 4, not is_overdue, -7 if is_overdue else 2),
                    (3, "Film 5 Behind-the-Scenes Reels with Process Audio", "content", 5, False, -4 if is_overdue else 7),
                    (4, "Launch 10% Early Bird Opening Discount Announcement", "sales", 6, False, -2 if is_overdue else 14),
                ]

                for week, title, cat, idx, is_comp, day_offset in tasks_data:
                    task = PlanTask(
                        id=uuid.uuid4(),
                        plan_id=launch_plan.id,
                        title=title,
                        description=f"Action item for Week {week} in your 30-day launch roadmap.",
                        week=week,
                        category=cat,
                        due_date=today + timedelta(days=day_offset),
                        status="completed" if is_comp else "pending",
                        order_index=idx,
                    )
                    session.add(task)

            # For Stage 3+, add ResearchReport, ContentCalendar, and ContentItems
            if spec["stage"] in ("first_post", "first_order"):
                research = ResearchReport(
                    id=uuid.uuid4(),
                    business_id=biz.id,
                    competitors=[
                        {"name": "Competitor Shop 1", "top_formats": ["Reel", "Carousel"]},
                        {"name": "Competitor Shop 2", "top_formats": ["Single Image"]},
                    ],
                    how_to_be_better=["Focus on Roman Urdu storytelling reels showing artisan craftsmanship"],
                    hashtags={
                        "high_volume": ["#handmadeinpakistan", "#pakistanifashion"],
                        "niche": [f"#{spec['city'].lower()}business", "#hunarpk"],
                    },
                    confidence=0.88,
                    source_urls=["https://instagram.com/explore/tags/pakistan"],
                    researched_at=now - timedelta(days=16),
                )
                session.add(research)

                calendar = ContentCalendar(
                    id=uuid.uuid4(),
                    business_id=biz.id,
                    status="approved",
                    pillars=[
                        {"id": "bts", "name": "Behind The Scenes", "weight": 35},
                        {"id": "product", "name": "Product Showcase", "weight": 40},
                        {"id": "reviews", "name": "Customer Love", "weight": 25},
                    ],
                    weekly_themes=[
                        {"week": 1, "theme": "Brand Story & Founder Journey"},
                        {"week": 2, "theme": "Craftsmanship & Quality Materials"},
                        {"week": 3, "theme": "Customer Reviews & Styling Tips"},
                        {"week": 4, "theme": "Exclusive Limited Launch Collection"},
                    ],
                    approved_at=now - timedelta(days=14),
                )
                session.add(calendar)
                await session.flush()

                # Generate Content Items
                is_no_post_stalled = spec.get("stalled_reason") == "no_post"
                # Determine how many items are marked posted
                num_posted = 3 if spec["stage"] == "first_post" else 10
                if is_no_post_stalled:
                    # Stalled: last post was 8 days ago
                    last_posted_offset = -8
                else:
                    last_posted_offset = -1

                for day_num in range(1, 16):
                    item_date = today - timedelta(days=(15 - day_num))
                    was_posted = day_num <= num_posted
                    if is_no_post_stalled and day_num > 2:
                        was_posted = False

                    item = ContentItem(
                        id=uuid.uuid4(),
                        calendar_id=calendar.id,
                        day=day_num,
                        date=item_date,
                        platform=["instagram"],
                        format="Reel" if day_num % 2 == 1 else "Carousel",
                        pillar="Behind The Scenes" if day_num % 3 == 1 else "Product Showcase",
                        goal="Engagement & Storytelling",
                        hook=f"Kya aap jante hain ke {spec['biz_name']} ka har piece kaise banta hai?",
                        caption=f"Assalamu alaikum! Aaj hum share kar rahe hain hamara {day_num}th special creation. DM to book!",
                        cta="Send us a DM on WhatsApp to reserve your favorite piece today!",
                        hashtags=["#hunar", "#madeinpakistan", f"#{spec['city'].lower()}creatives"],
                        status="posted" if was_posted else "draft",
                        posted_at=(now + timedelta(days=last_posted_offset)) if was_posted else None,
                        post_url=f"https://instagram.com/p/hunar_demo_{day_num}" if was_posted else None,
                    )
                    session.add(item)

            # For Stage 4: Add Metrics Snapshots, Bookings, Notifications
            if spec["stage"] == "first_order":
                # Add 7 days of metrics
                for day_idx in range(7, 0, -1):
                    m_date = today - timedelta(days=day_idx)
                    snap = MetricsSnapshot(
                        id=uuid.uuid4(),
                        business_id=biz.id,
                        platform="instagram",
                        period_start=m_date,
                        period_end=m_date,
                        views=420 + (day_idx * 60),
                        reach=350 + (day_idx * 45),
                        likes=38 + (day_idx * 5),
                        comments=8 + day_idx,
                        shares=4 + (day_idx % 3),
                        saves=6 + (day_idx % 4),
                        follower_delta=5 + (day_idx % 4),
                        inquiries=4 + (day_idx % 3),
                        orders=2 + (day_idx % 2),
                        revenue_pkr=(2 + (day_idx % 2)) * 2200,
                    )
                    session.add(snap)

                # Add sample Booking with first mentor
                if mentors:
                    target_mentor = mentors[0]
                    # Find a service for this mentor
                    res_svc = await session.execute(
                        select(MentorService).where(MentorService.mentor_id == target_mentor.id)
                    )
                    svc = res_svc.scalars().first()

                    if svc:
                        booking = Booking(
                            id=uuid.uuid4(),
                            service_id=svc.id,
                            mentor_id=target_mentor.id,
                            entrepreneur_id=user.id,
                            status="completed",
                            scheduled_at=now - timedelta(days=3),
                            notes="Seeking advice on increasing fabric procurement volume for Eid rush.",
                            session_notes="Detailed 3 reliable suppliers in Azam Cloth Market. Advised batching dye orders.",
                        )
                        session.add(booking)
                        await session.flush()

                        payment = PaymentSim(
                            id=uuid.uuid4(),
                            booking_id=booking.id,
                            amount_pkr=svc.price_pkr,
                            status="released",
                        )
                        session.add(payment)

                        review = Review(
                            id=uuid.uuid4(),
                            booking_id=booking.id,
                            mentor_id=target_mentor.id,
                            entrepreneur_id=user.id,
                            rating=5,
                            comment="Ayesha baji gave incredible practical advice. Saved me PKR 15,000 on fabric costs!",
                        )
                        session.add(review)

                # Add In-App Notifications for Fatima Ali
                notif1 = Notification(
                    user_id=user.id,
                    title="Weekly Review Ready",
                    message="Your Weekly Coach analysis for Week 2 is ready for review.",
                    type="agent",
                    link="/metrics",
                    is_read=False,
                )
                notif2 = Notification(
                    user_id=user.id,
                    title="Mentor Session Completed",
                    message="Your mentoring session with Ayesha Siddiqua has completed. Review payment released.",
                    type="booking",
                    link="/mentors/bookings",
                    is_read=True,
                    read_at=now - timedelta(days=2),
                )
                notif3 = Notification(
                    user_id=user.id,
                    title="Milestone Achieved: First Order!",
                    message="Mubarak! You recorded your first sales orders in Hunar.",
                    type="milestone",
                    link="/dashboard",
                    is_read=False,
                )
                session.add_all([notif1, notif2, notif3])

            await session.flush()
            logger.info(f"Seeded Entrepreneur: {spec['name']} ({spec['biz_name']} - Stage: {spec['stage']})")

        seeded_users.append(user)

    return seeded_users


async def clean_database(session: AsyncSession) -> None:
    """Wipe demo tables in reverse dependency order for a clean reset."""
    logger.warning("Cleaning existing database records...")
    tables = [
        Notification,
        MetricsSnapshot,
        Review,
        PaymentSim,
        Booking,
        ContentItem,
        ContentCalendar,
        ResearchReport,
        PlanTask,
        LaunchPlan,
        PricingResult,
        ValidationReport,
        Product,
        Business,
        MentorAvailability,
        MentorService,
        MentorProfile,
        FeatureFlag,
        User,
        Program,
    ]
    for table in tables:
        await session.execute(delete(table))
    await session.commit()
    logger.info("Database cleaned successfully.")


async def seed_all(
    session: AsyncSession,
    clean: bool = False,
    dry_run: bool = False,
) -> dict[str, int]:
    """Execute full database seeding pipeline."""
    if clean:
        await clean_database(session)

    admin = await seed_super_admin(session)
    program = await seed_program(session)
    flags = await seed_feature_flags(session)
    mentors = await seed_mentors(session)
    entrepreneurs = await seed_entrepreneurs(session, program, mentors)

    if dry_run:
        await session.rollback()
        logger.info("DRY RUN completed. Rolled back all changes.")
    else:
        await session.commit()
        logger.info("SEED COMPLETED! All transactions committed to database.")

    return {
        "super_admins": 1 if admin else 0,
        "programs": 1 if program else 0,
        "feature_flags": len(flags),
        "mentors": len(mentors),
        "entrepreneurs": len(entrepreneurs),
    }


async def main() -> None:
    """CLI entry point for seed script."""
    parser = argparse.ArgumentParser(description="Hunar v2 Database Seeder (Task 58)")
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Wipe seeded demo tables before populating",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate seed without committing transactions",
    )
    args = parser.parse_args()

    async with async_session_maker() as session:
        try:
            summary = await seed_all(session, clean=args.clean, dry_run=args.dry_run)
            logger.info("================ SEED SUMMARY ================")
            for k, v in summary.items():
                logger.info(f"  {k.replace('_', ' ').capitalize()}: {v}")
            logger.info("==============================================")
        except Exception as e:
            await session.rollback()
            logger.error(f"Error during seeding: {e}", exc_info=True)
            sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
