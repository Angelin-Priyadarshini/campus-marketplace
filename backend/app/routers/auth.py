"""Authentication router."""
from __future__ import annotations
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Tuple
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.notification import AuthToken
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    ResendVerificationRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.user import UserMeResponse
from app.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_secure_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.services.email import send_password_reset_email, send_verification_email

router = APIRouter()

# In-memory rate limiting helpers
_failed_logins: Dict[str, List[datetime]] = {}
_resend_requests: Dict[str, List[datetime]] = {}


def _clean_old_timestamps(ts_list: List[datetime], window_seconds: int) -> List[datetime]:
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=window_seconds)
    return [t for t in ts_list if t > cutoff]


def _check_login_rate_limit(key: str) -> None:
    now = datetime.now(timezone.utc)
    attempts = _clean_old_timestamps(_failed_logins.get(key, []), 15 * 60)
    _failed_logins[key] = attempts
    if len(attempts) >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Please try again after 15 minutes.",
        )


def _record_failed_login(key: str) -> None:
    now = datetime.now(timezone.utc)
    attempts = _clean_old_timestamps(_failed_logins.get(key, []), 15 * 60)
    attempts.append(now)
    _failed_logins[key] = attempts


def _clear_failed_login(key: str) -> None:
    _failed_logins.pop(key, None)


def _validate_email_domain(email: str) -> None:
    if settings.allow_any_email:
        return
    allowed_domains = [
        d.strip().lower() for d in settings.allowed_email_domains.split(",") if d.strip()
    ]
    parts = email.split("@")
    if len(parts) != 2 or parts[1].strip().lower() not in allowed_domains:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Email must belong to an allowed campus domain ({', '.join(allowed_domains)})",
        )


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    email_clean = payload.email.lower().strip()
    _validate_email_domain(email_clean)

    # Check uniqueness
    existing = db.execute(select(User).where(User.email == email_clean)).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    is_verified = bool(settings.auto_verify)
    user = User(
        email=email_clean,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        department=payload.department,
        year_of_study=payload.year_of_study,
        is_verified=is_verified,
        role="student",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if not is_verified:
        token = generate_secure_token()
        token_entry = AuthToken(
            user_id=user.id,
            purpose="verify_email",
            token_hash=hash_token(token),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        )
        db.add(token_entry)
        db.commit()

        base_url = settings.frontend_origin
        await send_verification_email(user.email, token, base_url)

    return user


@router.get("/verify-email")
async def verify_email(token: str, db: Session = Depends(get_db)):
    h = hash_token(token)
    now = datetime.now(timezone.utc)
    token_entry = db.execute(
        select(AuthToken).where(
            AuthToken.token_hash == h,
            AuthToken.purpose == "verify_email",
            AuthToken.used_at.is_(None),
            AuthToken.expires_at > now,
        )
    ).scalar_one_or_none()

    if not token_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    user = db.get(User, token_entry.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_verified = True
    token_entry.used_at = now
    db.commit()

    return {"message": "Email successfully verified. You can now log in."}


@router.post("/resend-verification")
async def resend_verification(
    payload: ResendVerificationRequest,
    db: Session = Depends(get_db),
):
    email_clean = payload.email.lower().strip()
    now = datetime.now(timezone.utc)

    # Rate limit: 3 / hour
    attempts = _clean_old_timestamps(_resend_requests.get(email_clean, []), 3600)
    if len(attempts) >= 3:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many verification requests. Please try again after an hour.",
        )
    attempts.append(now)
    _resend_requests[email_clean] = attempts

    user = db.execute(select(User).where(User.email == email_clean)).scalar_one_or_none()
    if user and not user.is_verified:
        token = generate_secure_token()
        token_entry = AuthToken(
            user_id=user.id,
            purpose="verify_email",
            token_hash=hash_token(token),
            expires_at=now + timedelta(hours=24),
        )
        db.add(token_entry)
        db.commit()
        await send_verification_email(user.email, token, settings.frontend_origin)

    return {"message": "If an unverified account exists with this email, a verification link has been sent."}


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    rate_key = f"{payload.email.lower().strip()}:{client_ip}"
    _check_login_rate_limit(rate_key)

    email_clean = payload.email.lower().strip()
    user = db.execute(select(User).where(User.email == email_clean)).scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password_hash):
        _record_failed_login(rate_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended. Please contact campus admin.",
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your campus email before logging in.",
        )

    _clear_failed_login(rate_key)

    access_token = create_access_token({"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=(settings.env == "production"),
        max_age=settings.refresh_token_days * 24 * 3600,
        path="/",
    )

    user_data = UserMeResponse.model_validate(user)
    return TokenResponse(access_token=access_token, token_type="bearer", user=user_data)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token provided")

    try:
        payload = decode_token(token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        user_id = int(payload.get("sub"))
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user = db.get(User, user_id)
    if not user or not user.is_active or not user.is_verified:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account is inactive or not found")

    new_access_token = create_access_token({"sub": str(user.id), "role": user.role})
    user_data = UserMeResponse.model_validate(user)
    return TokenResponse(access_token=new_access_token, token_type="bearer", user=user_data)


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Successfully logged out"}


@router.post("/forgot-password")
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    email_clean = payload.email.lower().strip()
    user = db.execute(select(User).where(User.email == email_clean)).scalar_one_or_none()

    if user and user.is_active:
        token = generate_secure_token()
        token_entry = AuthToken(
            user_id=user.id,
            purpose="reset_password",
            token_hash=hash_token(token),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        )
        db.add(token_entry)
        db.commit()
        await send_password_reset_email(user.email, token, settings.frontend_origin)

    # Avoid user enumeration by always returning the same response
    return {"message": "If that email is registered, password reset instructions have been sent."}


@router.post("/reset-password")
async def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    h = hash_token(payload.token)
    now = datetime.now(timezone.utc)
    token_entry = db.execute(
        select(AuthToken).where(
            AuthToken.token_hash == h,
            AuthToken.purpose == "reset_password",
            AuthToken.used_at.is_(None),
            AuthToken.expires_at > now,
        )
    ).scalar_one_or_none()

    if not token_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token",
        )

    user = db.get(User, token_entry.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.password_hash = hash_password(payload.new_password)
    token_entry.used_at = now
    db.commit()

    return {"message": "Password successfully reset. You can now log in with your new password."}
