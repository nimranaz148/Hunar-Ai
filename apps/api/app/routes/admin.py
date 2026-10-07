"""Super Admin management routes (Tasks 12-16 / PRD §14, §30, §36)."""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_role
from app.core.database import get_db
from app.models.user import User
from app.schemas.admin import (
    AdminAgentRunDetailResponse,
    AdminAgentRunResponse,
    AdminCreateUserRequest,
    AdminCreateUserResponse,
    AdminResetPasswordResponse,
    AdminSpanResponse,
    AdminUpdateUserRequest,
    AdminUserResponse,
    KillSwitchResponse,
    MentorApprovalActionResponse,
    PendingMentorApplicationItem,
    SettingsResponse,
    UpdateSettingsRequest,
)
from app.schemas.common import PaginatedResponse
from app.services.admin import (
    approve_mentor,
    create_user_by_admin,
    decline_mentor,
    export_audit_logs_csv,
    get_agent_run_detail,
    get_settings,
    list_agent_runs,
    list_audit_logs,
    list_pending_mentors,
    list_users,
    reset_password_by_admin,
    toggle_kill_switch,
    update_settings,
    update_user_by_admin,
)

router = APIRouter(
    prefix="/api/v1/admin",
    tags=["admin"],
    dependencies=[Depends(require_role("super_admin"))],
)


# ---------------------------------------------------------------------------
# Task 12: User Management (F-031)
# ---------------------------------------------------------------------------
@router.get("/users", response_model=PaginatedResponse[AdminUserResponse])
async def get_admin_users(
    role: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[AdminUserResponse]:
    """List users with pagination and role/status filtering."""
    paginated = await list_users(
        db, role=role, status=status_filter, page=page, page_size=page_size
    )
    return PaginatedResponse(
        items=[AdminUserResponse.model_validate(u) for u in paginated.items],
        total=paginated.total,
        page=paginated.page,
        page_size=paginated.page_size,
    )


@router.post("/users", response_model=AdminCreateUserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: AdminCreateUserRequest,
    current_admin: User = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db),
) -> AdminCreateUserResponse:
    """Create a user with an auto-generated temporary password."""
    user, temp_pw = await create_user_by_admin(db, request, actor_id=current_admin.id)
    return AdminCreateUserResponse(
        user=AdminUserResponse.model_validate(user),
        temporary_password=temp_pw,
    )


@router.patch("/users/{user_id}", response_model=AdminUserResponse)
async def update_user(
    user_id: uuid.UUID,
    request: AdminUpdateUserRequest,
    current_admin: User = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db),
) -> AdminUserResponse:
    """Modify user role, active status, or name."""
    user = await update_user_by_admin(db, user_id, request, actor_id=current_admin.id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return AdminUserResponse.model_validate(user)


@router.post("/users/{user_id}/reset-password", response_model=AdminResetPasswordResponse)
async def reset_user_password(
    user_id: uuid.UUID,
    current_admin: User = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db),
) -> AdminResetPasswordResponse:
    """Reset user password and force change on next login."""
    temp_pw = await reset_password_by_admin(db, user_id, actor_id=current_admin.id)
    if not temp_pw:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return AdminResetPasswordResponse(user_id=user_id, temporary_password=temp_pw)


