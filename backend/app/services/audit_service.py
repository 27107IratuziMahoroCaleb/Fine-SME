from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit import AuditLog


def log(
    db: Session,
    action: str,
    user_id: Optional[int] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
    description: Optional[str] = None,
    ip_address: Optional[str] = None,
    extra: Optional[dict] = None,
):
    entry = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        description=description,
        ip_address=ip_address,
        extra=extra,
    )
    db.add(entry)
    db.commit()


def list_logs(db: Session, user_id: int = None, action: str = None, resource_type: str = None, skip=0, limit=100):
    q = db.query(AuditLog)
    if user_id:
        q = q.filter(AuditLog.user_id == user_id)
    if action:
        q = q.filter(AuditLog.action == action)
    if resource_type:
        q = q.filter(AuditLog.resource_type == resource_type)
    return q.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
