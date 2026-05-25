from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import require_roles
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User, UserRole
from app.schemas.recommendation import RecommendationOut, RecommendationUpdate
from app.services import recommendation_service

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/", response_model=list[RecommendationOut])
def list_recommendations(
    sme_id: int = Query(None),
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    recs = recommendation_service.list_recommendations(db, sme_id, skip, limit)
    result = []
    for r in recs:
        d = RecommendationOut.model_validate(r)
        if r.sme:
            d.sme_name = r.sme.name
        result.append(d)
    return result


@router.patch("/{rec_id}", response_model=RecommendationOut)
def update_recommendation(
    rec_id: int, data: RecommendationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.LENDER, UserRole.SME_ADVISOR)),
):
    from app.models.recommendation import Recommendation
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if rec:
        for k, v in data.model_dump(exclude_none=True).items():
            setattr(rec, k, v)
        db.commit()
        db.refresh(rec)
    return rec
