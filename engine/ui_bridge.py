import asyncio
import json
import websockets
from typing import Set

class UIBridge:
    def __init__(self):
        self.clients: Set[websockets.WebSocketServerProtocol] = set()
        self.audio_manager = None
        self._loop = None

    def set_audio_manager(self, audio_manager):
        self.audio_manager = audio_manager

    async def register(self, websocket):
        self.clients.add(websocket)
        try:
            async for message in websocket:
                data = json.loads(message)
                command = data.get("command")
                if command == "interrupt" and self.audio_manager:
                    self.audio_manager.abort_playback()
                    self.audio_manager.interruption_event.set()
                elif command == "send_text" and hasattr(self, 'text_callback') and self.text_callback:
                    await self.text_callback(data.get("text", ""))
                elif command == "toggle_mic":
                    # optional toggle handling
                    pass
        except Exception:
            pass
        finally:
            self.clients.remove(websocket)

    async def broadcast_ui_event(self, event_type: str, payload: dict):
        if not self.clients:
            return
        message = json.dumps({"event": event_type, **payload})
        if self._loop:
            websockets.broadcast(self.clients, message)
        else:
            websockets.broadcast(self.clients, message)

    def broadcast_ui_event_sync(self, event_type: str, payload: dict):
        if not self.clients or not self._loop:
            return
        message = json.dumps({"event": event_type, **payload})
        self._loop.call_soon_threadsafe(websockets.broadcast, self.clients, message)

    async def start_server(self):
        self._loop = asyncio.get_running_loop()
        print("[UI BRIDGE] Starting WebSocket server on ws://127.0.0.1:8765")
        async with websockets.serve(self.register, "127.0.0.1", 8765):
            await asyncio.Future()  # run forever

ui_bridge = UIBridge()
