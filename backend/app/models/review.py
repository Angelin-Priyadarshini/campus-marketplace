"""Review model."""
from sqlalchemy import (
    Column, Integer, SmallInteger, String,
    DateTime, ForeignKey, CheckConstraint, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reviewee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    direction = Column(String(15), nullable=False)
    rating = Column(SmallInteger, nullable=False)
    comment = Column(String(500))
    seller_reply = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("order_id", "direction", name="uq_review_order_direction"),
        CheckConstraint(
            "direction IN ('buyer_to_seller','seller_to_buyer')",
            name="review_direction_check"
        ),
        CheckConstraint("rating BETWEEN 1 AND 5", name="review_rating_check"),
    )

    order = relationship("Order", back_populates="reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="reviews_given")
    reviewee = relationship("User", foreign_keys=[reviewee_id], back_populates="reviews_received")
