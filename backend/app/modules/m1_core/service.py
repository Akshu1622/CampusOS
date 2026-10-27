from fastapi import status
from sqlalchemy.orm import Session
from app.core.errors import APIError
from app.core.security import verify_password, get_password_hash, create_access_token
from app.modules.m1_core.repository import M1Repository
from app.core.config import settings
from datetime import timedelta, datetime
import uuid
from sqlalchemy import text


class M1Service:
    def __init__(self, db: Session):
        self.db = db
        self.repo = M1Repository(db)

    # ─── Auth ─────────────────────────────────────────────────────────────────

    def perform_login(self, username: str, password: str, ip: str) -> dict:
        """
        Full login flow:
          1. Count recent failures → lockout check (sets LOCKED on account)
          2. Fetch user → inactive/locked check
          3. Verify password
          4. Update last_login
          5. Issue JWT access + refresh tokens (rotation-ready)
        """
        recent_fails = self.repo.get_recent_failed_logins(username, settings.LOCKOUT_WINDOW_MINUTES)
        user = self.repo.get_user_by_username(username)

        # Lockout: too many failed attempts
        if recent_fails >= settings.MAX_LOGIN_ATTEMPTS:
            if user and user.status == 'ACTIVE':
                self.repo.set_user_locked(user.id)
            self.repo.log_audit(
                user.id if user else None, "LOGIN_LOCKED_OUT",
                "user_account", user.id if user else 0,
                f"User {username} locked out after {recent_fails} failures", ip
            )
            raise APIError(
                code="ACCOUNT_LOCKED",
                message="Too many failed attempts. Your account has been locked. Contact an administrator.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        if not user:
            self.repo.record_login_attempt(username, ip, False)
            raise APIError(code="UNAUTHORIZED", message="Invalid credentials", status_code=status.HTTP_401_UNAUTHORIZED)

        if user.status == 'LOCKED':
            raise APIError(code="ACCOUNT_LOCKED", message="Your account is locked. Contact an administrator.", status_code=status.HTTP_403_FORBIDDEN)

        if user.status != 'ACTIVE':
            raise APIError(code="FORBIDDEN", message="Account is disabled", status_code=status.HTTP_403_FORBIDDEN)

        if not verify_password(password, user.password_hash):
            self.repo.record_login_attempt(username, ip, False)
            self.repo.log_audit(user.id, "LOGIN_FAILED", "user_account", user.id, "Invalid password", ip)
            raise APIError(code="UNAUTHORIZED", message="Invalid credentials", status_code=status.HTTP_401_UNAUTHORIZED)

        # Success
        self.repo.record_login_attempt(username, ip, True)
        self.repo.update_last_login(user.id)
        self.repo.log_audit(user.id, "LOGIN_SUCCESS", "user_account", user.id, "Successful login", ip)

        roles, perms = self.repo.get_user_roles_and_perms(user.id)
        access_token = create_access_token(user.id, roles, perms)

        jti = str(uuid.uuid4())
        expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        expire = datetime.utcnow() + expires_delta

        from jose import jwt
        refresh_token = jwt.encode(
            {"sub": str(user.id), "jti": jti, "exp": expire},
            settings.SECRET_KEY, algorithm=settings.ALGORITHM
        )
        jti_hash = get_password_hash(jti)
        self.repo.create_refresh_token(user.id, jti_hash, expire.strftime('%Y-%m-%d %H:%M:%S'))

        return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token}

    def perform_refresh(self, refresh_token: str) -> dict:
        from jose import jwt, JWTError
        try:
            payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id_str = payload.get("sub")
            jti = payload.get("jti")
            if not user_id_str or not jti:
                raise APIError(code="UNAUTHORIZED", message="Invalid refresh token", status_code=status.HTTP_401_UNAUTHORIZED)
            user_id = int(user_id_str)
        except JWTError:
            raise APIError(code="UNAUTHORIZED", message="Invalid refresh token", status_code=status.HTTP_401_UNAUTHORIZED)

        user = self.repo.get_user_by_id(user_id)
        if not user or user.status not in ('ACTIVE',):
            raise APIError(code="UNAUTHORIZED", message="User inactive or not found", status_code=status.HTTP_401_UNAUTHORIZED)

        sessions_query = text("SELECT token_hash as refresh_token_hash, is_revoked FROM refresh_token WHERE user_id = :uid")
        sessions = self.repo.db.execute(sessions_query, {"uid": user.id}).fetchall()

        session_valid = False
        target_hash = None
        for s in sessions:
            if verify_password(jti, s.refresh_token_hash):
                if s.is_revoked:
                    raise APIError(code="UNAUTHORIZED", message="Token revoked", status_code=status.HTTP_401_UNAUTHORIZED)
                session_valid = True
                target_hash = s.refresh_token_hash
                break

        if not session_valid:
            raise APIError(code="UNAUTHORIZED", message="Session not found", status_code=status.HTTP_401_UNAUTHORIZED)

        # Revoke old → issue new (rotation)
        self.repo.revoke_refresh_token(target_hash)
        roles, perms = self.repo.get_user_roles_and_perms(user.id)
        access_token = create_access_token(user.id, roles, perms)

        new_jti = str(uuid.uuid4())
        expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        expire = datetime.utcnow() + expires_delta

        from jose import jwt
        new_refresh_token = jwt.encode(
            {"sub": str(user.id), "jti": new_jti, "exp": expire},
            settings.SECRET_KEY, algorithm=settings.ALGORITHM
        )
        new_jti_hash = get_password_hash(new_jti)
        self.repo.create_refresh_token(user.id, new_jti_hash, expire.strftime('%Y-%m-%d %H:%M:%S'))

        return {"access_token": access_token, "token_type": "bearer", "refresh_token": new_refresh_token}

    def logout(self, refresh_token: str):
        from jose import jwt, JWTError
        try:
            payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id = int(payload.get("sub"))
            jti = payload.get("jti")
        except JWTError:
            return  # silently ignore bad tokens on logout

        sessions_query = text("SELECT token_hash as refresh_token_hash FROM refresh_token WHERE user_id = :uid AND is_revoked = 0")
        sessions = self.db.execute(sessions_query, {"uid": user_id}).fetchall()
        for s in sessions:
            if verify_password(jti, s.refresh_token_hash):
                self.repo.revoke_refresh_token(s.refresh_token_hash)
                break
