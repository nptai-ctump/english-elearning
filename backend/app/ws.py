from typing import Dict, Set
from fastapi import WebSocket

class WSManager:
    def __init__(self):
        self.active: Dict[str, Set[WebSocket]] = {}

    async def connect(self, username: str, ws: WebSocket):
        await ws.accept()
        self.active.setdefault(username, set()).add(ws)

    def disconnect(self, username: str, ws: WebSocket):
        if username in self.active:
            self.active[username].discard(ws)

    async def push(self, username: str, message: str):
        for ws in list(self.active.get(username, set())):
            try:
                await ws.send_text(message)
            except Exception:
                self.disconnect(username, ws)

ws_manager = WSManager()
