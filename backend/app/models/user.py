"""User model."""
from sqlalchemy import (
    Column, Integer, String, Boolean, SmallInteger,
    Numeric, Text, DateTime, CheckConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    department = Column(String(100))
    year_of_study = Column(SmallInteger, CheckConstraint("year_of_study BETWEEN 1 AND 6"))
    avatar_url = Column(Text)
    role = Column(String(10), nullable=False, default="student", server_default="student")
    is_verified = Column(Boolean, nullable=False, default=False, server_default="0")
    is_active = Column(Boolean, nullable=False, default=True, server_default="1")
    has_storefront = Column(Boolean, nullable=False, default=False, server_default="0")
    buyer_rating_avg = Column(Numeric(3, 2), nullable=False, default=0)
    buyer_rating_cnt = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (CheckConstraint("role IN ('student','admin')"),)

    # Relationships
    store = relationship("Store", back_populates="owner", uselist=False)
    wishlist_items = relationship("WishlistItem", back_populates="user", cascade="all, delete-orphan")
    orders_as_buyer = relationship("Order", foreign_keys="Order.buyer_id", back_populates="buyer")
    orders_as_seller = relationship("Order", foreign_keys="Order.seller_id", back_populates="seller")
    reviews_given = relationship("Review", foreign_keys="Review.reviewer_id", back_populates="reviewer")
    reviews_received = relationship("Review", foreign_keys="Review.reviewee_id", back_populates="reviewee")
    reports_filed = relationship("Report", foreign_keys="Report.reporter_id", back_populates="reporter")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    auth_tokens = relationship("AuthToken", back_populates="user", cascade="all, delete-orphan")
    blocks_made = relationship("UserBlock", foreign_keys="UserBlock.blocker_id", back_populates="blocker", cascade="all, delete-orphan")
    blocks_received = relationship("UserBlock", foreign_keys="UserBlock.blocked_id", back_populates="blocked", cascade="all, delete-orphan")
    conversations_as_buyer = relationship("Conversation", foreign_keys="Conversation.buyer_id", back_populates="buyer")
    conversations_as_seller = relationship("Conversation", foreign_keys="Conversation.seller_id", back_populates="seller")
