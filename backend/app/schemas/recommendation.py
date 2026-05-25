from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.recommendation import RecommendationCategory, RecommendationStatus


class RecommendationOut(BaseModel):
    id: int
    sme_id: int
    sme_name: Optional[str] = None
    category: RecommendationCategory
    priority: int
    title: str
    description: str
    action_steps: Optional[str]
    expected_impact: Optional[str]
    status: RecommendationStatus
    feedback: Optional[str]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class RecommendationUpdate(BaseModel):
    status: Optional[RecommendationStatus] = None
    feedback: Optional[str] = None
