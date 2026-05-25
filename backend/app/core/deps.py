from fastapi import Depends, HTTPException, status
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User, UserRole


def require_roles(*roles: UserRole):
    """Dependency factory — enforces that the caller holds one of the given roles."""
    role_set = set(roles)

    def check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in role_set:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return current_user

    return check
