from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.dependencies.db import get_db
from app.core.errors import APIError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

class CurrentUser:
    def __init__(self, user_id: int, roles: list[str], permission_sets: list[str]):
        self.user_id = user_id
        self.roles = roles
        self.permission_sets = permission_sets

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> CurrentUser:
    credentials_exception = APIError(
        code="UNAUTHORIZED",
        message="Could not validate credentials",
        status_code=status.HTTP_401_UNAUTHORIZED
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
        roles = payload.get("roles", [])
        permission_sets = payload.get("permission_sets", [])
    except JWTError:
        raise credentials_exception

    # Verify user is active (not deactivated or revoked)
    res = db.execute(text("SELECT status FROM user_account WHERE id = :uid"), {"uid": user_id}).fetchone()
    if not res:
        raise APIError(code="UNAUTHORIZED", message="User not found", status_code=status.HTTP_401_UNAUTHORIZED)
    if res[0] != 'ACTIVE':
        raise APIError(code="FORBIDDEN", message="User account is deactivated or revoked", status_code=status.HTTP_403_FORBIDDEN)

    # Set session variable for audit triggers
    db.execute(text("SET @app_user_id = :uid"), {"uid": user_id})

    return CurrentUser(user_id=user_id, roles=roles, permission_sets=permission_sets)

def require_role(required_roles: list[str]):
    def role_checker(current_user: CurrentUser = Depends(get_current_user)):
        req_lower = [r.lower() for r in required_roles]
        if not any(role.lower() in req_lower for role in current_user.roles):
            raise APIError(code="FORBIDDEN", message="Insufficient role permissions", status_code=status.HTTP_403_FORBIDDEN)
        return current_user
    return role_checker

def require_permission(required_permissions: list[str]):
    def permission_checker(current_user: CurrentUser = Depends(get_current_user)):
        req_lower = [p.lower() for p in required_permissions]
        if not any(perm.lower() in req_lower for perm in current_user.permission_sets):
            raise APIError(code="FORBIDDEN", message="Insufficient permission sets", status_code=status.HTTP_403_FORBIDDEN)
        return current_user
    return permission_checker

def require_ownership_or_role(resource_user_id: int, allowed_roles: list[str], current_user: CurrentUser):
    """
    Ownership check helper: allows access if the resource belongs to the current user,
    or if the current user has one of the allowed administrative roles.
    """
    if current_user.user_id == resource_user_id:
        return True
    
    allowed_lower = [r.lower() for r in allowed_roles]
    if any(role.lower() in allowed_lower for role in current_user.roles):
        return True
    raise APIError(code="FORBIDDEN", message="Access denied to this resource", status_code=status.HTTP_403_FORBIDDEN)
