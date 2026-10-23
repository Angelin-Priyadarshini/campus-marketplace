"""Orders router."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_user
from app.models.conversation import Conversation, Message
from app.models.listing import Listing, ListingImage
from app.models.notification import Notification
from app.models.order import Order, OrderEvent
from app.models.store import Store
from app.models.user import User
from app.schemas.order import (
    CancelOrderRequest,
    OrderCreateRequest,
    OrderResponse,
    RejectOrderRequest,
)
from app.services.orders import (
    complete_listing_order,
    release_listing_reservation,
    reserve_listing_quantity,
)
from app.ws.connection_manager import manager

router = APIRouter()


async def _post_order_system_message(db: Session, order: Order, text: str) -> None:
    conv = db.execute(
        select(Conversation).where(
            Conversation.listing_id == order.listing_id,
            Conversation.buyer_id == order.buyer_id,
            Conversation.seller_id == order.seller_id,
        )
    ).scalar_one_or_none()

    if conv:
        msg = Message(
            conversation_id=conv.id,
            sender_id=None,
            body=text,
            is_system=True,
        )
        conv.last_message_at = datetime.now(timezone.utc)
        db.add(msg)
        db.flush()

        payload_out = {
            "type": "message",
            "conversation_id": conv.id,
            "id": msg.id,
            "sender_id": None,
            "body": text,
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
        }
        await manager.send_to_user(order.buyer_id, payload_out)
        await manager.send_to_user(order.seller_id, payload_out)


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.get(Listing, payload.listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing.status != "active":
        raise HTTPException(status_code=400, detail="Cannot order a listing that is not active")

    store = db.get(Store, listing.store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    if store.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot buy your own listing")

    if payload.quantity < 1:
        raise HTTPException(status_code=400, detail="Quantity must be at least 1")

    available = listing.quantity - listing.reserved_quantity
    if payload.quantity > available:
        raise HTTPException(
            status_code=400,
            detail=f"Requested quantity ({payload.quantity}) exceeds available stock ({available})",
        )

    order = Order(
        listing_id=listing.id,
        buyer_id=current_user.id,
        seller_id=store.owner_id,
        quantity=payload.quantity,
        unit_price=listing.price,
        status="pending",
        payment_method=payload.payment_method if payload.payment_method in ("cod", "upi", "cash") else "cod",
        note=payload.note.strip() if payload.note else None,
        proposed_meetup=payload.proposed_meetup.strip() if payload.proposed_meetup else None,
    )
    db.add(order)
    db.flush()

    event = OrderEvent(
        order_id=order.id,
        actor_id=current_user.id,
        from_status=None,
        to_status="pending",
    )
    db.add(event)

    # Notify seller
    notif = Notification(
        user_id=store.owner_id,
        type="order_request",
        title="New Order Request",
        body=f"{current_user.full_name} requested {order.quantity}x of '{listing.title}'",
        link=f"/orders/{order.id}",
    )
    db.add(notif)

    # Ensure conversation exists and post system note
    conv = db.execute(
        select(Conversation).where(
            Conversation.listing_id == listing.id,
            Conversation.buyer_id == current_user.id,
            Conversation.seller_id == store.owner_id,
        )
    ).scalar_one_or_none()
    if not conv:
        conv = Conversation(
            listing_id=listing.id,
            buyer_id=current_user.id,
            seller_id=store.owner_id,
            last_message_at=datetime.now(timezone.utc),
        )
        db.add(conv)
        db.flush()

    await _post_order_system_message(
        db, order, f"Purchase request placed for {order.quantity} unit(s) at ₹{order.unit_price} each. Payment: {order.payment_method.upper()}."
    )

    db.commit()
    db.refresh(order)

    # Push real-time order_update event to seller so their dashboard refreshes instantly
    await manager.send_to_user(store.owner_id, {
        "type": "order_update",
        "order_id": order.id,
        "status": order.status,
        "listing_title": listing.title,
        "buyer_name": current_user.full_name,
        "quantity": order.quantity,
    })

    return order


@router.get("")
async def list_orders(
    role: Optional[str] = Query(None),  # 'buyer' or 'seller'
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = (
        select(Order)
        .options(
            selectinload(Order.listing).selectinload(Listing.images),
            selectinload(Order.buyer),
            selectinload(Order.seller),
            selectinload(Order.events),
        )
        .order_by(Order.created_at.desc())
    )

    if role == "buyer":
        query = query.where(Order.buyer_id == current_user.id)
    elif role == "seller":
        query = query.where(Order.seller_id == current_user.id)
    else:
        query = query.where(
            or_(Order.buyer_id == current_user.id, Order.seller_id == current_user.id)
        )

    if status_filter:
        query = query.where(Order.status == status_filter)

    orders = db.execute(query).scalars().all()

    results = []
    for o in orders:
        l = o.listing
        img = l.images[0].thumb_url or l.images[0].url if l and l.images else None
        results.append({
            "id": o.id,
            "listing_id": o.listing_id,
            "listing_title": l.title if l else "Listing",
            "listing_image": img,
            "quantity": o.quantity,
            "unit_price": o.unit_price,
            "total_price": o.unit_price * o.quantity,
            "status": o.status,
            "payment_method": o.payment_method,
            "note": o.note,
            "proposed_meetup": o.proposed_meetup,
            "reject_reason": o.reject_reason,
            "created_at": o.created_at,
            "updated_at": o.updated_at,
            "buyer": {"id": o.buyer.id, "full_name": o.buyer.full_name} if o.buyer else None,
            "seller": {"id": o.seller.id, "full_name": o.seller.full_name} if o.seller else None,
        })
    return results


@router.get("/{id}")
async def get_order_detail(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.execute(
        select(Order)
        .options(
            selectinload(Order.listing).selectinload(Listing.images),
            selectinload(Order.buyer),
            selectinload(Order.seller),
            selectinload(Order.events),
            selectinload(Order.reviews),
        )
        .where(Order.id == id)
    ).scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.id not in (order.buyer_id, order.seller_id) and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You do not have permission to view this order")

    l = order.listing
    img = l.images[0].thumb_url or l.images[0].url if l and l.images else None
    return {
        "id": order.id,
        "listing_id": order.listing_id,
        "listing_title": l.title if l else "Listing",
        "listing_image": img,
        "listing_price": l.price if l else None,
        "quantity": order.quantity,
        "unit_price": order.unit_price,
        "total_price": order.unit_price * order.quantity,
        "status": order.status,
        "payment_method": order.payment_method,
        "note": order.note,
        "proposed_meetup": order.proposed_meetup,
        "reject_reason": order.reject_reason,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "buyer": {
            "id": order.buyer.id,
            "full_name": order.buyer.full_name,
            "department": order.buyer.department,
        } if order.buyer else None,
        "seller": {
            "id": order.seller.id,
            "full_name": order.seller.full_name,
            "department": order.seller.department,
        } if order.seller else None,
        "events": [
            {
                "id": ev.id,
                "from_status": ev.from_status,
                "to_status": ev.to_status,
                "created_at": ev.created_at,
            }
            for ev in order.events
        ],
        "reviews": [
            {
                "id": r.id,
                "reviewer_id": r.reviewer_id,
                "direction": r.direction,
                "rating": r.rating,
                "comment": r.comment,
            }
            for r in order.reviews
        ],
    }


@router.post("/{id}/accept")
async def accept_order(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.get(Order, id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the seller can accept this order")

    if order.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot accept order in '{order.status}' state",
        )

    listing = db.get(Listing, order.listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Concurrency safe reservation with optimistic locking
    reserved = reserve_listing_quantity(db, listing.id, order.quantity, listing.version)
    if not reserved:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Could not reserve stock due to conflict or insufficient quantity",
        )

    # Refresh listing state
    db.refresh(listing)
    if (listing.quantity - listing.reserved_quantity) == 0:
        listing.status = "reserved"

    prev = order.status
    order.status = "accepted"
    db.add(OrderEvent(order_id=order.id, actor_id=current_user.id, from_status=prev, to_status="accepted"))

    # Notify buyer
    notif = Notification(
        user_id=order.buyer_id,
        type="order_accepted",
        title="Order Accepted!",
        body=f"Your request for '{listing.title}' was accepted. Arrange campus meetup!",
        link=f"/orders/{order.id}",
    )
    db.add(notif)

    await _post_order_system_message(
        db, order, "Order accepted by seller! Please meet in a public campus place."
    )

    db.commit()

    # Push real-time update to buyer so their orders page refreshes instantly
    await manager.send_to_user(order.buyer_id, {
        "type": "order_update",
        "order_id": order.id,
        "status": "accepted",
        "listing_title": listing.title,
    })
    return {"message": "Order accepted successfully"}


@router.post("/{id}/reject")
async def reject_order(
    id: int,
    payload: Optional[RejectOrderRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.get(Order, id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the seller can reject this order")

    if order.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot reject order in '{order.status}' state",
        )

    reason = payload.reason if payload else "Declined by seller"
    prev = order.status
    order.status = "rejected"
    order.reject_reason = reason

    db.add(OrderEvent(order_id=order.id, actor_id=current_user.id, from_status=prev, to_status="rejected"))

    notif = Notification(
        user_id=order.buyer_id,
        type="order_rejected",
        title="Order Declined",
        body=f"Your request was declined: {reason}",
        link=f"/orders/{order.id}",
    )
    db.add(notif)

    await _post_order_system_message(db, order, f"Order declined by seller: {reason}")

    db.commit()

    # Real-time push to buyer
    await manager.send_to_user(order.buyer_id, {
        "type": "order_update",
        "order_id": order.id,
        "status": "rejected",
    })
    return {"message": "Order rejected"}


@router.post("/{id}/complete")
async def complete_order(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.get(Order, id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the seller can mark this order completed")

    if order.status != "accepted":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot complete order in '{order.status}' state",
        )

    listing = db.get(Listing, order.listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Complete stock decrement and reservation release
    complete_listing_order(db, listing.id, order.quantity)
    db.refresh(listing)

    if listing.quantity == 0:
        listing.status = "sold"

    # Update seller store items sold
    store = db.get(Store, listing.store_id)
    if store:
        store.items_sold += order.quantity

    prev = order.status
    order.status = "completed"
    db.add(OrderEvent(order_id=order.id, actor_id=current_user.id, from_status=prev, to_status="completed"))

    # Notify buyer
    notif = Notification(
        user_id=order.buyer_id,
        type="order_completed",
        title="Order Completed",
        body=f"Handover confirmed for '{listing.title}'. Please leave a review!",
        link=f"/orders/{order.id}",
    )
    db.add(notif)

    await _post_order_system_message(
        db, order, "Order completed! Handover successful. Both parties may now leave reviews."
    )

    db.commit()

    # Real-time push to buyer
    await manager.send_to_user(order.buyer_id, {
        "type": "order_update",
        "order_id": order.id,
        "status": "completed",
        "listing_title": listing.title if listing else None,
    })
    return {"message": "Order completed successfully"}


@router.post("/{id}/cancel")
async def cancel_order(
    id: int,
    payload: Optional[CancelOrderRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.get(Order, id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.id not in (order.buyer_id, order.seller_id):
        raise HTTPException(status_code=403, detail="Only order participants can cancel this order")

    if order.status not in ("pending", "accepted"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot cancel order in '{order.status}' state",
        )

    listing = db.get(Listing, order.listing_id)
    if listing and order.status == "accepted":
        release_listing_reservation(db, listing.id, order.quantity)
        db.refresh(listing)
        if listing.status == "reserved" and (listing.quantity - listing.reserved_quantity) > 0:
            listing.status = "active"

    prev = order.status
    order.status = "cancelled"
    db.add(OrderEvent(order_id=order.id, actor_id=current_user.id, from_status=prev, to_status="cancelled"))

    # Notify other party
    other_party = order.seller_id if current_user.id == order.buyer_id else order.buyer_id
    notif = Notification(
        user_id=other_party,
        type="order_cancelled",
        title="Order Cancelled",
        body=f"Order for '{listing.title if listing else 'item'}' was cancelled.",
        link=f"/orders/{order.id}",
    )
    db.add(notif)

    await _post_order_system_message(
        db, order, f"Order was cancelled by {'buyer' if current_user.id == order.buyer_id else 'seller'}."
    )

    db.commit()

    # Real-time push to the other party
    await manager.send_to_user(other_party, {
        "type": "order_update",
        "order_id": order.id,
        "status": "cancelled",
        "listing_title": listing.title if listing else None,
    })
    return {"message": "Order cancelled successfully"}
