from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import require_roles
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User, UserRole
from app.models.sme import SME
from app.schemas.prediction import PredictionOut, ScorecardOut
from app.services import prediction_service, alert_service, recommendation_service, audit_service

router = APIRouter(prefix="/smes/{sme_id}", tags=["Predictions"])


@router.post("/predict", response_model=PredictionOut, status_code=201)
def run_prediction(
    sme_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.LENDER, UserRole.RISK_ANALYST)),
):
    pred = prediction_service.run_prediction(db, sme_id)
    if not pred:
        raise HTTPException(status_code=422, detail="Insufficient transaction data (minimum 3 transactions required)")
    alert_service.generate_alerts_from_prediction(db, pred)
    recommendation_service.generate_recommendations(db, pred)
    audit_service.log(db, "run_prediction", current_user.id, "prediction", pred.id, f"SME {sme_id}")
    return pred


@router.get("/predictions", response_model=list[PredictionOut])
def get_predictions(
    sme_id: int, skip: int = 0, limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.prediction import RiskPrediction
    return (
        db.query(RiskPrediction)
        .filter(RiskPrediction.sme_id == sme_id)
        .order_by(RiskPrediction.prediction_date.desc())
        .offset(skip).limit(limit).all()
    )


@router.get("/scorecard", response_model=ScorecardOut)
def get_scorecard(
    sme_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.prediction import RiskPrediction
    sme = db.query(SME).filter(SME.id == sme_id).first()
    if not sme:
        raise HTTPException(status_code=404, detail="SME not found")

    pred = (
        db.query(RiskPrediction)
        .filter(RiskPrediction.sme_id == sme_id)
        .order_by(RiskPrediction.prediction_date.desc())
        .first()
    )
    if not pred:
        raise HTTPException(status_code=404, detail="No predictions yet. Run a prediction first.")

    risk = float(pred.overall_risk_score or 50)
    liq = float(pred.liquidity_risk_score or 50)
    sus = float(pred.sustainability_risk_score or 50)
    burn = float(pred.burn_rate or 0.5)
    trend = float(pred.inflow_trend or 0)

    liquidity_score = round(100 - liq, 1)
    profitability_score = round(100 - min(burn * 100, 100), 1)
    stability_score = round(100 - float(pred.revenue_volatility or 0) * 100, 1)
    growth_score = round(50 + trend * 100, 1)
    growth_score = min(max(growth_score, 0), 100)

    strengths, weaknesses = [], []
    if liquidity_score > 60: strengths.append("Adequate liquidity buffer")
    else: weaknesses.append("Low liquidity — cash runway at risk")
    if profitability_score > 60: strengths.append("Controlled expense ratio")
    else: weaknesses.append("High burn rate relative to revenue")
    if stability_score > 60: strengths.append("Stable revenue streams")
    else: weaknesses.append("Volatile revenue patterns")
    if growth_score > 55: strengths.append("Positive revenue growth trend")
    else: weaknesses.append("Declining or flat revenue")

    return ScorecardOut(
        sme_id=sme_id,
        sme_name=sme.name,
        overall_score=round(100 - risk, 1),
        liquidity_score=liquidity_score,
        profitability_score=profitability_score,
        stability_score=stability_score,
        growth_score=growth_score,
        risk_level=pred.overall_risk_level.value if pred.overall_risk_level else "medium",
        strengths=strengths,
        weaknesses=weaknesses,
        last_updated=pred.created_at,
    )
