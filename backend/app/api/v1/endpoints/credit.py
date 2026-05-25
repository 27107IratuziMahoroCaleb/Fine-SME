from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import require_roles
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User, UserRole
from app.models.prediction import RiskPrediction
from app.schemas.credit import CreditAssessmentOut
from app.services import credit_service, audit_service

router = APIRouter(prefix="/credit", tags=["Credit"])


@router.post("/smes/{sme_id}/assess", response_model=CreditAssessmentOut, status_code=201)
def assess(
    sme_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.LENDER)),
):
    pred = (
        db.query(RiskPrediction)
        .filter(RiskPrediction.sme_id == sme_id)
        .order_by(RiskPrediction.prediction_date.desc())
        .first()
    )
    if not pred:
        raise HTTPException(status_code=422, detail="Run a risk prediction first")
    assessment = credit_service.generate_credit_assessment(db, pred, current_user.id)
    audit_service.log(db, "credit_assessment", current_user.id, "credit", assessment.id, f"SME {sme_id}")
    result = CreditAssessmentOut.model_validate(assessment)
    result.sme_name = assessment.sme.name if assessment.sme else None
    return result


@router.get("/", response_model=list[CreditAssessmentOut])
def list_assessments(
    sme_id: int = Query(None),
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.LENDER, UserRole.RISK_ANALYST)),
):
    items = credit_service.list_assessments(db, sme_id, skip, limit)
    result = []
    for a in items:
        d = CreditAssessmentOut.model_validate(a)
        if a.sme:
            d.sme_name = a.sme.name
        result.append(d)
    return result
