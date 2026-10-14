"""Order service — concurrency-safe operations."""
from __future__ import annotations
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.models.listing import Listing


def reserve_listing_quantity(db: Session, listing_id: int, qty: int, expected_version: int) -> bool:
    """
    Optimistic locking: atomically reserve `qty` units if stock available and version matches.
    Returns True on success, False on conflict/insufficient stock.
    """
    result = db.execute(
        text(
            """
            UPDATE listings
            SET reserved_quantity = reserved_quantity + :qty,
                version = version + 1
            WHERE id = :id
              AND version = :ver
              AND (quantity - reserved_quantity) >= :qty
            """
        ),
        {"qty": qty, "id": listing_id, "ver": expected_version},
    )
    db.flush()
    return result.rowcount == 1


def release_listing_reservation(db: Session, listing_id: int, qty: int) -> None:
    """Release a reservation (cancel/reject)."""
    db.execute(
        text(
            """
            UPDATE listings
            SET reserved_quantity = MAX(0, reserved_quantity - :qty)
            WHERE id = :id
            """
        ),
        {"qty": qty, "id": listing_id},
    )
    db.flush()


def complete_listing_order(db: Session, listing_id: int, qty: int) -> None:
    """Deduct sold quantity and release reservation."""
    db.execute(
        text(
            """
            UPDATE listings
            SET quantity = quantity - :qty,
                reserved_quantity = MAX(0, reserved_quantity - :qty)
            WHERE id = :id
            """
        ),
        {"qty": qty, "id": listing_id},
    )
    db.flush()
