"""Admin service business logic for users, audit, agent explorer and settings (Tasks 12-16)."""

import csv
import io
import secrets
import string
import uuid
from datetime import datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.agents.config import agent_config
from app.auth.password import hash_password
from app.core.audit import record_audit_log
from app.models.agent import AgentRun, AgentStep
from app.models.audit import AuditLog
from app.models.mentor import MentorProfile
from app.models.settings import Setting
from app.models.user import RefreshToken, User
from app.schemas.admin import (
    AdminCreateUserRequest,
    AdminUpdateUserRequest,
    MentorApprovalActionResponse,
    PendingMentorApplicationItem,
    SettingsResponse,
    UpdateSettingsRequest,
)
from app.schemas.common import PaginatedResponse


def generate_temp_password(length: int = 12) -> str:
    """Generate a cryptographically secure temporary password matching complexity rules."""
    alphabet = string.ascii_letters + string.digits
    # Guarantee at least 1 uppercase and 1 digit
    upper = secrets.choice(string.ascii_uppercase)
    digit = secrets.choice(string.digits)
    rest = "".join(secrets.choice(alphabet) for _ in range(length - 2))
    return f"{upper}{digit}{rest}"


# ---------------------------------------------------------------------------
# Task 12: User Management
# ---------------------------------------------------------------------------
async def list_users(
    db: AsyncSession,
    role: str | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> PaginatedResponse[User]:
    """Retrieve paginated user list with optional role and status filters."""
    query = select(User)
    count_query = select(func.count()).select_from(User)

    if role:
        query = query.where(User.role == role)
        count_query = count_query.where(User.role == role)
    if status:
        query = query.where(User.status == status)
        count_query = count_query.where(User.status == status)

    total = (await db.scalar(count_query)) or 0
    items = (
        await db.scalars(
            query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        )
    ).all()

    return PaginatedResponse(
        items=list(items),
        total=total,
        page=page,
        page_size=page_size,
    )


async def create_user_by_admin(
    db: AsyncSession,
    request: AdminCreateUserRequest,
    actor_id: uuid.UUID | None = None,
) -> tuple[User, str]:
    """Create a user with an auto-generated temporary password and force password change."""
    temp_password = generate_temp_password()
    password_hash = hash_password(temp_password)

    user = User(
        name=request.name.strip(),
        email=request.email.lower().strip(),
        password_hash=password_hash,
        role=request.role,
        language=request.language,
        status="active",
        force_password_change=True,
        program_id=request.program_id,
    )
    db.add(user)
    await db.flush()

    await record_audit_log(
        db=db,
        actor_id=actor_id,
        action="user.created",
        target_type="user",
        target_id=str(user.id),
        meta={"created_by": "admin", "role": user.role, "email": user.email},
    )

    return user, temp_password


async def update_user_by_admin(
    db: AsyncSession,
    user_id: uuid.UUID,
    request: AdminUpdateUserRequest,
    actor_id: uuid.UUID | None = None,
) -> User | None:
    """Modify user role or active status with required audit records."""
    user = await db.get(User, user_id)
    if not user:
        return None

    if request.name is not None:
        user.name = request.name.strip()

    if request.status is not None and request.status != user.status:
        old_status = user.status
        user.status = request.status
        action = "user.suspended" if request.status == "suspended" else "user.reactivated"
        await record_audit_log(
            db=db,
            actor_id=actor_id,
            action=action,
            target_type="user",
            target_id=str(user.id),
            meta={"before": old_status, "after": user.status},
        )

    if request.role is not None and request.role != user.role:
        old_role = user.role
        user.role = request.role
        await record_audit_log(
            db=db,
            actor_id=actor_id,
            action="user.role_changed",
            target_type="user",
            target_id=str(user.id),
            meta={"before": old_role, "after": user.role},
        )

    await db.flush()
    return user


async def reset_password_by_admin(
    db: AsyncSession,
    user_id: uuid.UUID,
    actor_id: uuid.UUID | None = None,
) -> str | None:
    """Reset user password to a temporary password, force change, and revoke refresh tokens."""
    user = await db.get(User, user_id)
    if not user:
        return None

    temp_password = generate_temp_password()
    user.password_hash = hash_password(temp_password)
    user.force_password_change = True
    user.failed_login_count = 0
    user.locked_until = None

    # Revoke all existing refresh tokens for security
    await db.execute(delete(RefreshToken).where(RefreshToken.user_id == user.id))
    await db.flush()

    await record_audit_log(
        db=db,
        actor_id=actor_id,
        action="auth.password.reset",
        target_type="user",
        target_id=str(user.id),
        meta={"reset_by": "admin"},
    )

    return temp_password


# ---------------------------------------------------------------------------
# Task 13: Audit Log Viewer
# ---------------------------------------------------------------------------
async def list_audit_logs(
    db: AsyncSession,
    actor_id: uuid.UUID | None = None,
    action: str | None = None,
    from_date: datetime | None = None,
    to_date: datetime | None = None,
    page: int = 1,
    page_size: int = 20,
) -> PaginatedResponse[AuditLog]:
    """Retrieve filtered, paginated audit entries."""
    query = select(AuditLog)
    count_query = select(func.count()).select_from(AuditLog)

    if actor_id:
        query = query.where(AuditLog.actor_id == actor_id)
        count_query = count_query.where(AuditLog.actor_id == actor_id)
    if action:
        query = query.where(AuditLog.action == action)
        count_query = count_query.where(AuditLog.action == action)
    if from_date:
        query = query.where(AuditLog.at >= from_date)
        count_query = count_query.where(AuditLog.at >= from_date)
    if to_date:
        query = query.where(AuditLog.at <= to_date)
        count_query = count_query.where(AuditLog.at <= to_date)

    total = (await db.scalar(count_query)) or 0
    items = (
        await db.scalars(
            query.order_by(AuditLog.at.desc()).offset((page - 1) * page_size).limit(page_size)
        )
    ).all()

    return PaginatedResponse(
        items=list(items),
        total=total,
        page=page,
        page_size=page_size,
    )


async def export_audit_logs_csv(
    db: AsyncSession,
    actor_id: uuid.UUID | None = None,
    action: str | None = None,
    from_date: datetime | None = None,
    to_date: datetime | None = None,
    admin_id: uuid.UUID | None = None,
) -> str:
    """Generate CSV string of filtered audit rows and record audit.exported."""
    query = select(AuditLog)
    if actor_id:
        query = query.where(AuditLog.actor_id == actor_id)
    if action:
        query = query.where(AuditLog.action == action)
    if from_date:
        query = query.where(AuditLog.at >= from_date)
    if to_date:
        query = query.where(AuditLog.at <= to_date)

    logs = (await db.scalars(query.order_by(AuditLog.at.desc()).limit(1000))).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "id",
            "created_at",
            "actor_id",
            "action",
            "target_type",
            "target_id",
            "ip_address",
        ]
    )

    for log in logs:
        writer.writerow(
            [
                log.id,
                log.at.isoformat() if log.at else "",
                str(log.actor_id) if log.actor_id else "",
                log.action,
                log.target_type or "",
                log.target_id or "",
                log.ip or "",
            ]
        )

    await record_audit_log(
        db=db,
        actor_id=admin_id,
        action="audit.exported",
        target_type="audit_log",
        target_id=None,
        meta={"row_count": len(logs)},
    )

    return output.getvalue()


