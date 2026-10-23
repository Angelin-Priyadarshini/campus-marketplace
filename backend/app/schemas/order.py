"""Order schemas."""
from __future__ import annotations
from decimal import Decimal
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class OrderCreateRequest(BaseModel):
    listing_id: int
    quantity: int = 1
    payment_method: str = "cod"  # cod | upi | cash
    note: Optional[str] = None
    proposed_meetup: Optional[str] = None


class OrderEventResponse(BaseModel):
    id: int
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    actor_id: Optional[int] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: int
    listing_id: int
    buyer_id: int
    seller_id: int
    quantity: int
    unit_price: Decimal
    status: str
    payment_method: str = "cod"
    note: Optional[str] = None
    proposed_meetup: Optional[str] = None
    reject_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    events: List[OrderEventResponse] = []

    model_config = {"from_attributes": True}


class RejectOrderRequest(BaseModel):
    reason: str


class CancelOrderRequest(BaseModel):
    reason: Optional[str] = None
