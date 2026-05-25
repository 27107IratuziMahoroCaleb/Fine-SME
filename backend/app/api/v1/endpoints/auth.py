import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
)
from app.models.user import PasswordResetOTP, User
from app.schemas.user import (
    OTPResetPasswordRequest,
    OTPVerifyRequest,
    PasswordResetRequest,
    RefreshRequest,
    TokenResponse,
    UserLogin,
    UserOut,
    UserRegister,
)
from app.services.email_service import send_otp_email
from app.services.user_service import (
    authenticate_user,
    create_user,
    get_user_by_email,
    get_user_by_id,
    update_refresh_token,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
bearer = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != "access":
            raise ValueError
        user_id: int = int(payload["sub"])
    except (JWTError, ValueError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    user = get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)):
    return create_user(db, data)


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.email, data.password)
    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    update_refresh_token(db, user, refresh)
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/refresh", response_model=TokenResponse)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(data.refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError
        user_id = int(payload["sub"])
    except (JWTError, ValueError, KeyError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    user = get_user_by_id(db, user_id)
    if not user or user.refresh_token != data.refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token revoked")
    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    update_refresh_token(db, user, refresh)
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    update_refresh_token(db, current_user, None)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(data: PasswordResetRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, data.email)

    # Always return the same response to avoid leaking whether an email exists
    if user:
        # Invalidate any existing unused OTPs for this email
        db.query(PasswordResetOTP).filter(
            PasswordResetOTP.email == data.email,
            PasswordResetOTP.used == False,
        ).update({"used": True})
        db.commit()

        code = str(secrets.randbelow(1000000)).zfill(6)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
        otp = PasswordResetOTP(email=data.email, code=code, expires_at=expires_at)
        db.add(otp)
        db.commit()

        try:
            send_otp_email(to_email=data.email, otp_code=code, full_name=user.full_name)
        except Exception:
            # Don't expose SMTP errors to the caller
            pass

    return {"message": "If that email is registered, you will receive a reset code shortly."}


@router.post("/verify-otp", status_code=status.HTTP_200_OK)
def verify_otp(data: OTPVerifyRequest, db: Session = Depends(get_db)):
    otp = (
        db.query(PasswordResetOTP)
        .filter(
            PasswordResetOTP.email == data.email,
            PasswordResetOTP.code == data.code,
            PasswordResetOTP.used == False,
        )
        .order_by(PasswordResetOTP.created_at.desc())
        .first()
    )
    if not otp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired code")
    if otp.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Code has expired")
    return {"message": "Code is valid"}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(data: OTPResetPasswordRequest, db: Session = Depends(get_db)):
    otp = (
        db.query(PasswordResetOTP)
        .filter(
            PasswordResetOTP.email == data.email,
            PasswordResetOTP.code == data.code,
            PasswordResetOTP.used == False,
        )
        .order_by(PasswordResetOTP.created_at.desc())
        .first()
    )
    if not otp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired code")
    if otp.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Code has expired")

    user = get_user_by_email(db, data.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid request")

    user.hashed_password = hash_password(data.new_password)
    user.refresh_token = None  # force re-login on all devices
    otp.used = True
    db.commit()

    return {"message": "Password reset successfully"}
