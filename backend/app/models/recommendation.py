import enum
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class RecommendationCategory(str, enum.Enum):
    CASH_FLOW = "cash_flow"
    EXPENSE = "expense"
    REVENUE = "revenue"
    WORKING_CAPITAL = "working_capital"
    DEBT = "debt"
    GROWTH = "growth"
    PRICING = "pricing"
    INVENTORY = "inventory"


class RecommendationStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    IMPLEMENTED = "implemented"
    DISMISSED = "dismissed"


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    sme_id = Column(Integer, ForeignKey("smes.id", ondelete="CASCADE"), nullable=False, index=True)
    prediction_id = Column(Integer, ForeignKey("risk_predictions.id"), nullable=True)
    category = Column(Enum(RecommendationCategory), nullable=False)
    priority = Column(Integer, default=3)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=False)
    action_steps = Column(Text)
    expected_impact = Column(String(300))
    status = Column(Enum(RecommendationStatus), default=RecommendationStatus.PENDING)
    feedback = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    sme = relationship("SME", back_populates="recommendations")
