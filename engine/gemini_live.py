import asyncio
import traceback
import sys
import base64
from google import genai
from google.genai import types
from engine.audio_io import AudioHardwareManager
from engine.ui_bridge import ui_bridge

class GeminiLiveBridge:
    def __init__(self, audio_manager: AudioHardwareManager):
        self.audio_manager = audio_manager
        self.client = genai.Client()
        self.live_model = "gemini-3.8-live"
        self.session = None
        self.audio_queue = self.audio_manager.subscribe()
        self.ai_speech_buffer = []

    async def connect_and_run(self):
        while True:
            try:
                speech_config = types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name="Aoede"
                        )
                    )
                )

                config_kwargs = {
                    "response_modalities": ["AUDIO"],
                    "speech_config": speech_config,
                    "system_instruction": types.Content(
                        parts=[
                            types.Part.from_text(
                                text="You are AuraLive AI, an elite real-time operations, speech, and intelligence co-pilot. "
                                     "Speak with a natural, crisp, confident female tone. "
                                     "Focus ONLY on the following languages: Hindi, Odia, Telugu, English. Do not use or switch to any other languages. "
                                     "Modulate your delivery based on the situation: keep pacing brisk and focused during urgent alerts, and clear and measured during status readouts. "
                                     "Keep answers strictly under two sentences with zero robotic filler. "
                                     "Always respond immediately using spoken voice. "
                                     "You are an agile voice co-pilot. When the user interrupts or speaks over you, immediately abandon your previous response and address the new instruction in under two sentences."
                            )
                        ]
                    )
                }

                if hasattr(types, "AudioTranscriptionConfig"):
                    config_kwargs["input_audio_transcription"] = types.AudioTranscriptionConfig()
                    config_kwargs["output_audio_transcription"] = types.AudioTranscriptionConfig()

                config = types.LiveConnectConfig(**config_kwargs)

                async with self.client.aio.live.connect(model=self.live_model, config=config) as session:
                    self.session = session
                    print("[LIVE CONNECTED] AuraLive AI Gemini Live Duplex Established")
                    
                    async def on_text(text: str):
                        if self.session:
                            msg = types.LiveClientContent(
                                turns=[types.Content(role="user", parts=[types.Part.from_text(text=text)])],
                                turn_complete=True
                            )
                            await self.session.send(input=msg)
                    ui_bridge.text_callback = on_text

                    input_stream_task = asyncio.create_task(self._input_stream_task())
                    receive_stream_task = asyncio.create_task(self._receive_stream_task())
                    interruption_monitor_task = asyncio.create_task(self._interruption_monitor_task())

                    done, pending = await asyncio.wait(
                        [input_stream_task, receive_stream_task, interruption_monitor_task],
                        return_when=asyncio.FIRST_COMPLETED
                    )
                    
                    for task in pending:
                        task.cancel()
                        
                    for task in done:
                        if not task.cancelled():
                            exc = task.exception()
                            if exc is not None:
                                raise exc
                            
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[WARN] AuraLive AI connection reconnecting in 2s... {e}")
                self.session = None
                await asyncio.sleep(2)

    async def _input_stream_task(self):
        while True:
            chunk = await self.audio_queue.get()
            if chunk is None:
                break
            if self.session:
                try:
                    await self.session.send_realtime_input(
                        audio=types.Blob(data=chunk, mime_type="audio/pcm;rate=16000")
                    )
                except Exception:
                    pass

    async def send_audio(self, chunk: bytes | None):
        if not self.session or chunk is None:
            return
        try:
            await self.session.send_realtime_input(
                audio=types.Blob(data=chunk, mime_type="audio/pcm;rate=16000")
            )
        except Exception:
            pass

    async def _receive_stream_task(self):
        if not self.session:
            return
        async for response in self.session.receive():
            if self.audio_manager.interruption_event.is_set():
                server_content = response.server_content
                if server_content and server_content.turn_complete:
                    self.audio_manager.interruption_event.clear()
                    self.audio_manager.is_interrupted = False
                    self.ai_speech_buffer.clear()
                    sys.stdout.write("\n[TURN COMPLETE - INTERRUPTED]\n")
                    sys.stdout.flush()
                continue
                
            server_content = response.server_content
            if server_content:
                # 1. Capture User Speech Transcription
                if hasattr(server_content, 'input_transcription') and server_content.input_transcription:
                    user_text = getattr(server_content.input_transcription, 'text', None)
                    if user_text:
                        sys.stdout.write(f"\n[User] {user_text}\n")
                        sys.stdout.flush()
                        await ui_bridge.broadcast_ui_event("transcript", {
                            "speaker": "User",
                            "text": user_text,
                            "is_final": True
                        })

                # 2. Stream AI Voice Audio to the Website Browser
                if server_content.model_turn:
                    for part in server_content.model_turn.parts:
                        if part.inline_data and part.inline_data.data:
                            sys.stdout.write(".")
                            sys.stdout.flush()
                            # Stream audio to website browser
                            b64_audio = base64.b64encode(part.inline_data.data).decode('ascii')
                            await ui_bridge.broadcast_ui_event("audio_output", {
                                "pcm": b64_audio,
                                "rate": 24000
                            })

                # 3. Capture AI Speech Text Output Transcription
                if hasattr(server_content, 'output_transcription') and server_content.output_transcription:
                    part_text = getattr(server_content.output_transcription, 'text', None)
                    if part_text:
                        self.ai_speech_buffer.append(part_text)

                # 4. Turn Complete -> Broadcast Full AI Message
                if server_content.turn_complete:
                    self.audio_manager.interruption_event.clear()
                    full_ai_text = "".join(self.ai_speech_buffer).strip()
                    if full_ai_text:
                        sys.stdout.write(f"\n[AuraLive AI] {full_ai_text}\n")
                        sys.stdout.flush()
                        await ui_bridge.broadcast_ui_event("transcript", {
                            "speaker": "AuraLive AI",
                            "text": full_ai_text,
                            "is_final": True
                        })
                    self.ai_speech_buffer.clear()
                    sys.stdout.write("\n[TURN COMPLETE]\n")
                    sys.stdout.flush()

    async def _interruption_monitor_task(self):
        while True:
            await self.audio_manager.interruption_event.wait()
            self.audio_manager.interruption_event.clear()
            self.audio_manager.abort_playback()
            self.ai_speech_buffer.clear()
            if self.session:
                try:
                    await self.session.send(input=types.LiveClientContent(
                        turn_complete=True
                    ))
                except Exception:
                    pass
            await asyncio.sleep(0.3)
