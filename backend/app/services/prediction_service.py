"""
Rule-based risk scoring engine (prototype).
Computes sustainability and liquidity risk from transaction KPIs.
"""
from datetime import date, timedelta
from decimal import Decimal
from typing import Optional
import statistics
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.models.transaction import Transaction, TransactionType
from app.models.prediction import RiskPrediction, RiskLevel
from app.models.sme import SME


def _risk_level(score: float) -> RiskLevel:
    if score < 25:
        return RiskLevel.LOW
    if score < 50:
        return RiskLevel.MEDIUM
    if score < 75:
        return RiskLevel.HIGH
    return RiskLevel.CRITICAL


def compute_features(db: Session, sme_id: int, as_of: date = None) -> Optional[dict]:
    """Compute KPI features from transactions — up to 12 months, or all data if fewer exist."""
    if as_of is None:
        as_of = date.today()
    since = as_of - timedelta(days=365)

    txns = (
        db.query(Transaction)
        .filter(Transaction.sme_id == sme_id, Transaction.date <= as_of)
        .order_by(Transaction.date)
        .all()
    )
    if len(txns) < 3:
        return None
    # Use only last 12 months if we have enough data
    recent = [t for t in txns if t.date >= since]
    if len(recent) >= 3:
        txns = recent

    inflows = [float(t.amount) for t in txns if t.type == TransactionType.INFLOW]
    outflows = [float(t.amount) for t in txns if t.type == TransactionType.OUTFLOW]

    if not inflows:
        return None

    # Group by month
    monthly: dict = {}
    for t in txns:
        key = (t.date.year, t.date.month)
        if key not in monthly:
            monthly[key] = {"in": 0.0, "out": 0.0}
        if t.type == TransactionType.INFLOW:
            monthly[key]["in"] += float(t.amount)
        else:
            monthly[key]["out"] += float(t.amount)

    months = sorted(monthly.keys())
    monthly_inflows = [monthly[m]["in"] for m in months]
    monthly_outflows = [monthly[m]["out"] for m in months]

    avg_inflow = statistics.mean(monthly_inflows) if monthly_inflows else 0
    avg_outflow = statistics.mean(monthly_outflows) if monthly_outflows else 0
    net_cash_flow = avg_inflow - avg_outflow

    volatility = (statistics.stdev(monthly_inflows) / avg_inflow) if len(monthly_inflows) > 1 and avg_inflow > 0 else 0
    burn_rate = avg_outflow / avg_inflow if avg_inflow > 0 else 1.0
    expense_ratio = burn_rate
    cash_runway = int((net_cash_flow / avg_outflow * 30)) if avg_outflow > 0 and net_cash_flow > 0 else 0

    # Inflow trend: slope of last 3 months vs first 3 months
    if len(monthly_inflows) >= 6:
        early = statistics.mean(monthly_inflows[:3])
        recent = statistics.mean(monthly_inflows[-3:])
        inflow_trend = (recent - early) / early if early > 0 else 0
    else:
        inflow_trend = 0

    return {
        "avg_monthly_inflow": avg_inflow,
        "avg_monthly_outflow": avg_outflow,
        "net_cash_flow": net_cash_flow,
        "revenue_volatility": volatility,
        "burn_rate": burn_rate,
        "cash_runway_days": cash_runway,
        "expense_ratio": expense_ratio,
        "inflow_trend": inflow_trend,
        "months_count": len(months),
    }


def score_risk(features: dict) -> dict:
    """Compute risk scores 0-100 from features."""
    burn_score = min(features["burn_rate"] * 50, 100)
    volatility_score = min(features["revenue_volatility"] * 100, 100)
    trend_score = max(0, -features["inflow_trend"] * 50)
    runway_score = max(0, 100 - features["cash_runway_days"] * 0.5) if features["cash_runway_days"] < 200 else 0

    liquidity_score = burn_score * 0.4 + runway_score * 0.35 + volatility_score * 0.25
    sustainability_score = volatility_score * 0.3 + burn_score * 0.3 + trend_score * 0.25 + runway_score * 0.15
    overall_score = liquidity_score * 0.5 + sustainability_score * 0.5

    liquidity_score = min(max(liquidity_score, 0), 100)
    sustainability_score = min(max(sustainability_score, 0), 100)
    overall_score = min(max(overall_score, 0), 100)

    # Probabilities via logistic approximation
    def prob(score): return round(1 / (1 + 2.718 ** (-0.08 * (score - 50))), 4)

    factors = []
    if features["burn_rate"] > 0.9:
        factors.append({"factor": "High burn rate", "impact": "high", "value": round(features["burn_rate"], 3)})
    if features["revenue_volatility"] > 0.5:
        factors.append({"factor": "High revenue volatility", "impact": "high", "value": round(features["revenue_volatility"], 3)})
    if features["inflow_trend"] < -0.1:
        factors.append({"factor": "Declining inflows", "impact": "medium", "value": round(features["inflow_trend"], 3)})
    if features["cash_runway_days"] < 30:
        factors.append({"factor": "Low cash runway", "impact": "critical", "value": features["cash_runway_days"]})
    if not factors:
        factors.append({"factor": "No major risk factors detected", "impact": "low", "value": None})

    return {
        "overall_risk_score": round(overall_score, 2),
        "liquidity_risk_score": round(liquidity_score, 2),
        "sustainability_risk_score": round(sustainability_score, 2),
        "overall_risk_level": _risk_level(overall_score),
        "liquidity_stress_30d": prob(liquidity_score),
        "liquidity_stress_60d": prob(liquidity_score * 0.85),
        "liquidity_stress_90d": prob(liquidity_score * 0.75),
        "sustainability_risk_6m": prob(sustainability_score * 0.9),
        "sustainability_risk_12m": prob(sustainability_score),
        "risk_factors": factors,
    }


def run_prediction(db: Session, sme_id: int) -> Optional[RiskPrediction]:
    features = compute_features(db, sme_id)
    if features is None:
        return None

    scores = score_risk(features)
    today = date.today()

    pred = RiskPrediction(
        sme_id=sme_id,
        prediction_date=today,
        avg_monthly_inflow=round(features["avg_monthly_inflow"], 2),
        avg_monthly_outflow=round(features["avg_monthly_outflow"], 2),
        net_cash_flow=round(features["net_cash_flow"], 2),
        revenue_volatility=round(features["revenue_volatility"], 4),
        burn_rate=round(features["burn_rate"], 4),
        cash_runway_days=features["cash_runway_days"],
        expense_ratio=round(features["expense_ratio"], 4),
        inflow_trend=round(features["inflow_trend"], 4),
        **{k: v for k, v in scores.items() if k != "overall_risk_level"},
        overall_risk_level=scores["overall_risk_level"],
    )
    db.add(pred)
    db.commit()
    db.refresh(pred)
    return pred
