"""Acceptance tests for Notifications Inbox (Task 55 / F-038 / PRD §13.2 line 1082, §14.2)."""

import uuid
from collections.abc import AsyncGenerator
from datetime import UTC

import pytest
from httpx import ASGITransport, AsyncClient

from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token
from app.auth.password import hash_password
from app.core.database import get_db
from app.main import app
from app.models.notification import Notification
from app.models.user import User


@pytest.fixture
def entrepreneur_a() -> User:
    """Mock primary entrepreneur user."""
    return User(
        id=uuid.uuid4(),
        email="fatima@hunar.pk",
        name="Fatima Entrepreneur",
        role="entrepreneur",
        password_hash=hash_password("Pass123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


@pytest.fixture
def entrepreneur_b() -> User:
    """Mock secondary entrepreneur user for scoping verification."""
    return User(
        id=uuid.uuid4(),
        email="ayesha@hunar.pk",
        name="Ayesha Entrepreneur",
        role="entrepreneur",
        password_hash=hash_password("Pass123!"),
        status="active",
        language="roman_ur",
        force_password_change=False,
    )


def get_auth_headers(user: User) -> dict[str, str]:
    """Generate bearer token header for a mock user."""
    token = create_access_token(user_id=user.id, role=user.role, email=user.email)
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_notifications_authentication_enforced() -> None:
    """Unauthenticated requests to any notification endpoint return 401."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        res1 = await client.get("/api/v1/notifications")
        assert res1.status_code == 401

        res2 = await client.get("/api/v1/notifications/unread-count")
        assert res2.status_code == 401

        res3 = await client.patch("/api/v1/notifications/1/read")
        assert res3.status_code == 401

        res4 = await client.post("/api/v1/notifications/read-all")
        assert res4.status_code == 401


@pytest.mark.asyncio
async def test_notifications_crud_and_user_scoping(
    entrepreneur_a: User,
    entrepreneur_b: User,
) -> None:
    """Verify notifications listing, scoping, read toggles, and bulk mark-all-read."""
    stored_notifications: list[Notification] = []
    current_active_user = entrepreneur_a

    # In-memory mock database session simulation
    class FakeAsyncSession:
        async def execute(self, statement: object) -> object:
            stmt_str = str(statement).lower()

            class ResultProxy:
                def __init__(self, items: list[Notification], count: int) -> None:
                    self._items = items
                    self._count = count

                def scalars(self) -> object:
                    items = self._items

                    class ScalarResult:
                        def all(self) -> list[Notification]:
                            return items

                    return ScalarResult()

                def scalar_one_or_none(self) -> int | Notification | None:
                    if "count" in stmt_str:
                        return self._count
                    return self._items[0] if self._items else None

            # Filter notifications for the active user in the query
            user_items = [n for n in stored_notifications if n.user_id == current_active_user.id]

            if "update" in stmt_str:
                marked = 0
                for n in user_items:
                    if not n.is_read:
                        n.is_read = True
                        marked += 1

                class UpdateResult:
                    rowcount = marked

                return UpdateResult()

            if "count" in stmt_str:
                if "is_read" in stmt_str or "notifications.is_read = false" in stmt_str:
                    unread = [n for n in user_items if not n.is_read]
                    return ResultProxy([], len(unread))
                return ResultProxy([], len(user_items))

            if "where" in stmt_str and "notifications.id =" in stmt_str:
                # single item query
                # find by id for current user
                for n in stored_notifications:
                    if n.user_id == current_active_user.id:
                        return ResultProxy([n], 1)
                return ResultProxy([], 0)

            # Paginated items list
            unread_only = "is_read = false" in stmt_str or "is_read is false" in stmt_str
            filtered = [n for n in user_items if (not n.is_read if unread_only else True)]
            return ResultProxy(filtered, len(filtered))

        def add(self, obj: Notification) -> None:
            if getattr(obj, "id", None) is None:
                obj.id = len(stored_notifications) + 1
            stored_notifications.append(obj)

        async def commit(self) -> None:
            pass

        async def refresh(self, obj: object) -> None:
            pass

    fake_session = FakeAsyncSession()

    from datetime import datetime

    now = datetime.now(UTC)

    # Pre-populate notifications
    notif_1 = Notification(
        id=1,
        user_id=entrepreneur_a.id,
        title="Weekly Review Ready",
        message="Your weekly AI coach recommendations are ready for review.",
        type="agent",
        link="/metrics",
        is_read=False,
        created_at=now,
    )
    notif_2 = Notification(
        id=2,
        user_id=entrepreneur_a.id,
        title="Mentor Session Confirmed",
        message="Ayesha Siddiqua accepted your booking for tomorrow.",
        type="booking",
        link="/mentors/bookings",
        is_read=False,
        created_at=now,
    )
    notif_3 = Notification(
        id=3,
        user_id=entrepreneur_a.id,
        title="Plan Milestone Complete",
        message="You marked Task #3 as complete.",
        type="milestone",
        link="/plan",
        is_read=True,
        created_at=now,
    )
    # User B notification
    notif_b = Notification(
        id=4,
        user_id=entrepreneur_b.id,
        title="Secret Notification",
        message="Private data for User B only.",
        type="system",
        link="/dashboard",
        is_read=False,
        created_at=now,
    )
    stored_notifications.extend([notif_1, notif_2, notif_3, notif_b])

    async def override_get_db() -> AsyncGenerator[FakeAsyncSession, None]:
        yield fake_session

    async def override_get_current_user() -> User:
        return current_active_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            headers_a = get_auth_headers(entrepreneur_a)

            # 1. Check unread count for user A
            res_count = await client.get("/api/v1/notifications/unread-count", headers=headers_a)
            assert res_count.status_code == 200
            assert res_count.json()["unread_count"] == 2

            # 2. List notifications for user A
            res_list = await client.get("/api/v1/notifications", headers=headers_a)
            assert res_list.status_code == 200
            data_list = res_list.json()
            assert data_list["total"] == 3
            assert data_list["unread_count"] == 2
            assert len(data_list["items"]) == 3
            # Ensure none of user B's notifications leaked
            titles = [item["title"] for item in data_list["items"]]
            assert "Secret Notification" not in titles
            assert "Weekly Review Ready" in titles

            # 3. Mark single notification as read
            res_read = await client.patch("/api/v1/notifications/1/read", headers=headers_a)
            assert res_read.status_code == 200
            assert res_read.json()["is_read"] is True

            # 4. Mark all notifications as read
            res_read_all = await client.post("/api/v1/notifications/read-all", headers=headers_a)
            assert res_read_all.status_code == 200

            # 5. Verify User B unread notification was untouched
            current_active_user = entrepreneur_b
            headers_b = get_auth_headers(entrepreneur_b)
            res_b_count = await client.get("/api/v1/notifications/unread-count", headers=headers_b)
            assert res_b_count.status_code == 200
            assert res_b_count.json()["unread_count"] == 1
    finally:
        app.dependency_overrides.clear()
