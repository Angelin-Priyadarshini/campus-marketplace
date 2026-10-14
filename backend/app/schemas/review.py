"""Review schemas."""
from __future__ import annotations
from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class ReviewCreateRequest(BaseModel):
    rating: int
    comment: Optional[str] = None


class ReviewUpdateRequest(BaseModel):
    rating: Optional[int] = None
    comment: Optional[str] = None


class ReviewReplyRequest(BaseModel):
    reply: str


class ReviewResponse(BaseModel):
    id: int
    order_id: int
    reviewer_id: int
    reviewee_id: int
    direction: str
    rating: int
    comment: Optional[str] = None
    seller_reply: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
