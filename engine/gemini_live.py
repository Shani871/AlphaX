import asyncio
import traceback
import sys
from google import genai
from google.genai import types
from engine.audio_io import AudioHardwareManager

class GeminiLiveBridge:
    def __init__(self, audio_manager: AudioHardwareManager):
        self.audio_manager = audio_manager
        self.client = genai.Client()
        self.live_model = "gemini-3.8-live"
        self.session = None

    async def connect_and_run(self):
        while True:
            try:
                config = types.LiveConnectConfig(
                    response_modalities=["AUDIO"],
                    system_instruction=types.Content(
                        parts=[types.Part.from_text(text=
                            "You are a real-time tactical co-pilot. Keep responses under 2 sentences. "
                            "When the user interrupts with a new command, immediately drop previous context, "
                            "acknowledge the correction in 3 words, and execute the new command."
                        )]
                    )
                )
                async with self.client.aio.live.connect(model=self.live_model, config=config) as session:
                    self.session = session
                    print("[LIVE CONNECTED] Gemini 3.8 Live Duplex Established")
                    
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
                        turns=[types.Content(
                            role="user", 
                            parts=[types.Part.from_text(text="[USER INTERRUPTED - FOCUS ON NEW AUDIO]")]
                        )],
                        turn_complete=False
                    )
                    await self.session.send(input=msg)
                except Exception as e:
                    # Fallback if text payload fails
                    await self.session.send_realtime_input(audio_stream_end=True)
            
            # Give it a tiny delay so we don't spam interrupts on noise
            await asyncio.sleep(0.3)
