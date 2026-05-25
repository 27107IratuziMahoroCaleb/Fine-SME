from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User, UserRole
from app.schemas.audit import AuditLogOut
from app.services import audit_service
from fastapi import HTTPException, status

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("/", response_model=list[AuditLogOut])
def get_audit_logs(
    user_id: int = Query(None),
    action: str = Query(None),
    resource_type: str = Query(None),
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return audit_service.list_logs(db, user_id, action, resource_type, skip, limit)
