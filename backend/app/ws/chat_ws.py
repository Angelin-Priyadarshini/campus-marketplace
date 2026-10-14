"""WebSocket chat endpoint."""
from __future__ import annotations
from datetime import datetime, timezone

from fastapi import WebSocket, WebSocketDisconnect, Query
from jose import JWTError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.conversation import Conversation, Message
from app.models.user import User
from app.security import decode_token
from app.ws.connection_manager import manager


async def chat_ws_endpoint(websocket: WebSocket, token: str = Query(...)):
    """
    WebSocket endpoint at /ws/chat?token=<access_token>
    Messages:
      {type: 'message', conversation_id: int, body: str}
      {type: 'read', conversation_id: int}
    """
    # Authenticate
    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub"))
        if payload.get("type") != "access":
            await websocket.close(code=4001)
            return
    except (JWTError, Exception):
        await websocket.close(code=4001)
        return

    db: Session = next(get_db())
    user = db.get(User, user_id)
    if not user or not user.is_active or not user.is_verified:
        db.close()
        await websocket.close(code=4001)
        return

    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "message":
                conv_id = data.get("conversation_id")
                body = (data.get("body") or "").strip()
                if not body or not conv_id:
                    continue
                conv = db.get(Conversation, conv_id)
                if not conv:
                    continue
                if user_id not in (conv.buyer_id, conv.seller_id):
                    continue
                if len(body) > 1000:
                    body = body[:1000]

                msg = Message(
                    conversation_id=conv_id,
                    sender_id=user_id,
                    body=body,
                    is_system=False,
                )
                db.add(msg)
                conv.last_message_at = datetime.now(timezone.utc)
                db.commit()
                db.refresh(msg)

                payload_out = {
                    "type": "message",
                    "conversation_id": conv_id,
                    "id": msg.id,
                    "sender_id": user_id,
                    "body": body,
                    "created_at": msg.created_at.isoformat() if msg.created_at else None,
                }
                await manager.send_to_user(conv.buyer_id, payload_out)
                await manager.send_to_user(conv.seller_id, payload_out)

            elif msg_type == "read":
                conv_id = data.get("conversation_id")
                if not conv_id:
                    continue
                conv = db.get(Conversation, conv_id)
                if not conv or user_id not in (conv.buyer_id, conv.seller_id):
                    continue
                now = datetime.now(timezone.utc)
                for msg in conv.messages:
                    if msg.sender_id != user_id and msg.read_at is None:
                        msg.read_at = now
                db.commit()
                await manager.send_to_user(
                    user_id,
                    {"type": "read_ack", "conversation_id": conv_id},
                )
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket, user_id)
        db.close()
