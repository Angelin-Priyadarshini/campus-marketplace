"""Listing schemas."""
from __future__ import annotations
from decimal import Decimal
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, field_validator


class ListingImageResponse(BaseModel):
    id: int
    url: str
    thumb_url: Optional[str] = None
    position: int

    model_config = {"from_attributes": True}


class StoreSummary(BaseModel):
    id: int
    name: str
    rating_avg: Decimal
    rating_count: int

    model_config = {"from_attributes": True}


class CategorySummary(BaseModel):
    id: int
    name: str
    slug: str

    model_config = {"from_attributes": True}


class ListingCreateRequest(BaseModel):
    title: str
    description: str
    price: Decimal
    condition: str
    quantity: int = 1
    category_id: Optional[int] = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title is required")
        if len(v) > 120:
            raise ValueError("Title must be 120 characters or fewer")
        return v

    @field_validator("price")
    @classmethod
    def validate_price(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("Price must be non-negative")
        return v

    @field_validator("condition")
    @classmethod
    def validate_condition(cls, v: str) -> str:
        allowed = {"new", "like_new", "good", "fair", "poor"}
        if v not in allowed:
            raise ValueError(f"Condition must be one of {allowed}")
        return v

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Quantity must be non-negative")
        return v


class ListingUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    condition: Optional[str] = None
    quantity: Optional[int] = None
    category_id: Optional[int] = None
    status: Optional[str] = None

    @field_validator("condition")
    @classmethod
    def validate_condition(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            allowed = {"new", "like_new", "good", "fair", "poor"}
            if v not in allowed:
                raise ValueError(f"Condition must be one of {allowed}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            allowed = {"active", "hidden", "deleted", "expired"}
            if v not in allowed:
                raise ValueError(f"Status must be one of {allowed}")
        return v


class ListingResponse(BaseModel):
    id: int
    store_id: int
    category_id: Optional[int] = None
    title: str
    description: str
    price: Decimal
    condition: str
    quantity: int
    reserved_quantity: int
    status: str
    view_count: int
    images: List[ListingImageResponse] = []
    store: Optional[StoreSummary] = None
    category: Optional[CategorySummary] = None
    is_wishlisted: bool = False
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ListingDetailResponse(ListingResponse):
    pass


class PaginatedListings(BaseModel):
    items: List[ListingResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ImagePositionItem(BaseModel):
    id: int
    position: int
