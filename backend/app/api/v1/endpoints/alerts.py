from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import require_roles
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User, UserRole
from app.models.alert import AlertStatus
from app.schemas.alert import AlertOut
from app.services import alert_service

router = APIRouter(prefix="/alerts", tags=["Alerts"])

_CAN_ACKNOWLEDGE = (UserRole.ADMIN, UserRole.LENDER, UserRole.RISK_ANALYST, UserRole.SME_ADVISOR)
_CAN_RESOLVE = (UserRole.ADMIN, UserRole.LENDER, UserRole.RISK_ANALYST)


@router.get("/", response_model=list[AlertOut])
def list_alerts(
    sme_id: int = Query(None),
    status: AlertStatus = Query(None),
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alerts = alert_service.list_alerts(db, sme_id, status, skip, limit)
    result = []
    for a in alerts:
        d = AlertOut.model_validate(a)
        if a.sme:
            d.sme_name = a.sme.name
        result.append(d)
    return result


@router.post("/{alert_id}/acknowledge", response_model=AlertOut)
def acknowledge(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles(*_CAN_ACKNOWLEDGE))):
    return alert_service.acknowledge_alert(db, alert_id, current_user.id)


@router.post("/{alert_id}/resolve", response_model=AlertOut)
def resolve(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles(*_CAN_RESOLVE))):
    return alert_service.resolve_alert(db, alert_id)
