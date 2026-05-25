from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.sql import func
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(100), index=True)
    resource_id = Column(Integer, nullable=True)
    description = Column(Text)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    extra = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
