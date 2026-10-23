"""Wanted requests router."""
from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_user, get_current_user_optional
from app.models.wanted import WantedRequest
from app.models.user import User

router = APIRouter()


class WantedCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    category_hint: Optional[str] = None
    budget_max: Optional[int] = None


class WantedResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    category_hint: Optional[str] = None
    budget_max: Optional[int] = None
    is_open: bool
    created_at: str
    requester_id: int
    requester_name: str
    requester_dept: Optional[str] = None
    is_mine: bool = False

    model_config = {"from_attributes": True}


@router.get("", response_model=list[WantedResponse])
async def list_wanted(
    q: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    query = (
        select(WantedRequest)
        .where(WantedRequest.is_open == True)
        .order_by(WantedRequest.created_at.desc())
    )
    if q:
        term = f"%{q.strip()}%"
        query = query.where(WantedRequest.title.ilike(term))

    items = db.execute(query.offset((page - 1) * page_size).limit(page_size)).scalars().all()

    result = []
    for item in items:
        requester = db.get(User, item.requester_id)
        result.append({
            "id": item.id,
            "title": item.title,
            "description": item.description,
            "category_hint": item.category_hint,
            "budget_max": item.budget_max,
            "is_open": item.is_open,
            "created_at": item.created_at.isoformat() if item.created_at else "",
            "requester_id": item.requester_id,
            "requester_name": requester.full_name if requester else "Student",
            "requester_dept": requester.department if requester else None,
            "is_mine": current_user.id == item.requester_id if current_user else False,
        })
    return result


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_wanted(
    payload: WantedCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    title = payload.title.strip()
    if not title or len(title) > 120:
        raise HTTPException(status_code=422, detail="Title must be 1-120 characters")

    req = WantedRequest(
        requester_id=current_user.id,
        title=title,
        description=payload.description.strip() if payload.description else None,
        category_hint=payload.category_hint.strip() if payload.category_hint else None,
        budget_max=payload.budget_max,
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    return {
        "id": req.id,
        "title": req.title,
        "description": req.description,
        "category_hint": req.category_hint,
        "budget_max": req.budget_max,
        "is_open": req.is_open,
        "created_at": req.created_at.isoformat() if req.created_at else "",
        "requester_id": req.requester_id,
        "requester_name": current_user.full_name,
        "requester_dept": current_user.department,
        "is_mine": True,
    }


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_wanted(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    req = db.get(WantedRequest, id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.requester_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")
    req.is_open = False
    db.commit()


@router.patch("/{id}/close", status_code=200)
async def close_wanted(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    req = db.get(WantedRequest, id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.requester_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    req.is_open = False
    db.commit()
    return {"message": "Request closed"}
