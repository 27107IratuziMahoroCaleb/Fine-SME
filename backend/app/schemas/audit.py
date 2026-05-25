from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    resource_type: Optional[str]
    resource_id: Optional[int]
    description: Optional[str]
    ip_address: Optional[str]
    extra: Optional[Dict[str, Any]]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}
