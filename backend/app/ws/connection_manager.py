"""WebSocket connection manager."""
from __future__ import annotations
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # user_id -> set of WebSocket connections
        self.active_connections: dict[int, set] = {}

    async def connect(self, websocket: WebSocket, user_id: int) -> None:
        await websocket.accept()
        self.active_connections.setdefault(user_id, set()).add(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int) -> None:
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_to_user(self, user_id: int, data: dict) -> None:
        for ws in list(self.active_connections.get(user_id, set())):
            try:
                await ws.send_json(data)
            except Exception:
                self.active_connections.get(user_id, set()).discard(ws)


manager = ConnectionManager()
