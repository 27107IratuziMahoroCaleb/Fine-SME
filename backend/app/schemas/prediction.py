from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.models.prediction import RiskLevel


class PredictionOut(BaseModel):
    id: int
    sme_id: int
    prediction_date: date
    overall_risk_score: Optional[Decimal]
    liquidity_risk_score: Optional[Decimal]
    sustainability_risk_score: Optional[Decimal]
    overall_risk_level: Optional[RiskLevel]
    liquidity_stress_30d: Optional[Decimal]
    liquidity_stress_60d: Optional[Decimal]
    liquidity_stress_90d: Optional[Decimal]
    sustainability_risk_6m: Optional[Decimal]
    sustainability_risk_12m: Optional[Decimal]
    avg_monthly_inflow: Optional[Decimal]
    avg_monthly_outflow: Optional[Decimal]
    net_cash_flow: Optional[Decimal]
    revenue_volatility: Optional[Decimal]
    burn_rate: Optional[Decimal]
    cash_runway_days: Optional[int]
    expense_ratio: Optional[Decimal]
    inflow_trend: Optional[Decimal]
    risk_factors: Optional[List[Dict[str, Any]]]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class ScorecardOut(BaseModel):
    sme_id: int
    sme_name: str
    overall_score: float
    liquidity_score: float
    profitability_score: float
    stability_score: float
    growth_score: float
    risk_level: str
    strengths: List[str]
    weaknesses: List[str]
    last_updated: Optional[datetime]
