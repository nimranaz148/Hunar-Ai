"""Acceptance tests for Task 41: Mentee View (brief + progress) (F-025 / PRD §5, §10 W-005, §12.3, §13.2, §36.14)."""

import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, date, datetime
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token
from app.auth.password import hash_password
from app.core.database import get_db
from app.main import app
from app.models.booking import Booking, PaymentSim
from app.models.business import Business, Product, ValidationReport
from app.models.content import ContentCalendar, ContentItem
from app.models.mentor import MentorProfile, MentorService
from app.models.plan import LaunchPlan, PlanTask
from app.models.user import User


@pytest.fixture
def mentor_user() -> User:
    """Mock mentor user."""
    return User(
        id=uuid.uuid4(),
        email="mentor.pro@hunar.pk",
        name="Tariq Mansoor",
        role="mentor",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def mentee_user() -> User:
    """Mock entrepreneur / mentee user."""
    return User(
        id=uuid.uuid4(),
        email="mentee.amina@hunar.pk",
        name="Amina Khan",
        role="entrepreneur",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def other_user() -> User:
    """Mock unrelated entrepreneur user."""
    return User(
        id=uuid.uuid4(),
        email="unrelated.mentee@hunar.pk",
        name="Sara Ali",
        role="entrepreneur",
        password_hash=hash_password("Password123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def mentor_profile(mentor_user: User) -> MentorProfile:
    """Mock active mentor profile."""
    profile = MentorProfile(
        id=uuid.uuid4(),
        user_id=mentor_user.id,
        niches=["handmade", "stitching_fashion"],
        languages=["ur", "en"],
        city="Lahore",
        bio="Experienced craft coach helping micro-enterprises scale.",
        avatar_url=None,
        rating=4.8,
        review_count=12,
        status="active",
        created_at=datetime.now(UTC),
    )
    profile.user = mentor_user
    return profile


@pytest.fixture
def mentor_service(mentor_profile: MentorProfile) -> MentorService:
    """Mock mentor service."""
    service = MentorService(
        id=uuid.uuid4(),
        mentor_id=mentor_profile.id,
        title="Handmade Pricing & Margins",
        description="Comprehensive review of craft cost breakdown and pricing.",
        niche="handmade",
        type="session",
        price_pkr=3500,
        duration_min=60,
        active=True,
    )
    service.mentor = mentor_profile
    return service


@pytest.fixture
def mentee_business(mentee_user: User) -> Business:
    """Mock business owned by mentee."""
    biz = Business(
        id=uuid.uuid4(),
        owner_id=mentee_user.id,
        name="Amina Crochet Studio",
        niche="handmade",
        city="Karachi",
        area="Gulshan-e-Iqbal",
        budget_pkr=25000,
        hours_per_week=20,
        tone="friendly",
        languages=["ur", "en"],
        platforms=["Instagram", "WhatsApp"],
        target_customer="Mothers and gift buyers in Karachi looking for bespoke handmade baby blankets.",
    )
    return biz


@pytest.fixture
def mentee_booking(
    mentor_profile: MentorProfile,
    mentor_service: MentorService,
    mentee_user: User,
) -> Booking:
    """Mock booking linking mentor and mentee."""
    booking = Booking(
        id=uuid.uuid4(),
        mentor_id=mentor_profile.id,
        service_id=mentor_service.id,
        entrepreneur_id=mentee_user.id,
        status="accepted",
        scheduled_at=datetime.now(UTC),
        notes="Need help structuring volume discounts for Eid orders.",
        session_notes=None,
        created_at=datetime.now(UTC),
    )
    booking.service = mentor_service
    booking.mentor = mentor_profile
    booking.entrepreneur = mentee_user
    booking.payment = PaymentSim(
        id=uuid.uuid4(),
        booking_id=booking.id,
        amount_pkr=3500,
        status="held",
        created_at=datetime.now(UTC),
    )
    return booking


@pytest.fixture
def mentor_headers(mentor_user: User) -> dict[str, str]:
    """Auth headers for mentor."""
    token = create_access_token(
        user_id=mentor_user.id,
        role=mentor_user.role,
        email=mentor_user.email,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def entrepreneur_headers(mentee_user: User) -> dict[str, str]:
    """Auth headers for entrepreneur."""
    token = create_access_token(
        user_id=mentee_user.id,
        role=mentee_user.role,
        email=mentee_user.email,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_get_mentees_unauthenticated_returns_401() -> None:
    """Anonymous request to mentor mentees endpoint is rejected with 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/mentors/me/mentees")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_mentees_by_entrepreneur_returns_403(
    mentee_user: User,
    entrepreneur_headers: dict[str, str],
) -> None:
    """Entrepreneur role cannot access mentor mentees list."""
    mock_db = AsyncMock()

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return mentee_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/mentors/me/mentees", headers=entrepreneur_headers
            )
            assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_mentees_empty_list_returns_200(
    mentor_user: User,
    mentor_headers: dict[str, str],
) -> None:
    """Mentor with no bookings gets an empty list of mentees."""
    mock_db = AsyncMock()

    mock_profile_result = MagicMock()
    mock_profile_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_profile_result

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return mentor_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/mentors/me/mentees", headers=mentor_headers
            )
            assert response.status_code == 200
            data = response.json()
            assert data["total_count"] == 0
            assert data["mentees"] == []
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_mentees_with_booked_mentee_success(
    mentor_user: User,
    mentor_profile: MentorProfile,
    mentee_user: User,
    mentee_business: Business,
    mentee_booking: Booking,
    mentor_headers: dict[str, str],
) -> None:
    """Mentor retrieves list of mentees who booked with them with aggregated progress."""
    mock_db = AsyncMock()

    async def mock_execute(query: Any) -> Any:
        q_str = str(query)
        mock_res = MagicMock()
        if "FROM bookings" in q_str:
            scalars = MagicMock()
            scalars.all.return_value = [mentee_booking]
            mock_res.scalars.return_value = scalars
            return mock_res
        if "FROM mentor_profiles" in q_str:
            mock_res.scalar_one_or_none.return_value = mentor_profile
            return mock_res
        if "FROM users" in q_str:
            mock_res.scalar_one_or_none.return_value = mentee_user
            return mock_res
        if "FROM businesses" in q_str:
            mock_res.scalar_one_or_none.return_value = mentee_business
            return mock_res
        if "FROM launch_plans" in q_str:
            mock_plan = LaunchPlan(
                id=uuid.uuid4(),
                business_id=mentee_business.id,
                status="approved",
                summary="Plan",
            )
            mock_res.scalar_one_or_none.return_value = mock_plan
            return mock_res
        if "count" in q_str.lower():
            mock_res.one.return_value = (24, 8)
            return mock_res
        mock_res.scalar_one_or_none.return_value = None
        return mock_res

    mock_db.execute.side_effect = mock_execute

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return mentor_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/mentors/me/mentees", headers=mentor_headers
            )
            assert response.status_code == 200
            data = response.json()
            assert data["total_count"] == 1
            mentee = data["mentees"][0]
            assert mentee["name"] == "Amina Khan"
            assert mentee["business_name"] == "Amina Crochet Studio"
            assert mentee["business_city"] == "Karachi"
            assert mentee["total_bookings"] == 1
            assert mentee["latest_booking_status"] == "accepted"
            assert mentee["tasks_total"] == 24
            assert mentee["tasks_completed"] == 8
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_mentee_detail_unauthorized_scope_returns_404(
    mentor_user: User,
    mentor_profile: MentorProfile,
    other_user: User,
    mentor_headers: dict[str, str],
) -> None:
    """Requesting detail for an entrepreneur who hasn't booked with this mentor returns 404."""
    mock_db = AsyncMock()

    async def mock_execute(query: Any) -> Any:
        q_str = str(query)
        mock_res = MagicMock()
        if "FROM bookings" in q_str:
            scalars = MagicMock()
            scalars.all.return_value = []  # No booking with this mentor
            mock_res.scalars.return_value = scalars
            return mock_res
        if "FROM mentor_profiles" in q_str:
            mock_res.scalar_one_or_none.return_value = mentor_profile
            return mock_res
        mock_res.scalar_one_or_none.return_value = None
        return mock_res

    mock_db.execute.side_effect = mock_execute

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return mentor_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                f"/api/v1/mentors/me/mentees/{other_user.id}", headers=mentor_headers
            )
            assert response.status_code == 404
            assert "booked" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_mentee_detail_success_with_brief_and_progress(
    mentor_user: User,
    mentor_profile: MentorProfile,
    mentee_user: User,
    mentee_business: Business,
    mentee_booking: Booking,
    mentor_headers: dict[str, str],
) -> None:
    """Mentor retrieves full mentee detail including launch tasks, calendar progress, and brief."""
    mock_db = AsyncMock()

    # Create dummy products and validation report
    mentee_business.products = [
        Product(
            id=uuid.uuid4(),
            business_id=mentee_business.id,
            name="Crochet Baby Blanket",
            price_pkr=2800,
            cost_inputs=[],
        )
    ]
    mentee_business.validation_report = ValidationReport(
        id=uuid.uuid4(),
        business_id=mentee_business.id,
        confidence="high",
        competitors=[],
        how_to_be_better=["Custom personalized baby names embroidered on handmade blankets"],
        demand_summary="Strong local demand in Karachi",
        pricing_insight="Good margin profile",
        reasoning="Market validation verified",
    )

    plan = LaunchPlan(
        id=uuid.uuid4(),
        business_id=mentee_business.id,
        status="approved",
        summary="30-day roadmap",
    )
    plan_task = PlanTask(
        id=uuid.uuid4(),
        plan_id=plan.id,
        title="Setup WhatsApp Business Catalog",
        category="setup",
        week=1,
        due_date=date(2026, 10, 10),
        status="completed",
        order_index=1,
    )

    calendar = ContentCalendar(
        id=uuid.uuid4(),
        business_id=mentee_business.id,
        status="ready",
    )
    content_item = ContentItem(
        id=uuid.uuid4(),
        calendar_id=calendar.id,
        day=1,
        date=date(2026, 10, 10),
        platform=["Instagram"],
        format="reel",
        pillar="behind_the_scenes",
        goal="awareness",
        hook="How I crochet a baby blanket in 4 hours",
        caption="Full stitching process...",
        cta="Send a DM to customize",
        status="posted",
    )

    async def mock_execute(query: Any) -> Any:
        q_str = str(query)
        mock_res = MagicMock()
        if "FROM bookings" in q_str:
            scalars = MagicMock()
            scalars.all.return_value = [mentee_booking]
            mock_res.scalars.return_value = scalars
            return mock_res
        if "FROM mentor_profiles" in q_str:
            mock_res.scalar_one_or_none.return_value = mentor_profile
            return mock_res
        if "FROM users" in q_str:
            mock_res.scalar_one_or_none.return_value = mentee_user
            return mock_res
        if "FROM businesses" in q_str:
            mock_res.scalar_one_or_none.return_value = mentee_business
            return mock_res
        if "FROM launch_plans" in q_str:
            mock_res.scalar_one_or_none.return_value = plan
            return mock_res
        if "FROM plan_tasks" in q_str:
            scalars = MagicMock()
            scalars.all.return_value = [plan_task]
            mock_res.scalars.return_value = scalars
            return mock_res
        if "FROM content_calendars" in q_str:
            mock_res.scalar_one_or_none.return_value = calendar
            return mock_res
        if "FROM content_items" in q_str:
            scalars = MagicMock()
            scalars.all.return_value = [content_item]
            mock_res.scalars.return_value = scalars
            return mock_res
        mock_res.scalar_one_or_none.return_value = None
        return mock_res

    mock_db.execute.side_effect = mock_execute

    async def override_get_db() -> AsyncGenerator[Any, None]:
        yield mock_db

    async def override_get_current_user() -> User:
        return mentor_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                f"/api/v1/mentors/me/mentees/{mentee_user.id}", headers=mentor_headers
            )
            assert response.status_code == 200
            data = response.json()
            assert data["name"] == "Amina Khan"
            assert data["business_name"] == "Amina Crochet Studio"
            assert data["city"] == "Karachi"
            assert data["validation_confidence"] == "high"
            assert "Custom personalized" in data["competitor_gap"]
            assert data["products_count"] == 1
            assert data["tasks_total"] == 1
            assert data["tasks_completed"] == 1
            assert data["completion_rate"] == 100.0
            assert len(data["recent_tasks"]) == 1
            assert data["recent_tasks"][0]["title"] == "Setup WhatsApp Business Catalog"
            assert data["content_items_total"] == 1
            assert data["content_items_posted"] == 1
            assert len(data["session_history"]) == 1
            assert data["session_history"][0]["service_title"] == "Handmade Pricing & Margins"

            # Check Mentor Brief
            brief = data["mentor_brief"]
            assert brief["stage"] is not None
            assert len(brief["executive_summary"]) > 0
            assert len(brief["focus_areas"]) > 0
            assert len(brief["recommended_questions"]) > 0
    finally:
        app.dependency_overrides.clear()
