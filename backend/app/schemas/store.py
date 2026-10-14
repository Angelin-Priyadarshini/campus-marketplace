"""Store schemas."""
from __future__ import annotations
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, field_validator


class StoreCreateRequest(BaseModel):
    name: str
    bio: Optional[str] = None
    pickup_location_hint: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3 or len(v) > 40:
            raise ValueError("Store name must be 3–40 characters")
        return v


class StoreUpdateRequest(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    pickup_location_hint: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) < 3 or len(v) > 40:
                raise ValueError("Store name must be 3–40 characters")
        return v


class StoreResponse(BaseModel):
    id: int
    owner_id: int
    name: str
    bio: Optional[str] = None
    logo_url: Optional[str] = None
    pickup_location_hint: Optional[str] = None
    is_active: bool
    rating_avg: Decimal
    rating_count: int
    items_sold: int

    model_config = {"from_attributes": True}
