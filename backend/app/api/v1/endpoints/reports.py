from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import require_roles
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User, UserRole
from app.models.report import Report, ReportType
from app.models.report_schedule import ReportSchedule, ScheduleFrequency
from app.models.sme import SME
from app.models.prediction import RiskPrediction
from app.models.alert import Alert

router = APIRouter(prefix="/reports", tags=["Reports"])

_CAN_USE = (UserRole.ADMIN, UserRole.LENDER, UserRole.RISK_ANALYST, UserRole.PROGRAM_MANAGER)


def _build_report(db: Session, report_type: ReportType, params: dict) -> dict:
    from sqlalchemy import func
    from app.models.alert import AlertStatus, AlertSeverity

    if report_type == ReportType.PORTFOLIO:
        total = db.query(func.count(SME.id)).filter(SME.is_active == True).scalar()
        active_alerts = db.query(func.count(Alert.id)).filter(Alert.status == AlertStatus.ACTIVE).scalar()
        return {"total_smes": total, "active_alerts": active_alerts, "generated_at": str(datetime.now(timezone.utc))}

    if report_type == ReportType.SME_RISK:
        sme_id = params.get("sme_id")
        sme = db.query(SME).filter(SME.id == sme_id).first()
        preds = db.query(RiskPrediction).filter(RiskPrediction.sme_id == sme_id).order_by(RiskPrediction.prediction_date.desc()).limit(5).all()
        return {
            "sme": {"id": sme.id, "name": sme.name, "sector": sme.sector, "province": sme.location_province, "size": sme.size} if sme else {},
            "predictions": [{"date": str(p.prediction_date), "score": float(p.overall_risk_score or 0), "level": p.overall_risk_level} for p in preds],
        }

    if report_type == ReportType.EARLY_WARNING:
        alerts = db.query(Alert).filter(Alert.status == AlertStatus.ACTIVE).order_by(Alert.created_at.desc()).limit(50).all()
        return {
            "active_alerts": len(alerts),
            "critical": sum(1 for a in alerts if a.severity == AlertSeverity.CRITICAL),
            "high": sum(1 for a in alerts if a.severity == AlertSeverity.HIGH),
            "medium": sum(1 for a in alerts if a.severity == AlertSeverity.MEDIUM),
            "alerts": [{"id": a.id, "sme_id": a.sme_id, "title": a.title, "severity": a.severity, "message": a.message} for a in alerts],
            "generated_at": str(datetime.now(timezone.utc)),
        }

    if report_type == ReportType.SECTOR:
        smes = db.query(SME).filter(SME.is_active == True).all()
        sector_map: dict = {}
        for sme in smes:
            s = sme.sector or "Unknown"
            if s not in sector_map:
                sector_map[s] = {"sector": s, "smes": 0, "low": 0, "medium": 0, "high": 0, "critical": 0}
            sector_map[s]["smes"] += 1
            pred = db.query(RiskPrediction).filter(RiskPrediction.sme_id == sme.id).order_by(RiskPrediction.prediction_date.desc()).first()
            if pred and pred.overall_risk_level:
                level = pred.overall_risk_level.value
                sector_map[s][level] = sector_map[s].get(level, 0) + 1
        sectors = sorted(sector_map.values(), key=lambda x: x["smes"], reverse=True)
        return {"sectors": sectors, "total_smes": len(smes), "generated_at": str(datetime.now(timezone.utc))}

    if report_type == ReportType.INTERVENTION:
        from app.models.recommendation import Recommendation
        from collections import Counter
        query = db.query(Recommendation)
        if params.get("sme_id"):
            query = query.filter(Recommendation.sme_id == params["sme_id"])
        recs = query.all()
        by_cat = dict(Counter(r.category.value if r.category else "unknown" for r in recs))
        by_status = dict(Counter(r.status.value if r.status else "unknown" for r in recs))
        sme_map = {s.id: s.name for s in db.query(SME.id, SME.name).all()}
        return {
            "total": len(recs),
            "by_category": by_cat,
            "by_status": by_status,
            "items": [
                {
                    "id": r.id,
                    "sme_id": r.sme_id,
                    "sme_name": sme_map.get(r.sme_id, "Unknown"),
                    "category": r.category.value if r.category else None,
                    "title": r.title,
                    "status": r.status.value if r.status else None,
                    "priority": r.priority,
                }
                for r in recs
            ],
            "generated_at": str(datetime.now(timezone.utc)),
        }

    if report_type == ReportType.CREDIT:
        from app.models.credit import CreditAssessment
        assessments = db.query(CreditAssessment).all()
        sme_map = {s.id: s.name for s in db.query(SME.id, SME.name).all()}
        from collections import Counter
        rating_dist = dict(Counter(a.credit_rating.value if a.credit_rating else "unknown" for a in assessments))
        scores = [float(a.creditworthiness_score or 0) for a in assessments if a.creditworthiness_score]
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0
        return {
            "total": len(assessments),
            "rating_distribution": rating_dist,
            "avg_score": avg_score,
            "items": [
                {
                    "id": a.id,
                    "sme_id": a.sme_id,
                    "sme_name": sme_map.get(a.sme_id, "Unknown"),
                    "rating": a.credit_rating.value if a.credit_rating else None,
                    "score": float(a.creditworthiness_score or 0),
                    "credit_limit": float(a.recommended_credit_limit or 0),
                    "interest_rate": float(a.risk_adjusted_rate or 0),
                    "created_at": str(a.assessment_date),
                }
                for a in assessments
            ],
            "generated_at": str(datetime.now(timezone.utc)),
        }

    if report_type == ReportType.EXECUTIVE:
        total_smes = db.query(func.count(SME.id)).filter(SME.is_active == True).scalar()
        active_alerts = db.query(func.count(Alert.id)).filter(Alert.status == AlertStatus.ACTIVE).scalar()
        # latest prediction per SME via subquery
        subq = (
            db.query(RiskPrediction.sme_id, func.max(RiskPrediction.id).label("max_id"))
            .group_by(RiskPrediction.sme_id)
            .subquery()
        )
        rows = (
            db.query(SME, RiskPrediction)
            .join(subq, SME.id == subq.c.sme_id)
            .join(RiskPrediction, RiskPrediction.id == subq.c.max_id)
            .filter(SME.is_active == True)
            .all()
        )
        risk_dist: dict = {}
        for _, pred in rows:
            lv = pred.overall_risk_level.value if pred.overall_risk_level else "unknown"
            risk_dist[lv] = risk_dist.get(lv, 0) + 1
        top_at_risk = sorted(rows, key=lambda r: float(r[1].overall_risk_score or 0), reverse=True)[:5]
        return {
            "total_smes": total_smes,
            "active_alerts": active_alerts,
            "risk_distribution": risk_dist,
            "top_at_risk": [
                {"name": s.name, "sector": s.sector, "province": s.location_province,
                 "score": float(p.overall_risk_score or 0), "level": p.overall_risk_level.value if p.overall_risk_level else None}
                for s, p in top_at_risk
            ],
            "generated_at": str(datetime.now(timezone.utc)),
        }

    return {}


