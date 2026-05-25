from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.deps import require_roles
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User, UserRole
from app.models.sme import SME
from app.models.prediction import RiskPrediction, RiskLevel

router = APIRouter(prefix="/sector", tags=["Sector Analytics"])

_CAN_VIEW = (UserRole.ADMIN, UserRole.RISK_ANALYST, UserRole.PROGRAM_MANAGER)


@router.get("/overview")
def sector_overview(db: Session = Depends(get_db), current_user: User = Depends(require_roles(*_CAN_VIEW))):
    rows = (
        db.query(SME.sector, func.count(SME.id).label("count"))
        .filter(SME.is_active == True, SME.sector != None)
        .group_by(SME.sector)
        .all()
    )
    return [{"sector": r.sector, "sme_count": r.count} for r in rows]


@router.get("/risk-by-sector")
def risk_by_sector(db: Session = Depends(get_db), current_user: User = Depends(require_roles(*_CAN_VIEW))):
    # Latest prediction per SME
    subq = (
        db.query(
            RiskPrediction.sme_id,
            func.max(RiskPrediction.id).label("latest_id")
        ).group_by(RiskPrediction.sme_id).subquery()
    )
    rows = (
        db.query(
            SME.sector,
            RiskPrediction.overall_risk_level,
            func.count(SME.id).label("count"),
            func.avg(RiskPrediction.overall_risk_score).label("avg_score"),
        )
        .join(subq, SME.id == subq.c.sme_id)
        .join(RiskPrediction, RiskPrediction.id == subq.c.latest_id)
        .filter(SME.sector != None)
        .group_by(SME.sector, RiskPrediction.overall_risk_level)
        .all()
    )
    result: dict = {}
    for r in rows:
        if r.sector not in result:
            result[r.sector] = {"sector": r.sector, "avg_risk_score": 0, "risk_distribution": {}, "total": 0}
        result[r.sector]["risk_distribution"][r.overall_risk_level] = r.count
        result[r.sector]["total"] += r.count
        result[r.sector]["avg_risk_score"] = round(float(r.avg_score or 0), 1)
    return list(result.values())


@router.get("/province-map")
def province_map(db: Session = Depends(get_db), current_user: User = Depends(require_roles(*_CAN_VIEW))):
    rows = (
        db.query(SME.location_province, func.count(SME.id).label("count"))
        .filter(SME.is_active == True, SME.location_province != None)
        .group_by(SME.location_province)
        .all()
    )
    return [{"province": r.location_province, "sme_count": r.count} for r in rows]
