"""Rating recomputation helpers."""
from decimal import Decimal
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.review import Review
from app.models.store import Store
from app.models.user import User
from app.models.order import Order


def recompute_store_rating(db: Session, store_id: int) -> None:
    """Recompute and persist store.rating_avg and store.rating_count."""
    result = (
        db.execute(
            select(func.avg(Review.rating), func.count(Review.id))
            .join(Order, Review.order_id == Order.id)
            .join(Store, Order.seller_id == Store.owner_id)
            .where(Store.id == store_id)
            .where(Review.direction == "buyer_to_seller")
        )
        .one()
    )
    avg_rating, count = result
    store = db.get(Store, store_id)
    if store:
        store.rating_avg = Decimal(str(avg_rating)).quantize(Decimal("0.01")) if avg_rating else Decimal("0.00")
        store.rating_count = count or 0
        db.flush()


def recompute_buyer_rating(db: Session, user_id: int) -> None:
    """Recompute and persist user.buyer_rating_avg and user.buyer_rating_cnt."""
    result = (
        db.execute(
            select(func.avg(Review.rating), func.count(Review.id))
            .where(Review.reviewee_id == user_id)
            .where(Review.direction == "seller_to_buyer")
        )
        .one()
    )
    avg_rating, count = result
    user = db.get(User, user_id)
    if user:
        user.buyer_rating_avg = Decimal(str(avg_rating)).quantize(Decimal("0.01")) if avg_rating else Decimal("0.00")
        user.buyer_rating_cnt = count or 0
        db.flush()
