"""Listing, ListingImage, and WishlistItem models."""
from sqlalchemy import (
    Column, Integer, String, SmallInteger, Numeric, Text,
    DateTime, ForeignKey, CheckConstraint, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    title = Column(String(120), nullable=False)
    description = Column(Text, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    condition = Column(String(10), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    reserved_quantity = Column(Integer, nullable=False, default=0, server_default="0")
    status = Column(String(10), nullable=False, default="active", server_default="active")
    view_count = Column(Integer, nullable=False, default=0, server_default="0")
    version = Column(Integer, nullable=False, default=1, server_default="1")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("price >= 0", name="listing_price_non_negative"),
        CheckConstraint("quantity >= 0", name="listing_qty_non_negative"),
        CheckConstraint("reserved_quantity >= 0", name="listing_reserved_non_negative"),
        CheckConstraint(
            "condition IN ('new','like_new','good','fair','poor')",
            name="listing_condition_check"
        ),
        CheckConstraint(
            "status IN ('active','reserved','sold','hidden','deleted','expired')",
            name="listing_status_check"
        ),
    )

    # Relationships
    store = relationship("Store", back_populates="listings")
    category = relationship("Category", back_populates="listings")
    images = relationship(
        "ListingImage", back_populates="listing",
        cascade="all, delete-orphan", order_by="ListingImage.position"
    )
    wishlist_items = relationship("WishlistItem", back_populates="listing", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="listing")
    conversations = relationship("Conversation", back_populates="listing", cascade="all, delete-orphan")


class ListingImage(Base):
    __tablename__ = "listing_images"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    url = Column(Text, nullable=False)
    thumb_url = Column(Text)
    public_id = Column(String(255))
    position = Column(SmallInteger, nullable=False, default=0, server_default="0")

    listing = relationship("Listing", back_populates="images")


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True)
    price_at_save = Column(Numeric(10, 2))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="wishlist_items")
    listing = relationship("Listing", back_populates="wishlist_items")
