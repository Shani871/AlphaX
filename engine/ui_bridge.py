import asyncio
import json
import websockets
from typing import Set
from google import genai

def json_serial(obj):
    if hasattr(obj, 'item'):
        return obj.item()
    if hasattr(obj, '__float__'):
        return float(obj)
    if hasattr(obj, '__int__'):
        return int(obj)
    return str(obj)

class UIBridge:
    def __init__(self):
        self.clients: Set[websockets.WebSocketServerProtocol] = set()
        self.audio_manager = None
        self._loop = None
        self.client = None

    def set_audio_manager(self, audio_manager):
        self.audio_manager = audio_manager

    async def translate_text(self, text: str, target_lang: str = "English") -> str:
        if not text.strip():
            return ""
        try:
            if not self.client:
                self.client = genai.Client()
            prompt = f"Translate the following speech or text accurately and naturally into {target_lang}. Return ONLY the direct translation text with no quotes, notes, or explanations:\n\n{text}"
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model="gemini-2.5-flash",
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            print(f"[UI Bridge Translation Error] {e}")
            return text

    async def register(self, websocket):
        # Only allow one active client to prevent double audio playback
        if self.clients:
            for old_ws in list(self.clients):
                await old_ws.close()
            self.clients.clear()
            
        self.clients.add(websocket)
        print(f"[UI BRIDGE] Client connected ({len(self.clients)} active)")
        try:
            async for message in websocket:
                data = json.loads(message)
                command = data.get("command")
                if command == "interrupt" and self.audio_manager:
                    self.audio_manager.abort_playback()
                    self.audio_manager.interruption_event.set()
                elif command == "send_text" and hasattr(self, 'text_callback') and self.text_callback:
                    await self.text_callback(data.get("text", ""))
                elif command == "ai_speaking_state" and self.audio_manager:
                    self.audio_manager.is_ai_speaking = data.get("state", False)
                elif command == "translate":
                    text = data.get("text", "")
                    target_lang = data.get("target_lang", "English")
                    if text:
                        translated = await self.translate_text(text, target_lang)
                        await self.broadcast_ui_event("translate_result", {
                            "original": text,
                            "translated": translated,
                            "target_lang": target_lang
                        })
                elif command == "toggle_mic":
                    pass
        except Exception:
            pass
        finally:
            self.clients.discard(websocket)
            print(f"[UI BRIDGE] Client disconnected ({len(self.clients)} active)")

    async def broadcast_ui_event(self, event_type: str, payload: dict):
        if not self.clients:
            return
        try:
            message = json.dumps({"event": event_type, **payload}, default=json_serial)
            websockets.broadcast(self.clients, message)
        except Exception as e:
            print(f"[UI Bridge Error] broadcast: {e}")

    def broadcast_ui_event_sync(self, event_type: str, payload: dict):
        if not self.clients or not self._loop:
            return
        try:
            message = json.dumps({"event": event_type, **payload}, default=json_serial)
            self._loop.call_soon_threadsafe(websockets.broadcast, self.clients, message)
        except Exception:
            pass

    async def start_server(self):
        self._loop = asyncio.get_running_loop()
        print("[UI BRIDGE] Starting WebSocket server on ws://127.0.0.1:8765")
        async with websockets.serve(self.register, "127.0.0.1", 8765):
            await asyncio.Future()  # run forever

ui_bridge = UIBridge()
