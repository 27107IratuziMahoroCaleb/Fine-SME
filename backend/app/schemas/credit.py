from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.models.credit import CreditRating


class CreditAssessmentOut(BaseModel):
    id: int
    sme_id: int
    sme_name: Optional[str] = None
    creditworthiness_score: Optional[Decimal]
    credit_rating: Optional[CreditRating]
    recommended_credit_limit: Optional[Decimal]
    risk_adjusted_rate: Optional[Decimal]
    loan_tenor_months: Optional[int]
    loan_structure: Optional[str]
    covenant_suggestions: Optional[str]
    monitoring_frequency: Optional[str]
    repayment_behavior_score: Optional[Decimal]
    collateral_notes: Optional[str]
    decision_factors: Optional[Dict[str, Any]]
    notes: Optional[str]
    assessment_date: Optional[datetime]

    model_config = {"from_attributes": True}
