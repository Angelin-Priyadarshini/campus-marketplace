"""Reviews router."""
from __future__ import annotations
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.listing import Listing
from app.models.order import Order
from app.models.review import Review
from app.models.store import Store
from app.models.user import User
from app.schemas.review import (
    ReviewCreateRequest,
    ReviewReplyRequest,
    ReviewResponse,
    ReviewUpdateRequest,
)
from app.services.ratings import recompute_buyer_rating, recompute_store_rating

router = APIRouter()


@router.post("/orders/{order_id}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review_for_order(
    order_id: int,
    payload: ReviewCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status != "completed":
        raise HTTPException(
            status_code=400,
            detail="Reviews can only be submitted for completed orders",
        )

    if current_user.id == order.buyer_id:
        direction = "buyer_to_seller"
        reviewee_id = order.seller_id
    elif current_user.id == order.seller_id:
        direction = "seller_to_buyer"
        reviewee_id = order.buyer_id
    else:
        raise HTTPException(status_code=403, detail="Only order participants can submit reviews")

    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    # Check uniqueness
    existing = db.execute(
        select(Review).where(Review.order_id == order_id, Review.direction == direction)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already submitted a review for this order",
        )

    review = Review(
        order_id=order_id,
        reviewer_id=current_user.id,
        reviewee_id=reviewee_id,
        direction=direction,
        rating=payload.rating,
        comment=payload.comment.strip() if payload.comment else None,
    )
    db.add(review)
    db.flush()

    # Recompute ratings in the same transaction
    if direction == "buyer_to_seller":
        store = db.execute(select(Store).where(Store.owner_id == reviewee_id)).scalar_one_or_none()
        if store:
            recompute_store_rating(db, store.id)
    else:
        recompute_buyer_rating(db, reviewee_id)

    db.commit()
    db.refresh(review)
    return review


@router.patch("/reviews/{id}", response_model=ReviewResponse)
async def update_review(
    id: int,
    payload: ReviewUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = db.get(Review, id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.reviewer_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own reviews")

    # 7-day limit
    now = datetime.now(timezone.utc)
    created_time = review.created_at
    if created_time.tzinfo is None:
        created_time = created_time.replace(tzinfo=timezone.utc)
    if now - created_time > timedelta(days=7):
        raise HTTPException(status_code=400, detail="Reviews can only be edited within 7 days")

    if payload.rating is not None:
        if payload.rating < 1 or payload.rating > 5:
            raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        review.rating = payload.rating

    if payload.comment is not None:
        review.comment = payload.comment.strip() or None

    db.flush()

    if review.direction == "buyer_to_seller":
        store = db.execute(select(Store).where(Store.owner_id == review.reviewee_id)).scalar_one_or_none()
        if store:
            recompute_store_rating(db, store.id)
    else:
        recompute_buyer_rating(db, review.reviewee_id)

    db.commit()
    db.refresh(review)
    return review


@router.delete("/reviews/{id}")
async def delete_review(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = db.get(Review, id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.reviewer_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own reviews")

    now = datetime.now(timezone.utc)
    created_time = review.created_at
    if created_time.tzinfo is None:
        created_time = created_time.replace(tzinfo=timezone.utc)
    if now - created_time > timedelta(days=7):
        raise HTTPException(status_code=400, detail="Reviews can only be deleted within 7 days")

    reviewee_id = review.reviewee_id
    direction = review.direction

    db.delete(review)
    db.flush()

    if direction == "buyer_to_seller":
        store = db.execute(select(Store).where(Store.owner_id == reviewee_id)).scalar_one_or_none()
        if store:
            recompute_store_rating(db, store.id)
    else:
        recompute_buyer_rating(db, reviewee_id)

    db.commit()
    return {"message": "Review deleted successfully"}


@router.post("/reviews/{id}/reply")
async def reply_to_review(
    id: int,
    payload: ReviewReplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = db.get(Review, id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.reviewee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the reviewed seller can reply")

    reply_clean = payload.reply.strip()
    if not reply_clean:
        raise HTTPException(status_code=400, detail="Reply cannot be empty")
    if len(reply_clean) > 500:
        reply_clean = reply_clean[:500]

    review.seller_reply = reply_clean
    db.commit()
    return {"message": "Reply posted successfully"}
