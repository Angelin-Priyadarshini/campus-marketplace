"""Store model."""
from sqlalchemy import (
    Column, Integer, String, Boolean, Numeric, Text, DateTime,
    ForeignKey, CheckConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    name = Column(String(40), nullable=False, unique=True)
    bio = Column(String(500))
    logo_url = Column(Text)
    pickup_location_hint = Column(String(120))
    is_active = Column(Boolean, nullable=False, default=True, server_default="1")
    rating_avg = Column(Numeric(3, 2), nullable=False, default=0, server_default="0")
    rating_count = Column(Integer, nullable=False, default=0, server_default="0")
    items_sold = Column(Integer, nullable=False, default=0, server_default="0")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    owner = relationship("User", back_populates="store")
    listings = relationship("Listing", back_populates="store", cascade="all, delete-orphan")
