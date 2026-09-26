import asyncio
from google import genai
from google.genai import types
from engine.audio_io import AudioHardwareManager

class GeminiLiveBridge:
    def __init__(self, audio_manager: AudioHardwareManager):
        self.audio_manager = audio_manager
        self.client = genai.Client()
        self.live_model = "gemini-3.8-live"
        self.tts_model = "gemini-3.8-flash-tts"
        
        self.config = types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            system_instruction=types.Content(
                parts=[types.Part.from_text(
                    "You are an instantaneous tactical dispatch co-pilot. Keep responses extremely brief, precise, and highly actionable."
                )]
            ),
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name="Puck"
                    )
                )
            )
        )
        self.session = None
        self._receive_task = None
        self._send_task = None

    async def connect_and_run(self):
        async with self.client.aio.live.connect(model=self.live_model, config=self.config) as session:
            self.session = session
            print("Connected to Gemini Live.")
            
            # Start concurrent send and receive loops
            self._send_task = asyncio.create_task(self._send_audio_loop())
            self._receive_task = asyncio.create_task(self._receive_audio_loop())
            
            # Start interruption listener
            interruption_task = asyncio.create_task(self._interruption_listener())

            done, pending = await asyncio.wait(
                [self._send_task, self._receive_task, interruption_task],
                return_when=asyncio.FIRST_EXCEPTION
            )
            
            for task in pending:
                task.cancel()

    async def _send_audio_loop(self):
        while True:
            chunk = await self.audio_manager.get_audio_chunk()
            if self.session:
                await self.session.send_realtime_input(
                    [types.Part.from_bytes(data=chunk, mime_type="audio/pcm;rate=16000")]
                )

    async def _receive_audio_loop(self):
        while True:
            if not self.session:
                await asyncio.sleep(0.1)
                continue
                
            try:
                async for response in self.session.receive():
                    server_content = response.server_content
                    if server_content and server_content.model_turn:
                        for part in server_content.model_turn.parts:
                            if part.inline_data:
                                audio_data = part.inline_data.data
                                await self.audio_manager.play_audio_chunk(audio_data)
                    
                    if server_content and server_content.interrupted:
                        # Server acknowledged our interruption
                        pass
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error in receive loop: {e}")
                break

    async def _interruption_listener(self):
        while True:
            await self.audio_manager.interrupt_event.wait()
            # Send interruption signal to Gemini Live
            if self.session:
                # To interrupt, send an empty client_content
                await self.session.send_input(
                    client_content=types.ClientContent(
                        turns=[types.Content(parts=[types.Part.from_text("")])]
                    )
                )
            # Reset event so it can trigger again later
            self.audio_manager.reset_interrupt()
            await asyncio.sleep(0.1)

    async def synthesize_priority_alert(self, text: str):
        """
        Synthesizes an urgent system notice directly to 24kHz PCM using gemini-3.8-flash-tts.
        Plays the audio immediately through the AudioHardwareManager.
        """
        print(f"Synthesizing alert: {text}")
        response = await self.client.aio.models.generate_content(
            model=self.tts_model,
            contents=[types.Content(parts=[types.Part.from_text(text)])],
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name="Aoede"
                        )
                    )
                )
            )
        )
        
        # Stream or play the resulting audio directly
        for candidate in response.candidates:
            if candidate.content and candidate.content.parts:
                for part in candidate.content.parts:
                    if part.inline_data:
                        audio_data = part.inline_data.data
                        # The audio returned should match the output sampling rate (24kHz)
                        await self.audio_manager.play_audio_chunk(audio_data)
