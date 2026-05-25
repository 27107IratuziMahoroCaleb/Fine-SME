from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel
from app.models.transaction import TransactionType, TransactionSource


class TransactionCreate(BaseModel):
    date: date
    type: TransactionType
    category: Optional[str] = None
    amount: Decimal
    balance: Optional[Decimal] = None
    description: Optional[str] = None
    source: TransactionSource = TransactionSource.MANUAL
    reference: Optional[str] = None


class TransactionOut(BaseModel):
    id: int
    sme_id: int
    date: date
    type: TransactionType
    category: Optional[str]
    amount: Decimal
    balance: Optional[Decimal]
    description: Optional[str]
    source: TransactionSource
    reference: Optional[str]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class TransactionBulkCreate(BaseModel):
    transactions: List[TransactionCreate]


class TransactionSummary(BaseModel):
    total_inflow: Decimal
    total_outflow: Decimal
    net_cash_flow: Decimal
    transaction_count: int
    avg_monthly_inflow: Decimal
    avg_monthly_outflow: Decimal
