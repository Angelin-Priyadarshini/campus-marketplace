"""Categories router."""
from __future__ import annotations
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryResponse

router = APIRouter()


@router.get("", response_model=List[CategoryResponse])
async def list_categories(db: Session = Depends(get_db)):
    categories = db.execute(select(Category).order_by(Category.sort_order.asc(), Category.name.asc())).scalars().all()
    return categories
