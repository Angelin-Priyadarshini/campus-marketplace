"""Report schemas."""
from __future__ import annotations
from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class ReportCreateRequest(BaseModel):
    target_type: str
    target_id: int
    reason: str
    details: Optional[str] = None


class ReportResolveRequest(BaseModel):
    action: str  # hide_listing, restore_listing, suspend_user, unsuspend_user, dismiss
    note: Optional[str] = None


class ReportResponse(BaseModel):
    id: int
    reporter_id: int
    target_type: str
    target_id: int
    reason: str
    details: Optional[str] = None
    status: str
    resolution_note: Optional[str] = None
    created_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
