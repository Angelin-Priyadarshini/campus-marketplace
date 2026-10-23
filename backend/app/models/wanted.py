"""WantedRequest model — students post items they're looking for."""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class WantedRequest(Base):
    __tablename__ = "wanted_requests"

    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(120), nullable=False)
    description = Column(String(500), nullable=True)
    category_hint = Column(String(80), nullable=True)   # free-text hint e.g. "Laptops"
    budget_max = Column(Integer, nullable=True)          # max budget in INR, optional
    is_open = Column(Boolean, nullable=False, default=True, server_default="1")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    requester = relationship("User", foreign_keys=[requester_id])
