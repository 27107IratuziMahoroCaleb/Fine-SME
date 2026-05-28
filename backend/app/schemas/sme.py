from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.sme import SMESize


class SMECreate(BaseModel):
    name: str
    registration_number: Optional[str] = None
    sector: Optional[str] = None
    sub_sector: Optional[str] = None
    size: SMESize = SMESize.SMALL
    location_province: Optional[str] = None
    location_district: Optional[str] = None
    owner_name: Optional[str] = None
    owner_phone: Optional[str] = None
    owner_email: Optional[str] = None
    established_date: Optional[date] = None
    employee_count: int = 0
    description: Optional[str] = None
    assigned_advisor_id: Optional[int] = None


class SMEUpdate(BaseModel):
    name: Optional[str] = None
    sector: Optional[str] = None
    sub_sector: Optional[str] = None
    size: Optional[SMESize] = None
    location_province: Optional[str] = None
    location_district: Optional[str] = None
    owner_name: Optional[str] = None
    owner_phone: Optional[str] = None
    owner_email: Optional[str] = None
    employee_count: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    assigned_advisor_id: Optional[int] = None


class SMEOut(BaseModel):
    id: int
    name: str
    registration_number: Optional[str]
    sector: Optional[str]
    sub_sector: Optional[str]
    size: SMESize
    location_province: Optional[str]
    location_district: Optional[str]
    owner_name: Optional[str]
    owner_phone: Optional[str]
    owner_email: Optional[str]
    established_date: Optional[date]
    employee_count: int
    description: Optional[str]
    is_active: bool
    created_at: Optional[datetime]
    assigned_advisor_id: Optional[int]
    assigned_advisor_name: Optional[str] = None

    model_config = {"from_attributes": True}
