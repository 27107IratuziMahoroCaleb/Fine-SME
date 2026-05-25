from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import require_roles
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User, UserRole
from app.schemas.sme import SMECreate, SMEUpdate, SMEOut
from app.services import sme_service, audit_service

router = APIRouter(prefix="/smes", tags=["SMEs"])

_CAN_WRITE = (UserRole.ADMIN, UserRole.LENDER, UserRole.SME_ADVISOR, UserRole.RISK_ANALYST)


@router.get("/", response_model=list[SMEOut])
def list_smes(
    skip: int = 0, limit: int = 100,
    sector: str = Query(None),
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return sme_service.list_smes(db, skip, limit, sector, active_only)


@router.post("/", response_model=SMEOut, status_code=201)
def create_sme(data: SMECreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(*_CAN_WRITE))):
    sme = sme_service.create_sme(db, data, current_user.id)
    audit_service.log(db, "create_sme", current_user.id, "sme", sme.id, f"Created SME {sme.name}")
    return sme


@router.get("/sectors", response_model=list[str])
def get_sectors(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return sme_service.get_sectors(db)


@router.get("/{sme_id}", response_model=SMEOut)
def get_sme(sme_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return sme_service.get_sme(db, sme_id)


@router.patch("/{sme_id}", response_model=SMEOut)
def update_sme(sme_id: int, data: SMEUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(*_CAN_WRITE))):
    sme = sme_service.update_sme(db, sme_id, data)
    audit_service.log(db, "update_sme", current_user.id, "sme", sme_id)
    return sme


@router.delete("/{sme_id}", status_code=204)
def delete_sme(sme_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.ADMIN))):
    sme_service.delete_sme(db, sme_id)
    audit_service.log(db, "deactivate_sme", current_user.id, "sme", sme_id)
