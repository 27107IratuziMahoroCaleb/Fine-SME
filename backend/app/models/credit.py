import enum
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, JSON, Numeric, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class CreditRating(str, enum.Enum):
    AAA = "AAA"
    AA = "AA"
    A = "A"
    BBB = "BBB"
    BB = "BB"
    B = "B"
    CCC = "CCC"


class CreditAssessment(Base):
    __tablename__ = "credit_assessments"

    id = Column(Integer, primary_key=True, index=True)
    sme_id = Column(Integer, ForeignKey("smes.id", ondelete="CASCADE"), nullable=False, index=True)
    assessed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    assessment_date = Column(DateTime(timezone=True), server_default=func.now())

    creditworthiness_score = Column(Numeric(5, 2))
    credit_rating = Column(Enum(CreditRating))
    recommended_credit_limit = Column(Numeric(15, 2))
    risk_adjusted_rate = Column(Numeric(5, 2))
    loan_tenor_months = Column(Integer)
    loan_structure = Column(Text)
    covenant_suggestions = Column(Text)
    monitoring_frequency = Column(String(50))

    repayment_behavior_score = Column(Numeric(5, 2))
    collateral_notes = Column(Text)
    decision_factors = Column(JSON)
    notes = Column(Text)

    sme = relationship("SME", back_populates="credit_assessments")
