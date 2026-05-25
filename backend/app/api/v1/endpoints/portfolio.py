from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.deps import require_roles
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User, UserRole
from app.models.sme import SME
from app.models.prediction import RiskPrediction, RiskLevel
from app.models.alert import Alert, AlertStatus

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

_CAN_VIEW_DETAIL = (UserRole.ADMIN, UserRole.LENDER, UserRole.RISK_ANALYST, UserRole.PROGRAM_MANAGER)


@router.get("/summary")
def portfolio_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_smes = db.query(func.count(SME.id)).filter(SME.is_active == True).scalar()
    active_alerts = db.query(func.count(Alert.id)).filter(Alert.status == AlertStatus.ACTIVE).scalar()

    subq = (
        db.query(RiskPrediction.sme_id, func.max(RiskPrediction.id).label("lid"))
        .group_by(RiskPrediction.sme_id).subquery()
    )
    risk_counts = (
        db.query(RiskPrediction.overall_risk_level, func.count().label("cnt"))
        .join(subq, RiskPrediction.id == subq.c.lid)
        .group_by(RiskPrediction.overall_risk_level)
        .all()
    )
    dist = {r.overall_risk_level: r.cnt for r in risk_counts}
    avg_score = (
        db.query(func.avg(RiskPrediction.overall_risk_score))
        .join(subq, RiskPrediction.id == subq.c.lid)
        .scalar()
    )

    return {
        "total_smes": total_smes,
        "active_alerts": active_alerts,
        "avg_risk_score": round(float(avg_score or 0), 1),
        "risk_distribution": {
            "low": dist.get(RiskLevel.LOW, 0),
            "medium": dist.get(RiskLevel.MEDIUM, 0),
            "high": dist.get(RiskLevel.HIGH, 0),
            "critical": dist.get(RiskLevel.CRITICAL, 0),
        },
        "smes_assessed": sum(dist.values()),
    }


@router.get("/watchlist")
def watchlist(db: Session = Depends(get_db), current_user: User = Depends(require_roles(*_CAN_VIEW_DETAIL))):
    subq = (
        db.query(RiskPrediction.sme_id, func.max(RiskPrediction.id).label("lid"))
        .group_by(RiskPrediction.sme_id).subquery()
    )
    rows = (
        db.query(SME, RiskPrediction)
        .join(subq, SME.id == subq.c.sme_id)
        .join(RiskPrediction, RiskPrediction.id == subq.c.lid)
        .filter(RiskPrediction.overall_risk_level.in_([RiskLevel.HIGH, RiskLevel.CRITICAL]))
        .filter(SME.is_active == True)
        .all()
    )
    return [
        {
            "sme_id": sme.id,
            "sme_name": sme.name,
            "sector": sme.sector,
            "risk_level": pred.overall_risk_level,
            "risk_score": float(pred.overall_risk_score or 0),
            "cash_runway_days": pred.cash_runway_days,
            "prediction_date": pred.prediction_date,
        }
        for sme, pred in rows
    ]


@router.get("/risk-trend")
def risk_trend(db: Session = Depends(get_db), current_user: User = Depends(require_roles(*_CAN_VIEW_DETAIL))):
    from sqlalchemy import extract
    rows = (
        db.query(
            extract("year", RiskPrediction.prediction_date).label("year"),
            extract("month", RiskPrediction.prediction_date).label("month"),
            func.avg(RiskPrediction.overall_risk_score).label("avg_score"),
            func.count(RiskPrediction.id).label("count"),
        )
        .group_by("year", "month")
        .order_by("year", "month")
        .limit(12)
        .all()
    )
    return [
        {"year": int(r.year), "month": int(r.month), "avg_score": round(float(r.avg_score or 0), 1), "count": r.count}
        for r in rows
    ]
