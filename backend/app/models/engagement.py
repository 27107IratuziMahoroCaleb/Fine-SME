import enum
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Numeric, Text, UniqueConstraint
from sqlalchemy.sql import func
from app.core.database import Base


class EngagementStatus(str, enum.Enum):
    PROSPECT = "prospect"
    UNDER_REVIEW = "under_review"
    FINANCED = "financed"
    MONITORING = "monitoring"
    CLOSED = "closed"


class LenderSMEEngagement(Base):
    __tablename__ = "lender_sme_engagements"

    id = Column(Integer, primary_key=True, index=True)
    lender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sme_id = Column(Integer, ForeignKey("smes.id"), nullable=False)
    status = Column(Enum(EngagementStatus), default=EngagementStatus.PROSPECT, nullable=False)
    loan_amount = Column(Numeric(15, 2), nullable=True)
    notes = Column(Text, nullable=True)
    attached_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (UniqueConstraint("lender_id", "sme_id", name="uq_lender_sme"),)
