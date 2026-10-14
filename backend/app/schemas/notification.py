"""Notification schemas."""
from __future__ import annotations
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    body: Optional[str] = None
    link: Optional[str] = None
    is_read: bool
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class MarkReadRequest(BaseModel):
    ids: Optional[List[int]] = None  # None = mark all
