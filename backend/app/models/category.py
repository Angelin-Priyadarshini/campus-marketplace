"""Category model."""
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(60), nullable=False, unique=True)
    slug = Column(String(60), nullable=False, unique=True)
    icon = Column(String(30))
    sort_order = Column(Integer, nullable=False, default=0, server_default="0")

    # Relationships
    listings = relationship("Listing", back_populates="category")
