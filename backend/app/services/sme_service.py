from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.sme import SME
from app.schemas.sme import SMECreate, SMEUpdate


def get_sme(db: Session, sme_id: int) -> SME:
    sme = db.query(SME).filter(SME.id == sme_id).first()
    if not sme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SME not found")
    return sme


def list_smes(db: Session, skip: int = 0, limit: int = 100, sector: str = None, active_only: bool = True):
    q = db.query(SME)
    if active_only:
        q = q.filter(SME.is_active == True)
    if sector:
        q = q.filter(SME.sector == sector)
    return q.offset(skip).limit(limit).all()


def create_sme(db: Session, data: SMECreate, user_id: int) -> SME:
    sme = SME(**data.model_dump(), created_by=user_id)
    db.add(sme)
    db.commit()
    db.refresh(sme)
    return sme


def update_sme(db: Session, sme_id: int, data: SMEUpdate) -> SME:
    sme = get_sme(db, sme_id)
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(sme, k, v)
    db.commit()
    db.refresh(sme)
    return sme


def delete_sme(db: Session, sme_id: int) -> None:
    sme = get_sme(db, sme_id)
    sme.is_active = False
    db.commit()


def get_sectors(db: Session) -> list[str]:
    rows = db.query(SME.sector).filter(SME.sector != None).distinct().all()
    return [r[0] for r in rows if r[0]]
