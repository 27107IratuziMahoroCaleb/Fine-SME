from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.sme import SME
from app.models.user import User, UserRole
from app.schemas.sme import SMECreate, SMEOut, SMEUpdate


def get_sme(db: Session, sme_id: int) -> SME:
    sme = db.query(SME).filter(SME.id == sme_id).first()
    if not sme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SME not found")
    return sme


def _enrich(db: Session, sme: SME) -> dict:
    d = {c.name: getattr(sme, c.name) for c in SME.__table__.columns}
    if sme.assigned_advisor_id:
        advisor = db.query(User).filter(User.id == sme.assigned_advisor_id).first()
        d["assigned_advisor_name"] = advisor.full_name if advisor else None
    else:
        d["assigned_advisor_name"] = None
    return d


def list_smes(db: Session, skip: int = 0, limit: int = 100, sector: str = None, active_only: bool = True, caller: User = None):
    q = db.query(SME)
    if active_only:
        q = q.filter(SME.is_active == True)
    if sector:
        q = q.filter(SME.sector == sector)
    if caller and caller.role == UserRole.SME_ADVISOR:
        q = q.filter(SME.assigned_advisor_id == caller.id)
    smes = q.offset(skip).limit(limit).all()
    return [SMEOut(**_enrich(db, s)) for s in smes]


def create_sme(db: Session, data: SMECreate, user_id: int, caller_role: UserRole) -> SMEOut:
    dump = data.model_dump()
    if caller_role == UserRole.SME_ADVISOR:
        dump["assigned_advisor_id"] = user_id
    sme = SME(**dump, created_by=user_id)
    db.add(sme)
    db.commit()
    db.refresh(sme)
    return SMEOut(**_enrich(db, sme))


def update_sme(db: Session, sme_id: int, data: SMEUpdate, caller_role: UserRole) -> SMEOut:
    sme = get_sme(db, sme_id)
    update_data = data.model_dump(exclude_none=True)
    if caller_role != UserRole.ADMIN:
        update_data.pop("assigned_advisor_id", None)
    for k, v in update_data.items():
        setattr(sme, k, v)
    db.commit()
    db.refresh(sme)
    return SMEOut(**_enrich(db, sme))


def delete_sme(db: Session, sme_id: int) -> None:
    sme = get_sme(db, sme_id)
    sme.is_active = False
    db.commit()


def get_sectors(db: Session) -> list[str]:
    rows = db.query(SME.sector).filter(SME.sector != None).distinct().all()
    return [r[0] for r in rows if r[0]]
