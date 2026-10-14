"""Conversation and Message schemas."""
from __future__ import annotations
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: Optional[int] = None
    body: str
    is_system: bool
    created_at: Optional[datetime] = None
    read_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    id: int
    listing_id: int
    buyer_id: int
    seller_id: int
    last_message_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    last_message: Optional[str] = None
    unread_count: int = 0

    model_config = {"from_attributes": True}


class ConversationCreateRequest(BaseModel):
    listing_id: int


class MessageCreateRequest(BaseModel):
    body: str
