"""Notifications router."""
from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import MarkReadRequest, NotificationResponse

router = APIRouter()


@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notifications = db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()

    return [NotificationResponse.model_validate(n) for n in notifications]


@router.post("/read")
async def mark_notifications_read(
    payload: Optional[MarkReadRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = select(Notification).where(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    )
    if payload and payload.ids:
        query = query.where(Notification.id.in_(payload.ids))

    notifications = db.execute(query).scalars().all()
    for n in notifications:
        n.is_read = True

    db.commit()
    return {"message": "Notifications marked as read", "count": len(notifications)}
