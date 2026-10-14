"""Wishlist router."""
from __future__ import annotations
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_user
from app.models.listing import Listing, WishlistItem
from app.models.store import Store
from app.models.user import User
from app.schemas.listing import ListingResponse

router = APIRouter()


@router.get("")
async def get_my_wishlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = db.execute(
        select(WishlistItem)
        .options(
            selectinload(WishlistItem.listing).selectinload(Listing.images),
            selectinload(WishlistItem.listing).selectinload(Listing.store),
        )
        .where(WishlistItem.user_id == current_user.id)
        .order_by(WishlistItem.created_at.desc())
    ).scalars().all()

    results = []
    for w in items:
        if not w.listing:
            continue
        l = w.listing
        price_dropped = l.price < w.price_at_save if w.price_at_save is not None else False
        results.append({
            "listing": ListingResponse.model_validate(l),
            "price_at_save": w.price_at_save,
            "current_price": l.price,
            "price_dropped": price_dropped,
            "created_at": w.created_at,
        })
    return results


@router.post("/{listing_id}", status_code=status.HTTP_200_OK)
async def add_to_wishlist(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    store = db.get(Store, listing.store_id)
    if store and store.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot wishlist your own listing")

    existing = db.get(WishlistItem, (current_user.id, listing_id))
    if not existing:
        item = WishlistItem(
            user_id=current_user.id,
            listing_id=listing_id,
            price_at_save=listing.price,
        )
        db.add(item)
        db.commit()

    return {"message": "Listing added to wishlist"}


@router.delete("/{listing_id}")
async def remove_from_wishlist(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.get(WishlistItem, (current_user.id, listing_id))
    if item:
        db.delete(item)
        db.commit()
    return {"message": "Listing removed from wishlist"}