@router.post("/", status_code=201)
def generate_report(
    report_type: ReportType = Query(...),
    sme_id: int = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_CAN_USE)),
):
    params = {"sme_id": sme_id}
    data = _build_report(db, report_type, params)
    report = Report(
        title=f"{report_type.value.replace('_', ' ').title()} Report",
        report_type=report_type,
        generated_by=current_user.id,
        parameters=params,
        data=data,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return {"id": report.id, "title": report.title, "type": report.report_type, "data": report.data, "created_at": report.created_at}


@router.get("/")
def list_reports(
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_CAN_USE)),
):
    reports = db.query(Report).order_by(Report.created_at.desc()).offset(skip).limit(limit).all()
    return [{"id": r.id, "title": r.title, "type": r.report_type, "created_at": r.created_at} for r in reports]


# ── Scheduled Reports ──────────────────────────────────────────────────────────

class ScheduleCreate(BaseModel):
    report_type: ReportType
    sme_id: int | None = None
    frequency: ScheduleFrequency


@router.post("/schedules", status_code=201)
def create_schedule(
    data: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_CAN_USE)),
):
    next_run = _next_run(data.frequency)
    schedule = ReportSchedule(
        report_type=data.report_type,
        sme_id=data.sme_id,
        frequency=data.frequency,
        next_run_at=next_run,
        created_by=current_user.id,
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return _schedule_out(schedule)


@router.get("/schedules")
def list_schedules(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_CAN_USE)),
):
    schedules = (
        db.query(ReportSchedule)
        .filter(ReportSchedule.created_by == current_user.id, ReportSchedule.is_active == True)
        .order_by(ReportSchedule.created_at.desc())
        .all()
    )
    return [_schedule_out(s) for s in schedules]


@router.delete("/schedules/{schedule_id}", status_code=204)
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_CAN_USE)),
):
    s = db.query(ReportSchedule).filter(
        ReportSchedule.id == schedule_id,
        ReportSchedule.created_by == current_user.id,
    ).first()
    if not s:
        raise HTTPException(404, "Schedule not found")
    s.is_active = False
    db.commit()


def _next_run(freq: ScheduleFrequency) -> datetime:
    now = datetime.now(timezone.utc)
    if freq == ScheduleFrequency.DAILY:
        return now + timedelta(days=1)
    if freq == ScheduleFrequency.WEEKLY:
        return now + timedelta(weeks=1)
    return now + timedelta(days=30)


def _schedule_out(s: ReportSchedule) -> dict:
    return {
        "id": s.id,
        "report_type": s.report_type,
        "sme_id": s.sme_id,
        "frequency": s.frequency,
        "next_run_at": s.next_run_at,
        "is_active": s.is_active,
        "created_at": s.created_at,
    }


@router.get("/{report_id}")
def get_report(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    r = db.query(Report).filter(Report.id == report_id).first()
    if not r:
        raise HTTPException(404, "Report not found")
    return {"id": r.id, "title": r.title, "type": r.report_type, "data": r.data, "created_at": r.created_at}
