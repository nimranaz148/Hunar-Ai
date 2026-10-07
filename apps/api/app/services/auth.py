"""Authentication business logic.

Registration, credential validation, token rotation, and lockout.
"""

import uuid
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import create_access_token, generate_refresh_token, hash_token
from app.auth.password import hash_password, verify_password
from app.core.audit import record_audit_log
from app.models.mentor import MentorProfile
from app.models.program import Program
from app.models.user import RefreshToken, User
from app.schemas.auth import (
    LoginRequest,
    MentorApplyRequest,
    MentorApplyResponse,
    RegisterRequest,
)


async def register_user(db: AsyncSession, data: RegisterRequest) -> User:
    """Register a new entrepreneur user and record audit log."""
    # Check duplicate email
    email_clean = data.email.lower().strip()
    existing = await db.execute(select(User).where(User.email == email_clean))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists",
        )

    # Validate invite code if provided
    program_id: uuid.UUID | None = None
    if data.invite_code:
        code_clean = data.invite_code.strip()
        prog_query = await db.execute(select(Program).where(Program.invite_code == code_clean))
        program = prog_query.scalar_one_or_none()
        if program is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invite code '{data.invite_code}' is invalid or expired",
            )
        program_id = program.id

    hashed_pw = hash_password(data.password)
    user = User(
        id=uuid.uuid4(),
        name=data.name.strip(),
        email=email_clean,
        password_hash=hashed_pw,
        role="entrepreneur",
        status="active",
        language=data.language,
        program_id=program_id,
        created_at=datetime.now(UTC),
    )
    db.add(user)
    await db.flush()

    # Audit row: user.created with before=None, after=user_data
    await record_audit_log(
        db,
        action="user.created",
        actor_id=user.id,
        actor_role="entrepreneur",
        target_type="user",
        target_id=str(user.id),
        program_id=program_id,
        before=None,
        after={
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "status": user.status,
            "language": user.language,
        },
    )

    return user


async def apply_mentor(db: AsyncSession, data: MentorApplyRequest) -> MentorApplyResponse:
    """Register a new pending mentor account with profile (F-040 / W-006)."""
    email_clean = data.email.lower().strip()
    existing = await db.execute(select(User).where(User.email == email_clean))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists",
        )

    hashed_pw = hash_password(data.password)
    user_id = uuid.uuid4()
    now = datetime.now(UTC)

    user = User(
        id=user_id,
        name=data.name.strip(),
        email=email_clean,
        password_hash=hashed_pw,
        role="mentor",
        status="pending",
        language="roman_ur",
        created_at=now,
    )
    db.add(user)
    await db.flush()

    mentor_id = uuid.uuid4()
    profile = MentorProfile(
        id=mentor_id,
        user_id=user.id,
        city=data.city.strip(),
        bio=data.bio.strip(),
        niches=data.niches,
        languages=data.languages,
        avatar_url=data.avatar_url,
        status="pending",
        rating=0.0,
        review_count=0,
        created_at=now,
    )
    db.add(profile)
    await db.flush()

    # Record audit trail for mentor application
    await record_audit_log(
        db,
        action="mentor.applied",
        actor_id=user.id,
        actor_role="mentor",
        target_type="mentor_profile",
        target_id=str(profile.id),
        before=None,
        after={
            "user_id": str(user.id),
            "mentor_id": str(profile.id),
            "name": user.name,
            "email": user.email,
            "city": profile.city,
            "niches": profile.niches,
            "status": profile.status,
        },
    )

    return MentorApplyResponse(
        user_id=user.id,
        mentor_id=profile.id,
        name=user.name,
        email=user.email,
        status="pending",
        message="Mentor application submitted successfully. Your profile is pending Super Admin review.",
    )


