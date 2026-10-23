"""Conversations router."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_user
from app.models.conversation import Conversation, Message, UserBlock
from app.models.listing import Listing
from app.models.store import Store
from app.models.user import User
from app.models.wanted import WantedRequest
from app.schemas.conversation import (
    ConversationCreateRequest,
    ConversationResponse,
    MessageCreateRequest,
    MessageResponse,
)
from app.ws.connection_manager import manager

router = APIRouter()


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_or_get_conversation(
    payload: ConversationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.get(Listing, payload.listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    store = db.get(Store, listing.store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    seller_id = store.owner_id
    if seller_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot start a conversation with yourself")

    # Check blocks
    blocked = db.execute(
        select(UserBlock).where(
            or_(
                (UserBlock.blocker_id == current_user.id) & (UserBlock.blocked_id == seller_id),
                (UserBlock.blocker_id == seller_id) & (UserBlock.blocked_id == current_user.id),
            )
        )
    ).scalar_one_or_none()
    if blocked:
        raise HTTPException(status_code=403, detail="Unable to message this user")

    conv = db.execute(
        select(Conversation).where(
            Conversation.listing_id == listing.id,
            Conversation.buyer_id == current_user.id,
            Conversation.seller_id == seller_id,
        )
    ).scalar_one_or_none()

    if not conv:
        conv = Conversation(
            listing_id=listing.id,
            buyer_id=current_user.id,
            seller_id=seller_id,
            last_message_at=datetime.now(timezone.utc),
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    return conv


@router.get("", response_model=List[dict])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    convs = db.execute(
        select(Conversation)
        .options(
            selectinload(Conversation.listing).selectinload(Listing.images),
            selectinload(Conversation.buyer),
            selectinload(Conversation.seller),
        )
        .where(
            or_(
                Conversation.buyer_id == current_user.id,
                Conversation.seller_id == current_user.id,
            )
        )
        .order_by(Conversation.last_message_at.desc())
    ).scalars().all()

    results = []
    for c in convs:
        last_msg = db.execute(
            select(Message)
            .where(Message.conversation_id == c.id)
            .order_by(Message.created_at.desc())
            .limit(1)
        ).scalar_one_or_none()

        unread_cnt = db.scalar(
            select(func.count(Message.id)).where(
                Message.conversation_id == c.id,
                Message.sender_id != current_user.id,
                Message.read_at.is_(None),
            )
        ) or 0

        counterpart = c.seller if c.buyer_id == current_user.id else c.buyer
        first_img = c.listing.images[0].thumb_url or c.listing.images[0].url if c.listing and c.listing.images else None

        results.append({
            "id": c.id,
            "listing_id": c.listing_id,
            "listing_title": c.listing.title if c.listing else "Listing",
            "listing_price": c.listing.price if c.listing else None,
            "listing_image": first_img,
            "listing_status": c.listing.status if c.listing else "active",
            "buyer_id": c.buyer_id,
            "seller_id": c.seller_id,
            "counterpart": {
                "id": counterpart.id if counterpart else None,
                "full_name": counterpart.full_name if counterpart else "Student",
                "avatar_url": counterpart.avatar_url if counterpart else None,
            },
            "last_message": last_msg.body if last_msg else None,
            "last_message_at": c.last_message_at,
            "unread_count": unread_cnt,
        })

    return results


@router.get("/unread-count")
async def get_total_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total = db.scalar(
        select(func.count(Message.id))
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(
            or_(
                Conversation.buyer_id == current_user.id,
                Conversation.seller_id == current_user.id,
            ),
            Message.sender_id != current_user.id,
            Message.read_at.is_(None),
        )
    ) or 0
    return {"unread_count": total}


@router.get("/{id}/messages", response_model=List[MessageResponse])
async def get_messages(
    id: int,
    limit: int = Query(30, ge=1, le=100),
    before: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.get(Conversation, id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if current_user.id not in (conv.buyer_id, conv.seller_id):
        raise HTTPException(status_code=403, detail="You are not a participant in this conversation")

    query = (
        select(Message)
        .where(Message.conversation_id == id)
        .order_by(Message.created_at.desc())
        .limit(limit)
    )
    if before:
        query = query.where(Message.id < before)

    messages = db.execute(query).scalars().all()
    # Return chronological order
    return list(reversed(messages))


@router.post("/{id}/messages", response_model=MessageResponse)
async def send_message(
    id: int,
    payload: MessageCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.get(Conversation, id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if current_user.id not in (conv.buyer_id, conv.seller_id):
        raise HTTPException(status_code=403, detail="You are not a participant in this conversation")

    body_clean = payload.body.strip()
    if not body_clean:
        raise HTTPException(status_code=400, detail="Message body cannot be empty")
    if len(body_clean) > 1000:
        body_clean = body_clean[:1000]

    msg = Message(
        conversation_id=id,
        sender_id=current_user.id,
        body=body_clean,
        is_system=False,
    )
    conv.last_message_at = datetime.now(timezone.utc)
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # Broadcast via WS
    payload_out = {
        "type": "message",
        "conversation_id": id,
        "id": msg.id,
        "sender_id": current_user.id,
        "body": msg.body,
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
    }
    await manager.send_to_user(conv.buyer_id, payload_out)
    await manager.send_to_user(conv.seller_id, payload_out)

    return msg


@router.post("/wanted-reply/{wanted_id}", status_code=status.HTTP_201_CREATED)
async def reply_to_wanted(
    wanted_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Start a direct conversation in response to a 'Looking For' request.
    Uses the first listing of the replier's store as conversation anchor,
    or falls back to a dummy approach via a shared sentinel listing trick.
    Instead, we reuse the wanted request context by storing requester_id
    and replier as buyer/seller on any existing listing or creating a
    system message thread.
    """
    wanted = db.get(WantedRequest, wanted_id)
    if not wanted:
        raise HTTPException(status_code=404, detail="Wanted request not found")

    requester_id = wanted.requester_id
    if requester_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot reply to your own request")

    # Find or create a conversation between current_user (replier) and requester.
    # Since our Conversation model requires listing_id, we find ANY listing owned
    # by current_user's store to anchor the thread, or any listing the requester can see.
    # Simplest: find the replier's first active listing.
    from app.models.store import Store as StoreModel
    from sqlalchemy import desc

    replier_store = db.execute(
        select(Store).where(Store.owner_id == current_user.id)
    ).scalar_one_or_none()

    anchor_listing = None
    if replier_store:
        anchor_listing = db.execute(
            select(Listing)
            .where(Listing.store_id == replier_store.id, Listing.status == "active")
            .order_by(Listing.id.asc())
            .limit(1)
        ).scalar_one_or_none()

    if not anchor_listing:
        # Fall back: find any active listing in the marketplace
        anchor_listing = db.execute(
            select(Listing).where(Listing.status == "active").limit(1)
        ).scalar_one_or_none()

    if not anchor_listing:
        raise HTTPException(
            status_code=400,
            detail="No listings available to anchor this conversation. Post a listing first to reply.",
        )

    # buyer = requester (they want to buy), seller = current_user (has the item)
    conv = db.execute(
        select(Conversation).where(
            Conversation.listing_id == anchor_listing.id,
            Conversation.buyer_id == requester_id,
            Conversation.seller_id == current_user.id,
        )
    ).scalar_one_or_none()

    if not conv:
        conv = Conversation(
            listing_id=anchor_listing.id,
            buyer_id=requester_id,
            seller_id=current_user.id,
            last_message_at=datetime.now(timezone.utc),
        )
        db.add(conv)
        db.flush()

        # Auto-send an opening system message with context
        opening = Message(
            conversation_id=conv.id,
            sender_id=None,
            body=f'Reply to "Looking For" request: "{wanted.title}"',
            is_system=True,
        )
        db.add(opening)

    db.commit()
    db.refresh(conv)
    return {"id": conv.id}


@router.post("/{id}/read")
async def mark_conversation_read(    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.get(Conversation, id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if current_user.id not in (conv.buyer_id, conv.seller_id):
        raise HTTPException(status_code=403, detail="You are not a participant in this conversation")

    now = datetime.now(timezone.utc)
    messages = db.execute(
        select(Message).where(
            Message.conversation_id == id,
            Message.sender_id != current_user.id,
            Message.read_at.is_(None),
        )
    ).scalars().all()

    for m in messages:
        m.read_at = now

    db.commit()
    return {"message": "Marked as read"}
