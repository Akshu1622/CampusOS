from fastapi import status
from sqlalchemy.orm import Session
from app.core.errors import APIError
from app.core.security import verify_password, get_password_hash, create_access_token, pwd_context
from app.modules.m1_core.repository import M1Repository
from app.core.config import settings
from datetime import timedelta
import uuid
from sqlalchemy import text

class M1Service:
    def __init__(self, db: Session):
        self.db = db
        self.repo = M1Repository(db)

    def login(self, username: str, password: str, ip: str):
        # Check lockout
        recent_fails = self.repo.get_recent_failed_logins(username, settings.LOCKOUT_WINDOW_MINUTES)
        if recent_fails >= settings.MAX_LOGIN_ATTEMPTS:
            self.repo.log_audit(0, "LOGIN_LOCKED_OUT", "user_account", 0, f"User {username} locked out", ip)
            raise APIError(code="ACCOUNT_LOCKED", message="Too many failed attempts. Try again later.", status_code=status.HTTP_403_FORBIDDEN)
            
        user = self.repo.get_user_by_username(username)
        if not user:
            self.repo.record_login_attempt(username, ip, False)
            raise APIError(code="UNAUTHORIZED", message="Invalid credentials", status_code=status.HTTP_401_UNAUTHORIZED)
            
        if user.status != 'ACTIVE':
            raise APIError(code="FORBIDDEN", message="Account is disabled", status_code=status.HTTP_403_FORBIDDEN)
            
        if not verify_password(password, user.password_hash):
            self.repo.record_login_attempt(username, ip, False)
            self.repo.log_audit(user.id, "LOGIN_FAILED", "user_account", user.id, "Invalid password", ip)
            raise APIError(code="UNAUTHORIZED", message="Invalid credentials", status_code=status.HTTP_401_UNAUTHORIZED)
            
        # Success
        self.repo.record_login_attempt(username, ip, True)
        roles, perms = self.repo.get_user_roles_and_perms(user.id)
        
        access_token = create_access_token(user.id, roles, perms)
        
        # Create refresh token
        refresh_token_plain = str(uuid.uuid4())
        refresh_hash = get_password_hash(refresh_token_plain)
        expires_at = (datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)).strftime('%Y-%m-%d %H:%M:%S')
        
        self.repo.create_refresh_token(user.id, refresh_hash, expires_at)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "refresh_token": refresh_hash # In a real app we'd return the plain refresh token and store hash, but for demo we can return hash or plain.
            # Actually, returning hash as the token itself for simplicity here is okay, since we just need a unique string.
            # Let's just use the uuid as the plain token and store its hash!
        }
        
    def perform_login(self, username: str, password: str, ip: str):
        recent_fails = self.repo.get_recent_failed_logins(username, settings.LOCKOUT_WINDOW_MINUTES)
        user = self.repo.get_user_by_username(username)
        if recent_fails >= settings.MAX_LOGIN_ATTEMPTS:
            self.repo.log_audit(user.id if user else None, "LOGIN_LOCKED_OUT", "user_account", user.id if user else 0, f"User {username} locked out", ip)
            raise APIError(code="ACCOUNT_LOCKED", message="Too many failed attempts. Try again later.", status_code=status.HTTP_403_FORBIDDEN)
            
        
        if not user or user.status != 'ACTIVE' or not verify_password(password, user.password_hash):
            self.repo.record_login_attempt(username, ip, False)
            if user:
                self.repo.log_audit(user.id, "LOGIN_FAILED", "user_account", user.id, "Invalid password", ip)
            raise APIError(code="UNAUTHORIZED", message="Invalid credentials", status_code=status.HTTP_401_UNAUTHORIZED)
            
        self.repo.record_login_attempt(username, ip, True)
        roles, perms = self.repo.get_user_roles_and_perms(user.id)
        
        access_token = create_access_token(user.id, roles, perms)
        
        jti = str(uuid.uuid4())
        from datetime import datetime
        expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        expire = datetime.utcnow() + expires_delta
        
        from jose import jwt
        refresh_token = jwt.encode({"sub": str(user.id), "jti": jti, "exp": expire}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        
        jti_hash = get_password_hash(jti)
        self.repo.create_refresh_token(user.id, jti_hash, expire.strftime('%Y-%m-%d %H:%M:%S'))
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "refresh_token": refresh_token
        }

    def perform_refresh(self, refresh_token: str):
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
        if not user or user.status != 'ACTIVE':
            raise APIError(code="UNAUTHORIZED", message="User inactive", status_code=status.HTTP_401_UNAUTHORIZED)
            
        # We need to verify if the jti is stored and not revoked
        # We check all sessions for the user (in a real app, query by user_id and verify hashes)
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
            
        # Revoke old token and issue new (rotation)
        self.repo.revoke_refresh_token(target_hash)
        
        roles, perms = self.repo.get_user_roles_and_perms(user.id)
        access_token = create_access_token(user.id, roles, perms)
        
        new_jti = str(uuid.uuid4())
        from datetime import datetime
        expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        expire = datetime.utcnow() + expires_delta
        new_refresh_token = jwt.encode({"sub": str(user.id), "jti": new_jti, "exp": expire}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
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
            return
            
        sessions_query = text("SELECT token_hash as refresh_token_hash FROM refresh_token WHERE user_id = :uid AND is_revoked = 0")
        sessions = self.db.execute(sessions_query, {"uid": user_id}).fetchall()
        for s in sessions:
            if verify_password(jti, s.refresh_token_hash):
                self.repo.revoke_refresh_token(s.refresh_token_hash)
                break

