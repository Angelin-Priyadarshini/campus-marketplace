"""Conversation, Message, and UserBlock models."""
from sqlalchemy import (
    Column, Integer, String, Boolean, Text,
    DateTime, ForeignKey, CheckConstraint, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    last_message_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("listing_id", "buyer_id", "seller_id", name="uq_conversation"),
        CheckConstraint("buyer_id != seller_id", name="conv_buyer_seller_diff"),
    )

    listing = relationship("Listing", back_populates="conversations")
    buyer = relationship("User", foreign_keys=[buyer_id], back_populates="conversations_as_buyer")
    seller = relationship("User", foreign_keys=[seller_id], back_populates="conversations_as_seller")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    body = Column(String(1000), nullable=False)
    is_system = Column(Boolean, nullable=False, default=False, server_default="0")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_messages_conv_created", "conversation_id", "created_at"),
    )

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])


class UserBlock(Base):
    __tablename__ = "user_blocks"

    blocker_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    blocked_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    blocker = relationship("User", foreign_keys=[blocker_id], back_populates="blocks_made")
    blocked = relationship("User", foreign_keys=[blocked_id], back_populates="blocks_received")
