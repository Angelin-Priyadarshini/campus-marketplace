"""User schemas."""
from __future__ import annotations
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel


class UserMeResponse(BaseModel):
    id: int
    email: str
    full_name: str
    department: Optional[str] = None
    year_of_study: Optional[int] = None
    avatar_url: Optional[str] = None
    role: str
    is_verified: bool
    is_active: bool
    has_storefront: bool
    buyer_rating_avg: Decimal
    buyer_rating_cnt: int

    model_config = {"from_attributes": True}


class UserPublicResponse(BaseModel):
    id: int
    full_name: str
    department: Optional[str] = None
    avatar_url: Optional[str] = None
    buyer_rating_avg: Decimal
    buyer_rating_cnt: int

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    year_of_study: Optional[int] = None
