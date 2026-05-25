import enum
from sqlalchemy import Boolean, Column, Date, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class SMESize(str, enum.Enum):
    MICRO = "micro"
    SMALL = "small"
    MEDIUM = "medium"


class SME(Base):
    __tablename__ = "smes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    registration_number = Column(String(100), unique=True, nullable=True)
    sector = Column(String(100))
    sub_sector = Column(String(100))
    size = Column(Enum(SMESize), default=SMESize.SMALL)
    location_province = Column(String(100))
    location_district = Column(String(100))
    owner_name = Column(String(200))
    owner_phone = Column(String(30))
    owner_email = Column(String(255))
    established_date = Column(Date, nullable=True)
    employee_count = Column(Integer, default=0)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    transactions = relationship("Transaction", back_populates="sme", cascade="all, delete-orphan")
    predictions = relationship("RiskPrediction", back_populates="sme", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="sme", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="sme", cascade="all, delete-orphan")
    credit_assessments = relationship("CreditAssessment", back_populates="sme", cascade="all, delete-orphan")
