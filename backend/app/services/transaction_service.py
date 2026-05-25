from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.transaction import Transaction, TransactionType
from app.schemas.transaction import TransactionCreate


def add_transaction(db: Session, sme_id: int, data: TransactionCreate) -> Transaction:
    txn = Transaction(sme_id=sme_id, **data.model_dump())
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


def bulk_add_transactions(db: Session, sme_id: int, items: List[TransactionCreate]) -> List[Transaction]:
    txns = [Transaction(sme_id=sme_id, **d.model_dump()) for d in items]
    db.add_all(txns)
    db.commit()
    return txns


def list_transactions(
    db: Session, sme_id: int,
    start: Optional[date] = None, end: Optional[date] = None,
    type: Optional[TransactionType] = None,
    skip: int = 0, limit: int = 200
) -> List[Transaction]:
    q = db.query(Transaction).filter(Transaction.sme_id == sme_id)
    if start:
        q = q.filter(Transaction.date >= start)
    if end:
        q = q.filter(Transaction.date <= end)
    if type:
        q = q.filter(Transaction.type == type)
    return q.order_by(Transaction.date.desc()).offset(skip).limit(limit).all()


def get_summary(db: Session, sme_id: int) -> dict:
    rows = db.query(
        Transaction.type,
        func.sum(Transaction.amount).label("total"),
        func.count(Transaction.id).label("count"),
    ).filter(Transaction.sme_id == sme_id).group_by(Transaction.type).all()

    inflow_total = next((float(r.total) for r in rows if r.type == TransactionType.INFLOW), 0.0)
    outflow_total = next((float(r.total) for r in rows if r.type == TransactionType.OUTFLOW), 0.0)
    count = sum(r.count for r in rows)

    months = db.query(
        func.count(func.distinct(func.date_trunc("month", Transaction.date)))
    ).filter(Transaction.sme_id == sme_id).scalar() or 1

    return {
        "total_inflow": inflow_total,
        "total_outflow": outflow_total,
        "net_cash_flow": inflow_total - outflow_total,
        "transaction_count": count,
        "avg_monthly_inflow": round(inflow_total / months, 2),
        "avg_monthly_outflow": round(outflow_total / months, 2),
    }


def import_csv(db: Session, sme_id: int, rows: List[dict]) -> int:
    txns = []
    for r in rows:
        try:
            txns.append(Transaction(
                sme_id=sme_id,
                date=date.fromisoformat(r["date"]),
                type=TransactionType(r["type"].lower()),
                category=r.get("category"),
                amount=float(r["amount"]),
                balance=float(r["balance"]) if r.get("balance") else None,
                description=r.get("description"),
                source=r.get("source", "manual"),
            ))
        except Exception:
            continue
    db.add_all(txns)
    db.commit()
    return len(txns)
