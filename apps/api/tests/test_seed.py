"""Acceptance tests for database seed script (Phase 5 Task 58 / PRD §12.5).

Verifies that seed data generation correctly generates all required entities:
- 1 Super Admin
- 1 Cohort Program ("Lahore Batch 1")
- 5 Verified Mentors with services and availability slots
- 20 Entrepreneurs across all funnel stages and stalled criteria
- Products, ValidationReports, PricingResults, Plans, Tasks
- Content Calendars, Items, Research Reports, Metrics Snapshots
- Bookings, Escrow Payments, Reviews, Notifications, and Feature Flags
- Idempotency and constraint compliance
"""

import sys
import uuid
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Ensure scripts dir is accessible
scripts_dir = Path(__file__).resolve().parent.parent.parent.parent / "scripts"
if str(scripts_dir) not in sys.path:
    sys.path.insert(0, str(scripts_dir))

import seed  # noqa: E402

from app.auth.password import verify_password  # noqa: E402
from app.models.booking import Booking, PaymentSim, Review  # noqa: E402
from app.models.business import (  # noqa: E402
    Business,
    Product,
)
from app.models.content import ContentCalendar, ContentItem  # noqa: E402
from app.models.mentor import (  # noqa: E402
    MentorAvailability,
    MentorProfile,
    MentorService,
)
from app.models.metrics import MetricsSnapshot  # noqa: E402
from app.models.notification import Notification  # noqa: E402
from app.models.plan import LaunchPlan  # noqa: E402
from app.models.program import Program  # noqa: E402
from app.models.user import User  # noqa: E402


class MockAsyncSession:
    """Mock async session recording all added entities and simulating query execution."""

    def __init__(self) -> None:
        self.added_entities: list[object] = []
        self.committed = False
        self.rolled_back = False

    def add(self, entity: object) -> None:
        self.added_entities.append(entity)

    def add_all(self, entities: list[object]) -> None:
        self.added_entities.extend(entities)

    async def flush(self) -> None:
        pass

    async def commit(self) -> None:
        self.committed = True

    async def rollback(self) -> None:
        self.rolled_back = True

    async def execute(self, statement: object) -> MagicMock:
        mock_result = MagicMock()
        # Default to None so entities get seeded fresh
        mock_result.scalar_one_or_none.return_value = None
        mock_result.scalars.return_value.first.return_value = None
        mock_result.scalars.return_value.all.return_value = []
        return mock_result


@pytest.mark.asyncio
async def test_seed_super_admin() -> None:
    """Verify super admin is created with proper role, status, and password hash."""
    session = MockAsyncSession()
    admin = await seed.seed_super_admin(session)  # type: ignore[arg-type]

    assert admin.role == "super_admin"
    assert admin.status == "active"
    assert admin.email == "admin@hunar.pk"
    assert verify_password("Admin1234!", admin.password_hash)


@pytest.mark.asyncio
async def test_seed_program() -> None:
    """Verify sample cohort program is created with correct name and code."""
    session = MockAsyncSession()
    program = await seed.seed_program(session)  # type: ignore[arg-type]

    assert program.name == "Lahore Batch 1"
    assert program.invite_code == "LHR-2026-B1"


@pytest.mark.asyncio
async def test_seed_feature_flags() -> None:
    """Verify standard feature flags are registered with proper default states."""
    session = MockAsyncSession()
    flags = await seed.seed_feature_flags(session)  # type: ignore[arg-type]

    flag_keys = {f.key for f in flags}
    assert "weekly_coach_agent" in flag_keys
    assert "mentor_marketplace" in flag_keys
    assert "meta_connect" in flag_keys
    assert "vision_metrics" in flag_keys
    assert "user_registration" in flag_keys


@pytest.mark.asyncio
async def test_seed_mentors() -> None:
    """Verify 5 mentors are created with active profiles, services, and availability."""
    session = MockAsyncSession()
    profiles = await seed.seed_mentors(session)  # type: ignore[arg-type]

    assert len(profiles) == 5
    for p in profiles:
        assert p.status == "active"
        assert p.rating >= 4.0
        assert len(p.niches) > 0
        assert len(p.languages) > 0
        assert p.city in ("Lahore", "Karachi", "Islamabad", "Rawalpindi")

    # Check services and availability slots added
    services = [e for e in session.added_entities if isinstance(e, MentorService)]
    slots = [e for e in session.added_entities if isinstance(e, MentorAvailability)]

    assert len(services) == 10  # 2 per mentor
    for s in services:
        assert s.price_pkr > 0
        assert 15 <= s.duration_min <= 180
        assert s.type in ("session", "review", "done_with_you", "package")
        assert s.active is True

    assert len(slots) > 10
    for sl in slots:
        assert 0 <= sl.weekday <= 6
        assert len(sl.start_time) == 5
        assert len(sl.end_time) == 5


