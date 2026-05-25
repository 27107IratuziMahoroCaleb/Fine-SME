from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel
from app.models.alert import AlertSeverity, AlertStatus


class AlertOut(BaseModel):
    id: int
    sme_id: int
    sme_name: Optional[str] = None
    alert_type: str
    title: str
    description: Optional[str]
    severity: AlertSeverity
    status: AlertStatus
    trigger_value: Optional[Decimal]
    threshold_value: Optional[Decimal]
    recommended_action: Optional[str]
    acknowledged_at: Optional[datetime]
    resolved_at: Optional[datetime]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class AlertAcknowledge(BaseModel):
    notes: Optional[str] = None


class AlertResolve(BaseModel):
    notes: Optional[str] = None
