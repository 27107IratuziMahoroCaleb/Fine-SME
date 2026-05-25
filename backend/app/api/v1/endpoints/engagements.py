from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.deps import require_roles
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User, UserRole
from app.models.sme import SME
from app.models.prediction import RiskPrediction
from app.models.engagement import LenderSMEEngagement, EngagementStatus

router = APIRouter(prefix="/engagements", tags=["Engagements"])

_LENDER_ONLY = (UserRole.LENDER,)
_OVERVIEW_ROLES = (UserRole.ADMIN, UserRole.PROGRAM_MANAGER)


class EngagementUpsert(BaseModel):
    sme_id: int
    status: EngagementStatus = EngagementStatus.PROSPECT
    loan_amount: Optional[float] = None
    notes: Optional[str] = None


def _latest_pred(db: Session, sme_id: int):
    return (
        db.query(RiskPrediction)
        .filter(RiskPrediction.sme_id == sme_id)
        .order_by(RiskPrediction.id.desc())
        .first()
    )


def _eng_dict(eng: LenderSMEEngagement, sme: SME, pred: RiskPrediction | None) -> dict:
    return {
        "id": eng.id,
        "sme_id": eng.sme_id,
        "status": eng.status,
        "loan_amount": float(eng.loan_amount) if eng.loan_amount else None,
        "notes": eng.notes,
        "attached_at": eng.attached_at,
        "updated_at": eng.updated_at,
        "sme": {
            "id": sme.id,
            "name": sme.name,
            "sector": sme.sector,
            "location_province": sme.location_province,
            "size": sme.size,
        },
        "latest_prediction": {
            "overall_risk_score": float(pred.overall_risk_score or 0),
            "overall_risk_level": pred.overall_risk_level,
            "cash_runway_days": pred.cash_runway_days,
        } if pred else None,
    }


@router.post("/", status_code=200)
def upsert_engagement(
    data: EngagementUpsert,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_LENDER_ONLY)),
):
    sme = db.query(SME).filter(SME.id == data.sme_id, SME.is_active == True).first()
    if not sme:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "SME not found")

    eng = db.query(LenderSMEEngagement).filter(
        LenderSMEEngagement.lender_id == current_user.id,
        LenderSMEEngagement.sme_id == data.sme_id,
    ).first()

    if eng:
        eng.status = data.status
        eng.loan_amount = data.loan_amount
        eng.notes = data.notes
    else:
        eng = LenderSMEEngagement(
            lender_id=current_user.id,
            sme_id=data.sme_id,
            status=data.status,
            loan_amount=data.loan_amount,
            notes=data.notes,
        )
        db.add(eng)

    db.commit()
    db.refresh(eng)
    return _eng_dict(eng, sme, _latest_pred(db, sme.id))


@router.get("/mine")
def my_engagements(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_LENDER_ONLY)),
):
    engs = db.query(LenderSMEEngagement).filter(
        LenderSMEEngagement.lender_id == current_user.id
    ).order_by(LenderSMEEngagement.attached_at.desc()).all()

    result = []
    for eng in engs:
        sme = db.query(SME).filter(SME.id == eng.sme_id).first()
        if sme:
            result.append(_eng_dict(eng, sme, _latest_pred(db, sme.id)))
    return result


@router.get("/sme/{sme_id}")
def my_engagement_for_sme(
    sme_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_LENDER_ONLY)),
):
    eng = db.query(LenderSMEEngagement).filter(
        LenderSMEEngagement.lender_id == current_user.id,
        LenderSMEEngagement.sme_id == sme_id,
    ).first()
    if not eng:
        return None
    sme = db.query(SME).filter(SME.id == sme_id).first()
    return _eng_dict(eng, sme, _latest_pred(db, sme_id))


@router.delete("/sme/{sme_id}", status_code=204)
def remove_engagement(
    sme_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_LENDER_ONLY)),
):
    eng = db.query(LenderSMEEngagement).filter(
        LenderSMEEngagement.lender_id == current_user.id,
        LenderSMEEngagement.sme_id == sme_id,
    ).first()
    if eng:
        db.delete(eng)
        db.commit()


@router.get("/overview")
def engagement_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_OVERVIEW_ROLES)),
):
    engs = db.query(LenderSMEEngagement).order_by(LenderSMEEngagement.attached_at.desc()).all()
    result = []
    for eng in engs:
        sme = db.query(SME).filter(SME.id == eng.sme_id).first()
        lender = db.query(User).filter(User.id == eng.lender_id).first()
        if sme and lender:
            result.append({
                "id": eng.id,
                "status": eng.status,
                "loan_amount": float(eng.loan_amount) if eng.loan_amount else None,
                "attached_at": eng.attached_at,
                "lender": {
                    "id": lender.id,
                    "full_name": lender.full_name,
                    "organization": lender.organization,
                },
                "sme": {
                    "id": sme.id,
                    "name": sme.name,
                    "sector": sme.sector,
                    "location_province": sme.location_province,
                },
                "latest_prediction": {
                    "overall_risk_level": (p := _latest_pred(db, sme.id)) and p.overall_risk_level,
                    "overall_risk_score": float(p.overall_risk_score or 0) if p else None,
                },
            })
    return result