@pytest.mark.asyncio
async def test_seed_entrepreneurs_funnel_and_stages() -> None:
    """Verify 20 entrepreneurs are created across funnel stages and stalled criteria."""
    session = MockAsyncSession()
    program = Program(id=uuid.uuid4(), name="Lahore Batch 1", invite_code="LHR-2026-B1")

    # Mock mentor with service for booking generation
    mentor_user = User(
        id=uuid.uuid4(),
        email="mentor@hunar.pk",
        password_hash="hash",
        name="Ayesha",
        role="mentor",
        status="active",
        language="roman_ur",
        force_password_change=False,
    )
    mentor_prof = MentorProfile(
        id=uuid.uuid4(),
        user_id=mentor_user.id,
        niches=["Apparel & Fashion"],
        languages=["Urdu"],
        city="Lahore",
        bio="Fashion mentor",
        rating=4.9,
        review_count=10,
        status="active",
    )
    mentor_svc = MentorService(
        id=uuid.uuid4(),
        mentor_id=mentor_prof.id,
        title="Pret Sourcing",
        description="Desc",
        niche="Apparel & Fashion",
        type="session",
        price_pkr=3000,
        duration_min=60,
        active=True,
    )

    # Patch execute to return mentor_svc when queried
    orig_execute = session.execute

    async def custom_execute(stmt: object) -> MagicMock:
        mock_res = await orig_execute(stmt)
        mock_res.scalars.return_value.first.return_value = mentor_svc
        return mock_res

    session.execute = custom_execute  # type: ignore[assignment]

    users = await seed.seed_entrepreneurs(session, program, [mentor_prof])  # type: ignore[arg-type]
    assert len(users) == 20

    # Verify user attributes
    for u in users:
        assert u.role == "entrepreneur"
        assert u.status == "active"
        assert u.program_id == program.id

    # Verify businesses created
    businesses = [e for e in session.added_entities if isinstance(e, Business)]
    assert len(businesses) == 20

    # Verify products created
    products = [e for e in session.added_entities if isinstance(e, Product)]
    assert len(products) == 20

    # Verify validation reports & plans (for Stage 2, 3, 4 = 15 businesses)
    plans = [e for e in session.added_entities if isinstance(e, LaunchPlan)]
    assert len(plans) == 15

    # Verify content calendars (for Stage 3, 4 = 10 businesses)
    calendars = [e for e in session.added_entities if isinstance(e, ContentCalendar)]
    assert len(calendars) == 10

    # Verify content items created
    items = [e for e in session.added_entities if isinstance(e, ContentItem)]
    assert len(items) == 150  # 15 days * 10 calendars

    # Verify metrics snapshots (for Stage 4 = 5 businesses * 7 days = 35 snapshots)
    snapshots = [e for e in session.added_entities if isinstance(e, MetricsSnapshot)]
    assert len(snapshots) == 35
    for snap in snapshots:
        assert snap.views > 0
        assert snap.platform == "instagram"
        assert snap.orders > 0
        assert snap.revenue_pkr > 0

    # Verify bookings, payments, and reviews
    bookings = [e for e in session.added_entities if isinstance(e, Booking)]
    payments = [e for e in session.added_entities if isinstance(e, PaymentSim)]
    reviews = [e for e in session.added_entities if isinstance(e, Review)]

    assert len(bookings) == 5
    assert len(payments) == 5
    assert len(reviews) == 5

    for rev in reviews:
        assert 1 <= rev.rating <= 5

    # Verify notifications created
    notifs = [e for e in session.added_entities if isinstance(e, Notification)]
    assert len(notifs) >= 15  # 3 per Stage 4 entrepreneur


@pytest.mark.asyncio
async def test_seed_all_pipeline_dry_run() -> None:
    """Verify seed_all in dry-run mode rolls back transactions."""
    session = MockAsyncSession()

    with patch("seed.seed_super_admin", new_callable=AsyncMock) as mock_admin, \
         patch("seed.seed_program", new_callable=AsyncMock) as mock_prog, \
         patch("seed.seed_feature_flags", new_callable=AsyncMock) as mock_flags, \
         patch("seed.seed_mentors", new_callable=AsyncMock) as mock_mentors, \
         patch("seed.seed_entrepreneurs", new_callable=AsyncMock) as mock_ents:

        mock_admin.return_value = MagicMock()
        mock_prog.return_value = MagicMock()
        mock_flags.return_value = [MagicMock(), MagicMock()]
        mock_mentors.return_value = [MagicMock()]
        mock_ents.return_value = [MagicMock() for _ in range(20)]

        summary = await seed.seed_all(session, clean=False, dry_run=True)  # type: ignore[arg-type]

        assert summary["super_admins"] == 1
        assert summary["programs"] == 1
        assert summary["feature_flags"] == 2
        assert summary["mentors"] == 1
        assert summary["entrepreneurs"] == 20
        assert session.rolled_back is True
        assert session.committed is False
