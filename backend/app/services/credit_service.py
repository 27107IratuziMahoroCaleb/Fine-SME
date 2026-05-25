from sqlalchemy.orm import Session
from app.models.credit import CreditAssessment, CreditRating
from app.models.prediction import RiskPrediction, RiskLevel


def _rating(score: float) -> CreditRating:
    if score >= 85: return CreditRating.AAA
    if score >= 75: return CreditRating.AA
    if score >= 65: return CreditRating.A
    if score >= 55: return CreditRating.BBB
    if score >= 45: return CreditRating.BB
    if score >= 35: return CreditRating.B
    return CreditRating.CCC


def generate_credit_assessment(db: Session, pred: RiskPrediction, user_id: int) -> CreditAssessment:
    risk = float(pred.overall_risk_score or 50)
    creditworthiness = round(100 - risk, 2)
    rating = _rating(creditworthiness)

    avg_inflow = float(pred.avg_monthly_inflow or 0)
    credit_limit = round(avg_inflow * 3 * (1 - risk / 100), 2)
    rate = round(12 + risk * 0.3, 2)

    if pred.overall_risk_level == RiskLevel.LOW:
        tenor, monitoring = 36, "quarterly"
        structure = "Term loan with monthly instalments. Grace period of 3 months."
        covenants = "Maintain debt-service coverage ratio > 1.5x. No additional debt without consent."
    elif pred.overall_risk_level == RiskLevel.MEDIUM:
        tenor, monitoring = 24, "monthly"
        structure = "Term loan with monthly instalments. No grace period."
        covenants = "Maintain minimum cash balance. Monthly management accounts required."
    else:
        tenor, monitoring = 12, "bi-weekly"
        structure = "Short-term revolving credit. Weekly repayments required."
        covenants = "Weekly cash flow reports. Collateral required. No new commitments without approval."

    factors = {
        "burn_rate": float(pred.burn_rate or 0),
        "revenue_volatility": float(pred.revenue_volatility or 0),
        "cash_runway_days": pred.cash_runway_days,
        "inflow_trend": float(pred.inflow_trend or 0),
        "overall_risk_score": risk,
    }

    assessment = CreditAssessment(
        sme_id=pred.sme_id,
        assessed_by=user_id,
        creditworthiness_score=creditworthiness,
        credit_rating=rating,
        recommended_credit_limit=credit_limit,
        risk_adjusted_rate=rate,
        loan_tenor_months=tenor,
        loan_structure=structure,
        covenant_suggestions=covenants,
        monitoring_frequency=monitoring,
        repayment_behavior_score=creditworthiness,
        decision_factors=factors,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


def list_assessments(db: Session, sme_id: int = None, skip=0, limit=50):
    q = db.query(CreditAssessment)
    if sme_id:
        q = q.filter(CreditAssessment.sme_id == sme_id)
    return q.order_by(CreditAssessment.assessment_date.desc()).offset(skip).limit(limit).all()