# ---------------------------------------------------------------------------
# Tasks 14 & 15: Agent Run Explorer & Detail
# ---------------------------------------------------------------------------
async def list_agent_runs(
    db: AsyncSession,
    workflow: str | None = None,
    status: str | None = None,
    user_id: uuid.UUID | None = None,
    page: int = 1,
    page_size: int = 20,
) -> PaginatedResponse[AgentRun]:
    """Retrieve filtered, paginated agent runs for admin oversight."""
    query = select(AgentRun)
    count_query = select(func.count()).select_from(AgentRun)

    if workflow:
        query = query.where(AgentRun.workflow == workflow)
        count_query = count_query.where(AgentRun.workflow == workflow)
    if status:
        query = query.where(AgentRun.status == status)
        count_query = count_query.where(AgentRun.status == status)
    if user_id:
        query = query.where(AgentRun.user_id == user_id)
        count_query = count_query.where(AgentRun.user_id == user_id)

    total = (await db.scalar(count_query)) or 0
    items = (
        await db.scalars(
            query.order_by(AgentRun.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).all()

    return PaginatedResponse(
        items=list(items),
        total=total,
        page=page,
        page_size=page_size,
    )


async def get_agent_run_detail(
    db: AsyncSession,
    run_id: uuid.UUID,
) -> tuple[AgentRun | None, list[AgentStep]]:
    """Retrieve agent run with all child spans ordered by start timestamp."""
    run = await db.get(AgentRun, run_id)
    if not run:
        return None, []

    spans: list[AgentStep] = []
    if run.trace_id:
        spans = list(
            (
                await db.scalars(
                    select(AgentStep)
                    .where(AgentStep.trace_id == run.trace_id)
                    .order_by(AgentStep.started_at.asc(), AgentStep.id.asc())
                )
            ).all()
        )

    return run, spans


# ---------------------------------------------------------------------------
# Task 16: System Settings & Kill Switch
# ---------------------------------------------------------------------------
DEFAULT_SETTINGS: dict[str, Any] = {
    "agent_max_concurrent": 5,
    "agent_per_user_daily_limit": 5,
    "agent_kill_switch": False,
    "rate_limit_per_minute": 100,
}


async def get_settings(db: AsyncSession) -> SettingsResponse:
    """Read all configuration settings from the settings table."""
    records = (await db.scalars(select(Setting))).all()
    setting_map = {r.key: r.value for r in records}

    return SettingsResponse(
        agent_max_concurrent=int(
            setting_map.get("agent_max_concurrent", DEFAULT_SETTINGS["agent_max_concurrent"])
        ),
        agent_per_user_daily_limit=int(
            setting_map.get(
                "agent_per_user_daily_limit", DEFAULT_SETTINGS["agent_per_user_daily_limit"]
            )
        ),
        agent_kill_switch=bool(
            setting_map.get("agent_kill_switch", DEFAULT_SETTINGS["agent_kill_switch"])
        ),
        rate_limit_per_minute=int(
            setting_map.get("rate_limit_per_minute", DEFAULT_SETTINGS["rate_limit_per_minute"])
        ),
    )


async def update_settings(
    db: AsyncSession,
    update: UpdateSettingsRequest,
    actor_id: uuid.UUID | None = None,
) -> SettingsResponse:
    """Update settings in database and audit change with before/after values."""
    current = await get_settings(db)
    changes: dict[str, Any] = {}

    for field, val in update.model_dump(exclude_unset=True).items():
        if val is not None:
            old_val = getattr(current, field)
            if old_val != val:
                changes[field] = {"before": old_val, "after": val}
                setting_row = await db.get(Setting, field)
                if setting_row:
                    setting_row.value = val
                else:
                    db.add(Setting(key=field, value=val))

                if field == "agent_kill_switch":
                    agent_config.kill_switch = bool(val)

    await db.flush()

    if changes:
        await record_audit_log(
            db=db,
            actor_id=actor_id,
            action="settings.changed",
            target_type="settings",
            target_id=None,
            meta=changes,
        )

    return await get_settings(db)


async def toggle_kill_switch(
    db: AsyncSession,
    actor_id: uuid.UUID | None = None,
) -> bool:
    """Toggle the agent emergency kill switch and write kill_switch.toggled audit row."""
    current = await get_settings(db)
    new_state = not current.agent_kill_switch

    setting_row = await db.get(Setting, "agent_kill_switch")
    if setting_row:
        setting_row.value = new_state
    else:
        db.add(Setting(key="agent_kill_switch", value=new_state))

    agent_config.kill_switch = new_state
    await db.flush()

    await record_audit_log(
        db=db,
        actor_id=actor_id,
        action="kill_switch.toggled",
        target_type="system",
        target_id=None,
        meta={"active": new_state},
    )

    return new_state


# ---------------------------------------------------------------------------
# Task 44: Mentor Approval (F-030 / PRD §10 W-006, §13.2)
# ---------------------------------------------------------------------------
async def list_pending_mentors(
    db: AsyncSession,
) -> list[PendingMentorApplicationItem]:
    """Retrieve all pending mentor applications awaiting super admin review (F-030)."""
    stmt = (
        select(MentorProfile)
        .options(selectinload(MentorProfile.user))
        .join(User, MentorProfile.user_id == User.id)
        .where(
            or_(
                MentorProfile.status == "pending",
                User.status == "pending",
            )
        )
        .order_by(MentorProfile.created_at.desc())
    )
    result = await db.execute(stmt)
    profiles = result.scalars().all()

    items: list[PendingMentorApplicationItem] = []
    for p in profiles:
        user = p.user
        items.append(
            PendingMentorApplicationItem(
                id=p.id,
                user_id=p.user_id,
                name=user.name if user else "Applicant",
                email=user.email if user else "",
                city=p.city,
                bio=p.bio,
                niches=p.niches or [],
                languages=p.languages or [],
                avatar_url=p.avatar_url,
                user_status=user.status if user else "pending",
                mentor_status=p.status,
                created_at=p.created_at,
            )
        )
    return items


async def approve_mentor(
    db: AsyncSession,
    *,
    mentor_id: uuid.UUID,
    actor_id: uuid.UUID,
    ip: str | None = None,
    user_agent: str | None = None,
) -> MentorApprovalActionResponse:
    """Approve a mentor application: activates user and mentor profile, records mentor.approved audit event (F-030 / W-006)."""
    stmt = (
        select(MentorProfile)
        .options(selectinload(MentorProfile.user))
        .where(
            or_(
                MentorProfile.id == mentor_id,
                MentorProfile.user_id == mentor_id,
            )
        )
    )
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor profile not found",
        )

    old_status = profile.status
    profile.status = "active"
    if profile.user:
        profile.user.status = "active"

    await record_audit_log(
        db=db,
        actor_id=actor_id,
        action="mentor.approved",
        target_type="mentor_profile",
        target_id=str(profile.id),
        ip=ip,
        user_agent=user_agent,
        before={"status": old_status},
        after={"status": "active"},
    )

    await db.commit()

    return MentorApprovalActionResponse(
        id=profile.id,
        user_id=profile.user_id,
        status="active",
        message="Mentor application approved successfully. Pro panel unlocked.",
    )


async def decline_mentor(
    db: AsyncSession,
    *,
    mentor_id: uuid.UUID,
    reason: str | None = None,
    actor_id: uuid.UUID,
    ip: str | None = None,
    user_agent: str | None = None,
) -> MentorApprovalActionResponse:
    """Decline a mentor application: sets status to declined, records mentor.declined audit event (F-030 / W-006)."""
    stmt = (
        select(MentorProfile)
        .options(selectinload(MentorProfile.user))
        .where(
            or_(
                MentorProfile.id == mentor_id,
                MentorProfile.user_id == mentor_id,
            )
        )
    )
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor profile not found",
        )

    old_status = profile.status
    profile.status = "declined"
    if profile.user:
        profile.user.status = "declined"

    await record_audit_log(
        db=db,
        actor_id=actor_id,
        action="mentor.declined",
        target_type="mentor_profile",
        target_id=str(profile.id),
        ip=ip,
        user_agent=user_agent,
        before={"status": old_status},
        after={"status": "declined", "reason": reason},
    )

    await db.commit()

    return MentorApprovalActionResponse(
        id=profile.id,
        user_id=profile.user_id,
        status="declined",
        message="Mentor application declined.",
    )

