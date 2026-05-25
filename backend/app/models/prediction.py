import enum
from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, JSON, Numeric, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RiskPrediction(Base):
    __tablename__ = "risk_predictions"

    id = Column(Integer, primary_key=True, index=True)
    sme_id = Column(Integer, ForeignKey("smes.id", ondelete="CASCADE"), nullable=False, index=True)
    prediction_date = Column(Date, nullable=False, index=True)

    overall_risk_score = Column(Numeric(5, 2))
    liquidity_risk_score = Column(Numeric(5, 2))
    sustainability_risk_score = Column(Numeric(5, 2))
    overall_risk_level = Column(Enum(RiskLevel))

    liquidity_stress_30d = Column(Numeric(6, 4))
    liquidity_stress_60d = Column(Numeric(6, 4))
    liquidity_stress_90d = Column(Numeric(6, 4))
    sustainability_risk_6m = Column(Numeric(6, 4))
    sustainability_risk_12m = Column(Numeric(6, 4))

    avg_monthly_inflow = Column(Numeric(15, 2))
    avg_monthly_outflow = Column(Numeric(15, 2))
    net_cash_flow = Column(Numeric(15, 2))
    revenue_volatility = Column(Numeric(10, 4))
    burn_rate = Column(Numeric(10, 4))
    cash_runway_days = Column(Integer)
    expense_ratio = Column(Numeric(10, 4))
    inflow_trend = Column(Numeric(10, 4))

    risk_factors = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sme = relationship("SME", back_populates="predictions")
