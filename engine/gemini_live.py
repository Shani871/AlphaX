import asyncio
import traceback
import sys
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

                config = types.LiveConnectConfig(
                    response_modalities=["AUDIO"],
                    speech_config=speech_config,
                    system_instruction=types.Content(
                        parts=[
                            types.Part.from_text(
                                text="You are AURALIVE, an elite real-time operations co-pilot. "
                                     "Speak with a natural, crisp, confident female tone. "
                                     "Focus ONLY on the following languages: Hindi, Odia, Telugu, English. Do not use or switch to any other languages. "
                                     "Modulate your delivery based on the situation: keep pacing brisk and focused during urgent alerts, and clear and measured during status readouts. "
                                     "Keep answers strictly under two sentences with zero robotic filler. "
                                     "Always respond immediately using spoken voice. "
                                     "You are an agile voice co-pilot. When the user interrupts or speaks over you, immediately abandon your previous response and address the new instruction in under two sentences."
                            )
                        ]
                    )
                )
                async with self.client.aio.live.connect(model=self.live_model, config=config) as session:
                    self.session = session
                    print("[LIVE CONNECTED] Gemini 3.8 Live Duplex Established")
                    
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
                        if task.exception():
                            raise task.exception()
                            
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[WARN] Connection dropped, reconnecting in 2s... {e}")
                self.session = None
                await asyncio.sleep(2)

    async def _input_stream_task(self):
        while True:
            chunk = await self.audio_manager.audio_queue.get()
            if chunk is None:
                if self.session:
                    await self.session.send_realtime_input(audio_stream_end=True)
                break
            if self.session:
                await self.session.send_realtime_input(
                    audio=types.Blob(data=chunk, mime_type="audio/pcm;rate=16000")
                )

    async def send_audio(self, chunk: bytes | None):
        # Fallback method if external files call it
        if not self.session:
            return
        if chunk is None:
            await self.session.send_realtime_input(audio_stream_end=True)
            return
        await self.session.send_realtime_input(
            audio=types.Blob(data=chunk, mime_type="audio/pcm;rate=16000")
        )

    async def _receive_stream_task(self):
        if not self.session:
            return
        async for response in self.session.receive():
            if self.audio_manager.interruption_event.is_set():
                # discard incoming chunks until the server finishes the old turn
                server_content = response.server_content
                if server_content and server_content.turn_complete:
                    self.audio_manager.interruption_event.clear()
                    self.audio_manager.is_interrupted = False
                    sys.stdout.write("\n[TURN COMPLETE]\n")
                    sys.stdout.flush()
                continue
                
            server_content = response.server_content
            if server_content:
                if server_content.model_turn:
                    for part in server_content.model_turn.parts:
                        if part.inline_data and part.inline_data.data:
                            sys.stdout.write(".")
                            sys.stdout.flush()
                            await self.audio_manager.play_audio_chunk(part.inline_data.data)
                        
                        if part.text:
                            await ui_bridge.broadcast_ui_event("transcript", {
                                "speaker": "Friday",
                                "text": part.text,
                                "is_final": False
                            })
                            
                if server_content.turn_complete:
                    self.audio_manager.interruption_event.clear()
                    sys.stdout.write("\n[TURN COMPLETE]\n")
                    sys.stdout.flush()

    async def _interruption_monitor_task(self):
        while True:
            await self.audio_manager.interruption_event.wait()
            self.audio_manager.abort_playback()
            if self.session:
                try:
                    msg = types.LiveClientContent(
                        turn_complete=False
                    )
                    await self.session.send(input=msg)
                except Exception as e:
                    # Fallback if text payload fails
                    await self.session.send_realtime_input(audio_stream_end=True)
            
            # Give it a tiny delay so we don't spam interrupts on noise
            await asyncio.sleep(0.3)
