"""Category schemas."""
from pydantic import BaseModel
from typing import Optional


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    icon: Optional[str] = None
    sort_order: int

    model_config = {"from_attributes": True}


class CategoryCreateRequest(BaseModel):
    name: str
    slug: str
    icon: Optional[str] = None
    sort_order: int = 0


class CategoryUpdateRequest(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    icon: Optional[str] = None
    sort_order: Optional[int] = None