# ---------------------------------------------------------------------------
# Task 13: Audit Log Viewer (F-032)
# ---------------------------------------------------------------------------
@router.get("/audit")
async def get_audit_logs(
    actor_id: uuid.UUID | None = Query(default=None),
    action: str | None = Query(default=None),
    from_date: datetime | None = Query(default=None, alias="from"),
    to_date: datetime | None = Query(default=None, alias="to"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[dict[str, object]]:
    """Retrieve paginated audit entries with filtering."""
    paginated = await list_audit_logs(
        db,
        actor_id=actor_id,
        action=action,
        from_date=from_date,
        to_date=to_date,
        page=page,
        page_size=page_size,
    )
    return PaginatedResponse(
        items=[
            {
                "id": log.id,
                "created_at": log.at.isoformat() if log.at else None,
                "actor_id": str(log.actor_id) if log.actor_id else None,
                "action": log.action,
                "target_type": log.target_type,
                "target_id": log.target_id,
                "ip_address": log.ip,
                "meta": log.meta,
            }
            for log in paginated.items
        ],
        total=paginated.total,
        page=paginated.page,
        page_size=paginated.page_size,
    )


@router.get("/audit/export")
async def export_audit_logs(
    actor_id: uuid.UUID | None = Query(default=None),
    action: str | None = Query(default=None),
    from_date: datetime | None = Query(default=None, alias="from"),
    to_date: datetime | None = Query(default=None, alias="to"),
    current_admin: User = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Download filtered audit logs as CSV stream."""
    csv_data = await export_audit_logs_csv(
        db,
        actor_id=actor_id,
        action=action,
        from_date=from_date,
        to_date=to_date,
        admin_id=current_admin.id,
    )
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit-logs.csv"},
    )


# ---------------------------------------------------------------------------
# Tasks 14 & 15: Agent Run Explorer & Detail (F-033, F-034)
# ---------------------------------------------------------------------------
@router.get("/runs", response_model=PaginatedResponse[AdminAgentRunResponse])
async def get_agent_runs(
    workflow: str | None = Query(default=None),
    run_status: str | None = Query(default=None, alias="status"),
    user_id: uuid.UUID | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[AdminAgentRunResponse]:
    """Retrieve paginated agent runs for monitoring."""
    paginated = await list_agent_runs(
        db, workflow=workflow, status=run_status, user_id=user_id, page=page, page_size=page_size
    )
    return PaginatedResponse(
        items=[AdminAgentRunResponse.model_validate(r) for r in paginated.items],
        total=paginated.total,
        page=paginated.page,
        page_size=paginated.page_size,
    )


@router.get("/runs/{run_id}", response_model=AdminAgentRunDetailResponse)
async def get_run_detail(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> AdminAgentRunDetailResponse:
    """Retrieve a single agent workflow run along with all child span steps."""
    run, spans = await get_agent_run_detail(db, run_id)
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent run not found")
    return AdminAgentRunDetailResponse(
        run=AdminAgentRunResponse.model_validate(run),
        spans=[AdminSpanResponse.model_validate(s) for s in spans],
    )


# ---------------------------------------------------------------------------
# Task 16: System Settings & Kill Switch (F-035)
# ---------------------------------------------------------------------------
@router.get("/settings", response_model=SettingsResponse)
async def read_system_settings(
    db: AsyncSession = Depends(get_db),
) -> SettingsResponse:
    """Read all configuration settings."""
    return await get_settings(db)


@router.patch("/settings", response_model=SettingsResponse)
async def modify_system_settings(
    update: UpdateSettingsRequest,
    current_admin: User = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db),
) -> SettingsResponse:
    """Modify operational settings with audit log."""
    return await update_settings(db, update, actor_id=current_admin.id)


@router.post("/kill-switch", response_model=KillSwitchResponse)
async def toggle_agent_kill_switch(
    current_admin: User = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db),
) -> KillSwitchResponse:
    """Toggle emergency kill switch."""
    active = await toggle_kill_switch(db, actor_id=current_admin.id)
    return KillSwitchResponse(agent_kill_switch=active)


# ---------------------------------------------------------------------------
# Task 44: Mentor Approval (F-030 / PRD §10 W-006, §13.2)
# ---------------------------------------------------------------------------
@router.get("/mentors/pending", response_model=list[PendingMentorApplicationItem])
async def get_pending_mentor_applications(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_role("super_admin")),
) -> list[PendingMentorApplicationItem]:
    """Retrieve all pending mentor applications awaiting review (F-030 / PRD §10 W-006)."""
    return await list_pending_mentors(db)


@router.post("/mentors/{mentor_id}/approve", response_model=MentorApprovalActionResponse)
async def approve_mentor_application(
    mentor_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_role("super_admin")),
) -> MentorApprovalActionResponse:
    """Approve a mentor application, unlock Pro panel, and record audit log (F-030)."""
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return await approve_mentor(
        db,
        mentor_id=mentor_id,
        actor_id=current_admin.id,
        ip=client_ip,
        user_agent=user_agent,
    )


@router.post("/mentors/{mentor_id}/decline", response_model=MentorApprovalActionResponse)
async def decline_mentor_application(
    mentor_id: uuid.UUID,
    request: Request,
    reason: str | None = Query(default=None, description="Optional decline reason"),
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_role("super_admin")),
) -> MentorApprovalActionResponse:
    """Decline a mentor application and record audit log (F-030)."""
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return await decline_mentor(
        db,
        mentor_id=mentor_id,
        reason=reason,
        actor_id=current_admin.id,
        ip=client_ip,
        user_agent=user_agent,
    )

