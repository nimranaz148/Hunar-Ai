"""Authentication API endpoints: register, login, refresh, logout, me."""

from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas.admin import ChangePasswordRequest
from app.schemas.auth import (
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth import (
    authenticate,
    change_user_password,
    register_user,
    revoke_user_refresh_token,
    rotate_refresh_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_auth_cookies(response: Response, refresh_token: str) -> None:
    """Set secure httpOnly cookie for refresh token."""
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        path="/api/v1/auth",
    )


def _clear_auth_cookies(response: Response) -> None:
    """Clear auth cookies."""
    response.delete_cookie(
        key="refresh_token",
        path="/api/v1/auth",
    )


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new entrepreneur account (F-001)",
)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Register a new user account with entrepreneur role."""
    user = await register_user(db, data)
    return UserResponse.model_validate(user)


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user and receive token pair (F-002)",
)
async def login(
    data: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticate with email and password."""
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    user, access_token, raw_refresh_token = await authenticate(
        db, data, ip=client_ip, user_agent=user_agent
    )
    _set_auth_cookies(response, raw_refresh_token)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",  # noqa: S106
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Rotate refresh token and get a new access token",
)
async def refresh(
    response: Response,
    body: RefreshTokenRequest | None = None,
    refresh_token: Annotated[str | None, Cookie()] = None,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Rotate an active refresh token."""
    token_to_use = refresh_token or (body.refresh_token if body else None)
    if not token_to_use:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token required in cookie or body",
        )

    user, new_access_token, new_raw_rt = await rotate_refresh_token(db, token_to_use)
    _set_auth_cookies(response, new_raw_rt)
    return TokenResponse(
        access_token=new_access_token,
        token_type="bearer",  # noqa: S106
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Revoke refresh token and clear authentication session",
)
async def logout(
    response: Response,
    body: RefreshTokenRequest | None = None,
    refresh_token: Annotated[str | None, Cookie()] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Revoke refresh token and log user out."""
    token_to_use = refresh_token or (body.refresh_token if body else None)
    await revoke_user_refresh_token(db, token_to_use, user_id=current_user.id)
    _clear_auth_cookies(response)
    return {"status": "ok", "message": "Successfully logged out"}


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user profile",
)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Return profile for the currently logged-in user."""
    return UserResponse.model_validate(current_user)


@router.post(
    "/change-password",
    status_code=status.HTTP_200_OK,
    summary="Change user password (F-039)",
)
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Change current authenticated user password and invalidate old sessions."""
    await change_user_password(
        db,
        current_user,
        current_password=data.current_password,
        new_password=data.new_password,
    )
    return {"status": "ok", "message": "Password changed successfully"}