async def authenticate(
    db: AsyncSession,
    data: LoginRequest,
    ip: str | None = None,
    user_agent: str | None = None,
) -> tuple[User, str, str]:
    """Validate credentials and return (user, access_token, raw_refresh_token)."""
    email_clean = data.email.lower().strip()
    result = await db.execute(select(User).where(User.email == email_clean))
    user = result.scalar_one_or_none()

    if user is None:
        await record_audit_log(
            db,
            action="auth.login.failed",
            target_type="user",
            ip=ip,
            user_agent=user_agent,
            meta={"email": email_clean, "reason": "user_not_found"},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    now = datetime.now(UTC)

    # Check lockout
    if user.locked_until is not None:
        if user.locked_until > now:
            remaining_seconds = int((user.locked_until - now).total_seconds())
            remaining_minutes = max(1, (remaining_seconds + 59) // 60)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=(
                    "Account locked due to multiple failed login attempts. "
                    f"Try again in {remaining_minutes} minutes."
                ),
            )
        else:
            # Lockout expired, reset counters
            user.locked_until = None
            user.failed_login_count = 0

    # Verify password
    if not verify_password(data.password, user.password_hash):
        current_failures = user.failed_login_count or 0
        user.failed_login_count = current_failures + 1
        if user.failed_login_count >= 5:
            user.locked_until = now + timedelta(minutes=15)
            await record_audit_log(
                db,
                action="auth.locked",
                actor_id=user.id,
                actor_role=user.role,
                target_type="user",
                target_id=str(user.id),
                ip=ip,
                user_agent=user_agent,
                meta={"reason": "5_failed_attempts"},
            )
            await db.flush()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account locked due to 5 failed login attempts. Try again in 15 minutes.",
            )

        await record_audit_log(
            db,
            action="auth.login.failed",
            actor_id=user.id,
            actor_role=user.role,
            target_type="user",
            target_id=str(user.id),
            ip=ip,
            user_agent=user_agent,
            meta={"email": email_clean, "failed_count": user.failed_login_count},
        )
        await db.flush()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Success: reset failed logins and lockout
    user.failed_login_count = 0
    user.locked_until = None

    # Issue tokens
    access_token = create_access_token(user_id=user.id, role=user.role, email=user.email)
    raw_rt, rt_hash, rt_expires = generate_refresh_token()
    family_id = uuid.uuid4()

    refresh_token_record = RefreshToken(
        id=uuid.uuid4(),
        user_id=user.id,
        token_hash=rt_hash,
        family_id=family_id,
        expires_at=rt_expires,
        created_at=datetime.now(UTC),
    )
    db.add(refresh_token_record)
    await db.flush()

    # Audit row: auth.login.success
    await record_audit_log(
        db,
        action="auth.login.success",
        actor_id=user.id,
        actor_role=user.role,
        target_type="user",
        target_id=str(user.id),
        ip=ip,
        user_agent=user_agent,
    )

    return user, access_token, raw_rt


async def rotate_refresh_token(
    db: AsyncSession,
    raw_token: str,
) -> tuple[User, str, str]:
    """Rotate an existing refresh token with family revocation check."""
    token_hash = hash_token(raw_token)
    result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    rt = result.scalar_one_or_none()

    if rt is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    now = datetime.now(UTC)

    # Family revocation on reuse
    if rt.revoked_at is not None:
        # Revoke all tokens in family chain
        await db.execute(
            update(RefreshToken)
            .where(RefreshToken.family_id == rt.family_id)
            .values(revoked_at=now)
        )
        # Audit row: auth.refresh.reuse_detected
        await record_audit_log(
            db,
            action="auth.refresh.reuse_detected",
            actor_id=rt.user_id,
            target_type="refresh_token",
            target_id=str(rt.id),
            meta={"family_id": str(rt.family_id)},
        )
        await db.flush()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token reuse detected. All sessions in this family have been revoked.",
        )

    if rt.expires_at < now:
        rt.revoked_at = now
        await db.flush()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired",
        )

    user_result = await db.execute(select(User).where(User.id == rt.user_id))
    user = user_result.scalar_one_or_none()
    if user is None or user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is suspended or not found",
        )

    # Generate new token pair
    new_raw_rt, new_rt_hash, new_rt_expires = generate_refresh_token()
    new_rt_id = uuid.uuid4()
    new_rt = RefreshToken(
        id=new_rt_id,
        user_id=user.id,
        token_hash=new_rt_hash,
        family_id=rt.family_id,
        expires_at=new_rt_expires,
        created_at=datetime.now(UTC),
    )
    db.add(new_rt)
    await db.flush()

    # Invalidate old token and point to replacement
    rt.revoked_at = now
    rt.replaced_by = new_rt_id
    await db.flush()

    new_access_token = create_access_token(user_id=user.id, role=user.role, email=user.email)
    return user, new_access_token, new_raw_rt


async def revoke_user_refresh_token(
    db: AsyncSession,
    raw_token: str | None,
    user_id: uuid.UUID | None = None,
) -> None:
    """Revoke a refresh token on logout and record audit log."""
    if not raw_token and not user_id:
        return

    actor = user_id
    if raw_token:
        token_hash = hash_token(raw_token)
        result = await db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        rt = result.scalar_one_or_none()
        if rt and rt.revoked_at is None:
            rt.revoked_at = datetime.now(UTC)
            await db.flush()
            if actor is None:
                actor = rt.user_id

    await record_audit_log(
        db,
        action="auth.logout",
        actor_id=actor,
        target_type="session",
    )


async def change_user_password(
    db: AsyncSession,
    user: User,
    current_password: str,
    new_password: str,
) -> None:
    """Verify current password, update hash, unset force_password_change, revoke tokens."""
    if not verify_password(current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password does not match",
        )

    user.password_hash = hash_password(new_password)
    user.force_password_change = False
    await db.execute(delete(RefreshToken).where(RefreshToken.user_id == user.id))
    await db.flush()

    await record_audit_log(
        db,
        action="auth.password.changed",
        actor_id=user.id,
        target_type="user",
        target_id=str(user.id),
    )
