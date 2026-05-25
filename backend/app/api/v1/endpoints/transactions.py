import csv, io
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import require_roles
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User, UserRole
from app.models.transaction import TransactionType
from app.schemas.transaction import TransactionCreate, TransactionOut, TransactionBulkCreate, TransactionSummary
from app.services import transaction_service, audit_service

router = APIRouter(prefix="/smes/{sme_id}/transactions", tags=["Transactions"])

_CAN_WRITE = (UserRole.ADMIN, UserRole.LENDER, UserRole.SME_ADVISOR)


@router.get("/", response_model=list[TransactionOut])
def list_transactions(
    sme_id: int,
    start: Optional[date] = None, end: Optional[date] = None,
    type: Optional[TransactionType] = None,
    skip: int = 0, limit: int = 200,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return transaction_service.list_transactions(db, sme_id, start, end, type, skip, limit)


@router.post("/", response_model=TransactionOut, status_code=201)
def add_transaction(
    sme_id: int, data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_CAN_WRITE)),
):
    txn = transaction_service.add_transaction(db, sme_id, data)
    audit_service.log(db, "add_transaction", current_user.id, "transaction", txn.id, f"SME {sme_id}")
    return txn


@router.post("/bulk", status_code=201)
def bulk_add(
    sme_id: int, data: TransactionBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_CAN_WRITE)),
):
    txns = transaction_service.bulk_add_transactions(db, sme_id, data.transactions)
    audit_service.log(db, "bulk_import", current_user.id, "transaction", None, f"{len(txns)} records for SME {sme_id}")
    return {"imported": len(txns)}


@router.post("/upload-csv")
async def upload_csv(
    sme_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*_CAN_WRITE)),
):
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8-sig")))
    rows = list(reader)
    count = transaction_service.import_csv(db, sme_id, rows)
    audit_service.log(db, "csv_import", current_user.id, "transaction", None, f"{count} records for SME {sme_id}")
    return {"imported": count}


@router.get("/summary", response_model=TransactionSummary)
def get_summary(sme_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return transaction_service.get_summary(db, sme_id)
