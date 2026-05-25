import enum
from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class TransactionType(str, enum.Enum):
    INFLOW = "inflow"
    OUTFLOW = "outflow"


class TransactionSource(str, enum.Enum):
    BANK = "bank"
    MOBILE_MONEY = "mobile_money"
    POS = "pos"
    INVOICE = "invoice"
    MANUAL = "manual"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    sme_id = Column(Integer, ForeignKey("smes.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    type = Column(Enum(TransactionType), nullable=False)
    category = Column(String(100))
    amount = Column(Numeric(15, 2), nullable=False)
    balance = Column(Numeric(15, 2), nullable=True)
    description = Column(Text)
    source = Column(Enum(TransactionSource), default=TransactionSource.MANUAL)
    reference = Column(String(200))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sme = relationship("SME", back_populates="transactions")
