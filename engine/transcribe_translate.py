import asyncio
from google import genai
from google.genai import types
from engine.audio_io import AudioHardwareManager

class TranscribeEngine:
    def __init__(self, audio_manager: AudioHardwareManager):
        self.audio_manager = audio_manager
        self.client = genai.Client()
        self.transcribe_model = "gemini-3.5-transcribe-live"
        
        self.config = types.LiveConnectConfig(
            response_modalities=["TEXT"],
            input_audio_transcription=types.AudioTranscriptionConfig(
                language_codes=[],
                custom_vocabulary=["flight vector", "coordinates", "medical status"],
            )
        )
        self.session = None

    async def connect_and_run(self):
        async with self.client.aio.live.connect(model=self.transcribe_model, config=self.config) as session:
            self.session = session
            print("Connected to Gemini Live Transcription.")
            
            send_task = asyncio.create_task(self._send_audio_loop())
            receive_task = asyncio.create_task(self._receive_text_loop())
            
            done, pending = await asyncio.wait(
                [send_task, receive_task],
                return_when=asyncio.FIRST_EXCEPTION
            )
            for task in pending:
                task.cancel()

    async def _send_audio_loop(self):
        while True:
            # Note: In a real scenario, audio_manager should support multi-consumer queues.
            # For this prototype, we'll assume the manager duplicates chunks or we handle it in main.
            # To avoid draining the main queue, we will rely on a dedicated callback or queue in main.
            # We'll just wait here for now and let main handle duplication.
            await asyncio.sleep(1)

    async def _receive_text_loop(self):
        while True:
            if not self.session:
                await asyncio.sleep(0.1)
                continue
                
            try:
                async for response in self.session.receive():
                    server_content = response.server_content
                    if server_content and server_content.input_transcription:
                        print(f"[Transcription] {server_content.input_transcription.text}")
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error in transcribe receive loop: {e}")
                break

    async def send_audio(self, chunk: bytes | None):
        if self.session:
            if chunk is None:
                await self.session.send_realtime_input(audio_stream_end=True)
                return
            await self.session.send_realtime_input(
                audio=types.Blob(data=chunk, mime_type="audio/pcm;rate=16000")
            )

class LiveTranslateEngine:
    def __init__(self, audio_manager: AudioHardwareManager):
        self.audio_manager = audio_manager
        self.client = genai.Client()
        self.translate_model = "gemini-3.5-live-translate-preview"
        
        self.config = types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            # The user requested these specific configs:
            # translation_config: types.TranslationConfig(target_language_code="es", echo_target_language=False)
            # input_audio_transcription: types.AudioTranscriptionConfig()
            # output_audio_transcription: types.AudioTranscriptionConfig()
            # We add them dynamically in case they aren't fully standard in the stub yet.
        )
        # Assuming types has these or we set them dynamically to match the prompt
        if hasattr(types, 'TranslationConfig'):
            self.config.translation_config = types.TranslationConfig(target_language_code="es", echo_target_language=False)
        if hasattr(types, 'AudioTranscriptionConfig'):
            self.config.input_audio_transcription = types.AudioTranscriptionConfig()
            self.config.output_audio_transcription = types.AudioTranscriptionConfig()

        self.session = None

    async def connect_and_run(self):
        async with self.client.aio.live.connect(model=self.translate_model, config=self.config) as session:
            self.session = session
            print("Connected to Gemini Live Translate (ES).")
            
            receive_task = asyncio.create_task(self._receive_loop())
            
            done, pending = await asyncio.wait(
                [receive_task],
                return_when=asyncio.FIRST_EXCEPTION
            )
            for task in pending:
                task.cancel()

    async def _receive_loop(self):
        # Optional file sink for translated audio
        try:
            with open("translated_output.pcm", "wb") as sink:
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
                                        # Output translated audio to sink
                                        sink.write(part.inline_data.data)
                                    if part.text:
                                        # Print translated text to terminal
                                        print(f"[Translate ES] {part.text}")
                    except asyncio.CancelledError:
                        break
                    except Exception as e:
                        print(f"Error in translate receive loop: {e}")
                        break
        except Exception as e:
            print(f"Failed to open sink: {e}")

    async def send_audio(self, chunk: bytes | None):
        if self.session:
            if chunk is None:
                await self.session.send_realtime_input(audio_stream_end=True)
                return
            await self.session.send_realtime_input(
                audio=types.Blob(data=chunk, mime_type="audio/pcm;rate=16000")
            )
