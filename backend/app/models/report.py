import enum
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.sql import func
from app.core.database import Base


class ReportType(str, enum.Enum):
    SME_RISK = "sme_risk"
    PORTFOLIO = "portfolio"
    SECTOR = "sector"
    EARLY_WARNING = "early_warning"
    INTERVENTION = "intervention"
    CREDIT = "credit"
    EXECUTIVE = "executive"


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    report_type = Column(Enum(ReportType), nullable=False)
    generated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    parameters = Column(JSON)
    data = Column(JSON)
    summary = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
