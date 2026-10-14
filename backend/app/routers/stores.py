"""Stores router."""
from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_user, require_seller
from app.models.listing import Listing
from app.models.order import Order
from app.models.review import Review
from app.models.store import Store
from app.models.user import User
from app.schemas.listing import ListingResponse
from app.schemas.review import ReviewResponse
from app.schemas.store import StoreCreateRequest, StoreResponse, StoreUpdateRequest

router = APIRouter()


@router.post("", response_model=StoreResponse, status_code=status.HTTP_201_CREATED)
async def create_store(
    payload: StoreCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.has_storefront or current_user.store:
        raise HTTPException(status_code=400, detail="You already have an active storefront")

    clean_name = payload.name.strip()
    existing = db.execute(
        select(Store).where(func.lower(Store.name) == clean_name.lower())
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="A store with this name already exists")

    store = Store(
        owner_id=current_user.id,
        name=clean_name,
        bio=payload.bio.strip() if payload.bio else None,
        pickup_location_hint=payload.pickup_location_hint.strip() if payload.pickup_location_hint else None,
    )
    current_user.has_storefront = True
    db.add(store)
    db.commit()
    db.refresh(store)
    return store


@router.get("/me", response_model=StoreResponse)
async def get_my_store(
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
):
    store = db.execute(select(Store).where(Store.owner_id == current_user.id)).scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=404, detail="Storefront not found")
    return store


@router.patch("/me", response_model=StoreResponse)
async def update_my_store(
    payload: StoreUpdateRequest,
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db),
):
    store = db.execute(select(Store).where(Store.owner_id == current_user.id)).scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=404, detail="Storefront not found")

    if payload.name is not None:
        clean_name = payload.name.strip()
        existing = db.execute(
            select(Store).where(func.lower(Store.name) == clean_name.lower(), Store.id != store.id)
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=409, detail="A store with this name already exists")
        store.name = clean_name

    if payload.bio is not None:
        store.bio = payload.bio.strip() or None

    if payload.pickup_location_hint is not None:
        store.pickup_location_hint = payload.pickup_location_hint.strip() or None

    db.commit()
    db.refresh(store)
    return store


@router.get("/{id}")
async def get_store_public(
    id: int,
    db: Session = Depends(get_db),
):
    store = db.execute(
        select(Store)
        .options(selectinload(Store.owner))
        .where(Store.id == id, Store.is_active == True)
    ).scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=404, detail="Storefront not found")

    # Fetch active listings
    listings = db.execute(
        select(Listing)
        .options(selectinload(Listing.images))
        .where(Listing.store_id == store.id, Listing.status == "active")
        .order_by(Listing.created_at.desc())
    ).scalars().all()

    return {
        "store": StoreResponse.model_validate(store),
        "owner": {
            "id": store.owner.id,
            "full_name": store.owner.full_name,
            "department": store.owner.department,
            "avatar_url": store.owner.avatar_url,
        },
        "listings": [ListingResponse.model_validate(l) for l in listings],
    }


@router.get("/{id}/reviews")
async def get_store_reviews(
    id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    store = db.get(Store, id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    query = (
        select(Review)
        .join(Order, Review.order_id == Order.id)
        .where(
            Order.seller_id == store.owner_id,
            Review.direction == "buyer_to_seller",
        )
        .order_by(Review.created_at.desc())
    )

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    reviews = db.execute(query.offset((page - 1) * page_size).limit(page_size)).scalars().all()

    items = []
    for r in reviews:
        reviewer = db.get(User, r.reviewer_id)
        order = db.get(Order, r.order_id)
        listing = db.get(Listing, order.listing_id) if order else None
        items.append({
            "id": r.id,
            "order_id": r.order_id,
            "rating": r.rating,
            "comment": r.comment,
            "seller_reply": r.seller_reply,
            "created_at": r.created_at,
            "reviewer_name": reviewer.full_name if reviewer else "Student",
            "reviewer_dept": reviewer.department if reviewer else None,
            "listing_title": listing.title if listing else None,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if total > 0 else 1,
    }
